'use client';
import { createContext, useContext, useMemo, useReducer } from 'react';
import { INITIAL_FIXES, INITIAL_RULES, INITIAL_FEED, INITIAL_INSTRUCTIONS } from './data';
import { talk } from './agentTalk';

const Ctx = createContext(null);

const setStep = (steps, key, status) => steps.map((s) => (s.key === key ? { ...s, status } : s));
const post = (state, u) => ({ ...state, feed: [{ id: 'u' + Math.random().toString(36).slice(2), time: 'Now', ...u }, ...state.feed] });
const lastDone = (steps) => [...steps].reverse().find((s) => s.status === 'done');

function baseReducer(state, a) {
  const upd = (id, fn) => ({ ...state, fixes: state.fixes.map((f) => (f.id === id ? fn(f) : f)) });
  switch (a.type) {
    case 'approve':
      return upd(a.id, (f) => ({
        ...f,
        state: 'moving',
        needs: undefined,
        holder: 'Release agent',
        since: 'just now',
        steps: setStep(setStep(f.steps, 'decision', 'done'), 'central', 'active'),
        events: [...f.events, ['Now', 'You approved the merge. Moving to central staging.']],
      }));
    case 'stop':
      return upd(a.id, (f) => ({
        ...f,
        state: 'stopped',
        needs: undefined,
        holder: 'Stopped by you',
        since: 'just now',
        events: [...f.events, ['Now', 'You stopped this fix. The agent will be told why.']],
      }));
    case 'unstick':
      return upd(a.id, (f) => ({
        ...f,
        state: 'moving',
        needs: undefined,
        holder: 'New independent reviewer assigned',
        since: 'just now',
        steps: setStep(f.steps, 'verdicts', 'active'),
        events: [...f.events, ['Now', 'Asked a new independent reviewer (not owned by you). Expected within 30 min.']],
      }));
    case 'rollback': {
      const target = lastDone(state.fixes.find((f) => f.id === a.id).steps);
      return {
        ...upd(a.id, (f) => ({
          ...f,
          state: 'rolled-back',
          needs: undefined,
          holder: 'Rolled back',
          since: 'just now',
          steps: setStep(f.steps, target.key, 'reverted'),
          events: [...f.events, ['Now', `Rolled back by you. Reason: ${a.reason}`]],
        })),
        rules: [{ id: 'r' + Date.now(), text: a.rule, source: `Rolled back: fix #${state.fixes.find((f) => f.id === a.id).number}` }, ...state.rules],
      };
    }
    case 'resubmit':
      return {
        ...upd(a.id, (f) => ({
          ...f,
          state: 'moving',
          needs: undefined,
          holder: 'Agent splitting it into smaller batches',
          since: 'just now',
          steps: f.steps.map((s) => (s.status === 'reverted' ? { ...s, status: 'pending' } : s.key === 'central' ? { ...s, status: 'active' } : s)),
          events: [...f.events, ['Now', `Reason recorded: ${a.reason}. Resubmitting in smaller batches.`]],
        })),
        rules: [{ id: 'r' + Date.now(), text: a.rule, source: `Rolled back: fix #${state.fixes.find((f) => f.id === a.id).number}` }, ...state.rules],
      };
    case 'reset':
      return { fixes: INITIAL_FIXES, rules: INITIAL_RULES, feed: INITIAL_FEED, instructions: INITIAL_INSTRUCTIONS };
    case 'addInstruction':
      return { ...state, instructions: [...state.instructions, { id: 'i' + Date.now(), text: a.text }] };
    case 'removeInstruction':
      return { ...state, instructions: state.instructions.filter((i) => i.id !== a.id) };
    default:
      return state;
  }
}

function reducer(state, a) {
  if (a.type === 'talk') {
    const r = talk(a.text, state.fixes);
    let st = post(state, { kind: 'you', agent: 'You', text: a.text });
    if (r.rule) st = { ...st, instructions: [...st.instructions, { id: 'i' + Date.now(), text: r.rule }] };
    return post(st, { kind: 'agent', agent: 'My agents', text: r.say });
  }
  const next = baseReducer(state, a);
  const f = state.fixes.find((x) => x.id === a.id);
  const n = f ? `#${f.number}` : '';
  switch (a.type) {
    case 'approve':
      return post(next, { kind: 'moved', fixId: a.id, agent: f.agent, text: `Thanks. ${n} is merged and moving to central staging.` });
    case 'stop':
      return post(next, { kind: 'you', fixId: a.id, agent: f.agent, text: `Understood. I have stopped ${n}. Tell me if you want me to try a different approach.` });
    case 'unstick':
      return post(next, { kind: 'moved', fixId: a.id, agent: f.agent, text: `I asked a new independent reviewer for ${n}. I expect a verdict within 30 minutes and will tell you.` });
    case 'rollback':
      return post(next, { kind: 'reverted', fixId: a.id, agent: f.agent, text: `${n} is rolled back. I saved your reason as a rule so I do not repeat it.` });
    case 'resubmit':
      return post(next, { kind: 'moved', fixId: a.id, agent: f.agent, text: `Thank you for the reason. I saved a rule and I am sending ${n} again in smaller batches.` });
    case 'reply':
      return post(next, { kind: 'you', fixId: a.id, agent: f.agent, text: `You told me: "${a.text}". I will act on it and report back here.` });
    default:
      return next;
  }
}

export function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, { fixes: INITIAL_FIXES, rules: INITIAL_RULES, feed: INITIAL_FEED, instructions: INITIAL_INSTRUCTIONS });
  const value = useMemo(() => ({ ...state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
