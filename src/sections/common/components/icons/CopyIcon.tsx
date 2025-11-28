import { type JSX } from 'solid-js'

type CopyIconProps = {
  size?: number
  'aria-label'?: string
  class?: string
}

const DEFAULT_SIZE = 24
const DEFAULT_LABEL = 'Copy'

/**
 * Copy icon SVG component with accessibility support
 * @param props - Icon properties including size and ARIA attributes
 */
export function CopyIcon(props: CopyIconProps): JSX.Element {
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
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
