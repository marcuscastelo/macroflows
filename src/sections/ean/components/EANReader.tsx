import {
  type Html5QrcodeFullConfig,
  type Html5QrcodeResult,
} from 'html5-qrcode'
import { createSignal, onCleanup, onMount, Show } from 'solid-js'

import { showError } from '~/modules/toast/application/toastManager'
import { LoadingRing } from '~/sections/common/components/LoadingRing'
import { createErrorHandler } from '~/shared/error/errorHandler'

// Html5QrcodeSupportedFormats.EAN_13
const Html5QrcodeSupportedFormats_EAN_13 = 9

const errorHandler = createErrorHandler('user', 'EANReader')

export function EANReader(props: {
  id: string
  onScanned: (EAN: string) => void
}) {
  const [loadingScanner, setLoadingScanner] = createSignal(true)

  onMount(() => {
    setLoadingScanner(true)

    function onScanSuccess(
      decodedText: string,
      decodedResult: Html5QrcodeResult,
    ) {
      if (
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (decodedResult.result.format?.format as number) !==
        Html5QrcodeSupportedFormats_EAN_13
      ) {
        console.warn(
          `Atenção: Formato de código de barras não suportado: ${decodedResult.result.format?.format}`,
        )
        console.warn(`Código de barras lido: ${decodedText}`)
      }

      props.onScanned(decodedText)
    }

    const qrboxFunction = function (
      viewfinderWidth: number,
      viewfinderHeight: number,
    ) {
      const minEdgePercentage = 0.7 // 70%
      const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
      const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
      return {
        width: qrboxSize,
        height: (qrboxSize * 2) / 3,
      }
    }

    const config: Html5QrcodeFullConfig = {
      // Html5QrcodeSupportedFormats
      formatsToSupport: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      verbose: false,
      useBarCodeDetectorIfSupported: true,
    }

    let stopFn: (() => void) | null = null
    async function run() {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(props.id, config)
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: qrboxFunction },
          onScanSuccess,
          undefined,
        )
        .then(() => {
          setLoadingScanner(false)
          return true
        })
        .catch((err) => {
          showError(
            err,
            {},
            'Erro ao iniciar o leitor de código de barras. Verifique se a câmera está acessível e tente novamente.',
          )
          errorHandler.error(err, { operation: 'startScanner' })
          return false
        })

      stopFn = () => {
        scanner.stop().catch((err) => {
          errorHandler.error(err, { operation: 'stopScanner' })
        })
      }
    }

    run().catch((err) => {
      errorHandler.error(err, { operation: 'run' })
      setLoadingScanner(false)
    })
    onCleanup(() => {
      console.debug('EANReader onCleanup()')
      stopFn?.()
    })
  })
  return (
    <>
      <Show when={loadingScanner()}>
        <LoadingRing />
      </Show>
      <div id={props.id} class="mx-auto w-full" />
    </>
  )
}
