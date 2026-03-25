# Architecture

> Doc status: canonical.
> This file describes the current Macroflows architecture as it exists today.

## Overview

Macroflows follows a layered, module-oriented architecture centered on `src/modules/*`, with route and feature composition living outside the modules. The repo shows strong clean-architecture intent, but some areas are still transitional and should be described as such rather than presented as already fully normalized.

## Current Structure

### `src/modules/*`

Business-facing modules live under `src/modules/*`. Many follow a layered shape with `domain`, `application`, `infrastructure`, `ui`, and `tests`.

Current top-level modules include:

- `auth`
- `clipboard`
- `diet`
- `import-export`
- `measure`
- `observability`
- `profile`
- `recent-food`
- `search`
- `template-search`
- `theme`
- `toast`
- `user`
- `weight`

### `src/modules/diet/*`

`src/modules/diet/*` is the largest transitional macro-context in the repo. It contains internal subdomains such as day-diet, food, item, macro-profile, meal, recipe, and template flows.

This area should be treated as a real structural hotspot:

- it is modular enough to reason about
- it is not yet a completed bounded-context split
- new docs should describe it honestly as a transition zone rather than flattening it into a single clean abstraction

### `src/sections/*`

`src/sections/*` contains page-level and feature-level composition. It is the main place where UI regions, cross-module presentation flows, and route-facing composition live.

### `src/shared/*`

`src/shared/*` contains technical cross-cutting code such as utilities, modal infrastructure, Supabase integration helpers, testing helpers, and framework-specific helpers. It is not the home for canonical nutrition semantics or feature-specific business truth.

### `src/routes/*`

`src/routes/*` owns route entrypoints and API endpoints. Routes compose application flows and page/feature sections instead of becoming a second business-logic layer.

### `src/di/*`

`src/di/*` is the explicit wiring and composition root. It exists to assemble defaults and dependencies, not to define business rules.

## Layer Model

For modules that follow the layered pattern:

- `domain`: business rules, schemas, and contracts
- `application`: orchestration, use cases, and side-effect coordination
- `infrastructure`: external systems, repositories, gateways, and reactive stores
- `ui`: module-local presentation components
- `tests`: validation of module behavior

Some modules are stronger on this pattern than others. Canonical docs should treat this as the repo standard while acknowledging that some modules remain less mature or less consistently split.

## Current Architectural Themes

- Strong emphasis on TypeScript and Zod for safety
- Preference for module-oriented organization over generic shared abstractions
- Growing use of explicit DI and composition roots
- Ongoing tension between legacy compatibility work and simplification goals
- A deliberate need to keep “current truth” separate from audits, migration plans, and historical documents

## See Also

- `../AGENTS.md`
- `./BOUNDARIES.md`
- `./DOCS_GOVERNANCE.md`
- `./adr/README.md`
