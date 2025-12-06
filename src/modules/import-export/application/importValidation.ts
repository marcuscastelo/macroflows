import { type z, type ZodError } from 'zod/v4'

import {
  type ExportPayload,
  exportPayloadSchema,
  isDayExportPayload,
  isFullExportPayload,
  isMealExportPayload,
  isRecipeExportPayload,
} from '~/modules/import-export/domain/exportPayload'

/**
 * Result of validating an import payload
 */
export type ImportValidationResult =
  | {
      success: true
      data: ExportPayload
      warnings: string[]
    }
  | {
      success: false
      errors: ImportValidationError[]
    }

/**
 * Validation error with path and message
 */
export type ImportValidationError = {
  path: string
  message: string
  code: string
}

/**
 * Validates a JSON string as an export payload.
 * Returns either the parsed data with any warnings, or a list of errors.
 */
export function validateImportPayload(
  jsonString: string,
): ImportValidationResult {
  const warnings: string[] = []

  // Step 1: Parse JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (e) {
    return {
      success: false,
      errors: [
        {
          path: '',
          message:
            e instanceof Error
              ? `JSON inválido: ${e.message}`
              : 'JSON inválido',
          code: 'invalid_json',
        },
      ],
    }
  }

  // Step 2: Check if it's an object
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      success: false,
      errors: [
        {
          path: '',
          message:
            'O conteúdo deve ser um objeto JSON válido com metadata e data',
          code: 'invalid_structure',
        },
      ],
    }
  }

  // Step 3: Check for metadata presence
  // Since we've already validated it's an object, we can safely access properties
  const hasMetadata = 'metadata' in parsed && parsed.metadata !== null
  if (!hasMetadata) {
    return {
      success: false,
      errors: [
        {
          path: 'metadata',
          message: 'Metadados de exportação ausentes',
          code: 'missing_metadata',
        },
      ],
    }
  }

  // Step 4: Validate with Zod schema
  const result = exportPayloadSchema.safeParse(parsed)

  if (!result.success) {
    const errors = formatZodErrors(result.error)
    return {
      success: false,
      errors,
    }
  }

  // Step 5: Add version warnings if applicable
  const metadata = result.data.metadata
  if (metadata.schemaVersion !== '1.0.0') {
    warnings.push(
      `Versão do esquema diferente: ${metadata.schemaVersion} (esperado: 1.0.0)`,
    )
  }

  return {
    success: true,
    data: result.data,
    warnings,
  }
}

/**
 * Formats Zod validation errors into user-friendly messages.
 */
function formatZodErrors(error: ZodError): ImportValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: formatZodMessage(issue),
    code: issue.code,
  }))
}

/**
 * Formats a single Zod issue into a Portuguese message.
 */
function formatZodMessage(issue: z.core.$ZodIssue): string {
  const path = issue.path.length > 0 ? `${issue.path.join('.')}` : 'raiz'

  switch (issue.code) {
    case 'invalid_type':
      return `Campo '${path}': tipo inválido, esperado ${issue.expected}`
    case 'invalid_union':
      return `Campo '${path}': não corresponde a nenhum tipo válido`
    case 'invalid_value':
      return `Campo '${path}': valor inválido`
    case 'too_small':
      return `Campo '${path}': valor muito pequeno`
    case 'too_big':
      return `Campo '${path}': valor muito grande`
    default:
      return `Campo '${path}': ${issue.message}`
  }
}

/**
 * Generates a preview summary of the import payload.
 */
export function generateImportPreview(payload: ExportPayload): ImportPreview {
  const { metadata } = payload

  if (isMealExportPayload(payload)) {
    return {
      scope: 'meal',
      scopeLabel: 'Refeição',
      summary: `Refeição: ${payload.data.name}`,
      itemCount: payload.data.items.length,
      details: [
        `Nome: ${payload.data.name}`,
        `Itens: ${payload.data.items.length}`,
        `Exportado em: ${formatDate(metadata.exportedAt)}`,
      ],
    }
  }

  if (isRecipeExportPayload(payload)) {
    return {
      scope: 'recipe',
      scopeLabel: 'Receita',
      summary: `Receita: ${payload.data.name}`,
      itemCount: payload.data.items.length,
      details: [
        `Nome: ${payload.data.name}`,
        `Itens: ${payload.data.items.length}`,
        `Multiplicador: ${payload.data.prepared_multiplier}x`,
        `Exportado em: ${formatDate(metadata.exportedAt)}`,
      ],
    }
  }

  if (isDayExportPayload(payload)) {
    const totalItems = payload.data.meals.reduce(
      (acc, m) => acc + m.items.length,
      0,
    )
    return {
      scope: 'day',
      scopeLabel: 'Dia',
      summary: `Dia: ${payload.data.target_day}`,
      itemCount: payload.data.meals.length,
      details: [
        `Data: ${payload.data.target_day}`,
        `Refeições: ${payload.data.meals.length}`,
        `Total de itens: ${totalItems}`,
        `Exportado em: ${formatDate(metadata.exportedAt)}`,
      ],
    }
  }

  // For 'full' scope - use type guard for clarity
  if (isFullExportPayload(payload)) {
    return {
      scope: 'full',
      scopeLabel: 'Exportação Completa',
      summary: `Exportação completa`,
      itemCount: payload.data.days.length + payload.data.recipes.length,
      details: [
        `Dias: ${payload.data.days.length}`,
        `Receitas: ${payload.data.recipes.length}`,
        `Exportado em: ${formatDate(metadata.exportedAt)}`,
      ],
    }
  }

  // Fallback
  return {
    scope: 'unknown',
    scopeLabel: 'Desconhecido',
    summary: 'Tipo desconhecido',
    itemCount: 0,
    details: [`Exportado em: ${formatDate(metadata.exportedAt)}`],
  }
}

/**
 * Preview information for display
 */
export type ImportPreview = {
  scope: string
  scopeLabel: string
  summary: string
  itemCount: number
  details: string[]
}

/**
 * Formats ISO date string for display.
 */
function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleString('pt-BR')
  } catch {
    return isoDate
  }
}
