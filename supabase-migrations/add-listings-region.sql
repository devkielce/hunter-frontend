-- Backend (hunter) upserts a 'region' column; add it so upsert succeeds.
-- Run once in Supabase → SQL Editor.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS region TEXT;
