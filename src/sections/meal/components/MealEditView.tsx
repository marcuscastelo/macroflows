import { type Accessor, createEffect, type JSXElement } from 'solid-js'

import { clipboardUseCases } from '~/modules/clipboard/application/usecases/clipboardUseCases'
import {
  type ClipboardPayload,
  clipboardPayloadSchema,
} from '~/modules/clipboard/domain/clipboardEntry'
import { ClipboardPayloadExt } from '~/modules/clipboard/domain/clipboardPayloadExt'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { MealExt } from '~/modules/diet/meal/domain/mealExt'
import {
  addItemsToMeal,
  clearMealItems,
  removeItemFromMeal,
} from '~/modules/diet/meal/domain/mealOperations'
import { ClipboardActionButtons } from '~/sections/common/components/ClipboardActionButtons'
import { ItemListView } from '~/sections/item/components/ItemListView'
import {
  MealContextProvider,
  useMealContext,
} from '~/sections/meal/context/MealContext'
import { openClearItemsConfirmModal } from '~/shared/modal/ui/ClearItemsConfirmModal'
import { openDeleteConfirmModal } from '~/shared/modal/ui/DeleteConfirmModal'
import { logging } from '~/shared/utils/logging'

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

  const onPaste = (data: ClipboardPayload) => {
    const itemsToAdd = ClipboardPayloadExt.extractItems(data)
    const updatedMeal = addItemsToMeal(meal(), itemsToAdd)
    props.onUpdateMeal(updatedMeal)
  }

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
    <div
      class="flex"
      tabindex={0}
      onPaste={() =>
        clipboardUseCases.confirmPaste(clipboardPayloadSchema, onPaste)
      }
    >
      <div class="my-2">
        <h5 class="text-3xl">{meal().name}</h5>
        <p class="italic text-gray-400">{mealCalories().toFixed(0)}kcal</p>
      </div>
      {props.mode !== 'summary' && (
        <ClipboardActionButtons
          canCopy={meal().items.length > 0}
          canPaste={true}
          canClear={meal().items.length > 0}
          onCopy={() => clipboardUseCases.copy(meal())}
          onPaste={() =>
            clipboardUseCases.confirmPaste(clipboardPayloadSchema, onPaste)
          }
          onClear={onClearItems}
        />
      )}
    </div>
  )
}

export function MealEditViewContent(props: {
  onEditItem: (item: Item) => void
  onUpdateMeal: (meal: Meal) => void
  mode?: 'edit' | 'read-only' | 'summary'
}) {
  const { meal } = useMealContext()

  logging.debug('meal.value:', meal())

  createEffect(() => {
    logging.debug('meal.value changed:', meal())
  })

  return (
    <ItemListView
      items={() => meal().items}
      handlers={{
        onEdit: props.onEditItem,
        onCopy: (item) => {
          clipboardUseCases.copy(item)
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
