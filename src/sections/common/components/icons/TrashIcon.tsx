import { type JSX } from 'solid-js'

type TrashIconProps = {
  size?: number
  'aria-label'?: string
  class?: string
}

const DEFAULT_SIZE = 24
const DEFAULT_LABEL = 'Delete'

/**
 * Trash/Delete icon SVG component with accessibility support
 * @param props - Icon properties including size and ARIA attributes
 */
export function TrashIcon(props: TrashIconProps): JSX.Element {
  const size = () => props.size ?? DEFAULT_SIZE
  const label = () => props['aria-label'] ?? DEFAULT_LABEL

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      role="img"
      aria-label={label()}
      class={props.class}
    >
      <title>{label()}</title>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}
