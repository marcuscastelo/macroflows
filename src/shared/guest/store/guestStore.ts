import { createSignal } from 'solid-js'

export function createGuestStore() {
  const [guestModeEnabled, setGuestModeEnabled] = createSignal(false)
  return {
    guestModeEnabled,
    setGuestModeEnabled,
  }
}
