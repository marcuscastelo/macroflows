export type WeightChartPreferenceRepository = {
  getChartType(): string | null
  setChartType(chartType: string): void
}
