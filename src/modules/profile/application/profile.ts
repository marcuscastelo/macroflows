import { createEffect, createRoot, createSignal } from 'solid-js'

import { useCases } from '~/di/useCases'
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
export function createProfile(deps?: { useCases?: typeof useCases }) {
  const localUseCases = deps?.useCases ?? useCases

  return createRoot(() => {
    const [unsavedFields, setUnsavedFields] = createSignal<UnsavedFields>({})
    const [innerData, setInnerData] = createSignal<User | null>(
      localUseCases.userUseCases().currentUser(),
    )

    // Keep the innerData in sync with the canonical currentUser when it changes
    createEffect(() => {
      setInnerData(localUseCases.userUseCases().currentUser())
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
 * Backward-compatible shim: keep the original top-level named exports while
 * allowing consumers to opt into DI by calling `createProfile` directly.
 * TODO: Remove DI shims and use proper container/use-case injection.
 *
 * Consumers that still import `{ innerData, setInnerData, unsavedFields, setUnsavedFields }`
 * will continue to work during migration.
 */
const _defaultProfile = createProfile()

export const unsavedFields = _defaultProfile.unsavedFields
export const setUnsavedFields = _defaultProfile.setUnsavedFields
export const innerData = _defaultProfile.innerData
export const setInnerData = _defaultProfile.setInnerData

/**
 * Public type for the concrete profile module returned by the factory.
 */
export type ProfileModule = ReturnType<typeof createProfile>
