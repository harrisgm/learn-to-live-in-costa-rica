# Learn to Live in Costa Rica

Learn to Live in Costa Rica is a practical Spanish-learning system and local-first coaching app for an American couple preparing to live in Costa Rica within about three years. The project focuses on real-life fluency, not academic study alone, with special attention to daily-life scenarios, natural-speed listening, useful speaking correction, and reusable learning assets.

## Project Purpose

This repository is the operating system for the project:

- a clean curriculum and scenario structure
- reusable prompt packs for tutoring, correction, and roleplay
- structured data for profiles, lessons, vocabulary, and session history
- a shared local-network backend with text coaching, speech hooks, and durable session storage
- a native SwiftUI Apple client for iPhone, iPad, and Mac that talks to the same backend

The repo is designed so public, reusable assets can live in version control while private learner data stays local.

## V1 Scope

Version 1 is intentionally narrow:

- real correction and coaching through a shared backend
- Costa Rica-specific roleplay and scenario practice
- couple practice support
- recurring mistake tracking
- structured lesson, vocab, and worksheet assets
- Postgres-ready persistence for two concurrent learners on the same local network
- browser microphone capture with server-side transcription plumbing

V1 still does **not** aim to be a full production mobile app, a live always-on assistant, or a polished speech-science platform. The priority is still strong correction, roleplay, and shared household practice.

## Folder Structure

```text
learn-to-live-in-costa-rica/
├─ README.md
├─ AGENTS.md
├─ .gitignore
├─ LICENSE
├─ docs/
├─ data/
├─ prompts/
├─ worksheets/
├─ app/
├─ scripts/
└─ exports/
```

Key directories:

- `docs/`: vision, product, curriculum, and setup guidance
- `data/`: public starter data, schemas, and generic learning assets
- `data/private/`: local-only personal profiles, error logs, and session history
- `prompts/`: reusable system, correction, and roleplay prompt files
- `worksheets/`: printable, quiz, dictation, and speaking-drill content
- `app/web/`: minimal Next.js + TypeScript + Tailwind web app
- `app/web/src/app/api/`: backend routes for bootstrap, coaching, sessions, and speech transcription
- `app/apple/`: XcodeGen-powered SwiftUI iOS/macOS app scaffold
- `docs/product/native-client.md`: native Apple client product notes
- `app/shared/`: shared types, utilities, and validators for future multi-app reuse
- `scripts/`: seed, export, transcript, and lesson generation helpers
- `exports/`: generated study packs and printable outputs

## Local Setup

### 1. Initialize git if you started from a plain local folder

```bash
git init -b main
```

### 2. Start Postgres for durable shared sessions

```bash
docker compose up -d postgres
```

### 3. Install the web app dependencies and environment

```bash
cd app/web
npm install
cp .env.example .env.local
```

Optional but recommended:

- set `OPENAI_API_KEY` for AI corrections and server-side transcription
- keep `DATABASE_URL` pointed at the local Postgres instance unless you have another shared database

### 4. Start the app for your local network

```bash
npm run dev:network
```

Then open [http://localhost:3000](http://localhost:3000) on the server machine, or `http://<server-lan-ip>:3000` from phones and laptops on the same network.

### 5. Generate and open the Apple client

```bash
cd app/apple
xcodegen generate
open CostaRicaSpanishCoach.xcodeproj
```

Then:

1. Set your Apple signing/team in Xcode for the iOS and macOS targets.
2. Run the app onto each real household device from Xcode the first time.
3. Enter the shared backend LAN URL when the in-app connection screen appears.

The full device-install flow lives in [docs/setup/apple-client.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/setup/apple-client.md).

## Contribution Workflow

Recommended branch model:

- `main`: stable branch
- `dev`: integration branch
- `feat/repo-bootstrap`
- `feat/text-coach-v1`
- `feat/scenario-engine`
- `feat/couple-mode`
- `feat/audio-prototype`

Typical workflow:

1. Branch from `dev`.
2. Make a focused change.
3. Update docs and prompts when product behavior changes.
4. Open a pull request for review.
5. Merge into `dev`, then promote to `main` when stable.

More detail lives in [docs/setup/repo-workflow.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/setup/repo-workflow.md).

## Public vs Private Data Rules

Safe to keep in the public repo:

- app code
- prompt templates
- curriculum templates
- generic scenarios
- sanitized example learner profiles
- generic vocabulary and lesson structures

Keep local and private only:

- real learner profiles with identifying details
- private study journals or personal transcripts
- raw recordings
- immigration, banking, property, or legal documents
- addresses, account details, and secrets
- API keys or tokens
- exported session data that includes personal history or private recordings

The repo includes `data/private/` as the default home for local-only learner data. Its JSON contents are ignored by git, while starter `.gitkeep` files and documentation remain committed.

## Current App Foundation

The web app now includes a practical v1 foundation:

- choose learner, practice mode, difficulty, and scenario
- load public learner/scenario data from the repo
- send text input through a shared backend correction route
- persist sessions in Postgres when `DATABASE_URL` is configured
- fall back to in-memory sessions if Postgres is not configured yet
- capture microphone audio in the browser and send it to a transcription route
- use OpenAI-backed correction/transcription when `OPENAI_API_KEY` is set, with a local rules fallback otherwise

The native Apple client is now scaffolded under `app/apple/` with a shared SwiftUI codebase, LAN-server configuration, native microphone capture, speech playback, and shared session browsing against the same backend contract as the web app.

This keeps the app honest: real backend plumbing is present now, but the UX is still centered on correction, roleplay, and steady learning progress instead of premature platform sprawl.
