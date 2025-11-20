import { type ApexOptions } from 'apexcharts'

import ptBrLocale from '~/assets/locales/apex/pt-br.json'
import { getYAxisConfig } from '~/modules/weight/application/chart/weightChartUtils'
import { type WeightChartOHLC } from '~/modules/weight/application/chart/weightChartUtils'
import { type GroupedWeightsByPeriod } from '~/modules/weight/domain/chart/weightEvolutionDomain'
import { WeightChartTooltip } from '~/sections/weight/components/WeightChartTooltip'

/**
 * Builds ApexCharts options for the weight chart.
 * @param params - Options params
 * @returns ApexOptions
 */
export function buildWeightChartOptions({
  min,
  max,
  weightsByPeriod,
  polishedData,
  isMobile = false,
}: ApexOptions & {
  min: number
  max: number
  weightsByPeriod: GroupedWeightsByPeriod
  polishedData: readonly ({
    movingAverage: number
    desiredWeight: number
  } & WeightChartOHLC)[]
  isMobile?: boolean
}) {
  const y = getYAxisConfig(min, max)
  return {
    theme: { mode: 'dark' as const },
    xaxis: { type: 'category' as const },
    yaxis: {
      decimalsInFloat: y.decimalsInFloat,
      min: min - 1,
      max: max + 1,
      tickAmount: y.tickAmount,
      labels: {
        formatter: (val: number) => `${val.toFixed(y.decimalsInFloat)} kg`,
      },
    },
    stroke: {
      width: isMobile ? 2 : 3,
      curve: 'straight' as const,
    },
    dataLabels: { enabled: false },
    chart: {
      id: 'solidchart-example',
      locales: [ptBrLocale],
      defaultLocale: 'pt-br',
      background: '#1E293B',
      events: {
        beforeZoom(ctx: { w: { config: { xaxis: { range?: unknown } } } }) {
          ctx.w.config.xaxis.range = undefined
        },
      },
      zoom: { autoScaleYaxis: true },
      animations: {
        enabled: !isMobile,
        speed: isMobile ? 200 : 800,
        animateGradually: {
          enabled: !isMobile,
          delay: isMobile ? 50 : 150,
        },
        dynamicAnimation: {
          enabled: !isMobile,
          speed: isMobile ? 200 : 350,
        },
      },
      toolbar: {
        show: !isMobile,
        tools: {
          download: false,
          selection: false,
          zoom: !isMobile,
          zoomin: false,
          zoomout: false,
          pan: !isMobile,
          reset: !isMobile,
        },
        autoSelected: 'pan' as const,
      },
    },
    tooltip: {
      shared: true,
      enabled: !isMobile || polishedData.length < 100,
      custom: ({ dataPointIndex, w }: { dataPointIndex: number; w: unknown }) =>
        WeightChartTooltip({
          dataPointIndex,
          w,
          polishedData,
          weightsByPeriod,
        }),
    },
  } satisfies ApexOptions
}
