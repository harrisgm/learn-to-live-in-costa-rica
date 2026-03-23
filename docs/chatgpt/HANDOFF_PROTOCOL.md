# ChatGPT Handoff Protocol

This doc defines how ChatGPT Project threads should hand work to each other and to Codex.

It extends the repo-level steward closeout system. For repo steward thread closeout, still use [HANDOFF_SUMMARY_TEMPLATE.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_SUMMARY_TEMPLATE.md) and [HANDOFF_CHECKLIST.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_CHECKLIST.md).

## Why Handoffs Are Mandatory

Handoffs are not optional hygiene. They are how this project avoids slow thread decay.

Use them because:

- threads get heavy even when the work is going well
- context limits are real
- implicit thread memory is unreliable over time
- this project mixes product design, curriculum design, Costa Rica scenario design, and household workflow design
- Codex needs concise implementation briefs, not giant ChatGPT histories
- future you should not have to reconstruct decisions from scattered recaps

If a thread has produced real decisions, changed scope, or clarified the next owner, it should leave a packet.

## Handoff Types

### Intra-Lane Handoff

Use when the same lane needs a clean rollover.

Example:

- `13_LISTENING_LAB` -> `13_LISTENING_LAB_2`

Use it when:

- the thread is getting recap-heavy
- the scope is still the same
- continuing in the same thread would add more risk than clarity

### Cross-Lane Handoff

Use when one specialist lane has reached its boundary and another lane should take over.

Example:

- `22_COSTA_RICA_LIVING_PACK` -> `11_SCENARIO_ENGINE`
- `20_CURRICULUM` -> `30_WORKSHEET_FACTORY`

Use it when:

- the next question is real but belongs somewhere else
- the owning lane has already made the decisions it should make

### ChatGPT -> Codex Handoff

Use when the design/planning work is stable enough for repo execution.

Use it when:

- scope is concrete
- decisions are mostly locked
- source files are named
- success criteria are clear

Do not send Codex a vague idea pile. Send a bounded implementation brief.

### Codex -> ChatGPT Handoff

Use when Codex has changed repo truth and a ChatGPT lane now needs to absorb it.

Use it when:

- implementation landed
- implementation exposed a product/content decision
- verification changed what is realistic next

### Milestone-Complete Handoff

Use when one milestone is done and the next active workstream should start fresh.

This is the default way to avoid one giant immortal thread.

### Emergency Reset Handoff

Use when a thread has drifted badly enough that continuing would spread confusion.

Use it when:

- the thread keeps revisiting the same recap
- multiple subtopics are colliding
- the thread has become part strategy, part weekly ops, part spec, and part content factory
- the handoff packet would be easier to trust than the ongoing thread

## Canonical Handoff Packet

Use this packet for every meaningful handoff.

Target size:

- concise enough to scan quickly
- complete enough that the next thread does not need archaeology

## Packet Template

```md
# Handoff Packet

## Thread / Lane

- From thread: `name`
- To thread or lane: `name`
- Handoff type: `intra-lane | cross-lane | ChatGPT->Codex | Codex->ChatGPT | milestone-complete | emergency-reset`
- Date: `YYYY-MM-DD`
- Active milestone or workstream: `name`

## Thread Purpose

- `one or two sentences on what the sending thread was for`

## Current Truth

- Repo branch/truth: `dev`
- Workspace note: `clean or dirty if known`
- Current state in plain English:
  - `what is true now`
  - `what is stable now`

## What Changed

- `high-signal change 1`
- `high-signal change 2`
- `high-signal change 3`

## Decisions Already Locked

- `locked decision 1`
- `locked decision 2`
- `explicit not now item`

## Open Questions

- `question still open`
- `decision still needed`

## Not This Thread

- `what the receiving thread should not absorb`
- `what should stay out of scope`

## Required Next Output

- `what the next thread must produce`
- `what format or decision is expected`

## Source-Of-Truth Files

- `/absolute/path/to/file`
- `/absolute/path/to/file`
- `/absolute/path/to/file`

## Relevant Commits / PRs

- `short-sha message`
- `PR # if relevant`

## Risks / Blockers

- `current blocker`
- `current risk`

## Recommended Next Thread Or Lane

