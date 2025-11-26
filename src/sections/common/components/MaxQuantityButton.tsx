import {
  createEffect,
  createSignal,
  For,
  type JSX,
  onCleanup,
  Show,
} from 'solid-js'

import {
  calculateMaxQuantity,
  getDominantMacro,
  type MacroType,
  type MaxQuantityMode,
  type MaxQuantityResult,
} from '~/modules/diet/item/domain/maxQuantityCalculations'
import { type MacroNutrientsRecord } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { cn } from '~/shared/cn'
import { logging } from '~/shared/utils/logging'

export type MaxQuantityButtonProps = {
  currentValue: number
  macroTargets: MacroNutrientsRecord
  itemMacros: MacroNutrientsRecord
  onMaxSelected: (maxValue: number) => void
}

type MacroOption = {
  readonly mode: MaxQuantityMode
  readonly label: string
  readonly shortLabel: string
  readonly color: string
}

const LONG_PRESS_DURATION_MS = 500

const MACRO_OPTIONS: readonly MacroOption[] = [
  {
    mode: 'balanced',
    label: 'Balanceado',
    shortLabel: 'Bal.',
    color: 'text-gray-300',
  },
  {
    mode: 'protein',
    label: 'Proteína (P)',
    shortLabel: 'P',
    color: 'text-blue-400',
  },
  {
    mode: 'carb',
    label: 'Carboidratos (C)',
    shortLabel: 'C',
    color: 'text-yellow-400',
  },
  { mode: 'fat', label: 'Gordura (G)', shortLabel: 'G', color: 'text-red-400' },
] as const

function getMacroLabel(macro: MacroType | null): string {
  switch (macro) {
    case 'protein':
      return 'Proteína'
    case 'carb':
      return 'Carboidratos'
    case 'fat':
      return 'Gordura'
    default:
      return ''
  }
}

function formatGrams(grams: number): string {
  if (grams === 0) return '0g'
  if (grams < 1) return `${grams.toFixed(2)}g`
  return `${Math.round(grams)}g`
}

