'use client';
import { useState } from 'react';
import { GATES } from '../lib/data';

const ICON = { done: '✓', active: '●', blocked: '!', pending: '', reverted: '↺' };
const WORD = { done: 'Done', active: 'In progress', blocked: 'Stuck', pending: 'Not yet', reverted: 'Reverted' };

function detail(f, step) {
  const gate = GATES.find((g) => g.key === step.key);
  const base = {
    reported: 'Reported on Ziki.',
    fixed: `${f.agent} wrote the fix.`,
    pr: 'Pull request opened by the agent. Ziki follows it, so you do not need GitHub.',
    checks: 'Build, lint and tests run on the pull request.',
    verdicts: 'Two independent reviewers, not owned by you, must agree the fix works.',
    decision: 'By your instructions the agent merges by itself, and asks you first for a redesign.',
  }[step.key];
  const text = base || (gate ? `${gate.label} is held by the ${gate.holder.toLowerCase()}.` : '');
  const ev = f.events.find((e) => step.status === 'reverted' ? /revert|no reason/i.test(e[1]) : false);
  const extra = {
    active: 'In progress now.',
    blocked: `Stuck. ${f.holder}.`,
    pending: 'Not started yet.',
    reverted: ev ? ev[1] : 'Reverted.',
    done: '',
  }[step.status];
  return `${text} ${extra}`.trim();
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
            <span className="tl-status">{WORD[s.status]} <span aria-hidden="true">{open === s.key ? '▾' : '▸'}</span></span>
          </button>
          {open === s.key && (
            <div className="tl-detail">
              <p>{detail(fix, s)}</p>
              {s.status === 'blocked' && <button className="btn primary" onClick={() => dispatch({ type: 'unstick', id: fix.id })}>Ask another independent reviewer</button>}
              {s.status === 'reverted' && <button className="btn primary" onClick={() => onReason(fix)}>Tell the agent why</button>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
