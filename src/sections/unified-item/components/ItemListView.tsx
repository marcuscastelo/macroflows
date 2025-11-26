import { type Accessor, For } from 'solid-js'

import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import {
  ItemView,
  type ItemViewProps,
} from '~/sections/unified-item/components/ItemView'
import { logging } from '~/shared/utils/logging'

export type ItemListViewProps = {
  items: Accessor<UnifiedItem[]>
} & Omit<ItemViewProps, 'item'>

export function ItemListView(props: ItemListViewProps) {
  logging.debug('[UnifiedItemListView] - Rendering')
  return (
    <For each={props.items()}>
      {(item) => (
        <div class="mt-2">
          <ItemView item={() => item} {...props} />
        </div>
      )}
    </For>
  )
}
