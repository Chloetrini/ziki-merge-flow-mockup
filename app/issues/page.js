'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '../../lib/store';
import { REAL_ROWS, GATES, AGENTS, stageLabel } from '../../lib/data';
import { Chip, Icon, Prop } from '../../components/Marks';
import ReasonModal from '../../components/ReasonModal';

const KIND = {
  done: ['Done', 'k-done'], moved: ['Moved on', 'k-moved'], waiting: ['Waiting', 'k-waiting'],
  reverted: ['Reverted', 'k-reverted'], live: ['Live', 'k-live'], you: ['You', 'k-you'], agent: ['Agent', 'k-agent'],
};

function Ask({ f, dispatch, onReason }) {
  const [text, setText] = useState('');
  return (
    <li className="ask">
      <div className="row1" style={{ padding: 0 }}>
        <span className="who">{f.agent} asks</span><span className="muted small">{f.since}</span>
      </div>
      <p className="says">&ldquo;{f.agentSays}&rdquo;</p>
      <p className="muted small"><Link href={`/issues/${f.number}`}>#{f.number} {f.title}</Link></p>
      <div className="btns">
        {f.needs === 'nudge' && (<><button className="btn primary" onClick={() => dispatch({ type: 'nudge', id: f.id })}>Message the maintainer</button><button className="btn ghost" onClick={() => dispatch({ type: 'nudge', id: f.id, escalate: true })}>Escalate to the project lead</button></>)}
        {f.needs === 'unstick' && <button className="btn primary" onClick={() => dispatch({ type: 'unstick', id: f.id })}>Yes, ask someone else</button>}
        {f.needs === 'reverted' && <button className="btn primary" onClick={() => onReason(f)}>Tell the agent why</button>}
      </div>
      <form className="reply" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; dispatch({ type: 'reply', id: f.id, text: text.trim() }); setText(''); }}>
        <label className="sr" htmlFor={`r-${f.id}`}>Reply to {f.agent}</label>
        <input id={`r-${f.id}`} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Or tell ${f.agent} something in your own words`} />
        <button className="btn ghost" type="submit" disabled={!text.trim()}>Send</button>
      </form>
    </li>
  );
}

function NeedInput() {
  const { fixes, proposed, dispatch } = useStore();
  const [modal, setModal] = useState(null);
  const needs = proposed ? fixes.filter((f) => f.state === 'needs-you') : [];
  return (
    <>
      {needs.length === 0 ? (
        <div className="empty"><strong>Nothing here right now.</strong>No agent is waiting on an answer.</div>
      ) : (
        <>
          <p className="muted small"><Chip kind="prop">Proposed</Chip> The Inbox also covers what happens after a fix leaves Ziki: a fix stuck at a release gate, a reviewer that is stuck, or a revert nobody explained.</p>
          <ul className="asks">{needs.map((f) => <Ask key={f.id} f={f} dispatch={dispatch} onReason={setModal} />)}</ul>
        </>
      )}
      {modal && (
        <ReasonModal
          title={`Why was #${modal.number} reverted?`}
          intro="Your answer is added to the agent's standing instructions, so it does not repeat the mistake, and it resubmits the fix in smaller batches."
          confirmLabel="Send to the agent"
          onClose={() => setModal(null)}
          onConfirm={(reason, rule) => { dispatch({ type: 'resubmit', id: modal.id, reason, rule }); setModal(null); }}
        />
      )}
    </>
  );
}

