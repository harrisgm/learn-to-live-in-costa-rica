# Apple Client Setup

## Goal

This is the practical install guide for getting the native SwiftUI app onto your real household devices while keeping all AI and persistence on the shared backend.

The Apple client lives in `app/apple/` and is meant to be installed directly onto:

- your iPhone 16 Pro
- your iPad 11-inch M3
- your MacBook Pro M4 Max
- your wife's iPhone 17
- your wife's MacBook Air M4

All of those devices should point at the same LAN backend URL once the app is installed.

## What The Apple Client Does

- gives you a native SwiftUI experience instead of a browser wrapper
- reads the same learner/scenario/session data as the web app
- records microphone input natively when speech is enabled
- keeps the AI-heavy work on the shared backend

## 1. Generate The Xcode Project

```bash
cd app/apple
xcodegen generate
open CostaRicaSpanishCoach.xcodeproj
```

If you refresh the brand assets, run this from the repo root first:

```bash
swift scripts/generate-apple-brand-assets.swift
```

## 2. Configure Signing In Xcode

In Xcode:

1. Select the project.
2. Open the `CostaRicaSpanishCoach-iOS` target.
3. Open `Signing & Capabilities`.
4. Turn on automatic signing if Xcode has not already done it.
5. Choose your Apple Developer team.
6. Repeat for the `CostaRicaSpanishCoach-macOS` target.

Notes:

- use your personal Apple Developer account/team for direct installs to your own household devices
- if Xcode asks to manage signing automatically, that is fine for this stage
- the first run-to-device path is more important than over-optimizing distribution early
- if you regenerate the project with XcodeGen later, re-check the selected team before the next device install

## 3. Install On Real Devices

### iPhone / iPad

1. Connect the device to your Mac or use Xcode wireless debugging if already configured.
2. Choose the physical iPhone or iPad as the Xcode run target.
3. Build and run the `CostaRicaSpanishCoach-iOS` scheme.
4. If iOS asks you to trust the developer/app, complete that prompt on the device.

Avoid this path for household Mac installs:

- do not choose `My Mac (Designed for iPad)` for the iOS scheme when what you want is the real desktop app
- this repo already includes a separate native macOS target, which is the better Mac experience

### Mac

1. Choose `My Mac` as the run target.
2. Run the `CostaRicaSpanishCoach-macOS` scheme.
3. The app should launch as a normal native Mac app with its own Settings scene.

## 4. Point Every Device At The Shared Backend

On first launch, the app opens the connection screen. Enter the LAN URL for the shared backend machine, for example:

- `http://192.168.1.40:3000`
- `http://coach.local:3000` if you have a working local hostname
- `http://127.0.0.1:3000` only when the native app and backend are running on the same Mac

The app now tests the connection before saving, so incorrect URLs should fail inside setup instead of silently dismissing.

## 5. Household Usage Pattern

Recommended pattern:

1. Keep the backend running on the separate server machine or main household Mac.
2. Install the Apple app once on each household device from Xcode.
3. Save the same backend URL on each device.
4. Let each person use their own learner profile inside the shared app.

That gives you:

- shared durable sessions
- one source of truth for learner history
- easier support for speech and future features
- a clean native front end on every Apple device

## 6. Optional Later Convenience Paths

Once the direct Xcode install flow feels stable, you can optionally make deployment smoother by using a signed archive/distribution path for your household instead of re-running from Xcode every time.

That is a later convenience step, not the required first milestone.

Use [apple-distribution.md](/Users/guyharris/learn-to-live-in-costa-rica/docs/setup/apple-distribution.md) when you are ready to move from direct Xcode installs to repeatable archives and exported builds.

## Troubleshooting

- If the app cannot connect, verify the backend is running and reachable from the same Wi-Fi/LAN.
- If the iPhone or iPad cannot load data, re-open the connection screen and confirm the saved backend address.
- If Xcode says the executable is not codesigned, make sure you are using a target with automatic signing enabled and that a real Apple team is selected for both targets.
- If a Mac run fails while the destination says `My Mac (Designed for iPad)`, switch to the `CostaRicaSpanishCoach-macOS` scheme and the normal `My Mac` destination instead.
- If one device works and another does not, compare the saved backend URL on both devices first.
- If Xcode shows `Failed to send CA Event for app launch measurements ... ExtendedLaunchMetrics` while the simulator app still launches, treat that as an Xcode launch-metrics warning first, not as proof that the app itself failed.
