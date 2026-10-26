'use client';
import { useState } from 'react';
import Modal from './Modal';

// The agent has already worked out what went wrong. The person approves its note, or edits it first.
export default function ReasonModal({ title, reason: r0, rule: r1, confirmLabel, onConfirm, onClose }) {
  const [reason, setReason] = useState(r0);
  const [rule, setRule] = useState(r1);
  const [editing, setEditing] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <p className="eyebrow">The agent&rsquo;s note</p>
      {editing ? (
        <>
          <label className="field"><span>What went wrong</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} /></label>
          <label className="field"><span>Rule for next time</span><textarea value={rule} onChange={(e) => setRule(e.target.value)} rows={2} /></label>
        </>
      ) : (
        <div className="note">
          <p><strong>What went wrong:</strong> {reason}</p>
          <p><strong>Rule for next time:</strong> {rule}</p>
        </div>
      )}
      <p className="muted small">Approving adds the rule to Project notes.</p>
      <div className="rowend">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn ghost" onClick={() => setEditing(!editing)}>{editing ? 'Done editing' : 'Edit'}</button>
        <button className="btn primary" disabled={reason.trim().length < 4 || rule.trim().length < 4} onClick={() => onConfirm(reason.trim(), rule.trim())}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
