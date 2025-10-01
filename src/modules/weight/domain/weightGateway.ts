import { type User } from '~/modules/user/domain/user'
import { type NewWeight, type Weight } from '~/modules/weight/domain/weight'

export type WeightGateway = {
  fetchUserWeights: (userId: User['uuid']) => Promise<readonly Weight[]>
  insertWeight: (newWeight: NewWeight) => Promise<Weight>
  updateWeight: (weightId: Weight['id'], weight: Weight) => Promise<Weight>
  deleteWeight: (id: Weight['id']) => Promise<void>
}
