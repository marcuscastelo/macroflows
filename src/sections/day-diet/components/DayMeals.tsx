import { For } from 'solid-js'

import {
  createDayEditOrchestrator,
  type EditMode,
} from '~/modules/diet/day-diet/application/usecases/dayEditOrchestrator'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { updateMeal } from '~/modules/diet/meal/application/meal'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import {
  addItemToMeal,
  updateItemInMeal,
} from '~/modules/diet/meal/domain/mealOperations'
import { showError } from '~/modules/toast/application/toastManager'

// Create day edit orchestrator instance for this module
const dayUseCases = createDayEditOrchestrator({
  macroTargetAt: (d: Date) => macroTargetUseCases.macroTargetAt(d),
  updateMeal,
  addItemToMeal,
  updateItemInMeal,
})
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
  meal: Meal,
  item: Item,
  props: {
    dayDiet: DayDiet
    mode: EditMode
    onRequestEditMode?: () => void
  },
) => {
  const permission = dayUseCases.checkEditPermission(props.mode)

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

  const macroOverflow = dayUseCases.prepareMacroOverflowConfig(
    props.dayDiet,
    item,
  )
  logging.debug('macroOverflow:', macroOverflow)

  openItemEditModal({
    targetMealName: meal.name,
    item: () => item,
    macroOverflow: () => macroOverflow,
    onApply: (updatedItem) => {
      dayUseCases
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
  meal: Meal,
  props: {
    mode: EditMode
    onRequestEditMode?: () => void
  },
) => {
  const permission = dayUseCases.checkEditPermission(props.mode)

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

  await dayUseCases.updateMealOrchestrated(meal)
}

const handleNewItem = (
  meal: Meal,
  newItem: Item,
  props: {
    mode: EditMode
    onRequestEditMode?: () => void
  },
) => {
  const permission = dayUseCases.checkEditPermission(props.mode)

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

  dayUseCases.addItemToMealOrchestrated(meal, newItem).catch((e: unknown) => {
    logging.error('DayMeals item add error:', e, {
      component: 'DayMeals',
      mealId: meal.id,
    })
    showError(e, {}, 'Erro ao adicionar item')
  })
}

const handleNewItemButton = (
  meal: Meal,
  props: {
    mode: EditMode
    onRequestEditMode?: () => void
  },
) => {
  const permission = dayUseCases.checkEditPermission(props.mode)

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
    onNewItem: (newItem) => handleNewItem(meal, newItem, props),
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
                    handleUpdateMeal(meal, props).catch((e: unknown) => {
                      logging.error('DayMeals meal update error:', e, {
                        component: 'DayMeals',
                        mealId: meal.id,
                        day: targetDay,
                      })
                      showError(e, {}, 'Erro ao atualizar refeição')
                    })
                  }}
                  mode={props.mode}
                />
              }
              content={
                <MealEditViewContent
                  onEditItem={(item) => {
                    handleEditItem(meal, item, props)
                  }}
                  onUpdateMeal={(meal) => void handleUpdateMeal(meal, props)}
                  mode={props.mode}
                />
              }
              actions={
                props.mode === 'summary' ? undefined : (
                  <MealEditViewActions
                    onNewItem={() => {
                      handleNewItemButton(meal, props)
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
