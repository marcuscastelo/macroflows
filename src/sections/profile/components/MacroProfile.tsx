import { Show } from 'solid-js'

import { useContainer } from '~/di/container'
import { CARD_BACKGROUND_COLOR, CARD_STYLE } from '~/modules/theme/constants'
import { MacroTarget } from '~/sections/macro-nutrients/components/MacroTargets'

export function MacroProfileSettings() {
  const useCases = useContainer()
  const macroProfileState = useCases.macroProfileState()

  return (
    <div class={`${CARD_BACKGROUND_COLOR} ${CARD_STYLE}`}>
      <Show
        when={useCases.weightUseCases().latest()}
        fallback={
          <h1>Não há pesos registrados, o perfil não pode ser calculado</h1>
        }
      >
        {(weight) => (
          <Show
            when={macroProfileState.latestMacroProfile()}
            fallback={<h1>Não há perfil macro registrado</h1>}
          >
            {(latestMacroProfile) => (
              <MacroTarget
                weight={() => weight().weight}
                currentProfile={latestMacroProfile}
                previousMacroProfile={macroProfileState.previousMacroProfile}
                mode="edit"
              />
            )}
          </Show>
        )}
      </Show>
    </div>
  )
}
