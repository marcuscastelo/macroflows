import { onCleanup, onMount } from 'solid-js'

const LONG_PRESS_DURATION_MS = 500

type LongPressOptions = {
  onLongPress: () => void
  onShortPress?: () => void
  duration?: number
}

/**
 * Hook to handle long press events for mobile clipboard actions.
 * Provides touch-friendly interaction for copy/paste operations.
 *
 * @param element - A function returning the target HTML element
 * @param options - Configuration options for long press behavior
 */
export function useLongPress(
  element: () => HTMLElement | null | undefined,
  options: LongPressOptions,
): void {
  const duration = options.duration ?? LONG_PRESS_DURATION_MS
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let isLongPress = false
  let startX = 0
  let startY = 0

  const MOVEMENT_THRESHOLD = 10

  const clearTimer = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const handleTouchStart = (e: TouchEvent): void => {
    isLongPress = false
    const touch = e.touches[0]
    if (touch) {
      startX = touch.clientX
      startY = touch.clientY
    }

    timeoutId = setTimeout(() => {
      isLongPress = true
      options.onLongPress()
    }, duration)
  }

  const handleTouchMove = (e: TouchEvent): void => {
    const touch = e.touches[0]
    if (touch) {
      const deltaX = Math.abs(touch.clientX - startX)
      const deltaY = Math.abs(touch.clientY - startY)

      if (deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD) {
        clearTimer()
      }
    }
  }

  const handleTouchEnd = (_e: TouchEvent): void => {
    clearTimer()

    if (!isLongPress && options.onShortPress) {
      options.onShortPress()
    }
  }

  const handleTouchCancel = (): void => {
    clearTimer()
  }

  const handleContextMenu = (e: Event): void => {
    if (isLongPress) {
      e.preventDefault()
    }
  }

  onMount(() => {
    const el = element()
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    el.addEventListener('contextmenu', handleContextMenu)
  })

  onCleanup(() => {
    clearTimer()
    const el = element()
    if (!el) return

    el.removeEventListener('touchstart', handleTouchStart)
    el.removeEventListener('touchmove', handleTouchMove)
    el.removeEventListener('touchend', handleTouchEnd)
    el.removeEventListener('touchcancel', handleTouchCancel)
    el.removeEventListener('contextmenu', handleContextMenu)
  })
}
