# Roadmap Status

Last updated: 2026-03-22

## Original Milestone Map vs Current Status

## Milestone 0: Repo Bootstrap

Status: Complete

What is done:

- repo structure
- docs
- prompts
- starter schemas/data
- web app/backend scaffold
- Git/GitHub setup

## Milestone 1: Text Coach

Status: Strong partial, structured loop now present

What is done:

- typed/pasted text flow exists
- correction route exists
- backend/persistence foundation exists
- session history exists
- structured coaching schema now exists across backend, web, and Apple
- retry prompt, follow-up prompt, and review recommendation are persisted
- recent mistake and recurring-tag review summary exists
- richer drill recommendations, couple handoff metadata, and listening references now exist in the shared contract

What still needs work:

- better drill ranking and review cadence
- more polished scenario progression and turn generation
- more real-world content depth inside each high-value scenario

## Milestone 2: Scenario Engine

Status: Partial

What is done:

- scenario data exists
- scenario selection exists
- roleplay/system prompts exist
- the core daily-life scenario families now have structured turns, branches, and follow-up drills

What still needs work:

- richer scenario-turn generation across more variants
- improvement tracking by scenario
- stronger product loop around scenarios

## Milestone 3: Couple Mode

Status: Early partial

What is done:

- couple-mode prompt/assets exist
- couple practice is recognized as a core workstream
- shared couple handoff metadata now exists in the session contract

What still needs work:

- clear in-app couple flow
- turn-taking mechanics
- better partner practice structure and tracking

## Milestone 4: Audio Prototype

Status: Product-aligned partial

What is done:

- browser mic path exists
- native mic path exists
- transcription route exists
- speech playback exists
- speech now feeds the same coaching contract as text
- web and Apple clients can go from recording to transcript-backed coaching feedback

What still needs work:

- deciding how much more speech complexity is justified right now
- keeping speech scoped so it does not dilute the main product

## Milestone 5: Listening Lab

Status: Early

What is done:

- listening is explicitly on the roadmap
- starter dictation/worksheet direction exists
- starter listening packs now exist for the core scenario families
- transcript/session data can now seed listening follow-up

What still needs work:

- broader transcript packs
- speed ladders
- compare/dictation workflows
- local-accent exposure

## Milestone 6: Native Path

Status: Surpassed

The project has already moved beyond merely evaluating a native path.
There is now a real SwiftUI Apple client scaffold and ongoing native polish work.

## Milestone 7: Official Apple Client

Status: Strong partial

What is done:

- XcodeGen project exists
- SwiftUI iPhone/iPad/macOS client exists
- shared backend contract exists
- Apple UX polish has started
- signing/runtime blockers were addressed
- launch branding/assets are present

What still needs work:

- further household setup polish
- optional distribution convenience beyond direct Xcode install
- continued alignment with the backend and learning priorities

## Recommended Current Priority Order

1. Deepen Milestone 2: Scenario Engine around the new structured loop and richer variants
2. Advance Milestone 3: Couple Mode on top of shared retry/review mechanics
3. Expand Milestone 5: Listening Lab beyond the starter packs using the new session contract
4. Continue selective Apple polish only where it improves household usability directly
5. Tune review/drill generation without overbuilding speech

## What Should Explicitly Wait

- large speech-infrastructure expansions
- excessive distribution/platform polish before the learning loop is stronger
- major architectural churn that does not directly improve conversation ability, listening ability, or Costa Rica daily-life usefulness
