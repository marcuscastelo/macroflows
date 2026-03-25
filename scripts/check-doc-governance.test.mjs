import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { checkDocsGovernance } from './check-doc-governance.mjs'

const REQUIRED_CANONICAL_FILES = [
  'AGENTS.md',
  'docs/ARCHITECTURE.md',
  'docs/BOUNDARIES.md',
  'docs/DOCS_GOVERNANCE.md',
  'docs/README.md',
  'docs/adr/README.md',
  'docs/adr/_template.md',
  'docs/adr/0001-canonical-agent-instructions-and-doc-precedence.md',
  'docs/adr/0002-current-repo-architecture-and-boundaries.md',
  'docs/adr/0003-error-handling-and-simplification-defaults.md',
]

const POINTER_FILES = [
  'CLAUDE.md',
  'GEMINI.md',
  '.github/copilot-instructions.md',
]

const SUPPORTING_DOCS = [
  '.github/README.md',
  '.github/copilot-commit-message-instructions.md',
  'docs/ARCHITECTURE_GUIDE.md',
  'docs/CODESTYLE_GUIDE.md',
  'docs/ARCHITECTURE_AUDIT.md',
  'docs/audit_domain.md',
  'docs/audit_domain_diet.md',
  'docs/audit_domain_diet_food.md',
  'docs/audit_domain_diet_recipe.md',
  'docs/audit_sections.md',
  'docs/COPILOT_SHORT_GUIDE.md',
  'docs/RECIPE_MIGRATION_AUDIT.md',
  'docs/DEPRECATION_PLAN_V0.14.0.md',
  'DI-migration-plan.md',
  '.github/COPILOT_SETUP_VALIDATION.md',
]

const ARCHIVED_DOCS = ['docs/archive/TODO-REPO-DOC.md']

const MANAGED_PROMPT_FILES = [
  '.github/prompts/issues-worktree.prompt.md',
  '.github/prompts/refine-github-issue.prompt.md',
  '.github/prompts/refactor.prompt.md',
  '.github/prompts/pr-reviews.prompt.md',
  '.github/prompts/code-review.prompt.md',
]

const tempDirs = new Set()

function createTempRepo() {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'macroflows-docs-check-'))
  tempDirs.add(tempDir)
  return tempDir
}

function writeFile(repoRoot, relativePath, content) {
  const absolutePath = path.join(repoRoot, relativePath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, content)
}

function buildValidFixture(repoRoot) {
  for (const relativePath of REQUIRED_CANONICAL_FILES) {
    if (relativePath === 'docs/adr/README.md') {
      writeFile(
        repoRoot,
        relativePath,
        [
          '# ADR README',
          '',
          '> Doc status: canonical.',
          '- 0001-canonical-agent-instructions-and-doc-precedence.md',
          '- 0002-current-repo-architecture-and-boundaries.md',
          '- 0003-error-handling-and-simplification-defaults.md',
          '- ./_template.md',
          '',
        ].join('\n'),
      )
      continue
    }

    writeFile(
      repoRoot,
      relativePath,
      ['# Canonical', '', '> Doc status: canonical.', '', 'pnpm check', 'AGENTS.md', ''].join('\n'),
    )
  }

  for (const relativePath of POINTER_FILES) {
    writeFile(
      repoRoot,
      relativePath,
      [
        '# Pointer',
        '',
        '> Doc status: pointer.',
        '',
        'Canonical repo policy lives in AGENTS.md.',
        'If anything in this file conflicts with AGENTS.md or the canonical docs, the canonical docs win.',
        '',
      ].join('\n'),
    )
  }

  for (const relativePath of SUPPORTING_DOCS) {
    writeFile(
      repoRoot,
      relativePath,
      ['# Supporting', '', '> Doc status: supporting.', '> This document is not a source of truth.', ''].join('\n'),
    )
  }

  for (const relativePath of ARCHIVED_DOCS) {
    writeFile(
      repoRoot,
      relativePath,
      ['# Archived', '', '> Doc status: archived.', '> Historical only.', ''].join('\n'),
    )
  }

  for (const relativePath of MANAGED_PROMPT_FILES) {
    writeFile(repoRoot, relativePath, 'Use AGENTS.md for repo-wide rules.\n')
  }

  writeFile(repoRoot, 'README.md', '# README\n')
}

describe('check-doc-governance.mjs', () => {
  afterEach(() => {
    for (const tempDir of tempDirs) {
      rmSync(tempDir, { recursive: true, force: true })
      tempDirs.delete(tempDir)
    }
  })

  it('passes for a valid minimal fixture', () => {
    const repoRoot = createTempRepo()
    buildValidFixture(repoRoot)

    const failures = checkDocsGovernance(repoRoot)

    expect(failures).toEqual([])
  })

  it('reports a missing pointer file without crashing', () => {
    const repoRoot = createTempRepo()
    buildValidFixture(repoRoot)
    rmSync(path.join(repoRoot, 'CLAUDE.md'))

    const failures = checkDocsGovernance(repoRoot)

    expect(failures).toContain('Missing pointer file: CLAUDE.md')
    expect(failures.join('\n')).not.toContain('ENOENT')
  })

  it('reports a missing adr directory without crashing', () => {
    const repoRoot = createTempRepo()
    buildValidFixture(repoRoot)
    rmSync(path.join(repoRoot, 'docs/adr'), { recursive: true, force: true })

    const failures = checkDocsGovernance(repoRoot)

    expect(failures).toContain('docs/adr must exist and be a directory')
    expect(failures).toContain('Missing required canonical file: docs/adr/README.md')
    expect(failures.join('\n')).not.toContain('ENOENT')
  })

  it('reports a missing canonical file without crashing on file-shape checks', () => {
    const repoRoot = createTempRepo()
    buildValidFixture(repoRoot)
    rmSync(path.join(repoRoot, 'docs/ARCHITECTURE.md'))

    const failures = checkDocsGovernance(repoRoot)

    expect(failures).toContain('Missing required canonical file: docs/ARCHITECTURE.md')
    expect(failures.join('\n')).not.toContain('ENOENT')
  })
})
