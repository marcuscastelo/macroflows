import { Show } from 'solid-js'

import type { SwitchSuggestion } from '~/shared/error/switchToStable'

type SwitchToStablePromptProps = {
  suggestion: SwitchSuggestion
  onSwitch: () => void
  onDismiss: () => void
  onSecondary?: () => void
  stableUrl: string
  details?: string
}

const reasonCopy: Record<SwitchSuggestion['reason'], string> = {
  network:
    'Detectamos um erro de rede nesta versão canary/rc. Abrir a versão estável pode resolver.',
  server:
    'O servidor canary respondeu com erro. A versão estável costuma estar mais estável.',
  runtime:
    'Encontramos um erro interno nesta versão canary/rc. Tente continuar na versão estável.',
  recurring:
    'Este erro aconteceu mais de uma vez agora há pouco. Sugerimos usar a versão estável.',
  'channel-mismatch':
    'Você já está na versão estável. Recarregue para continuar.',
  unknown:
    'Ocorreu um erro nesta versão canary/rc. Migrar para a versão estável pode destravar o fluxo.',
}

export const switchToStableCopy = reasonCopy

export const secondaryLabelForReason = (
  reason: SwitchSuggestion['reason'],
): string => (reason === 'network' ? 'Recarregar' : 'Reportar')

export function SwitchToStablePrompt(props: SwitchToStablePromptProps) {
  const copy = () =>
    switchToStableCopy[props.suggestion.reason] || switchToStableCopy.unknown
  const secondaryLabel = () => secondaryLabelForReason(props.suggestion.reason)

  return (
    <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div class="w-full max-w-3xl border border-slate-800 bg-slate-900/80 rounded-2xl shadow-2xl p-8 space-y-4">
        <p class="text-xs uppercase tracking-wide text-blue-200">
          Sessão em canary / rc
        </p>
        <h1 class="text-3xl font-semibold text-white">
          Ocorreu um erro nesta versão
        </h1>
        <p class="text-slate-200 leading-relaxed">{copy()}</p>
        <Show when={props.details !== undefined}>
          <div class="rounded-lg bg-slate-800/70 border border-slate-700 px-4 py-3 text-sm text-slate-200">
            {props.details}
          </div>
        </Show>
        <div class="rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-sm text-slate-200">
          <p class="font-semibold text-white">Para onde vamos?</p>
          <p class="break-all text-slate-300">{props.stableUrl}</p>
          <p class="text-xs text-slate-400 mt-1">
            Abriremos o mesmo caminho na versão estável.
          </p>
        </div>
        <div class="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            class="btn btn-primary px-5"
            data-testid="switch-to-stable"
            onClick={() => {
              props.onSwitch()
            }}
          >
            Trocar de versão
          </button>
          <button
            type="button"
            class="btn px-4"
            data-testid="secondary-action"
            onClick={() => {
              if (props.onSecondary !== undefined) props.onSecondary()
            }}
          >
            {secondaryLabel()}
          </button>
          <button
            type="button"
            class="btn btn-ghost text-slate-300"
            data-testid="stay-on-canary"
            onClick={() => {
              props.onDismiss()
            }}
          >
            Manter versão canary
          </button>
        </div>
        <p class="text-xs text-slate-500">
          A recomendação é opcional. Se preferir, continue nesta versão e
          reporte o problema para a equipe.
        </p>
      </div>
    </div>
  )
}
