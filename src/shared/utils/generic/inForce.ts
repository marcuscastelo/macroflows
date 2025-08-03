export type InForce<TObj, TKey extends keyof TObj> = {
  [key in TKey]: Date
}

export function inForceGeneric<TObj extends object, TKey extends keyof TObj>(
  array: ReadonlyArray<TObj & InForce<TObj, TKey>>,
  key: TKey,
  date: Date,
): (TObj & InForce<TObj, TKey>) | null {
  const firstItemAfterDate = [...array]
    .reverse()
    .find((item) => item[key].getTime() <= date.getTime())
  if (firstItemAfterDate === undefined) {
    return null
  }
  return firstItemAfterDate
}
