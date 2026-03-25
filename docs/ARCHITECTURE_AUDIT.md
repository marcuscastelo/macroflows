# Architecture Audit – Summary

> Doc status: supporting.
> This document preserves audit history and improvement notes. It is not a source of truth; use `../AGENTS.md` and the canonical docs instead.

_Last updated: 2025-07-08_

This document provides a high-level overview of the current state of the codebase architecture, focusing on Domain-Driven Design (DDD), modularity, and separation of concerns. For detailed findings and recommendations, see the linked area-specific audits below.

## **Major Architectural Change: Unified Item System Full Migration (2025-06-27)**

A comprehensive migration to the Unified Item System has been completed for new development and in-memory operations. This means:

- **New development exclusively uses `UnifiedItem`**: All new UI and business logic are built around the `UnifiedItem` type.
- **Legacy item, item-group, and related view/edit components removed**: All legacy UI and context providers for items and groups have been deleted.
- **Centralization of business logic**: Validation, macro overflow, clipboard, and ID management logic are now handled in unified components and utilities, eliminating duplication and scattered logic.
- **Consistent type conversion**: All item and group conversions use shared utilities (`itemToUnifiedItem`, `itemGroupToUnifiedItem`), improving type safety and maintainability.
- **Improved separation of concerns**: UI components focus on presentation, with business logic delegated to application/domain layers or shared hooks.
- **Significant reduction in technical debt**: Legacy utilities and context providers have been removed or isolated, and the codebase is now easier to maintain and extend.
- **Enhanced test coverage**: Tests have been updated to use the unified item factories and conversion utilities, improving reliability and consistency.

**Note on Deprecated Types:** While the migration for new development is complete, some core domain operations (e.g., in `src/modules/diet/item-group/domain/itemGroupOperations.ts` and `src/modules/diet/recipe/domain/recipeOperations.ts`) still interact with the deprecated `Item` type. This is a deliberate decision to maintain backward compatibility and support existing data structures until the next major version release, at which point the full deprecation and removal of the `Item` type will be finalized. This approach ensures a smooth transition without breaking existing functionalities.




## Audit Index & Status
| Area                | Audit File                | Status         | Last Update   |
|---------------------|--------------------------|----------------|--------------|
| Domain Layer        | [audit_domain.md](./audit_domain.md)         | Updated       | 2025-06-27    |
| Application Layer   | [audit_application.md](./audit_application.md) | Initial       | 2025-06-07    |
| Sections/UI Layer   | [audit_sections.md](./audit_sections.md)       | Updated       | 2025-06-27    |
| Shared & Legacy     | [audit_shared_legacy.md](./audit_shared_legacy.md) | Updated       | 2025-06-27    |
| Testing Strategy    | [audit_testing_strategy.md](./audit_testing_strategy.md) | Initial       | 2025-07-08    |

---

## Key Findings (Summary)
- **Unified Item System:** All item, group, and recipe UI flows are now handled by unified components. Legacy code and duplication have been eliminated.
- **Business Logic Centralization:** Validation, macro overflow, and clipboard logic are now centralized in unified utilities and components.
- **Type Safety:** All conversions and type guards are handled by shared utilities, reducing errors and improving maintainability.
- **Legacy Utility Removal:** Most legacy utilities and context providers have been removed. Remaining usage is isolated and scheduled for migration.
- **Test Coverage:** All tests now use unified item factories and conversion utilities, improving reliability.

---

## Next Steps
- Continue migration of any remaining legacy utilities and shared code.
- Monitor unified system performance and optimize as needed.
- Expand audits to cover async flows, error propagation, and cross-module dependencies.
- Review and improve test coverage for all modules and shared utilities.

---

## Roadmap for Architecture Improvements

### 1. Domain Layer
- [ ] Refactor all ID generation and legacy utility usage out of domain code (see diet submodules, especially meal, item, item-group).
- [ ] Implement Gateway + Repository + Cache pattern across all modules following day-diet standard. Use `createSupabase*Gateway()` for data layer, `create*Repository()` for cache/error handling, and `*Store` for reactive state management.
- [ ] Expand use of value objects for identity-less concepts (e.g., measurements, macro targets).
- [ ] Clarify and document bounded contexts; split large modules if needed.
- [ ] Introduce or strengthen domain layers in modules where missing (e.g., profile).
- [ ] Review and improve domain test coverage, focusing on invariants and edge cases.
- [ ] Add custom error classes for domain invariants and business rules.

### 2. Application Layer
- [ ] Audit all error handling for proper use of `showError` and `logging` with context.
- [ ] Refactor orchestration logic to keep business rules in the domain; avoid business logic in application or UI.
- [ ] Expand audit to async flows, side effects, and error propagation.
- [ ] Create `audit_application_<module>.md` for modules with complex orchestration or async logic.
- [ ] Review application-level test coverage and integration points.

### 3. UI/Sections Layer
- [ ] Refactor duplicated logic (clipboard, schema, calculations, macro/weight/profile logic) into shared hooks/utilities.
- [ ] Move business logic (validation, calculations, state) out of UI components and into application/domain layers or custom hooks.
- [ ] Audit all section components for business logic leakage, legacy utility usage, and duplication.
- [ ] Review and improve test coverage for UI logic and shared components.
- [ ] Unify or consolidate edit modals/views (e.g., meal, recipe, item-group) if logic is highly similar.
- [ ] Standardize error handling and user feedback in UI, especially for cross-cutting features (e.g., EAN, datepicker).
- [ ] Expand audit to cover context usage, prop drilling, and state management patterns.

### 4. Shared & Legacy
- [ ] Remove legacy utility usage from domain/application code (e.g., idUtils, macroMath, deepCopy).
- [ ] Clarify migration plan and document shared module boundaries and allowed usage.
- [ ] Propose and execute migration steps for remaining legacy utilities; track progress in `audit_shared_legacy_<utility>.md` files.
- [ ] Map all shared/legacy code usage across the codebase and document migration blockers.
- [ ] Review shared code test coverage and ensure no DDD violations.

### 5. Cross-Cutting Concerns & DDD Pitfalls
- [ ] Review cross-module dependencies and domain events; avoid tight coupling and "big ball of mud" anti-patterns.
- [ ] Involve domain experts for ongoing model refinement and ensure ubiquitous language.
- [ ] Avoid overengineering (CQRS, Event Sourcing, hexagonal) unless justified by real complexity.
- [ ] Use value objects instead of entities where identity is not essential.
- [ ] Make bounded contexts explicit and avoid generic technical abstractions.
- [ ] Ensure all business rules and invariants are encapsulated in domain entities/value objects, not in services or application code.
- [ ] Expand audits to cover test structure, error propagation, and integration points.
- [ ] Document and communicate architectural decisions and DDD boundaries for new contributors.

---

## Summary

The codebase now demonstrates strong modularity and a clear intent to follow DDD and clean architecture principles. The unified item system migration is complete, and all business areas are well-structured, with separation between domain, application, and UI layers. Remaining work focuses on legacy utility migration, test coverage, and further consolidation of shared logic.

_See area-specific audits in the docs/ folder for detailed findings and actionable tasks._

---

# (Previous content moved to area-specific audits)
