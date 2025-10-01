# Optimized Issue Creation Workflow

## User's Consistent Pattern
1. **Discovery**: Find TODO comments or identify limitations
2. **Research**: Ask "are there existing GitHub issues for this?"
3. **Verification**: Search codebase and existing issues
4. **Action**: Create new issue or reference existing one

## Optimization Strategy
When user asks about existing issues:

### Quick Assessment Steps
1. **Search TODO patterns**: Use `search_for_pattern` with relevant keywords
2. **Check issue titles**: Look for similar functionality in existing issues
3. **Identify code areas**: Point to specific modules/files involved
4. **Suggest issue scope**: Break large features into manageable pieces

### Common Search Patterns
- Feature requests: `search_for_pattern` with `TODO.*feature|enhancement`
- Bug tracking: `search_for_pattern` with `FIXME|BUG|XXX`
- Performance: `search_for_pattern` with `TODO.*performance|optimize`

### Code Area Mapping
- **Recipe functionality**: `modules/diet/`, `sections/unified-item/`
- **Search features**: `modules/*/infrastructure/` + search-related files
- **UI components**: `sections/common/`, component directories
- **Data validation**: Domain layer files with Zod schemas

## Efficiency Gains
- Reduce repetitive searching by having mapped code areas
- Quick TODO-to-issue correlation workflow
- Faster identification of related existing functionality