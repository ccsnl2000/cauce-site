-- Cauce: run once in Supabase → SQL Editor → New query → Run.
-- One profile row per account. Readers can edit their own profile fields;
-- plan and Stripe fields are written only by server functions (service role).

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  plan text not null default 'boletin',           -- boletin | inteligencia
  plan_status text,                                -- Stripe subscription status
  stripe_customer_id text unique,
  perfil text,                                     -- particular, agente, inv-int...
  pais text,
  zonas text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Signed-in readers may change only these columns.
revoke update on public.profiles from authenticated, anon;
grant update (perfil, pais, zonas) on public.profiles to authenticated;

-- Create the profile automatically when someone signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Added 25 Oct 2026: the trigger function is not callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Newsletter list (Resend). Only the newsletter function (service role) touches it.
create table if not exists public.subscribers (
  email text primary key,
  source text,
  perfil text,
  welcomed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;

-- Renewal info written by the Stripe webhook.
alter table public.profiles add column if not exists renews_at timestamptz, add column if not exists cancel_at_period_end boolean not null default false;

-- Added 25 Oct 2026: first name for the account greeting.
alter table public.profiles add column if not exists nombre text;
grant update (nombre) on public.profiles to authenticated;

-- Added 25 Oct 2026: email language for account emails.
alter table public.profiles add column if not exists lang text not null default 'es';
grant update (lang) on public.profiles to authenticated;

-- Added 25 Oct 2026: richer profile (ISO country code, multi-select zones, budget, timeline, goals).
alter table public.profiles add column if not exists apellido text, add column if not exists presupuesto text, add column if not exists plazo text, add column if not exists objetivos text[];
-- zonas is text[] (converted from comma text); handle_new_user copies nombre/apellido from signup metadata.

-- Added 25 Oct 2026: agent/agency fields.
alter table public.profiles add column if not exists empresa text, add column if not exists asesores text, add column if not exists contacto text, add column if not exists whatsapp text, add column if not exists acepta_contacto boolean not null default false;
