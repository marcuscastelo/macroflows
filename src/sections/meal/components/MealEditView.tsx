import { type Accessor, createEffect, type JSXElement, Show } from 'solid-js'
import { z } from 'zod/v4'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
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
import { createDebug } from '~/shared/utils/createDebug'
import { calcMealCalories } from '~/shared/utils/macroMath'

const debug = createDebug()

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

// TODO:   move this function
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

  const { handleCopy, handlePaste, hasValidPastableOnClipboard } =
    useCopyPasteActions({
      acceptedClipboardSchema,
      getDataToCopy: () => meal(),
      onPaste: (data) => {
        // Check if data is already UnifiedItem(s) and handle directly
        if (Array.isArray(data)) {
          const firstItem = data[0]
          if (firstItem && '__type' in firstItem) {
            // Handle array of UnifiedItems - type is already validated by schema
            const unifiedItemsToAdd = data.map((item) => ({
              ...item,
              id: Math.round(Math.random() * 1000000),
            }))

            // Update the meal with all items at once
            const updatedMeal = addItemsToMeal(meal(), unifiedItemsToAdd)
            props.onUpdateMeal(updatedMeal)
            return
          }
        }

        if (
          typeof data === 'object' &&
          '__type' in data &&
          data.__type === 'Meal'
        ) {
          // Handle pasted Meal - extract its items and add them to current meal
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const mealData = data as Meal
          debug('Pasting meal with items:', mealData.items.length)
          const unifiedItemsToAdd = mealData.items.map((item) => ({
            ...item,
            id: Math.round(Math.random() * 1000000),
          }))
          debug(
            'Items to add:',
            unifiedItemsToAdd.map((item) => ({ id: item.id, name: item.name })),
          )

          // Update the meal with all items at once
          const updatedMeal = addItemsToMeal(meal(), unifiedItemsToAdd)
          props.onUpdateMeal(updatedMeal)
          return
        }

        if (
          typeof data === 'object' &&
          '__type' in data &&
          data.__type === 'UnifiedItem'
        ) {
          // Handle single UnifiedItem - type is already validated by schema
          const regeneratedItem = {
            ...data,
            id: Math.round(Math.random() * 1000000),
          }

          // Update the meal with the single item
          const updatedMeal = addItemsToMeal(meal(), [regeneratedItem])
          props.onUpdateMeal(updatedMeal)
          return
        }

        // Handle other types supported by schema (recipes, etc.)
        // Since schema validation passed, this should be a recipe
        // For now, we'll skip unsupported formats in paste
        // TODO: Add proper recipe-to-items conversion if needed
        console.warn('Unsupported paste format:', data)
      },
    })

  const mealCalories = () => calcMealCalories(meal())

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
        <div class="flex">
          <div class="my-2">
            <h5 class="text-3xl">{mealSignal().name}</h5>
            <p class="italic text-gray-400">{mealCalories().toFixed(0)}kcal</p>
          </div>
          {props.mode !== 'summary' && (
            <ClipboardActionButtons
              canCopy={
                !hasValidPastableOnClipboard() && mealSignal().items.length > 0
              }
              canPaste={hasValidPastableOnClipboard()}
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

  debug('meal.value:', meal())

  createEffect(() => {
    debug('meal.value changed:', meal())
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
