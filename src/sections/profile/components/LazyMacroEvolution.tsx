import { createEffect, createSignal, Show } from 'solid-js'

import { ChartLoadingPlaceholder } from '~/sections/common/components/ChartLoadingPlaceholder'
import { MacroEvolution } from '~/sections/profile/components/MacroEvolution'
import { useIntersectionObserver } from '~/shared/hooks/useIntersectionObserver'
import { logging } from '~/shared/utils/logging'

/**
 * Lazy loading wrapper for MacroEvolution component.
 * Loads the chart only when it becomes visible in the viewport.
 * @returns SolidJS component
 */
export function LazyMacroEvolution() {
  const [shouldLoad, setShouldLoad] = createSignal(false)

  const { isVisible, setRef } = useIntersectionObserver()

  createEffect(() => {
    logging.debug('LazyMacroEvolution: Checking visibility:   ', isVisible())
    if (isVisible()) {
      setShouldLoad(true)
    }
  })

  return (
    <div ref={setRef}>
      <Show
        when={shouldLoad()}
        fallback={
          <ChartLoadingPlaceholder
            height={600}
            message="Aguardando carregamento do gráfico..."
          />
        }
      >
        <MacroEvolution />
      </Show>
    </div>
  )
}
