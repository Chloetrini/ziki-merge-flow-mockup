'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '../../lib/store';
import { REAL_ROWS, GATES } from '../../lib/data';
import Modal from '../../components/Modal';
import { Chip, Icon } from '../../components/Marks';
import ReasonModal from '../../components/ReasonModal';
import SendModal from '../../components/SendModal';

const KIND = { moved: 1, waiting: 1, reverted: 1, live: 1 };

// What each kind of stuck fix needs from a person: one title, one action.
const GROUPS = {
  nudge: { title: (n) => `${n} waiting at central staging 2+ days`, act: (n) => `Ask a merger about all ${n}`, secondary: (n) => `Escalate (${n})`, row: 'Message' },
  unstick: { title: (n) => `${n} need a second reviewer`, act: (n) => `Ask reviewers (${n})`, row: 'Ask' },
  reverted: { title: (n) => `${n} rejected, with a note from the agent`, act: (n) => `Approve notes (${n})`, row: 'Approve' },
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
  nudge: ['gh-open', 'Waiting 2+ days', 'green'], unstick: ['gh-open', 'Needs a second reviewer', 'green'],
  reverted: ['gh-closed', 'Rejected', 'red'], moved: ['gh-merge', 'On its way', 'purple'], waiting: ['gh-open', 'Waiting', 'green'],
  live: ['gh-done', 'Live', 'purple'], needs: ['gh-open', 'Needs you', 'green'],
};
function StateIcon({ kind, word }) {
  const [icon, label, tone] = STATE[kind];
  return <span className={`sicon ${tone}`} title={label} role="img" aria-label={label}><Icon name={icon} />{word && <span className="sword">{label}</span>}</span>;
}

// One button per fix, named for what it does. A reverted fix opens its note first.
const REASON = { nudge: 'Waiting for a merger', unstick: 'Needs a second independent reviewer' };
const where = (f) => GATES.find((g) => g.key === releaseLoc(f)?.gate)?.label || 'Review';

function RowAction({ f, dispatch, onReview, onSend }) {
  if (f.needs === 'nudge') return <button className="btn small-btn" title="Ask a merger agent" onClick={() => onSend('nudge', [f])}>Ask</button>;
  if (f.needs === 'unstick') return <button className="btn small-btn" title="Ask a reviewer" onClick={() => onSend('unstick', [f])}>Ask</button>;
  if (onReview) return <button className="btn small-btn" title="Review the agent's note" onClick={() => onReview(f)}>Review</button>;
  return <button className="btn small-btn" title="Approve the agent's note" onClick={() => dispatch({ type: 'resubmit', id: f.id, reason: f.proposedReason, rule: f.proposedRule })}>Approve</button>;
}

const ASK_LABEL = { permission: 'Asks to start', question: 'Question', blocker: 'Blocked', scope: 'Bigger than the ticket', approval: 'Design change', review: 'Stuck on a reviewer' };

