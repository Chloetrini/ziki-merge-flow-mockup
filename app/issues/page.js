'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '../../lib/store';
import { REAL_ROWS, GATES, stageLabel } from '../../lib/data';
import { Chip, Icon } from '../../components/Marks';
import ReasonModal from '../../components/ReasonModal';

const KIND = {
  moved: ['On its way', 'k-moved'], waiting: ['Waiting', 'k-waiting'], reverted: ['Reverted', 'k-reverted'],
};

// What each kind of stuck fix needs from a person: one title, one action.
const GROUPS = {
  nudge: { title: (n) => `${n} waiting at central staging 2+ days`, act: (n) => `Message maintainer (${n})`, secondary: (n) => `Escalate (${n})`, row: 'Message' },
  unstick: { title: (n) => `${n} need a second reviewer`, act: (n) => `Ask reviewers (${n})`, row: 'Ask' },
  reverted: { title: (n) => `${n} reverted`, act: (n) => `Approve notes (${n})`, row: 'Approve' },
};

// Where a fix is in the release path, or null if it has not reached the first gate.
const ORDER = ['central', 'staging', 'production'];
function releaseLoc(f) {
  const st = (k) => f.steps.find((x) => x.key === k)?.status;
  if (f.state === 'stopped') return null;
  for (let i = 0; i < 3; i++) {
    const v = st(ORDER[i]);
    if (v === 'reverted') return { gate: ORDER[i], kind: 'reverted' };
    if (v === 'active') return { gate: ORDER[i], kind: 'arriving' };
    if (v === 'pending' || !v) { const prev = i === 0 ? st('decision') : st(ORDER[i - 1]); return prev === 'done' ? { gate: ORDER[i], kind: 'waiting' } : null; }
  }
  return { gate: 'production', kind: 'live' };
}

const TAG = { nudge: 'Waiting', unstick: 'Needs reviewer', reverted: 'Reverted' };

// One button per fix, named for what it does. A reverted fix opens its note first.
function RowAction({ f, dispatch, onReview }) {
  if (f.needs === 'nudge') return <button className="btn small-btn" onClick={() => dispatch({ type: 'nudge', id: f.id })}>Message maintainer</button>;
  if (f.needs === 'unstick') return <button className="btn small-btn" onClick={() => dispatch({ type: 'unstick', id: f.id })}>Ask reviewer</button>;
  if (onReview) return <button className="btn small-btn" onClick={() => onReview(f)}>Review note</button>;
  return <button className="btn small-btn" onClick={() => dispatch({ type: 'resubmit', id: f.id, reason: f.proposedReason, rule: f.proposedRule })}>Approve note</button>;
}

