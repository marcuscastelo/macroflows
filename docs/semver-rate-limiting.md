# semver.sh Rate Limiting and Error Handling Strategy

## Overview

The `semver.sh` script has been enhanced with robust error handling and retry logic to handle GitHub API rate limiting and transient failures gracefully. This ensures reliable version management in CI/CD environments.

## Features

### 1. Retry Mechanism with Exponential Backoff

The script automatically retries failed API calls with exponential backoff:

- **Default retries**: 3 attempts
- **Initial delay**: 2 seconds
- **Maximum delay**: 60 seconds
- **Backoff strategy**: Delay doubles after each retry (2s → 4s → 8s → ...)

### 2. HTTP Status Code Handling

The script handles different HTTP status codes appropriately:

#### HTTP 200 (Success)
- Parses the response and extracts commit count
- Returns the count immediately

#### HTTP 403 (Forbidden/Rate Limited)
- Detects rate limit errors from response message
- Extracts `X-RateLimit-Reset` header to determine when limits reset
- Automatically waits for rate limit reset if possible (up to 1 hour)
- Provides clear error messages for authentication/access issues

#### HTTP 404 (Not Found)
- Returns graceful degradation value ("?")
- Logs descriptive error message about missing comparison

#### HTTP 5xx (Server Errors)
- Retries automatically with exponential backoff
- Logs retry attempts and delays
- Falls back to graceful degradation after max retries

#### Other Status Codes
- Logs unexpected status codes
- Enables debug mode for detailed response inspection
- Returns graceful degradation value

### 3. Rate Limit Detection

The script monitors GitHub API rate limits:

- Extracts `X-RateLimit-Remaining` header to track available requests
- Extracts `X-RateLimit-Reset` header to know when limits reset
- Logs rate limit information in debug mode
- Automatically waits for rate limit reset when possible

### 4. Debug Logging

Enable debug mode to troubleshoot API issues:

```bash
# Via command-line flag
./semver.sh --debug

# Via environment variable
SEMVER_DEBUG=true ./semver.sh

# Both methods work together
SEMVER_DEBUG=true ./semver.sh --debug
```

Debug mode logs:
- API call attempts and retry counts
- HTTP status codes and responses
- Rate limit information
- Retry delays and backoff calculations

### 5. Configurable Parameters

Customize retry behavior via environment variables:

```bash
# Maximum number of retry attempts (default: 3)
export SEMVER_MAX_RETRIES=5

# Initial delay between retries in seconds (default: 2)
export SEMVER_INITIAL_RETRY_DELAY=1

# Maximum delay between retries in seconds (default: 60)
export SEMVER_MAX_RETRY_DELAY=30

# Enable debug mode (default: false)
export SEMVER_DEBUG=true

./semver.sh
```

## Usage Examples

### Normal Usage

```bash
./semver.sh
# Output: v0.12.0-dev.5+issue.821
```

### With Debug Mode

```bash
SEMVER_DEBUG=true ./semver.sh --debug
# Output includes debug logs:
# [DEBUG] API call attempt 1/3 for commit count between abc123 and def456
# [DEBUG] Rate limit remaining: 60
# [DEBUG] API call successful (HTTP 200)
# v0.12.0-dev.5+issue.821
```

### Custom Retry Configuration

```bash
# More aggressive retries for CI environments
export SEMVER_MAX_RETRIES=5
export SEMVER_INITIAL_RETRY_DELAY=1
export SEMVER_MAX_RETRY_DELAY=120

./semver.sh
```

### View Help

```bash
./semver.sh --help
# Shows all available options and environment variables
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Get Version
  run: |
    # Configure retry behavior for CI
    export SEMVER_MAX_RETRIES=5
    export SEMVER_INITIAL_RETRY_DELAY=2
    
    # Get version with retry logic
    version=$(./scripts/semver.sh)
    echo "VERSION=$version" >> $GITHUB_ENV
  env:
    SEMVER_DEBUG: 'false'
```

### Vercel Example

The script automatically detects Vercel environment:

```bash
# Vercel sets VERCEL_GIT_COMMIT_REF automatically
# No special configuration needed
./semver.sh
```

### Jenkins Example

```groovy
stage('Get Version') {
  steps {
    script {
      env.SEMVER_MAX_RETRIES = '5'
      env.SEMVER_DEBUG = 'true'
      
      def version = sh(
        script: './scripts/semver.sh',
        returnStdout: true
      ).trim()
      
      env.APP_VERSION = version
    }
  }
}
```

## Error Scenarios

### Scenario 1: Rate Limit Exceeded

```
Warning: GitHub API rate limit exceeded
Rate limit resets in 1234 seconds
Waiting for rate limit reset...
[DEBUG] API call attempt 2/3 for commit count between abc123 and def456
[DEBUG] API call successful (HTTP 200)
```

**Result**: Script waits for rate limit reset and retries automatically.

### Scenario 2: Transient Server Error

```
Warning: GitHub API server error (HTTP 500)
Retrying after 2s (attempt 1/3)...
Warning: GitHub API server error (HTTP 500)
Retrying after 4s (attempt 2/3)...
[DEBUG] API call successful (HTTP 200)
```

**Result**: Script retries with exponential backoff and succeeds.

### Scenario 3: Persistent Failure

```
Warning: GitHub API server error (HTTP 500)
Retrying after 2s (attempt 1/3)...
Warning: GitHub API server error (HTTP 500)
Retrying after 4s (attempt 2/3)...
Warning: GitHub API server error (HTTP 500)
Error: GitHub API call failed after 3 attempts
```

**Result**: Script returns "?" for graceful degradation after exhausting retries.

### Scenario 4: Resource Not Found

```
Error: GitHub API resource not found (HTTP 404)
The comparison between abc123 and def456 may not exist
```

**Result**: Script returns "?" immediately (no retries for 404).

## Best Practices

1. **Enable debug mode during development**: Use `--debug` flag to understand API behavior
2. **Configure retries for CI**: Set higher retry counts in CI environments
3. **Monitor rate limits**: Check debug logs to see rate limit usage
4. **Use environment variables**: Configure behavior without modifying the script
5. **Handle graceful degradation**: Check for "?" in version strings and handle appropriately

## Troubleshooting

### Issue: Rate limits frequently exceeded

**Solution**: 
- Use GitHub authentication tokens in CI (increases rate limit from 60 to 5000/hour)
- Reduce API calls by caching results
- Increase `SEMVER_MAX_RETRIES` and wait for rate limit reset

### Issue: Slow API responses in CI

**Solution**:
- Enable debug mode to diagnose delays
- Check if retries are occurring (server errors)
- Consider caching version information between builds

### Issue: Version shows "?" or "unavailable"

**Solution**:
- Enable debug mode: `SEMVER_DEBUG=true ./semver.sh --debug`
- Check API connectivity and rate limits
- Verify repository and branch names are correct
- Review error messages for specific HTTP status codes

## Testing

Run the comprehensive retry logic tests:

```bash
./.scripts/semver-retry-test.sh --test
```

This test suite validates:
- Retry configuration
- Debug mode functionality
- Help message completeness
- Graceful degradation
- Retry logic structure
- HTTP status code handling
- Rate limit header parsing

## References

- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [GitHub API Status Codes](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#http-status-codes)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
