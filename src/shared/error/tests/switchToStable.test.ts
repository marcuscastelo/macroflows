import { describe, expect, it } from 'vitest'

import {
  buildStableUrl,
  DEFAULT_SWITCH_TO_STABLE_CONFIG,
  detectReleaseChannel,
  evaluateSwitchSuggestion,
  type LocationLike,
} from '~/shared/error/switchToStable'

const locationStub: LocationLike = {
  origin: 'https://canary.macroflows.app',
  hostname: 'canary.macroflows.app',
  pathname: '/path',
  search: '?q=1',
  hash: '#anchor',
}

describe('switchToStable heuristics', () => {
  it('detects release channel from env and version', () => {
    expect(
      detectReleaseChannel({
        envChannel: 'canary',
        appVersion: '1.0.0',
        hostname: 'localhost',
      }),
    ).toBe('canary')

    expect(
      detectReleaseChannel({
        envChannel: undefined,
        appVersion: '1.0.0-rc.1',
        hostname: 'localhost',
      }),
    ).toBe('rc')

    expect(
      detectReleaseChannel({
        envChannel: undefined,
        appVersion: '1.0.0',
        hostname: 'macroflows.app',
      }),
    ).toBe('stable')
  })

  it('builds stable url by stripping canary/rc markers', () => {
    const target = buildStableUrl(locationStub)
    expect(target).toBe('https://macroflows.app/path?q=1#anchor')
  })

  it('skips suggestion when running on stable channel', () => {
    const result = evaluateSwitchSuggestion({
      error: new Error('Unexpected'),
      location: locationStub,
      releaseChannel: 'stable',
    })

    expect(result.shouldSuggest).toBe(false)
    expect(result.reason).toBe('channel-mismatch')
  })

  it('suggests switching on network failures in canary', () => {
    const result = evaluateSwitchSuggestion({
      error: 'Failed to fetch',
      location: locationStub,
      releaseChannel: 'canary',
    })

    expect(result.shouldSuggest).toBe(true)
    expect(result.reason).toBe('network')
    expect(result.targetUrl).toBe('https://macroflows.app/path?q=1#anchor')
  })

  it('does not suggest for user-actionable client errors', () => {
    const result = evaluateSwitchSuggestion({
      error: { status: 400, message: 'Bad request' },
      location: locationStub,
      releaseChannel: 'canary',
    })

    expect(result.shouldSuggest).toBe(false)
  })

  it('escalates recurring errors within the window', () => {
    let current = 1000
    const now = () => current

    const sharedParams = {
      error: new Error('recurring'),
      location: locationStub,
      releaseChannel: 'canary' as const,
      config: {
        ...DEFAULT_SWITCH_TO_STABLE_CONFIG,
        repeatThreshold: 2,
        repeatWindowMs: 10_000,
      },
      now,
    }

    const first = evaluateSwitchSuggestion(sharedParams)
    current += 500
    const second = evaluateSwitchSuggestion(sharedParams)

    expect(first.severity).toBe('normal')
    expect(second.severity).toBe('elevated')
    expect(second.reason).toBe('recurring')
  })
})
