// Sample data only. Nothing here talks to a backend.
// Issue rows that come from the real Ziki list are copied for realism; the fixes below the line are invented.

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
const s = (...arr) => STEPS.map((st, i) => ({ ...st, status: arr[i] || 'pending' }));
const D = 'done';
const done = (n) => Array(n).fill(D);

export const REAL_ROWS = [
  { number: 2, votes: 43, title: 'Bug: Kebab menu ("More options") in DM header is unresponsive on the desktop app', labels: [], who: 'MR', age: '2 hours ago' },
  { number: 7, votes: 37, title: '[Design] Hero avatar row under "Join 10,000+ students" doesn\'t look like real, varied learners', labels: [], who: 'EA', age: '2 hours ago' },
  { number: 90, votes: 35, title: 'Signing Out of Workspace and Deleting Organization Both Show Loading Spinners Simultaneously', labels: ['Fix', 'Web'], who: 'PA', age: '19 hours ago' },
  { number: 148, votes: 33, title: 'Footer Facebook icon links to a broken URL', labels: ['Fix', 'Web'], who: 'OC', age: '14 hours ago' },
  { number: 181, votes: 32, title: '[Content] Login screen says “Already have an account? Sign up” and “Sign up with Google/Apple”', labels: ['Fix', 'Desktop'], who: 'KO', age: '10 hours ago' },
  { number: 107, votes: 29, title: "[Design] Desktop Sign up screen doesn't fit in the default window", labels: ['Design', 'Desktop'], who: '99', age: '14 hours ago' },
  { number: 183, votes: 27, title: '[Bug] Voice message shows as "Video" in the chats list', labels: ['Fix', 'Mobile'], who: 'KO', age: '10 hours ago' },
];

// Real wording of the real #148 page, to compare the current page with the proposed one.
export const ISSUE_148 = {
  description: [
    'The Facebook icon in the site footer goes nowhere. Its link is https://www.facebook.com/profile.php with no profile ID on the end, so it cannot resolve to any page. The icon is dead on every page of the site.',
    'Expected: the icon opens a real Zedu Facebook page. If there is not one, the icon should be removed rather than ship a dead link.',
  ],
  decisions: [
    ['Smithy', 'Confirmed it’s real · Low'],
    ["Lahrry's Claude (reviewer)", 'Not a real issue'],
    ['Stilgar', 'Confirmed it’s real · Medium'],
    ['ChatGPT Assistant', 'Confirmed it’s real · Medium'],
    ["Chizoba's Qoder Review 4", 'Confirmed it’s real · Medium'],
    ['VISION', 'Confirmed it’s real · Medium'],
    ['Apex', 'Confirmed it’s real · Medium'],
    ['Sun Tzu', 'Confirmed it’s real · Medium'],
    ['PlusOne Review 3', 'Confirmed it’s real · Medium'],
    ['Codex', 'Confirmed it’s real · Medium'],
    ["Becca reviwer's-1", 'Confirmed it’s real · Medium'],
    ['Bolu Triager', 'Confirmed it’s real · Medium'],
  ],
  dissent: 'No longer reproduces: on zedu.chat on 22 Oct the footer Facebook link has a profile id.',
};

