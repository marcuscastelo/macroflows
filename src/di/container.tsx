import {
  createContext,
  createRoot,
  type InitializedResource,
  type JSXElement,
  onCleanup,
  untrack,
  useContext,
} from 'solid-js'

import {
  type AuthUseCases,
  createAuthUseCases,
} from '~/modules/auth/application/usecases/authUseCases'
import {
  type ClipboardUseCases,
  createClipboardUseCases,
} from '~/modules/clipboard/application/usecases/clipboardUseCases'
import {
  createDayUseCases,
  type DayUseCases,
} from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import {
  type CopyDayOperations,
  createCopyDayOperations,
} from '~/modules/diet/day-diet/application/usecases/useCopyDayOperations'
import { createDayDietRepository } from '~/modules/diet/day-diet/infrastructure/dayDietRepository'
import {
  createFoodCrud,
  type FoodCrud,
} from '~/modules/diet/food/application/usecases/foodCrud'
import { createSupabaseFoodRepository } from '~/modules/diet/food/infrastructure/api/infrastructure/supabase/supabaseFoodRepository'
import {
  createRecipeItemUseCases,
  type RecipeItemUseCases,
} from '~/modules/diet/item/application/recipeItemUseCases'
import { createMacroProfileCrudService } from '~/modules/diet/macro-profile/application/service/macroProfileCrudService'
import { createMacroProfileCacheStore } from '~/modules/diet/macro-profile/application/store/macroProfileCacheStore'
import {
  createMacroProfileState,
  type MacroProfileState,
} from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import {
  createMacroProfileUseCases,
  type MacroProfileUseCases,
} from '~/modules/diet/macro-profile/application/usecases/macroProfileUseCases'
import { createMacroProfileRepository } from '~/modules/diet/macro-profile/infrastructure/macroProfileRepository'
import {
  createMacroTargetUseCases,
  type MacroTargetUseCases,
} from '~/modules/diet/macro-target/application/macroTargetUseCases'
import {
  createMealUseCases,
  type MealUseCases,
} from '~/modules/diet/meal/application/meal'
import {
  createRecentFoodUseCases,
  type RecentFoodUseCases,
} from '~/modules/diet/recent-food/application/usecases/recentFoodUseCases'
import {
  createRecipeCrud,
  type RecipeCrud,
} from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { createRecipeRepository } from '~/modules/diet/recipe/infrastructure/recipeRepository'
import { type Template } from '~/modules/diet/template/domain/template'
import {
  createMeasureCrud,
  type MeasureCrud,
} from '~/modules/measure/application/usecases/measureCrud'
import {
  createMeasureState,
  type MeasureState,
} from '~/modules/measure/application/usecases/measureState'
import { type BodyMeasure } from '~/modules/measure/domain/measure'
import { createMeasureRepository } from '~/modules/measure/infrastructure/measureRepository'
import {
  createTelemetry,
  type TelemetryModule,
} from '~/modules/observability/application/telemetry'
import { createSentryService } from '~/modules/observability/infrastructure/sentry/sentry'
import {
  createProfile,
  type ProfileModule,
} from '~/modules/profile/application/profile'
import { createRecentFoodCrud } from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { createRecentFoodRepository } from '~/modules/recent-food/infrastructure/recentFoodRepository'
import {
  type CachedSearchCrud,
  createCachedSearchCrud,
} from '~/modules/search/application/usecases/cachedSearchCrud'
import { createCachedSearchRepository } from '~/modules/search/infrastructure/cachedSearchRepository'
import {
  createTemplateSearchState,
  type TemplateSearchState,
} from '~/modules/template-search/application/usecases/templateSearchState'
import {
  createUserUseCases,
  type UserUseCases,
} from '~/modules/user/application/usecases/userUseCases'
import { type NewUser } from '~/modules/user/domain/user'
import { type UserRepository } from '~/modules/user/domain/userRepository'
import { createGuestUserRepository } from '~/modules/user/infrastructure/guest/guestUserRepository'
import { createSupabaseUserRepository } from '~/modules/user/infrastructure/supabase/supabaseUserRepository'
import {
  createWeightChartSettings,
  type WeightChartSettings,
} from '~/modules/weight/application/chart/weightChartSettings'
import {
  createWeightChartUseCases,
  type WeightChartUseCases,
} from '~/modules/weight/application/chart/weightChartUseCases'
import {
  createWeightUseCases,
  type WeightUseCases,
} from '~/modules/weight/application/weight/usecases/weightUseCases'
import { createLocalStorageWeightChartPreferenceRepository } from '~/modules/weight/infrastructure/chart/localStorage/localStorageWeightChartPreferenceRepository'
import { createLocalStorageWeightCacheRepository } from '~/modules/weight/infrastructure/weight/localStorage/localStorageWeightCacheRepository'
import { createWeightRepository } from '~/modules/weight/infrastructure/weight/supabase/supabaseWeightRepository'
import { GUEST_USER_ID } from '~/shared/guest/guestConstants'
import {
  createGuestUseCases,
  type GuestUseCases,
} from '~/shared/guest/guestUseCases'

