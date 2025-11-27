// TODO: Unify Recipe and Recipe components into a single component?

import { type Accessor, type JSXElement, type Setter } from 'solid-js'

import { clipboardUseCases } from '~/modules/clipboard/application/usecases/clipboardUseCases'
import {
  type ClipboardPayload,
  clipboardPayloadSchema,
} from '~/modules/clipboard/domain/clipboardEntry'
import { ClipboardPayloadExt } from '~/modules/clipboard/domain/clipboardPayloadExt'
import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { RecipeExt } from '~/modules/diet/recipe/domain/recipeExt'
import {
  addItemsToRecipe,
  clearRecipeItems,
  removeItemFromRecipe,
  updateRecipeName,
  updateRecipePreparedMultiplier,
} from '~/modules/diet/recipe/domain/recipeOperations'
import { type TemplateItem } from '~/modules/diet/template-item/domain/templateItem'
import { ClipboardActionButtons } from '~/sections/common/components/ClipboardActionButtons'
import { FloatInput } from '~/sections/common/components/FloatInput'
import { PreparedQuantity } from '~/sections/common/components/PreparedQuantity'
import { useFloatField } from '~/sections/common/hooks/useField'
import { ItemListView } from '~/sections/item/components/ItemListView'
import { useRecipeEditContext } from '~/sections/recipe/context/RecipeEditContext'
import { openClearItemsConfirmModal } from '~/shared/modal/ui/ClearItemsConfirmModal'

export type RecipeEditViewProps = {
  recipe: Accessor<Recipe>
  setRecipe: Setter<Recipe>
  onSaveRecipe: (recipe: Recipe) => void
  header?: JSXElement
  content?: JSXElement
  footer?: JSXElement
  className?: string
}

// TODO: Reenable drag and drop
// a little function to help us with reordering the result
// const reorder = (list: unknown[], startIndex: number, endIndex: number) => {
//   const result = Array.from(list)
//   const [removed] = result.splice(startIndex, 1)
//   result.splice(endIndex, 0, removed)

//   return result
// }

export function RecipeEditHeader(props: {
  onUpdateRecipe: (Recipe: Recipe) => void
}) {
  const { recipe } = useRecipeEditContext()

  const onPaste = (data: ClipboardPayload) => {
    const itemsToAdd = ClipboardPayloadExt.extractItems(data)
    const newRecipe = addItemsToRecipe(recipe(), itemsToAdd)
    props.onUpdateRecipe(newRecipe)
  }

  const recipeCalories = RecipeExt.of(recipe()).macros().calories()

  const onClearItems = (e: MouseEvent) => {
    e.preventDefault()
    openClearItemsConfirmModal({
      context: 'os itens',
      onConfirm: () => {
        const newRecipe = clearRecipeItems(recipe())
        props.onUpdateRecipe(newRecipe)
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
        <h5 class="text-3xl text-blue-500">{recipe().name}</h5>
        <p class="italic text-gray-400">{recipeCalories.toFixed(0)}kcal</p>
      </div>
      <ClipboardActionButtons
        canCopy={recipe().items.length > 0}
        canPaste={true}
        canClear={recipe().items.length > 0}
        onCopy={() => clipboardUseCases.copy(recipe())}
        onPaste={() =>
          clipboardUseCases.confirmPaste(clipboardPayloadSchema, onPaste)
        }
        onClear={onClearItems}
      />
    </div>
  )
}

export function RecipeEditContent(props: {
  onEditItem: (item: TemplateItem) => void
  onNewItem: () => void
}) {
  const { recipe, setRecipe } = useRecipeEditContext()

  return (
    <>
      <input
        class="input w-full"
        type="text"
        onChange={(e) => {
          setRecipe(updateRecipeName(recipe(), e.target.value))
        }}
        onFocus={(e) => {
          e.target.select()
        }}
        value={recipe().name}
      />
      <ItemListView
        items={() => [...recipe().items]}
        mode="edit"
        handlers={{
          onEdit: (Item: Item) => {
            props.onEditItem(Item)
          },
          onCopy: (Item: Item) => {
            clipboardUseCases.copy(Item)
          },
          onDelete: (item: Item) => {
            setRecipe(removeItemFromRecipe(recipe(), item.id))
          },
        }}
      />
      <AddNewItemButton onClick={props.onNewItem} />
      <div class="flex justify-between gap-2 mt-2">
        <div class="flex flex-col">
          <RawQuantity />
          <div class="text-gray-400 ml-1">Peso (cru)</div>
        </div>
        <div class="flex flex-col">
          <PreparedQuantity
            rawQuantity={recipe().items.reduce(
              (acc, item) => acc + item.quantity,
              0,
            )}
            preparedMultiplier={recipe().prepared_multiplier}
            onPreparedQuantityChange={({ newMultiplier }) => {
              const newRecipe = updateRecipePreparedMultiplier(
                recipe(),
                newMultiplier(),
              )

              setRecipe(newRecipe)
            }}
          />
          <div class="text-gray-400 ml-1">Peso (pronto)</div>
        </div>
        <div class="flex flex-col">
          <PreparedMultiplier />
          <div class="text-gray-400 ml-1">Mult.</div>
        </div>
      </div>
    </>
  )
}

function AddNewItemButton(props: { onClick: () => void }) {
  return (
    <button
      class="mt-3 min-w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      onClick={() => {
        props.onClick()
      }}
    >
      Adicionar item
    </button>
  )
}

function RawQuantity() {
  const { recipe } = useRecipeEditContext()

  const rawQuantity = () =>
    recipe().items.reduce((acc, item) => {
      return acc + item.quantity
    }, 0)

  const rawQuantityField = useFloatField(rawQuantity, {
    decimalPlaces: 0,
  })

  return (
    <div class="flex gap-2">
      <FloatInput
        field={rawQuantityField}
        disabled
        class="input px-0 pl-5 text-md"
        style={{ width: '100%' }}
      />
    </div>
  )
}

function PreparedMultiplier() {
  const { recipe, setRecipe } = useRecipeEditContext()

  const preparedMultiplier = () => recipe().prepared_multiplier

  const preparedMultiplierField = useFloatField(preparedMultiplier, {
    decimalPlaces: 2,
  })

  return (
    <div class="flex gap-2">
      <FloatInput
        field={preparedMultiplierField}
        commitOn="change"
        class="input px-0 pl-5 text-md"
        onFocus={(event) => {
          event.target.select()
        }}
        onFieldCommit={(newMultiplier) => {
          const newRecipe = updateRecipePreparedMultiplier(
            recipe(),
            newMultiplier ?? 1,
          )

          setRecipe(newRecipe)
        }}
        style={{ width: '100%' }}
      />
    </div>
  )
}