// Six fixes written by hand: the ones the proposal walks through.
const HAND_FIXES = [
  {
    id: 'f1', number: 1401, title: 'Footer logo link has no accessible name', labels: ['Fix', 'Web'], votes: 4, who: 'SA',
    agent: 'Solver Agent',
    summary: 'Adds an aria-label to the footer logo link so screen readers announce it.',
    state: 'moving', holder: 'Release agent', since: '14 min ago',
    steps: s(...done(7), 'active'),
    events: [['10:02', 'Reported by Reviewer Agent'], ['10:09', 'Fix written (1 line)'], ['10:11', 'Checks passed'], ['10:19', '2 independent agents confirmed'], ['10:20', 'Merged by the agent, as instructed'], ['10:34', 'Reached central staging; moving to staging']],
  },
  {
    id: 'f2', number: 1402, title: 'Settings page shows the wrong country code', labels: ['Fix', 'Web'], votes: 9, who: 'S2',
    agent: 'Solver Agent 2',
    summary: 'Shows the full country name instead of a code like "Za" on the organisation settings page.',
    state: 'needs-you', needs: 'nudge',
    agentSays: "Waiting 2 days at central staging. I can't pass that gate myself.",
    holder: 'Central staging maintainer', since: '2 days',
    steps: s(...done(6), 'active'),
    events: [['Sat 09:10', 'Reported'], ['Sat 10:00', 'Fix written'], ['Sat 10:20', 'Checks passed'], ['Sat 11:30', '2 independent agents confirmed it works'], ['Sat 11:45', 'Merged by the agent, as instructed'], ['Sat 11:50', 'Sent to central staging'], ['Now', 'Still waiting at central staging after 2 days']],
  },
  {
    id: 'f3', number: 1403, title: 'Message search loses matches when the query has trailing spaces', labels: ['Fix', 'Web'], votes: 6, who: 'SA',
    agent: 'Solver Agent',
    summary: 'Trims the search text before it is sent so extra spaces do not hide results.',
    state: 'needs-you', needs: 'unstick',
    agentSays: 'Checks passed. Stuck on a second independent reviewer for 3 hours.',
    holder: 'Waiting on a second independent reviewer', since: '3 h 10 min',
    steps: s(...done(4), 'blocked'),
    events: [['07:15', 'Reported'], ['07:50', 'Fix written'], ['08:02', 'Checks passed'], ['08:30', 'Verdict 1 of 2 received'], ['10:25', 'Still waiting for verdict 2. Your own agents cannot count as independent.']],
  },
  {
    id: 'f4', number: 1404, title: 'Batch of 14 website fixes (copy, labels, titles)', labels: ['Fix', 'Web'], votes: 14, who: 'TM',
    agent: 'Team merge',
    summary: 'Fourteen small fixes sent together. They reached staging and were rejected in one go.',
    state: 'needs-you', needs: 'reverted',
    agentSays: 'Rejected at staging. My guess: the batch was too big to review (95 files).',
    proposedReason: 'The batch was 95 files in one merge, too big to review.',
    proposedRule: 'Split any batch over 20 files before it goes to staging.',
    holder: 'Agent proposed a note', since: '4 days ago',
    steps: s(...done(7), 'reverted'),
    events: [['Mon 09:41', 'Merged to staging'], ['Thu 09:33', 'Rejected at staging by a maintainer'], ['Thu 15:28', 'Rejected at central staging too'], ['Now', 'No reason recorded. The agent has proposed one.']],
  },
  {
    id: 'f5', number: 1405, title: 'Notification bell shows a stale test banner', labels: ['Fix', 'Desktop'], votes: 3, who: 'SA',
    agent: 'Solver Agent',
    summary: 'Removes the "will fire in 5 seconds" test banner from the bell.',
    state: 'moving', holder: 'Checks running', since: '6 min ago',
    steps: s(...done(3), 'active'),
    events: [['11:01', 'Reported'], ['11:12', 'Fix written'], ['11:15', 'Checks running']],
  },
  {
    id: 'f6', number: 1398, title: 'Home page title shows only "Home"', labels: ['Fix', 'Web'], votes: 11, who: 'SA',
    agent: 'Solver Agent',
    summary: 'Gives the home page a descriptive title for search and browser tabs.',
    state: 'live', holder: 'Live in production', since: 'yesterday',
    steps: s(...done(9)),
    events: [['Yesterday 09:00', 'Reported'], ['Yesterday 09:20', 'Fix written'], ['Yesterday 09:45', 'Merged by the agent'], ['Yesterday 12:10', 'Live in production']],
  },
];

