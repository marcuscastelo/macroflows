# GitHub Copilot Configuration

This directory contains configuration files for GitHub Copilot coding agent to help maintain code quality and consistency across the macroflows project.

## Structure

```
.github/
├── copilot-instructions.md          # Main instructions for all code generation
├── copilot-commit-message-instructions.md  # Commit message generation guidelines
├── instructions/                    # Scoped instruction files
│   └── copilot/                    # Instructions for Copilot-related files
├── prompts/                        # Reusable prompt templates
│   ├── *.prompt.md                 # Various task-specific prompts
│   └── ...
├── workflows/                      # GitHub Actions workflows
└── README.md                       # This file
```

## Main Configuration Files

### `copilot-instructions.md`

The main instruction file that applies to all code in the repository (`applyTo: "**"`). It contains:

- **Setup instructions**: Environment setup and commands
- **Coding standards**: TypeScript, SolidJS, and Clean Architecture patterns
- **Error handling**: Domain vs Application layer responsibilities
- **Testing**: Test requirements and validation procedures
- **Project-specific rules**: Barrel file ban, import conventions, etc.

Key principles enforced:
- Use Clean Architecture (Domain + Application layers)
- Never use barrel index files (no re-exports from `index.ts`)
- Always use absolute imports with `~/` prefix
- Domain code must be pure (no side effects)
- Application code must use `handleApiError` for error handling

### `copilot-commit-message-instructions.md`

Defines strict Conventional Commits standards:

- **Types**: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `build`, `ci`, `chore`, `revert`, `rename`
- **Scoping**: Use module-based scopes (e.g., `feat(auth):`, `fix(meal,day-diet):`)
- **Quality rules**: 
  - Avoid vague phrases like "for clarity" or "for better understanding"
  - Use `rename` type for file/symbol renames (never `add` or `implement`)
  - Technical English only
  - Breaking changes require `!` after type and explanation in body

### `instructions/` Directory

Contains scoped instruction files with `.instructions.md` suffix:

- **copilot/copilot-customization.instructions.md**: Applies to `.github/**/*.md` files
  - Contains comprehensive VS Code Copilot customization documentation
  - Explains instruction files, prompt files, and settings

### `prompts/` Directory

Contains 28+ reusable prompt templates (`.prompt.md` files) for common tasks:

- **GitHub Issues**: Bug reports, features, refactors, sub-issues, etc.
- **Code Review**: PR review prompts
- **Development**: Refactoring, fixing, implementation prompts
- **Project Management**: Milestone management, prioritization, etc.

Each prompt file can include:
- Frontmatter with `mode`, `tools`, and `description`
- Structured instructions
- References to other prompts or instruction files

## Usage Guidelines

### For Developers

1. **New Features**: Follow instructions in `copilot-instructions.md`
2. **Commit Messages**: Follow guidelines in `copilot-commit-message-instructions.md`
3. **Code Quality**: Run `pnpm run copilot:check` to validate changes
4. **Prompts**: Use prompts in `prompts/` directory for common tasks

### For Copilot Coding Agent

All instructions in this directory are automatically applied when Copilot generates code:

1. Main instructions from `copilot-instructions.md` apply to all files
2. Scoped instructions from `instructions/` apply to specific file patterns
3. Commit instructions guide all commit message generation

## Validation

Before committing changes, always run:

```bash
pnpm run copilot:check
```

This runs:
- Linting (`pnpm run flint`)
- Type checking (`pnpm run type-check`)
- Tests (`pnpm run test`)

Wait for the message: **"COPILOT: All checks passed!"**

## Best Practices

1. **Keep instructions clear and specific**: Avoid generic or vague guidelines
2. **Update instructions when patterns change**: Keep documentation synchronized with codebase
3. **Use scoped instructions**: Create targeted `.instructions.md` files for specific areas
4. **Leverage prompts**: Reuse prompt templates for consistency
5. **Test the setup**: Regularly verify that Copilot follows the instructions correctly

## References

- [GitHub Copilot Docs](https://docs.github.com/en/copilot)
- [Best Practices for Copilot Coding Agent](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results)
- [Custom Instructions Documentation](https://code.visualstudio.com/docs/copilot/copilot-customization)

## Project Context

**Macroflows** is a nutrition tracking platform built with:
- **Frontend**: SolidJS, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Architecture**: Clean Architecture with Domain-Driven Design
- **Package Manager**: pnpm

This Copilot configuration ensures all AI-generated code adheres to these architectural principles and technology choices.
