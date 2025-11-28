import {
  type DayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import {
  createNewFood,
  type Food,
  promoteNewFoodToFood,
} from '~/modules/diet/food/domain/food'
import {
  createFoodItem,
  createGroupItem,
  type FoodItem,
  type GroupItem,
  type Item,
} from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  type MacroProfile,
  promoteToMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import {
  createNewMeal,
  type Meal,
  promoteMeal,
} from '~/modules/diet/meal/domain/meal'
import { type User, userSchema } from '~/modules/user/domain/user'
import {
  promoteToWeight,
  type Weight,
} from '~/modules/weight/domain/weight/weight'
import {
  GUEST_DB_STORAGE_KEY,
  GUEST_USER_ID,
  GUEST_USER_NAME,
} from '~/shared/guest/guestConstants'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

/**
 * In-memory database structure for guest mode
 */
export type GuestDatabase = {
  user: User
  foods: Food[]
  dayDiets: DayDiet[]
  weights: Weight[]
  macroProfiles: MacroProfile[]
}

// In-memory store
let guestDb: GuestDatabase | null = null

// ID generators for demo data
let nextFoodId = 1
let nextItemId = 1000
let nextMealId = 2000
let nextDayId = 3000
let nextWeightId = 4000
let nextMacroProfileId = 5000

function generateFoodId(): number {
  return nextFoodId++
}

function generateItemId(): number {
  return nextItemId++
}

function generateMealId(): number {
  return nextMealId++
}

function generateDayId(): number {
  return nextDayId++
}

function generateWeightId(): number {
  return nextWeightId++
}

function generateMacroProfileId(): number {
  return nextMacroProfileId++
}

/**
 * Creates seeded demo foods
 */
function createDemoFoods(): Food[] {
  const foods: Food[] = [
    promoteNewFoodToFood(
      createNewFood({
        name: 'Arroz branco cozido',
        ean: null,
        macros: createMacroNutrients({ carbs: 28, protein: 2.5, fat: 0.3 }),
      }),
      { id: generateFoodId() },
    ),
    promoteNewFoodToFood(
      createNewFood({
        name: 'Feijão preto cozido',
        ean: null,
        macros: createMacroNutrients({ carbs: 14, protein: 4.5, fat: 0.5 }),
      }),
      { id: generateFoodId() },
    ),
    promoteNewFoodToFood(
      createNewFood({
        name: 'Frango grelhado (peito)',
        ean: null,
        macros: createMacroNutrients({ carbs: 0, protein: 31, fat: 3.6 }),
      }),
      { id: generateFoodId() },
    ),
    promoteNewFoodToFood(
      createNewFood({
        name: 'Ovo cozido',
        ean: null,
        macros: createMacroNutrients({ carbs: 0.6, protein: 6, fat: 5 }),
      }),
      { id: generateFoodId() },
    ),
    promoteNewFoodToFood(
      createNewFood({
        name: 'Banana prata',
        ean: null,
        macros: createMacroNutrients({ carbs: 22, protein: 1.3, fat: 0.1 }),
      }),
      { id: generateFoodId() },
    ),
    promoteNewFoodToFood(
      createNewFood({
        name: 'Aveia em flocos',
        ean: null,
        macros: createMacroNutrients({ carbs: 66, protein: 14, fat: 8 }),
      }),
      { id: generateFoodId() },
    ),
    promoteNewFoodToFood(
      createNewFood({
        name: 'Leite integral',
        ean: null,
        macros: createMacroNutrients({ carbs: 4.8, protein: 3.2, fat: 3 }),
      }),
      { id: generateFoodId() },
    ),
    promoteNewFoodToFood(
      createNewFood({
        name: 'Pão integral',
        ean: null,
        macros: createMacroNutrients({ carbs: 41, protein: 13, fat: 4 }),
      }),
      { id: generateFoodId() },
    ),
    promoteNewFoodToFood(
      createNewFood({
        name: 'Batata doce cozida',
        ean: null,
        macros: createMacroNutrients({ carbs: 20, protein: 1.6, fat: 0.1 }),
      }),
      { id: generateFoodId() },
    ),
    promoteNewFoodToFood(
      createNewFood({
        name: 'Whey Protein (dose)',
        ean: null,
        macros: createMacroNutrients({ carbs: 3, protein: 24, fat: 1.5 }),
      }),
      { id: generateFoodId() },
    ),
  ]
  return foods
}

/**
 * Creates a food item from a food
 */
function createFoodItemFromFood(food: Food, quantity: number): FoodItem {
  return createFoodItem({
    id: generateItemId(),
    name: food.name,
    quantity,
    reference: {
      type: 'food',
      id: food.id,
      macros: food.macros,
    },
  })
}

/**
 * Creates a demo day diet with sample meals
 */
function createDemoDayDiet(targetDay: string, foods: Food[]): DayDiet {
  const meals: Meal[] = []

  // Café da manhã
  const breakfastItems: Item[] = [
    createFoodItemFromFood(foods[5]!, 40), // Aveia
    createFoodItemFromFood(foods[6]!, 200), // Leite
    createFoodItemFromFood(foods[4]!, 120), // Banana
  ]
  meals.push(
    promoteMeal(
      createNewMeal({ name: 'Café da manhã', items: breakfastItems }),
      { id: generateMealId() },
    ),
  )

  // Almoço
  const lunchItems: Item[] = [
    createFoodItemFromFood(foods[0]!, 150), // Arroz
    createFoodItemFromFood(foods[1]!, 100), // Feijão
    createFoodItemFromFood(foods[2]!, 150), // Frango
  ]
  // Add a group for the main dish
  const mainDishGroup: GroupItem = createGroupItem({
    id: generateItemId(),
    name: 'Prato principal',
    quantity: 1,
    reference: {
      type: 'group',
      children: lunchItems,
    },
  })
  meals.push(
    promoteMeal(createNewMeal({ name: 'Almoço', items: [mainDishGroup] }), {
      id: generateMealId(),
    }),
  )

  // Lanche
  const snackItems: Item[] = [
    createFoodItemFromFood(foods[7]!, 60), // Pão integral
    createFoodItemFromFood(foods[3]!, 100), // Ovo
  ]
  meals.push(
    promoteMeal(createNewMeal({ name: 'Lanche', items: snackItems }), {
      id: generateMealId(),
    }),
  )

  // Janta
  const dinnerItems: Item[] = [
    createFoodItemFromFood(foods[8]!, 200), // Batata doce
    createFoodItemFromFood(foods[2]!, 120), // Frango
  ]
  meals.push(
    promoteMeal(createNewMeal({ name: 'Janta', items: dinnerItems }), {
      id: generateMealId(),
    }),
  )

  // Pós janta
  const postDinnerItems: Item[] = [createFoodItemFromFood(foods[9]!, 30)] // Whey
  meals.push(
    promoteMeal(createNewMeal({ name: 'Pós janta', items: postDinnerItems }), {
      id: generateMealId(),
    }),
  )

  return promoteDayDiet(
    {
      target_day: targetDay,
      user_id: GUEST_USER_ID,
      meals,
      __type: 'NewDayDiet',
    },
    { id: generateDayId() },
  )
}

/**
 * Creates demo weight entries for the past week
 */
function createDemoWeights(): Weight[] {
  const weights: Weight[] = []
  const today = new Date()

  // Create weight entries for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    // Simulate gradual weight loss from 78 to 77
    const weight = 78 - (6 - i) * 0.15 + Math.random() * 0.2 - 0.1

    weights.push(
      promoteToWeight(
        {
          user_id: GUEST_USER_ID,
          weight: Math.round(weight * 10) / 10,
          target_timestamp: date,
          __type: 'NewWeight',
        },
        { id: generateWeightId() },
      ),
    )
  }

  return weights
}

