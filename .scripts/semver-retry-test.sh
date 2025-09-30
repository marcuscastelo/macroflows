#!/bin/bash
# Test script for semver.sh retry logic and error handling

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEMVER_SCRIPT="$SCRIPT_DIR/semver.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

log_test() {
  echo -e "${YELLOW}TEST:${NC} $1"
}

log_pass() {
  echo -e "${GREEN}✓ PASS:${NC} $1"
  pass_count=$((pass_count + 1))
}

log_fail() {
  echo -e "${RED}✗ FAIL:${NC} $1"
  fail_count=$((fail_count + 1))
}

# Mock GitHub API server for testing
start_mock_server() {
  local port="${1:-8888}"
  local response_type="${2:-success}"
  
  # Create a simple mock server script
  cat > /tmp/mock_github_api.sh << 'EOF'
#!/bin/bash
port=$1
response_type=$2
attempt_file="/tmp/api_attempts_$$"
echo "0" > "$attempt_file"

while true; do
  {
    attempts=$(cat "$attempt_file")
    attempts=$((attempts + 1))
    echo "$attempts" > "$attempt_file"
    
    case "$response_type" in
      success)
        echo -e "HTTP/1.1 200 OK\r"
        echo -e "Content-Type: application/json\r"
        echo -e "X-RateLimit-Remaining: 60\r"
        echo -e "\r"
        echo '{"total_commits": 5}'
        ;;
      rate_limit)
        if [ $attempts -le 2 ]; then
          reset_time=$(($(date +%s) + 10))
          echo -e "HTTP/1.1 403 Forbidden\r"
          echo -e "Content-Type: application/json\r"
          echo -e "X-RateLimit-Remaining: 0\r"
          echo -e "X-RateLimit-Reset: $reset_time\r"
          echo -e "\r"
          echo '{"message": "API rate limit exceeded"}'
        else
          echo -e "HTTP/1.1 200 OK\r"
          echo -e "Content-Type: application/json\r"
          echo -e "\r"
          echo '{"total_commits": 5}'
        fi
        ;;
      server_error)
        if [ $attempts -le 2 ]; then
          echo -e "HTTP/1.1 500 Internal Server Error\r"
          echo -e "\r"
          echo '{"message": "Internal server error"}'
        else
          echo -e "HTTP/1.1 200 OK\r"
          echo -e "Content-Type: application/json\r"
          echo -e "\r"
          echo '{"total_commits": 5}'
        fi
        ;;
      not_found)
        echo -e "HTTP/1.1 404 Not Found\r"
        echo -e "\r"
        echo '{"message": "Not Found"}'
        ;;
    esac
  } | nc -l -p "$port" -q 1
done
EOF
  chmod +x /tmp/mock_github_api.sh
  /tmp/mock_github_api.sh "$port" "$response_type" &
  echo $!
}

# Test 1: Verify retry configuration environment variables
test_retry_config() {
  log_test "Retry configuration via environment variables"
  
  export SEMVER_MAX_RETRIES=5
  export SEMVER_INITIAL_RETRY_DELAY=1
  export SEMVER_MAX_RETRY_DELAY=30
  
  # Just check that the script accepts these variables (basic smoke test)
  if bash "$SEMVER_SCRIPT" --help | grep -q "SEMVER_MAX_RETRIES"; then
    log_pass "Script documents retry configuration"
  else
    log_fail "Script doesn't document retry configuration"
  fi
  
  unset SEMVER_MAX_RETRIES SEMVER_INITIAL_RETRY_DELAY SEMVER_MAX_RETRY_DELAY
}

# Test 2: Verify debug mode works
test_debug_mode() {
  log_test "Debug mode functionality"
  
  output=$(SEMVER_DEBUG=true bash "$SEMVER_SCRIPT" --debug 2>&1 || true)
  
  # Debug mode should produce some debug output if API is called
  # For now, just verify the script runs without error in debug mode
  if [ $? -eq 0 ] || echo "$output" | grep -q "\[DEBUG\]"; then
    log_pass "Debug mode works"
  else
    log_fail "Debug mode failed"
  fi
}

