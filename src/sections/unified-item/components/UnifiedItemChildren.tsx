import { type Accessor, For, Show } from 'solid-js'

import { ItemExt } from '~/modules/diet/unified-item/application/itemExt'
import {
  isGroupItem,
  isRecipeItem,
  type UnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'

export type UnifiedItemChildrenProps = {
  item: Accessor<UnifiedItem>
}

export function UnifiedItemChildren(props: UnifiedItemChildrenProps) {
  const hasChildren = () => {
    const item = props.item()
    return (
      (isRecipeItem(item) || isGroupItem(item)) &&
      Array.isArray(item.reference.children) &&
      item.reference.children.length > 0
    )
  }

  const getChildren = () => {
    const item = props.item()
    if (isRecipeItem(item) || isGroupItem(item)) {
      return item.reference.children
    }
    return []
  }

  return (
    <Show when={hasChildren()}>
      <div class="relative ml-6">
        <div class="space-y-1">
          <For each={getChildren()}>
            {(child, index) => {
              const isLast = () => index() === getChildren().length - 1
              const isFirst = () => index() === 0
              const calories = () => ItemExt.of(child).macros().calories()
              return (
                <div class="relative flex items-center py-1">
                  {/* Vertical line segment */}
                  <Show when={!isLast()}>
                    <div
                      class="absolute w-px bg-gray-500"
                      style={{
                        left: '-12px',
                        top: isFirst() ? '-8px' : '-4px',
                        height: 'calc(100% + 8px)',
                      }}
                    />
                  </Show>

                  {/* Final vertical segment for last item - stops at center */}
                  <Show when={isLast()}>
                    <div
                      class="absolute w-px bg-gray-500"
                      style={{
                        left: '-12px',
                        top: isFirst() ? '-8px' : '-4px',
                        height: isFirst()
                          ? 'calc(50% + 8px)'
                          : 'calc(50% + 4px)',
                      }}
                    />
                  </Show>

                  {/* Horizontal connector line */}
                  <div
                    class="absolute w-3 h-px bg-gray-500"
                    style={{ left: '-12px', top: '50%' }}
                  />

                  <div class="text-sm text-gray-300 flex justify-between w-full">
                    <span>
                      {child.name} ({child.quantity}g)
                    </span>
                    <span class="text-gray-400">
                      {calories().toFixed(0)}kcal
                    </span>
                  </div>
                </div>
              )
            }}
          </For>
        </div>
      </div>
    </Show>
  )
}
