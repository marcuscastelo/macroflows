import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const thisFilePath = fileURLToPath(import.meta.url)

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

const CANONICAL_DOCS_FOR_LEGACY_COMMAND_SCAN = [
  'AGENTS.md',
  'docs/ARCHITECTURE.md',
  'docs/BOUNDARIES.md',
  'docs/DOCS_GOVERNANCE.md',
  'docs/README.md',
]

const TOP_LEVEL_DOCS_FOR_COPILOT_MAIN_FILE_SCAN = [
  'README.md',
  'docs/COPILOT_SHORT_GUIDE.md',
  '.github/COPILOT_SETUP_VALIDATION.md',
]

export function checkDocsGovernance(repoRoot = process.cwd()) {
  const failures = []

  function absolutePath(relativePath) {
    return path.join(repoRoot, relativePath)
  }

  function pathExists(relativePath) {
    return existsSync(absolutePath(relativePath))
  }

  function isFile(relativePath) {
    try {
      return statSync(absolutePath(relativePath)).isFile()
    } catch {
      return false
    }
  }

  function isDirectory(relativePath) {
    try {
      return statSync(absolutePath(relativePath)).isDirectory()
    } catch {
      return false
    }
  }

  function read(relativePath) {
    try {
      return readFileSync(absolutePath(relativePath), 'utf8')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`Failed to read ${relativePath}: ${message}`)
      return null
    }
  }

  function assert(condition, message) {
    if (!condition) {
      failures.push(message)
    }
  }

  function assertBanner(relativePath, expectedStatus) {
    const content = read(relativePath)
    if (content === null) {
      return
    }

    const head = content.split('\n').slice(0, 12).join('\n')
    assert(
      head.includes(`Doc status: ${expectedStatus}.`),
      `${relativePath} must declare "Doc status: ${expectedStatus}." near the top`,
    )
  }

  for (const relativePath of REQUIRED_CANONICAL_FILES) {
    assert(pathExists(relativePath), `Missing required canonical file: ${relativePath}`)
  }

  for (const relativePath of [
    'AGENTS.md',
    'docs/ARCHITECTURE.md',
    'docs/BOUNDARIES.md',
    'docs/DOCS_GOVERNANCE.md',
    'docs/README.md',
    'docs/adr/README.md',
  ]) {
    if (pathExists(relativePath)) {
      assertBanner(relativePath, 'canonical')
    }
  }

  for (const relativePath of POINTER_FILES) {
    assert(pathExists(relativePath), `Missing pointer file: ${relativePath}`)
    if (!isFile(relativePath)) {
      assert(false, `${relativePath} must be a file`)
      continue
    }

    const content = read(relativePath)
    if (content === null) {
      continue
    }

    assert(content.includes('Doc status: pointer.'), `${relativePath} must declare pointer status`)
    assert(content.includes('AGENTS.md'), `${relativePath} must point to AGENTS.md`)
    assert(
      /canonical docs win/i.test(content),
      `${relativePath} must state that canonical docs win on conflicts`,
    )
  }

  for (const relativePath of SUPPORTING_DOCS) {
    assert(pathExists(relativePath), `Missing managed supporting doc: ${relativePath}`)
    if (pathExists(relativePath)) {
      assertBanner(relativePath, 'supporting')
    }
  }

  for (const relativePath of ARCHIVED_DOCS) {
    assert(pathExists(relativePath), `Missing managed archived doc: ${relativePath}`)
    if (pathExists(relativePath)) {
      assertBanner(relativePath, 'archived')
    }
  }

  for (const relativePath of CANONICAL_DOCS_FOR_LEGACY_COMMAND_SCAN) {
    if (!pathExists(relativePath) || !isFile(relativePath)) {
      continue
    }

    const content = read(relativePath)
    if (content === null) {
      continue
    }

    assert(!content.includes('npm run check'), `${relativePath} must not prefer "npm run check"`)
    assert(!content.includes('npm run copilot:check'), `${relativePath} must not prefer the legacy Copilot quality gate`)
  }

  for (const relativePath of TOP_LEVEL_DOCS_FOR_COPILOT_MAIN_FILE_SCAN) {
    if (!pathExists(relativePath) || !isFile(relativePath)) {
      continue
    }

    const content = read(relativePath)
    if (content === null) {
      continue
    }

    assert(
      !/main instruction file/i.test(content),
      `${relativePath} must not describe .github/copilot-instructions.md as the main instruction file`,
    )
    assert(
      !/See `?\.github\/copilot-instructions\.md`? for the full instructions\./i.test(content),
      `${relativePath} must not send readers to .github/copilot-instructions.md as the full instruction source`,
    )
  }

  for (const relativePath of MANAGED_PROMPT_FILES) {
    if (!pathExists(relativePath) || !isFile(relativePath)) {
      continue
    }

    const content = read(relativePath)
    if (content === null) {
      continue
    }

    assert(content.includes('AGENTS.md'), `${relativePath} must reference AGENTS.md for repo-wide rules`)
    assert(
      !content.includes('copilot-instructions.md](../copilot-instructions.md)'),
      `${relativePath} must not route repo-wide rules through .github/copilot-instructions.md`,
    )
  }

  const adrDir = 'docs/adr'
  const adrFiles = []

  if (!pathExists(adrDir)) {
    failures.push('docs/adr must exist and be a directory')
  } else if (!isDirectory(adrDir)) {
    failures.push('docs/adr must be a directory')
  } else {
    adrFiles.push(
      ...readdirSync(absolutePath(adrDir))
        .filter((fileName) => /^\d{4}-.*\.md$/.test(fileName))
        .sort(),
    )
  }

  assert(adrFiles.length >= 3, 'docs/adr must contain the bootstrap ADR files')
  for (const fileName of adrFiles) {
    assert(/^\d{4}-/.test(fileName), `ADR file must use zero-padded numbering: ${fileName}`)
  }

  const adrReadme = pathExists('docs/adr/README.md') && isFile('docs/adr/README.md')
    ? read('docs/adr/README.md')
    : null
  if (adrReadme !== null) {
    for (const fileName of adrFiles) {
      assert(adrReadme.includes(fileName), `docs/adr/README.md must reference ${fileName}`)
    }
    assert(adrReadme.includes('./_template.md'), 'docs/adr/README.md must reference ./_template.md')
  }

  for (const relativePath of REQUIRED_CANONICAL_FILES) {
    if (!pathExists(relativePath)) {
      continue
    }
    assert(isFile(relativePath), `${relativePath} must be a file`)
  }

  return failures
}

export function runDocsGovernanceCheck(repoRoot = process.cwd()) {
  const failures = checkDocsGovernance(repoRoot)

  if (failures.length > 0) {
    console.error('docs:check failed:')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    return 1
  }

  console.log('docs:check passed')
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === thisFilePath) {
  process.exit(runDocsGovernanceCheck())
}
