import { type Accessor, type JSXElement, Show } from 'solid-js'

import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { ItemViewName } from '~/sections/item/components/ItemView/ItemViewHeader/ItemViewName'

export type ItemViewHeaderProps = {
  item: Accessor<Item>
  children?: JSXElement
  primaryActions?: JSXElement
  secondaryActions?: JSXElement
}

export function ItemViewHeader(props: ItemViewHeaderProps) {
  return (
    <div class="flex justify-between items-center ">
      <div class="flex flex-1 items-center">
        <div class="flex-1 flex justify-between">
          <ItemViewName item={props.item} />
          {props.children}
        </div>
      </div>
      <div class="flex flex-col">
        <Show when={props.secondaryActions}>
          <div class="flex gap-2 items-center">{props.secondaryActions}</div>
        </Show>
        <Show when={props.primaryActions}>
          <div class="flex gap-2 items-center">{props.primaryActions}</div>
        </Show>
      </div>
    </div>
  )
}
