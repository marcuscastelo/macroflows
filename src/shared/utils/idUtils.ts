// TODO: remove id utils and find a way to generate ids in the database

import { generateNumericId } from '~/shared/utils/uniqueId'

type Identifiable = { id: number }

/**
 * @deprecated Probably should be done by database
 */
export function generateId(): number {
  return generateNumericId()
}

/**
 * @deprecated Probably should be done by database
 */
export function regenerateId<T extends Identifiable>(obj: T): T {
  return { ...obj, id: generateId() }
}
