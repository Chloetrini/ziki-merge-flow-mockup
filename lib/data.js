// Sample data only. Nothing here is real and nothing talks to a backend.

export const STEPS = [
  { key: 'reported', label: 'Reported' },
  { key: 'fixed', label: 'Fix written by agent' },
  { key: 'pr', label: 'Pull request opened' },
  { key: 'checks', label: 'Checks passed' },
  { key: 'verdicts', label: '2 independent verdicts' },
  { key: 'decision', label: 'Merge decision' },
  { key: 'central', label: 'Central staging' },
  { key: 'staging', label: 'Staging' },
  { key: 'production', label: 'Production' },
];

// status per step: done | active | blocked | pending | reverted
const s = (...arr) => STEPS.map((st, i) => ({ ...st, status: arr[i] || 'pending' }));

export const INITIAL_FIXES = [
  {
    id: 'f1',
    number: 1401,
    title: 'Footer logo link has no accessible name',
    area: 'Web',
    risk: 'safe',
    riskWhy: '1 file, 1 line, no layout change, no auth or payment code',
    agent: 'Solver Agent',
    summary: 'Adds an aria-label to the footer logo link so screen readers announce it.',
    state: 'moving',
    holder: 'Release agent',
    since: '14 min ago',
    steps: s('done', 'done', 'done', 'done', 'done', 'done', 'done', 'active'),
    events: [
      ['10:02', 'Reported by Reviewer Agent'],
      ['10:09', 'Fix written (1 line)'],
      ['10:11', 'Checks passed: build, lint, tests'],
      ['10:19', '2 independent agents confirmed'],
      ['10:20', 'Auto-merged: small and safe'],
      ['10:34', 'Reached central staging; moving to staging'],
    ],
  },
  {
    id: 'f2',
    number: 1402,
    title: 'Redesign the channel sidebar and navigation',
    area: 'Web',
    risk: 'high',
    riskWhy: 'A redesign: new layout, touches navigation everywhere. You told your agents to ask first.',
    agent: 'Solver Agent 2',
    summary: 'Moves the channel list into a new collapsible sidebar and renames three navigation items.',
    state: 'needs-you',
    needs: 'approve',
    agentSays: "I'd like to merge this, but it changes navigation across 47 files, and I'm not allowed to merge a redesign by myself. Is it OK to go ahead?",
    holder: 'You',
    since: '2 h ago',
    steps: s('done', 'done', 'done', 'done', 'done', 'active'),
    events: [
      ['08:40', 'Reported'],
      ['09:55', 'Fix written (47 files)'],
      ['10:10', 'Checks passed'],
      ['10:22', '2 independent agents confirmed it works'],
      ['10:23', 'Held for you: this looks like a redesign, so it cannot merge on its own'],
    ],
  },
  {
    id: 'f3',
    number: 1403,
    title: 'Message search loses matches when the query has trailing spaces',
    area: 'Web',
    risk: 'safe',
    riskWhy: '2 files, behaviour fix, covered by tests',
    agent: 'Solver Agent',
    summary: 'Trims the search text before it is sent so extra spaces do not hide results.',
    state: 'needs-you',
    needs: 'unstick',
    agentSays: "My fix is ready and its checks passed, but I'm stuck on the second independent reviewer for over 3 hours. Shall I ask someone else?",
    holder: 'Waiting on a second independent reviewer',
    since: '3 h 10 min',
    steps: s('done', 'done', 'done', 'done', 'blocked'),
    events: [
      ['07:15', 'Reported'],
      ['07:50', 'Fix written'],
      ['08:02', 'Checks passed'],
      ['08:30', 'Verdict 1 of 2 received'],
      ['10:25', 'Still waiting for verdict 2. Your own agents cannot count as independent.'],
    ],
  },
  {
    id: 'f4',
    number: 1404,
    title: 'Batch of 14 website fixes (copy, labels, titles)',
    area: 'Web',
    risk: 'safe',
    riskWhy: 'Mostly text and labels, but 95 files in one merge',
    agent: 'Team merge',
    summary: 'Fourteen small fixes sent together. They reached staging and were reverted in one go.',
    state: 'needs-you',
    needs: 'reverted',
    agentSays: "Our 14 fixes were reverted on staging and I can't see why. Nobody has said. Can you tell me what went wrong, so I can fix it and not repeat it?",
    holder: 'You: no reason has been recorded',
    since: '4 days ago',
    steps: s('done', 'done', 'done', 'done', 'done', 'done', 'done', 'reverted'),
    events: [
      ['Mon 09:41', 'Merged to staging'],
      ['Thu 09:33', 'Reverted on staging by a maintainer'],
      ['Thu 15:28', 'Reverted on central staging too'],
      ['Now', 'No reason recorded. The agents cannot learn from it.'],
    ],
  },
  {
    id: 'f5',
    number: 1405,
    title: 'Notification bell shows a stale test banner',
    area: 'Desktop',
    risk: 'safe',
    riskWhy: '1 file, removes a leftover test message',
    agent: 'Solver Agent',
    summary: 'Removes the "will fire in 5 seconds" test banner from the bell.',
    state: 'moving',
    holder: 'Checks running',
    since: '6 min ago',
    steps: s('done', 'done', 'done', 'active'),
    events: [
      ['11:01', 'Reported'],
      ['11:12', 'Fix written'],
      ['11:15', 'Checks running'],
    ],
  },
  {
    id: 'f6',
    number: 1398,
    title: 'Home page title shows only "Home"',
    area: 'Web',
    risk: 'safe',
    riskWhy: '1 file, metadata only',
    agent: 'Solver Agent',
    summary: 'Gives the home page a descriptive title for search and browser tabs.',
    state: 'live',
    holder: 'Live in production',
    since: 'yesterday',
    steps: s('done', 'done', 'done', 'done', 'done', 'done', 'done', 'done', 'done'),
    events: [
      ['Yesterday 09:00', 'Reported'],
      ['Yesterday 09:20', 'Fix written'],
      ['Yesterday 09:45', 'Auto-merged'],
      ['Yesterday 12:10', 'Live in production'],
    ],
  },
];

