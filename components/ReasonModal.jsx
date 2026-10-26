'use client';
import { useState } from 'react';
import Modal from './Modal';

export default function ReasonModal({ title, intro, confirmLabel, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [rule, setRule] = useState('');
  const ok = reason.trim().length > 3 && rule.trim().length > 3;
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{intro}</p>
      <label className="field">
        <span>What went wrong?</span>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="For example: the batch was too big to review." />
      </label>
      <label className="field">
        <span>Rule for the agents (added to agents.md so they do not repeat it)</span>
        <textarea value={rule} onChange={(e) => setRule(e.target.value)} rows={2} placeholder="For example: never merge more than 20 files at once." />
      </label>
      <div className="rowend">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!ok} onClick={() => onConfirm(reason.trim(), rule.trim())}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
