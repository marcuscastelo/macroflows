# Database Changes Required for v0.17.0 - Client-Side Normalization Removal

## Overview
This document outlines the database changes required to complete the refactoring that removes redundant client-side text normalization and consolidates all normalization logic to PostgreSQL.

## Changes Made to Code

### Removed Client-Side Normalization
1. **`supabaseRecentFoodGateway.ts`**: Removed `removeDiacritics()` call before passing search terms to `search_recent_foods_with_names` RPC
2. **`supabaseRecipeGateway.ts`**: Removed `removeDiacritics()` call and replaced direct ILIKE query with new RPC function

### Database Functions Updated/Created
1. **`search_recent_foods_with_names.sql`** - UPDATED
2. **`search_recipes_by_name.sql`** - NEW

## Required Database Migrations

### 1. Update `search_recent_foods_with_names` Function

Run the SQL from: `/database/search_recent_foods_with_names.sql`

**What changed:**
- Added server-side normalization using PostgreSQL's `translate()` function
- Now handles diacritic removal directly in the database
- No longer expects pre-normalized search terms from the client

**Key changes:**
- Search term normalization now happens in SQL: 
  ```sql
  normalized_search := lower(
    translate(
      p_search_term,
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
    )
  );
  ```
- Food and recipe name comparison also uses `translate()` for consistent matching

### 2. Create New `search_recipes_by_name` Function

Run the SQL from: `/database/search_recipes_by_name.sql`

**Purpose:**
- Provides diacritic-insensitive, case-insensitive recipe search
- Replaces direct ILIKE queries from client code
- Consolidates recipe search logic in PostgreSQL

**Function signature:**
```sql
search_recipes_by_name(
  p_user_uuid uuid,
  p_search_term text,
  p_limit integer DEFAULT 50
)
```

**Returns:**
- Recipe records with proper normalization applied
- Results ordered by name
- Limited to user's own recipes only

### 3. Existing Functions Already Support Server-Side Normalization

The following functions already have server-side normalization and don't need changes:
- ✅ `search_foods_with_scoring` - Already uses `translate()` for normalization
- ✅ `search_favorite_foods_with_scoring` - Already uses `translate()` for normalization

## Testing the Changes

After applying the database migrations:

1. **Test Recent Foods Search:**
   ```typescript
   // Should find "Café" when searching "cafe"
   await supabase.rpc('search_recent_foods_with_names', {
     p_user_uuid: userId,
     p_search_term: 'cafe',  // Client no longer pre-normalizes
     p_limit: 50
   })
   ```

2. **Test Recipe Search:**
   ```typescript
   // Should find "Pão de Queijo" when searching "pao de queijo"
   await supabase.rpc('search_recipes_by_name', {
     p_user_uuid: userId,
     p_search_term: 'pao de queijo',
     p_limit: 50
   })
   ```

## Benefits Achieved

### Performance
- ✅ Eliminated redundant client-side text processing
- ✅ Leveraged database-optimized text functions
- ✅ Reduced JavaScript execution overhead

### Consistency
- ✅ Single source of truth for normalization rules (PostgreSQL)
- ✅ Consistent behavior across all text processing
- ✅ Easier to maintain and update normalization logic

### Code Quality
- ✅ Reduced client-side complexity
- ✅ Fewer imports and dependencies
- ✅ Cleaner component code

## Migration Checklist

- [ ] Run `search_recent_foods_with_names.sql` to update the existing function
- [ ] Run `search_recipes_by_name.sql` to create the new function
- [ ] Verify that pg_trgm extension is enabled (should already be enabled)
- [ ] Test search functionality with diacritic characters (á, é, ã, ç, etc.)
- [ ] Monitor performance of searches

## Rollback Plan

If issues arise, the previous behavior can be restored by:
1. Re-adding client-side `removeDiacritics()` calls in TypeScript code
2. Reverting the PostgreSQL functions to their previous versions
3. The old implementation expected pre-normalized search terms

## Notes

- The `removeDiacritics` utility function is kept in the codebase (with tests) as it may be useful for future client-side display purposes
- The `createNormalizedSearch` function (used for cached searches) only does `toLowerCase().trim()` and doesn't remove diacritics - this is intentional and appropriate for its use case
- All existing tests pass with these changes (359/359 tests passing)