/**
 * Creates a demo macro profile
 */
function createDemoMacroProfile(): MacroProfile {
  return promoteToMacroProfile(
    {
      user_id: GUEST_USER_ID,
      target_day: new Date(
        Date.now() -
          7 * 24 * 60 * 60 * 1000 +
          nextMacroProfileId * 24 * 60 * 60 * 1000,
      ),
      gramsPerKgCarbs: nextMacroProfileId,
      gramsPerKgProtein: 2,
      gramsPerKgFat: 0.8,
      __type: 'NewMacroProfile',
    },
    { id: generateMacroProfileId() },
  )
}

/**
 * Creates the demo user
 */
function createDemoUser(): User {
  return parseWithStack(userSchema, {
    id: 1,
    uuid: GUEST_USER_ID,
    name: GUEST_USER_NAME,
    favorite_foods: [],
    diet: 'cut',
    birthdate: '1990-01-01',
    gender: 'male',
    desired_weight: 75,
  })
}

/**
 * Creates the initial seeded demo database
 */
function createSeededDatabase(): GuestDatabase {
  const foods = createDemoFoods()
  const today = new Date().toISOString().split('T')[0]!

  return {
    user: createDemoUser(),
    foods,
    dayDiets: [createDemoDayDiet(today, foods)],
    weights: createDemoWeights(),
    macroProfiles: [createDemoMacroProfile(), createDemoMacroProfile()],
  }
}

