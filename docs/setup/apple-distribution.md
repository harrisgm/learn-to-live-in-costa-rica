# Apple Distribution

## Goal

Use the SwiftUI app as a real household install, not just a project you run from Xcode on one machine.

The fastest path is still:

1. install directly from Xcode onto each household device
2. confirm the LAN backend flow is stable
3. move to archives and exported builds only after the direct install path feels boring

## Archive Helpers

The repo now includes two archive wrappers:

- `scripts/apple-archive-ios.sh`
- `scripts/apple-archive-macos.sh`

Both scripts expect `DEVELOPMENT_TEAM` to be set before running.

Example:

```bash
DEVELOPMENT_TEAM=YOURTEAMID ./scripts/apple-archive-ios.sh
DEVELOPMENT_TEAM=YOURTEAMID ./scripts/apple-archive-macos.sh
```

## iOS Export Options

For iPhone and iPad exports, start from:

- `app/apple/export-options/ios-development.plist`
- `app/apple/export-options/ios-ad-hoc.plist`

Replace `YOUR_TEAM_ID` before using them.

Example development export:

```bash
DEVELOPMENT_TEAM=YOURTEAMID \
EXPORT_OPTIONS_PLIST=app/apple/export-options/ios-development.plist \
./scripts/apple-archive-ios.sh
```

## Recommended Household Path

- use direct Xcode installs first for your iPhone, iPad, and Macs
- once that is stable, use the iOS archive helper for ad hoc household installs
- keep the native macOS target as the Mac experience instead of the iPad-on-Mac compatibility path
- keep all devices pointed at the same LAN backend URL

## Notes

- this repo does not hard-code your Apple team ID because that is machine/account specific
- if you regenerate the Xcode project, re-check signing before the next archive
- the archive helpers are meant to reduce repetition, not replace Xcode when you need signing diagnosis
