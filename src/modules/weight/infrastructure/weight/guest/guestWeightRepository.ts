import { type User } from '~/modules/user/domain/user'
import {
  type NewWeight,
  promoteToWeight,
  type Weight,
} from '~/modules/weight/domain/weight/weight'
import { type WeightRepository } from '~/modules/weight/domain/weight/weightRepository'
import {
  getGuestDatabase,
  updateGuestDatabase,
} from '~/shared/guest/guestDatabase'
import { logging } from '~/shared/utils/logging'

let nextWeightId = 10000

function generateWeightId(): number {
  return nextWeightId++
}

/**
 * Creates a guest weight repository that uses the in-memory guest database
 */
export function createGuestWeightRepository(): WeightRepository {
  return {
    fetchUserWeights,
    insertWeight,
    updateWeight,
    deleteWeight,
  }
}

async function fetchUserWeights(
  userId: User['uuid'],
): Promise<readonly Weight[]> {
  const db = getGuestDatabase()
  const weights = db.weights.filter((w) => w.user_id === userId)
  logging.debug('[guestWeightRepository] fetchUserWeights', {
    userId,
    count: weights.length,
  })
  return weights
}

async function insertWeight(newWeight: NewWeight): Promise<Weight> {
  const weight = promoteToWeight(newWeight, { id: generateWeightId() })

  updateGuestDatabase((db) => ({
    ...db,
    weights: [...db.weights, weight],
  }))

  logging.debug('[guestWeightRepository] insertWeight', { weight })
  return weight
}

async function updateWeight(
  weightId: Weight['id'],
  weight: Weight,
): Promise<Weight> {
  let updatedWeight: Weight = weight

  updateGuestDatabase((db) => ({
    ...db,
    weights: db.weights.map((w) => {
      if (w.id === weightId) {
        updatedWeight = { ...weight, id: weightId }
        return updatedWeight
      }
      return w
    }),
  }))

  logging.debug('[guestWeightRepository] updateWeight', {
    weightId,
    updatedWeight,
  })
  return updatedWeight
}

async function deleteWeight(id: Weight['id']): Promise<void> {
  updateGuestDatabase((db) => ({
    ...db,
    weights: db.weights.filter((w) => w.id !== id),
  }))

  logging.debug('[guestWeightRepository] deleteWeight', { id })
}
