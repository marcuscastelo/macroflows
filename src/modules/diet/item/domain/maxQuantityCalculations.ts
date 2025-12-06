import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import { type MacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

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
  readonly carbsInGrams: number
  readonly proteinInGrams: number
  readonly fatInGrams: number
}

/**
 * Result of a MAX quantity calculation
 */
export type MaxQuantityResult = {
  readonly grams: number
  readonly preview: MacroPreview
  readonly limitedBy: MacroType | null
  /** Whether the calculation ignored other macro constraints */
  readonly ignoredOtherMacros: boolean
}

/**
 * Options for MAX quantity calculations
 */
export type MaxQuantityOptions = {
  /** When true, ignores other macro constraints and only considers the target macro's remaining */
  readonly ignoreOtherMacros?: boolean
}

/**
 * Gets the per-gram values for each macro from 100g item macros
 * @param itemMacrosPer100g - The macros per 100g of the item
 */
export function getMacrosPerGram(itemMacrosPer100g: MacroNutrients): {
  readonly carbPerGram: number
  readonly proteinPerGram: number
  readonly fatPerGram: number
} {
  const macrosExt = MacroNutrientsExt.of(itemMacrosPer100g)
  return {
    carbPerGram: macrosExt.carbsInGrams() / 100,
    proteinPerGram: macrosExt.proteinInGrams() / 100,
    fatPerGram: macrosExt.fatInGrams() / 100,
  }
}

/**
 * Calculates the macro preview for a given quantity
 * @param grams - The quantity in grams
 * @param itemMacrosPer100g - The macros per 100g of the item
 */
export function calculateMacroPreview(
  grams: number,
  itemMacrosPer100g: MacroNutrients,
): MacroPreview {
  const { carbPerGram, proteinPerGram, fatPerGram } =
    getMacrosPerGram(itemMacrosPer100g)

  return {
    carbsInGrams: grams * carbPerGram,
    proteinInGrams: grams * proteinPerGram,
    fatInGrams: grams * fatPerGram,
  }
}

/**
 * Calculates the maximum grams allowed for a specific macro target
 * @param targetMacro - The macro to maximize
 * @param itemMacrosPer100g - The macros per 100g of the item
 * @param remainingTargets - The remaining macro targets available
 * @param options - Optional settings for the calculation
 * @returns The max grams and any limiting macro
 */
export function getMaxForMacro(
  targetMacro: MacroType,
  itemMacrosPer100g: MacroNutrients,
  remainingTargets: MacroNutrients,
  options: MaxQuantityOptions = {},
): MaxQuantityResult {
  const { ignoreOtherMacros = false } = options
  const { carbPerGram, proteinPerGram, fatPerGram } =
    getMacrosPerGram(itemMacrosPer100g)

  // Get the per-gram value for the target macro
  const targetPerGram =
    targetMacro === 'protein'
      ? proteinPerGram
      : targetMacro === 'carb'
        ? carbPerGram
        : fatPerGram

  const remainingTargetsExt = MacroNutrientsExt.of(remainingTargets)

  // Get the remaining target for the target macro
  const targetRemaining =
    targetMacro === 'protein'
      ? remainingTargetsExt.proteinInGrams()
      : targetMacro === 'carb'
        ? remainingTargetsExt.carbsInGrams()
        : remainingTargetsExt.fatInGrams()

  // If the item has no content of the target macro, return 0
  if (targetPerGram <= 0) {
    return {
      grams: 0,
      preview: { carbsInGrams: 0, proteinInGrams: 0, fatInGrams: 0 },
      limitedBy: null,
      ignoredOtherMacros: ignoreOtherMacros,
    }
  }

  // Calculate the desired grams to fill the target macro
  const desiredGrams = Math.max(0, targetRemaining / targetPerGram)

  // If ignoring other macros, skip constraints check
  if (ignoreOtherMacros) {
    const roundedGrams = Math.round(desiredGrams * 100) / 100
    return {
      grams: roundedGrams,
      preview: calculateMacroPreview(roundedGrams, itemMacrosPer100g),
      limitedBy: null,
      ignoredOtherMacros: true,
    }
  }

  // Check constraints from other macros
  const constraints: Array<{ grams: number; macro: MacroType }> = []

  // Protein constraint
  if (proteinPerGram > 0 && targetMacro !== 'protein') {
    const maxFromProtein = Math.max(
      0,
      remainingTargetsExt.proteinInGrams() / proteinPerGram,
    )
    constraints.push({ grams: maxFromProtein, macro: 'protein' })
  }

  // Carb constraint
  if (carbPerGram > 0 && targetMacro !== 'carb') {
    const maxFromCarb = Math.max(
      0,
      remainingTargetsExt.carbsInGrams() / carbPerGram,
    )
    constraints.push({ grams: maxFromCarb, macro: 'carb' })
  }

  // Fat constraint
  if (fatPerGram > 0 && targetMacro !== 'fat') {
    const maxFromFat = Math.max(
      0,
      remainingTargetsExt.fatInGrams() / fatPerGram,
    )
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
    ignoredOtherMacros: false,
  }
}

