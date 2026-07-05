# Aetos

Aetos is a collaborative, version-controlled workspace for autonomous video editing agents.

It is best understood as:

```text
Git + Figma + Gym for video agents
```

- **Git** for versioned video branches.
- **Figma** for human and agent collaboration.
- **Gym** for verifier scores, approvals, rejections, and reward signals.

Aetos is not trying to replace Premiere Pro, Final Cut Pro, CapCut, or DaVinci Resolve. It is the orchestration layer around autonomous video editing agents: branching, comparing, scoring, reviewing, merging, and learning from approved creative decisions.

## Current Status

This is a hackathon MVP.

Functional today:

- Next.js app and demo workspace
- branch creation and branch selection
- semantic diffing between cuts
- compare workflow
- merge and memory logic in code
- hackathon VideoAgent adapter API
- agent-generated branch plans
- activity logs and comments for generated branches

Simulated today:

- real VideoAgent model execution
- real video understanding
- real verifier model
- real RL training
- persistent database
- rendered video export

Honest positioning:

```text
Aetos is an RL-ready environment for video editing agents.
It does not yet train a full RL editing model.
```

## Quick Start

```powershell
cd "C:\Users\Mani Varshith\Aetos"
npx pnpm@10.14.0 install
npx pnpm@10.14.0 dev
```

Open the local URL printed by Next.js:

```text
http://localhost:3000
```

If port `3000` is busy, Next.js will print another port such as `3001` or `3002`.

## Demo Flow

1. Open the landing page at `/`.
2. Click `Launch Agent Workspace`.
3. Open the YC launch project.
4. Click `Run VideoAgent arena`.
5. Aetos generates multiple agent branches:
   - Viral cut
   - Premium cut
   - Story cut
   - Brand-safe cut
6. Click `Compare` on a branch.
7. Review semantic differences.
8. Use the flow to explain approval, memory, and future reward signals.

Main demo route:

```text
/project/project-yc-launch
```

## App Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page and product story |
| `/dashboard` | Project list |
| `/project/project-yc-launch` | Main Aetos workspace |
| `/project/[projectId]/compare` | Branch comparison view |
| `/editor/[projectId]` | Embedded OpenCut editor |
| `/api/agents/videoagent/run` | Hackathon VideoAgent adapter endpoint |
| `/api/sounds/search` | Freesound search endpoint |

## System Architecture

```mermaid
flowchart TD
  User[Human editor / reviewer] --> UI[Next.js App Router UI]
  UI --> Workspace[Project Workspace]
  Workspace --> Store[Zustand Client Store]
  Workspace --> AgentAPI[VideoAgent API Route]
  AgentAPI --> Adapter[Hackathon VideoAgent Adapter]
  Adapter --> Plans[Structured Edit Plans]
  Plans --> Store
  Store --> Branches[Versioned Branches]
  Store --> Diffs[Semantic Diffs]
  Store --> Memory[Team Memory]
  Store --> Activity[Activity Logs]
```

## Product Loop

```mermaid
flowchart LR
  Raw[Raw video] --> Agents[Launch agents]
  Agents --> Branches[Create branches]
  Branches --> Diff[Compare semantic diffs]
  Diff --> Score[Verifier score]
  Score --> Review[Human review]
  Review --> Merge[Approve / reject / merge]
  Merge --> Memory[Memory + reward signal]
  Memory --> Next[Better future agent runs]
```

## Version Control Architecture

```mermaid
flowchart TD
  Main[Main Cut] --> Viral[Viral Agent Branch]
  Main --> Premium[Premium Agent Branch]
  Main --> Story[Story Agent Branch]
  Main --> Brand[Brand-Safe Branch]

  Viral --> Compare[Semantic Compare]
  Premium --> Compare
  Story --> Compare
  Brand --> Compare

  Compare --> Merge[Selective Merge]
  Merge --> Final[Final Cut]
```

Version control records:

- what each agent tried
- which clips changed
- how the hook changed
- where the CTA moved
- how captions, audio, pacing, and brand tone shifted
- which decisions were approved or rejected

## Agent Arena Architecture

```mermaid
flowchart TD
  Source[Current Branch Timeline] --> Arena[Run VideoAgent Arena]

  Arena --> A[Viral Agent]
  Arena --> B[Premium Agent]
  Arena --> C[Story Agent]
  Arena --> D[Brand-Safe Agent]

  A --> APlan[Fast hook, early CTA, high retention]
  B --> BPlan[Premium tone, clean transitions]
  C --> CPlan[Better story order]
  D --> DPlan[Brand fit, safer audio and captions]

  APlan --> Branches[Aetos Branches]
  BPlan --> Branches
  CPlan --> Branches
  DPlan --> Branches
```

