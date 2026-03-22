# Costa Rica Spanish Coach App Spec

## Product Name

Costa Rica Spanish Coach

## V1 Objective

Deliver a local-network coaching system that helps two learners practice Spanish, receive corrections, and build confidence through a shared backend, while keeping the text-first UX simple and fast.

## Core V1 Features

### Input Modes

- typed Spanish
- pasted transcript
- placeholder path for future audio transcript input
- future push-to-talk transcript input through a speech service or local capture path

### Output Panel

The app should present:

- original user input
- corrected Spanish
- more natural phrasing
- English explanation
- vocabulary notes
- pronunciation watch-outs
- suggested follow-up reply

### Conversation Modes

- tutor mode
- roleplay mode
- Costa Rica scenario mode
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

### Session History

Each session should be able to capture:

- date
- prompt or scenario
- learner reply
- corrected reply
- error tags
- confidence score

## Architecture Notes

- keep the app local-network first rather than cloud dependent
- use a backend/API layer to coordinate both learners and multiple devices
- persist sessions, profiles, and activity data in Postgres
- keep private learner state behind the backend instead of browser-only storage
- add speech infrastructure as an optional layer that feeds the same text correction pipeline
- do not block core UX on speech integration
- keep server contracts portable so a future iPhone/native client can reuse them

## Deployment Shape

- one shared server can run on a separate Windows 11 machine on the local network
- phones, MacBooks, and other computers should connect to the same backend
- the app should continue to work if audio is unavailable, since text-first practice is the primary v1 loop
