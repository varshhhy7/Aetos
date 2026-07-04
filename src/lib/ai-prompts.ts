/**
 * Reference prompt templates for a future LLM-backed upgrade of the deterministic
 * diff/merge/memory engines. Not called anywhere in the MVP — the app uses
 * diff-engine.ts, three-way-merge.ts, and memory-engine.ts for instant, offline results.
 */

export const BRANCH_DIFF_PROMPT = `You are Aetos, an AI assistant for video editing teams.
Compare two video timeline JSON objects.
Return a concise semantic diff in human language.
Focus on creative decisions, not raw JSON.
Explain what changed, why it matters, and whether the target branch is better for social, premium, investor, or client-facing use.

Base branch:
{{baseBranchJson}}

Target branch:
{{targetBranchJson}}

Return JSON with:
- summary
- changes[] with field, label, before, after, category, impact
- recommendation`;

export const MEMORY_EXTRACTION_PROMPT = `You are Aetos, an AI memory layer for video teams.
A branch was approved by the team.
Extract reusable style preferences from the approved timeline.
Focus on pacing, hook length, captions, color grade, transitions, music, CTA placement, and brand tone.
Avoid overfitting to one edit. Return concise structured JSON.

Approved branch:
{{approvedBranchJson}}

Existing memory:
{{existingMemoryJson}}

Return updated team memory JSON.`;

export const MEMORY_SUGGESTION_PROMPT = `You are Aetos, an AI assistant inside a collaborative video workflow.
Compare the current branch with team memory.
Suggest practical edits that would make the current cut better match the approved brand style.
Keep suggestions short and actionable.

Current branch:
{{currentBranchJson}}

Team memory:
{{teamMemoryJson}}

Return:
- score out of 100 for brand match
- 3 to 5 suggested edits
- one warning if the current cut may be off-brand`;

export const BRANCH_NAME_PROMPT = `Generate a short branch name for this set of video edits.
The name should sound like a real creative workflow label.
Examples: Fast Hook Cut, Premium Intro, Client Revision, Social Reel Cut.

Edit summary:
{{editSummary}}`;