export function MaxQuantityButton(props: MaxQuantityButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = createSignal(false)
  const [selectedMode, setSelectedMode] = createSignal<MaxQuantityMode | null>(
    null,
  )
  const [showTooltip, setShowTooltip] = createSignal(false)
  const [tooltipMessage, setTooltipMessage] = createSignal('')
  let popoverRef: HTMLDivElement | undefined
  let buttonRef: HTMLButtonElement | undefined
  let longPressTimer: ReturnType<typeof setTimeout> | undefined

  const dominantMacro = () => getDominantMacro(props.itemMacros)
  const isMixedItem = () => dominantMacro() === null

  function getResult(mode: MaxQuantityMode): MaxQuantityResult {
    return calculateMaxQuantity(mode, props.itemMacros, props.macroTargets)
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target
    if (
      popoverRef &&
      target instanceof Node &&
      !popoverRef.contains(target) &&
      buttonRef &&
      !buttonRef.contains(target)
    ) {
      setIsOpen(false)
      setSelectedMode(null)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen()) return

    if (e.key === 'Escape') {
      setIsOpen(false)
      setSelectedMode(null)
      buttonRef?.focus()
    } else if (e.key === 'Enter' && selectedMode() === null) {
      // Enter with no selection = apply balanced
      applyMode('balanced')
    } else if (e.altKey) {
      // Alt+P/C/G shortcuts
      if (e.key === 'p' || e.key === 'P') {
        applyMode('protein')
      } else if (e.key === 'c' || e.key === 'C') {
        applyMode('carb')
      } else if (e.key === 'g' || e.key === 'G') {
        applyMode('fat')
      }
    }
  }

  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  })

  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeyDown)
    if (longPressTimer) {
      clearTimeout(longPressTimer)
    }
  })

  function applyMode(mode: MaxQuantityMode) {
    const result = getResult(mode)
    logging.debug('[MaxQuantityButton] Applying mode', { mode, result })

    if (result.grams > 0) {
      props.onMaxSelected(result.grams)

      // Show tooltip for dominant macro items
      if (!isMixedItem() && mode !== 'balanced') {
        const dominantLabel = getMacroLabel(dominantMacro())
        setTooltipMessage(`Maximizando ${dominantLabel}`)
        setShowTooltip(true)
        setTimeout(() => setShowTooltip(false), 2000)
      }
    }

    setIsOpen(false)
    setSelectedMode(null)
  }

  function handleClick(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // For mixed items, always show popover
    if (isMixedItem()) {
      setIsOpen(!isOpen())
      return
    }

    // For dominant items, apply the dominant macro directly
    const dominant = dominantMacro()
    if (dominant) {
      applyMode(dominant)
    } else {
      applyMode('balanced')
    }
  }

  function handleTouchStart() {
    // Start long press timer for mobile
    longPressTimer = setTimeout(() => {
      setIsOpen(true)
    }, LONG_PRESS_DURATION_MS)
  }

  function handleTouchEnd() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = undefined
    }
  }

  function handleOptionSelect(mode: MaxQuantityMode) {
    applyMode(mode)
  }

  return (
    <div class="absolute right-2 top-1/2 -translate-y-1/2">
      {/* Tooltip for auto-apply feedback */}
      <Show when={showTooltip()}>
        <div
          class="absolute bottom-full right-0 mb-1 px-2 py-1 text-xs bg-gray-700 text-white rounded shadow-lg whitespace-nowrap z-50"
          role="status"
          aria-live="polite"
        >
          {tooltipMessage()}
        </div>
      </Show>

      {/* Main Button */}
      <button
        ref={buttonRef}
        type="button"
        aria-label="Set maximum quantity"
        aria-haspopup="true"
        aria-expanded={isOpen()}
        class={cn(
          'px-2 py-1 text-xs font-semibold text-blue-500 bg-transparent hover:bg-blue-100 hover:bg-opacity-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 opacity-70 hover:opacity-100 transition-opacity border-none cursor-pointer',
          isOpen() && 'bg-blue-100 bg-opacity-20 opacity-100',
        )}
        style={{
          'pointer-events': 'auto',
          background: 'transparent',
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
      >
        Max.
      </button>

      {/* Popover */}
      <Show when={isOpen()}>
        <div
          ref={popoverRef}
          class="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-lg bg-gray-800 shadow-xl border border-gray-700 overflow-hidden"
          role="menu"
          aria-label="Escolher macro para maximizar"
        >
          {/* Header */}
          <div class="px-3 py-2 bg-gray-900 border-b border-gray-700">
            <span class="text-xs text-gray-400 font-medium">
              Maximizar por:
            </span>
          </div>

          {/* Options */}
          <div class="py-1">
            <For each={MACRO_OPTIONS}>
              {(option) => {
                const result = () => getResult(option.mode)
                const isDisabled = () => result().grams === 0
                const isLimited = () => result().limitedBy !== null

                return (
                  <button
                    type="button"
                    role="menuitem"
                    class={cn(
                      'w-full px-3 py-2 text-left text-sm transition-colors',
                      'hover:bg-gray-700 focus:bg-gray-700 focus:outline-none',
                      isDisabled() && 'opacity-50 cursor-not-allowed',
                      option.color,
                    )}
                    onClick={() =>
                      !isDisabled() && handleOptionSelect(option.mode)
                    }
                    onMouseEnter={() => setSelectedMode(option.mode)}
                    onMouseLeave={() => setSelectedMode(null)}
                    disabled={isDisabled()}
                  >
                    <div class="flex justify-between items-center">
                      <span>{option.label}</span>
                      <span class="text-gray-400 text-xs">
                        {formatGrams(result().grams)}
                      </span>
                    </div>

                    {/* Limiting info */}
                    <Show when={isLimited() && !isDisabled()}>
                      <div class="text-xs text-orange-400 mt-0.5">
                        Limitado por {getMacroLabel(result().limitedBy)}
                      </div>
                    </Show>
                  </button>
                )
              }}
            </For>
          </div>

          {/* Preview Section */}
          <Show when={selectedMode() !== null}>
            <div class="px-3 py-2 bg-gray-900 border-t border-gray-700">
              <PreviewPanel
                result={getResult(selectedMode()!)}
                macroTargets={props.macroTargets}
              />
            </div>
          </Show>

          {/* Help text */}
          <div class="px-3 py-2 border-t border-gray-700 text-xs text-gray-500">
            <span>Toque curto = Balanceado • Toque longo = Menu</span>
          </div>
        </div>
      </Show>
    </div>
  )
}

type PreviewPanelProps = {
  result: MaxQuantityResult
  macroTargets: MacroNutrientsRecord
}

function PreviewPanel(props: PreviewPanelProps): JSX.Element {
  const calcPercentage = (added: number, remaining: number): number => {
    if (remaining <= 0) return added > 0 ? 100 : 0
    return Math.min(100, (added / remaining) * 100)
  }

  return (
    <div class="space-y-1">
      <div class="text-xs text-gray-400 mb-1">Preview:</div>
      <div class="grid grid-cols-3 gap-2 text-xs">
        <PreviewMacroItem
          label="C"
          value={props.result.preview.carbs}
          percentage={calcPercentage(
            props.result.preview.carbs,
            props.macroTargets.carbs,
          )}
          color="text-yellow-400"
        />
        <PreviewMacroItem
          label="P"
          value={props.result.preview.protein}
          percentage={calcPercentage(
            props.result.preview.protein,
            props.macroTargets.protein,
          )}
          color="text-blue-400"
        />
        <PreviewMacroItem
          label="G"
          value={props.result.preview.fat}
          percentage={calcPercentage(
            props.result.preview.fat,
            props.macroTargets.fat,
          )}
          color="text-red-400"
        />
      </div>
    </div>
  )
}

type PreviewMacroItemProps = {
  label: string
  value: number
  percentage: number
  color: string
}

function PreviewMacroItem(props: PreviewMacroItemProps): JSX.Element {
  return (
    <div class="text-center">
      <div class={cn('font-medium', props.color)}>{props.label}</div>
      <div class="text-white">{formatGrams(props.value)}</div>
      <div class="text-gray-500">{Math.round(props.percentage)}%</div>
    </div>
  )
}
