# Commit Generator

Generate conventional commit messages and execute commits.

## Usage

```
/commit
```

## Process

1. **Verify** staged changes exist
2. **Analyze** changes using `scripts/copilot-commit-info.sh`
3. **Generate** conventional commit message in English
4. **Execute** commit with proper shell escaping

## Format

- **Type:** feat, fix, refactor, test, chore, docs, style, perf, ci
- **Scope:** Module/component when applicable  
- **Message:** `type(scope): description`
- **Language:** Always English
- **Security:** Never include sensitive data

## Example

```bash
feat(day-diet): add copy previous day functionality
```

## Requirements

- Staged git changes
- `scripts/copilot-commit-info.sh` available
- Git repository initialized