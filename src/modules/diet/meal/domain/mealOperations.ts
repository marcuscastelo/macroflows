import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Item } from '~/modules/diet/unified-item/schema/itemSchema'

export function addItemToMeal(meal: Meal, item: Item): Meal {
  return {
    ...meal,
    items: [...meal.items, item],
  }
}

export function addItemsToMeal(meal: Meal, items: readonly Item[]): Meal {
  return {
    ...meal,
    items: [...meal.items, ...items],
  }
}

export function updateItemInMeal(
  meal: Meal,
  itemId: Item['id'],
  updatedItem: Item,
): Meal {
  return {
    ...meal,
    items: meal.items.map((item) => (item.id === itemId ? updatedItem : item)),
  }
}

export function removeItemFromMeal(meal: Meal, itemId: Item['id']): Meal {
  return {
    ...meal,
    items: meal.items.filter((item) => item.id !== itemId),
  }
}

export function setMealItems(meal: Meal, items: Item[]): Meal {
  return {
    ...meal,
    items,
  }
}

export function clearMealItems(meal: Meal): Meal {
  return {
    ...meal,
    items: [],
  }
}
