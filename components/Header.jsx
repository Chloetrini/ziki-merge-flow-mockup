'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '../lib/store';

const NAV = [
  { href: '/', label: 'My agents' },
  { href: '/releases', label: 'Releases' },
  { href: '/rules', label: 'Rules' },
  { href: '/why', label: 'Why this design' },
];

export default function Header() {
  const path = usePathname();
  const { fixes } = useStore();
  const n = fixes.filter((f) => f.state === 'needs-you').length;
  return (
    <header className="header">
      <div className="bar">
        <Link href="/" className="brand" aria-label="Ziki home">
          <span className="logo" aria-hidden="true">Z</span>
          <span>Ziki</span>
        </Link>
        <span className="project">Zedu</span>
        <nav aria-label="Main">
          {NAV.map((l) => {
            const active = l.href === '/' ? path === '/' || path.startsWith('/fix') : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                {l.label}
                {l.href === '/' && n > 0 ? <span className="count">{n}</span> : null}
              </Link>
            );
          })}
        </nav>
        <Link href="/login" className="avatar" aria-label="Account (sign-in demo)">C</Link>
      </div>
      <div className="banner">Design mock-up with sample data. Nothing here is connected to the real Ziki.</div>
    </header>
  );
}
