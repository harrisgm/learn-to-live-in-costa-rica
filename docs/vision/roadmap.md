# Roadmap

## Milestone 0: Repo Bootstrap

- establish the repository structure
- define product, curriculum, and setup docs
- create reusable prompt packs
- add starter schemas and data files
- scaffold the local-network web app and backend boundary

## Milestone 1: Text Coach

- accept typed or pasted Spanish
- return corrected Spanish
- explain mistakes in English
- suggest a more native-like phrasing
- tag recurring error patterns
- persist sessions in Postgres through the backend API
- support both learners in the same shared environment

## Milestone 2: Scenario Engine

- select daily-life Costa Rica scenarios
- generate roleplay turns
- tune difficulty from beginner to Costa Rica fast
- track improvement by scenario
- serve scenario content from the backend so multiple devices stay in sync

## Milestone 3: Couple Mode

- alternate partner turns
- support guided practice routines
- suggest follow-up prompts and repairs
- track which partner needs support in which areas
- let one shared server coordinate both devices on the local network

## Milestone 4: Audio Prototype

- experiment with push-to-talk
- capture transcript input
- route transcript through existing correction workflow
- assess whether audio adds enough value to justify complexity
- keep speech optional so text-first coaching stays usable if audio is offline or delayed

## Milestone 5: Listening Lab

- transcript compare drills
- dictation exercises
- speed ladders
- local-accent exposure packs

## Milestone 6: Native Path

- evaluate an iPhone-native client or wrapper if it improves offline and household usage
- keep server APIs portable so a future native client can reuse the same backend
- decide on-device versus server-heavy AI only after the text and speech loop is stable

## Milestone 7: Official Apple Client

- generate a SwiftUI iOS/macOS app with XcodeGen
- connect the app to the shared LAN backend
- polish the native experience for iPhone, iPad, and Mac
- keep the native and web clients on the same product contract
