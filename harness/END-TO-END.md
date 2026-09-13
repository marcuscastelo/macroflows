# Runtime scenarios

## A user records a meal and sees the daily totals change

1. Sign in with a test account that has an active macro profile.
2. Open today's diet and add a known food to a meal with a specific quantity.
3. Confirm the meal and daily calorie, protein, carbohydrate, and fat totals change by the food's calculated values.
4. Reload the page.
5. Confirm the food, quantity, and totals remain unchanged.

**What would make this fail:** totals use the wrong quantity, another meal changes, or the entry disappears after reload.

## A user creates and reuses a recipe

1. Create a recipe from two known foods and set its number of servings.
2. Confirm the recipe totals equal the sum of its ingredients.
3. Add one serving of the recipe to today's diet.
4. Confirm the meal receives one serving's values rather than the whole recipe's values.

**What would make this fail:** ingredient totals drift, serving division is wrong, or adding the recipe mutates its definition.

## A user changes the macro profile without rewriting history

1. Record today's food and note the consumed totals.
2. Change the active calorie and macronutrient targets.
3. Return to today's diet.
4. Confirm consumed totals are unchanged and only progress against the targets changes.

**What would make this fail:** changing a target edits recorded food or recalculates historical intake as different food.

## A user records body progress

1. Add a weight and body measurement for a known date.
2. Add a second entry for a later date.
3. Confirm both entries appear in chronological history and the trend uses their actual values.
4. Reload and confirm both entries remain.

**What would make this fail:** an entry is lost, dates are reordered incorrectly, or display rounding changes the stored value.
