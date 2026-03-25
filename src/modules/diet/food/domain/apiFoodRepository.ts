import { type ApiFood } from '~/modules/diet/food/domain/apiFood'

export type ApiFoodRepository = {
  fetchApiFoods: () => Promise<readonly ApiFood[]>
  fetchApiFoodsByName: (
    name: Required<ApiFood>['nome'],
  ) => Promise<readonly ApiFood[]>
  fetchApiFoodByEan: (ean: Required<ApiFood>['ean']) => Promise<ApiFood>
}
