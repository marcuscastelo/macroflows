import { type Accessor } from 'solid-js'

import { useCases } from '~/di/useCases'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'
import { getEffectiveMacroProfile } from '~/modules/diet/macro-profile/domain/macroProfileOperations'
import { MacroTargetExt } from '~/modules/diet/macro-target/domain/macroTargetExt'
import { CARD_BACKGROUND_COLOR, CARD_STYLE } from '~/modules/theme/constants'
import { type Weight } from '~/modules/weight/domain/weight/weight'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'
import { dateToDDMM } from '~/shared/utils/date/dateUtils'

export function MacroEvolution() {
  const weightUseCases = useCases.weightUseCases()

  return (
    <div class={`${CARD_BACKGROUND_COLOR} ${CARD_STYLE}`}>
      <h5 class={'mx-auto mb-5 text-center text-3xl font-bold'}>
        Evolução de Macronutrientes
      </h5>
      <div class="mx-5 lg:mx-20">
        <AllMacrosChart weights={weightUseCases.weights} />
        <CaloriesChart weights={weightUseCases.weights} />
        <ProteinChart weights={weightUseCases.weights} />
        <FatChart weights={weightUseCases.weights} />
        <CarbsChart weights={weightUseCases.weights} />
      </div>
    </div>
  )
}

function _createChartData(
  weights: readonly Weight[],
  days: readonly DayDiet[],
  macroProfiles: readonly MacroProfile[],
) {
  const data = days.map((day) => {
    const dayDate = new Date(day.target_day)
    const dayMacros = DayDietExt.of(day).macros()
    const dayCalories = dayMacros.calories()

    const currentWeight = WeightsExt.effectiveAt(weights, dayDate)
    const currentMacroProfile = getEffectiveMacroProfile(macroProfiles, dayDate)
    const macroTarget =
      currentMacroProfile !== null
        ? MacroTargetExt.forWeight(
            currentMacroProfile,
            currentWeight?.weight ?? 0,
          )
        : null

    if (macroTarget === null) {
      return {
        name: dateToDDMM(dayDate),
        calories: dayCalories.toFixed(0),
        protein: dayMacros.proteinInGrams().toFixed(0),
        fat: dayMacros.fatInGrams().toFixed(0),
        carbs: dayMacros.carbsInGrams().toFixed(0),
      }
    }

    const macroTargetExt = MacroNutrientsExt.of(macroTarget)

    return {
      name: dateToDDMM(dayDate),
      calories: dayCalories.toFixed(0),
      targetCalories: macroTargetExt.calories(),
      protein: dayMacros.proteinInGrams().toFixed(0),
      targetProtein: macroTargetExt.proteinInGrams().toFixed(0),
      fat: dayMacros.fatInGrams().toFixed(0),
      targetFat: macroTargetExt.fatInGrams().toFixed(0),
      carbs: dayMacros.carbsInGrams().toFixed(0),
      targetCarbs: macroTargetExt.carbsInGrams().toFixed(0),
      targetGrams:
        macroTargetExt.proteinInGrams() +
        macroTargetExt.carbsInGrams() +
        macroTargetExt.fatInGrams(),
    }
  })

  return data
}

