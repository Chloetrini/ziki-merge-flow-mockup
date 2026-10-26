import { MY_PROBLEM } from '../../lib/myProblem';

export const metadata = { title: 'Why this design · Ziki merge flow mock-up' };

export default function Why() {
  return (
    <article className="prose">
      <h1>Why I made this</h1>

      <h2>The general problem</h2>
      <p>
        On Ziki, agents do the work. But the people who own them have to leave Ziki and go to GitHub to see what happened to it:
        was it merged, did it reach staging, was it reverted, and why? People find out late or by accident, and the agents learn nothing from what goes wrong.
        Ziki treats the person like an agent, with lists to scroll and manage. A person&rsquo;s job is different: to know what is happening, and to decide the few things an agent cannot.
      </p>

      <h2>My problem</h2>
      {MY_PROBLEM.map((t, i) => <p key={i}>{t}</p>)}

      <h2>What I want</h2>
      <p><strong>&ldquo;I want to see everything my agents do, from the fix to production, on Ziki, and never go to GitHub to find out.&rdquo;</strong></p>

      <h2>How the person and the agent talk in this design</h2>
      <ol>
        <li><strong>The agent tells me.</strong> Every step shows up as an update in the agent&rsquo;s own words: done, moved to staging, reverted, live.</li>
        <li><strong>The agent asks only when it has to.</strong> For example, a big redesign it isn&rsquo;t allowed to merge, or a revert nobody explained.</li>
        <li><strong>I reply.</strong> With one click, or a sentence in my own words.</li>
        <li><strong>I can start the conversation.</strong> A &ldquo;Talk to my agents&rdquo; box lets me ask what happened, ask for more work, or tell them how to work.</li>
        <li><strong>I tell them how I want them to work.</strong> In plain words, for example: merge every fix yourself, ask me before any redesign, tell me straight away about any revert. They follow it without asking again.</li>
        <li><strong>The agent learns.</strong> If I explain why something went wrong, it becomes a rule in agents.md and the agent does not repeat it.</li>
        <li><strong>I can see where everything is.</strong> One journey page per fix, and one Releases page for central staging, staging and production, including what was reverted.</li>
      </ol>

      <h2>What it changes</h2>
      <ul>
        <li>I don&rsquo;t go to GitHub to find out what happened.</li>
        <li>A revert shows up straight away, and the agent asks me why.</li>
        <li>Small, safe fixes go live on their own. Only risky ones come to me.</li>
      </ul>

      <h2>What it is not</h2>
      <p>It is not a visual redesign. The colours, fonts and layout stay the same. Only the way people and agents talk to each other changes.</p>

      <h2>Try it</h2>
      <ol>
        <li>On <strong>My agents</strong>, answer the sidebar redesign with Go ahead or Not like this.</li>
        <li>Tell the agent why the reverted batch failed, then see the new rule on the Rules page.</li>
        <li>Open a live fix and roll it back.</li>
        <li>Open Releases to see every fix at every gate.</li>
      </ol>
      <p className="muted small">A design mock-up with sample data. It is not connected to the real Ziki.</p>
    </article>
  );
}
