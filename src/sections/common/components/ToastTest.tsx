import { type Component, createSignal } from 'solid-js'
import toast from 'solid-toast'

import {
  showError,
  showLoading,
  showPromise,
  showSuccess,
} from '~/modules/toast/application/toastManager'
import { type ToastOptions } from '~/modules/toast/domain/toastTypes'
import { logging } from '~/shared/utils/logging'

const ToastTest: Component = () => {
  const [toastOptions, setToastOptions] = createSignal<Partial<ToastOptions>>({
    showLoading: true,
    showSuccess: true,
  })

  const testPromiseSuccess = () => {
    // Test a promise that resolves successfully and shows a toast
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('Success!'), 2000)
    })

    void showPromise(
      promise,
      {
        loading: 'Loading...',
        success: 'Operation completed successfully!',
        error: 'Error in operation',
      },
      toastOptions(),
    ).catch((err) => {
      logging.error('Error processing promise:', err)
    })
  }

  const testPromiseError = () => {
    // Test a promise that rejects and shows an error toast
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Simulated error')), 2000)
    })

    void showPromise(
      promise,
      {
        loading: 'Processing...',
        success: 'Success!',
        error: 'Operação falhou\nPor favor, tente novamente.',
      },
      toastOptions(),
    ).catch((err) => {
      logging.error('Error processing promise:', err)
    })
  }

  const testPromiseWithoutMessages = () => {
    // Test a promise with only a loading message and no success message
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('OK'), 1500)
    })

    void showPromise(
      promise,
      {
        loading: 'Loading without success message...',
      },
      toastOptions(),
    ).catch((err) => {
      logging.error('Error processing promise without success message:', err)
    })
  }

  const testSmartToastPromise = async () => {
    try {
      logging.info('Starting showPromise test...')
      const result = await showPromise(
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('Data loaded!'), 2000)
        }),
        {
          loading: 'Loading with showPromise...',
          success: 'Smart toast completed!',
          error: 'Smart toast failed',
        },
        toastOptions(),
      )
      logging.info('showPromise result:', result)
    } catch (error) {
      logging.error('showPromise error:', error)
    }
  }

  const testSmartToastPromiseDetached = () => {
    logging.info('Starting showPromise test...')

    void showPromise(
      new Promise<string>((resolve) => {
        setTimeout(() => {
          logging.info('Detached operation completed!')
          resolve('Detached data loaded!')
        }, 2000)
      }),
      {
        loading: 'Detached operation...',
        success: 'Detached operation completed!',
        error: 'Operação destacada falhou\nPor favor, tente novamente.',
      },
      toastOptions(),
    )

    logging.info('showPromise called - continuing immediately')
  }

  const testMultipleDetachedOperations = () => {
    logging.info('Testing multiple detached operations...')

    void showPromise(
      new Promise((resolve) => setTimeout(() => resolve('User data'), 1000)),
      {
        loading: 'Loading user data...',
        success: 'User data loaded!',
        error: 'Falha ao carregar dados do usuário\nTente novamente.',
      },
      toastOptions(),
    )

    void showPromise(
      new Promise((resolve) => setTimeout(() => resolve('Settings'), 1500)),
      {
        loading: 'Loading settings...',
        success: 'Settings loaded!',
        error: 'Falha ao carregar configurações\nTente novamente.',
      },
      toastOptions(),
    )

    void showPromise(
      new Promise((resolve) => setTimeout(() => resolve('Cache'), 800)),
      {
        loading: 'Refreshing cache...',
        success: 'Cache refreshed!',
        error: 'Falha ao atualizar cache\nTente novamente.',
      },
      toastOptions(),
    )

    logging.info('All detached operations started')
  }

  const testLongError = () => {
    const longMessage = `This is a very long error message that will demonstrate the truncation capability of our toast system. It contains multiple sentences and will definitely exceed the maximum length allowed for display in a toast. When this happens, the message will be truncated and an option to view the complete details will be provided to the user. This helps keep the UI clean while still allowing users to access the full error information if they need it. The error details modal will display this entire message along with any stack trace or context information that may be available.`
    showError(new Error(longMessage), toastOptions())
  }

  return (
    <div style={{ padding: '20px', 'font-family': 'sans-serif' }}>
      <h2>Toast System Test</h2>
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: '10px',
          'max-width': '300px',
        }}
      >
        <button class="btn cursor-pointer" onClick={testPromiseSuccess}>
          Test Promise Success (2s loading)
        </button>
        <button class="btn cursor-pointer" onClick={testPromiseError}>
          Test Promise Error (2s loading)
        </button>
        {/* Failed promise for Promise without messages */}
        <button class="btn cursor-pointer" onClick={testPromiseWithoutMessages}>
          Test Promise without Success Message
        </button>
        <button
          class="btn cursor-pointer"
          onClick={() => {
            const promise = new Promise<string>((_, reject) => {
              setTimeout(
                () => reject(new Error('Simulated error (no success message)')),
                1500,
              )
            })
            void showPromise(
              promise,
              {
                loading: 'Loading without success message...',
                error: 'Operação falhou\nPor favor, tente novamente.',
              },
              toastOptions(),
            ).catch((err) => {
              logging.error(
                'Error processing promise without success message:',
                err,
              )
            })
          }}
        >
          Test Promise without Success Message (error)
        </button>
        <hr style={{ margin: '10px 0', border: '1px solid #ccc' }} />
        <h3 style={{ margin: '10px 0 5px 0', 'font-size': '16px' }}>
          New showPromise Tests
        </h3>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={toastOptions().showLoading}
              onInput={(e) =>
                setToastOptions((o) => ({
                  ...o,
                  showLoading: e.currentTarget.checked,
                }))
              }
            />
            showLoading
          </label>
          <label>
            <input
              type="checkbox"
              checked={toastOptions().showSuccess}
              onInput={(e) =>
                setToastOptions((o) => ({
                  ...o,
                  showSuccess: e.currentTarget.checked,
                }))
              }
            />
            showSuccess
          </label>
        </div>
        <button
          class="btn cursor-pointer"
          onClick={() => {
            void testSmartToastPromise()
          }}
          style={{ 'background-color': '#4CAF50', color: 'white' }}
        >
          Test showPromise (awaitable)
        </button>
        <button
          class="btn cursor-pointer"
          onClick={() => {
            void (async () => {
              try {
                await showPromise(
                  new Promise<string>((_, reject) => {
                    setTimeout(
                      () => reject(new Error('Simulated error (showPromise)')),
                      2000,
                    )
                  }),
                  {
                    loading: 'Loading with showPromise...',
                    success: 'Smart toast completed!',
                    error: 'Smart toast failed (error)',
                  },
                  toastOptions(),
                )
              } catch (error) {
                logging.error('showPromise error:', error)
              }
            })()
          }}
          style={{ 'background-color': '#E53935', color: 'white' }}
        >
          Test showPromise (error)
        </button>
        <button
          class="btn cursor-pointer"
          onClick={testSmartToastPromiseDetached}
          style={{ 'background-color': '#2196F3', color: 'white' }}
        >
          Test showPromise (fire & forget)
        </button>
        <button
          class="btn cursor-pointer"
          onClick={() => {
            void showPromise(
              new Promise<string>((_, reject) => {
                setTimeout(
                  () => reject(new Error('Simulated error (detached)')),
                  2000,
                )
              }),
              {
                loading: 'Detached operation...',
                success: 'Detached operation completed!',
                error: 'Operação destacada falhou\nPor favor, tente novamente.',
              },
              toastOptions(),
            )
          }}
          style={{ 'background-color': '#E53935', color: 'white' }}
        >
          Test showPromise (error)
        </button>
        <button
          class="btn cursor-pointer"
          onClick={testMultipleDetachedOperations}
          style={{ 'background-color': '#FF9800', color: 'white' }}
        >
          Test Multiple Detached Ops (bootstrap scenario)
        </button>
        <hr style={{ margin: '10px 0', border: '1px solid #ccc' }} />

        <button
          class="btn cursor-pointer"
          onClick={() => toast.error('Direct Toast', { duration: 2000 })}
        >
          Test Direct
        </button>

        <button
          class="btn cursor-pointer"
          onClick={() => showSuccess('Simple Success Toast', toastOptions())}
        >
          Test Simple Success
        </button>

        <button
          class="btn cursor-pointer"
          onClick={() => showLoading('Loading operation...', toastOptions())}
        >
          Test Simple Loading
        </button>

        <button
          class="btn cursor-pointer"
          onClick={() =>
            showError(new Error('Simple error test'), toastOptions())
          }
        >
          Test Simple Error
        </button>

        <button class="btn cursor-pointer" onClick={testLongError}>
          Test Long Error (truncate/copy)
        </button>
      </div>

      <div style={{ 'margin-top': '20px', 'font-size': '14px', color: '#666' }}>
        <p>
          <strong>Expected Behavior:</strong>
        </p>
        <ul>
          <li>Only 1 toast visible at a time</li>
          <li>Promise loading toasts should be replaced by success/error</li>
          <li>Multiple toasts should queue properly</li>
          <li>Loading toast should disappear when no success message</li>
        </ul>

        <p style={{ 'margin-top': '15px' }}>
          <strong>showPromise vs showPromise:</strong>
        </p>
        <ul>
          <li>
            <strong>showPromise:</strong> Returns Promise, can be awaited, use
            for user actions
          </li>
          <li>
            <strong>showPromise:</strong> Fire & forget, ideal for
            bootstrap/background ops
          </li>
          <li>Check browser console for execution logs</li>
        </ul>
      </div>
    </div>
  )
}

export default ToastTest
