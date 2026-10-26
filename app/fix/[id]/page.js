'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useStore } from '../../../lib/store';
import Timeline from '../../../components/Timeline';
import RiskBadge from '../../../components/RiskBadge';
import ReasonModal from '../../../components/ReasonModal';

export default function FixPage({ params }) {
  const { id } = use(params);
  const { fixes, dispatch } = useStore();
  const [modal, setModal] = useState(false);
  const f = fixes.find((x) => x.id === id);
  if (!f) return <p>Fix not found. <Link href="/">Back to My agents</Link></p>;

  const inFlight = f.steps.some((s) => s.key === 'central' && s.status !== 'pending') && f.state !== 'rolled-back';

  return (
    <>
      <p className="crumb"><Link href="/">← My agents</Link></p>
      <div className="row between wrap-s">
        <h1>#{f.number} {f.title}</h1>
        <RiskBadge risk={f.risk} />
      </div>
      <p className="lead">{f.summary}</p>

      <div className="grid2">
        <section className="panel" aria-labelledby="journey">
          <h2 id="journey">Journey to production</h2>
          <Timeline steps={f.steps} />
        </section>

        <aside className="stack">
          <section className="panel" aria-labelledby="decision">
            <h2 id="decision">What the agent says</h2>
            {f.agentSays && <p className="says">&ldquo;{f.agentSays}&rdquo;</p>}
            <dl className="facts">
              <dt>Risk</dt><dd>{f.riskWhy}</dd>
              <dt>Written by</dt><dd>{f.agent}</dd>
              <dt>Right now</dt><dd>{f.holder} <span className="muted">({f.since})</span></dd>
            </dl>
            {f.needs === 'approve' && (
              <div className="row gap actions">
                <button className="btn primary" onClick={() => dispatch({ type: 'approve', id: f.id })}>Go ahead</button>
                <button className="btn ghost" onClick={() => dispatch({ type: 'stop', id: f.id })}>Not like this</button>
              </div>
            )}
            {f.needs === 'unstick' && (
              <button className="btn primary" onClick={() => dispatch({ type: 'unstick', id: f.id })}>Yes, ask someone else</button>
            )}
            {f.needs === 'reverted' && (
              <button className="btn primary" onClick={() => setModal('resubmit')}>Tell the agent why</button>
            )}
            {!f.needs && f.risk === 'safe' && f.state !== 'rolled-back' && f.state !== 'stopped' && (
              <p className="muted small">By your instructions, the agent merges this itself and tells you.</p>
            )}
            {f.state === 'stopped' && <p className="muted small">Stopped. The agent has been told why.</p>}
          </section>

          {inFlight && (
            <section className="panel" aria-labelledby="rb">
              <h2 id="rb">Something wrong?</h2>
              <p className="muted small">Roll back in one click. Ziki asks why and turns the answer into a rule for the agents.</p>
              <button className="btn danger" onClick={() => setModal('rollback')}>Roll back this fix</button>
            </section>
          )}
        </aside>
      </div>

      <section className="panel" aria-labelledby="activity">
        <h2 id="activity">What happened</h2>
        <ul className="events">
          {f.events.map(([t, text], i) => (
            <li key={i}><span className="time">{t}</span><span>{text}</span></li>
          ))}
        </ul>
      </section>

      {modal === 'rollback' && (
        <ReasonModal
          title={`Roll back #${f.number}?`}
          intro="This puts the previous version back. It does not delete the fix, so it can be tried again."
          confirmLabel="Roll back"
          onClose={() => setModal(false)}
          onConfirm={(reason, rule) => {
            dispatch({ type: 'rollback', id: f.id, reason, rule });
            setModal(false);
          }}
        />
      )}
      {modal === 'resubmit' && (
        <ReasonModal
          title={`Why was #${f.number} reverted?`}
          intro="Ziki records your answer as a rule so the agents do not make the same mistake again, then resubmits the fix in smaller batches."
          confirmLabel="Save rule and resubmit"
          onClose={() => setModal(false)}
          onConfirm={(reason, rule) => {
            dispatch({ type: 'resubmit', id: f.id, reason, rule });
            setModal(false);
          }}
        />
      )}
    </>
  );
}
