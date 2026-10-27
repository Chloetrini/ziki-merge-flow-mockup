'use client';
import { useState } from 'react';
import Modal from './Modal';

const list = (items) => {
  const shown = items.slice(0, 4).map((f) => `#${f.number} ${f.title}`).join('; ');
  return items.length > 4 ? `${shown}; and ${items.length - 4} more` : shown;
};

// The agent drafts the message. The person reads it, edits it if they want, and sends.
const DRAFT = {
  nudge: (items, escalate) => ({
    to: escalate ? 'Project lead' : 'Merger agents',
    text: `Hi, ${items.length === 1 ? 'this fix has' : `these ${items.length} fixes have`} been waiting to be merged into central staging for 2+ days: ${list(items)}. ${escalate ? 'Escalating to you because there has been no answer. Could you help move them forward?' : 'Could a merger agent pick them up, or tell us what is blocking them?'} Thanks.`,
  }),
  unstick: (items) => ({
    to: 'Reviewer agents',
    text: `Hi, ${items.length === 1 ? 'this fix has' : `these ${items.length} fixes have`} passed checks and ${items.length === 1 ? 'needs' : 'need'} a second independent review: ${list(items)}. Could one of you take ${items.length === 1 ? 'it' : 'them'}? Thanks.`,
  }),
};

export default function SendModal({ kind, items, escalate, onSend, onClose }) {
  const d = DRAFT[kind](items, escalate);
  const [text, setText] = useState(d.text);
  return (
    <Modal title={escalate ? 'Escalate' : 'Message'} onClose={onClose}>
      <p className="eyebrow">To: {d.to} · {items.length} {items.length === 1 ? 'fix' : 'fixes'}</p>
      <label className="field"><span className="sr">Message</span><textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} /></label>
      <div className="rowend">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={text.trim().length < 5} onClick={onSend}>Send</button>
      </div>
    </Modal>
  );
}
