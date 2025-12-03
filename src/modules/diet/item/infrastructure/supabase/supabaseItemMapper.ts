import {
  isFoodItem,
  type Item,
  itemSchema,
} from '~/modules/diet/item/schema/itemSchema'
import { supabaseMacroNutrientsMapper } from '~/modules/diet/macro-nutrients/infrastructure/supabase/supabaseMacroNutrientsMapper'
import { type Json } from '~/shared/supabase/database.types'
import { parseWithStack } from '~/shared/utils/parseWithStack'

function toDomain(itemDTO: Json): Item {
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
    const macros = supabaseMacroNutrientsMapper.toDomain(
      itemDTO.reference.macros,
    )
    return parseWithStack(itemSchema, {
      id: itemDTO.id,
      name: itemDTO.name,
      quantity: itemDTO.quantity,
      reference: {
        type: 'food',
        id: itemDTO.reference.id,
        macros,
      },
      __type: 'UnifiedItem',
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (referenceType === 'recipe' || referenceType === 'group') {
    // Recursively parse children items
    if (
      itemDTO.reference.children === null ||
      !Array.isArray(itemDTO.reference.children)
    ) {
      throw new Error(
        'Item DTO reference children is invalid: ' +
          JSON.stringify(itemDTO.reference.children),
      )
    }
    const children = itemDTO.reference.children.map((childDTO: Json) =>
      toDomain(childDTO),
    )
    return parseWithStack(itemSchema, {
      id: itemDTO.id,
      name: itemDTO.name,
      quantity: itemDTO.quantity,
      reference:
        referenceType === 'recipe'
          ? {
              type: 'recipe',
              id: itemDTO.reference.id,
              children,
            }
          : {
              type: 'group',
              children,
            },
      __type: 'UnifiedItem',
    })
  }

  referenceType satisfies never // for exhaustiveness
  throw new Error(
    'Item DTO has invalid reference type: ' + JSON.stringify(itemDTO.reference),
  )
}

function toSupabaseDTO(item: Item): Json {
  if (isFoodItem(item)) {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      reference: {
        type: 'food',
        id: item.reference.id,
        macros: supabaseMacroNutrientsMapper.toInsertDTO(item.reference.macros),
      },
    }
  } else if (item.reference.type === 'recipe') {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      reference: {
        type: 'recipe',
        id: item.reference.id,
        children: item.reference.children.map((child) => toSupabaseDTO(child)),
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (item.reference.type === 'group') {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      reference: {
        type: 'group',
        children: item.reference.children.map((child) => toSupabaseDTO(child)),
      },
    }
  }

  item.reference satisfies never // for exhaustiveness
  throw new Error(
    'Item has invalid reference type: ' + JSON.stringify(item.reference),
  )
}

export const supabaseItemMapper = {
  toDomain,
  toInsertDTO: (item: Item): Json => toSupabaseDTO(item),
  toUpdateDTO: (item: Item): Json => toSupabaseDTO(item),
}
