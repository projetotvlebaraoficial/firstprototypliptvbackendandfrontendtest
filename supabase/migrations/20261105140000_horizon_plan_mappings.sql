-- Mapping between each site plan (tier + billing period) and the exact plan ID
-- configured in the Horizon panel.
--
-- This table is the source of truth used by the Horizon API Devs integration.
-- The server reads it right before creating an account, so IDs can be changed
-- from /admin/planos without any code deploy. Environment variables remain as a
-- fallback for installations that have not filled the table yet.

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
  constraint horizon_plan_mappings_tier_check
    check (plan_tier in ('premium', 'premium_plus', 'trial')),
  constraint horizon_plan_mappings_period_check
    check (billing_period in ('mensal', 'trimestral', 'semestral', 'anual', 'trial')),
  constraint horizon_plan_mappings_trial_pair_check
    check ((plan_tier = 'trial') = (billing_period = 'trial')),
  constraint horizon_plan_mappings_id_not_blank
    check (length(trim(horizon_plan_id)) > 0)
);

create index if not exists horizon_plan_mappings_lookup_idx
  on public.horizon_plan_mappings (plan_tier, billing_period);

alter table public.horizon_plan_mappings enable row level security;

-- Staff can read the mapping from the panel. Writes are done with the service
-- role inside the authenticated server functions after the role check.
drop policy if exists "Staff can read horizon plan mappings" on public.horizon_plan_mappings;
create policy "Staff can read horizon plan mappings"
  on public.horizon_plan_mappings
  for select
  to authenticated
  using (public.is_staff(auth.uid()));

comment on table public.horizon_plan_mappings is
  'Maps each site plan (plan_tier + billing_period) to the exact plan ID in the Horizon panel. Used by the API Devs integration before creating an account.';
