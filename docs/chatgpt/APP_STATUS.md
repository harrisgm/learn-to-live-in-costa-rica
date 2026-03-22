# App Status

Last updated: 2026-03-22

## Overall Snapshot

The product now has a real shared-backend app foundation, not just a repository scaffold.
The web app is the current reference implementation.
The native Apple client is already present and has moved beyond bare scaffolding into a usable household-device path.

## Architecture Status

### Healthy

- Shared local-network backend model is established.
- Postgres is the intended durable store.
- Web and native clients are aligned around one backend contract.
- API route boundaries exist for bootstrap, coaching, sessions, and speech transcription.

### Still Needs Hardening

- richer recurring-error tracking
- stronger scenario-driven state flow
- better couple-mode mechanics
- clearer listening workflow support

## Web App Status

### Already Present

- learner selection
- scenario selection
- mode/difficulty selection
- text input
- session browsing
- backend integration path

### Current Role

- The web app is the most mature working product surface.
- It is the clearest reference for API behavior and product flow.

## Backend Status

### Already Present

- bootstrap route
- coach route
- sessions route
- transcription route
- Postgres-ready session storage
- OpenAI-backed/fallback service layer

### Current Role

- The backend is the system of record for shared household behavior.
- It is the long-term contract layer that both web and native clients should depend on.

## Persistence Status

### Decided

- Postgres is the durable target.

### Still Worth Improving

- better visibility into recurring learner mistakes
- clearer import/export path for backups and portability
- cleaner household session history flows

## Speech Status

### Already Present

- browser microphone capture path
- native microphone capture path
- transcription route
- local speech playback on Apple client

### Current Product Position

- speech is present as an enhancement layer
- speech is not the defining v1 requirement
- the correction loop should stay useful even when speech is unavailable

## Native Apple Client Status

### Already Present

- SwiftUI shared codebase
- iPhone/iPad/macOS targets
- server configuration flow
- branded visuals
- branded launch behavior
- native macOS Settings scene
- branded app icons and launch screen
- archive/export helper scripts

### Apple Runtime/Install Status

- code-signing blocker was identified and fixed in project generation
- intended scheme usage is now clear:
  - `CostaRicaSpanishCoach-iOS` for iPhone/iPad
  - `CostaRicaSpanishCoach-macOS` for Mac
- successful builds were re-verified for iOS and macOS after the latest Apple fixes/polish

## Main App Risks From Here

- overinvesting in speech before the learning loop is sharp
- overinvesting in Apple/distribution polish before content and scenario depth are strong enough
- allowing web/native features to drift away from the same backend contract
