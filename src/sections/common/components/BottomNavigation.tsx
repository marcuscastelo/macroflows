import { useLocation, useNavigate } from '@solidjs/router'
import {
  createEffect,
  createSignal,
  For,
  type JSXElement,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'

import { APP_VERSION } from '~/app-version'
import { showError } from '~/modules/toast/application/toastManager'
import {
  changeToUser,
  currentUserId,
  fetchUsers,
  users,
} from '~/modules/user/application/user'
import { type User } from '~/modules/user/domain/user'
import { Button } from '~/sections/common/components/buttons/Button'
import { ConsoleDumpButton } from '~/sections/common/components/ConsoleDumpButton'
import { UserIcon } from '~/sections/common/components/icons/UserIcon'
import { useIntersectionObserver } from '~/shared/hooks/useIntersectionObserver'
import {
  closeModal,
  openConfirmModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'
import { vibrate } from '~/shared/utils/vibrate'

export function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = () => location.pathname

  const [footerHeight, setFooterHeight] = createSignal(0)
  let footerRef: HTMLDivElement | undefined
  let resizeObserver: ResizeObserver | undefined

  const { intersectionRatio, setRef } = useIntersectionObserver(
    {
      root: null,
      threshold: Array.from({ length: 200 + 1 }, (_, i) => i / 200),
    },
    (entry) => {
      if (entry.intersectionRatio > 0 && footerRef) {
        setFooterHeight(footerRef.offsetHeight)
      }
    },
  )

  onMount(() => {
    if (!footerRef) return

    setRef(footerRef)

    // Updates footerHeight if the footer size changes
    resizeObserver = new window.ResizeObserver(() => {
      const currentHeight = footerRef.offsetHeight
      setFooterHeight(currentHeight)
    })
    resizeObserver.observe(footerRef)
  })

  onCleanup(() => {
    resizeObserver?.disconnect()
  })

  console.debug('[BottomNavigation] Rendering')
  console.debug('[BottomNavigation] Current path:', pathname)

  return (
    <div class="">
      {/* Placeholder for bottom navigation when page is 100% scrolled */}
      <div class="h-24 lg:h-24" />
      <div
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          'max-width': '32rem', // equivalent to max-w-lg in Tailwind
          'z-index': 50,
          transition: 'bottom 0.12s cubic-bezier(0.4, 0.0, 0.2, 1)',
          bottom: `${(8 + footerHeight()) * intersectionRatio() + 8}px`,
        }}
      >
        <div class="z-50 w-full h-16 bg-white border border-gray-200 rounded-full dark:bg-slate-800 dark:border-slate-700 bottom-0">
          <div class="grid h-full max-w-lg grid-cols-5 mx-auto">
            <BottomNavigationTab
              active={pathname() === '/diet'}
              label="Home"
              icon={HomeIcon}
              onClick={() => {
                vibrate(50)
                navigate('/diet')
              }}
              position="first"
            />
            <BottomNavigationTab
              active={pathname().startsWith('/profile')}
              label="Perfil"
              icon={ProfileIcon}
              onClick={() => {
                vibrate(50)
                navigate('/profile')
              }}
              position="middle"
            />
            <CTAButton />
            <BottomNavigationTab
              active={pathname().startsWith('/settings')}
              label="Configurações"
              icon={SettingsIcon}
              onClick={() => {
                vibrate(50)
                navigate('/settings')
              }}
              position="middle"
            />
            <BottomNavigationTab
              active={false}
              label="Usuário"
              icon={(props) => (
                <UserIcon
                  userId={currentUserId}
                  userName={() =>
                    users().find((u) => u.id === currentUserId())?.name ?? ''
                  }
                  {...props}
                />
              )}
              onClick={() => {
                vibrate(50)
                openContentModal(
                  (modalId) => <UserSelectorDropdown modalId={modalId} />,
                  {
                    closeOnOutsideClick: true,
                    showCloseButton: false,
                  },
                )
              }}
              position="last"
            />
          </div>
        </div>
      </div>
      <footer
        ref={footerRef}
        class="w-full flex flex-col justify-center items-center gap-1 p-2 rounded-t left-0 bottom-0 z-40 lg:static lg:rounded-none"
      >
        <div class="flex flex-col text-center items-center gap-2">
          <i class="text-xs text-gray-500 dark:text-gray-400">
            Version: <br />
            {APP_VERSION}
          </i>
          <ConsoleDumpButton />
        </div>
        <Show when={!window.location.href.includes('stable')}>
          <Button
            type="button"
            class="btn-primary btn-xs mt-1"
            onClick={() => {
              window.location.href = 'https://macroflows-stable.vercel.app/'
            }}
          >
            Trocar para versão estável
          </Button>
        </Show>
      </footer>
    </div>
  )
}

