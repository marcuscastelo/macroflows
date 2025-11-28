import { type JSX } from 'solid-js'

type ClearIconProps = {
  size?: number
  'aria-label'?: string
  class?: string
}

const DEFAULT_SIZE = 24
const DEFAULT_LABEL = 'Clear'

/**
 * Clear/X icon SVG component with accessibility support
 * @param props - Icon properties including size and ARIA attributes
 */
export function ClearIcon(props: ClearIconProps): JSX.Element {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
