import { For } from 'solid-js'

import { useContainer } from '~/di/container'
import {
  createDayEditOrchestrator,
  type DayEditOrchestrator,
  type EditMode,
} from '~/modules/diet/day-diet/application/usecases/dayEditOrchestrator'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import {
  addItemToMeal,
  updateItemInMeal,
} from '~/modules/diet/meal/domain/mealOperations'
import { showError } from '~/modules/toast/application/toastManager'
import { CopyLastDayButton } from '~/sections/day-diet/components/CopyLastDayButton'
import { DeleteDayButton } from '~/sections/day-diet/components/DeleteDayButton'
import { openItemEditModal } from '~/sections/item/ui/openItemEditModal'
import {
  MealEditView,
  MealEditViewActions,
  MealEditViewContent,
  MealEditViewHeader,
} from '~/sections/meal/components/MealEditView'
import { openTemplateSearchModal } from '~/sections/search/ui/openTemplateSearchModal'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { logging } from '~/shared/utils/logging'

const handleEditItem = (
  dayEditUseCases: DayEditOrchestrator,
  meal: Meal,
  item: Item,
  props: {
    dayDiet: DayDiet
    mode: EditMode
    onRequestEditMode?: () => void
  },
) => {
  const permission = dayEditUseCases.checkEditPermission(props.mode)

  if (!permission.canEdit) {
    if (permission.confirmText && props.onRequestEditMode) {
      openConfirmModal(permission.reason, {
        title: permission.title,
        confirmText: permission.confirmText,
        cancelText: permission.cancelText,
        onConfirm: () => {
          props.onRequestEditMode?.()
        },
      })
    }
    return
  }

  const macroOverflow = dayEditUseCases.prepareMacroOverflowConfig(
    props.dayDiet,
    item,
  )
  logging.debug('macroOverflow:', macroOverflow)

  openItemEditModal({
    targetMealName: meal.name,
    item: () => item,
    macroOverflow: () => macroOverflow,
    onApply: (updatedItem) => {
      dayEditUseCases
        .updateItemInMealOrchestrated(meal, item, updatedItem)
        .catch((e: unknown) => {
          logging.error('DayMeals item update error:', e, {
            component: 'DayMeals',
            mealId: meal.id,
            itemId: item.id,
          })
          showError(e, {}, 'Erro ao atualizar item')
        })
    },
    targetName: meal.name,
    showAddItemButton: true,
  })
}
const handleUpdateMeal = async (
  dayEditUseCases: DayEditOrchestrator,
  meal: Meal,
  props: {
    mode: EditMode
    onRequestEditMode?: () => void
  },
) => {
  const permission = dayEditUseCases.checkEditPermission(props.mode)

  if (!permission.canEdit) {
    if (permission.confirmText && props.onRequestEditMode) {
      openConfirmModal(permission.reason, {
        title: permission.title,
        confirmText: permission.confirmText,
        cancelText: permission.cancelText,
        onConfirm: () => {
          props.onRequestEditMode?.()
        },
      })
    }
    return
  }

  await dayEditUseCases.updateMealOrchestrated(meal)
}

const handleNewItem = (
  dayEditUseCases: DayEditOrchestrator,
  meal: Meal,
  newItem: Item,
  props: {
    mode: EditMode
    onRequestEditMode?: () => void
  },
) => {
  const permission = dayEditUseCases.checkEditPermission(props.mode)

  if (!permission.canEdit) {
    if (permission.confirmText && props.onRequestEditMode) {
      openConfirmModal(permission.reason, {
        title: permission.title,
        confirmText: permission.confirmText,
        cancelText: permission.cancelText,
        onConfirm: () => {
          props.onRequestEditMode?.()
        },
      })
    }
    return
  }

  dayEditUseCases
    .addItemToMealOrchestrated(meal, newItem)
    .catch((e: unknown) => {
      logging.error('DayMeals item add error:', e, {
        component: 'DayMeals',
        mealId: meal.id,
      })
      showError(e, {}, 'Erro ao adicionar item')
    })
}

const handleNewItemButton = (
  dayEditUseCases: DayEditOrchestrator,
  meal: Meal,
  props: {
    mode: EditMode
    onRequestEditMode?: () => void
  },
) => {
  const permission = dayEditUseCases.checkEditPermission(props.mode)

  if (!permission.canEdit) {
    if (permission.confirmText && props.onRequestEditMode) {
      openConfirmModal(permission.reason, {
        title: permission.title,
        confirmText: permission.confirmText,
        cancelText: permission.cancelText,
        onConfirm: () => {
          props.onRequestEditMode?.()
        },
      })
    }
    return
  }

  openTemplateSearchModal({
    targetName: meal.name,
    onNewItem: (newItem) =>
      handleNewItem(dayEditUseCases, meal, newItem, props),
  })
}

/**
 * Displays and manages the meals for a given day.
 * If dayDiet is provided, uses it; otherwise, uses the currentDayDiet from application state.
 * @param props.dayDiet Optional DayDiet to display (overrides selectedDay)
 * @param props.selectedDay The day string (YYYY-MM-DD) to display
 * @param props.mode Display mode: 'edit', 'read-only' or 'summary'.
 */
export default function DayMeals(props: {
  dayDiet: DayDiet
  selectedDay: string
  mode: EditMode
  onRequestEditMode?: () => void
}) {
  const useCases = useContainer()
  const dayEditUseCases = createDayEditOrchestrator({
    macroTargetAt: (day: Date) =>
      useCases.macroTargetUseCases().macroTargetAt(day),
    updateMeal: (mealId, meal) =>
      useCases.mealUseCases().updateMeal(mealId, meal),
    addItemToMeal,
    updateItemInMeal,
  })

  return (
    <>
      <For each={props.dayDiet.meals}>
        {(meal) => {
          const targetDay = props.dayDiet.target_day
          return (
            <MealEditView
              class="mt-5"
              dayDiet={() => props.dayDiet}
              meal={() => meal}
              header={
                <MealEditViewHeader
                  onUpdateMeal={(meal) => {
                    handleUpdateMeal(dayEditUseCases, meal, props).catch(
                      (e: unknown) => {
                        logging.error('DayMeals meal update error:', e, {
                          component: 'DayMeals',
                          mealId: meal.id,
                          day: targetDay,
                        })
                        showError(e, {}, 'Erro ao atualizar refeição')
                      },
                    )
                  }}
                  mode={props.mode}
                />
              }
              content={
                <MealEditViewContent
                  onEditItem={(item) => {
                    handleEditItem(dayEditUseCases, meal, item, props)
                  }}
                  onUpdateMeal={(meal) =>
                    void handleUpdateMeal(dayEditUseCases, meal, props)
                  }
                  mode={props.mode}
                />
              }
              actions={
                props.mode === 'summary' ? undefined : (
                  <MealEditViewActions
                    onNewItem={() => {
                      handleNewItemButton(dayEditUseCases, meal, props)
                    }}
                  />
                )
              }
            />
          )
        }}
      </For>

      {props.mode !== 'summary' && (
        <>
          <CopyLastDayButton
            dayDiet={() => props.dayDiet}
            selectedDay={props.selectedDay}
          />
          <DeleteDayButton day={() => props.dayDiet} />
        </>
      )}
    </>
  )
}