function AllMacrosChart(_props: { weights: Accessor<readonly Weight[]> }) {
  // const macroProfile = getLatestMacroProfile(userMacroProfiles())

  // const proteinDeviance = () =>
  //   macroProfile !== null
  //     ? dayDiets()
  //         .map((day) => {
  //           const currentWeight = inForceWeight(
  //             props.weights() ?? [],
  //             new Date(day.target_day),
  //           )
  //           const macroTargets = calculateMacroTarget(
  //             currentWeight?.weight ?? 0,
  //             macroProfile,
  //           )
  //           const dayMacros = calcDayMacros(day)
  //           return dayMacros.protein - macroTargets.protein
  //         })
  //         .reduce((a, b) => a + b, 0)
  //     : 0

  // const fatDeviance = () =>
  //   macroProfile !== null
  //     ? dayDiets()
  //         .map((day) => {
  //           const currentWeight = inForceWeight(
  //             props.weights() ?? [],
  //             new Date(day.target_day),
  //           )
  //           const macroTargets = calculateMacroTarget(
  //             currentWeight?.weight ?? 0,
  //             macroProfile,
  //           )
  //           const dayMacros = calcDayMacros(day)
  //           return dayMacros.fat - macroTargets.fat
  //         })
  //         .reduce((a, b) => a + b, 0)
  //     : 0

  // const _data = () => {
  //   const weights = props.weights()
  //   if (!weights) return []
  //   return createChartData(weights, dayDiets(), userMacroProfiles())
  // }

  return (
    <div>
      {/* <div class="text-3xl text-center">Geral</div>
      <Capsule
        leftContent={<h5 class={'ml-2 p-2 text-xl'}>Desvio de Proteína (g)</h5>}
        rightContent={
          <h5 class={'ml-2 p-2 text-xl'}>{proteinDeviance().toFixed(0)}</h5>
        }
        class={'mb-2'}
      />
      <Capsule
        leftContent={<h5 class={'ml-2 p-2 text-xl'}>Desvio de Gordura (g)</h5>}
        rightContent={
          <h5 class={'ml-2 p-2 text-xl'}>{fatDeviance().toFixed(0)}</h5>
        }
        class={'mb-2'}
      /> */}
      {/* <ResponsiveContainer width="90%" height={400}>
        <ComposedChart width={0} height={400} data={data} syncId={1}>
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis dataKey="name" angle={CHART_DATE_ANGLE} />
          <YAxis />
          <Tooltip
            content={({ payload, label, active }) => {
              if (!active || !payload) return null
              const {
                protein,
                fat,
                carbs,
                targetGrams,
                calories,
                targetCalories,
                targetProtein,
                targetFat,
                targetCarbs
              } = payload[0].payload
              return (
                <div class="bg-slate-700 p-5 opacity-80">
                  {calories && <h1> Calorias: {calories}kcal </h1>}
                  {targetCalories && (
                    <h1> Meta Calorias: {targetCalories}kcal </h1>
                  )}
                  {protein && (
                    <h1>
                      Proteína: {protein}g / {targetProtein}g
                    </h1>
                  )}
                  {fat && (
                    <h1>
                      Gordura: {fat}g / {targetFat}g
                    </h1>
                  )}
                  {carbs && (
                    <h1>
                      Carboidrato: {carbs}g /{targetCarbs}g
                    </h1>
                  )}
                  {targetGrams && (
                    <h1>
                      {' '}
                      Total:{' '}
                      {[carbs, fat, protein]
                        .map(Number)
                        .reduce((a, b) => a + b, 0)}
                      g / {targetGrams}g{' '}
                    </h1>
                  )}

                  <h1>{label}</h1>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="protein"
            stackId="1"
            stroke="#C81E1E"
            fill="#C81E1E"
          />
          <Area
            type="monotone"
            dataKey="fat"
            stackId="1"
            stroke="#FF8A4C"
            fill="#FF8A4C"
          />
          <Area
            type="monotone"
            dataKey="carbs"
            stackId="1"
            stroke="#31C48D"
            fill="#31C48D"
          />
          <Line
            type="monotone"
            dataKey="targetGrams"
            stroke="#FF00FF"
            fill="#FF00FF"
          />
        </ComposedChart>
      </ResponsiveContainer> */}
    </div>
  )
}

function CaloriesChart(_props: { weights: Accessor<readonly Weight[]> }) {
  // const _data = () => {
  //   const weights = props.weights()
  //   if (!weights) return []
  //   return createChartData(weights, dayDiets(), userMacroProfiles())
  // }

  return (
    <div>
      <div class="text-3xl text-center">Calorias</div>
      {/* <ResponsiveContainer width="90%" height={400}>
        <ComposedChart width={0} height={400} data={data} syncId={1}>
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis dataKey="name" angle={CHART_DATE_ANGLE} />
          <YAxis />
          <Tooltip
            content={({ payload, label, active }) => {
              if (!active || !payload) return null
              const { calories, targetCalories } = payload[0].payload
              return (
                <div class="bg-slate-700 p-5 opacity-80">
                  {calories && <h1> Calorias: {calories}kcal </h1>}
                  {targetCalories && (
                    <h1> Meta Calorias: {targetCalories}kcal </h1>
                  )}
                  <h1>{label}</h1>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="calories"
            stackId="1"
            stroke="#FFFFFF"
            fill="#FFFFFF"
          />
          <Line
            type="monotone"
            dataKey="targetCalories"
            stroke="#FF00FF"
            fill="#FF00FF"
          />
        </ComposedChart>
      </ResponsiveContainer> */}
    </div>
  )
}

