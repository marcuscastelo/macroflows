/**
 * Toast Manager Tests (refactored)
 *
 * Unit tests for the toastManager application logic after major refactor.
 */

import { describe, expect, it, vi } from 'vitest'

import {
  showError,
  showInfo,
  showLoading,
  showPromise,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import * as toastQueue from '~/modules/toast/application/toastQueue'
import * as errorMessageHandler from '~/modules/toast/domain/errorMessageHandler'

describe('toastManager (refactored)', () => {
  it('showError creates an error toast with correct options and error data', () => {
    const registerToast = vi
      .spyOn(toastQueue, 'registerToast')
      .mockImplementation((item) => item.id)
    const createExpandableErrorData = vi
      .spyOn(errorMessageHandler, 'createExpandableErrorData')
      .mockImplementation((msg, opts, displayMsg) => ({
        displayMessage: String(displayMsg ?? msg),
        raw: String(msg),
        options: opts,
        isTruncated: false,
        originalMessage: String(msg),
        errorDetails: { message: String(msg), fullError: String(msg) },
        canExpand: false,
      }))
    const id = showError('Falha grave', { context: 'user-action' })
    expect(registerToast).toHaveBeenCalled()
    const toastArg = registerToast.mock.calls[0]?.[0]
    expect(toastArg).toBeDefined()
    expect(toastArg?.options.type).toBe('error')
    expect(toastArg?.options.context).toBe('user-action')
    expect(toastArg?.options.expandableErrorData?.displayMessage).toBe(
      'Falha grave',
    )
    expect(id).toBe(toastArg?.id)
    createExpandableErrorData.mockRestore()
  })

  it('showSuccess creates a success toast with correct options', () => {
    const registerToast = vi
      .spyOn(toastQueue, 'registerToast')
      .mockImplementation((item) => item.id)
    const id = showSuccess('Operação concluída', {
      context: 'user-action',
    })
    expect(registerToast).toHaveBeenCalled()
    const toastArg = registerToast.mock.calls[0]?.[0]
    expect(toastArg).toBeDefined()
    expect(toastArg?.options.type).toBe('success')
    expect(toastArg?.options.context).toBe('user-action')

    expect(id).toBe(toastArg?.id)
  })

  it('showLoading creates a loading toast with infinite duration and info type', () => {
    const registerToast = vi
      .spyOn(toastQueue, 'registerToast')
      .mockImplementation((item) => item.id)
    const id = showLoading('Carregando dados...')
    expect(registerToast).toHaveBeenCalled()
    const toastArg = registerToast.mock.calls[0]?.[0]
    expect(toastArg).toBeDefined()
    expect(toastArg?.options.type).toBe('info')
    expect(typeof toastArg?.options.duration).toBe('number')
    expect(toastArg?.options.duration).toBeGreaterThan(1000000) // TOAST_DURATION_INFINITY
    expect(id).toBe(toastArg?.id)
  })

  it('showInfo creates an info toast', () => {
    const registerToast = vi
      .spyOn(toastQueue, 'registerToast')
      .mockImplementation((item) => item.id)
    const id = showInfo('Informação importante', { context: 'user-action' })
    expect(registerToast).toHaveBeenCalled()
    const toastArg = registerToast.mock.calls[0]?.[0]
    expect(toastArg).toBeDefined()
    expect(toastArg?.options.type).toBe('info')
    expect(toastArg?.options.context).toBe('user-action')
    expect(id).toBe(toastArg?.id)
  })

  it('showPromise: displays loading, then success on resolve', async () => {
    const registerToast = vi
      .spyOn(toastQueue, 'registerToast')
      .mockImplementation((item) => item.id)
    const killToast = vi
      .spyOn(toastQueue, 'killToast')
      .mockImplementation(() => true)
    const promise = Promise.resolve('feito')
    const result = await showPromise(
      promise,
      {
        loading: 'Carregando...',
        success: (data) => `Sucesso: ${data}`,
        error: 'Erro!',
      },
      {
        context: 'user-action',
        duration: 9999,
      },
    )
    expect(registerToast).toHaveBeenCalled()
    expect(killToast).toHaveBeenCalled()
    // First call: loading, second: success
    const loadingToast = registerToast.mock.calls[0]?.[0]
    const successToast = registerToast.mock.calls[1]?.[0]
    expect(loadingToast).toBeDefined()
    expect(successToast).toBeDefined()
    expect(loadingToast?.options.type).toBe('info')
    expect(loadingToast?.options.duration).toBe(9999)
    expect(successToast?.options.type).toBe('success')
    expect(successToast?.message).toBe('Sucesso: feito')
    expect(result).toBe('feito')
  })

  it('showPromise: displays error on reject', async () => {
    const registerToast = vi
      .spyOn(toastQueue, 'registerToast')
      .mockImplementation((item) => item.id)
    const killToast = vi
      .spyOn(toastQueue, 'killToast')
      .mockImplementation(() => true)
    const promise = Promise.reject(new Error('falhou'))
    // Suppress unhandled rejection warning
    promise.catch(() => {})
    await expect(
      showPromise(
        promise,
        {
          loading: 'Carregando...',
          success: 'Sucesso!',
          error: (err) =>
            `Erro: ${err instanceof Error ? err.message : String(err)}`,
        },
        {
          context: 'user-action',
        },
      ),
    ).rejects.toThrow('falhou')
    expect(registerToast).toHaveBeenCalled()
    expect(killToast).toHaveBeenCalled()
    // First call: loading, second: error
    const errorToast = registerToast.mock.calls[1]?.[0]
    expect(errorToast).toBeDefined()
    expect(errorToast?.options.type).toBe('error')
    expect(typeof errorToast?.message).toBe('string')
    expect(errorToast?.message).toContain('Erro:')
  })
})
