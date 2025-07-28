import { type Accessor, createSignal } from 'solid-js'

import {
  dayDiets,
  fetchPreviousDayDiets,
  insertDayDiet,
  updateDayDiet,
} from '~/modules/diet/day-diet/application/dayDiet'
import {
  createNewDayDiet,
  type DayDiet,
} from '~/modules/diet/day-diet/domain/dayDiet'
import {
  showError,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { Button } from '~/sections/common/components/buttons/Button'
import {
  closeModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'
import { lazyImport } from '~/shared/solid/lazyImport'

const { CopyLastDayModal } = lazyImport(
  () => import('~/sections/day-diet/components/CopyLastDayModal'),
  ['CopyLastDayModal'],
)

export function CopyLastDayButton(props: {
  dayDiet: Accessor<DayDiet | undefined>
  selectedDay: string
}) {
  // Optimized: Lazy load previous days only when modal opens
  const [previousDays, setPreviousDays] = createSignal<readonly DayDiet[]>([])
  const [loadingPreviousDays, setLoadingPreviousDays] = createSignal(false)
  const [copyingDay, setCopyingDay] = createSignal<string | null>(null)
  const [copying, setCopying] = createSignal(false)

  // Load previous days on demand
  async function loadPreviousDays() {
    if (loadingPreviousDays()) return

    setLoadingPreviousDays(true)
    try {
      const days = await fetchPreviousDayDiets(
        currentUserId(),
        props.selectedDay,
        30,
      )
      setPreviousDays(days)
    } catch (error) {
      showError(
        error,
        { context: 'user-action' },
        'Erro ao carregar dias anteriores',
      )
      setPreviousDays([])
    } finally {
      setLoadingPreviousDays(false)
    }
  }

  async function handleCopy(day: string) {
    setCopyingDay(day)
    setCopying(true)
    const copyFrom = previousDays().find((d) => d.target_day === day)
    if (!copyFrom) {
      setCopying(false)
      showError('No matching previous day found to copy.', {
        context: 'user-action',
      })
      return
    }
    const allDays = dayDiets()
    const existing = allDays.find((d) => d.target_day === props.selectedDay)
    const newDay = createNewDayDiet({
      target_day: props.selectedDay,
      owner: copyFrom.owner,
      meals: copyFrom.meals,
    })
    try {
      if (existing) {
        await updateDayDiet(existing.id, newDay)
      } else {
        await insertDayDiet(newDay)
      }
      showSuccess('Dia copiado com sucesso!', { context: 'user-action' })
    } catch (e) {
      showError(e, { context: 'user-action' }, 'Erro ao copiar dia')
    } finally {
      setCopying(false)
      setCopyingDay(null)
    }
  }

  return (
    <>
      <Button
        class="btn-primary w-full mt-3 rounded px-4 py-2 font-bold text-white"
        onClick={() => {
          // Load previous days when modal opens (optimized)
          void loadPreviousDays()

          openContentModal(
            (modalId) => (
              <CopyLastDayModal
                previousDays={previousDays()}
                copying={copying()}
                copyingDay={copyingDay()}
                onCopy={(day) => {
                  void handleCopy(day)
                }}
                onClose={() => {
                  closeModal(modalId)
                  setCopyingDay(null)
                  setCopying(false)
                }}
              />
            ),
            {
              title: 'Copiar dia anterior',
            },
          )
        }}
      >
        Copiar dia anterior
      </Button>
    </>
  )
}
