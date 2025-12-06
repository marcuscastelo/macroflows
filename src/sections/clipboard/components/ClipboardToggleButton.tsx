import { type JSXElement, Show } from 'solid-js'

import { useCases } from '~/di/useCases'
import { Button } from '~/sections/common/components/buttons/Button'
import { cn } from '~/shared/cn'

type ClipboardToggleButtonProps = {
  onClick: () => void
  class?: string
}

/**
 * Floating action button to toggle the clipboard panel
 * Shows a badge with the number of clipboard entries
 */
export function ClipboardToggleButton(
  props: ClipboardToggleButtonProps,
): JSXElement {
  return (
    <Button
      type="button"
      class={cn('btn btn-circle btn-primary shadow-lg relative', props.class)}
      onClick={props.onClick}
      title="Toggle clipboard"
    >
      <svg
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>

      {/* Badge with entry count */}
      <Show when={useCases.clipboardUseCases().entryCount() > 0}>
        <span class="absolute -top-1 -right-1 badge badge-sm badge-error">
          {useCases.clipboardUseCases().entryCount()}
        </span>
      </Show>
    </Button>
  )
}
