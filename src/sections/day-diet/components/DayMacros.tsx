import { createMemo, Show } from 'solid-js'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { Progress } from '~/sections/common/components/Progress'
import { stringToDate } from '~/shared/utils/date/dateUtils'

export default function DayMacros(props: { dayDiet: DayDiet; class?: string }) {
  const macroSignals = createMemo(() => {
    const day = props.dayDiet

    const macroTarget_ = macroTargetUseCases.macroTargetAt(
      stringToDate(day.target_day),
    )
    if (macroTarget_ === null) {
      return { error: 'Peso ou meta de macros não encontrada para o dia.' }
    }
    return {
      macroTarget: macroTarget_,
      error: null,
    }
  })

  const macros = createMemo(() => DayDietExt.calcDayMacros(props.dayDiet))

  return (
    <Show
      when={
        macroSignals().error === null &&
        macroSignals().macroTarget !== undefined &&
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (macroSignals() as {
          macroTarget: MacroNutrients
          error: null
        })
      }
      fallback={
        <div class="text-red-500 text-sm">
          {macroSignals().error ?? 'Erro desconhecido ao calcular macros.'}
        </div>
      }
    >
      {(macroSignals) => (
        <div class={`flex pt-3 ${props.class} flex-col xs:flex-row `}>
          <div class="shrink">
            <Calories
              class="w-full"
              macros={macros()}
              targetMacros={macroSignals().macroTarget}
            />
          </div>
          <div class="flex-1">
            <Macros
              class="mt-3 text-xl xs:mt-0"
              macros={macros()}
              targetMacros={macroSignals().macroTarget}
            />
          </div>
        </div>
      )}
    </Show>
  )
}

function Calories(props: {
  macros: MacroNutrients
  targetMacros: MacroNutrients
  class?: string
}) {
  const calories = () => MacroNutrientsExt.of(props.macros).calories()
  const targetCalories = () =>
    MacroNutrientsExt.of(props.targetMacros).calories()
  return (
    <>
      <div class={`h-24 overflow-y-clip text-center ${props.class}`}>
        <div
          class="radial-progress text-blue-600"
          style={{
            '--value': (100 * (calories() / targetCalories())) / 2,
            '--size': '12rem',
            '--thickness': '0.7rem',
            transform: 'rotate(90deg) scale(-1, -1)',
          }}
          role="progressbar"
        >
          <span
            class=""
            style={{
              transform: 'rotate(-90deg) scale(-1, -1) translate(0, -0.5rem)',
            }}
          >
            {Math.round(calories()).toFixed(2)}/
            {Math.round(targetCalories()).toFixed(2)}kcal
          </span>
        </div>
      </div>
    </>
  )
}

function Macros(props: {
  macros: MacroNutrients
  targetMacros: MacroNutrients
  class?: string
}) {
  return (
    <div class={`mx-2 ${props.class}`}>
      <Progress
        class=""
        sizeClass="h-1.5"
        textLabelPosition="outside"
        color="green"
        textLabel={`Carboidrato (${props.macros.carbs.toFixed(2)}/${props.targetMacros.carbs.toFixed(2)}g)`}
        showLabel={true}
        progress={(100 * props.macros.carbs) / props.targetMacros.carbs}
      />
      <Progress
        class=""
        sizeClass="h-1.5"
        textLabelPosition="outside"
        color="red"
        textLabel={`Proteína (${props.macros.protein.toFixed(2)}/${props.targetMacros.protein.toFixed(2)}g)`}
        showLabel={true}
        progress={(100 * props.macros.protein) / props.targetMacros.protein}
      />
      <Progress
        class=""
        sizeClass="h-1.5"
        textLabelPosition="outside"
        color="yellow"
        textLabel={`Gordura (${props.macros.fat.toFixed(2)}/${props.targetMacros.fat.toFixed(2)}g)`}
        showLabel={true}
        progress={(100 * props.macros.fat) / props.targetMacros.fat}
      />
    </div>
  )
}
