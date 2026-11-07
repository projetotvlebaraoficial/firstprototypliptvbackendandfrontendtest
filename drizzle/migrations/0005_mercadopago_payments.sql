ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_payment_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_id_key ON public.payments(provider_payment_id);