// The rest are generated from the index, never from Math.random(), so the server and the browser agree.
const AREAS = ['Settings', 'Sidebar', 'Search', 'Composer', 'Profile', 'Billing', 'Login', 'Channels', 'Notifications', 'Call screen', 'Onboarding', 'Footer'];
const PROBLEMS = ['label has a typo', 'button does nothing on small screens', 'spacing is off', 'icon has no accessible name', 'wrong icon is shown', 'tooltip is cut off', 'loading spinner never stops', 'empty state has no text', 'link goes to a broken page', 'text contrast is too low', 'date shows in the wrong format', 'copy mixes two spellings'];
const AGENT_POOL = [['Solver Agent', 'SA'], ['Solver Agent 2', 'S2'], ['Person Agent', 'PA'], ['Person Agent 2', 'P2'], ['Adloe', 'AD']];
const PLATFORMS = ['Web', 'Desktop', 'Mobile'];
const REVERT_POOL = [
  ['The batch was too big to review.', 'Split any batch over 20 files before it goes to staging.'],
  ['A renamed route broke older links.', 'Update every link when a route name changes.'],
  ['It broke the mobile layout.', 'Check the mobile layout before moving to production.'],
  ['The change passed tests but the screen was never opened.', 'Open the changed screen and check it before merging.'],
];
const MIX = { live: 110, checks: 8, verdicts: 8, central: 12, staging: 8, production: 4, nudge: 18, unstick: 12, reverted: 10 };
const KINDS = Object.entries(MIX).flatMap(([k, n]) => Array(n).fill(k));

function generate(i) {
  const kind = KINDS[(i * 37) % KINDS.length];
  const [agent, who] = AGENT_POOL[i % AGENT_POOL.length];
  const number = 1500 + i;
  const clock = `10:${String((i * 7) % 60).padStart(2, '0')}`;
  const fix = {
    id: `g${i}`, number,
    title: `${AREAS[(i * 5) % 12]}: ${PROBLEMS[(i * 7 + Math.floor(i / 12)) % 12]}`,
    labels: ['Fix', PLATFORMS[i % 3]], votes: 1 + ((i * 7) % 15), who, agent,
    summary: 'A small fix written and checked by the agents.',
    events: [[clock, 'Reported'], [clock, 'Fix written'], [clock, 'Checks passed']],
  };
  const days = 2 + (i % 4);
  switch (kind) {
    case 'live':
      return { ...fix, state: 'live', holder: 'Live in production', since: `${1 + (i % 6)} days ago`, steps: s(...done(9)), events: [...fix.events, [clock, 'Live in production']] };
    case 'checks':
      return { ...fix, state: 'moving', holder: 'Checks running', since: `${5 + (i % 40)} min ago`, steps: s(...done(3), 'active') };
    case 'verdicts':
      return { ...fix, state: 'moving', holder: 'Waiting for verdicts', since: `${1 + (i % 5)} h`, steps: s(...done(4), 'active') };
    case 'central':
      return { ...fix, state: 'moving', holder: 'Central staging maintainer', since: `${1 + (i % 20)} h`, steps: s(...done(6), 'active') };
    case 'staging':
      return { ...fix, state: 'moving', holder: 'Staging maintainer', since: `${1 + (i % 20)} h`, steps: s(...done(7), 'active') };
    case 'production':
      return { ...fix, state: 'moving', holder: 'Production maintainer', since: `${1 + (i % 8)} h`, steps: s(...done(8), 'active') };
    case 'nudge':
      return {
        ...fix, state: 'needs-you', needs: 'nudge', holder: 'Central staging maintainer', since: `${days} days`,
        agentSays: `Waiting ${days} days at central staging. I can't pass that gate myself.`,
        steps: s(...done(6), 'active'), events: [...fix.events, ['Now', `Still waiting at central staging after ${days} days`]],
      };
    case 'unstick':
      return {
        ...fix, state: 'needs-you', needs: 'unstick', holder: 'Waiting on a second independent reviewer', since: `${3 + (i % 9)} h`,
        agentSays: 'Checks passed. Stuck on a second independent reviewer.',
        steps: s(...done(4), 'blocked'), events: [...fix.events, ['Now', 'Still waiting for verdict 2']],
      };
    default: {
      const [reason, rule] = REVERT_POOL[i % REVERT_POOL.length];
      return {
        ...fix, state: 'needs-you', needs: 'reverted', holder: 'Agent proposed a note', since: `${1 + (i % 4)} days ago`,
        agentSays: `Rejected. My guess: ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`,
        proposedReason: reason, proposedRule: rule,
        steps: i % 2 ? s(...done(6), 'reverted') : s(...done(7), 'reverted'),
        events: [...fix.events, ['Now', 'Rejected. The agent has proposed a note.']],
      };
    }
  }
}

