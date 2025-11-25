import { Show } from 'solid-js'

import {
  latestMacroProfile,
  previousMacroProfile,
} from '~/modules/diet/macro-profile/application/usecases/macroProfileState'
import { CARD_BACKGROUND_COLOR, CARD_STYLE } from '~/modules/theme/constants'
import { weightUseCases } from '~/modules/weight/application/weight/weightUseCases'
import { MacroTarget } from '~/sections/macro-nutrients/components/MacroTargets'

export function MacroProfileSettings() {
  return (
    <div class={`${CARD_BACKGROUND_COLOR} ${CARD_STYLE}`}>
      <Show
        when={weightUseCases.latest()}
        fallback={
          <h1>Não há pesos registrados, o perfil não pode ser calculado</h1>
        }
      >
        {(weight) => (
          <Show
            when={latestMacroProfile()}
            fallback={<h1>Não há perfil macro registrado</h1>}
          >
            {(latestMacroProfile) => (
              <MacroTarget
                weight={() => weight().weight}
                currentProfile={latestMacroProfile}
                previousMacroProfile={previousMacroProfile}
                mode="edit"
              />
            )}
          </Show>
        )}
      </Show>
    </div>
  )
}
