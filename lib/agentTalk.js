// Mock replies. A real agent would answer from live data.
export function talk(text, fixes) {
  const t = text.toLowerCase().trim();
  const needs = fixes.filter((f) => f.state === 'needs-you').length;
  const moving = fixes.filter((f) => f.state === 'moving').length;
  const live = fixes.filter((f) => f.state === 'live').length;
  const reverted = fixes.filter((f) => f.steps.some((s) => s.status === 'reverted')).length;

  if (/\b(find|look for|get)\b.*\bwork\b|\bmore work\b|\bnew work\b/.test(t)) {
    return { say: 'I looked for more work. I found 3 open issues I can take: a search fix, a label fix and a copy fix. Tell me which ones, or say "all of them", and I will start.' };
  }
  if (t.includes('?') || /^(what|how|where|why|which|is|are|did|has|have|show)\b/.test(t)) {
    return { say: `Right now ${moving} fixes are moving on their own, ${live} ${live === 1 ? 'is' : 'are'} live, ${reverted} ${reverted === 1 ? 'was' : 'were'} reverted, and ${needs} ${needs === 1 ? 'needs' : 'need'} your answer.` };
  }
  if (/\b(always|never|tell me|ask me|merge|don't|do not|only|stop|wait)\b/.test(t)) {
    const rule = text.trim().replace(/^./, (c) => c.toUpperCase());
    return { rule, say: `Understood. I will follow this from now on: "${rule}". You can change it on the Rules page.` };
  }
  return { say: 'Got it. I will act on that and report back here.' };
}
