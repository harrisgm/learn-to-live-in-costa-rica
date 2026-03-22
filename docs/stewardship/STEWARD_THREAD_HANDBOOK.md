# Steward Thread Handbook

This handbook defines how a steward thread should own, advance, and hand off work in this repo without losing project context or creating unnecessary process weight.

## Purpose

A steward thread is the active operating thread for a milestone or tightly scoped workstream.

Its job is to:

- keep one workstream coherent end to end
- preserve repo context while work is in flight
- make practical decisions without losing alignment with the project mission
- leave a clean handoff when the workstream reaches a milestone boundary

This repo is past bootstrap. A steward thread should assume the product foundation already exists and focus on sequencing, implementation, verification, and handoff quality.

## Scope Of Steward Ownership

A steward thread should normally own one of the following at a time:

- one milestone
- one subsystem
- one product/workstream pass
- one decision-heavy planning pass that will hand off into implementation

Examples:

- scenario engine
- couple mode
- listening lab
- text coach hardening
- Apple distribution pass

If the work starts spanning too many independent areas, that is usually a sign to split or hand off.

## Source Of Truth Rules

When deciding what is authoritative, use this order:

1. The user's latest instruction in the current thread
2. The current repo state and workspace files
3. [AGENTS.md](/Users/guyharris/learn-to-live-in-costa-rica/AGENTS.md)
4. The current project handoff docs under [docs/chatgpt](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt)
5. Older thread summaries only when they do not conflict with newer repo truth

Working rules:

- Do not overwrite or revert unrelated user changes.
- Treat uncommitted workspace changes as real project context.
- If docs and code disagree, note the mismatch and resolve it deliberately.
- If the repo already has a pattern, follow it unless there is a strong reason not to.
- Keep public repo assets separate from local-only private learner data.

## What A Steward Thread Should Keep Current

The steward thread should leave the repo in a state where the next operator can continue with minimal reconstruction.

Keep these current when relevant:

- code and docs for the feature or milestone being worked
- product/setup notes if behavior changed
- handoff-facing docs in [docs/chatgpt](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt)
- local-only ChatGPT upload files in `private-chatgpt/` when private progress or blockers changed

The steward thread does not need to update every project doc every session. Update only what changed materially.

## Delegation And Subagent Expectations

Use subagents aggressively when they reduce steward-thread overhead, but keep each delegated task narrow and concrete.

Good delegation targets:

- repo/file discovery
- targeted subsystem reading
- draft docs for one file
- verification passes
- isolated implementation slices with disjoint ownership

Delegation rules:

- give each subagent one bounded responsibility
- do not duplicate the same unresolved task across agents
- do not let subagents make broad changes without a clear file boundary
- reconcile subagent results in the steward thread before deciding
- prefer local execution for urgent critical-path work

## When To Stay In The Current Steward Thread

Stay in the current thread when:

- the work is still inside the same milestone
- the context is still helping more than it is hurting
- the next step depends directly on the last few decisions
- the repo state is still easy to explain in a few sentences

## When To Hand Off To A New Steward Thread

Hand off when one or more of these becomes true:

- the milestone has reached a clean boundary
- the next phase is meaningfully different work
- the thread has become context-heavy enough that reset would reduce risk
- the next workstream needs a different operating focus
- multiple parallel concerns are starting to blur ownership

This repo should prefer clean milestone-boundary handoffs over one giant immortal steward thread.

## Required Closeout Standard

Before ending or handing off a steward thread, leave a compact record of:

- current objective
- what changed
- what was verified
- open blockers
- important decisions and assumptions
- next recommended action

Use [HANDOFF_CHECKLIST.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_CHECKLIST.md) for the operational checklist.

## ChatGPT Project Alignment

The repo handoff layer should stay aligned with the ChatGPT project threads:

- [MASTER_PLAN_REQUEST.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/MASTER_PLAN_REQUEST.md) for strategy and long-range sequencing
- [PROGRESS_TRACKER_OPERATING_RULES.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/PROGRESS_TRACKER_OPERATING_RULES.md) for weekly operating rhythm
- [CURRENT_STATE_CODEX_HANDOFF.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CURRENT_STATE_CODEX_HANDOFF.md) for current repo truth

Use [docs/chatgpt/README.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/README.md) as the source index for what to upload into the ChatGPT project.

## Practical Default

When in doubt:

- inspect first
- change less
- preserve parallel work
- verify what matters
- document only the context the next steward will actually need
- hand off at milestone boundaries instead of letting context sprawl
