import { createEffect, createSignal, Show, untrack } from 'solid-js'

import {
  signIn,
  signOut,
} from '~/modules/auth/application/services/authService'
import {
  getCurrentUser,
  isAuthenticated,
} from '~/modules/auth/application/store/authState'
import { dayUseCases } from '~/modules/diet/day-diet/application/usecases/dayUseCases'
import {
  createNewDayDiet,
  type DayDiet,
  promoteDayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { createItem, type Item } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  createNewMeal,
  type Meal,
  promoteMeal,
} from '~/modules/diet/meal/domain/meal'
import { showSuccess } from '~/modules/toast/application/toastManager'
import { TestChart } from '~/sections/common/components/charts/TestChart'
import { FloatInput } from '~/sections/common/components/FloatInput'
import { EANIcon } from '~/sections/common/components/icons/EANIcon'
import { LoadingRing } from '~/sections/common/components/LoadingRing'
import { PageLoading } from '~/sections/common/components/PageLoading'
import ToastTest from '~/sections/common/components/ToastTest'
import { Providers } from '~/sections/common/context/Providers'
import { useFloatField } from '~/sections/common/hooks/useField'
import { Datepicker } from '~/sections/datepicker/components/Datepicker'
import { type DateValueType } from '~/sections/datepicker/types'
import DayMacros from '~/sections/day-diet/components/DayMacros'
import { ItemView } from '~/sections/item/components/ItemView'
import { TemplateSearchModal } from '~/sections/search/components/TemplateSearchModal'
import {
  openConfirmModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'
import { openEditModal } from '~/shared/modal/helpers/modalHelpers'
import { generateId } from '~/shared/utils/idUtils'
import { logging } from '~/shared/utils/logging'

function GoogleLoginButton() {
  const handleLogin = async () => {
    try {
      await signIn({ provider: 'google', redirectTo: window.location.origin })
    } catch (error) {
      logging.error('TestApp login error:', error)
    }
  }

  return (
    <button class="btn btn-primary" onClick={() => void handleLogin()}>
      Login with Google (Test) [{getCurrentUser()?.id ?? 'not logged in'}]
    </button>
  )
}

function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      logging.error('TestApp logout error:', error)
    }
  }

  return (
    <button class="btn btn-secondary" onClick={() => void handleLogout()}>
      Logout
    </button>
  )
}

function UserInfo() {
  return (
    <Show when={isAuthenticated} fallback="not auth">
      <div class="p-4 border rounded-md">
        <p>User: {getCurrentUser()?.email}</p>
        <LogoutButton />
      </div>
    </Show>
  )
}

