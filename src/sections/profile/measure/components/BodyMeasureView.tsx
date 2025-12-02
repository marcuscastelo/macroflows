import {
  deleteBodyMeasure,
  updateBodyMeasure,
} from '~/modules/measure/application/usecases/measureCrud'
import {
  type BodyMeasure,
  createNewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { showError } from '~/modules/toast/application/toastManager'
import { Capsule } from '~/sections/common/components/capsule/Capsule'
import { CapsuleContent } from '~/sections/common/components/capsule/CapsuleContent'
import { FloatInput } from '~/sections/common/components/FloatInput'
import { TrashIcon } from '~/sections/common/components/icons/TrashIcon'
import { useDateField, useFloatField } from '~/sections/common/hooks/useField'
import { type DateValueType } from '~/sections/datepicker/types'
import { formatError } from '~/shared/formatError'
import { openConfirmModal } from '~/shared/modal/helpers/modalHelpers'
import { lazyImport } from '~/shared/solid/lazyImport'
import { normalizeDateToLocalMidnightPlusOne } from '~/shared/utils/date/normalizeDateToLocalMidnightPlusOne'
import { logging } from '~/shared/utils/logging'

const { Datepicker } = lazyImport(
  () => import('~/sections/datepicker/components/Datepicker'),
  ['Datepicker'],
)

/**
 * Renders a capsule view for editing and saving a single BodyMeasure.
 *
 * @param props.measure - The body measure to display and edit
 * @param props.onRefetchBodyMeasures - Callback to refetch body measures after update/delete
 */
export function BodyMeasureView(props: {
  measure: BodyMeasure
  onRefetchBodyMeasures: () => unknown
}) {
  const dateField = useDateField(() => props.measure.target_timestamp, {
    fallback: () => new Date(),
  })
  const heightField = useFloatField(() => props.measure.height)
  const waistField = useFloatField(() => props.measure.waist)
  const hipField = useFloatField(() => props.measure.hip)
  const neckField = useFloatField(() => props.measure.neck)

  const handleSave = ({
    date,
    height,
    waist,
    hip,
    neck,
  }: {
    date: Date
    height: number | undefined
    waist: number | undefined
    hip: number | undefined
    neck: number | undefined
  }) => {
    if (
      height === undefined ||
      waist === undefined ||
      hip === undefined ||
      neck === undefined
    ) {
      showError('Preencha todos os campos de medidas')
      return
    }
    const afterUpdate = () => {
      props.onRefetchBodyMeasures()
    }
    updateBodyMeasure(
      props.measure.id,
      createNewBodyMeasure({
        ...props.measure,
        height,
        waist,
        hip,
        neck,
        target_timestamp: date,
      }),
    )
      .then(afterUpdate)
      .catch((error) => {
        logging.error('BodyMeasureView measure update error:', error)
        showError(`Erro ao atualizar medida: ${formatError(error)}`)
      })
  }

  const handleDelete = () => {
    openConfirmModal(
      'Tem certeza que deseja excluir esta medida? Esta ação não pode ser desfeita.',
      {
        title: 'Confirmar exclusão',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        onConfirm: () => {
          const measureId = props.measure.id
          const afterDelete = () => {
            props.onRefetchBodyMeasures()
          }
          deleteBodyMeasure(measureId)
            .then(afterDelete)
            .catch((error) => {
              logging.error('BodyMeasureView measure delete error:', error, {
                component: 'BodyMeasureView',
                measureId,
              })
              showError('Erro ao deletar: \n' + JSON.stringify(error, null, 2))
            })
        },
      },
    )
  }

  return (
    <Capsule
      leftContent={
        <CapsuleContent>
          <Datepicker
            value={{
              startDate: dateField.value(),
              endDate: dateField.value(),
            }}
            onChange={(value: DateValueType) => {
              if (value?.startDate === undefined || value.startDate === null) {
                showError(`Data inválida: ${JSON.stringify(value)}`)
                return
              }
              const date = normalizeDateToLocalMidnightPlusOne(value.startDate)
              dateField.setRawValue(date.toISOString())
              handleSave({
                date,
                height: heightField.value(),
                waist: waistField.value(),
                hip: hipField.value(),
                neck: neckField.value(),
              })
            }}
            displayFormat="DD/MM/YYYY HH:mm"
            asSingle={true}
            useRange={false}
            readOnly={true}
            containerClassName="relative w-full text-gray-700"
            inputClassName="relative transition-all duration-300 py-2.5 pl-4 pr-14 w-full dark:bg-slate-700 dark:text-white/80 rounded-lg tracking-wide font-light text-sm placeholder-gray-400 bg-white focus:ring disabled:opacity-40 disabled:cursor-not-allowed border-none"
          />
        </CapsuleContent>
      }
      rightContent={
        <CapsuleContent>
          <div class="flex items-center justify-center sm:gap-10 px-2 w-full">
            <MeasureFields
              heightField={heightField}
              waistField={waistField}
              hipField={hipField}
              neckField={neckField}
              onSave={handleSave}
              getDate={dateField.value}
            />
          </div>
          <DeleteButton onDelete={handleDelete} />
        </CapsuleContent>
      }
      class={'mb-2'}
    />
  )
}

function MeasureFields(props: {
  heightField: ReturnType<typeof useFloatField>
  waistField: ReturnType<typeof useFloatField>
  hipField: ReturnType<typeof useFloatField>
  neckField: ReturnType<typeof useFloatField>
  onSave: (field: {
    date: Date
    height: number | undefined
    waist: number | undefined
    hip: number | undefined
    neck: number | undefined
  }) => void
  getDate: () => Date
}) {
  return (
    <div class="flex flex-col">
      <div class="flex">
        <span class="my-auto">Altura:</span>
        <FloatInput
          field={props.heightField}
          class="input bg-transparent text-center btn-ghost px-0 shrink"
          style={{ width: '100%' }}
          onFocus={(event) => {
            event.target.select()
          }}
          onFieldCommit={(value) => {
            props.onSave({
              date: props.getDate(),
              height: value,
              waist: props.waistField.value(),
              hip: props.hipField.value(),
              neck: props.neckField.value(),
            })
          }}
        />
        <span class="my-auto flex-1 hidden sm:block">cm</span>
      </div>
      <div class="flex">
        <span class="my-auto">Cintura:</span>
        <FloatInput
          field={props.waistField}
          class="input bg-transparent text-center btn-ghost px-0 shrink"
          style={{ width: '100%' }}
          onFocus={(event) => {
            event.target.select()
          }}
          onFieldCommit={(value) => {
            props.onSave({
              date: props.getDate(),
              height: props.heightField.value(),
              waist: value,
              hip: props.hipField.value(),
              neck: props.neckField.value(),
            })
          }}
        />
        <span class="my-auto flex-1 hidden sm:block">cm</span>
      </div>
      <div class="flex">
        <span class="my-auto">Quadril:</span>
        <FloatInput
          field={props.hipField}
          class="input bg-transparent text-center btn-ghost px-0 shrink"
          style={{ width: '100%' }}
          onFocus={(event) => {
            event.target.select()
          }}
          onFieldCommit={(value) => {
            props.onSave({
              date: props.getDate(),
              height: props.heightField.value(),
              waist: props.waistField.value(),
              hip: value,
              neck: props.neckField.value(),
            })
          }}
        />
        <span class="my-auto flex-1 hidden sm:block">cm</span>
      </div>
      <div class="flex">
        <span class="my-auto">Pescoço:</span>
        <FloatInput
          field={props.neckField}
          class="input bg-transparent text-center btn-ghost px-0 shrink"
          style={{ width: '100%' }}
          onFocus={(event) => {
            event.target.select()
          }}
          onFieldCommit={(value) => {
            props.onSave({
              date: props.getDate(),
              height: props.heightField.value(),
              waist: props.waistField.value(),
              hip: props.hipField.value(),
              neck: value,
            })
          }}
        />
        <span class="my-auto flex-1 hidden sm:block">cm</span>
      </div>
    </div>
  )
}

function DeleteButton(props: { onDelete: () => void }) {
  return (
    <button
      class="btn cursor-pointer uppercase btn-ghost my-auto"
      onClick={() => {
        props.onDelete()
      }}
    >
      <TrashIcon />
    </button>
  )
}
