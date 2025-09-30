import { createMemo, createSignal, onMount, Suspense } from 'solid-js'

import { type Weight } from '~/modules/weight/domain/weight'
import { type WeightChartType } from '~/modules/weight/application/weightChartSettings'
import { buildChartData } from '~/modules/weight/application/weightChartUtils'
import {
  calculateMovingAverage,
  groupWeightsByPeriod,
} from '~/modules/weight/domain/weightEvolutionDomain'
import { Chart } from '~/sections/common/components/charts/Chart'
import { buildWeightChartOptions } from '~/sections/weight/components/WeightChartOptions'
import { buildWeightChartSeries } from '~/sections/weight/components/WeightChartSeries'
import { type Accessor } from 'solid-js'

/**
 * Props for the WeightChart component.
 */
export type WeightChartProps = {
  weights: Accessor<readonly Weight[]>
  desiredWeight: number
  type: WeightChartType
}

/**
 * Detects if the device is mobile for performance optimizations.
 * @returns True if mobile device
 */
function checkMobile(): boolean {
  if (typeof window === 'undefined') return false
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth < 768
  )
}

/**
 * Renders a candlestick and line chart for weight evolution.
 * @param props - WeightChartProps
 * @returns SolidJS component
 */
export function WeightChart(props: WeightChartProps) {
  const [isMobile, setIsMobile] = createSignal(false)

  onMount(() => {
    setIsMobile(checkMobile())
  })

  const weightsByPeriod = createMemo(() => {
    return groupWeightsByPeriod(props.weights(), props.type, isMobile())
  })

  const data = createMemo(() => {
    const periods = weightsByPeriod()
    if (Object.keys(periods).length === 0) return []

    return buildChartData(periods)
  })

  const movingAverage = createMemo(() => {
    const chartData = data()
    if (chartData.length === 0) return []
    return calculateMovingAverage(chartData, 7)
  })

  const polishedData = createMemo(() => {
    const chartData = data()
    const avgData = movingAverage()
    if (chartData.length === 0) return []

    return chartData.map((weight, index) => ({
      ...weight,
      movingAverage: avgData[index] ?? 0,
      desiredWeight: props.desiredWeight,
    }))
  })

  const minMax = createMemo(() => {
    const polished = polishedData()
    if (polished.length === 0) return { min: 0, max: 100 }

    let min = Infinity
    let max = -Infinity

    for (const weight of polished) {
      const currentMin = Math.min(weight.desiredWeight, weight.low)
      const currentMax = Math.max(weight.desiredWeight, weight.high)
      if (currentMin < min) min = currentMin
      if (currentMax > max) max = currentMax
    }

    return { min, max }
  })

  const options = createMemo(() => {
    const { min, max } = minMax()
    return buildWeightChartOptions({
      min,
      max,
      polishedData: polishedData(),
      isMobile: isMobile(),
      weightsByPeriod: weightsByPeriod(),
    })
  })

  const series = createMemo(() => buildWeightChartSeries(polishedData()))

  const chartHeight = () => (isMobile() ? 500 : 600)

  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <Chart
        type="line"
        options={options()}
        series={series()}
        height={chartHeight()}
      />
    </Suspense>
  )
}
