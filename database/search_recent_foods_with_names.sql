-- PostgreSQL function for searching recent foods with joined names
-- This function efficiently searches recent foods by joining with foods and recipes tables
-- Supports Portuguese diacritic-insensitive search using server-side normalization

-- Drop any existing function to avoid signature conflicts
DROP FUNCTION IF EXISTS search_recent_foods_with_names(integer, text, integer);
DROP FUNCTION IF EXISTS search_recent_foods_with_names(bigint, text, integer);
DROP FUNCTION IF EXISTS search_recent_foods_with_names(uuid, text, integer);

CREATE OR REPLACE FUNCTION search_recent_foods_with_names(
  p_user_uuid uuid,
  p_search_term text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  -- Recent food metadata
  recent_food_id bigint,
  user_id uuid,
  type text,
  reference_id bigint,
  last_used timestamp with time zone,
  times_used integer,
  -- Complete Template object fields
  template_id bigint,
  template_name text,
  template_ean text,
  template_source jsonb,
  template_macros jsonb,
  template_owner uuid,
  template_items jsonb,
  template_prepared_multiplier real
) 
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_search text;
BEGIN
  -- If no search term provided, return recent foods with complete template data (no filtering)
  IF p_search_term IS NULL OR trim(p_search_term) = '' THEN
    RETURN QUERY
    SELECT 
      rf.id as recent_food_id,
      rf.user_id,
      rf.type,
      rf.reference_id,
      rf.last_used,
      rf.times_used,
      -- Complete Template fields (Food or Recipe)
      COALESCE(f.id, r.id) as template_id,
      COALESCE(f.name, r.name) as template_name,
      f.ean as template_ean,
      f.source as template_source,
      f.macros::jsonb as template_macros,
      r.user_id as template_owner,
      r.items as template_items,
      r.prepared_multiplier as template_prepared_multiplier
    FROM public.recent_foods rf
    LEFT JOIN public.foods f ON rf.type = 'food' AND rf.reference_id = f.id
    LEFT JOIN public.recipes r ON rf.type = 'recipe' AND rf.reference_id = r.id
    WHERE rf.user_id = p_user_uuid
      AND (f.id IS NOT NULL OR r.id IS NOT NULL) -- Ensure we have a valid template
    ORDER BY rf.last_used DESC
    LIMIT p_limit;
  ELSE
    -- Normalize search term (remove diacritics and convert to lowercase)
    normalized_search := lower(
      translate(
        p_search_term,
        'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
        'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
      )
    );
    
    -- Search with diacritic-insensitive filtering using server-side normalization
    RETURN QUERY
    SELECT 
      rf.id as recent_food_id,
      rf.user_id,
      rf.type,
      rf.reference_id,
      rf.last_used,
      rf.times_used,
      -- Complete Template fields (Food or Recipe)
      COALESCE(f.id, r.id) as template_id,
      COALESCE(f.name, r.name) as template_name,
      f.ean as template_ean,
      f.source as template_source,
      f.macros::jsonb as template_macros,
      r.owner as template_owner,
      r.items as template_items,
      r.prepared_multiplier as template_prepared_multiplier
    FROM public.recent_foods rf
    LEFT JOIN public.foods f ON rf.type = 'food' AND rf.reference_id = f.id
    LEFT JOIN public.recipes r ON rf.type = 'recipe' AND rf.reference_id = r.id
    WHERE rf.user_id = p_user_uuid
      AND (f.id IS NOT NULL OR r.id IS NOT NULL) -- Ensure we have a valid template
      AND (
        lower(
          translate(
            f.name,
            'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
            'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
          )
        ) LIKE '%' || normalized_search || '%' 
        OR
        lower(
          translate(
            r.name,
            'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
            'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
          )
        ) LIKE '%' || normalized_search || '%'
      )
    ORDER BY rf.last_used DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- Create index for performance on foods.name if it doesn't exist (matches existing schema)
CREATE INDEX IF NOT EXISTS idx_foods_name_gin ON public.foods USING gin(name gin_trgm_ops) TABLESPACE pg_default;

-- Create index for performance on recipes.name if it doesn't exist  
CREATE INDEX IF NOT EXISTS idx_recipes_name_gin ON public.recipes USING gin(name gin_trgm_ops) TABLESPACE pg_default;

-- Create composite index for recent_foods performance (matches existing schema)
CREATE INDEX IF NOT EXISTS idx_recent_foods_user_last_used ON public.recent_foods USING btree(user_id, last_used DESC) TABLESPACE pg_default;

-- Enable pg_trgm extension for trigram-based text search (if not already enabled)
-- This needs to be run as superuser in Supabase dashboard:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;