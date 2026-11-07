ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'premium',
  ADD COLUMN IF NOT EXISTS billing_period text NOT NULL DEFAULT 'mensal',
  ADD COLUMN IF NOT EXISTS pending_tier text,
  ADD COLUMN IF NOT EXISTS pending_period text;