import { type WeightChartPreferenceRepository } from '~/modules/weight/domain/chart/weightChartPreferenceRepository'

const CHART_TYPE_KEY = 'weight-evolution-chart-type'

function getChartType(): string | null {
  return localStorage.getItem(CHART_TYPE_KEY)
}

function setChartType(chartType: string): void {
  localStorage.setItem(CHART_TYPE_KEY, chartType)
}

export function createLocalStorageWeightChartPreferenceRepository(): WeightChartPreferenceRepository {
  return {
    getChartType,
    setChartType,
  }
}
