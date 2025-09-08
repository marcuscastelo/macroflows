import { EANIcon } from '~/sections/common/components/icons/EANIcon'

export function EANButton(props: { showEANModal: () => void }) {
  return (
    <button
      onClick={() => {
        props.showEANModal()
      }}
      class="rounded bg-gray-800 font-bold text-white hover:bg-gray-700 w-16 p-2 hover:scale-110 transition-transform cursor-pointer"
    >
      <EANIcon />
    </button>
  )
}
