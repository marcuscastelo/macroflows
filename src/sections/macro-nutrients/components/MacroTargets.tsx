import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  Show,
  Suspense,
  untrack,
} from 'solid-js'

import {
  CARBO_CALORIES,
  FAT_CALORIES,
  PROTEIN_CALORIES,
} from '~/modules/diet/macro-nutrients/domain/macroExt'
import {
  insertMacroProfile,
  updateMacroProfile,
} from '~/modules/diet/macro-profile/application/usecases/macroProfileCrud'
import {
  createNewMacroProfile,
  type MacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { MacroTargetExt } from '~/modules/diet/macro-target/domain/macroTargetExt'
import { showError } from '~/modules/toast/application/toastManager'
import { type Weight } from '~/modules/weight/domain/weight/weight'
import { Button } from '~/sections/common/components/buttons/Button'
import { openRestoreProfileModal } from '~/shared/modal/helpers/specializedModalHelpers'
import { dateToYYYYMMDD, getTodayYYYYMMDD } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'

export type MacroRepresentation = {
  name: string
  percentage: number
  grams: number
  gramsPerKg: number
  calorieMultiplier: number
}

const calculateMacroRepresentation = (
  profile: Pick<
    MacroProfile,
    'gramsPerKgCarbs' | 'gramsPerKgFat' | 'gramsPerKgProtein'
  >,
  weight: number,
) => {
  const targetMacros = MacroTargetExt.of(profile).forWeight(weight)
  const caloriesPercentages = targetMacros.caloriesPercentages()

  return {
    carbs: {
      name: 'Carboidratos',
      percentage: caloriesPercentages.carbs,
      grams: targetMacros.carbs(),
      gramsPerKg: profile.gramsPerKgCarbs,
      calorieMultiplier: CARBO_CALORIES,
    },
    protein: {
      name: 'Proteínas',
      percentage: caloriesPercentages.protein,
      grams: targetMacros.protein(),
      gramsPerKg: profile.gramsPerKgProtein,
      calorieMultiplier: PROTEIN_CALORIES,
    },
    fat: {
      name: 'Gorduras',
      percentage: caloriesPercentages.fat,
      grams: targetMacros.fat(),
      gramsPerKg: profile.gramsPerKgFat,
      calorieMultiplier: FAT_CALORIES,
    },
  }
}

// TODO: Enable changing target calories directly (and update macros accordingly)
// const calculateDifferenceInCarbs = (
//   targetCalories: number,
//   weight: number,
//   currentProfile: MacroProfile
// ): number => {
//   const currentCalories = calcCalories(
//     calculateMacroTarget(weight, currentProfile)
//   )
//   return (targetCalories - currentCalories) / CARBO_CALORIES
// }

export type MacroTargetProps = {
  weight: Accessor<Weight['weight']>
  currentProfile: Accessor<MacroProfile>
  previousMacroProfile: Accessor<MacroProfile | null>
  className?: string
  mode: 'edit' | 'view'
}

const onSaveMacroProfile = (profile: MacroProfile) => {
  logging.info('[ProfilePage] Saving profile', profile)
  if (profile.target_day.getTime() > new Date(getTodayYYYYMMDD()).getTime()) {
    showError('Data alvo não pode ser no futuro')
    return
  } else if (
    profile.id !== -1 && // TODO: Better typing system for new MacroProfile instead of -1.
    profile.target_day.getTime() === new Date(getTodayYYYYMMDD()).getTime()
  ) {
    logging.info('[ProfilePage] Updating profile', profile)

    // Same day, update
    updateMacroProfile(
      profile.id,
      createNewMacroProfile({
        user_id: profile.user_id,
        target_day: profile.target_day,
        gramsPerKgCarbs: profile.gramsPerKgCarbs,
        gramsPerKgProtein: profile.gramsPerKgProtein,
        gramsPerKgFat: profile.gramsPerKgFat,
      }),
    ).catch((error) => {
      showError(error, {}, 'Erro ao atualizar perfil de macro')
    })
  } else if (
    profile.id === -1 || // TODO: Better typing system for new MacroProfile instead of -1.
    profile.target_day.getTime() < new Date(getTodayYYYYMMDD()).getTime()
  ) {
    logging.info('[ProfilePage] Inserting profile', profile)

    // Past day, insert with new date
    void insertMacroProfile(
      createNewMacroProfile({
        ...profile,
        target_day: new Date(getTodayYYYYMMDD()),
      }),
    )
  } else {
    showError('Erro imprevisto ao salvar perfil de macro')
  }
}

export function MacroTarget(props: MacroTargetProps) {
  const currentMacroRepresentation = createMemo(() =>
    calculateMacroRepresentation(props.currentProfile(), props.weight()),
  )

  const targetCalories = createMemo(() => {
    const macros = MacroTargetExt.of(props.currentProfile()).forWeight(
      props.weight(),
    )
    const calories = Math.round(macros.calories() * 100) / 100
    return calories.toString() + ' kcal'
  })

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <h1 class="mb-6 text-center text-3xl font-bold">Meta calórica diária</h1>
      <div class="mx-5">
        <input
          value={targetCalories()}
          type="search"
          id="default-search"
          class="input text-center font-bold"
          style={{ width: '100%' }}
          placeholder="Insira a meta de calorias diárias"
          disabled={true} // TODO: Enable changing target calories directly (and update macros accordingly).
          required
        />
      </div>

      <>
        <div class="mx-5 flex flex-col">
          {props.mode === 'edit' && (
            <>
              <Show
                when={props.previousMacroProfile()}
                fallback={
                  <span class="text-center">
                    Tem perfil antigo? <span class="text-red-500">Não</span>
                  </span>
                }
              >
                {(previousMacroProfile) => (
                  <>
                    <span class="text-center">
                      Tem perfil antigo?{' '}
                      {'Sim, de ' +
                        dateToYYYYMMDD(previousMacroProfile().target_day)}
                    </span>
                    <Button
                      class="btn-primary btn-sm"
                      onClick={() => {
                        openRestoreProfileModal({
                          currentProfile: props.currentProfile(),
                          previousMacroProfile: previousMacroProfile(),
                        })
                      }}
                    >
                      Restaurar perfil antigo
                    </Button>
                  </>
                )}
              </Show>
            </>
          )}
        </div>

        <div class="mx-5 flex flex-col">
          <MacroTargetSetting
            headerColor="text-green-400"
            currentProfile={props.currentProfile()}
            weight={props.weight()}
            target={currentMacroRepresentation().carbs}
            field="carbs"
            mode={props.mode}
          />

          <MacroTargetSetting
            headerColor="text-red-500"
            currentProfile={props.currentProfile()}
            weight={props.weight()}
            target={currentMacroRepresentation().protein}
            field="protein"
            mode={props.mode}
          />

          <MacroTargetSetting
            headerColor="text-yellow-500"
            currentProfile={props.currentProfile()}
            weight={props.weight()}
            target={currentMacroRepresentation().fat}
            field="fat"
            mode={props.mode}
          />
        </div>
      </>
    </Suspense>
  )
}

