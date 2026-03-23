# Steward Operating Rhythm

This doc defines how the ChatGPT-side steward lane should run week to week and milestone to milestone.

The steward thread is the control tower for the ChatGPT Project side of this repo. It should keep the lanes coherent without becoming a permanent giant thread that tries to do everything.

For repo-level steward ownership, closeout quality, and delegation expectations, also use:

- [docs/stewardship/STEWARD_THREAD_HANDBOOK.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/STEWARD_THREAD_HANDBOOK.md)
- [docs/stewardship/HANDOFF_CHECKLIST.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_CHECKLIST.md)
- [docs/stewardship/HANDOFF_SUMMARY_TEMPLATE.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_SUMMARY_TEMPLATE.md)

## What The Steward Thread Is For

The steward thread should:

- keep the current project truth easy to recover
- decide which ChatGPT lane should own the next question
- keep strategy, weekly operations, product design, and content design from collapsing together
- issue clean handoff packets into specialist lanes
- receive specialist conclusions and reconcile them against repo truth
- package bounded handoffs to Codex
- call out when a thread should roll over instead of continuing

Think of it as the ChatGPT-side control tower, not the place where every substantive piece of work should live forever.

## What The Steward Thread Should Not Do

The steward thread should not:

- become the permanent home of all strategy, weekly review, product spec work, and content drafting
- replace `00_MASTER_PLAN` for roadmap decisions
- replace `08_PROGRESS_TRACKER` for weekly operating review
- replace specialist lanes for scenario, couple, listening, curriculum, or speaking-design work
- replace Codex for repo implementation or verification
- keep dragging old thread history forward when a fresh successor would be cleaner

## Control-Tower Responsibilities

At any given time, the steward thread should know:

- the active milestone or workstream
- the current highest-value next decision
- which lanes are active right now
- which source-of-truth docs are stale
- whether a handoff packet is needed
- whether the next owner is another ChatGPT lane or Codex

## Cadence Suggestions

### On New Steward Start

Do this at the beginning of a new steward thread:

1. Confirm the active branch/truth is still `dev`.
2. Read the latest repo-safe handoff layer under [docs/chatgpt](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt).
3. Restate the active milestone in one sentence.
4. Decide which 1 to 3 lanes are active now.
5. Decide what should explicitly stay inactive for now.

### Weekly

Run this rhythm once per week or at the start of a new concentrated work block:

1. Refresh `08_PROGRESS_TRACKER` with the latest Codex and repo state.
2. Check whether the weekly work still matches the current milestone order from `00_MASTER_PLAN`.
3. If priorities shifted materially, update the routing and issue new packets.
4. Keep `NEXT_ACTIONS.md` honest if the near-term task stack changed.

### Per Milestone

At milestone boundaries:

1. Decide whether the current steward thread should continue or roll over.
2. Refresh milestone-facing docs if repo truth changed materially.
3. Write the milestone handoff packet before starting the next workstream.
4. Open or recommend specialist lanes only where the next work is genuinely narrow.

### On Major Decisions

Refresh current truth when one of these changes:

- the roadmap order
- a major `not now` decision
- the product loop contract
- scenario, couple, or listening scope in a way that affects other lanes
- Codex implementation that changes what is now real in the repo

### On Context Bloat

Do not wait until the thread is obviously broken.

If the steward thread starts spending too much time:

- re-explaining current truth
- repeating the same lane map
- carrying multiple competing subtopics
- mixing weekly operations with long-range roadmap and specialist design

then issue a rollover packet and start a successor steward thread.

## When To Refresh Current Truth

Refresh the ChatGPT-side truth layer when:

- Codex changes repo behavior or product capabilities materially
- the highest-priority milestone changes
- weekly reality no longer matches `NEXT_ACTIONS.md`
- one of the status snapshots is now misleading
- a new specialist lane conclusion should be treated as authoritative planning input

Usually that means reviewing whether these docs still match reality:

- [CURRENT_STATE_CODEX_HANDOFF.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CURRENT_STATE_CODEX_HANDOFF.md)
- [DECISION_LOG.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/DECISION_LOG.md)
- [NEXT_ACTIONS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/NEXT_ACTIONS.md)
- [APP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/APP_STATUS.md)
- [CONTENT_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CONTENT_STATUS.md)
- [ROADMAP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/ROADMAP_STATUS.md)

## When To Issue Handoff Packets

Issue a packet when:

- one ChatGPT lane is handing to another
- a same-lane successor is needed
- Codex is the next owner
- a milestone closed
- the thread drifted badly and needs an emergency reset

Default rule:

- if the next owner is not obvious from the repo and latest thread alone, write a packet

## Reconciling Conflicting Thread Conclusions

When two threads disagree:

1. Check repo truth first.
2. Check [DECISION_LOG.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/DECISION_LOG.md) for already-locked decisions.
3. Check the latest `00_MASTER_PLAN` outcome for roadmap-level decisions.
4. Check the latest `08_PROGRESS_TRACKER` outcome for near-term execution reality.
5. Check the specialist owning lane for narrow-topic authority.
6. If a real conflict remains, the steward thread should write the smallest possible decision question and route it to the correct owner or to the user.

Do not let conflicting threads quietly coexist as if they are both current.

## What Belongs Where

Use these routing rules:

- Put it in `00_MASTER_PLAN` when the question is about milestone order, scope tradeoffs, or explicit deferrals.
- Put it in `08_PROGRESS_TRACKER` when the question is about this week, blockers, slippage, or workstream balance.
- Put it in a specialist lane when one subsystem or content domain needs a narrow design pass.
- Keep it in `90_STEWARD_THREAD` when the real job is coordination, conflict resolution, lane routing, or packaging the next handoff.

Quick test:

- "What should we build next quarter?" -> `00_MASTER_PLAN`
- "What should we focus on this week?" -> `08_PROGRESS_TRACKER`
- "How should listening packs work?" -> `13_LISTENING_LAB`
- "Who owns this next?" -> `90_STEWARD_THREAD`

## Week-To-Week Runbook

This is the simplest durable operating rhythm for this project:

1. Start with `90_STEWARD_THREAD`.
2. Refresh `08_PROGRESS_TRACKER` once per week with Codex output and current blockers.
3. Touch `00_MASTER_PLAN` only when milestone order, major tradeoffs, or explicit deferrals need review.
4. Keep only the active specialist lanes open.
5. When a specialist lane produces a real conclusion, send a packet back through the steward thread.
6. When implementation is the next owner, hand off to Codex with a bounded packet.
7. At milestone boundaries, close or roll over the steward thread instead of letting it accumulate forever.

## Practical Guardrails

- One control tower, not many: `90_STEWARD_THREAD` should stay canonical.
- One lane, one job: if a thread is doing two jobs, split it.
- One packet per meaningful transfer: do not rely on implied memory.
- One clear next owner: every packet should say who goes next.
