-- Complete User Migration (v0.14.0+)
-- This script completes the migration from integer-based users table to UUID-based auth system
-- Run this script in Supabase SQL Editor after ensuring all data has been migrated to user_id columns

-- IMPORTANT: Backup your database before running this script!
-- This script makes irreversible changes.

-- Step 1: Ensure all user_id columns are properly populated
-- (This should have been done in the initial migration, but verify)

-- Verify days table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.days WHERE user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Found days records with NULL user_id. Migration cannot proceed.';
  END IF;
END $$;

-- Verify body_measures table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.body_measures WHERE user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Found body_measures records with NULL user_id. Migration cannot proceed.';
  END IF;
END $$;

-- Verify weights table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.weights WHERE user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Found weights records with NULL user_id. Migration cannot proceed.';
  END IF;
END $$;

-- Verify macro_profiles table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.macro_profiles WHERE user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Found macro_profiles records with NULL user_id. Migration cannot proceed.';
  END IF;
END $$;

-- Verify recent_foods table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.recent_foods WHERE user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Found recent_foods records with NULL user_id. Migration cannot proceed.';
  END IF;
END $$;

-- Step 2: Drop foreign key constraints from all tables referencing users table

-- Drop foreign key from days table
ALTER TABLE public.days DROP CONSTRAINT IF EXISTS days_test_owner_fkey;
ALTER TABLE public.days DROP CONSTRAINT IF EXISTS days_owner_fkey;

-- Drop foreign key from days_bkp table
ALTER TABLE public.days_bkp DROP CONSTRAINT IF EXISTS days_bkp_owner_fkey;

-- Drop foreign key from days_test_bkp table
ALTER TABLE public.days_test_bkp DROP CONSTRAINT IF EXISTS days_test_bkp_owner_fkey;

-- Drop foreign key from body_measures table
ALTER TABLE public.body_measures DROP CONSTRAINT IF EXISTS body_measures_owner_fkey;

-- Drop foreign key from weights table
ALTER TABLE public.weights DROP CONSTRAINT IF EXISTS weights_owner_fkey;

-- Drop foreign key from macro_profiles table
ALTER TABLE public.macro_profiles DROP CONSTRAINT IF EXISTS macro_profiles_owner_fkey;

-- Drop foreign key from recent_foods table
ALTER TABLE public.recent_foods DROP CONSTRAINT IF EXISTS recent_foods_user_id_old_fkey;
ALTER TABLE public.recent_foods DROP CONSTRAINT IF EXISTS recent_foods_user_id_fkey;

-- Drop foreign key from recipes table
ALTER TABLE public.recipes DROP CONSTRAINT IF EXISTS recipes_owner_fkey;

-- Step 3: Drop owner/user_id_old columns from all tables

-- Drop owner column from days table
ALTER TABLE public.days DROP COLUMN IF EXISTS owner;

-- Drop owner column from days_bkp table
ALTER TABLE public.days_bkp DROP COLUMN IF EXISTS owner;

-- Drop owner column from days_test_bkp table
ALTER TABLE public.days_test_bkp DROP COLUMN IF EXISTS owner;

-- Drop owner column from body_measures table
ALTER TABLE public.body_measures DROP COLUMN IF EXISTS owner;

-- Drop owner column from weights table
ALTER TABLE public.weights DROP COLUMN IF EXISTS owner;

-- Drop owner column from macro_profiles table
ALTER TABLE public.macro_profiles DROP COLUMN IF EXISTS owner;

-- Drop user_id_old column from recent_foods table
ALTER TABLE public.recent_foods DROP COLUMN IF EXISTS user_id_old;

-- Drop owner column from recipes table
ALTER TABLE public.recipes DROP COLUMN IF EXISTS owner;

-- Step 4: Make user_id columns NOT NULL where appropriate

-- Make user_id NOT NULL in days table
ALTER TABLE public.days ALTER COLUMN user_id SET NOT NULL;

-- Make user_id NOT NULL in body_measures table
ALTER TABLE public.body_measures ALTER COLUMN user_id SET NOT NULL;

-- Make user_id NOT NULL in weights table
ALTER TABLE public.weights ALTER COLUMN user_id SET NOT NULL;

-- Make user_id NOT NULL in macro_profiles table
ALTER TABLE public.macro_profiles ALTER COLUMN user_id SET NOT NULL;

-- Make user_id NOT NULL in recent_foods table
ALTER TABLE public.recent_foods ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Drop any migration triggers
-- (Check if there are any triggers that were used for migration and drop them)
-- Note: Add specific trigger drops here if they exist

-- Step 6: Drop the users table
DROP TABLE IF EXISTS public.users;

-- Step 7: Verification
-- Show remaining tables to verify the migration
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND column_name IN ('owner', 'user_id', 'user_id_old')
ORDER BY 
    table_name, column_name;
