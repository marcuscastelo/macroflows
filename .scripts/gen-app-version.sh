#!/usr/bin/env bash
set -e
. "$(dirname "$0")/utils.sh"

if [ "$1" = "--test" ]; then
  section "Running gen-app-version.sh tests"
  DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  run_test "semver.sh returns version" "${DIR}/semver.sh >/dev/null 2>&1"
  section_end "gen-app-version.sh tests"
  exit 0
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$DIR/.."

# Try to get version from semver.sh, with fallback on failure
VERSION=""
if VERSION=$("$DIR/semver.sh" 2>&1); then
  # semver.sh succeeded
  :
else
  # semver.sh failed, use fallback
  echo "Warning: semver.sh failed, using fallback version from git describe" >&2
  VERSION=$(git describe --tags --always 2>/dev/null || echo "v0.0.0-unknown")
fi

# Ensure we have a version
if [ -z "$VERSION" ]; then
  echo "Warning: Could not determine version, using fallback" >&2
  VERSION=$(git describe --tags --always 2>/dev/null || echo "v0.0.0-unknown")
fi

echo '{"version": "'$VERSION'"}' > "$ROOT/src/app-version.json"
