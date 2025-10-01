import { type Food, type NewFood } from '~/modules/diet/food/domain/food'
import { type User } from '~/modules/user/domain/user'

export type FoodSearchParams = {
  limit?: number
  allowedFoods?: number[]
  userId?: User['uuid']
  isFavoritesSearch?: boolean
}

export type FoodRepository = {
  fetchFoodsByIds: (ids: Food['id'][]) => Promise<readonly Food[]>
  fetchFoods: (params: FoodSearchParams) => Promise<readonly Food[]>
  fetchFoodById: (
    id: Food['id'],
    params: Omit<FoodSearchParams, 'limit'>,
  ) => Promise<Food | null>
  fetchFoodsByName: (
    name: Required<Food>['name'],
    params: FoodSearchParams,
  ) => Promise<readonly Food[]>
  fetchFoodByEan: (
    ean: NonNullable<Required<Food>['ean']>,
    params: Omit<FoodSearchParams, 'limit'>,
  ) => Promise<Food | null>

  insertFood: (newFood: NewFood) => Promise<Food | null>
  upsertFood: (newFood: NewFood) => Promise<Food | null>
}
