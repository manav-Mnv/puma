-- T04/T05 — Events, registrations, and role assignment for EDGE.
-- SRS §2, §4, §5. Writes only through RPCs; explicit GRANTs + RLS everywhere.

create type public.event_status as enum ('draft', 'pending', 'published', 'rejected', 'completed', 'cancelled');
create type public.registration_status as enum ('registered', 'cancelled');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 3 and 120),
  description text not null default '' check (length(description) <= 5000),
  venue text not null check (length(trim(venue)) between 2 and 200),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  department_id smallint references public.departments (id),
  creator_id uuid not null references public.profiles (id),
  creator_role public.app_role not null,
  -- Snapshot of the creator's name: profiles are private (own-row RLS).
  organizer_name text not null default '',
  status public.event_status not null default 'draft',
  is_verified boolean not null default false,
  remarks text,
  checkin_code text not null default replace(gen_random_uuid()::text, '-', ''),
  cover_url text,
  completed_at timestamptz,
  completed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_ends_after_start check (ends_at > starts_at)
);

create index events_status_starts_at_idx on public.events (status, starts_at);
create index events_creator_id_idx on public.events (creator_id);

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.registration_status not null default 'registered',
  ticket_code text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index registrations_user_id_idx on public.registrations (user_id);

create trigger registrations_set_updated_at
before update on public.registrations
for each row execute function public.set_updated_at();

-- Aggregate only: never exposes who registered or their ticket codes.
create function public.event_registered_count(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.registrations
  where event_id = p_event_id and status = 'registered';
$$;

-- Public feed without the secret Mode B check-in code. security_invoker keeps
-- the events RLS policies in force for whoever queries it.
create view public.event_feed
with (security_invoker = true)
as
select
  e.id, e.title, e.description, e.venue, e.starts_at, e.ends_at, e.department_id,
  e.creator_id, e.creator_role, e.organizer_name, e.status, e.is_verified, e.cover_url,
  e.created_at, public.event_registered_count(e.id) as registered_count
from public.events e;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Faculty / AD / Admin events are published and verified immediately (SRS §6.7).
-- Club Leads arrive in R2 with the approval flow.
create function public.create_event(p jsonb)
returns public.events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role := public.my_role();
  v_event public.events;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if v_role is null or v_role not in ('faculty', 'ad', 'admin', 'super_admin') then
    raise exception 'not_allowed_to_create_events' using errcode = '42501';
  end if;
  if (p ->> 'starts_at')::timestamptz < now() - interval '1 hour' then
    raise exception 'event_in_past' using errcode = '22023';
  end if;

  begin
    insert into public.events (title, description, venue, starts_at, ends_at, department_id,
                               creator_id, creator_role, organizer_name, status, is_verified)
    values (
      trim(p ->> 'title'),
      coalesce(trim(p ->> 'description'), ''),
      trim(p ->> 'venue'),
      (p ->> 'starts_at')::timestamptz,
      (p ->> 'ends_at')::timestamptz,
      (p ->> 'department_id')::smallint,
      v_uid, v_role,
      coalesce((select full_name from public.profiles where id = v_uid), ''),
      'published', true
    )
    returning * into v_event;
  exception
    when check_violation or not_null_violation then
      raise exception 'invalid_event' using errcode = '22023';
  end;

  return v_event;
end;
$$;

-- Idempotent: registering twice returns the same ticket; a cancelled
-- registration is re-activated with its original ticket code.
create function public.register_for_event(p_event_id uuid)
returns public.registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events;
  v_registration public.registrations;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and onboarded_at is not null) then
    raise exception 'profile_incomplete' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found or v_event.status <> 'published' then
    raise exception 'event_not_open' using errcode = '22023';
  end if;
  if v_event.ends_at <= now() then
    raise exception 'event_ended' using errcode = '22023';
  end if;

  insert into public.registrations (event_id, user_id)
  values (p_event_id, v_uid)
  on conflict (event_id, user_id) do update
    set status = 'registered'
    where public.registrations.status <> 'registered'
  returning * into v_registration;

  if v_registration.id is null then
    select * into v_registration from public.registrations
    where event_id = p_event_id and user_id = v_uid;
  end if;

  return v_registration;
end;
$$;

create function public.cancel_registration(p_event_id uuid)
returns public.registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations;
begin
  update public.registrations
  set status = 'cancelled'
  where event_id = p_event_id and user_id = auth.uid()
  returning * into v_registration;

  if not found then
    raise exception 'not_registered' using errcode = 'P0002';
  end if;
  return v_registration;
end;
$$;

-- Role assignment (SRS AUTH-6/7). Admins can grant any role below super_admin;
-- staff roles require a verified Parul email.
create function public.set_role(p_user_id uuid, p_role public.app_role)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  if public.my_role() is null or public.my_role() not in ('admin', 'super_admin') then
    raise exception 'not_allowed_to_set_role' using errcode = '42501';
  end if;
  if p_role = 'super_admin' then
    raise exception 'not_allowed_to_set_role' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile_missing' using errcode = 'P0002';
  end if;
  if p_role <> 'student' and v_profile.verification_status <> 'verified' then
    raise exception 'staff_requires_parul_email' using errcode = '22023';
  end if;

  update public.profiles set role = p_role where id = p_user_id returning * into v_profile;
  return v_profile;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on public.events, public.registrations, public.event_feed from anon, authenticated;
grant select on public.event_feed to anon, authenticated;
-- Column-level grant: checkin_code, remarks and completion fields stay server-side.
grant select (id, title, description, venue, starts_at, ends_at, department_id, creator_id,
              creator_role, organizer_name, status, is_verified, cover_url, created_at)
  on public.events to anon, authenticated;
revoke all on function public.event_registered_count(uuid) from public;
grant execute on function public.event_registered_count(uuid) to anon, authenticated;
grant select on public.registrations to authenticated;
grant all on public.events, public.registrations to service_role;

revoke all on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;
revoke all on function public.create_event(jsonb) from public, anon;
grant execute on function public.create_event(jsonb) to authenticated;
revoke all on function public.register_for_event(uuid) from public, anon;
grant execute on function public.register_for_event(uuid) to authenticated;
revoke all on function public.cancel_registration(uuid) from public, anon;
grant execute on function public.cancel_registration(uuid) to authenticated;
revoke all on function public.set_role(uuid, public.app_role) from public, anon;
grant execute on function public.set_role(uuid, public.app_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;
alter table public.registrations enable row level security;

create policy "published events are public"
  on public.events for select to anon, authenticated
  using (status in ('published', 'completed', 'cancelled'));

create policy "creators see their own events"
  on public.events for select to authenticated
  using (creator_id = (select auth.uid()));

create policy "users see their own registrations"
  on public.registrations for select to authenticated
  using (user_id = (select auth.uid()));
