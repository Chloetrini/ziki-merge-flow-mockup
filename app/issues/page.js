'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '../../lib/store';
import { REAL_ROWS, GATES } from '../../lib/data';
import { Chip, Icon } from '../../components/Marks';
import ReasonModal from '../../components/ReasonModal';
import SendModal from '../../components/SendModal';

const KIND = { moved: 1, waiting: 1, reverted: 1 };

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

// GitHub-style: a small icon says the state; the words are in the tooltip.
const STATE = {
  nudge: ['clock', 'Waiting 2+ days', 'amber'], unstick: ['eye', 'Needs a second reviewer', 'amber'],
  reverted: ['undo', 'Reverted', 'red'], moved: ['arrow', 'On its way', 'blue'], waiting: ['clock', 'Waiting', 'amber'], live: ['check', 'Live', 'green'], needs: ['alert', 'Needs you', 'amber'],
};
function StateIcon({ kind, word }) {
  const [icon, label, tone] = STATE[kind];
  return <span className={`sicon ${tone}`} title={label} role="img" aria-label={label}><Icon name={icon} />{word && <span className="sword">{label}</span>}</span>;
}

// One button per fix, named for what it does. A reverted fix opens its note first.
const REASON = { nudge: 'Waiting for the maintainer', unstick: 'Needs a second independent reviewer' };
const where = (f) => GATES.find((g) => g.key === releaseLoc(f)?.gate)?.label || 'Review';

function RowAction({ f, dispatch, onReview, onSend }) {
  if (f.needs === 'nudge') return <button className="btn small-btn" onClick={() => onSend('nudge', [f])}>Message maintainer</button>;
  if (f.needs === 'unstick') return <button className="btn small-btn" onClick={() => onSend('unstick', [f])}>Ask reviewer</button>;
  if (onReview) return <button className="btn small-btn" onClick={() => onReview(f)}>Review note</button>;
  return <button className="btn small-btn" onClick={() => dispatch({ type: 'resubmit', id: f.id, reason: f.proposedReason, rule: f.proposedRule })}>Approve note</button>;
}

