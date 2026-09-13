# Holdout scenarios

## The same food in two meals remains two independent entries

1. Add the same food and quantity to breakfast and dinner.
2. Change only the dinner quantity.
3. Confirm breakfast is unchanged and daily totals reflect both entries exactly once.
4. Reload and confirm both meal assignments persist.

## Editing a recipe does not rewrite an already recorded meal silently

1. Create a recipe and add one serving to today's diet.
2. Record the consumed totals.
3. Change an ingredient in the recipe definition.
4. Confirm the application either preserves the recorded meal values or explicitly asks before updating them.
5. Confirm no unrelated meal or body record changes.

## A second account cannot observe the first account's data

1. Create nutrition and body entries as account A.
2. Sign out and sign in as account B.
3. Search diets, recipes, templates, favorites, weight, and measurements.
4. Confirm none of account A's private records appear.
