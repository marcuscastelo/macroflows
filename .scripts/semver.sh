#!/bin/bash
set -e

OWNER_REPO="marcuscastelo/macroflows"
REPO_URL="https://github.com/$OWNER_REPO"

DEBUG_MODE="${SEMVER_DEBUG:-false}"

debug_log() {
  if [ "$DEBUG_MODE" = "true" ]; then
    echo "[DEBUG] $*" >&2
  fi
}

get_next_minor_version() {
  local last_tag="$1"
  # remove prefix 'v'
  local version="${last_tag#v}"
  local major minor patch
  IFS='.' read -r major minor patch <<< "$version"
  minor=$((minor + 1))
  echo "v${major}.${minor}.0"
}


get_current_branch() {
  if [ -n "$VERCEL_GIT_COMMIT_REF" ]; then
    echo "$VERCEL_GIT_COMMIT_REF"
  else
    git rev-parse --abbrev-ref HEAD
  fi
}

get_latest_release_tag() {
  local tag
  tag=$(git ls-remote --tags --refs "$REPO_URL" | awk -F/ '{print $3}' | sort -V | tail -n1)
  if [ -z "$tag" ]; then
    tag="v0.0.0"
  fi
  echo "$tag"
}

get_sha_for_branch() {
  local branch="$1"
  git ls-remote "$REPO_URL" "refs/heads/$branch" | awk '{print $1}'
}

get_commit_count_between() {
  local from_ref="$1"
  local to_ref="$2"
  git rev-list --count "$from_ref..$to_ref"
}

get_issue_number() {
  local branch="$1"
  echo "$branch" | sed -E 's|.*/[^0-9]*([0-9]+).*|\1|'
}

get_rc_version() {
  local current_branch="$1"
  local base_version stable_sha rc_sha rc_count
  base_version=$(get_next_minor_version "$(get_latest_release_tag)")
  stable_sha=$(get_sha_for_branch stable)
  rc_sha=$(get_sha_for_branch "$current_branch")

  rc_count=$(get_commit_count_between "$stable_sha" "$rc_sha")
  echo "${base_version}-rc.${rc_count}"
}

get_dev_version() {
  local current_branch="$1"
  local base_version stable_sha rc_branch rc_sha dev_sha rc_count dev_count issue_number

  base_version=$(get_next_minor_version "$(get_latest_release_tag)")
  stable_sha=$(get_sha_for_branch stable)
  dev_sha=$(get_sha_for_branch "$current_branch")

  rc_branch=$(git for-each-ref --format='%(refname:short)' refs/remotes/origin/ | grep 'rc/' | sort | tail -n1)

  if [ -z "$rc_branch" ]; then
    dev_count=$(git rev-list --count "$stable_sha..$dev_sha")
    echo "${base_version}-dev.0.${dev_count}"
    return
  fi

  rc_sha=$(git ls-remote "$REPO_URL" "refs/heads/${rc_branch#origin/}" | awk '{print $1}')

  rc_count=$(get_commit_count_between "$stable_sha" "$rc_sha")
  dev_count=$(get_commit_count_between "$rc_sha" "$dev_sha")
  issue_number=$(get_issue_number "$current_branch")

  local version="${base_version}-dev.${rc_count}.${dev_count}"
  if [[ -n "$issue_number" ]]; then
    version="${version}+issue${issue_number}"
  fi

  echo "$version"
}

main() {
  current_branch=$(get_current_branch)

  if [[ "$current_branch" =~ ^rc/ ]]; then
    get_rc_version "$current_branch"
    exit 0
  fi

  if [[ "$current_branch" == "stable" ]]; then
    get_latest_release_tag
    exit 0
  fi

  get_dev_version "$current_branch"
}

main "$@"
