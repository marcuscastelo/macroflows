import { LoadingRing } from '~/sections/common/components/LoadingRing'
import { cn } from '~/shared/cn'

export type SearchLoadingIndicatorProps = {
  message?: string
  size?: 'small' | 'medium' | 'large'
  class?: string
  inline?: boolean
}

/**
 * Inline loading indicator for search contexts
 */
export function SearchLoadingIndicator(props: SearchLoadingIndicatorProps) {
  return (
    <div
      class={cn(
        'flex items-center justify-center text-gray-400',
        {
          'gap-2 flex-row': props.inline === true,
          'gap-1 flex-col': props.inline !== true,
          'py-2': (props.size ?? 'small') === 'small',
          'py-4': (props.size ?? 'small') === 'medium',
          'py-8': (props.size ?? 'small') === 'large',
        },
        props.class,
      )}
      role="status"
      aria-label={props.message ?? 'Buscando...'}
    >
      <LoadingRing
        class={cn({
          'w-4 h-4': (props.size ?? 'small') === 'small',
          'w-6 h-6': (props.size ?? 'small') === 'medium',
          'w-8 h-8': (props.size ?? 'small') === 'large',
        })}
      />
      <span
        class={cn('text-center', {
          'text-xs': (props.size ?? 'small') === 'small',
          'text-sm': (props.size ?? 'small') === 'medium',
          'text-base': (props.size ?? 'small') === 'large',
        })}
      >
        {props.message ?? 'Buscando...'}
      </span>
    </div>
  )
}
