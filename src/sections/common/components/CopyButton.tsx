import { type Accessor, type JSXElement } from 'solid-js'

import { CopyIcon } from '~/sections/common/components/icons/CopyIcon'
import { COPY_BUTTON_STYLES } from '~/sections/common/styles/buttonStyles'

type CopyButtonProps<T> = {
  onCopy: (value: T) => void
  value: Accessor<T>
  class?: string
  stopPropagation?: boolean
  'aria-label'?: string
}

/**
 * Copy button component with accessibility support.
 * Provides a button that triggers a copy action with the provided value.
 */
export function CopyButton<T>(props: CopyButtonProps<T>): JSXElement {
  const ariaLabel = () => props['aria-label'] ?? 'Copy'

  return (
    <button
      type="button"
      class={props.class ?? COPY_BUTTON_STYLES}
      onClick={(e) => {
        if (props.stopPropagation ?? true) {
          e.stopPropagation()
          e.preventDefault()
        }
        props.onCopy(props.value())
      }}
      aria-label={ariaLabel()}
      title={ariaLabel()}
    >
      <CopyIcon size={20} aria-hidden="true" />
    </button>
  )
}