type ContainerInstances = {
  authUseCases: AuthUseCases
  clipboardUseCases: ClipboardUseCases
  copyDayOperations: CopyDayOperations
  dayUseCases: DayUseCases
  foodCrud: FoodCrud
  guestUseCases: GuestUseCases
  macroProfileState: MacroProfileState
  macroProfileUseCases: MacroProfileUseCases
  macroTargetUseCases: MacroTargetUseCases
  mealUseCases: MealUseCases
  measureCrud: MeasureCrud
  measureState: MeasureState
  profileUseCases: ProfileModule
  recentFoodUseCases: RecentFoodUseCases
  recipeCrud: RecipeCrud
  recipeItemUseCases: RecipeItemUseCases
  templateSearchState: TemplateSearchState
  telemetryUseCases: TelemetryModule
  userUseCases: UserUseCases
  weightChartSettings: WeightChartSettings
  weightChartUseCases: WeightChartUseCases
  weightUseCases: WeightUseCases
}

export type Container = {
  authUseCases: () => AuthUseCases
  clipboardUseCases: () => ClipboardUseCases
  copyDayOperations: () => CopyDayOperations
  dayUseCases: () => DayUseCases
  foodCrud: () => FoodCrud
  guestUseCases: () => GuestUseCases
  macroProfileState: () => MacroProfileState
  macroProfileUseCases: () => MacroProfileUseCases
  macroTargetUseCases: () => MacroTargetUseCases
  mealUseCases: () => MealUseCases
  measureCrud: () => MeasureCrud
  measureState: () => MeasureState
  profileUseCases: () => ProfileModule
  recentFoodUseCases: () => RecentFoodUseCases
  recipeCrud: () => RecipeCrud
  recipeItemUseCases: () => RecipeItemUseCases
  templateSearchState: () => TemplateSearchState
  telemetryUseCases: () => TelemetryModule
  userUseCases: () => UserUseCases
  weightChartSettings: () => WeightChartSettings
  weightChartUseCases: () => WeightChartUseCases
  weightUseCases: () => WeightUseCases
  initialize: () => void
  dispose: () => void
}

function createModeAwareUserRepository(deps: {
  isGuestMode: () => boolean
  guestRepository?: UserRepository
  supabaseRepository?: UserRepository
}): UserRepository {
  const guestRepository = deps.guestRepository ?? createGuestUserRepository()
  const supabaseRepository =
    deps.supabaseRepository ?? createSupabaseUserRepository()

  const getRepository = () =>
    deps.isGuestMode() ? guestRepository : supabaseRepository

  return {
    fetchUser: async (userId) => await getRepository().fetchUser(userId),
    insertUser: async (newUser: NewUser) =>
      await getRepository().insertUser(newUser),
    updateUser: async (userId, newUser) =>
      await getRepository().updateUser(userId, newUser),
    deleteUser: async (userId) => await getRepository().deleteUser(userId),
  }
}

const sharedSentryService = createSentryService()

function createAppTelemetry(): TelemetryModule {
  return createTelemetry({
    sentryService: sharedSentryService,
  })
}

