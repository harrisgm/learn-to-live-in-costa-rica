# Apple Client Setup

## Intent

This document describes the current SwiftUI Apple client scaffold that consumes the existing shared backend.

## Project Shape

- generate the native project with XcodeGen
- open and iterate in Xcode
- keep the SwiftUI app in `app/apple/`
- reuse the same backend API that powers the web app

## Expected Workflow

- point the native app at the LAN server through a configurable base URL
- expect the app to prompt for the server URL on first launch if it is not configured yet
- read bootstrap data from the backend on launch
- submit learner input to the coaching endpoint
- fetch session history for the selected learner
- optionally upload audio for transcription when speech is enabled

## Environment

- the backend can run on a separate Windows 11 machine or any other reachable server on the local network
- the Apple client should support iPhone, iPad, and Mac without requiring a separate backend per device
- the native client should continue to work as a text-first coach if speech is disabled

## Quick Start

```bash
cd app/apple
xcodegen generate
open CostaRicaSpanishCoach.xcodeproj
```

- choose the `CostaRicaSpanishCoach-iOS` or `CostaRicaSpanishCoach-macOS` scheme
- set signing in Xcode before running on physical devices
- on iPhone or iPad, enter the LAN IP or hostname of the shared backend machine in the server settings sheet

## Future Notes

- if the native client becomes the preferred daily-use app, it should still remain a thin client over the shared backend
- keep the API contract portable so web and native clients stay aligned
