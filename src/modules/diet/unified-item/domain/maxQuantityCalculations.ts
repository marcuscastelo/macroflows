import {
  CARBO_CALORIES,
  FAT_CALORIES,
  PROTEIN_CALORIES,
} from '~/modules/diet/macro-nutrients/domain/macroExt'
import { type MacroNutrientsRecord } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

/**
 * Macro type for MAX quantity calculations
 */
export type MacroType = 'protein' | 'carb' | 'fat'

/**
 * Mode for MAX quantity calculations
 */
export type MaxQuantityMode = MacroType | 'balanced'

/**
 * Preview of the macro deltas after applying a quantity
 */
export type MacroPreview = {
  readonly carbs: number
  readonly protein: number
  readonly fat: number
}

/**
 * Result of a MAX quantity calculation
 */
export type MaxQuantityResult = {
  readonly grams: number
  readonly preview: MacroPreview
  readonly limitedBy: MacroType | null
}

/**
 * Gets the per-gram values for each macro from 100g item macros
 * @param itemMacrosPer100g - The macros per 100g of the item
 */
export function getMacrosPerGram(itemMacrosPer100g: MacroNutrientsRecord): {
  readonly carbPerGram: number
  readonly proteinPerGram: number
  readonly fatPerGram: number
} {
  return {
    carbPerGram: itemMacrosPer100g.carbs / 100,
    proteinPerGram: itemMacrosPer100g.protein / 100,
    fatPerGram: itemMacrosPer100g.fat / 100,
  }
}

/**
 * Calculates the macro preview for a given quantity
 * @param grams - The quantity in grams
 * @param itemMacrosPer100g - The macros per 100g of the item
 */
export function calculateMacroPreview(
  grams: number,
  itemMacrosPer100g: MacroNutrientsRecord,
): MacroPreview {
  const { carbPerGram, proteinPerGram, fatPerGram } =
    getMacrosPerGram(itemMacrosPer100g)

  return {
    carbs: grams * carbPerGram,
    protein: grams * proteinPerGram,
    fat: grams * fatPerGram,
  }
}

/**
 * Calculates the maximum grams allowed for a specific macro target
 * @param targetMacro - The macro to maximize
 * @param itemMacrosPer100g - The macros per 100g of the item
 * @param remainingTargets - The remaining macro targets available
 * @returns The max grams and any limiting macro
 */
export function getMaxForMacro(
  targetMacro: MacroType,
  itemMacrosPer100g: MacroNutrientsRecord,
  remainingTargets: MacroNutrientsRecord,
): MaxQuantityResult {
  const { carbPerGram, proteinPerGram, fatPerGram } =
    getMacrosPerGram(itemMacrosPer100g)

  // Get the per-gram value for the target macro
  const targetPerGram =
    targetMacro === 'protein'
      ? proteinPerGram
      : targetMacro === 'carb'
        ? carbPerGram
        : fatPerGram

  // Get the remaining target for the target macro
  const targetRemaining =
    targetMacro === 'protein'
      ? remainingTargets.protein
      : targetMacro === 'carb'
        ? remainingTargets.carbs
        : remainingTargets.fat

  // If the item has no content of the target macro, return 0
  if (targetPerGram <= 0) {
    return {
      grams: 0,
      preview: { carbs: 0, protein: 0, fat: 0 },
      limitedBy: null,
    }
  }

  // Calculate the desired grams to fill the target macro
  const desiredGrams = Math.max(0, targetRemaining / targetPerGram)

  // Check constraints from other macros
  const constraints: Array<{ grams: number; macro: MacroType }> = []

  // Protein constraint
  if (proteinPerGram > 0 && targetMacro !== 'protein') {
    const maxFromProtein = Math.max(
      0,
      remainingTargets.protein / proteinPerGram,
    )
    constraints.push({ grams: maxFromProtein, macro: 'protein' })
  }

  // Carb constraint
  if (carbPerGram > 0 && targetMacro !== 'carb') {
    const maxFromCarb = Math.max(0, remainingTargets.carbs / carbPerGram)
    constraints.push({ grams: maxFromCarb, macro: 'carb' })
  }

  // Fat constraint
  if (fatPerGram > 0 && targetMacro !== 'fat') {
    const maxFromFat = Math.max(0, remainingTargets.fat / fatPerGram)
    constraints.push({ grams: maxFromFat, macro: 'fat' })
  }

  // Find the most limiting constraint
  let limitedBy: MacroType | null = null
  let finalGrams = desiredGrams

  for (const constraint of constraints) {
    if (constraint.grams < finalGrams) {
      finalGrams = constraint.grams
      limitedBy = constraint.macro
    }
  }

  // Round to 2 decimal places
  const roundedGrams = Math.round(finalGrams * 100) / 100

  return {
    grams: roundedGrams,
    preview: calculateMacroPreview(roundedGrams, itemMacrosPer100g),
    limitedBy,
  }
}

