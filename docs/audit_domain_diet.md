# Diet Domain Audit

_Last updated: 2025-06-07_

## Overview
This audit reviews the entire "diet" module's domain layer for DDD adherence, modularity, and architectural issues. Each submodule has a dedicated audit file for detailed findings and recommendations.

## Submodule Audit Index
| Submodule         | Audit File                                   |
|-------------------|----------------------------------------------|
| api               | [audit_domain_diet_api.md](./audit_domain_diet_api.md) |
| day-diet          | [audit_domain_diet_day-diet.md](./audit_domain_diet_day-diet.md) |
| food              | [audit_domain_diet_food.md](./audit_domain_diet_food.md) |
| item              | [audit_domain_diet_item.md](./audit_domain_diet_item.md) |
| item-group        | [audit_domain_diet_item-group.md](./audit_domain_diet_item-group.md) |
| macro-nutrients   | [audit_domain_diet_macro-nutrients.md](./audit_domain_diet_macro-nutrients.md) |
| macro-profile     | [audit_domain_diet_macro-profile.md](./audit_domain_diet_macro-profile.md) |
| meal              | [audit_domain_diet_meal.md](./audit_domain_diet_meal.md) |
| recipe            | [audit_domain_diet_recipe.md](./audit_domain_diet_recipe.md) |
| recipe-item       | [audit_domain_diet_recipe-item.md](./audit_domain_diet_recipe-item.md) |
| template          | [audit_domain_diet_template.md](./audit_domain_diet_template.md) |
| template-item     | [audit_domain_diet_template-item.md](./audit_domain_diet_template-item.md) |

## Key Findings (Summary)
- **ID Generation:** Several submodules (e.g., meal, item, item-group) perform ID generation in domain code, breaking DDD purity. This must be refactored to infrastructure or application layers.
- **Schema/Type Logic:** Zod schemas are consistently used, but transformation logic is sometimes mixed with validation. Isolate transformation for clarity.
- **Architecture Modernization:** Submodules should follow day-diet standard: Gateway layer for Supabase interaction, Repository layer for cache management and error handling, Store layer for reactive state with signals, Service layer for complex business logic, and UseCase layer for user operations with toast integration.
- **Error Handling:** No direct use of side-effect utilities in domain (correct), but custom error classes for domain invariants are generally missing.
- **Test Coverage:** Test files exist for most submodules, but coverage of invariants and edge cases should be improved.

## Urgency
- **High:** Remove all ID generation and legacy utility usage from domain code across submodules.
- **Medium:** Migrate all diet submodules to day-diet architecture: implement `createSupabase*Gateway()` functions, `create*Repository()` with cache management, `*Store` objects with reactive signals, and `fetch*By*` naming conventions.
- **Low:** Refactor transformation logic and add custom error classes for domain rules.

## Next Steps
- [ ] Complete all submodule audits and track progress in this index.
- [ ] Refactor ID generation and legacy utility usage out of domain code.
- [ ] Implement day-diet architecture standard across all diet submodules: Gateway layer (`infrastructure/supabase/`), Repository layer with cache and error handling (`infrastructure/`), Store layer with reactive signals (`infrastructure/signals/`), Service layer for complex logic (`application/services/`), and UseCase layer with toast integration (`application/usecases/`).
- [ ] Review and improve test coverage for all submodules.

## Future Refinement Suggestions
- Expand audits to cover cross-module dependencies and domain events.
- Review Zod schema usage for separation of validation vs. transformation.
- Propose stricter contracts for domain operations and invariants.
