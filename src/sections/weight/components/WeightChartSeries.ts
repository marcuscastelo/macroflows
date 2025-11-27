import { type WeightChartOHLC } from '~/modules/weight/application/chart/weightChartUtils'

/**
 * Builds the series for the weight chart.
 * @param polishedData - Array of WeightChartOHLC
 * @returns ApexCharts series array
 */
export function buildWeightChartSeries(
  polishedData: readonly (WeightChartOHLC & {
    movingAverage: number
    desiredWeight: number
  })[],
): Array<{
  name?: string
  type?: 'candlestick' | 'line'
  color?: string
  group?: string
  hidden?: boolean
  zIndex?: number
  data:
    | Array<{
        x: string
        y: [number, number, number, number]
        fillColor?: string
        strokeColor?: string
      }>
    | Array<{ x: string; y: number }>
}> {
  return [
    {
      type: 'candlestick',
      name: 'Pesos',
      data: polishedData.map((weight) => {
        const isInterpolated = weight.isInterpolated === true
        return {
          x: weight.date,
          y: [weight.open, weight.high, weight.low, weight.close],
          fillColor: isInterpolated ? '#888888' : undefined,
          strokeColor: isInterpolated ? '#888888' : undefined,
        }
      }),
    },
    {
      type: 'line',
      name: 'Média',
      color: '#FFA50055',
      data: polishedData.map((weight) => ({
        x: weight.date,
        y: weight.movingAverage,
      })),
    },
    {
      type: 'line',
      name: 'Peso desejado',
      color: '#FF00FF',
      data: polishedData.map((weight) => ({
        x: weight.date,
        y: weight.desiredWeight,
      })),
    },
  ]
}
