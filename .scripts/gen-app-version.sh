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
VERSION=$("$DIR/semver.sh")
echo '{"version": "'$VERSION'"}' > "$ROOT/src/app-version.json"
