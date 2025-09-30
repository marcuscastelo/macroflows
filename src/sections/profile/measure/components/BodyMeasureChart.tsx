import type { ApexOptions } from 'apexcharts'
import { type Accessor, createMemo, Suspense } from 'solid-js'

import ptBrLocale from '~/assets/locales/apex/pt-br.json'
import {
  groupMeasuresByDay,
  processMeasuresByDay,
} from '~/modules/measure/application/measureUtils'
import type { BodyMeasure } from '~/modules/measure/domain/measure'
import { currentUser } from '~/modules/user/application/user'
import { userWeights } from '~/modules/weight/application/usecases/weightState'
import { Chart } from '~/sections/common/components/charts/Chart'

type DayAverage = {
  height: number
  waist: number
  hip: number | undefined
  neck: number
}
type DayMeasures = {
  date: string
  dayAverage: DayAverage
  dayBf: number
}

/**
 * Props for the BodyMeasureChart component.
 */
export type BodyMeasureChartProps = {
  measures: Accessor<readonly BodyMeasure[]>
}

/**
 * Renders a chart for body measurements and body fat percentage.
 * @param props - BodyMeasureChartProps
 * @returns SolidJS component
 */
export function BodyMeasureChart(props: BodyMeasureChartProps) {
  const measuresByDay = createMemo(() => groupMeasuresByDay(props.measures()))

  const data = createMemo(() =>
    processMeasuresByDay(
      measuresByDay(),
      userWeights(),
      currentUser()?.gender ?? 'female',
    ),
  )

  return (
    <Suspense>
      <ChartFor
        title="Altura"
        accessor={(day) => day.dayAverage.height}
        data={data}
        color="magenta"
      />
      <ChartFor
        title="Cintura"
        accessor={(day) => day.dayAverage.waist}
        data={data}
        color="blue"
      />
      <ChartFor
        title="Quadril"
        accessor={(day) => day.dayAverage.hip ?? -1}
        data={data}
        color="green"
      />
      <ChartFor
        title="Pescoço"
        accessor={(day) => day.dayAverage.neck}
        data={data}
        color="red"
      />
      <ChartFor
        title="BF"
        accessor={(day) => day.dayBf}
        data={data}
        color="orange"
      />
    </Suspense>
  )
}

function ChartFor(props: {
  title: string
  data: Accessor<readonly DayMeasures[]>
  accessor: (day: DayMeasures) => number
  color: string
}) {
  const options = () =>
    ({
      theme: {
        mode: 'dark',
      },
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        decimalsInFloat: 0,
      },
      stroke: {
        width: 3,
        curve: 'straight',
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#444'],
        },
      },
      chart: {
        id: `body-measures-chart-${props.title}`,
        locales: [ptBrLocale],
        defaultLocale: 'pt-br',
        background: '#1E293B',
        zoom: {
          autoScaleYaxis: true,
        },
        animations: {
          enabled: true,
        },
        toolbar: {
          tools: {
            download: false,
            selection: false,
            zoom: true,
            zoomin: false,
            zoomout: false,
            pan: true,
            reset: true,
          },
          autoSelected: 'pan',
        },
      },
    }) satisfies ApexOptions

  const series = createMemo(
    () =>
      [
        {
          name: props.title,
          type: 'line',
          color: '#876',
          data: props.data().map((day) => ({
            x: day.date,
            y: props.accessor(day),
          })),
        },
      ] satisfies ApexOptions['series'],
  )

  return (
    <>
      <h1 class="text-3xl text-center">{props.title}</h1>
      <Chart type="line" options={options()} series={series()} height={200} />
    </>
  )
}