function Updates() {
  const { fixes, feed } = useStore();
  const byId = Object.fromEntries(fixes.map((f) => [f.id, f]));
  const moving = fixes.filter((f) => f.state === 'moving').length;
  const live = fixes.filter((f) => f.state === 'live').length;
  const reverted = fixes.filter((f) => f.steps.some((s) => s.status === 'reverted')).length;
  const needs = fixes.filter((f) => f.state === 'needs-you').length;
  return (
    <>
      <p className="muted small"><Chip kind="prop">Proposed</Chip> Today, Ziki's notifications are comments. Nothing tells you what happened to a fix after its pull request: merged, on staging, live, or reverted. Here the agents report it, in their own words.</p>
      <ul className="stats" aria-label="Summary">
        <li><strong>{moving}</strong><span>moving on their own</span></li>
        <li><strong>{live}</strong><span>live</span></li>
        <li><strong>{reverted}</strong><span>reverted</span></li>
        <li className={needs ? 'hot' : ''}><strong>{needs}</strong><span>{needs === 1 ? 'needs' : 'need'} my answer</span></li>
      </ul>
      <ul className="feed">
        {feed.map((u) => {
          const [label, cls] = KIND[u.kind] || KIND.done;
          const fix = byId[u.fixId];
          return (
            <li key={u.id} className="update">
              <span className={`kind ${cls}`}>{label}</span>
              <div style={{ flex: 1 }}>
                <p><strong>{u.agent}:</strong> {u.text}</p>
                {fix && <Link className="small" href={`/issues/${fix.number}`}>#{fix.number} {fix.title}</Link>}
              </div>
              <span className="muted small">{u.time}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Releases() {
  const { fixes } = useStore();
  const ORDER = ['central', 'staging', 'production'];
  const st = (f, k) => f.steps.find((x) => x.key === k)?.status;
  const loc = (f) => {
    if (f.state === 'stopped') return null;
    for (let i = 0; i < 3; i++) {
      const v = st(f, ORDER[i]);
      if (v === 'reverted') return { gate: ORDER[i], kind: 'reverted' };
      if (v === 'active') return { gate: ORDER[i], kind: 'arriving' };
      if (v === 'pending' || !v) { const prev = i === 0 ? st(f, 'decision') : st(f, ORDER[i - 1]); return prev === 'done' ? { gate: ORDER[i], kind: 'waiting' } : null; }
    }
    return { gate: 'production', kind: 'live' };
  };
  const placed = fixes.map((f) => ({ f, loc: loc(f) }));
  const before = placed.filter((p) => !p.loc && p.f.state !== 'stopped' && p.f.state !== 'rolled-back').length;
  const KINDS = [['arriving', 'Arriving now'], ['waiting', 'Waiting for this gate'], ['reverted', 'Reverted here'], ['live', 'Live']];
  return (
    <>
      <p className="muted small"><Chip kind="prop">Proposed</Chip> Every fix at every gate, and who holds it, so nobody has to ask a maintainer on GitHub. {before > 0 && <>{before} more {before === 1 ? 'fix has' : 'fixes have'} not reached central staging yet.</>}</p>
      <div className="gates">
        {GATES.map((g) => (
          <section key={g.key} className="card gate" aria-labelledby={`g-${g.key}`}>
            <h3 id={`g-${g.key}`}>{g.label}</h3>
            <p className="muted small">Held by: {g.holder}</p>
            {KINDS.map(([k, label]) => {
              const items = placed.filter((p) => p.loc && p.loc.gate === g.key && p.loc.kind === k).map((p) => p.f);
              if (!items.length) return null;
              return (<div key={k}><div className={`mini ${k === 'reverted' ? 'warn' : ''}`}>{label}</div><ul className="glist">{items.map((f) => <li key={f.id}><Link href={`/issues/${f.number}`}><span className="num">#{f.number}</span> {f.title}</Link></li>)}</ul></div>);
            })}
            {!placed.some((p) => p.loc && p.loc.gate === g.key) && <p className="muted small">Nothing here</p>}
          </section>
        ))}
      </div>
    </>
  );
}

function Instructions() {
  const { instructions, rules, dispatch } = useStore();
  const [text, setText] = useState('');
  const [talk, setTalk] = useState('');
  return (
    <>
      <p className="muted small"><Chip kind="have" /> Ziki already lets you give each agent standing instructions and send it messages, under Settings, Agents, Messages. <Chip kind="prop">Proposed</Chip> Bring them into the Inbox, next to the work, and add reasons from reverts automatically.</p>

      <div className="card" style={{ marginBottom: '.8rem' }}>
        <div className="eyebrow">Send a message to my agents <Chip kind="have">Exists, moved here</Chip></div>
        <form className="reply" style={{ marginTop: 0 }} onSubmit={(e) => { e.preventDefault(); if (!talk.trim()) return; dispatch({ type: 'talk', text: talk.trim() }); setTalk(''); }}>
          <label className="sr" htmlFor="talk">Message to my agents</label>
          <input id="talk" value={talk} onChange={(e) => setTalk(e.target.value)} placeholder='For example: "what happened to my fixes?" or "find me more work"' />
          <button className="btn primary" type="submit" disabled={!talk.trim()}>Send</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '.8rem' }}>
        <div className="eyebrow">Standing instructions <Chip kind="have">Exists, moved here</Chip></div>
        <ul className="decisions">
          {instructions.map((i) => (
            <li key={i.id}><span>{i.text}</span><button className="btn ghost" onClick={() => dispatch({ type: 'removeInstruction', id: i.id })} aria-label={`Remove: ${i.text}`}>Remove</button></li>
          ))}
        </ul>
        <form className="reply" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; dispatch({ type: 'addInstruction', text: text.trim() }); setText(''); }}>
          <label className="sr" htmlFor="newi">Add an instruction</label>
          <input id="newi" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an instruction, for example: never touch the billing pages" />
          <button className="btn" type="submit" disabled={!text.trim()}>Add</button>
        </form>
      </div>

      <div className="card">
        <div className="eyebrow">Added from reverts <Chip kind="prop">Proposed</Chip></div>
        <p className="muted small">When you explain why a fix was reverted, your answer is added here and to the agent's standing instructions. This is the agents.md the team asked for.</p>
        <ul className="decisions">{rules.map((r) => <li key={r.id}><span>{r.text}</span><span className="muted small">{r.source}</span></li>)}</ul>
      </div>
    </>
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
    ['instructions', 'Instructions', null, true],
    ['design', 'Design feedback needed', 0, false],
    ['ideas', 'New ideas', 1, false],
  ].filter((t) => proposed || !t[3]);
  const active = TABS.find((t) => t[0] === tab) ? tab : 'need';
  return (
    <>
      <div className="howto">
        <div>
          <div className="row1" style={{ padding: 0, justifyContent: 'flex-start' }}><Icon name="inbox" /><strong>How the Inbox works</strong></div>
          <p className="muted" style={{ marginTop: '.4rem' }}>Agents work through issues on their own and stop here when they need a person: to answer a question, give feedback on a design, or weigh in on a new idea.</p>
        </div>
        <div className="agentbox">
          <div className="eyebrow">Your agents</div>
          <div className="nm">{AGENTS[0].name} <span className="tag">Standing by</span></div>
          <p className="muted small">{AGENTS[0].stat}</p>
        </div>
      </div>
      <nav className="subtabs" aria-label="Inbox sections" style={{ paddingLeft: 0 }}>
        {TABS.map(([k, label, n, isNew]) => (
          <Link key={k} href={k === 'need' ? '/issues' : `/issues?tab=${k}`} className={active === k ? 'on' : ''}>
            {label} {n !== null && <span className="count" style={{ background: '#22324f' }}>{n}</span>} {isNew && <Chip />}
          </Link>
        ))}
      </nav>
      <div className="panel">
        {active === 'need' && <NeedInput />}
        {active === 'updates' && <Updates />}
        {active === 'releases' && <Releases />}
        {active === 'instructions' && <Instructions />}
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
