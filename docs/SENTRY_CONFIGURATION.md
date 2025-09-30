# Sentry Configuration Guide

This guide explains how to configure Sentry for error tracking, performance monitoring, and session replay across different environments.

## Overview

Sentry is configured with environment-specific sample rates to balance observability needs with cost management. The configuration automatically adjusts based on the environment (development, staging, production).

## Environment-Based Sample Rates

Sample rates control what percentage of events are sent to Sentry. Different environments have different default rates:

### Development
- **Traces Sample Rate**: 100% (1.0)
- **Session Replay Sample Rate**: 100% (1.0)
- **Replay on Error Sample Rate**: 100% (1.0)
- **Profiles Sample Rate**: 100% (1.0)

Full sampling in development helps catch issues early and provides complete visibility during development.

### Staging
- **Traces Sample Rate**: 50% (0.5)
- **Session Replay Sample Rate**: 50% (0.5)
- **Replay on Error Sample Rate**: 100% (1.0)
- **Profiles Sample Rate**: 50% (0.5)

Balanced sampling in staging provides good visibility while managing costs. Error replays are always captured.

### Production
- **Traces Sample Rate**: 10% (0.1)
- **Session Replay Sample Rate**: 10% (0.1)
- **Replay on Error Sample Rate**: 100% (1.0)
- **Profiles Sample Rate**: 10% (0.1)

Lower sampling in production manages costs while still capturing errors. All error-related replays are recorded.

## Environment Variables

### Required Configuration

```bash
# Sentry DSN - required to enable Sentry
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
```

### Optional Configuration

```bash
# Set environment (development, staging, or production)
# Defaults to 'development' if not specified
VITE_SENTRY_ENVIRONMENT=production

# Override sample rates (values between 0.0 and 1.0)
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
VITE_SENTRY_PROFILES_SAMPLE_RATE=0.1
```

### Build Configuration (CI/CD)

```bash
# Required for source map upload in CI/CD
SENTRY_ORG=your-organization
SENTRY_PROJECT=macroflows
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_RELEASE=auto
```

## Usage Examples

### Local Development
```bash
# .env.local
VITE_SENTRY_DSN=https://...
VITE_SENTRY_ENVIRONMENT=development
# No need to set sample rates - defaults to 100%
```

### Staging Deployment
```bash
# .env.staging
VITE_SENTRY_DSN=https://...
VITE_SENTRY_ENVIRONMENT=staging
# Defaults to 50% for most metrics, 100% for error replays
```

### Production Deployment
```bash
# .env.production
VITE_SENTRY_DSN=https://...
VITE_SENTRY_ENVIRONMENT=production
# Defaults to 10% for most metrics, 100% for error replays
```

### Custom Sample Rates
If you need different sample rates than the defaults:

```bash
VITE_SENTRY_DSN=https://...
VITE_SENTRY_ENVIRONMENT=production
# Custom rates for specific needs
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05  # 5% of traces
VITE_SENTRY_REPLAYS_SAMPLE_RATE=0.02  # 2% of sessions
VITE_SENTRY_PROFILES_SAMPLE_RATE=0.15  # 15% of profiles
```

## Cost Management

Sample rates directly impact Sentry costs. Consider the following when setting rates:

1. **Traces**: Performance transaction monitoring
   - High volume - can be expensive
   - Production: start low (5-10%), increase if needed

2. **Session Replays**: Full session recordings
   - Very high volume - most expensive feature
   - Production: keep low (5-10%) unless critical

3. **Replay on Error**: Session replay when errors occur
   - Lower volume (only on errors)
   - Recommended: keep at 100% for debugging

4. **Profiles**: Performance profiling data
   - Medium volume
   - Production: 10-20% usually sufficient

### Testing Cost Impact in Staging

Before deploying to production with new sample rates:

1. Deploy to staging with planned production rates
2. Monitor Sentry usage for 1-2 weeks
3. Check Sentry dashboard for quota usage
4. Adjust rates based on observed costs
5. Calculate estimated production costs based on staging traffic

## Monitoring Configuration

After deployment, verify configuration in Sentry:

1. Go to Sentry project settings
2. Navigate to "Performance" section
3. Check that events are being received
4. Verify sample rates are applied correctly
5. Monitor quota usage in billing section

## Troubleshooting

### No Events Received
- Verify `VITE_SENTRY_DSN` is set correctly
- Check browser console for Sentry initialization logs
- Ensure environment has network access to Sentry

### Too Many/Few Events
- Check `VITE_SENTRY_ENVIRONMENT` is set correctly
- Verify sample rate overrides if used
- Sample rates must be between 0.0 and 1.0

### High Costs
- Review sample rates in production
- Consider reducing replay sample rate (most expensive)
- Keep error replays at 100% but reduce session replays
- Use staging environment to test rate changes

## Additional Resources

- [Sentry SolidStart SDK Documentation](https://docs.sentry.io/platforms/javascript/guides/solidstart/)
- [Sentry Sample Rates Documentation](https://docs.sentry.io/platforms/javascript/configuration/sampling/)
- [Sentry Pricing](https://sentry.io/pricing/)

## Code References

- Configuration: `src/modules/observability/infrastructure/sentry/config.ts`
- Initialization: `src/modules/observability/infrastructure/sentry/sentry.ts`
- Environment Variables: `.env.example`