// Need your input: what Ziki's real Inbox holds. An agent stops and asks its owner something.
function NeedInput() {
  const { asks, proposed, dispatch } = useStore();
  const [reply, setReply] = useState(null);
  const [text, setText] = useState('');
  if (!proposed || !asks.length) return <div className="empty"><strong>Nothing here right now.</strong>No agent is waiting on an answer.</div>;
  const answer = (q, said) => dispatch({ type: 'answerAsk', id: q.id, text: `Answered #${q.number}: ${said}` });
  return (
    <>
      <ul className="rlist">
        {asks.map((q) => (
          <li key={q.id} className="rrow">
            <StateIcon kind="needs" />
            <span className="rowmain">
              <Link className="ttl" href={`/issues/${q.number}`}>{q.title}</Link>
              <span className="meta">#{q.number} · {ASK_LABEL[q.kind]} · {q.agent}: {q.text} · {q.since}</span>
            </span>
            <span className="rowbtns">
              {q.kind === 'question' || q.kind === 'blocker' ? (
                <button className="btn small-btn" onClick={() => { setReply(q); setText(''); }}>Reply</button>
              ) : (
                <>
                  <button className="btn small-btn" onClick={() => answer(q, 'yes')}>Yes</button>
                  <button className="btn ghost small-btn" onClick={() => answer(q, 'no')}>No</button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      {reply && (
        <Modal title={`#${reply.number}`} onClose={() => setReply(null)}>
          <p className="eyebrow">{reply.agent} asks</p>
          <p className="says" style={{ fontSize: '.95rem' }}>{reply.text}</p>
          <label className="field"><span className="sr">Your answer</span><textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer" /></label>
          <div className="rowend">
            <button className="btn ghost" onClick={() => setReply(null)}>Cancel</button>
            <button className="btn primary" disabled={text.trim().length < 2} onClick={() => { answer(reply, text.trim()); setReply(null); }}>Send</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// Updates: what has already happened (merged, moved to the next stage, live). History only, so no buttons and no rejected fixes.
function Updates() {
  const { fixes, feed } = useStore();
  const byId = Object.fromEntries(fixes.map((f) => [f.id, f]));
  const rows = feed.filter((u) => u.kind in KIND && u.kind !== 'reverted');
  return (
    <ul className="rlist">
      {rows.slice(0, 16).map((u) => {
        const fix = byId[u.fixId];
        return (
          <li key={u.id} className="rrow">
            <StateIcon kind={u.kind} />
            <span className="rowmain">
              {fix ? <Link className="ttl" href={`/issues/${fix.number}`}>{fix.title}</Link> : <strong className="ttl">{u.agent}</strong>}
              <span className="meta">{fix ? `#${fix.number} · ` : ''}{u.text} · {u.time}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// Releases: Ziki's filter pills (one per stage), then a plain list. A fix is "at" a stage once it has been merged there.
// Releases: Ziki's filter pills (one per stage), then a plain list of rows, like GitHub's lists.
function Releases() {
  const { fixes, dispatch, autoSend } = useStore();
  const [stage, setStage] = useState('central');
  const [all, setAll] = useState(false);
  const [modal, setModal] = useState(null);
  const [send, setSend] = useState(null);
  const placed = fixes.map((f) => ({ f, loc: releaseLoc(f) }));
  const inStage = (g) => placed.filter((p) => p.loc && p.loc.gate === g && p.loc.kind !== 'live').map((p) => p.f);
  const live = placed.filter((p) => p.loc && p.loc.kind === 'live').length;
  const rows = [...inStage(stage)].sort((a, b) => (b.state === 'needs-you') - (a.state === 'needs-you'));
  // Before "Show all", mix in a few merged ones so both kinds are visible.
  const stuck = rows.filter((f) => f.state === 'needs-you');
  const merged = rows.filter((f) => f.state !== 'needs-you');
  const first = [...stuck.slice(0, 5), ...merged.slice(0, stuck.length ? 3 : 8)];
  const shown = all ? rows : first;
  const waiting = rows.filter((f) => f.state === 'needs-you' && f.needs === 'nudge');
  const kindOf = (f) => (f.state !== 'needs-you' ? 'moved' : f.needs === 'reverted' ? 'reverted' : 'needs');
  const doSend = (kind, its) => (autoSend ? dispatch({ type: 'bulk', needs: kind, ids: its.map((x) => x.id) }) : setSend({ kind, items: its }));
  return (
    <>
      <span className="pills" role="group" aria-label="Stage">
        {GATES.map((g) => (
          <button key={g.key} type="button" className={stage === g.key ? 'on' : ''} aria-pressed={stage === g.key} onClick={() => { setStage(g.key); setAll(false); }}>
            {g.label} <span className="n">{inStage(g.key).length}</span>
          </button>
        ))}
      </span>
      <span className="pillright">
        {waiting.length > 0 && <button type="button" className="linkbtn" title="Ask a merger about all of them" onClick={() => doSend('nudge', waiting)}>Ask all {waiting.length}</button>}
        <label className="switch" title="On: the agents ask the merger agents themselves. Off: you read each draft first.">
          <input type="checkbox" role="switch" checked={autoSend} onChange={(e) => dispatch({ type: 'setAuto', value: e.target.checked })} />
          <span className="track" aria-hidden="true" /> Auto-send
        </label>
      </span>
      <ul className="rlist">
        {shown.map((f) => (
          <li key={f.id} className="rrow">
            <StateIcon kind={kindOf(f)} />
            <span className="rowmain">
              <Link className="ttl" href={`/issues/${f.number}`}>{f.title}</Link>
              <span className="meta">#{f.number} · {f.state === 'needs-you' ? (f.needs === 'reverted' ? 'Rejected' : REASON[f.needs]) : 'Merged'} · {f.since}</span>
            </span>
            {f.state === 'needs-you' && <span className="rowbtns"><RowAction f={f} dispatch={dispatch} onReview={setModal} onSend={doSend} /></span>}
          </li>
        ))}
        {rows.length === 0 && <li className="rrow"><span className="muted">Nothing at this stage.</span></li>}
      </ul>
      {rows.length > first.length && <button className="btn ghost" style={{ marginTop: '.6rem' }} onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</button>}
      <p className="muted small" style={{ marginTop: '.6rem' }}>{live} fixes are live. Finished work is not listed.</p>
      {modal && (
        <ReasonModal
          title={`#${modal.number} was rejected`}
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

// A short confirmation after something is sent.
function Toast() {
  const { notice, dispatch } = useStore();
  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => dispatch({ type: 'clearNotice' }), 4000);
    return () => clearTimeout(id);
  }, [notice, dispatch]);
  return notice ? <div className="toast" role="status">✓ {notice}</div> : null;
}

function InboxView() {
  const sp = useSearchParams();
  const { proposed, asks } = useStore();
  const needsN = proposed ? asks.length : 0;
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
      <Toast />
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
  const { fixes, proposed, asks } = useStore();
  const status = sp.get('status');
  const view = status || 'inbox';
  const needs = proposed ? asks.length : 0;
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
