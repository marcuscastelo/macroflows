import { type JSX } from 'solid-js'

type PasteIconProps = {
  size?: number
  'aria-label'?: string
  class?: string
}

const DEFAULT_SIZE = 24
const DEFAULT_LABEL = 'Paste'

/**
 * Paste icon SVG component with accessibility support
 * @param props - Icon properties including size and ARIA attributes
 */
export function PasteIcon(props: PasteIconProps): JSX.Element {
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
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}