- `best next owner`
- `why that owner is next`
```

## Packet Rules

- Say what is decided and what is undecided in separate sections.
- Name exact files, not vague areas like "the docs" or "the app."
- State the active branch or repo truth when implementation context matters.
- Preserve scope boundaries with a `Not This Thread` section.
- Keep the packet grounded in the actual repo and current milestone.
- Prefer 5 to 12 high-signal bullets over a long narrative recap.
- If a receiving thread needs private context, say so explicitly and keep that material out of repo-safe docs.

## Handoff Quality Rules

- No vague summaries like "we discussed several ideas."
- No hiding disagreement inside soft language; say what is locked, proposed, or open.
- No pretending a thread owns work it should only recommend.
- No restating bootstrap work unless it changed the current decision.
- No giant copy-paste of old thread history.
- No missing file references when source docs exist.
- No sending Codex open-ended strategy questions as if they were implementation tasks.

Useful status labels:

- `locked`: already decided unless reopened deliberately
- `proposed`: current recommendation, not yet treated as final
- `open`: unresolved and needs active decision
- `not now`: intentionally deferred

## Thread Rollover Rules

Roll over a thread when one or more of these is true:

- recap is taking too much of each new message
- the thread is repeating the same operating context
- more than one real subtopic now competes for control
- the milestone changed
- the next phase needs a different mode of thinking
- the handoff packet would now be more useful than another continuation reply

Default bias:

- roll over before the thread becomes unusably bloated
- do not wait until it is already chaotic

## Successor Thread Naming Rules

Use the canonical lane name first:

- `13_LISTENING_LAB`
- `11_SCENARIO_ENGINE`
- `90_STEWARD_THREAD`

When a same-lane rollover is needed, append a simple counter:

- `13_LISTENING_LAB_2`
- `13_LISTENING_LAB_3`
- `90_STEWARD_THREAD_2`

Rules:

- keep the number prefix stable
- do not rename the lane just because the phase changed slightly
- only create a new numbered successor when the ownership is still the same
- if ownership changed, hand off to the correct lane instead of creating a misleading successor

## Same-Lane Continuity Rules

To preserve continuity without dragging the whole old thread forward:

- start the successor with the latest handoff packet, not the full history
- include only the exact source-of-truth files the successor needs
- restate the lane purpose and current scope in 3 to 8 bullets
- carry forward only the still-live open questions
- archive mentally what is closed; do not reopen settled work by accident
- keep one active canonical thread per lane unless a temporary factory batch is deliberately separate

## Example: Same-Lane Rollover

```md
# Handoff Packet

## Thread / Lane

- From thread: `13_LISTENING_LAB`
- To thread or lane: `13_LISTENING_LAB_2`
- Handoff type: `intra-lane`
- Date: `2026-03-22`
- Active milestone or workstream: `listening-lab v1 starter design`

## Thread Purpose

- `Define the first listening-lab product loop for natural-speed Costa Rica Spanish without turning it into a giant speech project.`

## Current Truth

- Repo branch/truth: `dev`
- Current state in plain English:
  - `The app foundation exists, but listening is still early and only lightly represented in repo assets.`
  - `The project wants compare/dictation workflows and speed ladders, not a large ASR-first product.`

## What Changed

- `Locked the v1 listening-lab shape around compare, replay, dictation, and repair instead of freeform audio exploration.`
- `Prioritized grocery, healthcare, utilities, and neighbor-smalltalk listening packs first.`
- `Identified transcript factory support as the next dependency.`

## Decisions Already Locked

- `locked: listening should stay tied to real Costa Rica daily-life content`
- `locked: speech infrastructure expansion is not required for listening-lab v1`
- `not now: advanced pronunciation scoring`

## Open Questions

- `How many transcript difficulty tiers should exist in the first pack?`
- `Should listening packs mirror the scenario-engine difficulty levels or use their own ladder?`

## Not This Thread

- `Do not redesign the whole curriculum here.`
- `Do not expand into general speech-tech architecture.`

## Required Next Output

- `A tight transcript-pack spec with levels, session format, and acceptance criteria for Codex and the transcript factory.`

## Source-Of-Truth Files

- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CONTENT_STATUS.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/NEXT_ACTIONS.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/worksheets/dictation/costa-rica-market-listen-01.md`

## Risks / Blockers

- `Risk: the thread will sprawl into asset writing before the format is locked.`

## Recommended Next Thread Or Lane

- `13_LISTENING_LAB_2`
- `Stay in-lane for one more focused pass, then hand off to 31_DIALOGUE_AND_TRANSCRIPT_FACTORY and Codex.`
```

## Example: ChatGPT -> Codex

```md
# Handoff Packet

## Thread / Lane

- From thread: `10_PRODUCT_LOOP`
- To thread or lane: `Codex`
- Handoff type: `ChatGPT->Codex`
- Date: `2026-03-22`
- Active milestone or workstream: `scenario-driven retry and review loop`

## Thread Purpose

- `Clarify how the learner loop should show retry guidance, follow-up prompts, and recent-mistake review inside the shared app contract.`

## Current Truth

- Repo branch/truth: `dev`
- Current state in plain English:
  - `The shared coaching contract and review summary already exist across web and Apple.`
  - `The next step is sharper scenario-driven progression and better review-drill packaging.`

## What Changed

- `Locked a retry-first flow with one immediate repair action and one short follow-up turn.`
- `Kept speech as an input path into the same loop, not a separate subsystem.`

## Decisions Already Locked

- `locked: web remains the reference product surface`
- `locked: do not add major speech infrastructure in this pass`
- `locked: save scenario context and error tags with each session`

## Open Questions

- `Open only if implementation reveals a schema mismatch between current session storage and the proposed review drill payload.`

## Not This Thread

- `Do not redesign curriculum sequencing.`
- `Do not expand into couple-mode mechanics.`

## Required Next Output

- `Implement the review-drill payload and surface it in the web app session flow.`
- `Refresh repo-safe docs only if the contract changes materially.`

## Source-Of-Truth Files

- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CURRENT_STATE_CODEX_HANDOFF.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/APP_STATUS.md`
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/lib/server/coach-engine.ts`
- `/Users/guyharris/learn-to-live-in-costa-rica/app/web/src/lib/server/session-store.ts`

## Risks / Blockers

- `Risk: review payload complexity could outrun v1 usefulness if the data model is made too clever.`

## Recommended Next Thread Or Lane

- `Codex`
- `Implementation is the next owner; return to steward or product loop only if the repo truth changes the decision.`
```
