import { AuthGuard } from '~/modules/auth/ui/guards/AuthGuard'
import { OnboardingFlow } from '~/sections/onboarding/components/OnboardingFlow'

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingFlow />
    </AuthGuard>
  )
}
