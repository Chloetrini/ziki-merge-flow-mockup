'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '../lib/store';
import { AGENTS } from '../lib/data';
import { Icon, Chip } from './Marks';

export default function Shell({ children }) {
  const { proposed, feed, dispatch } = useStore();
  const [open, setOpen] = useState(null);
  const toggle = (k) => setOpen(open === k ? null : k);
  const outcome = feed.filter((u) => u.kind !== 'you' && u.kind !== 'agent').slice(0, 3);

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/issues" className="brand" aria-label="Ziki">
            <svg className="zmark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h13l-9 9h10v5H5l9-9H5z" fill="#3d6fe3" /></svg>
            <span>ziki</span>
          </Link>
          <span className="divider" aria-hidden="true" />
          <button className="proj" type="button">Zedu <Icon name="chev" /></button>
          <nav className="tabs3" aria-label="Areas">
            <Link href="/issues" className="on"><Icon name="product" /> Product</Link>
            <Link href="/issues"><Icon name="marketing" /> Marketing</Link>
            <Link href="/issues"><Icon name="security" /> Security</Link>
          </nav>
          <div className="right">
            <button className="pill" type="button" aria-expanded={open === 'agents'} onClick={() => toggle('agents')}>
              <Icon name="robot" /> Agents <Icon name="chev" />
            </button>
            <span className="pill"><span className="avatar" aria-hidden="true">C</span> <span className="uname">Chloe Egbukwu</span></span>
            <span className="pill gold"><Icon name="trophy" /> 5139 pts</span>
            <button className="bell" type="button" aria-label="Notifications, 33 unread" aria-expanded={open === 'bell'} onClick={() => toggle('bell')}>
              <Icon name="bell" /><span className="badge-n">33</span>
            </button>
            {open === 'agents' && (
              <div className="menu" role="menu">
                <h3>Project agents</h3>
                {AGENTS.map((a) => (
                  <div className="mi" key={a.name} role="menuitem"><span className="avatar sm">{a.initials}</span><div><div>{a.name}</div><div className="muted small">{a.level}</div></div></div>
                ))}
                <div className="mi"><Link href="/issues">Manage agents</Link></div>
              </div>
            )}
            {open === 'bell' && (
              <div className="menu" role="menu">
                <h3>Notifications</h3>
                {proposed && outcome.map((u) => (
                  <div className="mi" key={u.id}><span className="dot prop" /><div><div className="small">{u.agent}: {u.text}</div><div className="muted small">{u.time} <Chip /></div></div></div>
                ))}
                {[
                  ['Bolu Triager commented on “Add channel button does nothing…”', 'Oct 26, 1:17 AM'],
                  ['Bolu Triager commented on “Desktop DMs: improve the empty Select a conversation screen”', 'Oct 26, 1:16 AM'],
                  ['Bolu Reviewer commented on “Mobile app mixes organization and organisation spellings”', 'Oct 26, 1:16 AM'],
                ].map(([t, d]) => (
                  <div className="mi" key={t}><span className="dot" /><div><div className="small">{t}</div><div className="muted small">{d}</div></div></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="banner">
        <div className="banner-in">
          <strong>Design proposal mock-up</strong>
          <span>Sample data, not connected to the real Ziki.</span>
          <span className="seg" role="group" aria-label="Which version to show">
            <button type="button" aria-pressed={!proposed} onClick={() => dispatch({ type: 'setProposed', value: false })}>Current Ziki</button>
            <button type="button" aria-pressed={proposed} onClick={() => dispatch({ type: 'setProposed', value: true })}>With proposal</button>
          </span>
          <span><Chip /> marks what is new. <Link href="/proposal">Read the proposal</Link></span>
        </div>
      </div>
      {children}
    </>
  );
}
