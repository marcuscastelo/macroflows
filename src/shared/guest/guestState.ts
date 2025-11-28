import { getCurrentUser } from '~/modules/auth/application/usecases/authState'

/**
 * Guest mode state management.
 * Tracks whether the user is currently in guest/demo mode.
 */

export const isGuestMode = () => getCurrentUser() === null