export default function TestApp() {
  const [_, setItemEditModalVisible] = createSignal(false)

  const [item1] = createSignal<Item>(
    createItem({
      id: generateId(),
      name: 'Teste',
      quantity: 100,
      reference: {
        type: 'food',
        id: 31606,
        macros: createMacroNutrients({
          carbs: 10,
          protein: 12,
          fat: 10,
        }),
      },
    }),
  )

  const [item2, setItem2] = createSignal<Item>(
    createItem({
      id: generateId(),
      name: 'Teste',
      quantity: 100,
      reference: {
        type: 'group',
        children: [],
      },
    }),
  )

  createEffect(() => {
    setItem2({
      ...untrack(item2),
      reference: {
        type: 'group',
        children: [item1()],
      },
    })
  })

  const [meal, setMeal] = createSignal<Meal>(
    promoteMeal(
      createNewMeal({
        name: 'Teste',
        items: [],
      }),
      { id: 1 },
    ),
  )

  createEffect(() => {
    setMeal({
      ...untrack(meal),
      items: [],
    })
  })

  const [dayDiet, setDayDiet] = createSignal<DayDiet>(
    promoteDayDiet(
      createNewDayDiet({
        meals: [],
        user_id: '3',
        target_day: '2023-11-02',
      }),
      { id: 1 },
    ),
  )

  createEffect(() => {
    setDayDiet({
      ...untrack(dayDiet),
      meals: [meal()],
    })
  })

  // const [EAN, setEAN] = createSignal('')
  // const [food, setFood] = createSignal<Food | null>(null)
  return (
    <>
      <Providers>
        <DayMacros
          dayDiet={
            dayUseCases.currentDayDiet() ??
            promoteDayDiet(
              createNewDayDiet({
                meals: [],
                user_id: '3',
                target_day: '2023-11-02',
              }),
              { id: 1 },
            )
          }
        />
        {/* Auth */}
        <details open>
          <summary class="text-lg cursor-pointer select-none">Auth</summary>
          <div class="pl-4 flex flex-col gap-2">
            <GoogleLoginButton />
            <UserInfo />
          </div>
        </details>

        {/* Modals */}
        <details open>
          <summary class="text-lg cursor-pointer select-none">Modals</summary>
          <div class="pl-4 flex flex-col gap-2">
            {' '}
            <TestModal />
            <TestConfirmModal />
            <button
              class="btn cursor-pointer uppercase"
              onClick={() => {
                openContentModal(
                  () => (
                    <TemplateSearchModal
                      targetName="Teste"
                      onNewItem={() => {
                        logging.debug('New unified item added')
                      }}
                      onFinish={() => {}}
                      onClose={() => {}}
                    />
                  ),
                  {
                    title: 'Buscar alimentos',
                  },
                )
              }}
            >
              Open Template Search Modal
            </button>
            <button
              class="btn cursor-pointer uppercase"
              onClick={() => {
                setItemEditModalVisible(true)
              }}
            >
              setItemEditModalVisible
            </button>
          </div>
        </details>

        {/* Item Group & List */}
        <details>
          <summary class="text-lg cursor-pointer select-none">
            Item Group & List
          </summary>
          <div class="pl-4 flex flex-col gap-2">
            <h1>ItemListView (legacy test)</h1>
            {/* <ItemListView
              items={() => group().items.map(itemToItem)}
              mode="edit"
              handlers={{
                onClick: () => {
                  setItemEditModalVisible(true)
                },
              }}
            /> */}
            <h1>ItemView (ItemGroup test)</h1>
            <ItemView
              item={item2}
              handlers={{
                onEdit: () => {
                  setItemEditModalVisible(true)
                },
                onCopy: (item) => {
                  logging.debug('Copy item:', item)
                },
              }}
            />
          </div>
        </details>

        {/* Datepicker */}
        <details>
          <summary class="text-lg cursor-pointer select-none">
            Datepicker
          </summary>
          <div class="pl-4 flex flex-col gap-2">
            <Datepicker
              asSingle={true}
              useRange={false}
              readOnly={true}
              displayFormat="DD/MM/YYYY"
              value={{
                startDate: dayUseCases.targetDay(),
                endDate: dayUseCases.targetDay(),
              }}
              onChange={(value: DateValueType) => {
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                dayUseCases.setTargetDay(value?.startDate as string)
              }}
            />
          </div>
        </details>

        {/* Toasts */}
        <details>
          <summary class="text-lg cursor-pointer select-none">Toasts</summary>
          <div class="pl-4 flex flex-col gap-2 items-center justify-center mx-auto min-h-[20vh] max-w-[33vw]">
            <ToastTest />
          </div>
        </details>

        {/* Outros */}
        <details>
          <summary class="text-lg cursor-pointer select-none">Outros</summary>
          <div
            class="pl-4 flex flex-col gap-2 items-center justify-center mx-auto"
            style={{ 'min-height': '33vh', 'max-width': '33vw' }}
          >
            <EANIcon />
            <TestChart />
            <TestField />
            <DayMacros
              dayDiet={
                dayUseCases.currentDayDiet() ??
                promoteDayDiet(
                  createNewDayDiet({
                    meals: [],
                    user_id: '3',
                    target_day: '2023-11-02',
                  }),
                  { id: 1 },
                )
              }
            />
            <LoadingRing />
            <PageLoading message="Carregando bugigangas" />
          </div>
        </details>
      </Providers>
    </>
  )
}

function TestField() {
  const testField = useFloatField(() => 0, {
    decimalPlaces: 2,
  })

  return <FloatInput field={testField} />
}

function TestModal() {
  return (
    <button
      class="btn cursor-pointer uppercase"
      onClick={() => {
        openEditModal(
          () => (
            <div class="space-y-4">
              <h1>This is a test modal</h1>
              <button
                class="btn cursor-pointer uppercase btn-primary"
                onClick={() => {
                  // Modal will be closed by the unified system
                }}
              >
                Close
              </button>
            </div>
          ),
          {
            title: 'Test Modal',
          },
        )
      }}
    >
      Open modal!
    </button>
  )
}

function TestConfirmModal() {
  return (
    <button
      onClick={() => {
        openConfirmModal('Teste123', {
          title: 'Teste123',
          confirmText: 'Teste123',
          onConfirm: () => {
            showSuccess('Teste123')
          },
        })
      }}
    >
      {' '}
      Open confirm modal{' '}
    </button>
  )
}
