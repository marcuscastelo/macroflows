-- PostgreSQL function for searching user's recipes by name
-- Supports Portuguese diacritic-insensitive search using server-side normalization
-- Similar to search_foods_with_scoring but for recipes

-- Drop existing function to avoid conflicts
DROP FUNCTION IF EXISTS search_recipes_by_name(uuid, text, integer);

CREATE OR REPLACE FUNCTION search_recipes_by_name(
  p_user_uuid uuid,
  p_search_term text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id bigint,
  name text,
  owner bigint,
  items jsonb,
  prepared_multiplier real,
  created_at timestamptz
) 
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_search text;
BEGIN
  -- Handle empty search term - return all user recipes ordered by name
  IF p_search_term IS NULL OR trim(p_search_term) = '' THEN
    RETURN QUERY
    SELECT 
      r.id,
      r.name,
      r.owner,
      r.items,
      r.prepared_multiplier,
      r.created_at
    FROM public.recipes r
    WHERE r.owner = p_user_uuid
    ORDER BY r.name ASC
    LIMIT p_limit;
    RETURN;
  END IF;

  -- Normalize search term (remove diacritics and convert to lowercase)
  normalized_search := lower(
    translate(
      p_search_term,
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
    )
  );

  -- Return recipes with server-side normalized search
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.owner,
    r.items,
    r.prepared_multiplier,
    r.created_at
  FROM public.recipes r
  WHERE r.owner = p_user_uuid
    AND lower(
      translate(
        r.name,
        'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
        'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
      )
    ) LIKE '%' || normalized_search || '%'
  ORDER BY r.name ASC
  LIMIT p_limit;
END;
$$;

-- Ensure required indexes exist for optimal performance
-- (These indexes should already exist from recipes.sql)
-- CREATE INDEX IF NOT EXISTS idx_recipes_name_gin ON public.recipes USING gin(name gin_trgm_ops) TABLESPACE pg_default;
-- CREATE INDEX IF NOT EXISTS idx_recipes_owner ON public.recipes USING btree(owner) TABLESPACE pg_default;
