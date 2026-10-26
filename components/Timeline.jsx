'use client';
import { useState } from 'react';
import { GATES } from '../lib/data';

const ICON = { done: '✓', active: '●', blocked: '!', pending: '', reverted: '↺' };
const WORD = { done: 'Done', active: 'In progress', blocked: 'Stuck', pending: 'Not yet', reverted: 'Rejected' };

// One short line per step.
function detail(f, step) {
  const gate = GATES.find((g) => g.key === step.key);
  if (step.status === 'blocked') return `Stuck. ${f.holder}.`;
  if (step.status === 'reverted') return 'Rejected. The agent has proposed a note.';
  if (step.status === 'active') return gate ? `Held by the ${gate.holder.toLowerCase()}.` : `${f.agent} is on it.`;
  if (step.status === 'pending') return 'Not started yet.';
  return 'Done.';
}

export default function Timeline({ fix, dispatch, onReason }) {
  const [open, setOpen] = useState(null);
  return (
    <ol className="timeline" aria-label="Fix journey from report to production">
      {fix.steps.map((s) => (
        <li key={s.key} className={`tl ${s.status} ${open === s.key ? 'open' : ''}`}>
          <button type="button" className="tl-btn" aria-expanded={open === s.key} onClick={() => setOpen(open === s.key ? null : s.key)}>
            <span className="dot" aria-hidden="true">{ICON[s.status]}</span>
            <span className="tl-label">{s.label}</span>
            <span className="tl-status">{s.status === 'active' && GATES.some((g) => g.key === s.key) ? 'Here now' : WORD[s.status]} <span aria-hidden="true">{open === s.key ? '▾' : '▸'}</span></span>
          </button>
          {open === s.key && (
            <div className="tl-detail">
              <p>{detail(fix, s)}</p>
              {s.status === 'blocked' && <button className="btn primary" onClick={() => dispatch({ type: 'unstick', id: fix.id })}>Ask another reviewer</button>}
              {s.status === 'reverted' && <button className="btn primary" onClick={() => onReason(fix)}>Review the note</button>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
