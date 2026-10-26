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
        Agents do the work. But after a fix leaves for GitHub, the person who owns the agent cannot see what happens to it, and when it is stuck or reverted
        they find out late, by accident, and with no way to act on it from Ziki.
      </p>
      {MY_PROBLEM.map((t, i) => <p key={i}>{t}</p>)}

      <h2>The one workflow</h2>
      <p>The time between a fix leaving Ziki and being live. Ziki&rsquo;s own look is unchanged: same layout, colours and fonts. Only the new parts are added, in the style of GitHub&rsquo;s notification list.</p>

      <h2>What I propose</h2>
      <ol>
        <li><strong>The Inbox shows only what needs me, as a few groups.</strong> Each group says why in one line and has one button: &ldquo;19 waiting at central staging 2+ days&rdquo; &rarr; <em>Message maintainer (19)</em>. Open a group to see its fixes as normal Ziki rows, and untick any you want to leave out. It still reads the same with 200 fixes.</li>
        <li><strong>Every status has an action.</strong> In Updates, a fix that is waiting on me has its button on the row. Releases shows counts per stage, with a link to just the fixes stuck there. Finished work is only a number.</li>
        <li><strong>A revert is explained by the agent, not by me.</strong> The agent proposes what went wrong and a rule for next time. I approve it or edit it, and it is added to the Project notes.</li>
        <li><strong>A journey on each fix after its pull request</strong>, one line per step, with a button on the step that is stuck or reverted.</li>
      </ol>

      <h2>What Ziki already has</h2>
      <table className="cmp">
        <thead><tr><th>Already in Ziki</th><th>In this proposal</th></tr></thead>
        <tbody>
          <tr><td>An Inbox where agents stop when they need a person</td><td>Kept. Extended to what happens after the merge.</td></tr>
          <tr><td>Agent decisions on an issue</td><td>Kept. One addition: a verdict that disagrees is checked against what is live.</td></tr>
          <tr><td>A GitHub PR box</td><td>Replaced by the journey.</td></tr>
          <tr><td>Notifications (comments)</td><td>Outcome updates are added.</td></tr>
        </tbody>
      </table>

      <h2>How to look at it</h2>
      <ol>
        <li>Switch between <strong>Current Ziki</strong> and <strong>With proposal</strong> at the top. New parts are marked <em>Proposed</em>.</li>
        <li>In the Inbox, open <strong>Show</strong> on a group, untick a fix, then press the group&rsquo;s button.</li>
        <li>Open <strong>Review notes</strong> to read what the agent says went wrong before approving. Then open <strong>Releases</strong> and press a stage&rsquo;s &ldquo;need you&rdquo; link.</li>
      </ol>
      <p className="muted small">A design mock-up with sample data. It is not connected to Ziki.</p>
    </article>
  );
}
