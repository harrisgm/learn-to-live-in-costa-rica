# Local Development

## Requirements

- Node.js 20+
- npm 10+
- a local Postgres instance or reachable LAN Postgres server for durable data
- Xcode 26+ for the native SwiftUI client when it is being developed
- XcodeGen for reproducible Apple project generation

## Suggested Environment

- `DATABASE_URL` points to the shared Postgres instance
- `OPENAI_API_KEY` enables AI correction and server-side transcription
- `OPENAI_MODEL` selects the correction model
- `OPENAI_TRANSCRIPTION_MODEL` selects the speech-to-text model

## App Setup

```bash
docker compose up -d postgres
cd app/web
npm install
cp .env.example .env.local
npm run dev:network
```

## Useful Commands

```bash
npm run dev
npm run dev:network
npm run build
npm run start
npm run start:network
npm run typecheck
```

```bash
cd app/apple
xcodegen generate
swift ../../scripts/generate-apple-brand-assets.swift
xcodebuild -project CostaRicaSpanishCoach.xcodeproj -scheme CostaRicaSpanishCoach-macOS -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO build
xcodebuild -project CostaRicaSpanishCoach.xcodeproj -scheme CostaRicaSpanishCoach-iOS -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build
```

## Physical Devices

- the `xcodebuild` commands above are verification checks and project-level builds
- for a real iPhone or iPad install, open the Xcode project, choose the `CostaRicaSpanishCoach-iOS` scheme, set signing, choose the physical device, and run from Xcode
- for a real Mac install, use the `CostaRicaSpanishCoach-macOS` scheme and the normal `My Mac` destination
- avoid `My Mac (Designed for iPad)` when you want the native desktop app
- after the app launches on-device, enter the shared backend LAN URL in the in-app connection screen
- use [apple-client.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/setup/apple-client.md) as the canonical install guide
- use [apple-distribution.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/setup/apple-distribution.md) once you want repeatable archives instead of direct Xcode installs

## Local-First Expectations

- v1 should work without a public cloud backend
- browser local storage may still be useful for cache-like UI state, but durable data belongs in Postgres
- personal learner data should live behind the backend and stay off the public repo
- the backend should be reachable from multiple devices on the same local network

## Future Enhancements

- add export/import workflows for backups and portability
- add speech experiments only after the text coaching flow feels solid
- add signing and device provisioning for household iPhone/iPad installs
- refine the SwiftUI native client now that the shared API contract exists
