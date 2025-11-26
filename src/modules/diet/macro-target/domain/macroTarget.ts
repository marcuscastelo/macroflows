import { type MacroProfile } from '~/modules/diet/macro-profile/domain/macroProfile'

export type MacroTarget = Pick<
  MacroProfile,
  'gramsPerKgCarbs' | 'gramsPerKgFat' | 'gramsPerKgProtein'
>
