import { type Accessor, For } from 'solid-js'

import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import {
  UnifiedItemView,
  type UnifiedItemViewProps,
} from '~/sections/unified-item/components/UnifiedItemView'
import { logging } from '~/shared/utils/logging'

export type UnifiedItemListViewProps = {
  items: Accessor<UnifiedItem[]>
} & Omit<UnifiedItemViewProps, 'item' | 'header' | 'nutritionalInfo'>

export function UnifiedItemListView(props: UnifiedItemListViewProps) {
  logging.debug('[UnifiedItemListView] - Rendering')
  return (
    <For each={props.items()}>
      {(item) => (
        <div class="mt-2">
          <UnifiedItemView item={() => item} {...props} />
        </div>
      )}
    </For>
  )
}
