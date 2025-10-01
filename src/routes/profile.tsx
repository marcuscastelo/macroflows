import { Suspense } from 'solid-js'

import { PageLoading } from '~/sections/common/components/PageLoading'
import { BodyMeasuresChartSection } from '~/sections/profile/components/BodyMeasuresChartSection'
import { ChartSection } from '~/sections/profile/components/ChartSection'
import { MacroChartSection } from '~/sections/profile/components/MacroChartSection'
import {
  type ProfileChartTab,
  ProfileChartTabs,
} from '~/sections/profile/components/ProfileChartTabs'
import { WeightChartSection } from '~/sections/profile/components/WeightChartSection'
import { useHashTabs } from '~/shared/hooks/useHashTabs'
import { lazyImport } from '~/shared/solid/lazyImport'

const { UserInfo } = lazyImport(
  () => import('~/sections/profile/components/UserInfo'),
  ['UserInfo'],
)

export default function Page() {
  const [activeTab, setActiveTab] = useHashTabs<ProfileChartTab>({
    validTabs: ['weight', 'macros', 'measures'] as const,
    defaultTab: 'weight',
    storageKey: 'profile-chart-active-tab',
  })

  return (
    <>
      <Suspense fallback={<PageLoading message="Carregando perfil..." />}>
        <UserInfo />
        <ProfileChartTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <ChartSection id="weight" activeTab={activeTab()}>
          <WeightChartSection />
        </ChartSection>

        <ChartSection id="macros" activeTab={activeTab()}>
          <MacroChartSection />
        </ChartSection>

        <ChartSection id="measures" activeTab={activeTab()}>
          <BodyMeasuresChartSection />
        </ChartSection>
      </Suspense>
    </>
  )
}
