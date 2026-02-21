-- Single schema for both: Next.js frontend (dashboard, Apify webhook, cron) and hunter-backend (scrapers)
-- Run in Supabase SQL editor once (or use migrations).

-- Listings: source_url UNIQUE for upsert (backend + Apify webhook).
-- price_pln w groszach (integer/BIGINT); images text[]; status default 'new'; notified default false.
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price_pln BIGINT,
  location TEXT,
  city TEXT,
  region TEXT,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  auction_date TIMESTAMPTZ,
  images TEXT[] DEFAULT '{}',
  raw_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'viewed', 'archived')),
  notified BOOLEAN NOT NULL DEFAULT false,
  removed_from_source_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- For existing DBs: add column if backend has already added it or run this manually
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS removed_from_source_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS listings_source_url_idx ON public.listings (source_url);
CREATE INDEX IF NOT EXISTS listings_created_at_idx ON public.listings (created_at DESC);
CREATE INDEX IF NOT EXISTS listings_source_idx ON public.listings (source);
CREATE INDEX IF NOT EXISTS listings_notified_idx ON public.listings (notified) WHERE notified = false;
CREATE INDEX IF NOT EXISTS listings_removed_from_source_at_idx ON public.listings (removed_from_source_at) WHERE removed_from_source_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listings_updated_at ON public.listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Email digest: frontend cron sends to these addresses (no filters in MVP)
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scrape run logs (backend only)
CREATE TABLE IF NOT EXISTS public.scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  listings_found INT NOT NULL DEFAULT 0,
  listings_upserted INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT
);

-- RLS: MVP bez auth – anon może SELECT i UPDATE (np. status). Pełny dostęp ma service_role.
-- Przy dodaniu auth: zawęzić polityki (np. tylko SELECT public, UPDATE tylko zalogowani).
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on listings" ON public.listings;
CREATE POLICY "Allow all on listings" ON public.listings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on alert_rules" ON public.alert_rules;
CREATE POLICY "Allow all on alert_rules" ON public.alert_rules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on scrape_runs" ON public.scrape_runs;
CREATE POLICY "Allow all on scrape_runs" ON public.scrape_runs FOR ALL USING (true) WITH CHECK (true);
