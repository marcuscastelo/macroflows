import { mergeProps, type JSXElement, useContext } from 'solid-js'
import { BG_COLOR, BORDER_COLOR, BUTTON_COLOR, RING_COLOR } from '~/sections/datepicker/constants'
import DatepickerContext from '~/sections/datepicker/contexts/DatepickerContext'

type IconProps = {
  class: string
}

type Button = {
  children: JSXElement | JSXElement[]
  onClick: any // TODO: Fix any
  disabled?: boolean
  roundedFull?: boolean
  padding?: string
  active?: boolean
}

export const DateIcon = (_props: IconProps) => {
  const props = mergeProps({ className: 'w-6 h-6' }, _props)
  return (
        <svg
            class={props.class}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={1.5}
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
            />
        </svg>
  )
}

export const CloseIcon = (_props: IconProps) => {
  const props = mergeProps({ className: 'w-6 h-6' }, _props)
  return (
        <svg
            class={props.class}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={1.5}
            stroke="currentColor"
        >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
  )
}

export const ChevronLeftIcon = (_props: IconProps) => {
  const props = mergeProps({ className: 'w-6 h-6' }, _props)
  return (
        <svg
            class={props.class}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={1.5}
            stroke="currentColor"
        >
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
  )
}

export const DoubleChevronLeftIcon = (_props: IconProps) => {
  const props = mergeProps({ className: 'w-6 h-6' }, _props)
  return (
        <svg
            class={props.class}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={1.5}
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
            />
        </svg>
  )
}

export const ChevronRightIcon = (_props: IconProps) => {
  const props = mergeProps({ className: 'w-6 h-6' }, _props)
  return (
        <svg
            class={props.class}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={1.5}
            stroke="currentColor"
        >
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
  )
}

export const DoubleChevronRightIcon = (_props: IconProps) => {
  const props = mergeProps({ className: 'w-6 h-6' }, _props)
  return (
        <svg
            class={props.class}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={1.5}
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"
            />
        </svg>
  )
}

export const Arrow = (props: any) => {
  return (
        <div
            ref={props.ref}
            class="absolute z-20 h-4 w-4 rotate-45 mt-0.5 ml-[1.2rem] border-l border-t border-gray-300 bg-white dark:bg-slate-800 dark:border-slate-600"
        />
  )
}

export const SecondaryButton = (_props: Button) => {
  // Contexts
  const props = mergeProps({ disabled: false }, _props)
  const datepickerStore = useContext(DatepickerContext)

  // Functions
  const getClassName: () => string = () => {
    const ringColor = RING_COLOR.focus[datepickerStore().primaryColor as keyof typeof RING_COLOR.focus]
    return `w-full transition-all duration-300 bg-white dark:text-gray-700 font-medium border border-gray-300 px-4 py-2 text-sm rounded-md focus:ring-2 focus:ring-offset-2 hover:bg-gray-50 ${ringColor}`
  }

  return (
        <button type="button" class={getClassName()} onClick={() => props.onClick()} disabled={props.disabled}>
            {props.children}
        </button>
  )
}

export const PrimaryButton = (_props: Button) => {
  // Contexts
  const props = mergeProps({ disabled: false }, _props)
  const datepickerStore = useContext(DatepickerContext)
  const bgColor = BG_COLOR['500'][datepickerStore().primaryColor as keyof (typeof BG_COLOR)['500']]
  const borderColor = BORDER_COLOR['500'][datepickerStore().primaryColor as keyof (typeof BORDER_COLOR)['500']]
  const bgColorHover = BG_COLOR.hover[datepickerStore().primaryColor as keyof typeof BG_COLOR.hover]
  const ringColor = RING_COLOR.focus[datepickerStore().primaryColor as keyof typeof RING_COLOR.focus]

  // Functions
  const getClassName = () => {
    return `w-full transition-all duration-300 ${bgColor} ${borderColor} text-white font-medium border px-4 py-2 text-sm rounded-md focus:ring-2 focus:ring-offset-2 ${bgColorHover} ${ringColor} ${
            props.disabled ? ' cursor-no-drop' : ''
        }`
  }

  return (
        <button type="button" class={getClassName()} onClick={() => props.onClick()} disabled={props.disabled}>
            {props.children}
        </button>
  )
}

export const RoundedButton = (_props: Button) => {
  // Contexts
  const props = mergeProps({ roundedFull: false, padding: 'py-[0.55rem]', active: false }, _props)
  const datepickerStore = useContext(DatepickerContext)

  // Functions
  const getClassName = () => {
    const darkClass = 'dark:text-white/70 dark:hover:bg-white/10 dark:focus:bg-white/10'
    const activeClass = props.active ? 'font-semibold bg-gray-50 dark:bg-white/5' : ''
    const defaultClass = !props.roundedFull
      ? `w-full tracking-wide ${darkClass} ${activeClass} transition-all duration-300 px-3 ${props.padding} uppercase hover:bg-gray-100 rounded-md focus:ring-1`
      : `${darkClass} ${activeClass} transition-all duration-300 hover:bg-gray-100 rounded-full p-[0.45rem] focus:ring-1`
    const buttonFocusColor =
            BUTTON_COLOR.focus[datepickerStore().primaryColor as keyof typeof BUTTON_COLOR.focus]
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const disabledClass = props.disabled ? 'line-through' : ''

    return `${defaultClass} ${buttonFocusColor} ${disabledClass}`
  }

  return (
        <button type="button" class={getClassName()} onClick={() => props.onClick()} disabled={props.disabled}>
            {props.children}
        </button>
  )
}

export const VerticalDash = () => {
  // Contexts
  const datepickerStore = useContext(DatepickerContext)
  const bgColor = BG_COLOR['500'][datepickerStore().primaryColor as keyof (typeof BG_COLOR)['500']]

  return <div class={`bg-blue-500 h-7 w-1 rounded-full hidden md:block ${bgColor}`} />
}
