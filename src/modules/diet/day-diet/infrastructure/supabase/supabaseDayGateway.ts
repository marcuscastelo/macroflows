import {
  type DayDiet,
  dayDietSchema,
  type NewDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { type DayGateway } from '~/modules/diet/day-diet/domain/dayDietGateway'
import {
  isFoodItem,
  type Item,
  itemSchema,
} from '~/modules/diet/item/schema/itemSchema'
import {
  createMacroNutrients,
  type MacroNutrients,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  createNewMeal,
  type Meal,
  promoteMeal,
} from '~/modules/diet/meal/domain/meal'
import { type User } from '~/modules/user/domain/user'
import { type Database, type Json } from '~/shared/supabase/database.types'
import { supabase } from '~/shared/supabase/supabase'
import { wrapErrorWithStack } from '~/shared/utils/errorUtils'
import { logging } from '~/shared/utils/logging'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const SUPABASE_TABLE_DAYS = 'days'

function macrosToDomain(macrosDTO: Json) {
  if (
    macrosDTO === null ||
    !(typeof macrosDTO === 'object') ||
    !('carbs' in macrosDTO) ||
    !('protein' in macrosDTO) ||
    !('fat' in macrosDTO) ||
    typeof macrosDTO.carbs !== 'number' ||
    typeof macrosDTO.protein !== 'number' ||
    typeof macrosDTO.fat !== 'number'
  ) {
    throw new Error(
      'macrosDTO is missing macros field: ' + JSON.stringify(macrosDTO),
    )
  }

  return createMacroNutrients({
    carbsInMg: macrosDTO.carbs * 1000,
    proteinInMg: macrosDTO.protein * 1000,
    fatInMg: macrosDTO.fat * 1000,
  })
}

function macrosToDTO(macroNutrients: MacroNutrients): Json {
  return {
    carbs: macroNutrients.carbsInMg / 1000,
    protein: macroNutrients.proteinInMg / 1000,
    fat: macroNutrients.fatInMg / 1000,
  }
}

function itemToDomain(itemDTO: Json): Item {
  if (
    itemDTO === null ||
    !(typeof itemDTO === 'object') ||
    !('id' in itemDTO) ||
    !('name' in itemDTO) ||
    !('quantity' in itemDTO) ||
    !('reference' in itemDTO) ||
    typeof itemDTO.id !== 'number' ||
    typeof itemDTO.name !== 'string' ||
    typeof itemDTO.quantity !== 'number' ||
    typeof itemDTO.reference !== 'object' ||
    itemDTO.reference === null ||
    Array.isArray(itemDTO.reference) ||
    !('type' in itemDTO.reference)
  ) {
    throw new Error(
      'Item DTO is missing required fields: ' + JSON.stringify(itemDTO),
    )
  }

  const referenceType = itemDTO.reference.type
  if (
    referenceType === 'food' &&
    (!('id' in itemDTO.reference) ||
      typeof itemDTO.reference.id !== 'number' ||
      !('macros' in itemDTO.reference) ||
      typeof itemDTO.reference.macros !== 'object' ||
      itemDTO.reference.macros === null)
  ) {
    throw new Error(
      'Food Item DTO reference is missing required fields: ' +
        JSON.stringify(itemDTO.reference),
    )
  } else if (
    referenceType === 'recipe' &&
    (!('id' in itemDTO.reference) ||
      typeof itemDTO.reference.id !== 'number' ||
      !('children' in itemDTO.reference) ||
      !Array.isArray(itemDTO.reference.children))
  ) {
    throw new Error(
      'Recipe Item DTO reference is missing required fields: ' +
        JSON.stringify(itemDTO.reference),
    )
  } else if (
    referenceType === 'group' &&
    (!('children' in itemDTO.reference) ||
      !Array.isArray(itemDTO.reference.children))
  ) {
    throw new Error(
      'Group Item DTO reference is missing required fields: ' +
        JSON.stringify(itemDTO.reference),
    )
  }

  if (
    referenceType !== 'food' &&
    referenceType !== 'recipe' &&
    referenceType !== 'group'
  ) {
    throw new Error(
      'Item DTO reference has invalid type: ' +
        JSON.stringify(itemDTO.reference),
    )
  }

  if (referenceType === 'food') {
    if (
      itemDTO.reference.macros === null ||
      typeof itemDTO.reference.macros !== 'object'
    ) {
      throw new Error(
        'Food Item DTO reference macros is invalid: ' +
          JSON.stringify(itemDTO.reference.macros),
      )
    }

    return parseWithStack(itemSchema, {
      id: itemDTO.id,
      name: itemDTO.name,
      quantity: itemDTO.quantity,
      reference: {
        type: 'food',
        id: itemDTO.reference.id,
        macros: macrosToDomain(itemDTO.reference.macros),
      },
      __type: 'UnifiedItem',
    })
  }

  if (
    itemDTO.reference.children === null ||
    !Array.isArray(itemDTO.reference.children)
  ) {
    throw new Error(
      'Item DTO reference children is invalid: ' +
        JSON.stringify(itemDTO.reference.children),
    )
  }

  const children: Item[] = itemDTO.reference.children.map((childDTO: Json) =>
    itemToDomain(childDTO),
  )

  if (referenceType === 'recipe') {
    return parseWithStack(itemSchema, {
      id: itemDTO.id,
      name: itemDTO.name,
      quantity: itemDTO.quantity,
      reference: {
        type: 'recipe',
        id: itemDTO.reference.id,
        children,
      },
      __type: 'UnifiedItem' as const,
    })
  }

  return parseWithStack(itemSchema, {
    id: itemDTO.id,
    name: itemDTO.name,
    quantity: itemDTO.quantity,
    reference: {
      type: 'group',
      children,
    },
    __type: 'UnifiedItem' as const,
  })
}

function itemToDTO(item: Item): Json {
  if (isFoodItem(item)) {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      reference: {
        type: 'food',
        id: item.reference.id,
        macros: macrosToDTO(item.reference.macros),
      },
    }
  }

  if (item.reference.type === 'recipe') {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      reference: {
        type: 'recipe',
        id: item.reference.id,
        children: item.reference.children.map((child) => itemToDTO(child)),
      },
    }
  }

  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    reference: {
      type: 'group',
      children: item.reference.children.map((child) => itemToDTO(child)),
    },
  }
}

