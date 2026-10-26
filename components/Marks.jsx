'use client';
import { useStore } from '../lib/store';

// Renders its children only in "With proposal" view.
export function Prop({ children }) {
  const { proposed } = useStore();
  return proposed ? children : null;
}
// Renders its children only in "Current Ziki" view.
export function Current({ children }) {
  const { proposed } = useStore();
  return proposed ? null : children;
}
export const Chip = ({ kind = 'prop', children }) => <span className={`chip ${kind}`}>{children || (kind === 'prop' ? 'Proposed' : 'Already in Ziki')}</span>;

export const Icon = ({ name }) => {
  const p = {
    search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></>,
    filter: <path d="M4 5h16l-6 8v6l-4-2v-4z" />,
    sort: <path d="M8 5v14M8 5L5 8M8 5l3 3M16 19V5M16 19l-3-3M16 19l3-3" />,
    plus: <path d="M12 5v14M5 12h14" />,
    bell: <><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 004 0" /></>,
    robot: <><rect x="5" y="8" width="14" height="10" rx="3" /><path d="M12 8V5M9 13h.01M15 13h.01" /></>,
    chev: <path d="M7 10l5 5 5-5" />,
    inbox: <><path d="M4 13l2-8h12l2 8v5H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></>,
    trophy: <><path d="M8 5h8v5a4 4 0 01-8 0z" /><path d="M8 7H5v1a3 3 0 003 3M16 7h3v1a3 3 0 01-3 3M12 14v4M9 19h6" /></>,
    product: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="1.5" /></>,
    marketing: <path d="M4 10v4h3l6 4V6L7 10zM17 9a4 4 0 010 6" />,
    security: <path d="M12 4l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V7z" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    undo: <><path d="M9 7L5 11l4 4" /><path d="M5 11h9a5 5 0 010 8h-3" /></>,
    arrow: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
    check: <path d="M5 12l4 4 10-10" />,
    'gh-open': <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" /></>,
    'gh-done': <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>,
    'gh-closed': <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
    'gh-merge': <><circle cx="7" cy="6" r="2" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="12" r="2" /><path d="M7 8v8M9 12h6" /></>,
    alert: <><circle cx="12" cy="12" r="8" /><path d="M12 8v5M12 16h.01" /></>,
  }[name];
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>
  );
};
