import { type JSXElement } from 'solid-js'

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
      {props.canCopy && (
        <CopyButton
          value={() => null}
          onCopy={() => props.onCopy()}
          class={COPY_BUTTON_STYLES}
          stopPropagation={false}
        />
      )}
      {props.canPaste && (
        <div class={COPY_BUTTON_STYLES} onClick={props.onPaste}>
          <PasteIcon />
        </div>
      )}
      {props.canClear && (
        <div class={COPY_BUTTON_STYLES} onClick={props.onClear}>
          <TrashIcon />
        </div>
      )}
    </div>
  )
}
