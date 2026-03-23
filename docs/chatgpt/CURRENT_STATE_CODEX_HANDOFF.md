# Current State Codex Handoff

Last updated: 2026-03-22

## Project

Learn to Live in Costa Rica

Mission:
Build a practical Spanish-learning system and local-first coaching app for an American couple preparing to live in Costa Rica in about three years, with emphasis on real conversation, natural-speed listening, Costa Rica-specific scenarios, speaking correction, and reusable learning assets.

## Current Ground Truth

- The repo bootstrap stage is complete.
- `dev` is the active working branch and current truth.
- The public GitHub repo exists and is already being used as the durable code/docs home.
- This is no longer just a folder scaffold. The repo now contains a working product foundation, a shared-backend architecture, a native Apple client, and practical project docs.

## What Is Already Built

### Repo And Docs

- Root docs and working rules exist.
- The repo includes vision, product, curriculum, setup, and workflow documentation.
- Public-vs-private data rules are documented and private learner data is intentionally separated from reusable/public assets.
- The repo now includes a dedicated Apple install guide and early Apple distribution guide.

### Data, Prompts, And Learning Assets

- Structured starter data exists under `data/`.
- JSON schemas exist for user profiles, scenarios, vocabulary, lesson units, error logs, and session history.
- Public starter learner files exist, along with placeholder private/local-only guidance.
- Vocabulary, lesson, and scenario starter packs are already in place.
- The core daily-life scenarios now include structured turns, branches, couple handoff hints, and listening cue links.
- Starter listening packs now exist for the highest-value scenario families.
- Prompt packs exist for correction, naturalization, couple mode, tutor mode, and Costa Rica roleplay/system contexts.
- Worksheet, dictation, quiz, and speaking-drill starter content exists.

### Web App And Backend

- A Next.js + TypeScript + Tailwind web app foundation exists under `app/web`.
- Backend/API routes exist for:
  - bootstrap
  - coaching
  - sessions
  - speech transcription
- The backend is local-network first.
- Durable persistence assumptions were moved to Postgres.
- `docker-compose.yml` exists for local Postgres.
- The app can use OpenAI-backed correction/transcription when configured, with local/fallback behavior when not configured.
- The web app has already been built and verified in Codex.
- The core learner loop now returns a structured coaching contract instead of only thin freeform fields.
- Saved sessions now persist scenario context, typed error tags, retry prompts, follow-up prompts, and review recommendations.
- The sessions API now exposes a learner-review summary with recent mistakes, recurring tags, richer drill suggestions, and listening recommendations.
- Speech input remains thin, but now runs through the same coaching contract as typed text.

### Native Apple Client

- A SwiftUI Apple client exists under `app/apple`.
- The Apple app targets iPhone, iPad, and Mac from one XcodeGen-managed codebase.
- The native client supports:
  - learner selection
  - scenario selection
  - text submission
  - session browsing
  - server/LAN configuration
  - microphone recording
  - local speech playback
- The native client has already been verified through successful iOS and macOS builds in Codex.
- The native client now mirrors the upgraded backend contract, including retry-first structured feedback, richer drill data, and learner review summary data.

### Apple Polish And Install Work

- The Apple client has already gone through a meaningful polish pass.
- It now includes:
  - a stronger visual design system
  - improved first-run/setup flow
  - better server configuration UX
  - a native macOS Settings scene
  - branded launch behavior
  - branded app icons/assets
  - a real iOS launch screen
- Household Apple install guidance has already been documented.
- Early archive/export helper scripts exist for future distribution convenience.

### Apple Runtime And Signing Issues Already Addressed

- The macOS error `The executable is not codesigned` was traced to project config, not the certificate itself.
- Apple project generation was fixed so signing is no longer disabled globally.
- The native Mac path should use the `CostaRicaSpanishCoach-macOS` scheme.
- The iOS path should use the `CostaRicaSpanishCoach-iOS` scheme.
- The misleading `My Mac (Designed for iPad)` route is not the intended desktop path.
- The iPad/simulator `ExtendedLaunchMetrics` warning was treated as likely Xcode/simulator noise rather than proof that the product failed.

## Important Architectural Truths

- The system is now server-based for shared household use on the local network.
- Postgres is the durable persistence target.
- AI heavy lifting is server-side.
- The Apple clients are front ends over the shared backend, not separate local business-logic forks.
- Text-first correction/roleplay/listening remains the v1 center of gravity.
- Speech matters, but should not dominate priorities before the correction and scenario loop is solid.
- The current content push is centered on structured scenario branching, richer review drills, and listening starter packs that reuse the same session contract.

## Commit Landmarks

- `c83d1ca` — Bootstrap repo, backend, and speech foundation
- `c5a5435` — Document `gh auth` sandbox exception
- `c5f7d2e` — Add SwiftUI Apple client scaffold
- `cf4d678` — Polish Apple client UX and install flow
- `ba8c03d` — Fix Apple signing and add launch branding

## What ChatGPT Should Assume Is Already Done

- Do not suggest repo bootstrap work as if the repo were empty.
- Do not suggest SQLite as the durable DB target; Postgres is now the target.
- Do not treat the project as web-only; a native Apple client already exists.
- Do not assume the app is browser-local only; the architecture now assumes a shared LAN backend.
- Do not assume Mac should run via the iPad-on-Mac compatibility path; the native macOS target is the intended path.

## What Still Needs Strategic Attention

- Better sequencing between scenario depth, review/drill generation, and learning-content expansion
- Clear next milestones for scenario engine, couple mode, and listening lab on top of the new session contract
- A stronger curriculum/content operating rhythm beyond weeks 1-4
- Better definition of what should wait so the project does not overbuild speech or distribution too early
