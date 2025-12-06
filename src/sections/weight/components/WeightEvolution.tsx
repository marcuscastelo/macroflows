import { For, Suspense } from 'solid-js'

import { useCases } from '~/di/useCases'
import { CARD_BACKGROUND_COLOR, CARD_STYLE } from '~/modules/theme/constants'
import { showError } from '~/modules/toast/application/toastManager'
import {
  setWeightChartType,
  WEIGHT_CHART_OPTIONS,
  weightChartType,
} from '~/modules/weight/application/chart/weightChartSettings'
import { createNewWeight } from '~/modules/weight/domain/weight/weight'
import { ChartLoadingPlaceholder } from '~/sections/common/components/ChartLoadingPlaceholder'
import { ComboBox } from '~/sections/common/components/ComboBox'
import { FloatInput } from '~/sections/common/components/FloatInput'
import { useFloatField } from '~/sections/common/hooks/useField'
import { WeightChart } from '~/sections/weight/components/WeightChart'
import { WeightProgress } from '~/sections/weight/components/WeightProgress'
import { WeightView } from '~/sections/weight/components/WeightView'

/**
 * Renders the weight evolution view, including progress, chart, and entry form.
 * @returns SolidJS component
 */
export function WeightEvolution() {
  const weightField = useFloatField(undefined, { maxValue: 200 })
  const authUseCases = useCases.authUseCases()

  return (
    <>
      <div class={`${CARD_BACKGROUND_COLOR} ${CARD_STYLE}`}>
        <div class="px-5 lg:px-5 pb-10">
          <div class="flex justify-between items-center px-4">
            <span class="text-2xl font-bold">Gráfico de evolução do peso</span>
            <ComboBox
              options={WEIGHT_CHART_OPTIONS}
              value={weightChartType()}
              onChange={setWeightChartType}
              class="w-48"
            />
          </div>
          <WeightProgress
            weightProgress={useCases.weightChartUseCases().weightProgress()}
            weightProgressText={
              useCases.weightChartUseCases().weightProgressText
            }
          />
          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <WeightChart
              weights={() => useCases.weightUseCases().weights()}
              desiredWeight={useCases.weightChartUseCases().desiredWeight()}
              type={weightChartType()}
            />
          </Suspense>
          <FloatInput
            field={weightField}
            class="input bg-transparent text-center px-0 pl-5 text-xl mb-3"
            onFocus={(e) => e.target.select()}
            style={{ width: '100%' }}
          />
          <button
            type="button"
            class="btn cursor-pointer uppercase btn-primary w-full focus:ring-2 focus:ring-blue-400 bg-blue-700 hover:bg-blue-800 border-none text-white"
            onClick={() => {
              const weight = weightField.value()
              if (weight === undefined) {
                showError('Digite um peso')
                return
              }

              useCases
                .weightUseCases()
                .insertWeight(
                  createNewWeight({
                    user_id: authUseCases.currentUserIdOrGuestId(),
                    weight,
                    target_timestamp: new Date(Date.now()),
                  }),
                )
                .then(() => weightField.setRawValue(''))
                .catch(() => {})
            }}
          >
            Adicionar peso
          </button>
        </div>
        {/* TODO: Implement scrollbar for big lists instead of slice */}
        <div class="mx-5 lg:mx-20 pb-10">
          <Suspense fallback={<div>Carregando pesos...</div>}>
            <For
              each={[...useCases.weightUseCases().weights()]
                .reverse()
                .slice(0, 10)}
              fallback={<>Não há pesos registrados</>}
            >
              {(weight) => <WeightView weight={weight} />}
            </For>
          </Suspense>
        </div>
      </div>
    </>
  )
}
