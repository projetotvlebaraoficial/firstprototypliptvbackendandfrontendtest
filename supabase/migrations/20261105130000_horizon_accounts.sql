-- Official Horizon account, created only after the payment gateway confirms a
-- payment. One row per subscriber; the unique index makes the webhook safe to
-- retry (idempotency).
--
-- Credentials are written by the server with the service role and read by the
-- subscriber through RLS (own row only).

create table if not exists public.horizon_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'failed')),
  plan_tier text,
  billing_period text,
  plan_id text,
  provider_payment_id text,
  username text,
  password text,
  server_url text,
  m3u_url text,
  plan text,
  connections integer,
  credentials jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz
);

-- One official account per subscriber profile. The webhook uses upsert/update
-- against this key, so repeated notifications never create a second account.
create unique index if not exists horizon_accounts_user_id_key
  on public.horizon_accounts (user_id);

create index if not exists horizon_accounts_status_idx
  on public.horizon_accounts (status);

create index if not exists horizon_accounts_payment_idx
  on public.horizon_accounts (provider_payment_id);

alter table public.horizon_accounts enable row level security;

drop policy if exists "Users can read own horizon account" on public.horizon_accounts;
create policy "Users can read own horizon account"
  on public.horizon_accounts
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.horizon_accounts is
  'Official Horizon IPTV account. Created automatically by the payment webhook after the gateway confirms the payment.';
