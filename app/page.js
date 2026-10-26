'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '../lib/store';
import ReasonModal from '../components/ReasonModal';

const KIND = {
  done: ['Done', 'k-done'],
  moved: ['Moved on', 'k-moved'],
  waiting: ['Waiting', 'k-waiting'],
  reverted: ['Reverted', 'k-reverted'],
  live: ['Live', 'k-live'],
  you: ['You', 'k-you'],
  agent: ['Agent', 'k-moved'],
};

function Ask({ f, dispatch, onReason }) {
  const [text, setText] = useState('');
  return (
    <li className="card attention">
      <div className="row between wrap-s">
        <span className="agent">{f.agent} asks</span>
        <span className="muted small">{f.since}</span>
      </div>
      <p className="says">&ldquo;{f.agentSays}&rdquo;</p>
      <p className="muted small">
        <Link href={`/fix/${f.id}`}>#{f.number} {f.title}</Link>
      </p>
      <div className="row gap actions">
        {f.needs === 'approve' && (
          <>
            <button className="btn primary" onClick={() => dispatch({ type: 'approve', id: f.id })}>Go ahead</button>
            <button className="btn ghost" onClick={() => dispatch({ type: 'stop', id: f.id })}>Not like this</button>
          </>
        )}
        {f.needs === 'unstick' && <button className="btn primary" onClick={() => dispatch({ type: 'unstick', id: f.id })}>Yes, ask someone else</button>}
        {f.needs === 'reverted' && <button className="btn primary" onClick={() => onReason(f)}>Tell the agent why</button>}
      </div>
      <form
        className="reply"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          dispatch({ type: 'reply', id: f.id, text: text.trim() });
          setText('');
        }}
      >
        <label className="sr" htmlFor={`r-${f.id}`}>Reply to {f.agent}</label>
        <input id={`r-${f.id}`} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Or tell ${f.agent} something in your own words`} />
        <button className="btn ghost" type="submit" disabled={!text.trim()}>Send</button>
      </form>
    </li>
  );
}

function Talk({ dispatch }) {
  const [text, setText] = useState('');
  return (
    <form
      className="talk"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        dispatch({ type: 'talk', text: text.trim() });
        setText('');
      }}
    >
      <label htmlFor="talk" className="talk-label">Talk to my agents</label>
      <div className="reply">
        <input id="talk" value={text} onChange={(e) => setText(e.target.value)} placeholder='Ask what happened, ask for more work, or tell them how to work, for example "tell me about every revert"' />
        <button className="btn primary" type="submit" disabled={!text.trim()}>Send</button>
      </div>
    </form>
  );
}

export default function Home() {
  const { fixes, feed, instructions, dispatch } = useStore();
  const [modal, setModal] = useState(null);
  const needs = fixes.filter((f) => f.state === 'needs-you');
  const moving = fixes.filter((f) => f.state === 'moving').length;
  const live = fixes.filter((f) => f.state === 'live').length;
  const reverted = fixes.filter((f) => f.steps.some((s) => s.status === 'reverted')).length;
  const byId = Object.fromEntries(fixes.map((f) => [f.id, f]));

  return (
    <>
      <h1>What my agents are doing</h1>
      <p className="lead">
        Everything my agents do, from the fix to production, shows up here. I never go to GitHub to find out.
      </p>

      <ul className="stats" aria-label="Summary">
        <li><strong>{moving}</strong><span>moving on their own</span></li>
        <li><strong>{live}</strong><span>live</span></li>
        <li><strong>{reverted}</strong><span>reverted</span></li>
        <li className={needs.length ? 'hot' : ''}><strong>{needs.length}</strong><span>{needs.length === 1 ? 'needs' : 'need'} my answer</span></li>
      </ul>

      <Talk dispatch={dispatch} />
      <p className="muted small mine">
        <strong>My instructions:</strong> {instructions.map((i) => i.text).join(' ')} <Link href="/rules">Change</Link>
      </p>

      {needs.length > 0 && (
        <section aria-labelledby="asks">
          <h2 id="asks">My agents are asking me ({needs.length})</h2>
          <p className="muted small tight-p">Only what an agent cannot decide alone. Everything else, it just does and tells me.</p>
          <ul className="cards">
            {needs.map((f) => <Ask key={f.id} f={f} dispatch={dispatch} onReason={setModal} />)}
          </ul>
        </section>
      )}

      <section aria-labelledby="updates">
        <h2 id="updates">Updates from my agents</h2>
        <ul className="feed">
          {feed.map((u) => {
            const [label, cls] = KIND[u.kind] || KIND.done;
            const fix = byId[u.fixId];
            return (
              <li key={u.id} className="update">
                <span className={`kind ${cls}`}>{label}</span>
                <div className="grow">
                  <p><strong>{u.agent}:</strong> {u.text}</p>
                  {fix && <Link className="small" href={`/fix/${fix.id}`}>#{fix.number} {fix.title}</Link>}
                </div>
                <span className="muted small time">{u.time}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {modal && (
        <ReasonModal
          title={`Why was #${modal.number} reverted?`}
          intro="Your answer goes to the agent as a rule in agents.md, and it resubmits the fix in smaller batches."
          confirmLabel="Send to the agent"
          onClose={() => setModal(null)}
          onConfirm={(reason, rule) => {
            dispatch({ type: 'resubmit', id: modal.id, reason, rule });
            setModal(null);
          }}
        />
      )}
    </>
  );
}