export const INITIAL_FIXES = [...HAND_FIXES, ...Array.from({ length: 190 }, (_, i) => generate(i))];

// Added when a person approves the agent's note after a revert. They go into the project's notes.
export const INITIAL_RULES = [
  { id: 'r1', text: 'Never change a route name without updating every link to it.', source: 'From revert of fix #1360' },
  { id: 'r2', text: 'Do not merge more than 20 files in one batch; split big batches.', source: 'From revert of fix #1371' },
];

// What has already happened (merged, moved on, live), newest first. Rejected fixes are not listed here; they are in Need your input. Built from the fixes so the two always agree.
const pickFix = (pred, n) => INITIAL_FIXES.filter(pred).slice(0, n);
const at = (f, k) => f.steps.find((s) => s.key === k)?.status;
export const INITIAL_FEED = [
  ...pickFix((f) => f.id === 'f1', 1).map((f) => ({ kind: 'moved', fixId: f.id, agent: f.agent, text: 'Merged. Now at central staging.', time: '10:34' })),
  ...pickFix((f) => f.id.startsWith('g') && at(f, 'staging') === 'active', 2).map((f, i) => ({ kind: 'moved', fixId: f.id, agent: f.agent, text: 'Moved from central staging to staging.', time: `10:${20 - i * 6}` })),
  ...pickFix((f) => f.id.startsWith('g') && at(f, 'production') === 'active', 1).map((f) => ({ kind: 'moved', fixId: f.id, agent: f.agent, text: 'Moved from staging to production. Going live.', time: '09:58' })),
  ...pickFix((f) => f.id.startsWith('g') && f.state === 'live', 3).map((f, i) => ({ kind: 'live', fixId: f.id, agent: f.agent, text: 'Live in production.', time: ['Yesterday', 'Yesterday', 'Mon'][i] })),
  { kind: 'live', fixId: 'f6', agent: 'Solver Agent', text: 'Live in production.', time: 'Yesterday' },
].map((u, i) => ({ id: `u${i}`, ...u }));

export const AGENTS = [
  { name: 'Adloe', level: 'Reviewer', initials: 'AD' },
  { name: 'Solver Agent', level: 'Contributor', initials: 'SA' },
  { name: 'Person Agent', level: 'Reviewer', initials: 'PA' },
  { name: 'Person Agent 2', level: 'Triager', initials: 'P2' },
];

export const GATES = [
  { key: 'central', label: 'Central staging', holder: 'Central staging maintainer' },
  { key: 'staging', label: 'Staging', holder: 'Staging maintainer' },
  { key: 'production', label: 'Production', holder: 'Production maintainer' },
];

export const stageLabel = (f) => {
  if (f.state === 'rolled-back') return 'Rolled back';
  if (f.state === 'stopped') return 'Stopped';
  if (f.state === 'needs-you') return f.needs === 'reverted' ? 'Reverted' : 'Needs your answer';
  if (f.state === 'live') return 'Live in production';
  const a = f.steps.find((x) => x.status === 'active');
  return a ? ({ checks: 'Checks running', central: 'At central staging', staging: 'At staging', production: 'Going live' }[a.key] || a.label) : 'In progress';
};
