import { type User } from '~/modules/user/domain/user'

/**
 * Storage repository interface for weight module persistence
 */
export type WeightStorageRepository = {
  /**
   * Get cached weights for a user
   */
  getCachedWeights(userId: User['uuid']): readonly unknown[]

  /**
   * Store weights cache for a user
   */
  setCachedWeights(userId: User['uuid'], weights: readonly unknown[]): void

  /**
   * Get chart type preference
   */
  getChartType(): string | null

  /**
   * Store chart type preference
   */
  setChartType(chartType: string): void
}
