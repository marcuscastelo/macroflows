import { createSignal } from 'solid-js'

export function createGuestStore() {
  const [guestModeEnabled, setGuestModeEnabled] = createSignal(false)
  const [acceptedGuestTerms, setAcceptedGuestTerms] = createSignal(false)

  return {
    guestModeEnabled,
    setGuestModeEnabled,
    acceptedGuestTerms,
    setAcceptedGuestTerms,
  }
}