function Group({ kind, items, dispatch, onReview, onSend }) {
  const [open, setOpen] = useState(false);
  const [off, setOff] = useState({});
  const g = GROUPS[kind];
  const picked = items.filter((f) => !off[f.id]);
  const n = picked.length;
  const run = (escalate) => (kind === 'reverted' ? dispatch({ type: 'bulk', needs: kind, ids: picked.map((f) => f.id) }) : onSend(kind, picked, escalate));
  return (
    <li className="group">
      <div className="group-head">
        <StateIcon kind={kind} />
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
              <span className="unread" aria-label="Needs you" />
              <StateIcon kind={kind} />
              <span className="rowmain">
                <span className="meta">{where(f)} – #{f.number}</span>
                <Link className="ttl" href={`/issues/${f.number}`}>{f.title}</Link>
                <span className="reason">{kind === 'reverted' ? <><strong>Went wrong:</strong> {f.proposedReason} <strong>Rule:</strong> {f.proposedRule}</> : REASON[kind]}</span>
              </span>
              <span className="when">{f.since}</span>
              <span className="rowbtns">
                {kind === 'reverted' && <button className="btn ghost small-btn" onClick={() => onReview(f)}>Edit</button>}
                <RowAction f={f} dispatch={dispatch} onSend={onSend} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function NeedInput() {
  const { fixes, proposed, dispatch } = useStore();
  const gate = useSearchParams().get('gate');
  const gateLabel = GATES.find((g) => g.key === gate)?.label;
  const [modal, setModal] = useState(null);
  const [send, setSend] = useState(null);
  const needs = proposed ? fixes.filter((f) => f.state === 'needs-you' && (!gateLabel || releaseLoc(f)?.gate === gate)) : [];
  const groups = ['nudge', 'unstick', 'reverted'].map((k) => [k, needs.filter((f) => f.needs === k)]).filter(([, items]) => items.length).sort((a, b) => b[1].length - a[1].length);
  return (
    <>
      {groups.length === 0 ? (
        <div className="empty"><strong>Nothing here right now.</strong>No agent is waiting on an answer.</div>
      ) : (
        <>
          {gateLabel && <p className="filterbar">Showing only <strong>{gateLabel}</strong> <Link href="/issues">Show all</Link></p>}
          <ul className="groups">{groups.map(([k, items]) => <Group key={k} kind={k} items={items} dispatch={dispatch} onReview={setModal} onSend={(kind, its, escalate) => setSend({ kind, items: its, escalate })} />)}</ul>
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
      {send && (
        <SendModal kind={send.kind} items={send.items} escalate={send.escalate} onClose={() => setSend(null)}
          onSend={() => { dispatch({ type: 'bulk', needs: send.kind, ids: send.items.map((f) => f.id), escalate: send.escalate }); setSend(null); }} />
      )}
    </>
  );
}

// Updates: what the agents did. Anything still waiting on you has its button right here.
function Updates() {
  const { fixes, feed, dispatch } = useStore();
  const [modal, setModal] = useState(null);
  const [send, setSend] = useState(null);
  const byId = Object.fromEntries(fixes.map((f) => [f.id, f]));
  const rows = feed.filter((u) => u.kind in KIND);
  return (
    <>
      <ul className="feed">
        {rows.slice(0, 12).map((u) => {
          const fix = byId[u.fixId];
          const needsYou = fix && fix.state === 'needs-you';
          return (
            <li key={u.id} className="update">
              <StateIcon kind={u.kind} word />
              <span className="utext">{fix ? <Link href={`/issues/${fix.number}`}><span className="num">#{fix.number}</span> {fix.title}</Link> : <strong>{u.agent}</strong>}<span className="muted small"> · {u.text}</span></span>
              <span className="muted small">{u.time}</span>
              {needsYou ? <RowAction f={fix} dispatch={dispatch} onReview={setModal} onSend={(kind, its) => setSend({ kind, items: its })} /> : <span />}
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
      {send && (
        <SendModal kind={send.kind} items={send.items} onClose={() => setSend(null)}
          onSend={() => { dispatch({ type: 'bulk', needs: send.kind, ids: send.items.map((f) => f.id) }); setSend(null); }} />
      )}
    </>
  );
}

// Releases: one row per stage, like a GitHub list. Anything stuck links to the fixes that need you.
function Releases() {
  const { fixes } = useStore();
  const placed = fixes.map((f) => ({ f, loc: releaseLoc(f) }));
  const Count = ({ kind, n }) => { const [icon, label, tone] = STATE[kind]; return <span className={`sicon ${tone}`} title={label}><Icon name={icon} />{n} <span className="sword">{label.toLowerCase()}</span></span>; };
  return (
    <ul className="stages">
      {GATES.map((g) => {
        const here = placed.filter((p) => p.loc && p.loc.gate === g.key);
        const count = (k) => here.filter((p) => p.loc.kind === k).length;
        const stuck = here.filter((p) => p.f.state === 'needs-you').length;
        const rest = here.filter((p) => p.loc.kind !== 'live');
        return (
          <li key={g.key} className="stage">
            <div className="stage-head">
              <strong>{g.label}</strong>
              <span className="scounts">
                <Count kind="moved" n={here.filter((p) => p.loc.kind !== 'live' && p.f.state !== 'needs-you').length} />
                {g.key === 'production' && <Count kind="live" n={count('live')} />}
              </span>
              {stuck > 0 && <Link className="btn small-btn" href={`/issues?gate=${g.key}`}>{stuck} need you →</Link>}
            </div>
            {rest.length > 0 && (
              <details>
                <summary>Show {rest.length}</summary>
                <ul className="glist">{rest.map(({ f }) => <li key={f.id}><StateIcon kind={f.state === 'needs-you' ? 'needs' : 'moved'} /><Link href={`/issues/${f.number}`}><span className="num">#{f.number}</span> {f.title}</Link></li>)}</ul>
              </details>
            )}
          </li>
        );
      })}
    </ul>
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
    rows.push({ ...f, status: f.state === 'live' ? 'Done' : 'In progress', tone: 'green' });
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
