import { Show } from 'solid-js'

import { Progress } from '~/sections/common/components/Progress'
import { logging } from '~/shared/utils/logging'
import { type calculateWeightProgress } from '~/shared/utils/weightUtils'

/**
 * Displays the user's weight progress as a progress bar and summary text.
 * @param props.weightProgress - The result of calculateWeightProgress
 * @param props.weightProgressText - Function returning the progress summary text
 * @returns SolidJS component
 */
export function WeightProgress(props: {
  weightProgress: ReturnType<typeof calculateWeightProgress> | null
  weightProgressText: () => string | undefined
}) {
  const showProgressBar = () => props.weightProgress?.type !== 'normo'
  return (
    <>
      <Show when={!showProgressBar()}>
        <h5 class={'mx-auto mb-5 text-center text-2xl font-bold'}>
          Progresso: {props.weightProgressText()}
        </h5>
      </Show>
      <Show when={showProgressBar() && props.weightProgress}>
        {(weightProgress) => (
          <div class="mx-auto max-w-lg mb-5">
            <Progress
              progress={(() => {
                const weightProgress_ = weightProgress()
                if (weightProgress_.type === 'no_weights') {
                  return 0
                }
                if (weightProgress_.type === 'progress') {
                  return weightProgress_.progress
                }
                if (weightProgress_.type === 'exceeded') {
                  return 100
                }
                if (weightProgress_.type === 'reversal') {
                  return 0
                }
                // Fallback: log warning for unhandled type
                logging.warn('Unhandled weightProgress type:', weightProgress_)
                return 0
              })()}
              color="blue"
              textLabelPosition="outside"
              textLabel={props.weightProgressText()}
              sizeClass="h-2"
              labelClass="text-center"
            />
          </div>
        )}
      </Show>
    </>
  )
}