function MacroTargetSetting(props: {
  headerColor: string
  currentProfile: MacroProfile
  weight: number
  target: MacroRepresentation
  field: 'carbs' | 'protein' | 'fat'
  mode: 'edit' | 'view'
}) {
  const emptyIfZeroElse2Decimals = (value: number) =>
    value === 0 ? '' : value.toFixed(2)

  const percentage = () =>
    emptyIfZeroElse2Decimals(props.target.percentage * 100)
  const grams = () => emptyIfZeroElse2Decimals(props.target.grams)
  const gramsPerKg = () => emptyIfZeroElse2Decimals(props.target.gramsPerKg)

  const onSetGramsPerKg = (gramsPerKg: number) => {
    const profile_ = props.currentProfile

    onSaveMacroProfile({
      ...profile_,
      [`gramsPerKg${props.field.charAt(0).toUpperCase() + props.field.slice(1)}`]:
        gramsPerKg,
    })
  }

  const onSetGrams = (grams: number) => {
    const profile_ = props.currentProfile

    onSaveMacroProfile({
      ...profile_,
      [`gramsPerKg${props.field.charAt(0).toUpperCase() + props.field.slice(1)}`]:
        grams / props.weight,
    })
  }

  // TODO: Allow changing percentage directly
  // const makeOnSetPercentage =
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   (macro: 'carbs' | 'protein' | 'fat') => (percentage: number) => {
  //     showError('Direct percentage change not yet implemented', {context: 'user-action'})
  //   }

  return (
    <div class="my-2 flex flex-col p-2 border-t border-slate-900">
      <div class="flex flex-col justify-between sm:flex-row gap-0 sm:gap-5 text-center sm:text-start">
        <span
          class={`text-3xl text-center flex-1 font-bold ${props.headerColor}`}
        >
          {props.target.name}
          <span class="hidden sm:inline">:</span>
        </span>
        <span class="my-auto flex-1 text-xl text-center">
          {(props.target.calorieMultiplier * props.target.grams).toFixed(0)}{' '}
          kcal
          <span class="ml-2 text-slate-300 text-lg">({percentage()}%)</span>
        </span>
      </div>
      <div class="mt-5 flex flex-1 shrink flex-col gap-1">
        {/* <MacroField
          fieldName="Porcentagem (%)"
          field={percentage}
          setField={(percentage) => onSetPercentage?.(Number(percentage))}
          unit="%"
          disabled={true}
          className="font-thin italic"
        /> */}

        <div class="flex flex-col md:flex-row gap-5">
          <MacroField
            fieldName="Gramas (g)"
            field={grams()}
            setField={(grams) => {
              onSetGrams(Number(grams))
            }}
            unit="g"
            disabled={props.mode === 'view'}
          />

          <MacroField
            fieldName="Proporção (g/kg)"
            field={gramsPerKg()}
            setField={(gramsPerKg) => {
              onSetGramsPerKg(Number(gramsPerKg))
            }}
            unit="g/kg"
            disabled={props.mode === 'view'}
          />
        </div>
      </div>
    </div>
  )
}

function MacroField(props: {
  fieldName: string
  field: string
  setField: (field: string) => void
  unit: string
  disabled?: boolean
  className?: string
}) {
  const [innerField, setInnerField] = createSignal(untrack(() => props.field))

  createEffect(() => {
    setInnerField(props.field)
  })

  return (
    <div class="flex flex-1 flex-col">
      <div class="">
        <input
          value={innerField()}
          onChange={(e) => setInnerField(e.target.value)}
          onBlur={() => {
            props.setField(innerField())
          }}
          type="number"
          // className={`block text-center w-full p-2 pl-10 text-md bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 ${className || ''}`}
          class="input text-center font-bold"
          style={{ width: '100%' }}
          disabled={props.disabled}
          placeholder=""
          required
        />
      </div>
      <div class="my-auto mr-3 text-center">
        <label>{props.fieldName}</label>
      </div>
      {/* <span className="mt-auto">
                {unit}
            </span> */}
    </div>
  )
}
