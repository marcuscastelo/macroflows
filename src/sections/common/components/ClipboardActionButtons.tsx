import { type JSXElement, Show } from 'solid-js'

import { clipboardUseCases } from '~/modules/clipboard/application/usecases/clipboardUseCases'
import { CopyButton } from '~/sections/common/components/CopyButton'
import { PasteIcon } from '~/sections/common/components/icons/PasteIcon'
import { TrashIcon } from '~/sections/common/components/icons/TrashIcon'
import { COPY_BUTTON_STYLES } from '~/sections/common/styles/buttonStyles'

type ClipboardActionButtonsProps = {
  canCopy: boolean
  canPaste: boolean
  canClear: boolean
  onCopy: () => void
  onPaste: () => void
  onClear: (e: MouseEvent) => void
}

export function ClipboardActionButtons(
  props: ClipboardActionButtonsProps,
): JSXElement {
  return (
    <div class={'ml-auto flex gap-2'}>
      <Show when={props.canCopy}>
        <CopyButton
          value={() => null}
          onCopy={() => props.onCopy()}
          class={COPY_BUTTON_STYLES}
          stopPropagation={false}
        />
      </Show>
      <Show when={props.canPaste && clipboardUseCases.entryCount() > 0}>
        <div class={COPY_BUTTON_STYLES} onClick={() => props.onPaste()}>
          <PasteIcon />
        </div>
      </Show>
      <Show when={props.canClear}>
        <div class={COPY_BUTTON_STYLES} onClick={(e) => props.onClear(e)}>
          <TrashIcon />
        </div>
      </Show>
    </div>
  )
}
