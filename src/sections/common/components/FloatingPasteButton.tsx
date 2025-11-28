import { type JSXElement, Show } from 'solid-js'

import { clipboardUseCases } from '~/modules/clipboard/application/usecases/clipboardUseCases'
import { PasteIcon } from '~/sections/common/components/icons/PasteIcon'
import { cn } from '~/shared/cn'

type FloatingPasteButtonProps = {
  isVisible: boolean
  onPaste: () => void
  class?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

/**
 * Floating paste button for mobile UX.
 * Appears when an editor is focused and clipboard has entries.
 * Features 48px minimum touch target for accessibility.
 */
export function FloatingPasteButton(
  props: FloatingPasteButtonProps,
): JSXElement {
  const positionClasses = (): string => {
    switch (props.position ?? 'bottom-right') {
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
    }
  }

  const hasClipboardContent = () => clipboardUseCases.entryCount() > 0

  return (
    <Show when={props.isVisible && hasClipboardContent()}>
      <button
        type="button"
        class={cn(
          'fixed z-50 btn btn-circle btn-primary shadow-lg',
          'min-h-[48px] min-w-[48px] h-12 w-12',
          'touch-manipulation active:scale-95 transition-all',
          'animate-fadeIn',
          positionClasses(),
          props.class,
        )}
        onClick={() => props.onPaste()}
        aria-label={`Paste from clipboard (${clipboardUseCases.entryCount()} items available)`}
        title="Paste from clipboard"
      >
        <PasteIcon size={24} aria-hidden="true" class="stroke-white" />
        <Show when={clipboardUseCases.entryCount() > 0}>
          <span class="absolute -top-1 -right-1 badge badge-sm badge-secondary">
            {clipboardUseCases.entryCount()}
          </span>
        </Show>
      </button>
    </Show>
  )
}
