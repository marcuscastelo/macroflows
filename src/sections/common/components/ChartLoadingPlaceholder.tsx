import { CARD_BACKGROUND_COLOR, CARD_STYLE } from '~/modules/theme/constants'

/**
 * Props for ChartLoadingPlaceholder component.
 */
type ChartLoadingPlaceholderProps = {
  height?: number
  message?: string
}

/**
 * Loading placeholder for charts to prevent layout shift and provide visual feedback.
 * @param props - Component props
 * @returns SolidJS component
 */
export function ChartLoadingPlaceholder(props: ChartLoadingPlaceholderProps) {
  const height = () => props.height ?? 400
  const message = () => props.message ?? 'Carregando gráfico...'

  return (
    <div class={`${CARD_BACKGROUND_COLOR} ${CARD_STYLE}`}>
      <div class="mx-5 lg:mx-20 pb-10">
        <div
          class="flex items-center justify-center rounded-lg bg-gray-700/30 animate-pulse"
          style={{ height: `${height()}px` }}
        >
          <div class="text-center">
            <div class="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <div class="text-gray-400 text-lg">{message()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
