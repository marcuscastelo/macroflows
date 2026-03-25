import { describe, expect, it } from 'vitest'

import {
  secondaryLabelForReason,
  switchToStableCopy,
} from '~/sections/common/components/SwitchToStablePrompt'

describe('SwitchToStablePrompt copy and actions', () => {
  it('exposes localized copy for each reason', () => {
    expect(switchToStableCopy.network).toContain('versão canary')
    expect(switchToStableCopy.server).toContain('versão estável')
    expect(switchToStableCopy.runtime).toContain('versão estável')
    expect(switchToStableCopy.recurring).toContain('mais de uma vez')
  })

  it('sets secondary label depending on reason', () => {
    expect(secondaryLabelForReason('network')).toBe('Recarregar')
    expect(secondaryLabelForReason('server')).toBe('Reportar')
    expect(secondaryLabelForReason('runtime')).toBe('Reportar')
    expect(secondaryLabelForReason('recurring')).toBe('Reportar')
  })
})
