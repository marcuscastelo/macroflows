import { type Accessor, For } from 'solid-js'

import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import {
  ItemView,
  type ItemViewProps,
} from '~/sections/unified-item/components/UnifiedItemView'
import { logging } from '~/shared/utils/logging'

export type UnifiedItemListViewProps = {
  items: Accessor<UnifiedItem[]>
} & Omit<ItemViewProps, 'item' | 'header' | 'nutritionalInfo'>

export function UnifiedItemListView(props: UnifiedItemListViewProps) {
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