/**
 * Loads the guest database from localStorage or creates a new seeded one
 */
export function loadGuestDatabase(): GuestDatabase {
  if (guestDb !== null) {
    return guestDb
  }

  // Try to load from localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(GUEST_DB_STORAGE_KEY)
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored)
        // Validate basic structure
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'user' in parsed &&
          'foods' in parsed &&
          'dayDiets' in parsed &&
          'weights' in parsed &&
          'macroProfiles' in parsed &&
          Array.isArray(parsed.foods) &&
          Array.isArray(parsed.dayDiets) &&
          Array.isArray(parsed.weights) &&
          Array.isArray(parsed.macroProfiles)
        ) {
          // Type narrowing was done above, but we need to cast for TypeScript
          // The data has been validated to have the correct structure
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const typedParsed = parsed as GuestDatabase
          // Restore date objects for weights and macro profiles
          typedParsed.weights = typedParsed.weights.map((w) => ({
            ...w,
            target_timestamp: new Date(w.target_timestamp),
          }))
          typedParsed.macroProfiles = typedParsed.macroProfiles.map((mp) => ({
            ...mp,
            target_day: new Date(mp.target_day),
          }))

          guestDb = typedParsed
          logging.debug('Loaded guest database from localStorage')
          return guestDb
        }
      }
    } catch (error) {
      logging.warn(
        'Failed to load guest database from localStorage, creating new one',
        {
          error,
        },
      )
    }
  }

  // Create a new seeded database
  guestDb = createSeededDatabase()
  saveGuestDatabase()
  logging.debug('Created new seeded guest database')
  return guestDb
}

/**
 * Saves the guest database to localStorage
 */
export function saveGuestDatabase(): void {
  if (guestDb === null || typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(GUEST_DB_STORAGE_KEY, JSON.stringify(guestDb))
    logging.debug('Saved guest database to localStorage')
  } catch (error) {
    logging.error('Failed to save guest database to localStorage', { error })
  }
}

/**
 * Gets the current guest database
 */
export function getGuestDatabase(): GuestDatabase {
  if (guestDb === null) {
    return loadGuestDatabase()
  }
  return guestDb
}

/**
 * Resets the guest database to initial seeded state
 */
export function resetGuestDatabase(): void {
  // Reset ID counters
  nextFoodId = 1
  nextItemId = 1000
  nextMealId = 2000
  nextDayId = 3000
  nextWeightId = 4000
  nextMacroProfileId = 5000

  guestDb = createSeededDatabase()
  saveGuestDatabase()
  logging.info('Guest database reset to initial seeded state')
}

/**
 * Clears the guest database from memory and localStorage
 */
export function clearGuestDatabase(): void {
  guestDb = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_DB_STORAGE_KEY)
  }
  logging.info('Guest database cleared')
}

/**
 * Updates the guest database with new data and saves to localStorage
 */
export function updateGuestDatabase(
  updater: (db: GuestDatabase) => GuestDatabase,
): void {
  const db = getGuestDatabase()
  guestDb = updater(db)
  saveGuestDatabase()
}
