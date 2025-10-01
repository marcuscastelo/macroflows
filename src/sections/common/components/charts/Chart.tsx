import { clientOnly } from '@solidjs/start'
import { type ApexChartProps } from 'solid-apexcharts'
import { createSignal, onMount, Show } from 'solid-js'

import { ChartLoadingPlaceholder } from '~/sections/common/components/ChartLoadingPlaceholder'

const InnerChart = clientOnly(
  () => import('~/sections/common/components/charts/InnerChart'),
  { lazy: true },
)

export function Chart(props: ApexChartProps) {
  const [loaded, setLoaded] = createSignal(false)
  onMount(() => {
    const timeout = setTimeout(() => {
      setLoaded(true)
    }, Math.random() * 1000) // Random delay between 1 and 2 seconds
    return () => clearTimeout(timeout)
  })
  return (
    <Show
      when={loaded()}
      fallback={
        <ChartLoadingPlaceholder
          height={
            parseInt(
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              props.height as string,
              10,
            ) || 400
          }
        />
      }
    >
      <InnerChart {...props} />
    </Show>
  )
}
