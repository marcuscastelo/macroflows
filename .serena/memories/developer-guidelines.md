# Developer Guidelines (consolidated)

This memory consolidates code style, TypeScript patterns, repository patterns, and file movement policies for the macroflows project.

## Key Rules
- Barrel files (`index.ts`) are strictly forbidden. Always import directly from the specific file.
- Use absolute imports with the `~/` prefix; avoid relative imports.
- Use `type` aliases instead of `interface` and avoid `class`/`implements` entirely. Prefer factory functions that return plain objects.
- JSDoc: add JSDoc to all exported TypeScript types and exported functions describing purpose, parameters, and return values.
- Avoid `any` except in infrastructure when interacting with external APIs.
- Always use static imports at the top of files.

## File Movement Policy
- When moving content from one file to another, DELETE the original file completely. Do not leave placeholder comments or stubs like `// This file has been moved to...`.

## Error Handling
- Domain layer: throw pure errors only.
- Application layer: catch domain errors and surface user-friendly messages with `showError`; log telemetry with `logging` and `src/modules/observability`.
- Attach context to errors using `cause` or a `context` property where available.

## Tests & Quality
- Update tests when changing code; remove orphaned tests for deleted functionality.
- Run `pnpm check` and `pnpm test` during validation.

## Where to find source rules
This memory draws primary rules from:
- `code_style_and_conventions`
- `typescript-patterns`
- `repository-pattern`
- `file-movement-policy`

Keep this memory as the canonical quick reference for daily development decisions. For full rationale and examples, see the archived originals in `archive/` memories.
