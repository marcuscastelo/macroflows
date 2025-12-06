import { describe, expect, it } from 'vitest'

import { logging } from '~/shared/utils/logging'

describe('logging mock', () => {
  it('does not throw when calling debug', () => {
    expect(() => logging.debug('test message')).not.toThrow()
  })

  it('does not throw when calling info', () => {
    expect(() => logging.info('test message')).not.toThrow()
  })

  it('does not throw when calling warn', () => {
    expect(() => logging.warn('test message')).not.toThrow()
  })

  it('does not throw when calling error', () => {
    expect(() => logging.error('test message')).not.toThrow()
  })

  it('does not throw when calling error with error object', () => {
    expect(() =>
      logging.error('test message', new Error('test error')),
    ).not.toThrow()
  })

  it('does not throw when calling methods with data object', () => {
    const data = { key: 'value', count: 42 }
    expect(() => logging.debug('test', data)).not.toThrow()
    expect(() => logging.info('test', data)).not.toThrow()
    expect(() => logging.warn('test', data)).not.toThrow()
    expect(() => logging.error('test', undefined, data)).not.toThrow()
  })
})
