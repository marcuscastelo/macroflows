import { createEffect, createRoot, createSignal } from 'solid-js'

import { type UserUseCases } from '~/modules/user/application/usecases/userUseCases'
import { type User } from '~/modules/user/domain/user'
import { type Mutable } from '~/shared/utils/typeUtils'

/**
 * Map of user fields that are currently unsaved in the UI.
 */
export type UnsavedFields = { [key in keyof Mutable<User>]?: boolean }

/**
 * Factory that creates the profile application reactive state.
 *
 * This factory encapsulates the Solid signals used by the profile UI so they can
 * be instantiated with injected dependencies (useCases) during testing or when
 * wiring an alternate DI container.
 *
 * Returned shape:
 * - `unsavedFields`: getter signal for the unsaved fields map
 * - `setUnsavedFields`: setter for the unsaved fields map
 * - `innerData`: getter signal for the local edited `User` copy
 * - `setInnerData`: setter for the local edited `User` copy
 *
 * @param deps Optional dependency overrides. Useful for tests or custom DI wiring.
 * @returns An object with the profile signals and their setters.
 */
export function createProfile(deps: { userUseCases: () => UserUseCases }) {
  return createRoot(() => {
    const [unsavedFields, setUnsavedFields] = createSignal<UnsavedFields>({})
    const [innerData, setInnerData] = createSignal<User | null>(
      deps.userUseCases().currentUser(),
    )

    // Keep the innerData in sync with the canonical currentUser when it changes
    createEffect(() => {
      setInnerData(deps.userUseCases().currentUser())
    })

    return {
      unsavedFields,
      setUnsavedFields,
      innerData,
      setInnerData,
    }
  })
}

/**
 * Public type for the concrete profile module returned by the factory.
 */
export type ProfileModule = ReturnType<typeof createProfile>
