# ChatGPT Source Index

This directory is the public handoff layer between the repo and the ChatGPT project threads.

Use these files to keep strategy, weekly tracking, and repo-aware context synchronized without forcing a new thread to reconstruct project history from scratch.

## What This Folder Is For

These files are meant to:

- summarize current repo truth
- seed high-value ChatGPT project threads
- define how ChatGPT lanes, rollovers, and handoffs should work
- track decisions, priorities, and milestone status
- reduce handoff overhead between steward threads

These files are public and repo-safe. They should stay generic, reusable, and free of sensitive personal details.

## Core Files

- [CURRENT_STATE_CODEX_HANDOFF.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CURRENT_STATE_CODEX_HANDOFF.md)
  - current repo truth and major implementation status
- [MASTER_PLAN_REQUEST.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/MASTER_PLAN_REQUEST.md)
  - seed prompt for the `00_MASTER_PLAN` ChatGPT thread
- [PROGRESS_TRACKER_OPERATING_RULES.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/PROGRESS_TRACKER_OPERATING_RULES.md)
  - seed prompt for the `08_PROGRESS_TRACKER` ChatGPT thread
- [DECISION_LOG.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/DECISION_LOG.md)
  - major decisions and why they were made
- [NEXT_ACTIONS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/NEXT_ACTIONS.md)
  - current highest-value next tasks
- [APP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/APP_STATUS.md)
  - product and implementation status snapshot
- [CONTENT_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CONTENT_STATUS.md)
  - curriculum/content/scenario status snapshot
- [ROADMAP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/ROADMAP_STATUS.md)
  - milestone-by-milestone status snapshot

## Operating Pack

Use these docs when you want the full ChatGPT Project operating system instead of only the two legacy seed threads:

- [LANE_MAP.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/LANE_MAP.md)
  - recommended lane structure, ownership boundaries, routing guide, and source-of-truth order
- [HANDOFF_PROTOCOL.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/HANDOFF_PROTOCOL.md)
  - canonical handoff packet, rollover rules, and ChatGPT-to-Codex transfer rules
- [THREAD_TEMPLATE.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/THREAD_TEMPLATE.md)
  - copy-paste templates for new threads, successor threads, cross-lane requests, and Codex handoffs
- [STEWARD_OPERATING_RHYTHM.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/STEWARD_OPERATING_RHYTHM.md)
  - ChatGPT-side control-tower cadence and week-to-week operating rhythm
- [LANE_BOOTSTRAP_PROMPTS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/LANE_BOOTSTRAP_PROMPTS.md)
  - copy-paste prompt starters for command, specialist, factory, and steward lanes

## Recommended Launch Order

If you are standing up or refreshing the ChatGPT Project side now:

1. Start or refresh `90_STEWARD_THREAD` first.
2. Keep `00_MASTER_PLAN` as the strategy lane.
3. Keep `08_PROGRESS_TRACKER` as the weekly operating lane.
4. Open only the specialist lanes that match the current active workstream.
5. Use handoff packets whenever work moves between lanes or back to Codex.

## Use With `00_MASTER_PLAN`

Use the `00_MASTER_PLAN` thread for:

- strategy
- milestone sequencing
- tradeoffs
- roadmap corrections
- decisions about what should wait

Recommended upload set:

- [CURRENT_STATE_CODEX_HANDOFF.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CURRENT_STATE_CODEX_HANDOFF.md)
- [MASTER_PLAN_REQUEST.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/MASTER_PLAN_REQUEST.md)
- [DECISION_LOG.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/DECISION_LOG.md)
- [NEXT_ACTIONS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/NEXT_ACTIONS.md)
- [APP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/APP_STATUS.md)
- [CONTENT_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CONTENT_STATUS.md)
- [ROADMAP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/ROADMAP_STATUS.md)

Recommended private companion uploads:

- `private-chatgpt/USER_PROFILES.md`
- `private-chatgpt/COSTA_RICA_CONTEXT_PRIVATE.md`
- `private-chatgpt/PERSONAL_ERROR_LOG.md` when useful for planning

## Use With `08_PROGRESS_TRACKER`

Use the `08_PROGRESS_TRACKER` thread for:

- weekly progress review
- blocker tracking
- priority correction
- workstream balance checks
- next-7-days planning

Recommended upload set:

- [CURRENT_STATE_CODEX_HANDOFF.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CURRENT_STATE_CODEX_HANDOFF.md)
- [PROGRESS_TRACKER_OPERATING_RULES.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/PROGRESS_TRACKER_OPERATING_RULES.md)
- [DECISION_LOG.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/DECISION_LOG.md)
- [NEXT_ACTIONS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/NEXT_ACTIONS.md)
- [APP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/APP_STATUS.md)
- [CONTENT_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CONTENT_STATUS.md)
- [ROADMAP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/ROADMAP_STATUS.md)

Recommended private companion uploads:

- `private-chatgpt/WEEKLY_SCOREBOARD.md`
- `private-chatgpt/ACTIVE_BLOCKERS.md`
- `private-chatgpt/PERSONAL_ERROR_LOG.md`

## Public Versus Local-Only

Safe for the public repo:

- generic strategy docs
- roadmap docs
- architecture notes
- prompt packs
- generic curriculum/scenario assets
- sanitized learner templates

Keep local-only and out of git:

- real learner details
- private progress/confidence notes
- private transcripts
- raw recordings
- addresses, property targets, immigration/legal documents
- secrets, tokens, and personal account data

See [../setup/repo-workflow.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/setup/repo-workflow.md) and [../../data/private/README.md](/Users/guyharris/learn-to-live-in-costa-rica/data/private/README.md) for the repo-side privacy rules.

## Steward Thread Note

These files support steward handoffs, but they do not replace the steward operating rules.

Use:

- [../stewardship/STEWARD_THREAD_HANDBOOK.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/STEWARD_THREAD_HANDBOOK.md)
- [../stewardship/HANDOFF_CHECKLIST.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_CHECKLIST.md)
- [../stewardship/HANDOFF_SUMMARY_TEMPLATE.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_SUMMARY_TEMPLATE.md)

when opening, running, or closing a steward thread.

Use the new operating-pack docs in this folder for ChatGPT lane structure, thread bootstrap, and packet format.
