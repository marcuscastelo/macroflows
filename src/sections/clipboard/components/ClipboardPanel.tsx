import { For, type JSXElement, Show } from 'solid-js'

import { useClipboardStore } from '~/modules/clipboard/application/useClipboardStore'
import {
  type ClipboardEntry,
  isMealPayload,
  isRecipePayload,
  isUnifiedItemPayload,
} from '~/modules/clipboard/domain/clipboardEntry'
import { Button } from '~/sections/common/components/buttons/Button'
import { cn } from '~/shared/cn'

type ClipboardPanelProps = {
  isOpen: boolean
  onClose: () => void
  onPaste?: (entry: ClipboardEntry) => void
}

/**
 * Display a short preview of the clipboard entry
 */
function ClipboardEntryPreview(props: { entry: ClipboardEntry }): JSXElement {
  const payload = () => props.entry.payload

  const name = () => {
    if (isUnifiedItemPayload(payload())) {
      return payload().name
    }
    if (isMealPayload(payload())) {
      return payload().name
    }
    if (isRecipePayload(payload())) {
      return payload().name
    }
    return 'Unknown'
  }

  const type = () => payload().__type

  return (
    <div class="text-sm">
      <span class="font-semibold">{name()}</span>
      <span class="text-gray-400 ml-2">({type()})</span>
    </div>
  )
}

/**
 * Single clipboard entry row
 */
function ClipboardEntryRow(props: {
  entry: ClipboardEntry
  onRemove: (id: string) => void
  onTogglePin: (id: string) => void
  onPaste?: (entry: ClipboardEntry) => void
}): JSXElement {
  return (
    <div
      class={cn(
        'flex items-center gap-2 p-2 rounded hover:bg-gray-700 transition-colors',
        {
          'border-l-2 border-yellow-500': props.entry.pinned,
        },
      )}
    >
      <div class="flex-1 min-w-0">
        <ClipboardEntryPreview entry={props.entry} />
        <div class="text-xs text-gray-500">
          {new Date(props.entry.createdAt).toLocaleString()}
        </div>
      </div>

      <div class="flex gap-1 shrink-0">
        <Show when={props.onPaste !== undefined}>
          <Button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() => props.onPaste?.(props.entry)}
            title="Paste"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </Button>
        </Show>

        <Button
          type="button"
          class={cn('btn btn-xs btn-ghost', {
            'text-yellow-500': props.entry.pinned,
          })}
          onClick={() => props.onTogglePin(props.entry.id)}
          title={props.entry.pinned ? 'Unpin' : 'Pin'}
        >
          <svg
            class="h-4 w-4"
            fill={props.entry.pinned ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </Button>

        <Button
          type="button"
          class="btn btn-xs btn-ghost text-red-500"
          onClick={() => props.onRemove(props.entry.id)}
          title="Remove"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      </div>
    </div>
  )
}

/**
 * Clipboard panel that displays recent clipboard entries
 */
export function ClipboardPanel(props: ClipboardPanelProps): JSXElement {
  const clipboard = useClipboardStore()

  const handleClearAll = () => {
    clipboard.clear()
  }

  return (
    <Show when={props.isOpen}>
      <div class="fixed top-0 right-0 h-full w-80 bg-gray-800 text-white shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 class="text-lg font-semibold">Clipboard</h2>
          <Button
            type="button"
            class="btn btn-sm btn-ghost"
            onClick={props.onClose}
            aria-label="Close clipboard panel"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        {/* Content */}
        <div class="flex-1 overflow-y-auto p-4">
          <Show
            when={clipboard.entries().length > 0}
            fallback={
              <div class="text-center text-gray-500 py-8">
                No items in clipboard
              </div>
            }
          >
            <For each={clipboard.entries()}>
              {(entry) => (
                <ClipboardEntryRow
                  entry={entry}
                  onRemove={clipboard.remove}
                  onTogglePin={clipboard.togglePin}
                  onPaste={props.onPaste}
                />
              )}
            </For>
          </Show>
        </div>

        {/* Footer */}
        <Show when={clipboard.entries().length > 0}>
          <div class="p-4 border-t border-gray-700">
            <Button
              type="button"
              class="btn btn-sm btn-error w-full"
              onClick={handleClearAll}
            >
              Clear All Unpinned
            </Button>
          </div>
        </Show>
      </div>

      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => props.onClose()}
      />
    </Show>
  )
}