function BottomNavigationTab(props: {
  icon: (iconProps: { class?: string }) => JSXElement
  label: string
  active: boolean
  onClick: () => void
  position: 'first' | 'middle' | 'last'
}) {
  function getRound() {
    switch (props.position) {
      case 'first':
        return 'rounded-l-full'
      case 'middle':
        return ''
      case 'last':
        return 'rounded-r-full'
    }
  }

  return (
    <>
      <button
        data-tooltip-target={`tooltip-${props.label}`}
        type="button"
        class={`${getRound()} inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-slate-900 hover:scale-105 active:scale-102 transition-transform group cursor-pointer`}
        onClick={() => {
          props.onClick()
        }}
      >
        {props.icon({
          class: `${
            props.active
              ? 'text-blue-600 dark:text-blue-500'
              : 'text-gray-500 dark:text-gray-400'
          } w-8 h-8 mb-1  group-hover:text-blue-600 dark:group-hover:text-blue-500`,
        })}
        <span class="sr-only">{props.label}</span>
      </button>
      <div
        id={`tooltip-${props.label}`}
        role="tooltip"
        class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
      >
        {props.label}
        <div class="tooltip-arrow" data-popper-arrow />
      </div>
    </>
  )
}

const HomeIcon = (props: { class?: string }) => (
  <svg
    class={props.class}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
  </svg>
)

const ProfileIcon = (props: { class?: string }) => (
  <svg
    class={props.class}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
  </svg>
)

const SettingsIcon = (props: { class?: string }) => (
  <svg
    class={props.class}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 20 20"
  >
    <path
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"
    />
  </svg>
)

function CTAButton() {
  return (
    <>
      <div class="flex items-center justify-center">
        <button
          data-tooltip-target="tooltip-new"
          type="button"
          class="inline-flex items-center justify-center w-10 h-10 font-medium bg-blue-700 rounded-full hover:bg-blue-800 group focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-900 cursor-pointer"
        >
          <svg
            class="w-4 h-4 text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 18 18"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 1v16M1 9h16"
            />
          </svg>
          <span class="sr-only">New item</span>
        </button>
      </div>
      <div
        id="tooltip-new"
        role="tooltip"
        class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
      >
        Create new item
        <div class="tooltip-arrow" data-popper-arrow />
      </div>
    </>
  )
}

const UserSelectorDropdown = (props: { modalId: string }) => {
  createEffect(() => {
    const modalId = props.modalId
    fetchUsers().catch((error) => {
      // Use proper error handling instead of console
      import('~/shared/error/errorHandler')
        .then(({ createErrorHandler }) => {
          const errorHandler = createErrorHandler(
            'user',
            'UserSelectorDropdown',
          )
          errorHandler.apiError(error, { operation: 'fetch users' })
        })
        .catch(() => {
          // Fallback if import fails
        })
      showError('Erro ao buscar usuários', { context: 'background' })
      closeModal(modalId)
    })
  })

  const handleChangeUser = (user: User) => {
    vibrate(50)
    openConfirmModal(`Deseja entrar como ${user.name}?`, {
      title: 'Trocar de usuário',
      confirmText: 'Entrar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        vibrate(50)
        changeToUser(user.id)
        closeModal(props.modalId)
      },
    })
  }

  return (
    <div class="flex flex-col gap-1">
      <For each={users()}>
        {(user) => (
          <Button
            class="btn-ghost flex justify-between"
            onClick={() => {
              handleChangeUser(user)
              // Force dropdown to close without having to click outside setting aria
              // Credit: https://reacthustle.com/blog/how-to-close-daisyui-dropdown-with-one-click
              const dropdown =
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                document.activeElement as HTMLAnchorElement | null
              dropdown?.blur()
            }}
          >
            <UserIcon
              class="w-10 h-10"
              userId={() => user.id}
              userName={() => user.name}
            />
            <div class="text-xl flex-1 text-start">{user.name}</div>
          </Button>
        )}
      </For>
    </div>
  )
}