/**
 * Calculates the maximum grams allowed without exceeding any macro target (balanced mode)
 * @param itemMacrosPer100g - The macros per 100g of the item
 * @param remainingTargets - The remaining macro targets available
 * @returns The max grams that don't exceed any macro
 */
export function getMaxBalanced(
  itemMacrosPer100g: MacroNutrients,
  remainingTargets: MacroNutrients,
): MaxQuantityResult {
  const { carbPerGram, proteinPerGram, fatPerGram } =
    getMacrosPerGram(itemMacrosPer100g)

  const constraints: Array<{ grams: number; macro: MacroType }> = []

  const remainingTargetsExt = MacroNutrientsExt.of(remainingTargets)

  // Carb constraint
  if (carbPerGram > 0) {
    const maxFromCarb = Math.max(
      0,
      remainingTargetsExt.carbsInGrams() / carbPerGram,
    )
    constraints.push({ grams: maxFromCarb, macro: 'carb' })
  }

  // Protein constraint
  if (proteinPerGram > 0) {
    const maxFromProtein = Math.max(
      0,
      remainingTargetsExt.proteinInGrams() / proteinPerGram,
    )
    constraints.push({ grams: maxFromProtein, macro: 'protein' })
  }

  // Fat constraint
  if (fatPerGram > 0) {
    const maxFromFat = Math.max(
      0,
      remainingTargetsExt.fatInGrams() / fatPerGram,
    )
    constraints.push({ grams: maxFromFat, macro: 'fat' })
  }

  // If no constraints, return 0 (item has no macros)
  if (constraints.length === 0) {
    return {
      grams: 0,
      preview: { carbsInGrams: 0, proteinInGrams: 0, fatInGrams: 0 },
      limitedBy: null,
      ignoredOtherMacros: false,
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
    ignoredOtherMacros: false,
  }
}

/**
 * Threshold for considering a macro as dominant
 */
const DOMINANT_THRESHOLD = 0.7

/**
 * Detects if an item has a dominant macro
 * @param itemMacrosPer100g - The macros per 100g of the item
 * @returns The dominant macro type, or null if mixed
 */
export function getDominantMacro(
  itemMacrosPer100g: MacroNutrients,
): MacroType | null {
  const itemMacrosExt = MacroNutrientsExt.of(itemMacrosPer100g)
  const carbGrams = itemMacrosExt.carbsInGrams()
  const proteinGrams = itemMacrosExt.proteinInGrams()
  const fatGrams = itemMacrosExt.fatInGrams()

  const totalGrams = carbGrams + proteinGrams + fatGrams

  // If item has no calories, return null
  if (totalGrams <= 0) {
    return null
  }

  const carbPercentage = carbGrams / totalGrams
  const proteinPercentage = proteinGrams / totalGrams
  const fatPercentage = fatGrams / totalGrams

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
 * @param options - Optional settings for the calculation
 * @returns The max quantity result
 */
export function calculateMaxQuantity(
  mode: MaxQuantityMode,
  itemMacrosPer100g: MacroNutrients,
  remainingTargets: MacroNutrients,
  options: MaxQuantityOptions = {},
): MaxQuantityResult {
  if (mode === 'balanced') {
    return getMaxBalanced(itemMacrosPer100g, remainingTargets)
  }
  return getMaxForMacro(mode, itemMacrosPer100g, remainingTargets, options)
}
