-- Enable Row Level Security (RLS) on all user-specific tables
-- This should be run after v0.14.0 when all users have been migrated to UUID-based user_id

-- Enable RLS on tables with user-specific data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;

-- Note: Foods table does not have RLS as it contains shared reference data
-- Note: Backup and test tables are not included in RLS policies