/**
 * Calculates the maximum grams allowed without exceeding any macro target (balanced mode)
 * @param itemMacrosPer100g - The macros per 100g of the item
 * @param remainingTargets - The remaining macro targets available
 * @returns The max grams that don't exceed any macro
 */
export function getMaxBalanced(
  itemMacrosPer100g: MacroNutrientsRecord,
  remainingTargets: MacroNutrientsRecord,
): MaxQuantityResult {
  const { carbPerGram, proteinPerGram, fatPerGram } =
    getMacrosPerGram(itemMacrosPer100g)

  const constraints: Array<{ grams: number; macro: MacroType }> = []

  // Carb constraint
  if (carbPerGram > 0) {
    const maxFromCarb = Math.max(0, remainingTargets.carbs / carbPerGram)
    constraints.push({ grams: maxFromCarb, macro: 'carb' })
  }

  // Protein constraint
  if (proteinPerGram > 0) {
    const maxFromProtein = Math.max(
      0,
      remainingTargets.protein / proteinPerGram,
    )
    constraints.push({ grams: maxFromProtein, macro: 'protein' })
  }

  // Fat constraint
  if (fatPerGram > 0) {
    const maxFromFat = Math.max(0, remainingTargets.fat / fatPerGram)
    constraints.push({ grams: maxFromFat, macro: 'fat' })
  }

  // If no constraints, return 0 (item has no macros)
  if (constraints.length === 0) {
    return {
      grams: 0,
      preview: { carbs: 0, protein: 0, fat: 0 },
      limitedBy: null,
    }
  }

  // Find the minimum (most limiting)
  let minGrams = Infinity
  let limitedBy: MacroType | null = null

  for (const constraint of constraints) {
    if (constraint.grams < minGrams) {
      minGrams = constraint.grams
      limitedBy = constraint.macro
    }
  }

  // Round to 2 decimal places
  const roundedGrams = Math.round(minGrams * 100) / 100

  return {
    grams: roundedGrams,
    preview: calculateMacroPreview(roundedGrams, itemMacrosPer100g),
    limitedBy,
  }
}

/**
 * Threshold for considering a macro as dominant (60% of total calories)
 */
const DOMINANT_THRESHOLD = 0.6

/**
 * Detects if an item has a dominant macro (≥60% of calories)
 * @param itemMacrosPer100g - The macros per 100g of the item
 * @returns The dominant macro type, or null if mixed
 */
export function getDominantMacro(
  itemMacrosPer100g: MacroNutrientsRecord,
): MacroType | null {
  const carbCalories = itemMacrosPer100g.carbs * CARBO_CALORIES
  const proteinCalories = itemMacrosPer100g.protein * PROTEIN_CALORIES
  const fatCalories = itemMacrosPer100g.fat * FAT_CALORIES

  const totalCalories = carbCalories + proteinCalories + fatCalories

  // If item has no calories, return null
  if (totalCalories <= 0) {
    return null
  }

  const carbPercentage = carbCalories / totalCalories
  const proteinPercentage = proteinCalories / totalCalories
  const fatPercentage = fatCalories / totalCalories

  if (proteinPercentage >= DOMINANT_THRESHOLD) {
    return 'protein'
  }
  if (carbPercentage >= DOMINANT_THRESHOLD) {
    return 'carb'
  }
  if (fatPercentage >= DOMINANT_THRESHOLD) {
    return 'fat'
  }

  return null
}

/**
 * Calculates the max quantity for a given mode
 * @param mode - The MAX quantity mode
 * @param itemMacrosPer100g - The macros per 100g of the item
 * @param remainingTargets - The remaining macro targets available
 * @returns The max quantity result
 */
export function calculateMaxQuantity(
  mode: MaxQuantityMode,
  itemMacrosPer100g: MacroNutrientsRecord,
  remainingTargets: MacroNutrientsRecord,
): MaxQuantityResult {
  if (mode === 'balanced') {
    return getMaxBalanced(itemMacrosPer100g, remainingTargets)
  }
  return getMaxForMacro(mode, itemMacrosPer100g, remainingTargets)
}
