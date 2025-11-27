# Code Style and Conventions

## Import and Module System
- **REQUIRED**: Always use absolute imports with `~/` prefix
- **FORBIDDEN**: Relative imports (`../`, `./`)
- **FORBIDDEN**: Barrel files (`index.ts` re-exports)
- **REQUIRED**: Static imports at top of file
- **REQUIRED**: Type imports with inline syntax: `import { type Foo } from '~/module'`

## Language Policy
- **All code, comments, JSDoc, and commit messages in English**
- **UI text only may be in Portuguese (pt-BR) when required**
- **Never use Portuguese for identifiers, variables, functions, or comments**

## Naming Conventions
- **Descriptive, action-based names**: `isRecipedGroupUpToDate()` not `checkGroup()`
- **Specific file names**: `macroOverflow.ts` not `utils.ts`
- **Complete component names**: `ItemGroupEditModal` not `GroupModal`
- **Avoid generic names**: Never use `utils.ts`, `helper.ts`, `common.ts`

## Type Safety Requirements
- **NEVER use `any`, `as any`, or `@ts-ignore`** (except infrastructure layer for external APIs)
- **Always prefer type aliases over interfaces** for data shapes
- **Use Zod schemas for runtime validation and type inference**
- **Prefer `readonly` arrays**: `readonly Item[]` over `Item[]`
- **Use intersection types for extending**: `ConfigType = PropsType & { extraProps }`
- **Default parameters over nullish coalescing**: `{ param = 'default' }` instead of `param ?? 'default'`

## Error Handling Standards
- **Domain Layer**: Only throw pure domain errors with descriptive messages and context via `cause`
- **Application Layer**: Catch domain errors and use `showError` for toasts and `logging` for telemetry
- **Error Context Requirements**:
  - `component`: Specific component/module name
  - `operation`: Specific operation being performed
  - `additionalData`: Relevant IDs, state, or debugging info

## ESLint Rules
- **Consistent type definitions**: Use `type` not `interface`
- **Import organization**: Automatic sorting with `simple-import-sort`
- **No relative imports**: Enforced by `no-restricted-imports` rule
- **Strict boolean expressions**: Enforced for better type safety
- **Custom parsing requirement**: Use `parseWithStack` instead of direct `JSON.parse`

## CSS and Styling
- **Always use `cn` function to merge Tailwind classes** for proper deduplication
- **TailwindCSS v4.1.8** with DaisyUI v5.0.43 for component styling