export function createContainer(
  overrides: Partial<ContainerInstances> = {},
): Readonly<Container> {
  return createRoot((dispose) => {
    const telemetryUseCases =
      overrides.telemetryUseCases ?? createAppTelemetry()

    let guestUseCasesRef: GuestUseCases | null = overrides.guestUseCases ?? null

    const userRepository = createModeAwareUserRepository({
      isGuestMode: () => guestUseCasesRef?.isGuestMode() ?? false,
    })

    const userUseCases =
      overrides.userUseCases ??
      createUserUseCases({
        repository: () => userRepository,
      })

    const authUseCases =
      overrides.authUseCases ??
      createAuthUseCases({
        userUseCases: () => userUseCases,
      })

    const guestUseCases =
      overrides.guestUseCases ??
      createGuestUseCases({
        authUseCases: () => authUseCases,
      })
    guestUseCasesRef = guestUseCases

    const recipeRepository = createRecipeRepository()
    const cachedSearchRepository = createCachedSearchRepository()
    const foodRepository = createSupabaseFoodRepository()
    const recentFoodRepository = createRecentFoodRepository()
    const measureRepository = createMeasureRepository()
    const weightCacheRepository = createLocalStorageWeightCacheRepository()
    const weightRepository = createWeightRepository({
      isGuestMode: () => guestUseCases.isGuestMode(),
    })
    const weightChartPreferenceRepository =
      createLocalStorageWeightChartPreferenceRepository()

    const recipeCrud =
      overrides.recipeCrud ??
      createRecipeCrud({
        repository: () => recipeRepository,
      })

    const macroProfileCache = createMacroProfileCacheStore()
    const macroProfileRepository = createMacroProfileRepository({
      isGuestMode: () => guestUseCases.isGuestMode(),
    })
    const macroProfileCrudService = createMacroProfileCrudService({
      repository: macroProfileRepository,
    })
    const macroProfileUseCases =
      overrides.macroProfileUseCases ??
      createMacroProfileUseCases({
        crudService: macroProfileCrudService,
        cache: macroProfileCache,
      })
    const macroProfileState =
      overrides.macroProfileState ??
      createMacroProfileState({
        getCurrentUserIdOrGuestId: () => authUseCases.currentUserIdOrGuestId(),
        fetchUserMacroProfiles: (userId) =>
          macroProfileCrudService.fetchUserMacroProfiles(userId),
        cache: macroProfileCache,
      })

    const dayUseCases =
      overrides.dayUseCases ??
      createDayUseCases({
        authUseCases: () => authUseCases,
        dayRepository: createDayDietRepository({
          isGuestMode: () => guestUseCases.isGuestMode(),
        }),
      })

    const clipboardUseCases =
      overrides.clipboardUseCases ?? createClipboardUseCases()

    const profileUseCases =
      overrides.profileUseCases ??
      createProfile({
        userUseCases: () => userUseCases,
      })

    const weightUseCases =
      overrides.weightUseCases ??
      createWeightUseCases({
        authDeps: {
          getCurrentUserIdOrGuestId: () =>
            authUseCases.currentUserIdOrGuestId(),
          isGuestMode: () => guestUseCases.isGuestMode(),
        },
        weightCacheRepository,
        weightRepository,
      })

    const weightChartSettings =
      overrides.weightChartSettings ??
      createWeightChartSettings({
        repository: weightChartPreferenceRepository,
      })

    const weightChartUseCases =
      overrides.weightChartUseCases ??
      createWeightChartUseCases({
        getDesiredWeight: () => userUseCases.currentUser()?.desired_weight ?? 0,
        getDiet: () => userUseCases.currentUser()?.diet ?? 'cut',
        weightUseCases,
      })

    const macroTargetUseCases =
      overrides.macroTargetUseCases ??
      createMacroTargetUseCases({
        weightUseCases,
        userMacroProfiles: macroProfileState.userMacroProfiles,
      })

    const mealUseCases =
      overrides.mealUseCases ??
      createMealUseCases({
        dayUseCases,
      })

    const copyDayOperations =
      overrides.copyDayOperations ??
      createCopyDayOperations({
        dayUseCases: () => dayUseCases,
      })

    const measureCrud =
      overrides.measureCrud ??
      createMeasureCrud({
        measureRepository,
      })
    const measureState =
      overrides.measureState ??
      createMeasureState({
        getCurrentUserIdOrGuestId: () => authUseCases.currentUserIdOrGuestId(),
        fetchUserBodyMeasures: (userId) =>
          measureCrud.fetchUserBodyMeasures(userId),
      })

    const recentFoodCrud = createRecentFoodCrud({
      recentFoodRepository,
    })
    const recentFoodUseCases =
      overrides.recentFoodUseCases ??
      createRecentFoodUseCases({
        getCurrentUserIdOrGuestId: () => authUseCases.currentUserIdOrGuestId(),
        recentFoodCrud,
      })
    const cachedSearchCrud: CachedSearchCrud = createCachedSearchCrud({
      repository: cachedSearchRepository,
    })
    const foodCrud =
      overrides.foodCrud ??
      createFoodCrud({
        repository: foodRepository,
        cachedSearchCrud,
      })
    const recipeItemUseCases =
      overrides.recipeItemUseCases ??
      createRecipeItemUseCases({
        fetchRecipeById: (recipeId) => recipeCrud.fetchRecipeById(recipeId),
      })
    const templateSearchState =
      overrides.templateSearchState ??
      createTemplateSearchState({
        getCurrentUserIdOrGuestId: () => authUseCases.currentUserIdOrGuestId(),
        getFavoriteFoods: () =>
          userUseCases.currentUser()?.favorite_foods ?? [],
        recentFoodCrud,
        foodCrud,
        recipeCrud,
      })

    const container: Container = {
      telemetryUseCases: () => telemetryUseCases,
      authUseCases: () => authUseCases,
      userUseCases: () => userUseCases,
      guestUseCases: () => guestUseCases,
      dayUseCases: () => dayUseCases,
      foodCrud: () => foodCrud,
      clipboardUseCases: () => clipboardUseCases,
      profileUseCases: () => profileUseCases,
      weightUseCases: () => weightUseCases,
      weightChartSettings: () => weightChartSettings,
      weightChartUseCases: () => weightChartUseCases,
      recipeCrud: () => recipeCrud,
      recipeItemUseCases: () => recipeItemUseCases,
      macroProfileUseCases: () => macroProfileUseCases,
      macroProfileState: () => macroProfileState,
      macroTargetUseCases: () => macroTargetUseCases,
      mealUseCases: () => mealUseCases,
      copyDayOperations: () => copyDayOperations,
      templateSearchState: () => templateSearchState,
      measureCrud: () => measureCrud,
      measureState: () => measureState,
      recentFoodUseCases: () => recentFoodUseCases,
      initialize: () => {
        guestUseCases.initializeGuestMode()
        authUseCases.initializeAuth()
        weightUseCases.initializeRealtime()
      },
      dispose,
    }

    return Object.freeze(container)
  })
}

