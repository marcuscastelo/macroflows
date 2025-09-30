-- Optimized PostgreSQL function for searching within user's favorite foods only
-- Based on search_foods_with_scoring but pre-filtered to favorites for better performance
-- Implements fuzzy matching, multi-word boost scoring, and proximity analysis within favorites

-- Drop existing function to avoid conflicts
DROP FUNCTION IF EXISTS search_favorite_foods_with_scoring(text, bigint[], integer);
DROP FUNCTION IF EXISTS search_favorite_foods_with_scoring(bigint, text, integer);

CREATE OR REPLACE FUNCTION search_favorite_foods_with_scoring(
  p_user_uuid uuid,
  p_search_term text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id bigint,
  name text,
  ean text,
  macros jsonb,
  source jsonb,
  created_at timestamptz
) 
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_search text;
  search_words text[];
  word_count integer;
  user_favorite_ids bigint[];
BEGIN
  -- Get user's favorite foods from users table
  SELECT u.favorite_foods INTO user_favorite_ids
  FROM public.users u
  WHERE u.uuid = p_user_uuid;
  
  -- Handle empty favorite list - return empty result
  IF user_favorite_ids IS NULL OR array_length(user_favorite_ids, 1) IS NULL OR array_length(user_favorite_ids, 1) = 0 THEN
    RETURN;
  END IF;

  -- Handle empty search term - return all favorites ordered by name
  IF p_search_term IS NULL OR trim(p_search_term) = '' THEN
    RETURN QUERY
    SELECT 
      f.id,
      f.name,
      f.ean,
      f.macros::jsonb,
      f.source,
      f.created_at
    FROM public.foods f
    WHERE f.id = ANY(user_favorite_ids)
      AND f.name != '' AND f.name != '.'
    ORDER BY f.name ASC
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
  
  -- Split search term into words
  search_words := string_to_array(trim(normalized_search), ' ');
  search_words := array_remove(search_words, '');
  word_count := array_length(search_words, 1);

  -- Return scored results from favorites only
  RETURN QUERY
  WITH scored_favorite_foods AS (
    SELECT 
      f.id,
      f.name,
      f.ean,
      f.macros::jsonb,
      f.source,
      f.created_at,
      -- Normalize food name for comparison
      lower(
        translate(
          f.name,
          'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
          'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
        )
      ) as normalized_name,
      -- Calculate relevance score (same algorithm as main search)
      CASE
        -- Exact match (highest priority)
        WHEN lower(
          translate(
            f.name,
            'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
            'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
          )
        ) = normalized_search THEN 1.0
        
        -- All words present (second highest priority)
        WHEN word_count > 1 AND (
          SELECT COUNT(*)
          FROM unnest(search_words) as word
          WHERE lower(
            translate(
              f.name,
              'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
              'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
            )
          ) LIKE '%' || word || '%'
        ) = word_count THEN 0.8 + (
          -- Proximity bonus: higher score if words are closer together
          CASE 
            WHEN length(f.name) <= length(p_search_term) * 1.5 THEN 0.15
            WHEN length(f.name) <= length(p_search_term) * 2 THEN 0.1
            ELSE 0.05
          END
        )
        
        -- Partial word matches (lower priority)
        WHEN word_count > 1 THEN 0.4 * (
          SELECT COUNT(*)::float / word_count
          FROM unnest(search_words) as word
          WHERE lower(
            translate(
              f.name,
              'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
              'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
            )
          ) LIKE '%' || word || '%'
        )
        
        -- Fuzzy similarity using pg_trgm (lowest priority)
        ELSE similarity(
          lower(
            translate(
              f.name,
              'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
              'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
            )
          ),
          normalized_search
        ) * 0.6
      END as relevance_score
    FROM public.foods f
    WHERE f.id = ANY(user_favorite_ids)  -- Pre-filter to favorites for performance
      AND f.name != '' AND f.name != '.'
      AND (
        -- Use ILIKE for basic matching (handles most cases efficiently)
        lower(
          translate(
            f.name,
            'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
            'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
          )
        ) LIKE '%' || normalized_search || '%'
        OR
        -- Use similarity for fuzzy matching (more expensive but catches typos)
        similarity(
          lower(
            translate(
              f.name,
              'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
              'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
            )
          ),
          normalized_search
        ) > 0.2
      )
  )
  SELECT 
    sf.id,
    sf.name,
    sf.ean,
    sf.macros,
    sf.source,
    sf.created_at
  FROM scored_favorite_foods sf
  ORDER BY 
    sf.relevance_score DESC,  -- Primary sort by relevance
    sf.name ASC               -- Secondary sort by name for consistent ordering
  LIMIT p_limit;
END;
$$;

-- Note: This function leverages existing indexes on foods table
-- The id = ANY(array) condition can use the primary key index efficiently
-- Combined with name-based indexes for optimal performance