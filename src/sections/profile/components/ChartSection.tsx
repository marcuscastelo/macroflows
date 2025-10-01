import { createSignal, type JSX, onMount, Show } from 'solid-js'

import { type ProfileChartTab } from '~/sections/profile/components/ProfileChartTabs'
import { cn } from '~/shared/cn'

type ChartSectionProps = {
  id: ProfileChartTab
  activeTab: ProfileChartTab
  children: JSX.Element
}

/**
 * Conditional rendering wrapper for chart sections.
 * Only renders children when the section is active, enabling memory optimization.
 * @param props - Section configuration and children
 * @returns SolidJS component
 */
export function ChartSection(props: ChartSectionProps) {
  const [renderInactive, setRenderInactive] = createSignal(false)
  onMount(() => {
    setTimeout(() => {
      setRenderInactive(true)
    }, 3000) // Delay to allow initial render of active tab
  })

  const className = () =>
    cn({
      hidden: props.activeTab !== props.id,
      block: props.activeTab === props.id,
    })
  return (
    <div class={className()}>
      <Show when={props.activeTab === props.id || renderInactive()}>
        {props.children}
      </Show>
    </div>
  )
}
