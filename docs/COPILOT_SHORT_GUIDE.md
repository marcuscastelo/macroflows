# Copilot Short Guide

See `.github/copilot-instructions.md` for the full instructions.

- Use descriptive, action-based names.
- Never use side-effect utilities (like `showError`) in domain code.
- Application layer should use `showError` for toasts and `logging` for telemetry.
- Use `void` for fire-and-forget promises only in event handlers.
- All code/comments in English (UI text in pt-BR if required).
- Never use `any`, always prefer type aliases.
- Always update or remove related tests when changing code.
- Follow Prettier/ESLint for formatting.
- Prefer small, atomic commits and always suggest a commit message after changes.
- Never use dynamic imports. Always use static imports at the top.

## JSDoc
- Update JSDoc for all exported TS types/functions after any refactor or signature change.