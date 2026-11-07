-- Once-per-profile / once-per-CPF tracking for the 4-hour Horizon trial.
--
-- The unique indexes are the authoritative lock. A failed/abandoned attempt is
-- deleted by the server so the customer can try again, but a completed trial
-- can never be generated twice for the same CPF or the same subscriber profile.

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

-- One trial per CPF across the whole site (public page and subscriber area).
create unique index if not exists horizon_trials_cpf_key
  on public.horizon_trials (cpf);

-- One trial per subscriber profile. NULL user_id (public trials) is allowed
-- multiple times because Postgres unique indexes ignore NULL values.
create unique index if not exists horizon_trials_user_id_key
  on public.horizon_trials (user_id)
  where user_id is not null;

create index if not exists horizon_trials_status_idx
  on public.horizon_trials (status);

alter table public.horizon_trials enable row level security;

-- Subscribers may read their own trial record. All writes go through the
-- service role in server functions/routes.
drop policy if exists "Users can read own trials" on public.horizon_trials;
create policy "Users can read own trials"
  on public.horizon_trials
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.horizon_trials is
  'Tracks the free 4-hour Horizon trial so it can only be generated once per CPF and once per subscriber profile.';
