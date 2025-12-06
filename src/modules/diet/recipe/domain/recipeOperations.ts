import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'

export function updateRecipeName(recipe: Recipe, name: string): Recipe {
  return {
    ...recipe,
    name,
  }
}

export function updateRecipePreparedMultiplier(
  recipe: Recipe,
  preparedMultiplier: number,
): Recipe {
  if (preparedMultiplier <= 0 || !Number.isFinite(preparedMultiplier)) {
    throw new Error('Prepared multiplier must be a positive number')
  }

  return {
    ...recipe,
    prepared_multiplier: preparedMultiplier,
  }
}

export function addItemToRecipe(recipe: Recipe, item: Item): Recipe {
  return {
    ...recipe,
    items: [...recipe.items, item],
  }
}

export function addItemsToRecipe(
  recipe: Recipe,
  items: readonly Item[],
): Recipe {
  return {
    ...recipe,
    items: [...recipe.items, ...items],
  }
}

export function updateItemInRecipe(
  recipe: Recipe,
  itemId: Item['id'],
  updatedItem: Item,
): Recipe {
  return {
    ...recipe,
    items: recipe.items.map((item) =>
      item.id === itemId ? updatedItem : item,
    ),
  }
}

export function removeItemFromRecipe(
  recipe: Recipe,
  itemId: Item['id'],
): Recipe {
  return {
    ...recipe,
    items: recipe.items.filter((item) => item.id !== itemId),
  }
}

export function clearRecipeItems(recipe: Recipe): Recipe {
  return {
    ...recipe,
    items: [],
  }
}

/**
 * Calculates the total raw quantity of a recipe by summing all item quantities.
 * This represents the total weight of ingredients before preparation.
 *
 * @param recipe - The recipe to calculate raw quantity for
 * @returns The total raw quantity in grams
 */
export function getRecipeRawQuantity(recipe: Recipe): number {
  return recipe.items.reduce((total, item) => total + item.quantity, 0)
}

/**
 * Calculates the prepared quantity of a recipe using the prepared multiplier.
 * This represents the total weight after preparation (cooking, processing, etc.).
 *
 * @param recipe - The recipe to calculate prepared quantity for
 * @returns The total prepared quantity in grams
 */
export function getRecipePreparedQuantity(recipe: Recipe): number {
  const rawQuantity = getRecipeRawQuantity(recipe)
  return rawQuantity * recipe.prepared_multiplier
}

/**
 * Scales a recipe's items based on a desired prepared quantity.
 * This function calculates how much of the recipe is needed to achieve
 * the desired prepared weight and scales all ingredients accordingly.
 *
 * @param recipe - The recipe to scale
 * @param desiredPreparedQuantity - The desired prepared quantity in grams
 * @returns Object containing scaled items and the scaling factor used
 */
// TODO: investigate duplicate function in recipeOperations.ts with RecipeItemExt.scaleQuantityAndChildren
// Issue URL: https://github.com/marcuscastelo/macroflows/issues/1388
export function scaleRecipeByPreparedQuantity(
  recipe: Recipe,
  desiredPreparedQuantity: number,
): { scaledItems: Item[]; scalingFactor: number } {
  const preparedQuantity = getRecipePreparedQuantity(recipe)

  if (preparedQuantity <= 0) {
    throw new Error('Recipe prepared quantity must be greater than 0')
  }

  if (desiredPreparedQuantity < 0) {
    throw new Error('Desired prepared quantity must be non-negative')
  }

  const scalingFactor = desiredPreparedQuantity / preparedQuantity

  const scaledItems = recipe.items.map(
    (item): Item => ({
      ...item,
      quantity: item.quantity * scalingFactor,
    }),
  )

  return {
    scaledItems,
    scalingFactor,
  }
}

/**
 * Creates a scaled version of a recipe with a specific prepared quantity.
 * This is useful when you want to create a portion of a recipe.
 *
 * @param recipe - The original recipe
 * @param desiredPreparedQuantity - The desired prepared quantity in grams
 * @returns A new recipe with scaled items and updated prepared multiplier
 */
export function createScaledRecipe(
  recipe: Recipe,
  desiredPreparedQuantity: number,
): Recipe {
  const { scaledItems } = scaleRecipeByPreparedQuantity(
    recipe,
    desiredPreparedQuantity,
  )

  return {
    ...recipe,
    items: scaledItems,
    // The prepared multiplier remains the same since it's a ratio
    // The new raw quantity will be scaled, but the multiplier stays constant
  }
}

/**
 * Checks if a recipe is a single-item conversion recipe.
 * A single-item conversion recipe has exactly one ingredient and uses the multiplier
 * to represent a conversion ratio (e.g., cooked vs raw weight).
 *
 * @param recipe - The recipe to check
 * @returns True if the recipe has exactly one item
 */
export function isSingleItemRecipe(recipe: Recipe): boolean {
  return recipe.items.length === 1
}

/**
 * Validates that a prepared multiplier is valid (positive and non-zero).
 *
 * @param multiplier - The multiplier value to validate
 * @returns True if the multiplier is valid
 */
export function isValidPreparedMultiplier(multiplier: number): boolean {
  return multiplier > 0 && Number.isFinite(multiplier)
}

/**
 * Gets the conversion description for a single-item recipe.
 * Example: "1 cooked pasta = 2.22 raw pasta"
 *
 * @param recipe - The single-item recipe
 * @returns A human-readable conversion description, or null if not a single-item recipe
 */
export function getSingleItemConversionDescription(
  recipe: Recipe,
): string | null {
  if (!isSingleItemRecipe(recipe)) {
    return null
  }

  const item = recipe.items[0]
  if (!item) {
    return null
  }

  const multiplier = recipe.prepared_multiplier
  const multiplierDisplay =
    multiplier === 1
      ? '1'
      : multiplier.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

  return `1g ${recipe.name} = ${multiplierDisplay}g ${item.name}`
}
