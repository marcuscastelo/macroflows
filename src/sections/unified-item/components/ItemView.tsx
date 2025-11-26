import { type Accessor, type JSXElement, Show } from 'solid-js'

import { type Item } from '~/modules/diet/unified-item/schema/itemSchema'
import { ItemActions } from '~/sections/unified-item/components/ItemView/ItemActions'
import { ItemChildrenView } from '~/sections/unified-item/components/ItemView/ItemChildrenView'
import { ItemViewHeader } from '~/sections/unified-item/components/ItemView/ItemViewHeader'
import { ItemViewMacros } from '~/sections/unified-item/components/ItemView/ItemViewMacros'
import { createEventHandler } from '~/sections/unified-item/utils/unifiedItemDisplayUtils'
import { cn } from '~/shared/cn'

export type ItemViewProps = {
  item: Accessor<Item>
  class?: string
  mode?: 'edit' | 'read-only' | 'summary'
  primaryActions?: JSXElement
  secondaryActions?: JSXElement
  macroOverflow?: () => {
    enable: boolean
    originalItem?: Item | undefined
  }
  handlers: {
    onClick?: (item: Item) => void
    onEdit?: (item: Item) => void
    onCopy?: (item: Item) => void
    onDelete?: (item: Item) => void
  }
}

export function ItemView(props: ItemViewProps) {
  const isInteractive = () => props.mode !== 'summary'

  return (
    <div
      class={cn(
        'rounded-lg border border-gray-700 bg-gray-700 p-3 flex flex-col gap-2 shadow hover:cursor-pointer hover:bg-gray-700',
        props.class,
      )}
      onClick={(e: MouseEvent) => {
        const handler = createEventHandler(props.handlers.onClick, props.item())
        handler?.(e)
      }}
    >
      <ItemViewHeader
        item={props.item}
        primaryActions={props.primaryActions}
        secondaryActions={props.secondaryActions}
      >
        <Show when={isInteractive()}>
          <ItemActions item={props.item} handlers={props.handlers} />
        </Show>
      </ItemViewHeader>

      <ItemChildrenView item={props.item} />

      <ItemViewMacros item={props.item} macroOverflow={props.macroOverflow} />
    </div>
  )
}
