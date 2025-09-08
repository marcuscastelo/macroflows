import {
  type Accessor,
  createContext,
  type JSXElement,
  useContext,
} from 'solid-js'

import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { type Meal } from '~/modules/diet/meal/domain/meal'

// TODO: Rename to TemplateItemContext
const mealContext = createContext<{
  dayDiet: Accessor<DayDiet>
  meal: Accessor<Meal>
} | null>(null)

export function useMealContext() {
  const context = useContext(mealContext)

  if (context === null) {
    throw new Error('useMealContext must be used within a MealContextProvider')
  }

  return context
}

export function MealContextProvider(props: {
  dayDiet: Accessor<DayDiet>
  meal: Accessor<Meal>
  children: JSXElement
}) {
  return (
    <mealContext.Provider
      value={{ dayDiet: () => props.dayDiet(), meal: () => props.meal() }}
    >
      {props.children}
    </mealContext.Provider>
  )
}
