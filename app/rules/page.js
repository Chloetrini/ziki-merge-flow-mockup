'use client';
import { useState } from 'react';
import { useStore } from '../../lib/store';

export default function Rules() {
  const { rules, instructions, dispatch } = useStore();
  const [text, setText] = useState('');
  return (
    <>
      <h1>Rules</h1>
      <p className="lead">What I told my agents, and what they have learned from me.</p>

      <section aria-labelledby="mine">
        <h2 id="mine">My instructions to my agents</h2>
        <p className="muted small tight-p">In my own words. My agents follow these without asking me again.</p>
        <ul className="cards">
          {instructions.map((i) => (
            <li key={i.id} className="card row between">
              <p className="rule">{i.text}</p>
              <button className="btn ghost" onClick={() => dispatch({ type: 'removeInstruction', id: i.id })} aria-label={`Remove: ${i.text}`}>Remove</button>
            </li>
          ))}
        </ul>
        <form
          className="reply addrule"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            dispatch({ type: 'addInstruction', text: text.trim() });
            setText('');
          }}
        >
          <label className="sr" htmlFor="newrule">Add an instruction</label>
          <input id="newrule" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an instruction, for example: never touch the billing pages" />
          <button className="btn primary" type="submit" disabled={!text.trim()}>Add</button>
        </form>
      </section>

      <section aria-labelledby="learned">
        <h2 id="learned">What my agents have learned (agents.md)</h2>
        <p className="muted small tight-p">Added when I explain why something went wrong, so it does not happen again.</p>
        <ul className="cards">
          {rules.map((r) => (
            <li key={r.id} className="card">
              <p className="rule">{r.text}</p>
              <p className="muted small">{r.source}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
