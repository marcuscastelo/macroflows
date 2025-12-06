# Architecture and Code Structure

## Clean Architecture Pattern
The project follows a strict 3-layer Domain-Driven Design (DDD) architecture:

### 1. Domain Layer (`modules/*/domain/`)
- **Purpose**: Pure business logic, types, and repository interfaces
- **Characteristics**: 
  - Framework-agnostic
  - Uses Zod schemas for validation and type inference
  - Entities have `__type` discriminators for type safety
  - NEVER imports side-effect utilities (showError, logging, toasts)
  - Only throws pure errors with descriptive messages and context via `cause`

### 2. Application Layer (`modules/*/application/`)
- **Purpose**: SolidJS resources, signals, and orchestration logic
- **Characteristics**:
  - Catches domain errors and uses `showError` for toasts and `logging` for telemetry
  - Manages global reactive state using `createSignal`/`createEffect`
  - Coordinates between UI and infrastructure layers
  - Handles all side effects and user feedback (toasts, notifications)

### 3. Infrastructure Layer (`modules/*/infrastructure/`)
- **Purpose**: Supabase repositories implementing domain interfaces
- **Characteristics**:
  - DAOs for data transformation and legacy migration
  - External API integrations and data access
  - Only layer allowed to use `any` types when necessary for external APIs

## Directory Structure
```
src/
├── modules/           # Domain modules (diet, measure, user, weight, etc.)
│   └── <domain>/
│       ├── domain/          # Pure business logic, types, repository interfaces
│       ├── application/     # SolidJS resources, orchestration, error handling
│       ├── infrastructure/  # Supabase implementations, DAOs, external APIs
│       └── tests/          # Module-specific tests
├── sections/          # Page-level UI components and user-facing features
├── routes/           # SolidJS router pages and API endpoints
├── shared/           # Cross-cutting concerns and utilities
└── assets/           # Static assets (locales, images)
```

## Key Domain Modules
- **diet**: Core nutrition tracking (day-diet, food, item, meal, recipe, unified-item)
- **measure**: Body measurements and metrics
- **user**: User management and authentication
- **weight**: Weight tracking and evolution
- **toast**: Notification system
- **search**: Search functionality with caching
- **recent-food**: Recently used food items
- **profile**: User profile management
- **theme**: Theme management