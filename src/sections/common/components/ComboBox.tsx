import { For, type JSX } from 'solid-js'

type ComboBoxOption<T extends string> = {
  value: T
  label: string
}

type ComboBoxProps<T extends string> = {
  options: readonly ComboBoxOption<T>[]
  value: T
  onChange: (value: T) => void
  class?: string
  optionClass?: string
}

/**
 * ComboBox component for selecting a value from a list of options.
 * @param options List of options to display
 * @param value Current selected value
 * @param onChange Callback when value changes
 * @param class Optional className
 */
export function ComboBox<T extends string>(
  props: ComboBoxProps<T>,
): JSX.Element {
  return (
    <select
      class={`select select-bordered ${props.class ?? ''}`}
      value={props.value}
      onInput={(e) => {
        const value = e.currentTarget.value
        // Safe cast since T extends string and options are constrained
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        props.onChange(value as T)
      }}
    >
      <For each={props.options}>
        {(option) => (
          <option value={option.value} class={props.optionClass}>
            {option.label}
          </option>
        )}
      </For>
    </select>
  )
}
