import { A } from '@solidjs/router'
import { createMemo, Show } from 'solid-js'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { Progress } from '~/sections/common/components/Progress'
import { stringToDate } from '~/shared/utils/date/dateUtils'

export type DayMacrosProps = {
  dayDiet: DayDiet
  class?: string
}

export default function DayMacros(props: DayMacrosProps) {
  const macros = createMemo(() => DayDietExt.calcDayMacros(props.dayDiet))
  const macroTarget = createMemo(() =>
    macroTargetUseCases.macroTargetAt(stringToDate(props.dayDiet.target_day)),
  )

  return (
    <Show
      when={macroTarget()}
      fallback={
        <div class="text-red-500 text-sm">
          Peso ou meta de macros não encontrada para o dia.
          <A href="/profile" class="underline ml-1">
            Verifique suas metas de macros.
          </A>
        </div>
      }
    >
      {(macroTarget) => (
        <div class={`flex pt-3 ${props.class} flex-col xs:flex-row `}>
          <div class="shrink">
            <Calories
              class="w-full"
              macros={macros()}
              targetMacros={macroTarget()}
            />
          </div>
          <div class="flex-1">
            <Macros
              class="mt-3 text-xl xs:mt-0"
              macros={macros()}
              targetMacros={macroTarget()}
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
  const macrosExt = () => MacroNutrientsExt.of(props.macros)
  const targetMacrosExt = () => MacroNutrientsExt.of(props.targetMacros)

  return (
    <div class={`mx-2 ${props.class}`}>
      <Progress
        class=""
        sizeClass="h-1.5"
        textLabelPosition="outside"
        color="green"
        textLabel={`Carboidrato (${macrosExt().carbsInGrams().toFixed(2)}/${targetMacrosExt().carbsInGrams().toFixed(2)}g)`}
        showLabel={true}
        progress={
          (100 * macrosExt().carbsInGrams()) / targetMacrosExt().carbsInGrams()
        }
      />
      <Progress
        class=""
        sizeClass="h-1.5"
        textLabelPosition="outside"
        color="red"
        textLabel={`Proteína (${macrosExt().proteinInGrams().toFixed(2)}/${targetMacrosExt().proteinInGrams().toFixed(2)}g)`}
        showLabel={true}
        progress={
          (100 * macrosExt().proteinInGrams()) /
          targetMacrosExt().proteinInGrams()
        }
      />
      <Progress
        class=""
        sizeClass="h-1.5"
        textLabelPosition="outside"
        color="yellow"
        textLabel={`Gordura (${macrosExt().fatInGrams().toFixed(2)}/${targetMacrosExt().fatInGrams().toFixed(2)}g)`}
        showLabel={true}
        progress={
          (100 * macrosExt().fatInGrams()) / targetMacrosExt().fatInGrams()
        }
      />
    </div>
  )
}
