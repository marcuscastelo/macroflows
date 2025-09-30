# Observability E2E Test Suite

This directory contains End-to-End (E2E) tests for the observability features of macroflows, including error reporting, logging, and PII scrubbing.

## Test Files

### `sentry.e2e.test.ts`
Tests Sentry integration and error reporting functionality:
- Sentry initialization with correct configuration
- DSN validation and handling
- Error and message capturing
- Integration configuration (session replay, profiling, trace propagation)
- PII scrubbing integration via `beforeSend` hook
- Graceful handling of initialization errors

**Coverage:** 9 tests

### `logging.e2e.test.ts`
Tests OpenTelemetry-based logging utilities:
- Log event creation with proper structure (debug, info, warn, error levels)
- Logging context (timestamps, file paths, function names)
- Error handling in logging
- Span management and integration
- Active span usage for nested logging

**Coverage:** 12 tests

### `piiScrubbing.e2e.test.ts`
Tests PII (Personally Identifiable Information) scrubbing functionality:
- Email address scrubbing (single and multiple)
- Phone number scrubbing (various formats)
- Credit card number scrubbing
- Password and sensitive field scrubbing
- Array and nested object scrubbing
- Custom replacement strings
- Sentry event scrubbing (request data, headers, breadcrumbs, contexts)
- Edge cases (null, undefined, mixed data types)

**Coverage:** 34 tests

## Total Coverage
- **55 E2E tests** covering all observability features
- All tests integrated with CI via `pnpm check`

## Running Tests

Run all observability tests:
```bash
pnpm test src/modules/observability/tests/
```

Run a specific test file:
```bash
pnpm test src/modules/observability/tests/sentry.e2e.test.ts
```

Run tests in watch mode:
```bash
pnpm vitest src/modules/observability/tests/
```

## Implementation Details

### PII Scrubbing
The `piiScrubbing.ts` module provides:
- Pattern-based scrubbing for emails, phone numbers, and credit cards
- Key-based scrubbing for passwords, tokens, and API keys
- Configurable options to enable/disable specific scrubbing rules
- Custom replacement strings
- Deep object and array traversal
- Integration with Sentry via `beforeSend` hook

### Logging
The logging utility (`~/shared/utils/logging.ts`) uses OpenTelemetry for:
- Structured log events with proper severity levels
- Automatic context extraction (file path, function name)
- Span management for distributed tracing
- Integration with Sentry for error tracking

### Sentry Integration
Sentry configuration (`~/modules/observability/infrastructure/sentry/`) includes:
- Client and server-side initialization
- Session replay and profiling
- Browser and router tracing
- OpenTelemetry integration
- PII scrubbing via `beforeSend` hook

## CI Integration

The observability E2E tests are automatically run as part of the CI pipeline:
1. Tests run via `pnpm check` command
2. Configured in `.github/workflows/ci.yml`
3. Run on all pull requests and pushes to release branches

## Future Enhancements

Potential improvements to the test suite:
- [ ] Add performance benchmarks for PII scrubbing
- [ ] Test OpenTelemetry trace propagation across services
- [ ] Add tests for Sentry breadcrumb creation
- [ ] Test log persistence and retrieval
- [ ] Add integration tests with real Sentry endpoint (using test DSN)
