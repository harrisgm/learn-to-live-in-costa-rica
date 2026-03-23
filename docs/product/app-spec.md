# Costa Rica Spanish Coach App Spec

## Product Name

Costa Rica Spanish Coach

## V1 Objective

Deliver a local-network coaching system that helps two learners practice Spanish, receive corrections, and build confidence through a shared backend, while keeping the text-first UX simple and fast.

## Core V1 Features

### Input Modes

- typed Spanish
- pasted transcript
- recorded speech that transcribes and runs through the same coaching contract
- optional future push-to-talk refinements, without splitting speech into a separate subsystem

### Output Panel

The app should present:

- transcript or original input
- corrected Spanish
- more natural phrasing
- concise English explanation
- typed error tags with severity
- retry prompt
- suggested follow-up prompt
- richer drill suggestions derived from saved history
- vocabulary notes
- lightweight pronunciation hints
- review recommendation
- listening recommendations when a scenario has a matching pack

### Conversation Modes

- tutor mode
- roleplay mode
- Costa Rica scenario mode with structured turns and branches
- couple turn-taking mode

### Difficulty Levels

- beginner
- beginner+
- intermediate
- natural
- Costa Rica fast

### Error Tracking

Track recurring issues such as:

- `ser` vs `estar`
- verb endings
- article and gender agreement
- prepositions
- tense selection
- literal translations from English
- register and naturalness mismatches
- clarity/repair-needed turns

### Session History

Each session should be able to capture:

- date
- learner
- scenario id plus scenario snapshot
- scenario variant and turn context
- input mode
- transcript or learner reply
- corrected reply
- natural reply
- retry prompt
- follow-up prompt
- typed error tags
- review recommendation
- recommended drills
- couple handoff metadata when applicable
- listening-pack reference when applicable
- confidence score

### Review Surface

Each learner should be able to inspect:

- recent mistakes worth retrying
- recurring tags across saved sessions
- richer drill recommendations generated from persisted session history
- listening follow-up suggestions for dictation and shadowing

## Architecture Notes

- keep the app local-network first rather than cloud dependent
- use a backend/API layer to coordinate both learners and multiple devices
- persist sessions, profiles, and activity data in Postgres
- keep private learner state behind the backend instead of browser-only storage
- add speech infrastructure as an optional layer that feeds the same text correction pipeline
- persist structured coaching results so mistake review can be rebuilt later from saved sessions
- do not block core UX on speech integration
- keep server contracts portable so a future iPhone/native client can reuse them

## Deployment Shape

- one shared server can run on a separate Windows 11 machine on the local network
- phones, MacBooks, and other computers should connect to the same backend
- the app should continue to work if audio is unavailable, since text-first practice is the primary v1 loop

## Native Apple Client

- the first official Apple client should be a SwiftUI app that targets iPhone, iPad, and Mac from one codebase
- use Xcode and XcodeGen so the project stays reproducible and easy to open in Xcode
- keep the UI polished, native-feeling, and fast to launch on Apple devices
- let the client talk only to the shared backend API instead of duplicating business logic locally
- keep the server contracts stable so the Apple client and the web client can share the same backend behaviors
- expose the same retry-first structured feedback and learner review surfaces as the web reference implementation
