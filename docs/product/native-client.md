# Native Apple Client

## Goal

Build an official SwiftUI client for iPhone, iPad, and Mac that feels polished and easy to use, while continuing to rely on the existing shared backend for the heavy AI and persistence work.

The first scaffold now lives in `app/apple/` and uses XcodeGen so the Xcode project stays reproducible in git.

The v1 client is meant to be installed directly onto your personal household iPhones, iPads, and Macs, then configured against one shared local-network backend.

## Platform Strategy

- one SwiftUI codebase should cover iPhone, iPad, and macOS as much as practical
- use Xcode as the primary IDE
- use XcodeGen to generate the project so the app stays reproducible in version control
- keep server-side logic on the shared backend rather than duplicating it in the app
- allow the app to work well on a household LAN server, including a separate Windows 11 machine

## UX Goals

- make the app feel like a real Apple product, not a browser wrapper
- prioritize fast access, clean typography, generous spacing, and calm visual hierarchy
- keep the core flow focused on learner selection, input, feedback, and session history
- support both portrait iPhone use and wider Mac/iPad layouts

## Backend Contract

- the native app should call the same bootstrap, coaching, session, and transcription endpoints as the web client
- learner profiles, scenario catalogs, and session history should stay in the shared backend and database
- speech input should still degrade gracefully if the transcription service is unavailable
- Macs should use the native macOS target rather than the iPad-on-Mac compatibility path

## Current Scope

- the current scaffold already supports learner selection, scenario selection, text submission, session browsing, server configuration, native microphone capture, and local speech playback
- the native app reuses the same product rules, scenario data, and correction logic from the shared backend
- the first native milestone remains a polished text-first experience, not a separate speech-heavy product
