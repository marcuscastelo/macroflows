# Mission

**Derived from:** `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, and `docs/BOUNDARIES.md`
**Last reconciled with them:** 2026-09-13

## What Macroflows is

Macroflows is a personal nutrition tracker for planning meals, recording food and body data, and seeing daily calorie and macronutrient progress. It favors fast daily use, deterministic calculations, and data that remains useful after a reload.

The current product is a SolidJS application backed by Supabase. It is primarily built for one person's nutrition routine, even though the architecture may later support a broader product.

## Who it is for

- A person who wants to plan meals and track nutrition, weight, measurements, recipes, and reusable meal templates in one place.

Macroflows is not a medical care platform.

## Core capabilities (in scope)

**Daily nutrition**
- Record foods and quantities in meals.
- Calculate calories, protein, carbohydrates, and fat from the recorded quantities.
- Compare daily totals with the active macro profile.

**Food, recipe, and template management**
- Search the food catalog, recent foods, favorites, and barcode data.
- Create recipes and reusable meal templates with calculated nutrition.

**Body progress**
- Record weight and body measurements.
- Display history and trends without rewriting prior entries.

**Account and persistence**
- Authenticate users and keep each user's data separate.
- Persist the user's nutrition and body records through Supabase.

## Out of scope -- the factory must never build this

1. Medical diagnosis, treatment, prescriptions, or clinical risk scoring.
2. A public social feed, direct messaging network, or influencer platform.
3. Food ordering, delivery, grocery sales, or a restaurant marketplace.
4. Insurance, electronic health record, or clinical-provider workflows.
5. Workout execution, exercise coaching, or gym-management features.
6. Advertising profiles or sale of nutrition and body data to third parties.
7. Automatic changes to a person's goals or recorded intake without explicit confirmation.

## Hard invariants -- not tunable by any issue

1. Nutrition totals are derived deterministically from the stored food, quantity, recipe, and profile data.
2. One user's private nutrition and body data must never be readable or writable by another user.
3. A background refresh or catalog update must not silently replace a user's recorded quantity, custom food, or historical body entry.
4. Domain rules remain in their owning module; routes and UI do not become a second source of nutrition truth.
5. The factory cannot modify governance files. `MISSION.md`, `FACTORY_RULES.md`, and the repository conventions are protected.
6. The factory cannot modify its own judge. `harness/`, `.factory/locks/`, and `.factory/holdout/` remain human-controlled.

## Allowed evolutions

- Improve accessibility, responsiveness, performance, observability, and test coverage.
- Simplify transitional module boundaries while preserving documented behavior and data.
- Add food-data sources or import paths that preserve provenance and user control.

## Definition of done

**Gate 1 -- static checks and tests pass.** `pnpm lint`, `pnpm type-check`, and `pnpm test` pass.

**Gate 2 -- product behavior stays explicit.** A user-facing change preserves deterministic totals, per-user isolation, and persisted history.

**Gate 3 -- a real nutrition path passes.** The runtime starts, a user records nutrition data, the totals change by the expected amount, and the result survives a reload.

## Open questions -- decisions nobody has made yet

The factory may propose an answer and hold the merge for human approval when an issue requires a product decision not settled by the repository.

- Whether Macroflows remains a personal application or becomes a multi-user paid product.
- Which new food-data sources may become authoritative enough for automatic catalog updates.

The following decisions stop the factory until a person answers them:

- Any change to authentication identity or who may act as another user.
- Any migration that deletes or irreversibly rewrites stored nutrition or body history.

## What the factory does not own -- permanently human

- Whether the daily logging flow feels fast enough for repeated use.
- Whether charts, meal density, and information hierarchy are readable on the target devices.
- Whether nutrition language is understandable without implying medical advice.

The factory owns deterministic rules, persistence contracts, isolation, and repeatable checks. A person owns product taste and health-related judgment.
