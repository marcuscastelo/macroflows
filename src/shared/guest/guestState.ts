import { currentUserId } from '~/modules/user/application/user'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'

/**
 * Guest mode state management.
 * Tracks whether the user is currently in guest/demo mode.
 */

export const isGuestMode = () => currentUserId() === GUEST_USER_ID