function Group({ kind, items, dispatch, onReview }) {
  const [open, setOpen] = useState(false);
  const [off, setOff] = useState({});
  const g = GROUPS[kind];
  const picked = items.filter((f) => !off[f.id]);
  const n = picked.length;
  const run = (escalate) => dispatch({ type: 'bulk', needs: kind, ids: picked.map((f) => f.id), escalate });
  return (
    <li className="group">
      <div className="group-head">
        <span className="gcount" aria-hidden="true">{items.length}</span>
        <strong className="gtitle">{g.title(items.length)}</strong>
        <div className="gbtns">
          {kind === 'reverted' && !open ? (
            <button className="btn primary" onClick={() => setOpen(true)}>Review notes ({items.length})</button>
          ) : (
            <>
              <button className="btn primary" disabled={!n} onClick={() => run(false)}>{g.act(n)}</button>
              {g.secondary && <button className="btn ghost" disabled={!n} onClick={() => run(true)}>{g.secondary(n)}</button>}
            </>
          )}
          <button className="btn ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'}</button>
        </div>
      </div>
      {open && (
        <ul className="grows">
          {items.map((f) => (
            <li key={f.id}>
              <input type="checkbox" aria-label={`Include #${f.number}`} checked={!off[f.id]} onChange={() => setOff({ ...off, [f.id]: !off[f.id] })} />
              <span className="vote">{f.votes}<small>▲</small></span>
              <span className="rowmain">
                <Link className="ttl" href={`/issues/${f.number}`}>{f.title}</Link>
                <span className="meta">#{f.number} {f.labels.join(' · ')} · {f.since}</span>
                {kind === 'reverted' && <span className="note-line"><strong>Went wrong:</strong> {f.proposedReason} <strong>Rule:</strong> {f.proposedRule}</span>}
              </span>
              <span className={`rtag ${kind}`}>{TAG[kind]}</span>
              <span className="rowbtns">
                {kind === 'reverted' && <button className="btn ghost small-btn" onClick={() => onReview(f)}>Edit</button>}
                <RowAction f={f} dispatch={dispatch} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Stats() {
  const { fixes } = useStore();
  const moving = fixes.filter((f) => f.state === 'moving').length;
  const live = fixes.filter((f) => f.state === 'live').length;
  const reverted = fixes.filter((f) => f.steps.some((s) => s.status === 'reverted')).length;
  const needs = fixes.filter((f) => f.state === 'needs-you').length;
  return (
    <ul className="stats" aria-label="Summary">
      <li className={needs ? 'hot' : ''}><Link href="/issues"><strong>{needs}</strong><span>need you →</span></Link></li>
      <li><strong>{moving}</strong><span>on their way</span></li>
      <li><strong>{reverted}</strong><span>reverted</span></li>
      <li><strong>{live}</strong><span>live</span></li>
    </ul>
  );
}

function NeedInput() {
  const { fixes, proposed, dispatch } = useStore();
  const gate = useSearchParams().get('gate');
  const gateLabel = GATES.find((g) => g.key === gate)?.label;
  const [modal, setModal] = useState(null);
  const needs = proposed ? fixes.filter((f) => f.state === 'needs-you' && (!gateLabel || releaseLoc(f)?.gate === gate)) : [];
  const groups = ['nudge', 'unstick', 'reverted'].map((k) => [k, needs.filter((f) => f.needs === k)]).filter(([, items]) => items.length).sort((a, b) => b[1].length - a[1].length);
  return (
    <>
      {groups.length === 0 ? (
        <div className="empty"><strong>Nothing here right now.</strong>No agent is waiting on an answer.</div>
      ) : (
        <>
          {proposed && <Stats />}
          {gateLabel && <p className="filterbar">Showing only <strong>{gateLabel}</strong> <Link href="/issues">Show all</Link></p>}
          <ul className="groups">{groups.map(([k, items]) => <Group key={k} kind={k} items={items} dispatch={dispatch} onReview={setModal} />)}</ul>
        </>
      )}
      {modal && (
        <ReasonModal
          title={`#${modal.number} was reverted`}
          reason={modal.proposedReason}
          rule={modal.proposedRule}
          confirmLabel="Approve and resubmit"
          onClose={() => setModal(null)}
          onConfirm={(reason, rule) => { dispatch({ type: 'resubmit', id: modal.id, reason, rule }); setModal(null); }}
        />
      )}
    </>
  );
}

// Updates: what the agents did. Anything still waiting on you has its button right here.
function Updates() {
  const { fixes, feed, dispatch } = useStore();
  const [modal, setModal] = useState(null);
  const byId = Object.fromEntries(fixes.map((f) => [f.id, f]));
  const rows = feed.filter((u) => u.kind in KIND);
  return (
    <>
      <Stats />
      <ul className="feed">
        {rows.slice(0, 12).map((u) => {
          const [label, cls] = KIND[u.kind];
          const fix = byId[u.fixId];
          const needsYou = fix && fix.state === 'needs-you';
          return (
            <li key={u.id} className="update">
              <span className={`kind ${cls}`}>{label}</span>
              <span className="utext">{fix ? <Link href={`/issues/${fix.number}`}><span className="num">#{fix.number}</span> {fix.title}</Link> : <strong>{u.agent}</strong>}<span className="muted small"> · {u.text}</span></span>
              <span className="muted small">{u.time}</span>
              {needsYou ? <RowAction f={fix} dispatch={dispatch} onReview={setModal} /> : <span />}
            </li>
          );
        })}
      </ul>
      {modal && (
        <ReasonModal
          title={`#${modal.number} was reverted`}
          reason={modal.proposedReason}
          rule={modal.proposedRule}
          confirmLabel="Approve and resubmit"
          onClose={() => setModal(null)}
          onConfirm={(reason, rule) => { dispatch({ type: 'resubmit', id: modal.id, reason, rule }); setModal(null); }}
        />
      )}
    </>
  );
}

// Releases: where fixes are. Anything stuck links to the first tab.
function Releases() {
  const { fixes } = useStore();
  const placed = fixes.map((f) => ({ f, loc: releaseLoc(f) }));
  return (
    <div className="gates">
      {GATES.map((g) => {
        const here = placed.filter((p) => p.loc && p.loc.gate === g.key);
        const count = (k) => here.filter((p) => p.loc.kind === k).length;
        const stuck = here.filter((p) => p.f.state === 'needs-you').length;
        const rest = here.filter((p) => p.loc.kind !== 'live');
        return (
          <section key={g.key} className="card gate" aria-labelledby={`g-${g.key}`}>
            <h3 id={`g-${g.key}`}>{g.label}</h3>
            <ul className="gcounts">
              <li><strong>{count('arriving')}</strong> on the way</li>
              <li className={count('reverted') ? 'warn' : ''}><strong>{count('reverted')}</strong> reverted</li>
              {g.key === 'production' && <li><strong>{count('live')}</strong> live</li>}
            </ul>
            {stuck > 0 ? <Link className="btn primary" href={`/issues?gate=${g.key}`}>{stuck} need you →</Link> : <p className="muted small">Nothing stuck.</p>}
            {rest.length > 0 && (
              <details>
                <summary>Show {rest.length}</summary>
                <ul className="glist">{rest.map(({ f }) => <li key={f.id}><Link href={`/issues/${f.number}`}><span className="num">#{f.number}</span> {f.title}</Link></li>)}</ul>
              </details>
            )}
          </section>
        );
      })}
    </div>
  );
}

function InboxView() {
  const sp = useSearchParams();
  const { proposed, fixes } = useStore();
  const needsN = proposed ? fixes.filter((f) => f.state === 'needs-you').length : 0;
  const tab = sp.get('tab') || 'need';
  const TABS = [
    ['need', 'Need your input', needsN, false],
    ['updates', 'Updates', null, true],
    ['releases', 'Releases', null, true],
    ['design', 'Design feedback needed', 0, false],
    ['ideas', 'New ideas', 1, false],
  ].filter((t) => proposed || !t[3]);
  const active = TABS.find((t) => t[0] === tab) ? tab : 'need';
  return (
    <>
      {!proposed && (
        <div className="howto">
          <div>
            <div className="row1" style={{ padding: 0, justifyContent: 'flex-start' }}><Icon name="inbox" /><strong>How the Inbox works</strong></div>
            <p className="muted" style={{ marginTop: '.4rem' }}>Agents work through issues on their own and stop here when they need a person: to answer a question, give feedback on a design, or weigh in on a new idea.</p>
          </div>
          <div className="agentbox">
            <div className="eyebrow">Your agents</div>
            <div className="nm">Adloe <span className="tag">Standing by</span></div>
            <p className="muted small">Last 30 days: 122 confirmed · 2 rejected</p>
          </div>
        </div>
      )}
      <nav className="subtabs" aria-label="Inbox sections">
        {TABS.map(([k, label, n, isNew]) => (
          <Link key={k} href={k === 'need' ? '/issues' : `/issues?tab=${k}`} className={active === k ? 'on' : ''}>
            {label} {n !== null && <span className="count">{n}</span>} {isNew && <Chip />}
          </Link>
        ))}
      </nav>
      <div className="panel">
        {active === 'need' && <NeedInput />}
        {active === 'updates' && <Updates />}
        {active === 'releases' && <Releases />}
        {active === 'design' && <div className="empty"><strong>Nothing here right now.</strong>No agent is waiting on design feedback.</div>}
        {active === 'ideas' && <div className="empty"><strong>1 new idea.</strong>Not part of this mock-up.</div>}
      </div>
    </>
  );
}

function ListView({ status }) {
  const { fixes, proposed } = useStore();
  const rows = [];
  const mine = fixes.map((f) => ({ ...f, mine: true }));
  if (status === 'open' || status === 'all') REAL_ROWS.forEach((r) => rows.push({ ...r, status: 'Ready for bids', tone: 'green' }));
  const pick = (f) => status === 'all' || (status === 'progress' && (f.state === 'moving' || f.state === 'needs-you')) || (status === 'done' && f.state === 'live') || (status === 'open' && false);
  mine.filter(pick).forEach((f) => {
    const tone = f.state === 'live' ? 'green' : f.state === 'needs-you' ? (f.needs === 'reverted' ? 'red' : 'amber') : 'prop';
    rows.push({ ...f, status: proposed ? stageLabel(f) : f.state === 'live' ? 'Done' : 'In progress', tone: proposed ? tone : 'green' });
  });
  return (
    <>
      <p className="muted small" style={{ padding: '0 1rem' }}>{rows.length} {status === 'open' ? 'open issues shown, sorted by top votes' : 'issues'}</p>
      <div className="table">
        <div className="thead"><span>Votes</span><span>Issue</span><span>Status</span><span>Priority</span><span /></div>
        {rows.map((r) => (
          <Link key={r.number} href={`/issues/${r.number}`} className="trow">
            <span className="vote">{r.votes}<small>▲</small></span>
            <span><span className="ttl">{r.title}</span><br /><span className="meta">#{r.number} {r.labels.join(' · ')} {r.age || ''}</span></span>
            <span className={`st-${r.tone}`}>{r.status}{proposed && r.mine && r.tone !== 'green' ? ' ' : ''}</span>
            <span className="bars" aria-label="Medium priority"><i style={{ height: 6 }} /><i style={{ height: 10 }} /><i style={{ height: 3, opacity: .4 }} /></span>
            <span className="avatar sm">{r.who}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

function IssuesInner() {
  const sp = useSearchParams();
  const { fixes, proposed } = useStore();
  const status = sp.get('status');
  const view = status || 'inbox';
  const needs = proposed ? fixes.filter((f) => f.state === 'needs-you').length : 0;
  const pills = [['open', 'Open', 960], ['progress', 'In progress', 72], ['done', 'Done', 342], ['all', 'All', 1380]];
  return (
    <main className="wrap">
      <div className="shell">
        <div className="crumbs"><span>Zedu</span><span>›</span><strong>Issues</strong>
          <span className="tools"><span className="ibtn"><Icon name="search" /></span><span className="ibtn"><Icon name="filter" /></span><span className="ibtn"><Icon name="sort" /></span><span className="ibtn"><Icon name="plus" /></span><span className="pill small">Platform: All</span></span>
        </div>
        <div className="row1">
          <Link href="/issues" className={`inbox-btn ${view === 'inbox' ? 'on' : ''}`}><Icon name="inbox" /> Inbox <span className="count">{needs}</span></Link>
          <span className="pills">
            {pills.map(([k, label, n]) => (<Link key={k} href={`/issues?status=${k}`} className={view === k ? 'on' : ''}>{label} <span className="n">{n}</span></Link>))}
          </span>
        </div>
        {view === 'inbox' ? <InboxView /> : <ListView status={view} />}
      </div>
    </main>
  );
}

export default function Issues() {
  return <Suspense fallback={null}><IssuesInner /></Suspense>;
}
