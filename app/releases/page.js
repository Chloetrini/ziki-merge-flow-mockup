'use client';
import Link from 'next/link';
import { useStore } from '../../lib/store';
import { GATES } from '../../lib/data';

const ORDER = ['central', 'staging', 'production'];
const stepOf = (f, key) => f.steps.find((s) => s.key === key)?.status;

// A fix sits at the first release gate it has not finished.
function location(f) {
  if (f.state === 'stopped') return null;
  for (let i = 0; i < ORDER.length; i++) {
    const st = stepOf(f, ORDER[i]);
    if (st === 'reverted') return { gate: ORDER[i], kind: 'reverted' };
    if (st === 'active') return { gate: ORDER[i], kind: 'arriving' };
    if (st === 'pending' || !st) {
      const prevDone = i === 0 ? stepOf(f, 'decision') === 'done' : stepOf(f, ORDER[i - 1]) === 'done';
      return prevDone ? { gate: ORDER[i], kind: 'waiting' } : null;
    }
  }
  return { gate: 'production', kind: 'live' };
}

const KINDS = [
  ['arriving', 'Arriving now'],
  ['waiting', 'Waiting for this gate to take it'],
  ['reverted', 'Reverted here'],
  ['live', 'Live'],
];

export default function Releases() {
  const { fixes } = useStore();
  const placed = fixes.map((f) => ({ f, loc: location(f) }));
  const before = placed.filter((p) => !p.loc && p.f.state !== 'stopped' && p.f.state !== 'rolled-back').length;

  return (
    <>
      <h1>Releases</h1>
      <p className="lead">
        Every fix, at every gate, and who is holding it. No more chasing a maintainer on GitHub to find out.
        {before > 0 && <> {before} more {before === 1 ? 'fix has' : 'fixes have'} not reached central staging yet: they are still being checked or waiting on a decision.</>}
      </p>
      <div className="gates">
        {GATES.map((g) => (
          <section key={g.key} className="panel gate" aria-labelledby={`g-${g.key}`}>
            <h2 id={`g-${g.key}`}>{g.label}</h2>
            <p className="muted small">Held by: {g.holder}</p>
            {KINDS.map(([kind, label]) => {
              const items = placed.filter((p) => p.loc && p.loc.gate === g.key && p.loc.kind === kind).map((p) => p.f);
              if (!items.length) return null;
              return (
                <div key={kind}>
                  <h3 className={`mini ${kind === 'reverted' ? 'warn' : ''}`}>{label}</h3>
                  <ul className="rows tight">
                    {items.map((f) => (
                      <li key={f.id}>
                        <Link href={`/fix/${f.id}`} className="rowlink">
                          <span className="num">#{f.number}</span>
                          <span className="grow">{f.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {!placed.some((p) => p.loc && p.loc.gate === g.key) && <p className="muted small">Nothing here</p>}
          </section>
        ))}
      </div>
    </>
  );
}
