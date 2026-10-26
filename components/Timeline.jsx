const ICON = { done: '✓', active: '●', blocked: '!', pending: '', reverted: '↺' };
const WORD = { done: 'Done', active: 'In progress', blocked: 'Stuck', pending: 'Not yet', reverted: 'Reverted' };

export default function Timeline({ steps }) {
  return (
    <ol className="timeline" aria-label="Fix journey from report to production">
      {steps.map((s) => (
        <li key={s.key} className={`tl ${s.status}`}>
          <span className="dot" aria-hidden="true">{ICON[s.status]}</span>
          <span className="tl-label">{s.label}</span>
          <span className="tl-status">{WORD[s.status]}</span>
        </li>
      ))}
    </ol>
  );
}
