import { useNavigate } from '@solidjs/router'
import { createSignal, Show } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { showSuccess } from '~/modules/toast/application/toastManager'
import { Button } from '~/sections/common/components/buttons/Button'

type OnboardingStep = 'welcome' | 'features' | 'privacy' | 'complete'

export function OnboardingFlow() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = createSignal<OnboardingStep>('welcome')

  const user = authUseCases.getCurrentUser()

  const handleNext = () => {
    const step = currentStep()
    switch (step) {
      case 'welcome':
        setCurrentStep('features')
        break
      case 'features':
        setCurrentStep('privacy')
        break
      case 'privacy':
        setCurrentStep('complete')
        break
      case 'complete':
        completeOnboarding()
        break
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const completeOnboarding = () => {
    // TODO: Save onboarding completion to user preferences
    // Issue URL: https://github.com/marcuscastelo/macroflows/issues/1050
    showSuccess('Bem-vindo ao Macroflows!')
    navigate('/diet')
  }

  const getStepNumber = () => {
    const steps: OnboardingStep[] = [
      'welcome',
      'features',
      'privacy',
      'complete',
    ]
    return steps.indexOf(currentStep()) + 1
  }

  return (
    <div class="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div class="max-w-lg w-full">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Progress Bar */}
          <div class="mb-8">
            <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Passo {getStepNumber()} de 4</span>
              <button
                class="text-blue-600 dark:text-blue-400 hover:underline"
                onClick={handleSkip}
              >
                Pular
              </button>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getStepNumber() / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Welcome Step */}
          <Show when={currentStep() === 'welcome'}>
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  class="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h2a1 1 0 011-1h0z"
                  />
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Bem-vindo,{' '}
                {user !== null && user.email !== ''
                  ? user.email.split('@')[0]
                  : 'usuário'}
                ! 👋
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mb-8">
                Vamos configurar sua experiência no Macroflows em alguns passos
                simples.
              </p>
            </div>
          </Show>

          {/* Features Step */}
          <Show when={currentStep() === 'features'}>
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Recursos Principais
              </h2>
              <div class="space-y-4">
                <div class="flex items-start space-x-3">
                  <div class="shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg
                      class="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">
                      Controle de Macros
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Acompanhe proteínas, carboidratos e gorduras facilmente
                    </p>
                  </div>
                </div>
                <div class="flex items-start space-x-3">
                  <div class="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <svg
                      class="w-4 h-4 text-blue-600 dark:text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">
                      Sincronização
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Seus dados sincronizados em todos os dispositivos
                    </p>
                  </div>
                </div>
                <div class="flex items-start space-x-3">
                  <div class="shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <svg
                      class="w-4 h-4 text-purple-600 dark:text-purple-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">
                      Receitas & Refeições
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Crie receitas personalizadas e planeje refeições
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Show>

          {/* Privacy Step */}
          <Show when={currentStep() === 'privacy'}>
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  class="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Seus dados estão seguros
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                Utilizamos criptografia de ponta e boas práticas de segurança
                para proteger suas informações.
              </p>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left">
                <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li class="flex items-center">
                    <svg
                      class="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Dados criptografados em trânsito e em repouso
                  </li>
                  <li class="flex items-center">
                    <svg
                      class="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Não compartilhamos dados com terceiros
                  </li>
                  <li class="flex items-center">
                    <svg
                      class="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Você controla seus dados completamente
                  </li>
                </ul>
              </div>
            </div>
          </Show>

          {/* Complete Step */}
          <Show when={currentStep() === 'complete'}>
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  class="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Tudo pronto! 🎉
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-8">
                Agora você pode começar a usar o Macroflows para atingir seus
                objetivos de saúde e nutrição.
              </p>
            </div>
          </Show>

          {/* Action Buttons */}
          <div class="mt-8 flex gap-3">
            <Show when={currentStep() !== 'complete'}>
              <Button class="btn-ghost flex-1" onClick={handleSkip}>
                Pular
              </Button>
            </Show>
            <Button class="btn-primary flex-1" onClick={handleNext}>
              {currentStep() === 'complete' ? 'Começar' : 'Próximo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