export const INITIAL_RULES = [
  { id: 'r1', text: 'Never change a route name without updating every link to it.', source: 'Rolled back: fix #1360' },
  { id: 'r2', text: 'Do not merge more than 20 files in one batch; split big batches.', source: 'Rolled back: fix #1371' },
  { id: 'r3', text: 'Layout, navigation and theme changes always go to a human first.', source: 'Team policy' },
];

export const GATES = [
  { key: 'central', label: 'Central staging', holder: 'Central staging maintainer' },
  { key: 'staging', label: 'Staging', holder: 'Staging maintainer' },
  { key: 'production', label: 'Production', holder: 'Production maintainer' },
];

// Updates the agents post to the person, newest first. Written in the agent's own voice.
export const INITIAL_FEED = [
  { id: 'u1', kind: 'moved', time: '10:34', fixId: 'f1', agent: 'Solver Agent', text: "Footer logo fix passed all checks and was merged on its own. It is now on its way to staging." },
  { id: 'u2', kind: 'waiting', time: '10:25', fixId: 'f3', agent: 'Solver Agent', text: "Search fix is ready, but I am still waiting for a second independent reviewer." },
  { id: 'u3', kind: 'waiting', time: '10:23', fixId: 'f2', agent: 'Solver Agent 2', text: "Sidebar redesign is ready, but I need your OK before I can merge it." },
  { id: 'u4', kind: 'done', time: '11:12', fixId: 'f5', agent: 'Solver Agent', text: "I wrote the fix for the stale notification banner. Checks are running now." },
  { id: 'u5', kind: 'reverted', time: 'Thu', fixId: 'f4', agent: 'Team merge', text: "The batch of 14 fixes was reverted on staging and central staging. No reason was given." },
  { id: 'u6', kind: 'live', time: 'Yesterday', fixId: 'f6', agent: 'Solver Agent', text: "The home page title fix is live in production." },
];

// What I have told my agents to do, in my own words.
export const INITIAL_INSTRUCTIONS = [
  { id: 'i1', text: 'Merge every fix yourself. If you are not sure, you can ask me before you merge.' },
  { id: 'i2', text: 'Ask me before you do any redesign.' },
  { id: 'i3', text: 'Tell me straight away about any revert.' },
];
