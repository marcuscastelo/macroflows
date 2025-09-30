# Database Setup for Recent Foods Search

This directory contains database functions and setup for the enhanced recent foods search functionality.

## Setup Instructions

1. **Create required tables** (if not already created):
   ```bash
   # Run in Supabase SQL Editor in this order:
   # 1. foods.sql (creates foods table)
   # 2. recipes.sql (creates recipes table) 
   # 3. recent_foods.sql (creates recent_foods table)
   ```

2. **Execute the SQL function** in Supabase dashboard:
   ```bash
   # Run the contents of search_recent_foods_with_names.sql in Supabase SQL Editor
   ```

3. **Enable required extensions** (if not already enabled):
   ```sql
   -- Run as superuser in Supabase dashboard
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

4. **Enable Row Level Security (RLS)** (v0.14.0+):
   
   After migrating to v0.14.0 and ensuring all users have UUID-based authentication:
   
   ```bash
   # Step 1: Enable RLS on all tables
   # Run the contents of enable_rls.sql in Supabase SQL Editor
   
   # Step 2: Create RLS policies
   # Run the contents of rls_policies.sql in Supabase SQL Editor
   ```
   
   **Important**: Only enable RLS after v0.14.0 when all users have been migrated to UUID-based `user_id` fields. Running these scripts before the migration will prevent users from accessing their data.

## How It Works

### Server-Side Search Function
- `search_recent_foods_with_names()` efficiently joins recent_foods with foods/recipes tables
- Returns only matching results, reducing data transfer
- Supports Portuguese diacritic-insensitive search
- Maintains chronological ordering of recent items

### Application Integration
- `fetchUserRecentFoods()` now accepts optional `search` parameter
- When search is provided, uses server-side function via `supabase.rpc()`
- When no search, uses existing optimized table query
- Backward compatible with existing code

### Performance Optimizations
- GIN indexes on food/recipe names for fast text search
- Composite index on recent_foods(user_id, last_used DESC)
- Server-side filtering reduces network overhead

## Usage Example

```typescript
// Without search (existing behavior)
const recentFoods = await fetchUserRecentFoods(userId, 20)

// With search (new functionality)
const searchResults = await fetchUserRecentFoods(userId, 20, "arroz")
```

## Benefits

- ✅ Reduces data transfer (only matching results returned)
- ✅ Leverages PostgreSQL's text search capabilities  
- ✅ Maintains chronological ordering of recent items
- ✅ Supports Portuguese diacritics server-side
- ✅ Backward compatible with existing code
- ✅ Follows existing architectural patterns

## Important Notes

- The function casts `foods.macros` from `json` to `jsonb` to match the return type schema
- This ensures compatibility with the application's expected data structure while maintaining the database's existing column types

## Row Level Security (RLS)

### What is RLS?

Row Level Security (RLS) is a PostgreSQL security feature that allows you to control which rows users can access in database tables. With RLS enabled, queries automatically filter rows based on the authenticated user, ensuring data isolation between users.

### RLS Setup Files

- **enable_rls.sql**: Enables RLS on all user-specific tables
- **rls_policies.sql**: Creates security policies that restrict access to user's own data

### Tables with RLS

The following tables have RLS enabled:
- `users` - User profiles (access via `uuid` field)
- `body_measures` - Body measurements per user
- `cached_searches` - User search history
- `days` - Daily diet records
- `macro_profiles` - User macro nutrient profiles
- `recent_foods` - Recently used foods per user
- `recipes` - User-created recipes
- `weights` - Weight tracking per user

### Tables without RLS

- `foods` - Shared reference data, accessible to all users
- Backup tables (`*_bkp`, `*_test_bkp`) - Not user-facing

### How RLS Works

Each table uses the `user_id` field (or `uuid` for users table) to match against `auth.uid()`:

```sql
-- Example: Users can only view their own recipes
CREATE POLICY "Users can view their own recipes"
ON public.recipes
FOR SELECT
USING (auth.uid()::text = user_id);
```

This ensures that when a user queries the recipes table, they automatically only see recipes where `user_id` matches their authenticated UUID.

### Testing RLS

After enabling RLS, test that:
1. Users can only see their own data when querying tables
2. Users cannot access other users' data even with direct queries
3. Application functionality continues to work as expected
4. Performance is not significantly impacted

### Rollback

If you need to disable RLS (not recommended for production):

```sql
-- Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measures DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_searches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.days DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_foods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weights DISABLE ROW LEVEL SECURITY;
```

### Security Best Practices

1. **Always enable RLS in production** - Prevents data leakage between users
2. **Test policies thoroughly** - Ensure users can access their own data and nothing else
3. **Monitor performance** - RLS adds a small overhead; ensure queries remain fast
4. **Use service role key for admin operations** - Service role bypasses RLS for admin tasks
5. **Keep policies simple** - Complex policies can impact performance and maintainability