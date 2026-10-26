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
    case 'nudge':
      return upd(a.id, (f) => ({ ...f, state: 'moving', needs: undefined, holder: 'Maintainer messaged by the agent', since: 'just now', events: [...f.events, ['Now', a.escalate ? 'Escalated to the project lead, with the full history.' : 'Messaged the central staging maintainer, with a link to this fix.']] }));
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
      const cur = state.fixes.find((f) => f.id === a.id).steps;
      const target = cur.find((x) => x.status === 'active' && ['central', 'staging', 'production'].includes(x.key)) || lastDone(cur);
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
        rules: [{ id: 'r' + Date.now(), text: a.rule, source: `From revert of fix #${state.fixes.find((f) => f.id === a.id).number}` }, ...state.rules],
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
        rules: [{ id: 'r' + Date.now(), text: a.rule, source: `From revert of fix #${state.fixes.find((f) => f.id === a.id).number}` }, ...state.rules],
      };
    case 'reset':
      return { fixes: INITIAL_FIXES, rules: INITIAL_RULES, feed: INITIAL_FEED, instructions: INITIAL_INSTRUCTIONS };
    case 'setProposed':
      return { ...state, proposed: a.value };
    case 'addInstruction':
      return { ...state, instructions: [...state.instructions, { id: 'i' + Date.now(), text: a.text }] };
    case 'removeInstruction':
      return { ...state, instructions: state.instructions.filter((i) => i.id !== a.id) };
    default:
      return state;
  }
}

function reducer(state, a) {
  if (a.type === 'closeIssue') {
    return post({ ...state, closed: { ...state.closed, [a.number]: true } }, { kind: 'done', agent: 'My agent', text: `I closed #${a.number} as already fixed, after checking it against the live site. The agents will not spend time on it.` });
  }
  if (a.type === 'keepOpen') {
    return post(state, { kind: 'you', agent: 'You', text: `You kept #${a.number} open. I will check it again and tell you what I find.` });
  }
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
    case 'nudge':
      return post(next, { kind: 'moved', fixId: a.id, agent: f.agent, text: a.escalate ? `I escalated ${n} to the project lead and sent the history. I will tell you the answer here.` : `I messaged the central staging maintainer about ${n}. I will tell you as soon as they reply.` });
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
  const [state, dispatch] = useReducer(reducer, { fixes: INITIAL_FIXES, rules: INITIAL_RULES, feed: INITIAL_FEED, instructions: INITIAL_INSTRUCTIONS, proposed: true, closed: {} });
  const value = useMemo(() => ({ ...state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
