# Diet Domain Audit – Recipe Submodule

_Last updated: 2025-06-07_

## Overview
This audit reviews the `recipe` submodule within the diet domain, focusing on DDD adherence, modularity, and architectural issues. It covers domain logic, schema usage, error handling, and test coverage.

## Key Findings
- **ID Generation in Domain:** If present, ID generation should be moved to infrastructure or application. Check for any use of legacy utilities in domain code.
- **Schema/Type Logic:** Zod schemas are used for validation and transformation. Ensure transformation logic (e.g., setting `__type`) is isolated for clarity.
- **Repository Interface:** The domain defines a `RecipeRepository` interface, which is good for abstraction and testability. Review for strict contracts and nullability.
- **Error Handling:** No direct use of side-effect utilities in domain, which is correct. However, there are no custom error classes for domain invariants or business rules.
- **Test Coverage:** There is a test file for recipe operations, but coverage of invariants and edge cases should be reviewed.

## Urgency
- **High:** Remove any ID generation and legacy utility usage from domain code.
- **Medium:** Migrate recipe module to day-diet architecture: implement Gateway layer (`createSupabaseRecipeGateway()`), Repository layer with cache management, Store layer with reactive signals, and Service/UseCase layers following established patterns.
- **Low:** Refactor transformation logic for clarity and add custom error classes for domain rules.

## Next Steps
- [ ] Refactor any ID generation to infrastructure/application.
- [ ] Audit all domain files for legacy/shared utility imports.
- [ ] Review and document the `RecipeRepository` interface for strictness and nullability.
- [ ] Add and document custom error types for domain invariants.
- [ ] Review and improve test coverage for recipe domain logic.

## Future Refinement Suggestions
- Expand audit to cover cross-module dependencies (e.g., meal, item-group).
- Review Zod schema usage for separation of validation vs. transformation.
- Propose stricter contracts for domain operations and invariants.
