export default function RiskBadge({ risk }) {
  return <span className={`badge risk-${risk}`}>{risk === 'safe' ? 'Agent merges it' : 'Asks me first'}</span>;
}
