# Boundaries

> Doc status: canonical.
> This file defines the current normative dependency and ownership rules for Macroflows.

## Scope

These are the default rules for new work and opportunistic cleanup. Existing legacy exceptions may remain during migration, but they should not become the pattern for new code.

## Top-Level Ownership

### `src/modules/*`

Modules own business-facing semantics and use-case flows for their area.

- Prefer module `application` as the cross-module integration surface.
- Do not import another module's `infrastructure` as an integration shortcut.
- Keep module-specific semantics inside the owning module instead of moving them into `src/shared/*`.

### `src/sections/*`

Sections own page and feature composition.

- Compose module application flows and UI pieces.
- Do not become the canonical home of domain truth.
- Do not define cross-module semantic rules that belong in a module.

### `src/shared/*`

Shared owns technical cross-cutting helpers and framework support.

- May serve modules and sections.
- Must not become a dumping ground for feature-specific business semantics.
- Must not depend on `src/sections/*`.

### `src/routes/*`

Routes own route entrypoints and API endpoints.

- Compose sections and application flows.
- Must not become a second business-logic layer.

### `src/di/*`

DI owns dependency wiring and default composition.

- May import across modules for assembly.
- Must not define or reinterpret business rules.

## Layer Rules

### Domain

- Owns business rules, validation shapes, and contracts.
- Must not import UI, routes, Supabase clients, toasts, or telemetry side effects.
- Uses standard `Error` with descriptive messages and optional `cause`.
- Do not introduce custom error hierarchies by default.

### Application

- Orchestrates use cases, error handling, and side effects.
- May depend on domain and infrastructure.
- Handles user-facing feedback with `showError` and telemetry with `logging`.
- Should be the default integration layer used by sections and routes.

### Infrastructure

- Owns external systems, repositories, gateways, caches, and transport details.
- Implements contracts owned by modules.
- Must not become the place where canonical business semantics are invented.

### UI

- Owns rendering and interaction concerns.
- May compose application flows and view-model shaping for presentation.
- Must not redefine canonical business truth that belongs in a module.

## Cross-Module Rules

- Prefer composition through module application APIs instead of direct domain or infrastructure coupling.
- Avoid creating backdoor dependencies from one feature into another feature's internal storage, transport, or cache implementation.
- If a shared rule is actually business-specific, move it to the owning module instead of `src/shared/*`.
- If a decision changes ownership boundaries, update this file and the relevant ADR in the same change.

## Transitional Reality

`src/modules/diet/*` is still a large transitional macro-context. Canonical docs should describe its current ownership honestly and avoid pretending the repo already has a fully separated bounded-context model.

## See Also

- `../AGENTS.md`
- `./ARCHITECTURE.md`
- `./DOCS_GOVERNANCE.md`
- `./adr/0002-current-repo-architecture-and-boundaries.md`
