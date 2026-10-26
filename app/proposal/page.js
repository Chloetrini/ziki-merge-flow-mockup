import Link from 'next/link';
import { MY_PROBLEM } from '../../lib/myProblem';

export const metadata = { title: 'The proposal · Ziki fix journey' };

export default function Proposal() {
  return (
    <article className="prose">
      <p><Link href="/issues">← Back to the mock-up</Link></p>
      <h1>Proposal: see what happens to my agents&rsquo; fixes on Ziki, not on GitHub</h1>

      <h2>The general problem</h2>
      <p>
        On Ziki, agents do the work. But after a fix leaves for GitHub, the people who own the agents cannot see what happens to it: was it merged,
        did it reach staging, was it reverted, and why? People find out late or by accident, and the agents learn nothing from what goes wrong.
      </p>

      <h2>My problem</h2>
      {MY_PROBLEM.map((t, i) => <p key={i}>{t}</p>)}

      <h2>What I want</h2>
      <p><strong>&ldquo;I want to see everything my agents do, from the fix to production, on Ziki, and never go to GitHub to find out.&rdquo;</strong></p>

      <h2>What Ziki already has (I checked the live product)</h2>
      <p>I did not want to propose something that already exists. This is what I found, and what I did with it.</p>
      <table className="cmp">
        <thead><tr><th>Already in Ziki</th><th>Where</th><th>In this proposal</th></tr></thead>
        <tbody>
          <tr><td>An Inbox where agents stop when they need a person</td><td>Issues &rarr; Inbox (Need your input, Design feedback needed, New ideas)</td><td>Kept as it is. I only extend it to cover what happens after a merge.</td></tr>
          <tr><td>Agent decisions and a conversation with Comments, Bids, Reviews, Deliveries and Merge requests</td><td>Issue page</td><td>Kept. I add one thing: a disagreement is checked against what is live, with a proposed action.</td></tr>
          <tr><td>A GitHub PR box</td><td>Issue page</td><td>Replaced by a journey that continues after the PR.</td></tr>
          <tr><td>Notifications</td><td>Bell: comments by agents</td><td>Outcome updates are added to them.</td></tr>
          <tr><td>Standing instructions and messages for each agent</td><td>Settings &rarr; Agents &rarr; Messages and instructions</td><td>Not new. I bring them into the Inbox, next to the work.</td></tr>
        </tbody>
      </table>

      <h2>What is missing, and what I propose</h2>
      <ol>
        <li><strong>The journey after the pull request.</strong> Today the PR box only says a PR is attached. I propose one timeline from report to production: checks, verdicts, merge, central staging, staging, production, and where it is stuck or reverted. Nothing like it exists today.</li>
        <li><strong>Outcome updates from the agents.</strong> Notifications today are comments. I propose updates in the agent&rsquo;s own words: &ldquo;merged, moving to staging&rdquo;, &ldquo;live&rdquo;, &ldquo;reverted&rdquo;.</li>
        <li><strong>A revert asks why, and the agent learns.</strong> When a fix is reverted, the agent asks me why. My answer is added to its standing instructions, so it does not repeat the mistake. This is the agents.md the team asked for.</li>
        <li><strong>A releases view.</strong> Every fix at central staging, staging and production, and who holds each gate, so nobody has to ask a maintainer on GitHub.</li>
        <li><strong>A disagreement gets checked, not buried.</strong> Today an issue shows twelve near-identical agent verdicts in a list, and the one that disagrees is easy to miss. I propose that the agent checks that disagreement against what is live and proposes what to do: for example, &ldquo;it looks already fixed in production, shall I close it?&rdquo;</li>
      </ol>

      <h2>How the person and the agent talk</h2>
      <ul>
        <li>The agent tells me what happened.</li>
        <li>It asks only when it must: for example, a fix that has waited two days at a release gate it cannot pass by itself.</li>
        <li>I answer with a click or a sentence, and it acts and tells me.</li>
        <li>When I explain a revert, it learns.</li>
      </ul>

      <h2>What it is not</h2>
      <p>It is not a visual redesign. Ziki&rsquo;s layout, colours and fonts are unchanged. Only the information and the conversation between people and agents change.</p>

      <h2>How to look at the mock-up</h2>
      <ol>
        <li>Switch between <strong>Current Ziki</strong> and <strong>With proposal</strong> at the top. Everything new is marked <em>Proposed</em>.</li>
        <li>In the Inbox, open <strong>Need your input</strong> and answer the agents, then look at <strong>Updates</strong>, <strong>Releases</strong> and <strong>Instructions</strong>.</li>
        <li>Open issue #1401, click each step of its journey, and open #148 to see a disagreement checked against production.</li>
        <li>Roll back a live fix and see the new instruction appear.</li>
      </ol>
      <p className="muted small">A design mock-up with sample data. It is not connected to the real Ziki.</p>
    </article>
  );
}
