import { type Accessor, For } from 'solid-js'

import { type Item } from '~/modules/diet/unified-item/schema/itemSchema'
import {
  ItemView,
  type ItemViewProps,
} from '~/sections/unified-item/components/ItemView'
import { logging } from '~/shared/utils/logging'

export type ItemListViewProps = {
  items: Accessor<Item[]>
} & Omit<ItemViewProps, 'item'>

export function ItemListView(props: ItemListViewProps) {
  logging.debug('[ItemListView] - Rendering')
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
