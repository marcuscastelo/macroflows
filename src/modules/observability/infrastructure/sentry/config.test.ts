import { describe, expect, it } from 'vitest'

import {
  createSentryConfig,
  getDefaultSampleRates,
  getEnvironment,
  getSampleRates,
  parseRate,
  type EnvVars,
} from '~/modules/observability/infrastructure/sentry/config'

describe('Sentry Configuration', () => {
  describe('getEnvironment', () => {
    it('defaults to development when no environment is set', () => {
      expect(getEnvironment()).toBe('development')
      expect(getEnvironment(undefined)).toBe('development')
    })

    it('returns production when set', () => {
      expect(getEnvironment('production')).toBe('production')
    })

    it('returns staging when set', () => {
      expect(getEnvironment('staging')).toBe('staging')
    })

    it('falls back to development for invalid environment', () => {
      expect(getEnvironment('invalid')).toBe('development')
      expect(getEnvironment('test')).toBe('development')
    })
  })

  describe('getDefaultSampleRates', () => {
    it('returns 100% sample rates for development', () => {
      const rates = getDefaultSampleRates('development')
      expect(rates.traces).toBe(1.0)
      expect(rates.replays).toBe(1.0)
      expect(rates.replaysOnError).toBe(1.0)
      expect(rates.profiles).toBe(1.0)
    })

    it('returns 50% sample rates for staging (except error replays)', () => {
      const rates = getDefaultSampleRates('staging')
      expect(rates.traces).toBe(0.5)
      expect(rates.replays).toBe(0.5)
      expect(rates.replaysOnError).toBe(1.0)
      expect(rates.profiles).toBe(0.5)
    })

    it('returns 10% sample rates for production (except error replays)', () => {
      const rates = getDefaultSampleRates('production')
      expect(rates.traces).toBe(0.1)
      expect(rates.replays).toBe(0.1)
      expect(rates.replaysOnError).toBe(1.0)
      expect(rates.profiles).toBe(0.1)
    })
  })

  describe('parseRate', () => {
    it('accepts numeric values', () => {
      expect(parseRate(0.5, 1.0)).toBe(0.5)
      expect(parseRate(0.0, 1.0)).toBe(0.0)
      expect(parseRate(1.0, 0.5)).toBe(1.0)
    })

    it('accepts string values', () => {
      expect(parseRate('0.5', 1.0)).toBe(0.5)
      expect(parseRate('0.25', 1.0)).toBe(0.25)
      expect(parseRate('1.0', 0.5)).toBe(1.0)
    })

    it('clamps values to 0.0 minimum', () => {
      expect(parseRate(-0.5, 1.0)).toBe(0.0)
      expect(parseRate('-1.0', 1.0)).toBe(0.0)
    })

    it('clamps values to 1.0 maximum', () => {
      expect(parseRate(1.5, 0.5)).toBe(1.0)
      expect(parseRate('2.0', 0.5)).toBe(1.0)
    })

    it('returns default for invalid string values', () => {
      expect(parseRate('invalid', 0.5)).toBe(0.5)
      expect(parseRate('abc', 0.8)).toBe(0.8)
    })

    it('returns default for empty string values', () => {
      expect(parseRate('', 0.5)).toBe(0.5)
    })

    it('returns default for undefined values', () => {
      expect(parseRate(undefined, 0.5)).toBe(0.5)
    })
  })

  describe('getSampleRates', () => {
    it('uses defaults when no env vars provided', () => {
      const env: EnvVars = {}
      const rates = getSampleRates('production', env)
      expect(rates.traces).toBe(0.1)
      expect(rates.replays).toBe(0.1)
      expect(rates.replaysOnError).toBe(1.0)
      expect(rates.profiles).toBe(0.1)
    })

    it('overrides traces sample rate from env var', () => {
      const env: EnvVars = { VITE_SENTRY_TRACES_SAMPLE_RATE: '0.25' }
      const rates = getSampleRates('production', env)
      expect(rates.traces).toBe(0.25)
    })

    it('overrides replays sample rate from env var', () => {
      const env: EnvVars = { VITE_SENTRY_REPLAYS_SAMPLE_RATE: '0.15' }
      const rates = getSampleRates('production', env)
      expect(rates.replays).toBe(0.15)
    })

    it('overrides replaysOnError sample rate from env var', () => {
      const env: EnvVars = { VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: '0.8' }
      const rates = getSampleRates('production', env)
      expect(rates.replaysOnError).toBe(0.8)
    })

    it('overrides profiles sample rate from env var', () => {
      const env: EnvVars = { VITE_SENTRY_PROFILES_SAMPLE_RATE: '0.2' }
      const rates = getSampleRates('production', env)
      expect(rates.profiles).toBe(0.2)
    })

    it('accepts numeric env var values', () => {
      const env: EnvVars = { VITE_SENTRY_TRACES_SAMPLE_RATE: 0.33 }
      const rates = getSampleRates('production', env)
      expect(rates.traces).toBe(0.33)
    })

    it('overrides multiple sample rates simultaneously', () => {
      const env: EnvVars = {
        VITE_SENTRY_TRACES_SAMPLE_RATE: '0.3',
        VITE_SENTRY_REPLAYS_SAMPLE_RATE: '0.2',
        VITE_SENTRY_PROFILES_SAMPLE_RATE: '0.4',
      }
      const rates = getSampleRates('production', env)
      expect(rates.traces).toBe(0.3)
      expect(rates.replays).toBe(0.2)
      expect(rates.profiles).toBe(0.4)
    })
  })

  describe('createSentryConfig', () => {
    it('creates config with development defaults', () => {
      const env: EnvVars = {}
      const config = createSentryConfig(env)
      expect(config.environment).toBe('development')
      expect(config.sampleRates.traces).toBe(1.0)
      expect(config.sampleRates.replays).toBe(1.0)
    })

    it('creates config with production environment', () => {
      const env: EnvVars = { VITE_SENTRY_ENVIRONMENT: 'production' }
      const config = createSentryConfig(env)
      expect(config.environment).toBe('production')
      expect(config.sampleRates.traces).toBe(0.1)
    })

    it('creates config with staging environment', () => {
      const env: EnvVars = { VITE_SENTRY_ENVIRONMENT: 'staging' }
      const config = createSentryConfig(env)
      expect(config.environment).toBe('staging')
      expect(config.sampleRates.traces).toBe(0.5)
    })

    it('includes DSN when provided', () => {
      const testDsn = 'https://test@sentry.io/123456'
      const env: EnvVars = { VITE_SENTRY_DSN: testDsn }
      const config = createSentryConfig(env)
      expect(config.dsn).toBe(testDsn)
    })

    it('sets DSN to undefined when not provided', () => {
      const env: EnvVars = {}
      const config = createSentryConfig(env)
      expect(config.dsn).toBeUndefined()
    })

    it('includes version in release name', () => {
      const env: EnvVars = {}
      const config = createSentryConfig(env)
      expect(config.release).toMatch(/^macroflows@/)
    })

    it('applies env var overrides correctly', () => {
      const env: EnvVars = {
        VITE_SENTRY_ENVIRONMENT: 'production',
        VITE_SENTRY_TRACES_SAMPLE_RATE: '0.25',
        VITE_SENTRY_REPLAYS_SAMPLE_RATE: '0.15',
      }
      const config = createSentryConfig(env)
      expect(config.environment).toBe('production')
      expect(config.sampleRates.traces).toBe(0.25)
      expect(config.sampleRates.replays).toBe(0.15)
      expect(config.sampleRates.profiles).toBe(0.1)
    })
  })
})
