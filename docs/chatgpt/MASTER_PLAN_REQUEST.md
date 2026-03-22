# Master Plan Request

This file is meant to be pasted into the `00_MASTER_PLAN` ChatGPT project thread.

Please treat this as a strategy and sequencing thread, not a code-implementation thread.

## Project

Learn to Live in Costa Rica

Mission:
Build a practical Spanish-learning system and local-first coaching app for an American couple preparing to live in Costa Rica in about three years, with emphasis on:

- real conversation
- comprehension of natural/fast local speech
- Costa Rica-specific scenarios
- speaking correction and confidence
- structured couple practice
- a usable shared local-network app

## Important Thread Instruction

Please focus on:

- strategy
- sequencing
- milestone design
- product direction
- learning-system direction
- risks and tradeoffs
- weekly and monthly priorities

Please do not spend most of your answer re-describing repo bootstrap tasks that are already done.

## Current State From Codex

### 1. Repo, Docs, And Operating System Are Already Built

The repo structure, docs, data folders, prompts folders, worksheets, scripts, exports, and app structure are already in place.

### 2. Web And Backend Foundation Exist

There is already a Next.js + TypeScript + Tailwind app foundation with backend routes for:

- bootstrap
- coaching
- sessions
- speech transcription

Persistence assumptions were moved to Postgres, not SQLite.
The architecture now assumes:

- one shared backend on the local network
- both users can use the app at the same time
- Apple devices act as native front ends
- AI heavy lifting remains server-side

### 3. Native Apple Client Exists

There is already a SwiftUI Apple app scaffold for:

- iPhone
- iPad
- Mac

The Apple client already includes:

- learner/scenario selection
- session browsing
- text input
- microphone recording
- local speech playback
- improved first-run/setup flow
- stronger visual design system
- branded launch/branding work
- native macOS Settings scene

### 4. Apple Runtime And Signing Issues Were Already Investigated

Codex diagnosed and fixed the main native runtime/signing blocker:

- macOS error `The executable is not codesigned` was caused by project config disabling signing globally
- Apple project generation was fixed to restore automatic signing
- the confusing `My Mac (Designed for iPad)` path was intentionally moved out of the intended flow
- Macs should use the native macOS target
- iPhone/iPad should use the iOS target

Codex also treated the iPad/simulator `ExtendedLaunchMetrics` debugger warning as likely an Xcode/simulator warning rather than evidence that the app itself failed.

### 5. Next Strong Apple Pass Has Already Started

Codex also added:

- branded iOS launch screen
- generated Apple brand/icon assets
- archive/export helper scripts
- Apple distribution docs for later household install flow

### 6. Public Repo And Branch State

The repo is public on GitHub.
`dev` is the active working truth.

Commit landmarks:

- `c83d1ca` — Bootstrap repo, backend, and speech foundation
- `c5a5435` — Document `gh auth` sandbox exception
- `c5f7d2e` — Add SwiftUI Apple client scaffold
- `cf4d678` — Polish Apple client UX and install flow
- `ba8c03d` — Fix Apple signing and add launch branding

## High-Signal File Highlights

Repo/docs/product foundation:

- `README.md`
- `AGENTS.md`
- `docs/product/app-spec.md`
- `docs/product/native-client.md`
- `docs/setup/local-dev.md`
- `docs/setup/apple-client.md`
- `docs/setup/apple-distribution.md`
- `docs/setup/repo-workflow.md`

Backend/web app foundation:

- `app/web/src/app/api/bootstrap/route.ts`
- `app/web/src/app/api/coach/route.ts`
- `app/web/src/app/api/sessions/route.ts`
- `app/web/src/app/api/speech/transcribe/route.ts`
- `app/web/src/lib/server/session-store.ts`
- `app/web/src/lib/server/coach-engine.ts`
- `app/web/src/lib/server/speech.ts`
- `app/web/src/lib/data/loaders.ts`
- `app/web/src/components/session-playground.tsx`
- `app/web/src/components/audio-capture.tsx`

Native Apple app:

- `app/apple/project.yml`
- `app/apple/CostaRicaSpanishCoach/Shared/Views/CoachRootView.swift`
- `app/apple/CostaRicaSpanishCoach/Shared/Views/CoachVisuals.swift`
- `app/apple/CostaRicaSpanishCoach/Shared/Views/ServerSettingsView.swift`
- `app/apple/CostaRicaSpanishCoach/iOS/CostaRicaSpanishCoach_iOSApp.swift`
- `app/apple/CostaRicaSpanishCoach/macOS/CostaRicaSpanishCoach_macOSApp.swift`
- `app/apple/CostaRicaSpanishCoach/iOS/Resources/LaunchScreen.storyboard`
- `scripts/generate-apple-brand-assets.swift`
- `scripts/apple-archive-ios.sh`
- `scripts/apple-archive-macos.sh`

## Current Architectural Truth

- shared local-network backend
- Postgres as durable persistence target
- AI heavy lifting on the server
- native Apple clients as front ends
- text-first correction/roleplay/listening remains the v1 center of gravity
- speech is important, but should not distort roadmap priorities away from correction UX and actual learning outcomes

## What I Want From You In `00_MASTER_PLAN`

1. Summarize your understanding of the current state of the project as it now exists.
2. Compare the current state against your original project vision and identify:
   - what is already aligned
   - what is still thin or missing
   - where the roadmap should now shift
3. Give a strategic roadmap in layers:
   - next 2 weeks
   - next 6 weeks
   - next 3 months
   - next 12 months
4. Organize the roadmap across these workstreams:
   - Curriculum
   - Listening
   - Speaking
   - Costa Rica living pack
   - Couple practice
   - App
5. Recommend the next highest-value milestones, in order.
6. For each recommended milestone, explain:
   - why it matters now
   - what success looks like
   - what should explicitly wait
7. Give decision-oriented recommendations on:
   - how much effort should go into speech right now vs later
   - how much effort should go into iPhone/iPad/Mac polish right now vs learning content
   - whether the next emphasis should be product features, curriculum assets, or scenario packs
8. Recommend the best operating rhythm for the project:
   - weekly review cadence
   - how to divide work between ChatGPT project threads and Codex repo work
   - what should live in `00_MASTER_PLAN` vs other threads
9. Recommend the next 10 concrete tasks with priority order.
10. Call out any strategic risks, scope traps, or overengineering risks you see from here.

Please be concrete, opinionated, and practical.
Assume the bootstrap stage is over.
Assume the app foundation exists.
Assume the Apple client exists.
Assume the next challenge is choosing the smartest sequence from here.
