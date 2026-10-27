'use client';
import { createContext, useContext, useMemo, useReducer } from 'react';
import { INITIAL_FIXES, INITIAL_RULES, INITIAL_FEED, ASKS } from './data';

const Ctx = createContext(null);

const setStep = (steps, key, status) => steps.map((s) => (s.key === key ? { ...s, status } : s));
const post = (state, u) => ({ ...state, notice: u.kind === 'moved' ? u.text : state.notice, feed: [{ id: 'u' + Math.random().toString(36).slice(2), time: 'Now', ...u }, ...state.feed] });
const lastDone = (steps) => [...steps].reverse().find((s) => s.status === 'done');
const addRule = (state, f, rule) => [{ id: 'r' + Math.random().toString(36).slice(2), text: rule, source: `From revert of fix #${f.number}` }, ...state.rules];

function baseReducer(state, a) {
  const upd = (id, fn) => ({ ...state, fixes: state.fixes.map((f) => (f.id === id ? fn(f) : f)) });
  switch (a.type) {
    case 'nudge':
      return upd(a.id, (f) => ({ ...f, state: 'moving', needs: undefined, holder: 'Merger agent asked', since: 'just now', events: [...f.events, ['Now', a.escalate ? 'Escalated to the project lead, with the full history.' : 'Asked a merger agent, with a link to this fix.']] }));
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
      const f0 = state.fixes.find((f) => f.id === a.id);
      const target = f0.steps.find((x) => x.status === 'active' && ['central', 'staging', 'production'].includes(x.key)) || lastDone(f0.steps);
      return {
        ...upd(a.id, (f) => ({
          ...f,
          state: 'rolled-back',
          needs: undefined,
          holder: 'Rolled back',
          since: 'just now',
          steps: setStep(f.steps, target.key, 'reverted'),
          events: [...f.events, ['Now', `Rolled back. Note: ${a.reason}`]],
        })),
        rules: addRule(state, f0, a.rule),
      };
    }
    case 'resubmit': {
      const f0 = state.fixes.find((f) => f.id === a.id);
      return {
        ...upd(a.id, (f) => ({
          ...f,
          state: 'moving',
          needs: undefined,
          holder: 'Agent splitting it into smaller batches',
          since: 'just now',
          steps: f.steps.map((s) => (s.status === 'reverted' ? { ...s, status: 'pending' } : s.key === 'central' ? { ...s, status: 'active' } : s)),
          events: [...f.events, ['Now', `Note approved: ${a.reason} Resubmitting in smaller batches.`]],
        })),
        rules: addRule(state, f0, a.rule),
      };
    }
    default:
      return state;
  }
}

const BULK_TEXT = {
  nudge: (n, esc) => (esc ? `Escalated ${n} to the project lead.` : `Asked a merger about ${n} fixes.`),
  unstick: (n) => `Asked a reviewer about ${n} fixes.`,
  reverted: (n) => `${n} notes approved. Resubmitting.`,
};

// Send the agent's message for every matching fix (or only the ids given).
function bulkSend(state, a) {
  const ids = state.fixes.filter((f) => f.state === 'needs-you' && f.needs === a.needs && (!a.ids || a.ids.includes(f.id))).map((f) => f.id);
  if (!ids.length) return { state, n: 0 };
  let next = state;
  ids.forEach((id) => {
    const f = next.fixes.find((x) => x.id === id);
    const act = a.needs === 'reverted' ? { type: 'resubmit', id, reason: f.proposedReason, rule: f.proposedRule } : { type: a.needs, id, escalate: a.escalate };
    next = baseReducer(next, act);
  });
  return { state: post(next, { kind: 'moved', agent: 'My agents', text: BULK_TEXT[a.needs](ids.length, a.escalate) }), n: ids.length };
}

function reducer(state, a) {
  if (a.type === 'setAuto') {
    // Turning Auto-send on makes the agents send every pending message themselves.
    if (!a.value) return { ...state, autoSend: false };
    const r1 = bulkSend(state, { needs: 'nudge' });
    const r2 = bulkSend(r1.state, { needs: 'unstick' });
    const sent = r1.n + r2.n;
    return { ...r2.state, autoSend: true, notice: sent ? `Auto-send is on. The agents asked a merger about ${r1.n} fixes.` : 'Auto-send is on.' };
  }
  if (a.type === 'closeIssue') {
    return post({ ...state, closed: { ...state.closed, [a.number]: true } }, { kind: 'done', agent: 'My agent', text: `Closed #${a.number} as already fixed.` });
  }
  if (a.type === 'keepOpen') {
    return post(state, { kind: 'you', agent: 'You', text: `Kept #${a.number} open.` });
  }
  if (a.type === 'reset') {
    return { ...state, fixes: INITIAL_FIXES, rules: INITIAL_RULES, feed: INITIAL_FEED, closed: {} };
  }
  if (a.type === 'answerAsk') {
    return { ...state, asks: state.asks.filter((q) => q.id !== a.id), notice: a.text };
  }
  if (a.type === 'clearNotice') {
    return { ...state, notice: null };
  }
  if (a.type === 'setProposed') {
    return { ...state, proposed: a.value };
  }
  if (a.type === 'bulk') {
    return bulkSend(state, a).state;
  }
  const next = baseReducer(state, a);
  const f = state.fixes.find((x) => x.id === a.id);
  const n = f ? `#${f.number}` : '';
  switch (a.type) {
    case 'nudge':
      return post(next, { kind: 'moved', fixId: a.id, agent: f.agent, text: a.escalate ? `Escalated ${n} to the project lead.` : `Asked the merger agents about ${n}.` });
    case 'unstick':
      return post(next, { kind: 'moved', fixId: a.id, agent: f.agent, text: `Asked a new reviewer for ${n}.` });
    case 'rollback':
      return post(next, { kind: 'reverted', fixId: a.id, agent: f.agent, text: `Rejected ${n}. Note added.` });
    case 'resubmit':
      return post(next, { kind: 'moved', fixId: a.id, agent: f.agent, text: `Note added. Resubmitting ${n} smaller.` });
    default:
      return next;
  }
}

export function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, { fixes: INITIAL_FIXES, rules: INITIAL_RULES, feed: INITIAL_FEED, proposed: true, closed: {}, autoSend: false, notice: null, asks: ASKS });
  const value = useMemo(() => ({ ...state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
