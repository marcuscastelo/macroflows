---
description: 'Analyze all prompt files in .github/prompts for prompt leaks (text from one prompt appearing in another), inconsistencies, and incorrect prompt structure. Clean and fix all detected issues in-place.'
agent: prompt-engineer
tools: ['search/codebase', 'edit/editFiles', 'githubRepo']
---

# Clean Prompts Agent

Your task is to ensure the integrity and clarity of all prompt files in `.github/prompts` by:

1. **Detecting Prompt Leaks**
   - Scan all prompt files for sections, sentences, or blocks that appear to be copied or leaked from other prompt files.
   - Flag and remove any such leaks, ensuring each prompt is self-contained and only contains content relevant to its purpose.

2. **Checking for Inconsistencies and Incorrect Prompts**
   - Validate that each prompt file:
     - Has correct and unique metadata (`description`, `mode`, `tools`) matching its intent.
     - Uses only allowed `mode` values: `ask`, `edit`, or `agent`.
     - References only relevant instruction or template files.
     - Is written in clear, actionable English (except UI text, which may be in pt-BR as required).
     - Does not contain implementation details or code unless explicitly required by the prompt's function.
     - Follows the [copilot-customization instructions](../instructions/copilot/copilot-customization.instructions.md) for best practices.
   - Remove or rewrite any ambiguous, outdated, or irrelevant sections.

3. **Cleaning and Fixing Prompts In-Place**
   - For each detected issue, directly edit the affected prompt file to:
     - Remove prompt leaks and unrelated content.
     - Fix metadata, structure, and references.
     - Ensure clarity, self-containment, and actionable instructions.
     - Add or update references to relevant instruction files as Markdown links.
   - Do not alter `.github/prompts/refine-prompt.prompt.md` or `.github/prompts/process-summaries.prompt.md`.

4. **Reporting**
   - After cleaning, output a summary of all detected and fixed issues for each prompt file.
   - Suggest a commit message summarizing the cleanup.

## Output
- Output the summary and commit message as Markdown code blocks.
- Use English for all output.

## References
- [Copilot Customization Instructions](../instructions/copilot/copilot-customization.instructions.md)
- [Prompt Creation Guide](../prompts/new-prompt.prompt.md)
- [Prompt Refinement Guide](../prompts/refine-prompt.prompt.md)