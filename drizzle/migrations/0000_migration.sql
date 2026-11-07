create type public.app_role as enum ('admin','user');
create type public.subscription_status as enum ('pendente','ativa','cancelada','expirada');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admins read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  status subscription_status not null default 'pendente',
  plan_name text not null default 'TV Lebara | Plano Mensal',
  price_cents integer not null default 2490,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "own sub read" on public.subscriptions for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount_cents integer not null,
  status text not null,
  method text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "own payments read" on public.payments for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.favorites (
  user_id uuid not null,
  program_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, program_slug)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "own favs read" on public.favorites for select to authenticated using (auth.uid() = user_id);
create policy "own favs insert" on public.favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "own favs delete" on public.favorites for delete to authenticated using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.set_cancel_renewal(_cancel boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.subscriptions set cancel_at_period_end = _cancel, updated_at = now()
  where user_id = auth.uid() and status = 'ativa';
end; $$;
revoke execute on function public.set_cancel_renewal(boolean) from public, anon;
grant execute on function public.set_cancel_renewal(boolean) to authenticated;