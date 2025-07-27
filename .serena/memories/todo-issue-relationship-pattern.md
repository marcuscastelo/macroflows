# TODO Comments and GitHub Issues Relationship

## Key Pattern
- TODO comments in codebase are **NOT automatically linked** to GitHub issues
- Users consistently ask about existing issues before creating new ones
- Common workflow: TODO discovered → Check for existing issue → Create issue if needed

## Search Strategy for TODO-Issue Correlation
1. Search codebase for TODO comments: `search_for_pattern` with `TODO|FIXME|XXX`
2. Check GitHub issues manually - no automated mapping exists
3. Look for issue references in commit messages related to TODO areas

## Common TODO Areas Requiring Issue Tracking
- Recipe editing functionality (known limitation)
- Performance optimizations in search
- UI/UX improvements in food/recipe management
- Data validation and error handling

## Efficiency Tip
When user asks "are there existing issues for X functionality", always search for relevant TODO comments first to understand scope before suggesting issue creation.