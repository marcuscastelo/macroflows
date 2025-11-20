import { type Accessor, createEffect, type JSXElement, Show } from 'solid-js'
import { z } from 'zod/v4'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { MealExt } from '~/modules/diet/meal/application/mealExt'
import { type Meal, mealSchema } from '~/modules/diet/meal/domain/meal'
import {
  addItemsToMeal,
  clearMealItems,
  removeItemFromMeal,
} from '~/modules/diet/meal/domain/mealOperations'
import { recipeSchema } from '~/modules/diet/recipe/domain/recipe'
import {
  type UnifiedItem,
  unifiedItemSchema,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { ClipboardActionButtons } from '~/sections/common/components/ClipboardActionButtons'
import { useClipboard } from '~/sections/common/hooks/useClipboard'
import { useCopyPasteActions } from '~/sections/common/hooks/useCopyPasteActions'
import {
  MealContextProvider,
  useMealContext,
} from '~/sections/meal/context/MealContext'
import { UnifiedItemListView } from '~/sections/unified-item/components/UnifiedItemListView'
import {
  openClearItemsConfirmModal,
  openDeleteConfirmModal,
} from '~/shared/modal/helpers/specializedModalHelpers'
import { regenerateId } from '~/shared/utils/idUtils'
import { logging } from '~/shared/utils/logging'
import { isMeal, isUnifiedItem } from '~/shared/utils/typeUtils'

// TODO: Remove deprecated props and their usages
export type MealEditViewProps = {
  dayDiet: Accessor<DayDiet>
  meal: Accessor<Meal>
  /**
   * @deprecated
   */
  header?:
    | JSXElement
    | ((props: { mode?: 'edit' | 'read-only' | 'summary' }) => JSXElement)
  content?:
    | JSXElement
    | ((props: { mode?: 'edit' | 'read-only' | 'summary' }) => JSXElement)
  /**
   * @deprecated
   */
  actions?:
    | JSXElement
    | ((props: { mode?: 'edit' | 'read-only' | 'summary' }) => JSXElement)
  class?: string
  mode?: 'edit' | 'read-only' | 'summary'
}

// TODO: move this function
// a little function to help us with reordering the result
// const reorder = (list: unknown[], startIndex: number, endIndex: number) => {
//   const result = Array.from(list)
//   const [removed] = result.splice(startIndex, 1)
//   result.splice(endIndex, 0, removed)

//   return result.
// }

export function MealEditView(props: MealEditViewProps) {
  return (
    <MealContextProvider dayDiet={props.dayDiet} meal={props.meal}>
      <div class={`bg-gray-800 p-3 ${props.class ?? ''}`}>
        {typeof props.header === 'function'
          ? props.header({ mode: props.mode })
          : props.header}
        {typeof props.content === 'function'
          ? props.content({ mode: props.mode })
          : props.content}
        {typeof props.actions === 'function'
          ? props.actions({ mode: props.mode })
          : props.actions}
      </div>
    </MealContextProvider>
  )
}

export function MealEditViewHeader(props: {
  onUpdateMeal: (meal: Meal) => void
  mode?: 'edit' | 'read-only' | 'summary'
}) {
  const { meal } = useMealContext()
  const acceptedClipboardSchema = mealSchema
    .or(recipeSchema)
    .or(unifiedItemSchema)
    .or(z.array(unifiedItemSchema))

  const { handleCopy, handlePaste } = useCopyPasteActions({
    acceptedClipboardSchema,
    getDataToCopy: () => meal(),
    onPaste: (data) => {
      if (Array.isArray(data)) {
        const firstItem = data[0]
        if (firstItem && isUnifiedItem(firstItem)) {
          const unifiedItemsToAdd = data.map((item) => ({
            ...item,
            id: regenerateId(item).id,
          }))
          const updatedMeal = addItemsToMeal(meal(), unifiedItemsToAdd)
          props.onUpdateMeal(updatedMeal)
          return
        }
      }

      if (isMeal(data)) {
        const unifiedItemsToAdd = data.items.map((item) => ({
          ...item,
          id: regenerateId(item).id,
        }))
        const updatedMeal = addItemsToMeal(meal(), unifiedItemsToAdd)
        props.onUpdateMeal(updatedMeal)
        return
      }

      if (isUnifiedItem(data)) {
        const regeneratedItem = {
          ...data,
          id: regenerateId(data).id,
        }
        const updatedMeal = addItemsToMeal(meal(), [regeneratedItem])
        props.onUpdateMeal(updatedMeal)
        return
      }

      logging.warn('Unsupported paste format:', { data })
    },
  })

  const mealCalories = () => MealExt.of(meal()).macros().calories()

  const onClearItems = (e: MouseEvent) => {
    e.preventDefault()
    openClearItemsConfirmModal({
      context: 'os itens',
      onConfirm: () => {
        const newMeal = clearMealItems(meal())
        props.onUpdateMeal(newMeal)
      },
    })
  }

  return (
    <Show when={meal()}>
      {(mealSignal) => (
        <div class="flex" tabindex={0} onPaste={(e) => handlePaste(e)}>
          <div class="my-2">
            <h5 class="text-3xl">{mealSignal().name}</h5>
            <p class="italic text-gray-400">{mealCalories().toFixed(0)}kcal</p>
          </div>
          {props.mode !== 'summary' && (
            <ClipboardActionButtons
              canCopy={mealSignal().items.length > 0}
              canPaste={true}
              canClear={mealSignal().items.length > 0}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onClear={onClearItems}
            />
          )}
        </div>
      )}
    </Show>
  )
}

export function MealEditViewContent(props: {
  onEditItem: (item: UnifiedItem) => void
  onUpdateMeal: (meal: Meal) => void
  mode?: 'edit' | 'read-only' | 'summary'
}) {
  const { meal } = useMealContext()
  const clipboard = useClipboard()

  logging.debug('meal.value:', meal())

  createEffect(() => {
    logging.debug('meal.value changed:', meal())
  })

  return (
    <UnifiedItemListView
      items={() => meal().items}
      handlers={{
        onEdit: props.onEditItem,
        onCopy: (item) => {
          clipboard.write(JSON.stringify(item))
        },
        onDelete: (item) => {
          openDeleteConfirmModal({
            itemName: item.name,
            itemType: 'item',
            onConfirm: () => {
              const updatedMeal = removeItemFromMeal(meal(), item.id)
              props.onUpdateMeal(updatedMeal)
            },
          })
        },
      }}
      mode={props.mode}
    />
  )
}

export function MealEditViewActions(props: { onNewItem: () => void }) {
  return (
    <button
      class="mt-3 cursor-pointer min-w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      onClick={() => {
        props.onNewItem()
      }}
    >
      Adicionar item
    </button>
  )
}
