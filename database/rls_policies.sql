-- Row Level Security Policies for all user-specific tables
-- These policies ensure users can only access their own data
-- Run after enable_rls.sql

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (auth.uid()::text = uuid);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid()::text = uuid)
WITH CHECK (auth.uid()::text = uuid);

-- Note: INSERT and DELETE policies are not added for users table
-- User creation should be handled by authentication system
-- User deletion should be handled through admin functions

-- ============================================================================
-- BODY MEASURES TABLE
-- ============================================================================

-- Policy: Users can view their own body measures
CREATE POLICY "Users can view their own body measures"
ON public.body_measures
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own body measures
CREATE POLICY "Users can insert their own body measures"
ON public.body_measures
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own body measures
CREATE POLICY "Users can update their own body measures"
ON public.body_measures
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own body measures
CREATE POLICY "Users can delete their own body measures"
ON public.body_measures
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================================================
-- CACHED SEARCHES TABLE
-- ============================================================================

-- Policy: Users can view their own cached searches
CREATE POLICY "Users can view their own cached searches"
ON public.cached_searches
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own cached searches
CREATE POLICY "Users can insert their own cached searches"
ON public.cached_searches
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own cached searches
CREATE POLICY "Users can update their own cached searches"
ON public.cached_searches
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own cached searches
CREATE POLICY "Users can delete their own cached searches"
ON public.cached_searches
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================================================
-- DAYS TABLE
-- ============================================================================

-- Policy: Users can view their own days
CREATE POLICY "Users can view their own days"
ON public.days
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own days
CREATE POLICY "Users can insert their own days"
ON public.days
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own days
CREATE POLICY "Users can update their own days"
ON public.days
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own days
CREATE POLICY "Users can delete their own days"
ON public.days
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================================================
-- MACRO PROFILES TABLE
-- ============================================================================

-- Policy: Users can view their own macro profiles
CREATE POLICY "Users can view their own macro profiles"
ON public.macro_profiles
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own macro profiles
CREATE POLICY "Users can insert their own macro profiles"
ON public.macro_profiles
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own macro profiles
CREATE POLICY "Users can update their own macro profiles"
ON public.macro_profiles
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own macro profiles
CREATE POLICY "Users can delete their own macro profiles"
ON public.macro_profiles
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================================================
-- RECENT FOODS TABLE
-- ============================================================================

-- Policy: Users can view their own recent foods
CREATE POLICY "Users can view their own recent foods"
ON public.recent_foods
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own recent foods
CREATE POLICY "Users can insert their own recent foods"
ON public.recent_foods
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own recent foods
CREATE POLICY "Users can update their own recent foods"
ON public.recent_foods
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own recent foods
CREATE POLICY "Users can delete their own recent foods"
ON public.recent_foods
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================================================
-- RECIPES TABLE
-- ============================================================================

-- Policy: Users can view their own recipes
CREATE POLICY "Users can view their own recipes"
ON public.recipes
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own recipes
CREATE POLICY "Users can insert their own recipes"
ON public.recipes
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own recipes
CREATE POLICY "Users can update their own recipes"
ON public.recipes
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own recipes
CREATE POLICY "Users can delete their own recipes"
ON public.recipes
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================================================
-- WEIGHTS TABLE
-- ============================================================================

-- Policy: Users can view their own weights
CREATE POLICY "Users can view their own weights"
ON public.weights
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own weights
CREATE POLICY "Users can insert their own weights"
ON public.weights
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own weights
CREATE POLICY "Users can update their own weights"
ON public.weights
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own weights
CREATE POLICY "Users can delete their own weights"
ON public.weights
FOR DELETE
USING (auth.uid()::text = user_id);

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. These policies use auth.uid() which returns the authenticated user's UUID
-- 2. The user_id field in all tables is expected to be a string (UUID)
-- 3. Foods table is not included as it contains shared reference data
-- 4. All policies follow the principle: users can only access their own data
-- 5. Each table has four policies: SELECT, INSERT, UPDATE, DELETE
