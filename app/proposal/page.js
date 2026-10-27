import Link from 'next/link';
import { MY_PROBLEM } from '../../lib/myProblem';

export const metadata = { title: 'The proposal · Ziki fix journey' };

export default function Proposal() {
  return (
    <article className="prose">
      <p><Link href="/issues">← Back to the mock-up</Link></p>
      <h1>See what happens to my agents&rsquo; fixes, and deal with it in one click</h1>

      <h2>The problem</h2>
      <p>
        Agents do the work. But after a fix leaves for GitHub, the person who owns the agent cannot see what happens to it, and when it is stuck or rejected
        they find out late, by accident, and with no way to act on it from Ziki.
      </p>
      {MY_PROBLEM.map((t, i) => <p key={i}>{t}</p>)}

      <h2>The one workflow</h2>
      <p>The time between a fix leaving Ziki and being live. Ziki&rsquo;s own look is unchanged: same layout, colours and fonts. Only the new parts are added, in the style of GitHub&rsquo;s notification list.</p>

      <h2>What I propose</h2>
      <ol>
        <li><strong>Releases shows where every fix is after its pull request:</strong> Central staging, Staging, Production. Merged fixes and stuck ones sit side by side, and anything stuck has a button on its row.</li>
        <li><strong>Updates shows what has already happened:</strong> merged, moved to the next stage, live. It is history, so it has no buttons.</li>
        <li><strong>A rejected fix is explained by the agent, not by me.</strong> The agent writes what went wrong and a rule for next time. I review it and approve it.</li>
        <li><strong>Messages to maintainers are small, so the agent can send them itself.</strong> One Auto-send switch: off, I read each draft first; on, the agents send everything.</li>
        <li><strong>A journey on each fix after its pull request</strong>, one line per step, with a button on the step that is stuck or rejected.</li>
      </ol>

      <h2>What Ziki already has</h2>
      <table className="cmp">
        <thead><tr><th>Already in Ziki</th><th>In this proposal</th></tr></thead>
        <tbody>
          <tr><td>An Inbox where agents stop and ask me something</td><td>Kept as it is. Only the row style changes.</td></tr>
          <tr><td>Agent decisions on an issue</td><td>Kept. One addition: a verdict that disagrees is checked against what is live.</td></tr>
          <tr><td>A GitHub PR box</td><td>Replaced by the journey.</td></tr>
          <tr><td>Notifications (comments)</td><td>Outcome updates are added.</td></tr>
        </tbody>
      </table>

      <h2>How to look at it</h2>
      <ol>
        <li>Switch between <strong>Current Ziki</strong> and <strong>With proposal</strong> at the top. New parts are marked <em>Proposed</em>.</li>
        <li>Open <strong>Releases</strong> and press each stage. Press <strong>Message</strong> on a waiting fix, or <strong>Review</strong> on a rejected one.</li>
        <li>Turn on <strong>Auto-send</strong> to see the agents message every maintainer themselves.</li>
        <li><strong>Need your input</strong> is Ziki&rsquo;s own Inbox, where an agent stops and asks me something. It is shown in the same row style.</li>
      </ol>
      <p className="muted small">A design mock-up with sample data. It is not connected to Ziki.</p>
    </article>
  );
}
