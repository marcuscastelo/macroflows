import { type JSXElement, Show } from 'solid-js'

import { useContainer } from '~/di/container'
import { CopyButton } from '~/sections/common/components/CopyButton'
import { PasteIcon } from '~/sections/common/components/icons/PasteIcon'
import { TrashIcon } from '~/sections/common/components/icons/TrashIcon'
import { CLIPBOARD_ACTION_BUTTON_STYLES } from '~/sections/common/styles/buttonStyles'
import { cn } from '~/shared/cn'

type ClipboardActionButtonsProps = {
  canCopy: boolean
  canPaste: boolean
  canClear: boolean
  onCopy: () => void
  onPaste: () => void
  onClear: (e: MouseEvent) => void
}

/**
 * Clipboard action buttons component with copy, paste, and clear actions.
 * Features accessible buttons with ARIA labels and 44px minimum touch targets.
 */
export function ClipboardActionButtons(
  props: ClipboardActionButtonsProps,
): JSXElement {
  const useCases = useContainer()
  return (
    <div class="ml-auto flex gap-2" role="group" aria-label="Clipboard actions">
      <Show when={props.canCopy}>
        <CopyButton
          value={() => null}
          onCopy={() => props.onCopy()}
          class={CLIPBOARD_ACTION_BUTTON_STYLES}
          stopPropagation={false}
          aria-label="Copy to clipboard"
        />
      </Show>
      <Show
        when={props.canPaste && useCases.clipboardUseCases().entryCount() > 0}
      >
        <button
          type="button"
          class={CLIPBOARD_ACTION_BUTTON_STYLES}
          onClick={() => props.onPaste()}
          aria-label="Paste from clipboard"
          title="Paste from clipboard"
        >
          <PasteIcon size={20} aria-hidden="true" />
        </button>
      </Show>
      <Show when={props.canClear}>
        <button
          type="button"
          class={cn(
            CLIPBOARD_ACTION_BUTTON_STYLES,
            'text-red-400 hover:text-red-300',
          )}
          onClick={(e) => props.onClear(e)}
          aria-label="Clear clipboard"
          title="Clear clipboard"
        >
          <TrashIcon size={20} aria-hidden="true" class="stroke-current" />
        </button>
      </Show>
    </div>
  )
}
