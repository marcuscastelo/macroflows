import { For, Suspense } from 'solid-js'

import { CARD_BACKGROUND_COLOR, CARD_STYLE } from '~/modules/theme/constants'
import { showError } from '~/modules/toast/application/toastManager'
import { currentUser, currentUserId } from '~/modules/user/application/user'
import {
  userWeights,
  weightCrudService,
} from '~/modules/weight/application/usecases/weightState'
import {
  setWeightChartType,
  WEIGHT_CHART_OPTIONS,
  weightChartType,
} from '~/modules/weight/application/weightChartSettings'
import { createNewWeight } from '~/modules/weight/domain/weight'
import { ChartLoadingPlaceholder } from '~/sections/common/components/ChartLoadingPlaceholder'
import { ComboBox } from '~/sections/common/components/ComboBox'
import { FloatInput } from '~/sections/common/components/FloatInput'
import { useFloatField } from '~/sections/common/hooks/useField'
import { WeightChart } from '~/sections/weight/components/WeightChart'
import { WeightProgress } from '~/sections/weight/components/WeightProgress'
import { WeightView } from '~/sections/weight/components/WeightView'
import { calculateWeightProgress } from '~/shared/utils/weightUtils'

/**
 * Renders the weight evolution view, including progress, chart, and entry form.
 * @returns SolidJS component
 */
export function WeightEvolution() {
  const desiredWeight = () => currentUser()?.desired_weight ?? 0
  const weightField = useFloatField(undefined, { maxValue: 200 })
  const weightProgress = () =>
    calculateWeightProgress(
      userWeights.latest,
      desiredWeight(),
      currentUser()?.diet ?? 'cut',
    )
  const weightProgressText = () => {
    const progress = weightProgress()
    if (progress === null) return 'N/A'

    switch (progress.type) {
      case 'no_weights':
        return 'Nenhum peso registrado'
      case 'progress':
        if (progress.progress >= 100) {
          return `100% 🎉`
        } else {
          return `${progress.progress.toFixed(1)}%`
        }
      case 'exceeded':
        return `100% + ${progress.exceeded.toFixed(1)}kg 🎉`
      case 'no_change':
        return 'Sem mudança'
      case 'reversal': {
        const signal = progress.currentChange.direction === 'gain' ? '+' : '-'
        return `Diverge ${signal}${progress.reversal.toFixed(1)}kg`
      }
      case 'normo':
        if (progress.difference === 0) {
          return 'Peso ideal atingido 🎉'
        } else {
          const signal = progress.direction === 'gain' ? '+' : '-'
          return `Variação: ${signal}${progress.difference.toFixed(1)}kg`
        }
      default:
        progress satisfies never // Ensure all cases are handled
    }
  }

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
            weightProgress={weightProgress()}
            weightProgressText={weightProgressText}
          />
          <Suspense fallback={<ChartLoadingPlaceholder />}>
            <WeightChart
              weights={userWeights}
              desiredWeight={desiredWeight()}
              type={weightChartType()}
            />
          </Suspense>
          <FloatInput
            field={weightField}
            class="input bg-transparent text-center px-0 pl-5 text-xl mb-3"
            onFocus={(e) => {
              e.target.select()
            }}
            style={{ width: '100%' }}
          />
          <button
            class="btn cursor-pointer uppercase btn-primary w-full focus:ring-2 focus:ring-blue-400 bg-blue-700 hover:bg-blue-800 border-none text-white"
            onClick={() => {
              const weight = weightField.value()
              if (weight === undefined) {
                showError('Digite um peso')
                return
              }
              const userId = currentUserId()
              const afterInsert = () => {
                weightField.setRawValue('')
              }
              weightCrudService
                .insertWeight(
                  createNewWeight({
                    user_id: userId,
                    weight,
                    target_timestamp: new Date(Date.now()),
                  }),
                )
                .then(afterInsert)
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
              each={[...userWeights.latest].reverse().slice(0, 10)}
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
