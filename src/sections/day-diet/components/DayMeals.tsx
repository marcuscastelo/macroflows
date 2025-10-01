import { For } from 'solid-js'

import {
  createDayEditOrchestrator,
  type EditMode,
} from '~/modules/diet/day-diet/application/usecases/dayEditOrchestrator'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { showError } from '~/modules/toast/application/toastManager'
import { CopyLastDayButton } from '~/sections/day-diet/components/CopyLastDayButton'
import { DeleteDayButton } from '~/sections/day-diet/components/DeleteDayButton'
import {
  MealEditView,
  MealEditViewActions,
  MealEditViewContent,
  MealEditViewHeader,
} from '~/sections/meal/components/MealEditView'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import {
  openTemplateSearchModal,
  openUnifiedItemEditModal,
} from '~/shared/modal/helpers/specializedModalHelpers'
import { logging } from '~/shared/utils/logging'

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
  const orchestrator = createDayEditOrchestrator()
  const handleEditUnifiedItem = (meal: Meal, item: UnifiedItem) => {
    const permission = orchestrator.checkEditPermission(props.mode)

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

    const macroOverflow = orchestrator.prepareMacroOverflowConfig(
      props.dayDiet,
      item,
    )
    logging.debug('macroOverflow:', macroOverflow)

    openUnifiedItemEditModal({
      targetMealName: meal.name,
      item: () => item,
      macroOverflow: () => macroOverflow,
      onApply: (updatedItem) => {
        orchestrator
          .updateItemInMealOrchestrated(meal, item, updatedItem)
          .catch((e) => {
            showError(e, {}, 'Erro ao atualizar item')
          })
      },
      targetName: meal.name,
      showAddItemButton: true,
    })
  }

  const handleUpdateMeal = async (meal: Meal) => {
    const permission = orchestrator.checkEditPermission(props.mode)

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

    await orchestrator.updateMealOrchestrated(meal)
  }

  const handleNewItemButton = (meal: Meal) => {
    const permission = orchestrator.checkEditPermission(props.mode)

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
      onNewUnifiedItem: (newItem) => handleNewUnifiedItem(meal, newItem),
    })
  }

  const handleNewUnifiedItem = (meal: Meal, newItem: UnifiedItem) => {
    const permission = orchestrator.checkEditPermission(props.mode)

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

    orchestrator.addItemToMealOrchestrated(meal, newItem).catch((e) => {
      showError(e, {}, 'Erro ao adicionar item')
    })
  }

  return (
    <>
      <For each={props.dayDiet.meals}>
        {(meal) => (
          <MealEditView
            class="mt-5"
            dayDiet={() => props.dayDiet}
            meal={() => meal}
            header={
              <MealEditViewHeader
                onUpdateMeal={(meal) => {
                  handleUpdateMeal(meal).catch((e) => {
                    showError(e, {}, 'Erro ao atualizar refeição')
                  })
                }}
                mode={props.mode}
              />
            }
            content={
              <MealEditViewContent
                onEditItem={(item) => {
                  handleEditUnifiedItem(meal, item)
                }}
                onUpdateMeal={(meal) => void handleUpdateMeal(meal)}
                mode={props.mode}
              />
            }
            actions={
              props.mode === 'summary' ? undefined : (
                <MealEditViewActions
                  onNewItem={() => {
                    handleNewItemButton(meal)
                  }}
                />
              )
            }
          />
        )}
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
