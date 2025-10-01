import {
  type BodyMeasure,
  type NewBodyMeasure,
} from '~/modules/measure/domain/measure'
import { type User } from '~/modules/user/domain/user'

export type BodyMeasureGateway = {
  fetchUserBodyMeasures: (
    userId: User['uuid'],
  ) => Promise<readonly BodyMeasure[]>
  insertBodyMeasure: (
    newBodyMeasure: NewBodyMeasure,
  ) => Promise<BodyMeasure | null>
  updateBodyMeasure: (
    bodyMeasureId: BodyMeasure['id'],
    newBodyMeasure: NewBodyMeasure,
  ) => Promise<BodyMeasure | null>
  deleteBodyMeasure: (id: BodyMeasure['id']) => Promise<void>
}