const ContainerContext = createContext<Readonly<Container> | null>(null)

export function ContainerProvider(props: {
  value: Readonly<Container>
  children?: JSXElement
}) {
  const value = untrack(() => props.value)

  onCleanup(() => {
    value.dispose()
  })

  return (
    <ContainerContext.Provider value={value}>
      {props.children}
    </ContainerContext.Provider>
  )
}

export function useContainer(): Readonly<Container> {
  const ctx = useContext(ContainerContext)
  if (ctx === null) {
    throw new Error(
      'Container not provided. Wrap the app with <ContainerProvider value={createContainer(...)}/>.',
    )
  }

  return ctx
}

let bootstrapTelemetry: TelemetryModule | null = null

function getBootstrapTelemetry() {
  if (bootstrapTelemetry === null) {
    bootstrapTelemetry = createAppTelemetry()
  }

  return bootstrapTelemetry
}

export function initializeAppTelemetry(type: 'server' | 'client'): void {
  getBootstrapTelemetry().initializeTelemetry(type)
}

export function createTestContainer(
  overrides: Partial<ContainerInstances> = {},
): Readonly<Container> {
  const createReadyResource = <T,>(value: T): InitializedResource<T> => {
    const state: InitializedResource<T>['state'] = 'ready'
    const loading = false as const

    return Object.assign(() => value, {
      state,
      loading,
      error: undefined,
      latest: value,
    })
  }

  const testAuth: AuthUseCases = {
    initializeAuth: () => {
      /* no-op */
    },
    currentUserIdOrGuestId: () => GUEST_USER_ID,
    getCurrentUser: () => null,
    isAuthenticated: () => false,
    isAuthLoading: () => false,
    loadInitialSession: async () => {
      /* no-op */
    },
    signIn: async () => {
      /* no-op */
    },
    signOut: async () => {
      /* no-op */
    },
  }

  const guestUseCases: GuestUseCases = {
    initializeGuestMode: () => {
      /* no-op */
    },
    isGuestMode: () => false,
    setGuestModeEnabled: () => {
      /* no-op */
    },
    hasAcceptedGuestTerms: () => false,
    acceptGuestTerms: () => {
      /* no-op */
    },
    revokeGuestTerms: () => {
      /* no-op */
    },
    enterGuestMode: () => {
      /* no-op */
    },
    exitGuestMode: () => {
      /* no-op */
    },
  }

  const measureState: MeasureState = {
    bodyMeasures: createReadyResource<readonly BodyMeasure[]>([]),
    refetchBodyMeasures: () => undefined,
  }

  const weightChartSettings: WeightChartSettings = {
    weightChartType: () => 'all',
    setWeightChartType: () => {
      /* no-op */
    },
  }

  const templateSearchState: TemplateSearchState = {
    templateSearch: () => '',
    setTemplateSearch: () => {
      /* no-op */
    },
    debouncedSearch: () => '',
    templateSearchTab: () => 'hidden',
    setTemplateSearchTab: () => {
      /* no-op */
    },
    debouncedTab: () => 'hidden',
    templates: createReadyResource<readonly Template[]>([]),
    refetchTemplates: () => undefined,
  }

  return createContainer({
    authUseCases: testAuth,
    guestUseCases,
    measureState,
    templateSearchState,
    weightChartSettings,
    ...overrides,
  })
}
