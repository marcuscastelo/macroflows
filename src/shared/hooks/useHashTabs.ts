import { useNavigate } from '@solidjs/router'
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'

import { vibrate } from '~/shared/utils/vibrate'

type UseHashTabsOptions<T extends string> = {
  validTabs: readonly T[]
  defaultTab: T
  storageKey?: string
}

/**
 * Hook for managing tab state with URL hash synchronization and localStorage persistence.
 * @param options - Configuration options for tab management
 * @returns Tab state and setter with automatic hash/storage sync
 */
export function useHashTabs<T extends string>(options: UseHashTabsOptions<T>) {
  const { validTabs, defaultTab, storageKey } = options
  const navigate = useNavigate()

  const getInitialTab = (): T => {
    if (typeof window !== 'undefined') {
      // Check URL hash first
      const hash = window.location.hash.slice(1)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      if (validTabs.includes(hash as T)) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return hash as T
      }

      // Check localStorage if storageKey provided
      if (storageKey !== undefined && storageKey.length > 0) {
        const stored = localStorage.getItem(storageKey)
        if (
          stored !== null &&
          stored.length > 0 &&
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          validTabs.includes(stored as T)
        ) {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          return stored as T
        }
      }
    }
    return defaultTab
  }

  const [activeTab, setActiveTab] = createSignal<T>(getInitialTab())

  // Update localStorage when tab changes
  createEffect(() => {
    if (
      typeof window !== 'undefined' &&
      storageKey !== undefined &&
      storageKey.length > 0
    ) {
      localStorage.setItem(storageKey, activeTab())
      vibrate(50)
      navigate(`#${activeTab()}`, { scroll: false })
    }
  })

  // Set initial hash and listen for hash changes from browser navigation
  onMount(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      if (validTabs.includes(hash as T) && hash !== activeTab()) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        setActiveTab(() => hash as T)
      }
    }

    window.addEventListener('hashchange', handleHashChange)

    onCleanup(() => window.removeEventListener('hashchange', handleHashChange))
  })

  return [activeTab, setActiveTab] as const
}
