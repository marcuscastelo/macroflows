import { type Accessor, type JSXElement, type Setter, untrack } from 'solid-js'

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
import { openClearItemsConfirmModal } from '~/shared/modal/helpers/specializedModalHelpers'

export type RecipeEditViewProps = {
  recipe: Accessor<Recipe>
  setRecipe: Setter<Recipe>
  onSaveRecipe: (recipe: Recipe) => void
  header?: JSXElement
  content?: JSXElement
  onNewItem: () => void
  onEditItem: (item: TemplateItem) => void
  onUpdateRecipe: (recipe: Recipe) => void
}

export function RecipeEditView(props: RecipeEditViewProps) {
  const recipe = untrack(() => props.recipe)
  const setRecipe = untrack(() => props.setRecipe)

  const onPaste = (data: ClipboardPayload) => {
    const itemsToAdd = ClipboardPayloadExt.extractItems(data)
    const newRecipe = addItemsToRecipe(recipe(), itemsToAdd)
    setRecipe(newRecipe)
  }

  const paste = () =>
    clipboardUseCases.confirmPaste(clipboardPayloadSchema, onPaste)

  const recipeCalories = RecipeExt.of(recipe()).macros().calories()

  const onClearItems = (e: MouseEvent) => {
    e.preventDefault()
    openClearItemsConfirmModal({
      context: 'todos os itens da receita',
      onConfirm: () => {
        setRecipe(clearRecipeItems(recipe()))
      },
    })
  }

  return (
    <div
      class="flex flex-col gap-2 w-full"
      tabindex={0}
      onPaste={() => paste()}
    >
      {props.header}
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
      <NameInput />
      <input
        name="recipe-name"
        type="text"
        class="input w-full text-lg font-medium text-center"
        placeholder="Nome da receita"
        onInput={(e) => {
          const newRecipe = updateRecipeName(recipe(), e.target.value)
          setRecipe(newRecipe)
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
          onDelete: (Item: Item) => {
            setRecipe(removeItemFromRecipe(recipe(), Item.id))
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
          <div class="input px-0 pl-5 text-md flex items-center justify-center">
            {recipeCalories.toFixed(0)} kcal
          </div>
          <div class="text-gray-400 ml-1">Calorias</div>
        </div>
      </div>
      <div class="flex justify-between gap-2">
        <div class="flex flex-col">
          <PreparedMultiplier />
          <div class="text-gray-400 ml-1">Multiplicador</div>
        </div>
      </div>
      {props.content}
    </div>
  )
}

function AddNewItemButton(props: { onClick: () => void }) {
  return (
    <button
      type="button"
      class="btn btn-outline w-full"
      onClick={() => props.onClick()}
    >
      Adicionar item
    </button>
  )
}

function NameInput() {
  const { recipe, setRecipe } = useRecipeEditContext()

  return (
    <input
      name="recipe-name"
      type="text"
      class="input w-full text-lg font-medium text-center"
      placeholder="Nome da receita"
      onInput={(e) => {
        const newRecipe = updateRecipeName(recipe(), e.target.value)
        setRecipe(newRecipe)
      }}
      onFocus={(e) => {
        e.target.select()
      }}
      value={recipe().name}
    />
  )
}

function RawQuantity() {
  const { recipe } = useRecipeEditContext()

  const rawQuantity = () =>
    recipe().items.reduce((acc, item) => acc + item.quantity, 0)

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
