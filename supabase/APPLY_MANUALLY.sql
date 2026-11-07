-- Aplicar no SQL Editor do Supabase (em ordem). Idempotente (usa if not exists / drop policy if exists).

-- ===== 20261105120000_horizon_trials.sql =====
create table if not exists public.horizon_trials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  cpf text not null,
  email text,
  kind text not null default 'public' check (kind in ('public', 'account')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  plan text,
  connections integer,
  username text,
  password text,
  server_url text,
  m3u_url text,
  credentials jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists horizon_trials_cpf_key on public.horizon_trials (cpf);
create unique index if not exists horizon_trials_user_id_key on public.horizon_trials (user_id) where user_id is not null;
create index if not exists horizon_trials_status_idx on public.horizon_trials (status);
alter table public.horizon_trials enable row level security;
drop policy if exists "Users can read own trials" on public.horizon_trials;
create policy "Users can read own trials" on public.horizon_trials for select to authenticated using (auth.uid() = user_id);

-- ===== 20261105130000_horizon_accounts.sql =====
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
create unique index if not exists horizon_accounts_user_id_key on public.horizon_accounts (user_id);
create index if not exists horizon_accounts_status_idx on public.horizon_accounts (status);
create index if not exists horizon_accounts_payment_idx on public.horizon_accounts (provider_payment_id);
alter table public.horizon_accounts enable row level security;
drop policy if exists "Users can read own horizon account" on public.horizon_accounts;
create policy "Users can read own horizon account" on public.horizon_accounts for select to authenticated using (auth.uid() = user_id);

-- ===== 20261105140000_horizon_plan_mappings.sql =====
create table if not exists public.horizon_plan_mappings (
  id uuid primary key default gen_random_uuid(),
  plan_tier text not null,
  billing_period text not null,
  horizon_plan_id text not null,
  label text,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horizon_plan_mappings_key unique (plan_tier, billing_period),
  constraint horizon_plan_mappings_tier_check check (plan_tier in ('premium', 'premium_plus', 'trial')),
  constraint horizon_plan_mappings_period_check check (billing_period in ('mensal', 'trimestral', 'semestral', 'anual', 'trial')),
  constraint horizon_plan_mappings_trial_pair_check check ((plan_tier = 'trial') = (billing_period = 'trial')),
  constraint horizon_plan_mappings_id_not_blank check (length(trim(horizon_plan_id)) > 0)
);
create index if not exists horizon_plan_mappings_lookup_idx on public.horizon_plan_mappings (plan_tier, billing_period);
alter table public.horizon_plan_mappings enable row level security;
drop policy if exists "Staff can read horizon plan mappings" on public.horizon_plan_mappings;
create policy "Staff can read horizon plan mappings" on public.horizon_plan_mappings for select to authenticated using (public.is_staff(auth.uid()));
