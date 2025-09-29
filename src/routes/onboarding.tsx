import { OnboardingFlow } from '~/sections/onboarding/components/OnboardingFlow'
import { AuthGuard } from '~/shared/guards/AuthGuard'

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingFlow />
    </AuthGuard>
  )
}
