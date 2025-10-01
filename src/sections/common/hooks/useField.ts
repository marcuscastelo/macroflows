/**
 * @fileoverview Core useField hook for managing form field state and transformations
 */

import { type Accessor, createEffect, createSignal } from 'solid-js'

import type { FieldTransform } from '~/sections/common/hooks/transforms/fieldTransforms'
import {
  createDateTransform,
  createFloatTransform,
} from '~/sections/common/hooks/transforms/fieldTransforms'

export type UseFieldOptions<T> = {
  inputSignal: Accessor<T | undefined>
  transform: FieldTransform<T>
}

export type UseFieldReturn<T> = {
  rawValue: Accessor<string>
  setRawValue: (value: string) => void
  value: Accessor<T | undefined>
  transform: FieldTransform<T>
}

/**
 * Generic hook for managing form fields with type transformations
 *
 * @param options Configuration for the field
 * @returns Field state and setters
 *
 * @example
 * ```tsx
 * const field = useField({
 *   inputSignal: () => someNumber,
 *   transform: createFloatTransform({ decimalPlaces: 2 })
 * })
 *
 * return <input
 *   value={field.rawValue()}
 *   onInput={(e) => field.setRawValue(e.target.value)}
 * />
 * ```
 */
export function useField<T>({
  inputSignal,
  transform,
}: UseFieldOptions<T>): UseFieldReturn<T> {
  const initialValue = inputSignal()
  const [rawValue, setRawValue] = createSignal(
    initialValue === undefined ? '' : transform.toRaw(initialValue),
  )

  createEffect(() => {
    const newValue = inputSignal()
    if (newValue === undefined) {
      setRawValue('')
    } else {
      setRawValue(transform.toRaw(newValue))
    }
  })

  const value = (): T | undefined => {
    const raw = rawValue()
    return raw === '' ? undefined : transform.toValue(raw)
  }

  return {
    rawValue,
    setRawValue,
    value,
    transform,
  }
}

/**
 * Hook for managing float/number input fields
 *
 * @param inputSignal Signal providing the current value
 * @param extras Configuration options for the float field
 * @returns Field state and handlers for float inputs
 *
 * @example
 * ```tsx
 * const heightField = useFloatField(() => measure.height, {
 *   decimalPlaces: 1,
 *   maxValue: 300
 * })
 *
 * return <FloatInput field={heightField} />
 * ```
 */
export function useFloatField(
  inputSignal?: Accessor<number | undefined>,
  extras?: {
    decimalPlaces?: number
    defaultValue?: number
    maxValue?: number
    minValue?: number
  },
) {
  return useField<number>({
    inputSignal: inputSignal ?? (() => undefined),
    transform: createFloatTransform(extras ?? {}),
  })
}

/**
 * Hook for managing date input fields
 *
 * @param inputSignal Signal providing the current date value
 * @param options Optional configuration with a fallback function for default date
 * @returns Field state and handlers for date inputs
 *
 * @example
 * ```tsx
 * const dateField = useDateField(() => measure.target_timestamp)
 *
 * return <Datepicker
 *   value={dateField.value()}
 *   onChange={(date) => dateField.setRawValue(dateField.transform.toRaw(date))}
 * />
 * ```
 */
export function useDateField<
  Options extends { fallback: () => Date } | undefined = undefined,
>(
  inputSignal: Accessor<Date | undefined>,
  options?: Options,
): Omit<ReturnType<typeof useField<Date>>, 'value'> & {
  value: Options extends { fallback: () => Date }
    ? () => Date
    : () => Date | undefined
} {
  const field = useField<Date>({
    inputSignal,
    transform: createDateTransform(),
  })
  const valueWithFallback = () => {
    const v = field.value()
    if (v !== undefined) return v
    if (
      typeof options === 'object' &&
      'fallback' in options &&
      typeof options.fallback === 'function'
    ) {
      return options.fallback()
    }
    return undefined
  }
  return {
    ...field,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    value: valueWithFallback as Options extends { fallback: () => Date }
      ? () => Date
      : () => Date | undefined,
  }
}
