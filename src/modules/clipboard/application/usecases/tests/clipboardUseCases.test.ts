import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/modules/clipboard/ui/PasteConfirmModal', () => ({
  openPasteConfirmModal: vi.fn(),
}))

import { createClipboardStore } from '~/modules/clipboard/application/store/clipboardStore'
import { createClipboardUseCases } from '~/modules/clipboard/application/usecases/clipboardUseCases'
import { openPasteConfirmModal } from '~/modules/clipboard/ui/PasteConfirmModal'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { createItem, itemSchema } from '~/modules/diet/item/schema/itemSchema'

describe('clipboardUseCases.confirmPaste', () => {
  const showError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createValidItemPayload() {
    return createItem({
      id: 1,
      name: 'Banana',
      quantity: 100,
      reference: {
        type: 'food',
        id: 1,
        macros: createMacroNutrients({
          proteinInGrams: 1.2,
          carbsInGrams: 22.8,
          fatInGrams: 0.3,
        }),
      },
    })
  }

  it('opens the paste confirmation modal with the parsed payload', () => {
    const clipboardStore = createClipboardStore()
    const payload = createValidItemPayload()
    const onPasteConfirmed = vi.fn()
    const useCases = createClipboardUseCases({
      clipboardStore,
      showError,
    })

    clipboardStore.copy(payload)

    useCases.confirmPaste(itemSchema, onPasteConfirmed)

    expect(openPasteConfirmModal).toHaveBeenCalledTimes(1)
    expect(openPasteConfirmModal).toHaveBeenCalledWith(payload, onPasteConfirmed)
    expect(showError).not.toHaveBeenCalled()
  })

  it('passes the confirmed payload to the paste handler on valid clipboard data', () => {
    const clipboardStore = createClipboardStore()
    const payload = createValidItemPayload()
    const onPasteConfirmed = vi.fn()
    const useCases = createClipboardUseCases({
      clipboardStore,
      showError,
    })

    clipboardStore.copy(payload)

    useCases.confirmPaste(itemSchema, onPasteConfirmed)

    const modalHandler = vi.mocked(openPasteConfirmModal).mock.calls[0]?.[1]

    expect(modalHandler).toBeDefined()

    modalHandler?.(payload)

    expect(onPasteConfirmed).toHaveBeenCalledTimes(1)
    expect(onPasteConfirmed).toHaveBeenCalledWith(payload)
  })

  it('shows an error and does not open the modal when the clipboard is empty', () => {
    const clipboardStore = createClipboardStore()
    const onPasteConfirmed = vi.fn()
    const useCases = createClipboardUseCases({
      clipboardStore,
      showError,
    })

    useCases.confirmPaste(itemSchema, onPasteConfirmed)

    expect(openPasteConfirmModal).not.toHaveBeenCalled()
    expect(onPasteConfirmed).not.toHaveBeenCalled()
    expect(showError).toHaveBeenCalledTimes(1)
    expect(showError).toHaveBeenCalledWith(
      'A área de transferência está vazia ou o conteúdo é inválido.',
    )
  })

  it('shows validation errors and does not open the modal when clipboard data is incompatible', () => {
    const clipboardStore = createClipboardStore()
    const onPasteConfirmed = vi.fn()
    const useCases = createClipboardUseCases({
      clipboardStore,
      showError,
    })

    clipboardStore.copy({
      id: 999,
      name: 'Broken clipboard payload',
      quantity: 1,
      reference: {
        type: 'food',
        id: 1,
      },
    } as unknown as Parameters<typeof clipboardStore.copy>[0])

    useCases.confirmPaste(itemSchema, onPasteConfirmed)

    expect(openPasteConfirmModal).not.toHaveBeenCalled()
    expect(onPasteConfirmed).not.toHaveBeenCalled()
    expect(showError).toHaveBeenCalledTimes(2)
    expect(showError).toHaveBeenNthCalledWith(
      1,
      'O conteúdo da área de transferência não é compatível.',
    )
    expect(showError).toHaveBeenNthCalledWith(
      2,
      'A área de transferência está vazia ou o conteúdo é inválido.',
    )
  })
})
