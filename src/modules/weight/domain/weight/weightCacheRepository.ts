import { type User } from '~/modules/user/domain/user'

export type WeightCacheRepository = {
  getCachedWeights(userId: User['uuid']): readonly unknown[]
  setCachedWeights(userId: User['uuid'], weights: readonly unknown[]): void
}