function ProteinChart(_props: { weights: Accessor<readonly Weight[]> }) {
  // const _data = () => {
  //   const weights = props.weights()
  //   if (!weights) return []
  //   return createChartData(weights, dayDiets(), userMacroProfiles())
  // }

  return (
    <div>
      <div class="text-3xl text-center">Proteína</div>
      {/* <ResponsiveContainer width="90%" height={400}>
        <ComposedChart width={0} height={400} data={data} syncId={1}>
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis dataKey="name" angle={CHART_DATE_ANGLE} />
          <YAxis />
          <Tooltip
            content={({ payload, label, active }) => {
              if (!active || !payload) return null
              const { protein, targetProtein } = payload[0].payload
              return (
                <div class="bg-slate-700 p-5 opacity-80">
                  {protein && <h1> Proteína: {protein}g </h1>}
                  {targetProtein && <h1> Meta Proteína: {targetProtein}g </h1>}

                  <h1>{label}</h1>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="protein"
            stackId="1"
            stroke="#C81E1E"
            fill="#C81E1E"
          />
          <Line
            type="monotone"
            dataKey="targetProtein"
            stroke="#FF00FF"
            fill="#FF00FF"
          />
        </ComposedChart>
      </ResponsiveContainer> */}
    </div>
  )
}

function FatChart(_props: { weights: Accessor<readonly Weight[]> }) {
  // const _data = () => {
  //   const weights = props.weights()
  //   if (!weights) return []
  //   return createChartData(weights, dayDiets(), userMacroProfiles())
  // }

  return (
    <div>
      <div class="text-3xl text-center">Gordura</div>
      {/* <ResponsiveContainer width="90%" height={400}>
        <ComposedChart width={0} height={400} data={data} syncId={1}>
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis dataKey="name" angle={CHART_DATE_ANGLE} />
          <YAxis />
          <Tooltip
            content={({ payload, label, active }) => {
              if (!active || !payload) return null
              const { fat, targetFat } = payload[0].payload
              return (
                <div class="bg-slate-700 p-5 opacity-80">
                  {fat && <h1> Gordura: {fat}g </h1>}
                  {targetFat && <h1> Meta Gordura: {targetFat}g </h1>}

                  <h1>{label}</h1>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="fat"
            stackId="1"
            stroke="#FF8A4C"
            fill="#FF8A4C"
          />
          <Line
            type="monotone"
            dataKey="targetFat"
            stroke="#FF00FF"
            fill="#FF00FF"
          />
        </ComposedChart>
      </ResponsiveContainer> */}
    </div>
  )
}

function CarbsChart(_props: { weights: Accessor<readonly Weight[]> }) {
  // const _data = () => {
  //   const weights = props.weights()
  //   if (!weights) return []
  //   return createChartData(weights, dayDiets(), userMacroProfiles())
  // }

  return (
    <div>
      <div class="text-3xl text-center">Carboidrato</div>
      {/* <ResponsiveContainer width="90%" height={400}>
        <ComposedChart width={0} height={400} data={data} syncId={1}>
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis dataKey="name" angle={CHART_DATE_ANGLE} />
          <YAxis />
          <Tooltip
            content={({ payload, label, active }) => {
              if (!active || !payload) return null
              const { carbs, targetCarbs } = payload[0].payload
              return (
                <div class="bg-slate-700 p-5 opacity-80">
                  {carbs && <h1> Carboidrato: {carbs}g </h1>}
                  {targetCarbs && <h1> Meta Carboidrato: {targetCarbs}g </h1>}
                  <h1>{label}</h1>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="carbs"
            stackId="1"
            stroke="#31C48D"
            fill="#31C48D"
          />
          <Line
            type="monotone"
            dataKey="targetCarbs"
            stroke="#FF00FF"
            fill="#FF00FF"
          />
        </ComposedChart>
      </ResponsiveContainer> */}
    </div>
  )
}
