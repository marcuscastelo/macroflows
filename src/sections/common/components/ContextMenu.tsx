import {
  createContext,
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  Show,
  useContext,
} from 'solid-js'

import { cn } from '~/shared/cn'

const ContextMenuContext = createContext<{
  open: () => boolean
  setOpen: (v: boolean) => void
}>()

export function ContextMenu(props: {
  trigger: JSX.Element
  children: JSX.Element | JSX.Element[]
  class?: string
}) {
  const [open, setOpen] = createSignal(false)
  let menuRef: HTMLDivElement | undefined

  function handleDocumentClick(e: MouseEvent) {
    // Close if click is outside the menu (not the trigger or menu)
    if (menuRef && e.target instanceof Node && !menuRef.contains(e.target)) {
      setOpen(false)
    }
  }

  function handleTriggerClick(e: MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setOpen((v) => !v)
  }

  // Add event listener when menu is open
  createEffect(() => {
    if (open()) {
      document.addEventListener('click', handleDocumentClick)
    } else {
      document.removeEventListener('click', handleDocumentClick)
    }
  })

  onCleanup(() => {
    document.removeEventListener('click', handleDocumentClick)
  })

  return (
    <ContextMenuContext.Provider value={{ open, setOpen }}>
      <div
        ref={menuRef}
        class={cn('relative my-auto context-menu-root', props.class)}
      >
        <div class="my-auto" onClick={handleTriggerClick}>
          {props.trigger}
        </div>
        <Show when={open()}>
          <div
            class="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 min-w-[120px] rounded bg-gray-800 shadow-lg border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {props.children}
          </div>
        </Show>
      </div>
    </ContextMenuContext.Provider>
  )
}

// Add ContextMenu.Item subcomponent
ContextMenu.Item = function Item(props: {
  children: JSX.Element
  class?: string
  onClick: (e: MouseEvent) => void
}) {
  const ctx = useContext(ContextMenuContext)
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    props.onClick(e)
    ctx?.setOpen(false)
  }

  return (
    <button
      class={cn(
        'context-menu-item min-w-[120px] active:scale-105 select-none',
        props.class,
      )}
      onClick={handleClick}
    >
      {props.children}
    </button>
  )
}
