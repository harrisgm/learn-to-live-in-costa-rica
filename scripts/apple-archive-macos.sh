#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_PATH="$ROOT_DIR/app/apple/CostaRicaSpanishCoach.xcodeproj"
SCHEME="${SCHEME:-CostaRicaSpanishCoach-macOS}"
CONFIGURATION="${CONFIGURATION:-Release}"
DESTINATION="${DESTINATION:-platform=macOS}"
DEVELOPMENT_TEAM="${DEVELOPMENT_TEAM:-}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-/tmp/crc-macos-archive-dd}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$ROOT_DIR/exports/apple/macos/CostaRicaSpanishCoach-macOS.xcarchive}"

if [[ -z "$DEVELOPMENT_TEAM" ]]; then
  echo "Set DEVELOPMENT_TEAM to your Apple team identifier before archiving."
  exit 1
fi

mkdir -p "$(dirname "$ARCHIVE_PATH")"

xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME" \
  -configuration "$CONFIGURATION" \
  -destination "$DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM" \
  CODE_SIGN_STYLE=Automatic \
  archive
