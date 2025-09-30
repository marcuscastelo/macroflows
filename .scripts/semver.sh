#!/bin/bash
set -e

OWNER_REPO="marcuscastelo/macroflows"
REPO_URL="https://github.com/$OWNER_REPO"


# Retry and rate limit configuration
MAX_RETRIES="${SEMVER_MAX_RETRIES:-3}"
INITIAL_RETRY_DELAY="${SEMVER_INITIAL_RETRY_DELAY:-2}"
MAX_RETRY_DELAY="${SEMVER_MAX_RETRY_DELAY:-60}"
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
  elif [ -n "$GITHUB_HEAD_REF" ]; then
    echo "$GITHUB_HEAD_REF"
  else
    local branch
    branch=$(git rev-parse --abbrev-ref HEAD)
    if [ $? -ne 0 ] || [ -z "$branch" ]; then
      echo "Error: failed to get current branch from git" >&2
      exit 1
    fi
    echo "$branch"
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
  local sha
  sha=$(git ls-remote "$REPO_URL" "refs/heads/$branch" | awk '{print $1}')
  if [ -z "$sha" ]; then
    echo "Error: branch '$branch' does not exist in remote $REPO_URL" >&2
    exit 1
  fi
  echo "$sha"
}

get_commit_count_between() {
  local from_sha="$1"
  local to_sha="$2"
  local attempt=0
  local delay="$INITIAL_RETRY_DELAY"
  local response http_status rate_limit_remaining rate_limit_reset
  
  while [ $attempt -lt "$MAX_RETRIES" ]; do
    debug_log "API call attempt $((attempt + 1))/$MAX_RETRIES for commit count between $from_sha and $to_sha"
    
    response=$(curl -s -w "\n%{http_code}" -D /tmp/semver_headers_$$.txt \
      "https://api.github.com/repos/$OWNER_REPO/compare/$from_sha...$to_sha" 2>&1)
    http_status=$(echo "$response" | tail -n1)
    response=$(echo "$response" | sed '$d')
    
    # Extract rate limit info from headers if available
    if [ -f /tmp/semver_headers_$$.txt ]; then
      rate_limit_remaining=$(grep -i "^x-ratelimit-remaining:" /tmp/semver_headers_$$.txt | awk '{print $2}' | tr -d '\r')
      rate_limit_reset=$(grep -i "^x-ratelimit-reset:" /tmp/semver_headers_$$.txt | awk '{print $2}' | tr -d '\r')
      rm -f /tmp/semver_headers_$$.txt
      
      debug_log "Rate limit remaining: ${rate_limit_remaining:-unknown}"
      if [ -n "$rate_limit_reset" ]; then
        debug_log "Rate limit resets at: $(date -d @$rate_limit_reset 2>/dev/null || echo $rate_limit_reset)"
      fi
    fi
    
    # Handle different HTTP status codes
    case "$http_status" in
      200)
        debug_log "API call successful (HTTP 200)"
        local count
        count=$(echo "$response" | grep 'total_commits' | head -1 | awk '{print $2}' | tr -d ',')
        if [ -z "$count" ]; then
          echo "Error: could not parse commit count from GitHub API response" >&2
          echo "$response" >&2
          exit 1
        fi
        echo "$count"
        return 0
        ;;
      
      403)
        # Rate limit or forbidden
        if echo "$response" | grep -qi "rate limit"; then
          echo "Warning: GitHub API rate limit exceeded" >&2
          if [ -n "$rate_limit_reset" ]; then
            local wait_time=$((rate_limit_reset - $(date +%s)))
            if [ $wait_time -gt 0 ] && [ $wait_time -lt 3600 ]; then
              echo "Rate limit resets in $wait_time seconds" >&2
              if [ $attempt -lt $((MAX_RETRIES - 1)) ]; then
                echo "Waiting for rate limit reset..." >&2
                sleep $((wait_time + 5))
                attempt=$((attempt + 1))
                continue
              fi
            fi
          fi
        else
          echo "Error: GitHub API access forbidden (HTTP 403)" >&2
          echo "This might be due to authentication issues or repository access restrictions" >&2
        fi
        ;;
      
      404)
        echo "Error: GitHub API resource not found (HTTP 404)" >&2
        echo "The comparison between $from_sha and $to_sha may not exist" >&2
        echo "?"
        return 1
        ;;
      
      5*)
        echo "Warning: GitHub API server error (HTTP $http_status)" >&2
        if [ $attempt -lt $((MAX_RETRIES - 1)) ]; then
          echo "Retrying after ${delay}s (attempt $((attempt + 1))/$MAX_RETRIES)..." >&2
          sleep $delay
          delay=$((delay * 2))
          if [ $delay -gt "$MAX_RETRY_DELAY" ]; then
            delay="$MAX_RETRY_DELAY"
          fi
          attempt=$((attempt + 1))
          continue
        fi
        ;;
      
      *)
        echo "Warning: Unexpected HTTP status $http_status from GitHub API" >&2
        debug_log "Response: $response"
        ;;
    esac
    
    # If we've exhausted retries for retryable errors, fall through
    if [ $attempt -ge $((MAX_RETRIES - 1)) ]; then
      echo "Error: GitHub API call failed after $MAX_RETRIES attempts" >&2
      echo "?"
      return 1
    fi
    
    # For non-retryable errors, exit early
    echo "?"
    return 1
  done
  
  echo "?"
  return 1
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

show_help() {
  echo "Usage: $0 [--help] [--test] [--verbose] [--debug]"
  echo "  --help      Show this help message and exit."
  echo "  --test      Run simple function tests and exit."
  echo "  --verbose   Enable verbose output (set -x)."
  echo "  --debug     Enable debug logging for API calls and retry logic."
  echo ""
  echo "Environment variables:"
  echo "  SEMVER_MAX_RETRIES          Maximum number of retry attempts (default: 3)"
  echo "  SEMVER_INITIAL_RETRY_DELAY  Initial delay between retries in seconds (default: 2)"
  echo "  SEMVER_MAX_RETRY_DELAY      Maximum delay between retries in seconds (default: 60)"
  echo "  SEMVER_DEBUG                Enable debug mode (true/false, default: false)"
}

# Parse arguments
if [ "$1" = "--help" ]; then
  show_help
  exit 0
fi

if [ "$1" = "--debug" ]; then
  DEBUG_MODE="true"
  shift
fi

if [ "$1" = "--test" ]; then
  echo "Testing get_current_branch"
  if [ -n "$(get_current_branch)" ]; then
    echo "PASS: get_current_branch"
  else
    echo "FAIL: get_current_branch"
    exit 1
  fi
  echo "Testing get_sha_for_branch stable"
  if [ -n "$(get_sha_for_branch stable)" ]; then
    echo "PASS: get_sha_for_branch stable"
  else
    echo "FAIL: get_sha_for_branch stable"
    exit 1
  fi
  echo "Testing get_issue_number for 'feature/123-description'"
  if [ "$(get_issue_number 'feature/123-description')" = '123' ]; then
    echo "PASS: get_issue_number"
  else
    echo "FAIL: get_issue_number"
    exit 1
  fi
  echo "Testing stable branch version output"
  current_branch=$(get_current_branch)
  if [ "$current_branch" = "stable" ]; then
    version_output=$(main)
    if [[ $version_output =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "PASS: stable branch outputs version tag"
    else
      echo "FAIL: stable branch outputs $version_output"
      exit 1
    fi
  fi
  echo 'All tests passed.'
  exit 0
fi

if [ "$1" = "--verbose" ]; then
  set -x
fi

main "$@"