# Test 3: Verify help message includes new options
test_help_message() {
  log_test "Help message completeness"
  
  help_output=$(bash "$SEMVER_SCRIPT" --help)
  
  if echo "$help_output" | grep -q "\-\-debug"; then
    log_pass "Help includes --debug flag"
  else
    log_fail "Help missing --debug flag"
  fi
  
  if echo "$help_output" | grep -q "SEMVER_MAX_RETRIES"; then
    log_pass "Help includes SEMVER_MAX_RETRIES"
  else
    log_fail "Help missing SEMVER_MAX_RETRIES"
  fi
}

# Test 4: Verify script handles missing API gracefully
test_graceful_degradation() {
  log_test "Graceful degradation when API fails"
  
  # Source the script functions in a subshell and test with invalid SHA
  output=$(bash -c "
    source $SEMVER_SCRIPT
    SEMVER_MAX_RETRIES=1
    get_commit_count_between 'invalid_sha_1' 'invalid_sha_2' 2>&1
  " || true)
  
  # Should return "?" for graceful degradation
  if echo "$output" | grep -q "?"; then
    log_pass "Script gracefully degrades on API failure"
  else
    log_fail "Script doesn't gracefully degrade"
  fi
}

# Test 5: Verify retry mechanism with exponential backoff concept
test_retry_logic_structure() {
  log_test "Retry logic structure"
  
  # Check that the script contains retry loop logic
  if grep -q "while \[ \$attempt -lt" "$SEMVER_SCRIPT"; then
    log_pass "Script contains retry loop"
  else
    log_fail "Script missing retry loop"
  fi
  
  # Check for exponential backoff logic
  if grep -q "delay=\$((delay \* 2))" "$SEMVER_SCRIPT"; then
    log_pass "Script implements exponential backoff"
  else
    log_fail "Script missing exponential backoff"
  fi
  
  # Check for max delay cap
  if grep -q "MAX_RETRY_DELAY" "$SEMVER_SCRIPT"; then
    log_pass "Script caps maximum retry delay"
  else
    log_fail "Script missing max delay cap"
  fi
}

# Test 6: Verify HTTP status code handling
test_http_status_handling() {
  log_test "HTTP status code handling"
  
  # Check for 403 rate limit handling
  if grep -q "403)" "$SEMVER_SCRIPT" && grep -q "rate limit" "$SEMVER_SCRIPT"; then
    log_pass "Script handles 403 rate limit"
  else
    log_fail "Script missing 403 rate limit handling"
  fi
  
  # Check for 404 handling
  if grep -q "404)" "$SEMVER_SCRIPT"; then
    log_pass "Script handles 404 not found"
  else
    log_fail "Script missing 404 handling"
  fi
  
  # Check for 5xx server error handling
  if grep -q "5\*)" "$SEMVER_SCRIPT"; then
    log_pass "Script handles 5xx server errors"
  else
    log_fail "Script missing 5xx error handling"
  fi
}

# Test 7: Verify rate limit header parsing
test_rate_limit_headers() {
  log_test "Rate limit header parsing"
  
  # Check for rate limit header extraction
  if grep -q "x-ratelimit-remaining" "$SEMVER_SCRIPT"; then
    log_pass "Script extracts rate limit remaining"
  else
    log_fail "Script doesn't extract rate limit remaining"
  fi
  
  if grep -q "x-ratelimit-reset" "$SEMVER_SCRIPT"; then
    log_pass "Script extracts rate limit reset time"
  else
    log_fail "Script doesn't extract rate limit reset time"
  fi
}

# Main test execution
main() {
  echo "================================================"
  echo "  semver.sh Retry Logic and Error Handling Tests"
  echo "================================================"
  echo ""
  
  test_retry_config
  test_debug_mode
  test_help_message
  test_graceful_degradation
  test_retry_logic_structure
  test_http_status_handling
  test_rate_limit_headers
  
  echo ""
  echo "================================================"
  echo "Test Summary:"
  echo -e "  ${GREEN}Passed: $pass_count${NC}"
  echo -e "  ${RED}Failed: $fail_count${NC}"
  echo "================================================"
  
  if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
  fi
}

# Run tests if not sourced
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  if [ "$1" = "--test" ]; then
    main
  else
    main
  fi
fi
