import { For, Show, Suspense } from 'solid-js'

import { useCases } from '~/di/useCases'
import { insertBodyMeasure } from '~/modules/measure/application/usecases/measureCrud'
import {
  bodyMeasures,
  refetchBodyMeasures,
} from '~/modules/measure/application/usecases/measureState'
import { createNewBodyMeasure } from '~/modules/measure/domain/measure'
import { CARD_BACKGROUND_COLOR, CARD_STYLE } from '~/modules/theme/constants'
import { showError } from '~/modules/toast/application/toastManager'
import { MeasureField } from '~/sections/common/components/MeasureField'
import { useFloatField } from '~/sections/common/hooks/useField'
import { BodyMeasureChart } from '~/sections/profile/measure/components/BodyMeasureChart'
import { BodyMeasureView } from '~/sections/profile/measure/components/BodyMeasureView'

export function BodyMeasuresEvolution() {
  const heightField = useFloatField()
  const waistField = useFloatField()
  const hipField = useFloatField()
  const neckField = useFloatField()

  const isMissingFields = () =>
    [heightField, waistField, hipField, neckField].some(
      (field) => field.value() === undefined,
    )

  const handleAddMeasures = (
    bodyMeasureProps: Parameters<typeof createNewBodyMeasure>[0],
  ) => {
    if (isMissingFields()) {
      showError('Medidas inválidas: preencha todos os campos')
      return
    }

    const newBodyMeasure = createNewBodyMeasure(bodyMeasureProps)
    void insertBodyMeasure(newBodyMeasure).then(refetchBodyMeasures)
  }

  return (
    <>
      <div class={`${CARD_BACKGROUND_COLOR} ${CARD_STYLE}`}>
        <h5 class={'mx-auto mb-5 text-center text-3xl font-bold'}>
          Progresso das medidas
        </h5>
        <div class="mx-5 lg:mx-20 pb-10">
          <MeasureField label="Altura" field={heightField} />
          <MeasureField label="Cintura" field={waistField} />
          <MeasureField label="Quadril" field={hipField} />
          <MeasureField label="Pescoço" field={neckField} />

          <button
            class="btn cursor-pointer uppercase btn-primary no-animation w-full"
            type="button"
            onClick={() => {
              const authUseCases = useCases.authUseCases()
              const userId = authUseCases.currentUserIdOrGuestId()

              handleAddMeasures({
                user_id: userId,
                height: heightField.value() ?? 0,
                waist: waistField.value() ?? 0,
                hip: hipField.value() ?? 0,
                neck: neckField.value() ?? 0,
                target_timestamp: new Date(Date.now()),
              })
            }}
          >
            Adicionar medidas
          </button>
        </div>

        <Suspense
          fallback={
            <div class="text-center text-gray-400 py-8">
              Carregando medidas...
            </div>
          }
        >
          <Show when={bodyMeasures()}>
            {(measures) => (
              <>
                <BodyMeasureChart measures={measures} />
                <div class="mx-5 lg:mx-20 pb-10">
                  <For
                    each={[...measures()].reverse().slice(0, 10)}
                    fallback={<>Não há medidas registradas</>}
                  >
                    {(bodyMeasure) => (
                      <BodyMeasureView
                        measure={bodyMeasure}
                        onRefetchBodyMeasures={refetchBodyMeasures}
                      />
                    )}
                  </For>
                </div>
              </>
            )}
          </Show>
        </Suspense>
      </div>
    </>
  )
}
