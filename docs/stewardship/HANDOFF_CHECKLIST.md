# Handoff Checklist

Use this checklist when closing a steward thread or preparing a clean handoff into a new one.

## Session And Scope

- [ ] Date updated
- [ ] Current steward thread or session named
- [ ] Current objective stated in one sentence
- [ ] Reason for handoff noted

## Repo State

- [ ] Current branch recorded
- [ ] Target branch for the next work recorded if different
- [ ] `git status` checked and summarized as clean or dirty
- [ ] Any uncommitted changes summarized
- [ ] Any local-only ignored files relevant to the handoff noted

## Recent History

- [ ] Latest meaningful commit(s) recorded
- [ ] Important merges or pushes since the last handoff summarized
- [ ] Active milestone named

## Delegation

- [ ] Early delegation review completed
- [ ] Subagents started for parallelizable work, or reason none were needed recorded
- [ ] Delegated outputs reconciled before closeout
- [ ] Any still-useful parallel work for the next steward identified

## Verification

- [ ] Builds, tests, or smoke checks run this session listed
- [ ] Any checks intentionally not run listed
- [ ] Current known runtime limitations noted
- [ ] Device, simulator, or environment-specific caveats noted if relevant

## Decisions And Assumptions

- [ ] Decisions made this session captured
- [ ] Assumptions made this session captured
- [ ] Deferred items called out explicitly
- [ ] Anything that should wait labeled as `not now`

## Blockers

- [ ] Current blockers reviewed
- [ ] Highest-priority blocker identified
- [ ] User decisions still needed listed
- [ ] Workarounds or fallback paths documented

## Docs And Handoff Artifacts

- [ ] Product/setup docs updated if behavior changed
- [ ] [CURRENT_STATE_CODEX_HANDOFF.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CURRENT_STATE_CODEX_HANDOFF.md) refreshed if project truth materially changed
- [ ] [DECISION_LOG.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/DECISION_LOG.md) refreshed if new decisions were made
- [ ] [NEXT_ACTIONS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/NEXT_ACTIONS.md) refreshed if priorities changed
- [ ] [APP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/APP_STATUS.md) refreshed if app state changed
- [ ] [CONTENT_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/CONTENT_STATUS.md) refreshed if learning assets changed
- [ ] [ROADMAP_STATUS.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/chatgpt/ROADMAP_STATUS.md) refreshed if milestone status changed

## Private Local-Only Sources

- [ ] `private-chatgpt/WEEKLY_SCOREBOARD.md` refreshed if weekly status changed
- [ ] `private-chatgpt/ACTIVE_BLOCKERS.md` refreshed if blockers changed
- [ ] `private-chatgpt/USER_PROFILES.md` refreshed if learner context changed
- [ ] `private-chatgpt/COSTA_RICA_CONTEXT_PRIVATE.md` refreshed if private move/life context changed
- [ ] `private-chatgpt/PERSONAL_ERROR_LOG.md` refreshed if private learner patterns changed

## Next Steward Start Point

- [ ] Next recommended task named
- [ ] First file or subsystem to inspect named
- [ ] Success condition for the next session stated
- [ ] Risks to watch in the next session stated

## Short Handoff Summary

Write a short handoff note at the bottom using [HANDOFF_SUMMARY_TEMPLATE.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/stewardship/HANDOFF_SUMMARY_TEMPLATE.md) with:

- what changed
- what is stable
- what is still open
- what the next steward should do first
