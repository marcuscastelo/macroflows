# Recipe Editing Known Limitations

## Current State
- Recipe editing functionality exists but has **known limitations**
- Users cannot fully edit all recipe properties through UI
- This is a **documented limitation** that comes up repeatedly in development discussions

## Key Areas Needing Improvement
- Recipe ingredient modification
- Recipe metadata editing (name, description, etc.)
- Recipe sharing and collaboration features
- Recipe versioning/history

## Code Locations
- Recipe management: `modules/*/domain/` and `modules/*/application/` layers
- UI components: `sections/unified-item/` area
- Repository pattern: `modules/*/infrastructure/` for data persistence

## Development Priority
- High user demand for improved recipe editing
- Should be prioritized for future development cycles
- Consider breaking into smaller, manageable issues

## Search Patterns for Related Code
- `search_for_pattern` with `recipe.*edit|edit.*recipe`
- Look in `modules/diet/` and `sections/unified-item/` directories
- Check for existing TODO comments around recipe functionality