'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useStore } from '../../../lib/store';
import { REAL_ROWS, ISSUE_148, stageLabel } from '../../../lib/data';
import { Chip, Prop, Current } from '../../../components/Marks';
import Timeline from '../../../components/Timeline';
import ReasonModal from '../../../components/ReasonModal';

export default function IssuePage({ params }) {
  const { id } = use(params);
  const n = Number(id);
  const { fixes, proposed, closed, dispatch } = useStore();
  const [modal, setModal] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const f = fixes.find((x) => x.number === n);
  const row = REAL_ROWS.find((r) => r.number === n);
  if (!f && !row) return <div className="ipage"><p>Issue not found. <Link href="/issues">Back to issues</Link></p></div>;

  const title = f ? f.title : row.title;
  const labels = f ? f.labels : row.labels;
  const votes = f ? f.votes : row.votes;
  const inFlight = f && f.steps.some((s) => s.key === 'central' && s.status !== 'pending') && f.state !== 'rolled-back';
  const decisions = n === 148 ? ISSUE_148.decisions : null;
  const confirmed = decisions ? decisions.filter(([, v]) => v.startsWith('Confirmed')).length : 0;

  return (
    <div className="ipage">
      <p><Link href="/issues">← Issues</Link></p>
      <h1><span className="no">#{n}</span> {title}</h1>
      <div className="labels">{labels.map((l) => <span key={l} className="label">{l}</span>)}</div>
      <span className="upvote">▲ Upvote <span className="count">{votes}</span></span>

      <div className="stack">
        {f && f.agentSays && f.state === 'needs-you' && proposed && (
          <section className="sect prop-edge" aria-labelledby="says">
            <h2 id="says">What the agent says <Chip /></h2>
            <p className="says">&ldquo;{f.agentSays}&rdquo;</p>
            <div className="btns">
              {f.needs === 'nudge' && (<><button className="btn primary" onClick={() => dispatch({ type: 'nudge', id: f.id })}>Message the maintainer</button><button className="btn ghost" onClick={() => dispatch({ type: 'nudge', id: f.id, escalate: true })}>Escalate to the project lead</button></>)}
              {f.needs === 'unstick' && <button className="btn primary" onClick={() => dispatch({ type: 'unstick', id: f.id })}>Yes, ask someone else</button>}
              {f.needs === 'reverted' && <button className="btn primary" onClick={() => setModal('resubmit')}>Review the note</button>}
            </div>
          </section>
        )}

        <section className="sect" aria-labelledby="desc">
          <h2 id="desc">Description</h2>
          {f && <p>{f.summary}</p>}
          {n === 148 && ISSUE_148.description.map((t, i) => <p key={i}>{t}</p>)}
          {!f && n !== 148 && <p className="muted">The full description is not included in this mock-up.</p>}
        </section>

        {decisions && (
          <section className="sect" aria-labelledby="dec">
            <h2 id="dec">Agent decisions</h2>
            <Prop>
              <p className="small muted"><Chip kind="prop">Proposed</Chip></p>
              <div className="summary">
                <p><strong>{confirmed} of {decisions.length} agents confirmed it is real</strong> ({decisions.filter(([, v]) => v.includes('Low')).length} Low, {confirmed - 1} Medium). 1 says it no longer reproduces.</p>
                <div className="dissent">
                  <strong>The one that disagrees:</strong> Lahrry&rsquo;s Claude (reviewer). &ldquo;{ISSUE_148.dissent}&rdquo;
                </div>
                {closed[148] ? (
                  <p className="small" style={{ color: 'var(--green)' }}>Closed as already fixed. You can reopen it any time.</p>
                ) : (
                  <div className="ask" style={{ borderColor: 'var(--prop-line)' }}>
                    <span className="who">My agent checked the live site</span>
                    <p className="says">&ldquo;The live footer link now has a profile id. I think it is already fixed.&rdquo;</p>
                    <div className="btns">
                      <button className="btn primary" onClick={() => dispatch({ type: 'closeIssue', number: 148 })}>Close as already fixed</button>
                      <button className="btn ghost" onClick={() => dispatch({ type: 'keepOpen', number: 148 })}>Keep it open</button>
                    </div>
                  </div>
                )}
                <button className="btn ghost" style={{ justifySelf: 'start' }} onClick={() => setShowAll(!showAll)}>{showAll ? 'Hide' : 'Show'} all 12 decisions</button>
                {showAll && <ul className="decisions">{decisions.map(([a, v], i) => <li key={i}><span>{a}</span><span className="muted">“{v}”</span></li>)}</ul>}
              </div>
            </Prop>
            <Current>
              <ul className="decisions">
                {(showAll ? decisions : decisions.slice(0, 5)).map(([a, v], i) => <li key={i}><span>{a}</span><span className="muted">“{v}”</span></li>)}
              </ul>
              {!showAll && <button className="btn ghost" style={{ marginTop: '.6rem' }} onClick={() => setShowAll(true)}>Show all 12 decisions</button>}
            </Current>
          </section>
        )}

        <section className="sect" aria-labelledby="st">
          <h2 id="st">Status</h2>
          <div className="pstate">
            <span>● {f ? (f.state === 'live' ? 'Done' : 'In progress') : (closed[n] ? 'Done' : 'Open')}</span><span className="med">Medium</span><span>{f ? 'Ready' : 'Ready for bids'}</span>
            {proposed && f && <span style={{ background: 'var(--prop-bg)', color: 'var(--prop)' }}>{stageLabel(f)}</span>}
          </div>
          <p className="muted small" style={{ marginTop: '.6rem' }}>{f ? `${f.holder} (${f.since})` : 'Opened Oct 17, 10:57 PM'}</p>
        </section>

        <section className="sect" aria-labelledby="ppl">
          <h2 id="ppl">People</h2>
          <div className="people"><span className="muted">Reporter</span><span><span className="avatar sm">{f ? f.who : row.who}</span> {f ? f.agent : 'Reporter'}</span><span className="muted">Assignee</span><span><span className="avatar sm">{f ? f.who : row.who}</span> {f ? f.agent : 'Assignee'}</span></div>
        </section>

        <Current>
          <section className="sect" aria-labelledby="pr">
            <h2 id="pr">GitHub PR</h2>
            {f && f.steps.some((s) => s.key === 'pr' && s.status === 'done')
              ? <p>PR attached: <span className="muted">zedu-hng/zedu-fe#{n}</span>. To see whether it was merged, reached staging or was reverted, open GitHub.</p>
              : <p className="muted">No GitHub PR attached to this report.</p>}
          </section>
        </Current>

        <Prop>
          <section className="sect prop-edge" aria-labelledby="jr">
            <h2 id="jr">Journey to production <Chip /></h2>
            {f ? (
              <>
                <Timeline fix={f} dispatch={dispatch} onReason={() => setModal('resubmit')} />
                {inFlight && (
                  <div style={{ marginTop: '.8rem' }}>
                    <button className="btn danger" onClick={() => setModal('rollback')}>Roll back this fix</button>
                  </div>
                )}
              </>
            ) : (
              <p className="muted">No fix yet.</p>
            )}
          </section>
        </Prop>

        <section className="sect" aria-labelledby="conv">
          <h2 id="conv">Conversation</h2>
          <div className="convtabs"><span className="on">All</span><span>Comments</span><span>Bids</span><span>Reviews</span><span>Deliveries</span><span>Merge requests</span></div>
        </section>

        <section className="sect" aria-labelledby="act">
          <h2 id="act">Activity ({f ? f.events.length : 3})</h2>
          {f ? (
            <ul className="events">{f.events.map(([t, text], i) => <li key={i}><span className="time">{t}</span><span>{text}</span></li>)}</ul>
          ) : <p className="muted small">Read-only history of changes on this issue.</p>}
        </section>
      </div>

      {modal === 'rollback' && (
        <ReasonModal title={`Roll back #${n}?`} reason={f.proposedReason || 'A regression appeared after this fix reached staging.'} rule={f.proposedRule || 'Test the older features on staging before moving a fix to production.'} confirmLabel="Approve and roll back" onClose={() => setModal(null)}
          onConfirm={(reason, rule) => { dispatch({ type: 'rollback', id: f.id, reason, rule }); setModal(null); }} />
      )}
      {modal === 'resubmit' && (
        <ReasonModal title={`#${n} was reverted`} reason={f.proposedReason || 'It was reverted and no reason was recorded.'} rule={f.proposedRule || 'Split big batches before they go to staging.'} confirmLabel="Approve and resubmit" onClose={() => setModal(null)}
          onConfirm={(reason, rule) => { dispatch({ type: 'resubmit', id: f.id, reason, rule }); setModal(null); }} />
      )}
    </div>
  );
}