The current `VideoAgent` integration is a hackathon adapter. It does not run the real Python `HKUDS/VideoAgent` stack yet. It returns structured branch plans that match the shape a real worker can provide later.

## Semantic Diff Architecture

```mermaid
flowchart LR
  Base[Base Branch] --> Engine[Diff Engine]
  Target[Target Branch] --> Engine

  Engine --> Hook[Hook length]
  Engine --> Pacing[Pacing]
  Engine --> Captions[Captions]
  Engine --> Audio[Music mood]
  Engine --> CTA[CTA placement]
  Engine --> Color[Color grade]
  Engine --> Order[Clip order]

  Hook --> Summary[Plain-English Summary]
  Pacing --> Summary
  Captions --> Summary
  Audio --> Summary
  CTA --> Summary
  Color --> Summary
  Order --> Summary
```

Instead of asking reviewers to inspect five exported files manually, Aetos explains what changed.

## Collaboration Architecture

```mermaid
flowchart TD
  Editor[Editor] --> Comment[Timeline Comment]
  Founder[Founder] --> Comment
  Client[Client] --> Comment
  Agent[AI Agent] --> Suggestion[Suggestion Branch]

  Comment --> Review[Review Workspace]
  Suggestion --> Review
  Review --> Decision[Approve / Reject / Merge]
  Decision --> Activity[Activity Log]
  Decision --> Memory[Team Memory]
```

Collaboration is the human feedback layer. The strongest signal is what the team actually approves, rejects, comments on, and merges.

## Reward / RL-Ready Architecture

```mermaid
flowchart TD
  Attempt[Agent Edit Attempt] --> Verifier[Verifier Score]
  Attempt --> Human[Human Review]

  Human --> Approve[Approved Branch]
  Human --> Reject[Rejected Branch]
  Human --> Partial[Partial Merge]

  Verifier --> Reward[Reward Signal]
  Approve --> Reward
  Reject --> Reward
  Partial --> Reward

  Reward --> Memory[Reward Memory]
  Memory --> Future[Future Agent Run]
```

Current MVP reward behavior is heuristic and simulated. A future real reward function could look like:

```ts
reward =
  0.25 * hookScore +
  0.20 * pacingScore +
  0.15 * captionScore +
  0.15 * brandFitScore +
  0.10 * ctaScore +
  0.10 * technicalQualityScore +
  0.05 * humanApprovalBonus;
```

## Memory Architecture

```mermaid
flowchart LR
  Approved[Approved Branch] --> Extract[Extract Preferences]
  Rejected[Rejected Branch] --> Avoid[Extract Avoid Rules]
  Comments[Comments] --> Hints[Preference Hints]
  Merges[Merged Changes] --> Winners[Winning Decisions]

  Extract --> Memory[Team Memory]
  Avoid --> Memory
  Hints --> Memory
  Winners --> Memory

  Memory --> Suggestions[Future Suggestions]
```

Memory is not just a notes database. In Aetos, memory is the pattern of creative decisions that repeatedly wins approval.

## Important Files

| File | Purpose |
| --- | --- |
| `src/app/page.tsx` | Landing page and product story |
| `src/app/project/[projectId]/page.tsx` | Main project workspace |
| `src/app/project/[projectId]/compare/page.tsx` | Branch comparison screen |
| `src/app/api/agents/videoagent/run/route.ts` | VideoAgent adapter API route |
| `src/lib/videoagent-adapter.ts` | Hackathon VideoAgent branch planner |
| `src/lib/store.ts` | Branch, comment, activity, and memory state |
| `src/lib/diff-engine.ts` | Semantic diff engine |
| `src/lib/memory-engine.ts` | Approval-based memory logic |
| `src/lib/three-way-merge.ts` | Merge logic |

## Development Commands

```powershell
npx pnpm@10.14.0 dev
```

```powershell
npm run build
```

Focused lint for the VideoAgent integration:

```powershell
.\node_modules\.bin\eslint.cmd --no-ignore "src\app\project\[projectId]\page.tsx" src\lib\videoagent-adapter.ts src\app\api\agents\videoagent\run\route.ts src\lib\store.ts
```

## Environment Variables

Optional:

```text
FREESOUND_API_KEY=
```

If absent, sound search returns an empty result set instead of crashing the editor.

## Roadmap

- Replace mock VideoAgent adapter with a Python worker.
- Add persistent project storage.
- Add real verifier scoring.
- Add real reward computation.
- Add rendered video export.
- Add auth and team workspaces.

## License

Add the final project license before public release.
