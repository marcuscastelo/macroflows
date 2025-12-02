/**
 * Template Search Tab Preference Persistence
 *
 * Handles persisting and loading the user's preferred template search tab
 * from localStorage.
 */

import {
  availableTabs,
  type TemplateSearchTab,
} from '~/sections/search/components/TemplateSearchTabs'

const STORAGE_KEY = 'macroflows:template-search-tab'

/**
 * Default tab to use when no preference is saved.
 */
export const DEFAULT_TAB: TemplateSearchTab = availableTabs.Todos.id

/**
 * Checks if a value is a valid TemplateSearchTab.
 * @param value - The value to check
 * @returns True if the value is a valid tab ID
 */
function isValidTab(value: string): value is TemplateSearchTab {
  const validIds = Object.values(availableTabs).map((tab) => tab.id)
  return validIds.includes(value) || value === 'hidden'
}

/**
 * Loads the saved template search tab preference from localStorage.
 * @returns The saved tab preference, or the default tab if none is saved or invalid
 */
export function loadTabPreference(): TemplateSearchTab {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null && isValidTab(stored)) {
      return stored
    }
  } catch {
    // localStorage may not be available (SSR, private mode, etc.)
  }
  return DEFAULT_TAB
}

/**
 * Saves the template search tab preference to localStorage.
 * @param tab - The tab to save
 */
export function saveTabPreference(tab: TemplateSearchTab): void {
  try {
    // Don't persist the 'hidden' state
    if (tab !== 'hidden') {
      localStorage.setItem(STORAGE_KEY, tab)
    }
  } catch {
    // localStorage may not be available (SSR, private mode, etc.)
  }
}
