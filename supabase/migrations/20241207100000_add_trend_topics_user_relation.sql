-- Adds a direct relation from trend_topics to company_profiles for personalized trend rows
ALTER TABLE public.trend_topics
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.company_profiles(user_id) ON DELETE CASCADE;

-- Backfill user_id from the embedded raw_data payload when present
UPDATE public.trend_topics
SET user_id = (raw_data ->> 'user_id')::uuid
WHERE user_id IS NULL
  AND raw_data ? 'user_id'
  AND raw_data ->> 'user_id' <> '';

-- Index personalized rows for quick lookups by owner + recency
CREATE INDEX IF NOT EXISTS trend_topics_user_id_created_at_idx
  ON public.trend_topics (user_id, created_at DESC);
