import { createContext, type JSXElement, useContext } from 'solid-js'

import { createAuthUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { createUserUseCases } from '~/modules/user/application/usecases/userUseCases'
import { createSupabaseUserRepository } from '~/modules/user/infrastructure/supabase/supabaseUserRepository'
import { createWeightUseCases } from '~/modules/weight/application/weight/usecases/weightUseCases'

/**
 * Minimal interfaces for commonly-used use-cases.
 * Keep these small and extend as consumers need more functionality.
 */
export type AuthUseCases = {
  /**
   * Initialize authentication lifecycle (listeners, session restore, etc).
   * Should be safe to call multiple times.
   */
  initializeAuth: () => void

  /**
   * Optional helper used for guest detection in legacy flows.
   */
  currentUserIdOrGuestId?: () => string | null

  [key: string]: unknown
}

export type UserUseCases = {
  [key: string]: unknown
}

export type GuestUseCases = {
  hasAcceptedGuestTerms?: () => boolean
  isGuestMode?: () => boolean
  [key: string]: unknown
}

/**
 * Type representing weight-related use-cases.
 * Derived from the factory return type for consistency.
 */
export type WeightUseCases = ReturnType<typeof createWeightUseCases>

/**
 * Central DI container shape used by UI layer.
 *
 * Notes:
 * - Prefer exposing factories or plain objects; avoid embedding ephemeral UI
 *   state (signals) inside the container.
 * - Tests/SSR can call `createContainer(overrides)` to replace implementations.
 */
export type Container = {
  authUseCases: AuthUseCases
  userUseCases: UserUseCases
  guestUseCases: GuestUseCases

  /**
   * Weight-related use-cases (CRUD, cache, realtime).
   * Access via `useContainer().weightUseCases` in UI components.
   */
  weightUseCases?: WeightUseCases

  /**
   * Optional lifecycle hook for realtime or other infra that must be started
   * when the app boots (Providers may call this if present).
   */
  initializeWeightRealtime?: () => void

  [key: string]: unknown
}

/**
 * Create a container with sane defaults. Callers may provide partial overrides
 * to replace concrete implementations (useful for tests and SSR).
 *
 * The returned container is intended to be created once and reused as the
 * Context value for the app. Avoid creating a new container on every render.
 */
export function createContainer(
  overrides: Partial<Container> = {},
): Readonly<Container> {
  // Create default implementations using factories. These defaults are plain
  // objects (not signals) and are safe to reuse as the container's defaults.
  // Consumers and tests can override any of these via `overrides`.
  const defaultUserUseCases = createUserUseCases({
    repository: () => createSupabaseUserRepository(),
  })

  const defaultAuthUseCases: AuthUseCases = createAuthUseCases({
    userUseCases: () => defaultUserUseCases,
  })

  // Default weight use-cases (uses the global useCases for auth/guest dependencies)
  const defaultWeightUseCases = createWeightUseCases()

  const base: Container = {
    authUseCases: defaultAuthUseCases,
    userUseCases: defaultUserUseCases,
    guestUseCases: {},
    weightUseCases: defaultWeightUseCases,
    initializeWeightRealtime: undefined,
  }

  // Merge defaults with overrides. The result satisfies `Container`.
  const merged: Container = {
    ...base,
    ...overrides,
  }

  // Freeze to discourage accidental mutation at runtime.
  Object.freeze(merged)

  return merged
}

/**
 * Solid context holding the container instance.
 * Consumers should call `useContainer()` to access services.
 */
const ContainerContext = createContext<Readonly<Container> | null>(null)

/**
 * Provider component that exposes the app container.
 *
 * Usage:
 * const container = createContainer({ authUseCases: myAuth })
 * <ContainerProvider value={container}>{children}</ContainerProvider>
 *
 * Note: pass a stable container instance (do not recreate it on each render).
 */
/* eslint-disable solid/reactivity */
export function ContainerProvider(props: {
  value: Readonly<Container>
  children?: JSXElement
}) {
  return (
    <ContainerContext.Provider value={props.value}>
      {props.children}
    </ContainerContext.Provider>
  )
}
/* eslint-enable solid/reactivity */

/**
 * Hook to access the current container. Throws when used without a provider.
 *
 * Prefer passing explicit dependencies into domain/use-case factories rather
 * than calling `useContainer()` deep inside pure domain logic.
 */
export function useContainer(): Readonly<Container> {
  const ctx = useContext(ContainerContext)
  if (!ctx) {
    throw new Error(
      'Container not provided. Wrap the app with <ContainerProvider value={createContainer(...)}/>.',
    )
  }
  return ctx
}

/**
 * Small helper to create a test container quickly. Tests should explicitly
 * override only the services they need.
 */
export function createTestContainer(
  overrides: Partial<Container> = {},
): Readonly<Container> {
  const testAuth: AuthUseCases = {
    initializeAuth: () => {
      /* no-op */
    },
    currentUserIdOrGuestId: () => null,
  }

  return createContainer({
    authUseCases: testAuth,
    userUseCases: {},
    guestUseCases: {},
    ...overrides,
  })
}
