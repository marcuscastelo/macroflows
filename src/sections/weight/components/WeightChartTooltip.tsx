import { useCases } from '~/di/useCases'
import { type WeightChartOHLC } from '~/modules/weight/application/chart/weightChartUtils'
import { type GroupedWeightsByPeriod } from '~/modules/weight/domain/chart/weightEvolutionDomain'
import { type Weight } from '~/modules/weight/domain/weight/weight'

/**
 * Renders the custom tooltip HTML for the weight chart.
 * @param params - Tooltip params
 * @returns HTML string
 */
export function WeightChartTooltip({
  dataPointIndex,
  w,
  polishedData,
  weightsByPeriod,
}: {
  dataPointIndex: number
  w: unknown
  polishedData: readonly ({
    movingAverage: number
    desiredWeight: number
  } & WeightChartOHLC)[]
  weightsByPeriod: GroupedWeightsByPeriod
}): string {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const chartW = w as {
    config?: {
      series?: Array<{
        data?: Array<{ x: string; y: number[] | number }>
      }>
    }
  }
  const point =
    chartW.config &&
    chartW.config.series &&
    chartW.config.series[0] &&
    chartW.config.series[0].data
      ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (chartW.config.series[0].data[dataPointIndex] as
          | { x: string; y: number[] }
          | undefined)
      : undefined
  const avg =
    chartW.config &&
    chartW.config.series &&
    chartW.config.series[1] &&
    chartW.config.series[1].data &&
    typeof chartW.config.series[1].data[dataPointIndex]?.y === 'number'
      ? chartW.config.series[1].data[dataPointIndex].y
      : undefined
  const desired =
    chartW.config &&
    chartW.config.series &&
    chartW.config.series[2] &&
    chartW.config.series[2].data &&
    typeof chartW.config.series[2].data[dataPointIndex]?.y === 'number'
      ? chartW.config.series[2].data[dataPointIndex].y
      : undefined
  let range = ''
  if (point && Array.isArray(point.y) && point.y.length >= 3) {
    const low = point.y[2]
    const high = point.y[1]
    if (typeof low === 'number' && typeof high === 'number') {
      range = `${low.toFixed(2)}~${high.toFixed(2)}`
    }
  }
  let progress = ''
  if (
    typeof desired === 'number' &&
    point &&
    Array.isArray(point.y) &&
    typeof point.y[3] === 'number'
  ) {
    const idx = polishedData.findIndex((w) => w.date === point.x)
    if (idx !== -1) {
      const periodKeys = Object.keys(weightsByPeriod)
      const periodKey = periodKeys[idx]
      const periodWeights: readonly Weight[] =
        periodKey !== undefined && Array.isArray(weightsByPeriod[periodKey])
          ? weightsByPeriod[periodKey]
          : []
      let diet: 'cut' | 'normo' | 'bulk' = 'cut'
      if (
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        typeof (window as unknown as { currentUser?: { diet?: string } }) !==
          'undefined' &&
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        typeof (window as unknown as { currentUser?: { diet?: string } })
          .currentUser?.diet === 'string'
      ) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const d = (window as unknown as { currentUser?: { diet?: string } })
          .currentUser?.diet
        if (d === 'cut' || d === 'normo' || d === 'bulk') diet = d
      }
      const progressResult = useCases
        .weightChartUseCases()
        .calculateWeightProgress(periodWeights, desired, diet)
      if (progressResult && progressResult.type === 'progress') {
        progress = progressResult.progress.toFixed(2) + '%'
      } else if (progressResult && progressResult.type === 'exceeded') {
        progress = '100%+'
      } else if (progressResult && progressResult.type === 'no_change') {
        progress = '0%'
      } else {
        progress = ''
      }
    }
  }
  return `<div style='padding:8px'>
    <div><b>${point?.x ?? ''}</b></div>
    <div><b>${range}</b></div>
    <div>Média: <b>${avg !== undefined ? avg.toFixed(2) : '-'}</b></div>
    <div>Peso desejado: <b>${desired !== undefined ? desired.toFixed(2) : '-'}</b></div>
    <div>Progresso: <b>${progress}</b></div>
  </div>`
}
