/**
 * Basic test for the unified modal system.
 * Validates that the core functionality works correctly.
 */

import { createSignal } from 'solid-js'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  modalManager,
  modals,
  setModals,
} from '~/shared/modal/core/modalManager'

describe('Unified Modal System', () => {
  beforeEach(() => {
    setModals([])
  })
  it('should create and manage modal states', async () => {
    // Test opening a basic content modal
    const modalId = modalManager.openModal({
      type: 'content',
      title: 'Test Modal',
      content: 'Test content',
    })

    expect(modalId).toBeDefined()
    expect(typeof modalId).toBe('string')

    // Verify modal exists
    const modalList = modals()
    const modal = modalList.find((m) => m.id === modalId)
    expect(modal).toBeDefined()
    expect(modal?.type).toBe('content')
    expect(modal?.title).toBe('Test Modal')
    expect(modal?.isOpen).toBe(true)

    // Test closing modal
    void modalManager.closeModal(modalId)
    // Wait for async close to complete
    await new Promise((resolve) => setTimeout(resolve, 10))
    const remainingModals = modals()
    const closedModal = remainingModals.find((m) => m.id === modalId)
    expect(closedModal).toBeUndefined()
  })

  it('should handle error modals', () => {
    const modalId = modalManager.openModal({
      type: 'error',
      title: 'Error Modal',
      errorDetails: {
        message: 'Test error message',
        fullError: 'Detailed error info',
      },
    })

    const modalList = modals()
    const modal = modalList.find((m) => m.id === modalId)
    expect(modal?.type).toBe('error')

    void modalManager.closeModal(modalId)
  })

  it('should handle confirmation modals', () => {
    const modalId = modalManager.openModal({
      type: 'confirmation',
      title: 'Confirm Action',
      message: 'Are you sure?',
      onConfirm: () => {
        // Test callback
      },
      onCancel: () => {
        // Test callback
      },
    })

    const modalList = modals()
    const modal = modalList.find((m) => m.id === modalId)
    expect(modal?.type).toBe('confirmation')

    void modalManager.closeModal(modalId)
  })

  it('should support Accessor types for reactive values', () => {
    const [title] = createSignal('Initial Title')
    const [message] = createSignal('Initial Message')

    const modalId = modalManager.openModal({
      type: 'confirmation',
      title,
      message,
      onConfirm: () => {},
    })

    const modalList = modals()
    const modal = modalList.find((m) => m.id === modalId)
    expect(modal).toBeDefined()
    expect(modal?.type).toBe('confirmation')
    expect(typeof modal?.title).toBe('function')

    // Verify the modal stores the accessor
    if (modal?.type === 'confirmation') {
      expect(typeof modal.message).toBe('function')
    }

    void modalManager.closeModal(modalId)
  })

  it('should track multiple modals in creation order', async () => {
    const modal1 = modalManager.openModal({
      type: 'content',
      title: 'Low Priority',
      content: 'Content 1',
      priority: 'low',
    })

    const modal2 = modalManager.openModal({
      type: 'content',
      title: 'High Priority',
      content: 'Content 2',
      priority: 'high',
    })

    const allModals = modals()
    expect(allModals).toHaveLength(2)

    // Should be in creation order: modal1 first, then modal2
    expect(allModals[0]?.id).toBe(modal1)
    expect(allModals[1]?.id).toBe(modal2)
  })

  it('should generate unique IDs', () => {
    const ids = new Set()
    for (let i = 0; i < 10; i++) {
      const modalId = modalManager.openModal({
        type: 'content',
        content: `Test ${i}`,
      })
      ids.add(modalId)
    }

    expect(ids.size).toBe(10) // All IDs should be unique
  })
})
