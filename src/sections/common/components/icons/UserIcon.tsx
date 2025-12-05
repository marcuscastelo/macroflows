import { type Accessor, createSignal, Show } from 'solid-js'

import { useCases } from '~/di/useCases'
import { type User } from '~/modules/user/domain/user'
import { UserInitialFallback } from '~/sections/common/components/icons/UserInitialFallback'

export function UserIcon(props: {
  userId: Accessor<User['uuid'] | undefined>
  userName: Accessor<string>
  class?: string
}) {
  const authUseCases = useCases.authUseCases()
  const [errored, setErrored] = createSignal(false)
  return (
    <div class={props.class}>
      <Show
        when={!errored()}
        fallback={
          <UserInitialFallback name={props.userName()} class="w-full h-full" />
        }
      >
        <img
          class="w-full h-full rounded-full"
          src={
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            authUseCases.getCurrentUser()?.userMetadata?.['picture'] as string
          }
          sizes="100vw"
          alt=""
          width={0}
          height={0}
          onError={() => setErrored(true)}
        />
      </Show>
    </div>
  )
}