function mealToDomain(mealDTO: Json): Meal {
  if (
    mealDTO === null ||
    !(typeof mealDTO === 'object') ||
    !('id' in mealDTO) ||
    !('name' in mealDTO) ||
    !('items' in mealDTO) ||
    typeof mealDTO.id !== 'number' ||
    typeof mealDTO.name !== 'string' ||
    !Array.isArray(mealDTO.items)
  ) {
    throw new Error(
      'Food DTO is missing meal field: ' + JSON.stringify(mealDTO),
    )
  }

  return promoteMeal(
    createNewMeal({
      name: mealDTO.name,
      items: mealDTO.items.map((item: Json) => itemToDomain(item)),
    }),
    { id: mealDTO.id },
  )
}

function mealToDTO(meal: Meal): Json {
  return {
    ...meal,
    items: meal.items.map((item) => itemToDTO(item)),
  }
}

function dayToInsertDTO(newDayDiet: NewDayDiet) {
  return {
    target_day: newDayDiet.target_day,
    user_id: newDayDiet.user_id,
    meals: newDayDiet.meals.map((meal) => mealToDTO(meal)),
  }
}

type DayDietRow = Database['public']['Tables']['days']['Row']

function dayToDomain(dto: DayDietRow): DayDiet {
  if (!Array.isArray(dto.meals)) {
    throw new Error('DayDiet DTO meals field is not an array')
  }

  if (dto.user_id === null) {
    throw new Error('DayDiet DTO user_id cannot be null')
  }

  return parseWithStack(dayDietSchema, {
    id: dto.id,
    target_day: dto.target_day,
    user_id: dto.user_id,
    meals: dto.meals.map((meal) => mealToDomain(meal)),
  })
}

export function createSupabaseDayGateway(): DayGateway {
  return {
    fetchDayDietByUserIdAndTargetDay,
    fetchDayDietsByUserIdBeforeDate,
    fetchDayDietById,
    insertDayDiet,
    updateDayDietById,
    deleteDayDietById,
  }
}

async function fetchDayDietById(dayId: DayDiet['id']): Promise<DayDiet> {
  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_DAYS)
      .select()
      .eq('id', dayId)
      .single()

    if (error !== null) {
      logging.error('DayDiet fetch error:', error)
      throw error
    }

    return dayToDomain(data)
  } catch (err) {
    logging.error('DayDiet fetch error:', err)
    throw err
  }
}

async function fetchDayDietByUserIdAndTargetDay(
  userId: User['uuid'],
  targetDay: string,
): Promise<DayDiet | null> {
  logging.debug(
    `[supabaseDayRepository] fetchCurrentUserDayDiet(${userId}, ${targetDay})`,
  )

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .select()
    .eq('user_id', userId)
    .eq('target_day', targetDay)
    .single()

  if (error !== null) {
    if (error.code === 'PGRST116') {
      logging.debug(`[supabaseDayRepository] No day found for ${targetDay}`)
      return null
    }

    logging.error('DayDiet fetch error:', error)
    throw error
  }

  logging.debug(`[supabaseDayRepository] Successfully fetched day ${targetDay}`)
  return dayToDomain(data)
}

async function fetchDayDietsByUserIdBeforeDate(
  userId: User['uuid'],
  beforeDay: string,
  limit: number = 30,
): Promise<readonly DayDiet[]> {
  logging.debug(
    `[supabaseDayRepository] fetchPreviousUserDayDiets(${userId}, ${beforeDay}, ${limit})`,
  )

  const { data: dayDTOs, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .select()
    .eq('user_id', userId)
    .lt('target_day', beforeDay)
    .order('target_day', { ascending: false })
    .limit(limit)

  if (error !== null) {
    logging.error('DayDiet fetch error:', error)
    throw error
  }

  return dayDTOs.map((dto) => dayToDomain(dto))
}

async function insertDayDiet(newDay: NewDayDiet): Promise<DayDiet | null> {
  const newDayDTO = dayToInsertDTO(newDay)

  const { data: dayDTO, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .insert(newDayDTO)
    .select()
    .single()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }

  return dayToDomain(dayDTO)
}

async function updateDayDietById(
  id: DayDiet['id'],
  newDay: NewDayDiet,
): Promise<DayDiet> {
  const updateDTO = dayToInsertDTO(newDay)

  const { data: dayDTO, error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .update(updateDTO)
    .eq('id', id)
    .select()
    .single()

  if (error !== null) {
    logging.error('DayDiet update error:', error)
    throw error
  }

  return dayToDomain(dayDTO)
}

const deleteDayDietById = async (id: DayDiet['id']): Promise<void> => {
  const { error } = await supabase
    .from(SUPABASE_TABLE_DAYS)
    .delete()
    .eq('id', id)
    .select()

  if (error !== null) {
    throw wrapErrorWithStack(error)
  }
}
