-- Day 7 (T11, T12, T17): clubs, Club Lead event requests, AD/Admin approval queue,
-- and the temporary-ID → enrollment-number upgrade when a Parul email is linked.

-- ---------------------------------------------------------------------------
-- T17: linking a Parul email. When a confirmed Parul email's local part is an
-- enrollment number (e.g. 2503031461401@paruluniversity.ac.in), it replaces the
-- temporary student ID (e.g. 25UG024310) and the account becomes Verified.
-- ---------------------------------------------------------------------------
create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(new.email);
  v_is_parul boolean := new.email is not null and public.is_parul_email(new.email);
  v_confirmed boolean := new.email_confirmed_at is not null;
  v_local text := split_part(lower(coalesce(new.email, '')), '@', 1);
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, full_name, avatar_url, parul_email, personal_email, verification_status, student_id)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
      case when v_is_parul then v_email end,
      case when v_is_parul then null else v_email end,
      case when v_is_parul and v_confirmed then 'verified' else 'unverified' end::public.verification_status,
      -- Parul mailbox named after the enrollment number: prefill the ID.
      case when v_is_parul and v_local ~ '^[0-9]{10,15}$'
            and not exists (select 1 from public.profiles where student_id = v_local)
           then v_local end
    );
  elsif v_is_parul and v_confirmed then
    update public.profiles p
    set parul_email = v_email,
        verification_status = 'verified',
        student_id = case
          when v_local ~ '^[0-9]{10,15}$'
           and not exists (select 1 from public.profiles o where o.student_id = v_local and o.id <> p.id)
          then v_local else p.student_id end
    where p.id = new.id;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Clubs
-- ---------------------------------------------------------------------------
create type public.club_status as enum ('pending', 'approved', 'rejected', 'archived');

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 3 and 80),
  description text not null default '' check (length(description) <= 2000),
  department_id smallint references public.departments (id),
  lead_id uuid not null references public.profiles (id),
  advisor_id uuid references public.profiles (id),
  status public.club_status not null default 'pending',
  remarks text,
  decided_by uuid references public.profiles (id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

alter table public.events add column club_id uuid references public.clubs (id);
alter table public.events add column decided_by uuid references public.profiles (id);
alter table public.events add column decided_at timestamptz;

create or replace view public.event_feed
with (security_invoker = true)
as
select
  e.id, e.title, e.description, e.venue, e.starts_at, e.ends_at, e.department_id,
  e.creator_id, e.creator_role, e.organizer_name, e.status, e.is_verified, e.cover_url,
  e.created_at, public.event_registered_count(e.id) as registered_count,
  e.club_id, e.remarks
from public.events e;

grant select (club_id, remarks) on public.events to anon, authenticated;

create function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role() in ('ad', 'admin', 'super_admin'), false);
$$;

-- A student asks to start a club; it waits for an AD.
create function public.request_club(p_name text, p_description text)
returns public.clubs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_club public.clubs;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and onboarded_at is not null) then
    raise exception 'profile_incomplete' using errcode = '42501';
  end if;
  begin
    insert into public.clubs (name, description, lead_id)
    values (trim(p_name), coalesce(trim(p_description), ''), auth.uid())
    returning * into v_club;
  exception
    when unique_violation then raise exception 'club_name_taken' using errcode = '23505';
    when check_violation then raise exception 'invalid_club' using errcode = '22023';
  end;
  return v_club;
end;
$$;

create function public.join_club(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.clubs where id = p_club_id and status = 'approved') then
    raise exception 'club_not_open' using errcode = '22023';
  end if;
  insert into public.club_members (club_id, user_id) values (p_club_id, auth.uid())
  on conflict do nothing;
end;
$$;

-- Members leave on their own; Club Leads cannot remove members (PRD §8).
create function public.leave_club(p_club_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.club_members where club_id = p_club_id and user_id = auth.uid();
$$;

create function public.club_member_count(p_club_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.club_members where club_id = p_club_id;
$$;

-- ---------------------------------------------------------------------------
-- Events: Faculty/AD/Admin publish directly; Club Leads submit for approval.
-- ---------------------------------------------------------------------------
create or replace function public.create_event(p jsonb)
returns public.events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role := public.my_role();
  v_club_id uuid := nullif(p ->> 'club_id', '')::uuid;
  v_direct boolean := v_role in ('faculty', 'ad', 'admin', 'super_admin');
  v_event public.events;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if v_club_id is not null and not exists (
    select 1 from public.clubs where id = v_club_id and lead_id = v_uid and status = 'approved'
  ) then
    raise exception 'not_club_lead' using errcode = '42501';
  end if;
  if not v_direct and v_club_id is null then
    raise exception 'not_allowed_to_create_events' using errcode = '42501';
  end if;
  if (p ->> 'starts_at')::timestamptz < now() - interval '1 hour' then
    raise exception 'event_in_past' using errcode = '22023';
  end if;

  begin
    insert into public.events (title, description, venue, starts_at, ends_at, department_id, club_id,
                               creator_id, creator_role, organizer_name, status, is_verified)
    values (
      trim(p ->> 'title'),
      coalesce(trim(p ->> 'description'), ''),
      trim(p ->> 'venue'),
      (p ->> 'starts_at')::timestamptz,
      (p ->> 'ends_at')::timestamptz,
      (p ->> 'department_id')::smallint,
      v_club_id,
      v_uid, v_role,
      coalesce((select name from public.clubs where id = v_club_id),
               (select full_name from public.profiles where id = v_uid), ''),
      case when v_direct then 'published' else 'pending' end::public.event_status,
      v_direct
    )
    returning * into v_event;
  exception
    when check_violation or not_null_violation then
      raise exception 'invalid_event' using errcode = '22023';
  end;

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Approval queue (AD / Admin / Super Admin)
-- ---------------------------------------------------------------------------
create function public.review_queue()
returns table (
  kind text,
  id uuid,
  title text,
  detail text,
  requester_name text,
  created_at timestamptz,
  overdue boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_reviewer() then
    raise exception 'not_reviewer' using errcode = '42501';
  end if;
  return query
    select 'club'::text, c.id, c.name, c.description, p.full_name, c.created_at,
           c.created_at < now() - interval '2 days'
    from public.clubs c join public.profiles p on p.id = c.lead_id
    where c.status = 'pending'
    union all
    select 'event'::text, e.id, e.title,
           e.organizer_name || ' · ' || e.venue || ' · ' || to_char(e.starts_at at time zone 'Asia/Kolkata', 'DD Mon HH24:MI'),
           p.full_name, e.created_at, e.created_at < now() - interval '2 days'
    from public.events e join public.profiles p on p.id = e.creator_id
    where e.status = 'pending'
    order by 6;
end;
$$;

create function public.decide_request(p_kind text, p_id uuid, p_approve boolean, p_remarks text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead uuid;
begin
  if not public.is_reviewer() then
    raise exception 'not_reviewer' using errcode = '42501';
  end if;
  if not p_approve and coalesce(trim(p_remarks), '') = '' then
    raise exception 'remarks_required' using errcode = '22023';
  end if;

  if p_kind = 'club' then
    update public.clubs
    set status = case when p_approve then 'approved' else 'rejected' end::public.club_status,
        remarks = nullif(trim(p_remarks), ''), decided_by = auth.uid(), decided_at = now()
    where id = p_id and status = 'pending'
    returning lead_id into v_lead;
    if not found then
      raise exception 'request_not_pending' using errcode = '22023';
    end if;
    if p_approve then
      -- Approval makes the requester a Club Lead (unless they already hold a higher role).
      update public.profiles set role = 'club_lead' where id = v_lead and role = 'student';
      insert into public.club_members (club_id, user_id) values (p_id, v_lead) on conflict do nothing;
    end if;
  elsif p_kind = 'event' then
    update public.events
    set status = case when p_approve then 'published' else 'rejected' end::public.event_status,
        is_verified = p_approve,
        remarks = nullif(trim(p_remarks), ''), decided_by = auth.uid(), decided_at = now()
    where id = p_id and status = 'pending';
    if not found then
      raise exception 'request_not_pending' using errcode = '22023';
    end if;
  else
    raise exception 'invalid_request_kind' using errcode = '22023';
  end if;
end;
$$;

-- Super Admin console numbers.
create function public.platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'super_admin' then
    raise exception 'not_super_admin' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'verified', (select count(*) from public.profiles where verification_status = 'verified'),
    'onboarded', (select count(*) from public.profiles where onboarded_at is not null),
    'staff', (select count(*) from public.profiles where role <> 'student'),
    'clubs', (select count(*) from public.clubs where status = 'approved'),
    'pending', (select count(*) from public.clubs where status = 'pending')
             + (select count(*) from public.events where status = 'pending'),
    'events', (select count(*) from public.events where status in ('published', 'completed')),
    'registrations', (select count(*) from public.registrations where status = 'registered'),
    'checkins', (select count(*) from public.attendance),
    'certificates', (select count(*) from public.certificates)
  );
end;
$$;

-- Only Super Admin may create Admins (SRS §6.1).
create or replace function public.set_role(p_user_id uuid, p_role public.app_role)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me public.app_role := public.my_role();
  v_profile public.profiles;
begin
  if v_me is null or v_me not in ('admin', 'super_admin') then
    raise exception 'not_allowed_to_set_role' using errcode = '42501';
  end if;
  if p_role = 'super_admin' or (p_role = 'admin' and v_me <> 'super_admin') then
    raise exception 'not_allowed_to_set_role' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile_missing' using errcode = 'P0002';
  end if;
  if v_profile.role = 'super_admin' or (v_profile.role = 'admin' and v_me <> 'super_admin') then
    raise exception 'not_allowed_to_set_role' using errcode = '42501';
  end if;
  if p_role <> 'student' and v_profile.verification_status <> 'verified' then
    raise exception 'staff_requires_parul_email' using errcode = '22023';
  end if;

  update public.profiles set role = p_role where id = p_user_id returning * into v_profile;
  return v_profile;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------
revoke all on public.clubs, public.club_members from anon, authenticated;
grant select on public.clubs to authenticated;
grant select on public.club_members to authenticated;
grant all on public.clubs, public.club_members to service_role;

revoke all on function public.is_reviewer() from public, anon;
grant execute on function public.is_reviewer() to authenticated;
revoke all on function public.request_club(text, text) from public, anon;
grant execute on function public.request_club(text, text) to authenticated;
revoke all on function public.join_club(uuid) from public, anon;
grant execute on function public.join_club(uuid) to authenticated;
revoke all on function public.leave_club(uuid) from public, anon;
grant execute on function public.leave_club(uuid) to authenticated;
revoke all on function public.club_member_count(uuid) from public, anon;
grant execute on function public.club_member_count(uuid) to authenticated;
revoke all on function public.review_queue() from public, anon;
grant execute on function public.review_queue() to authenticated;
revoke all on function public.decide_request(text, uuid, boolean, text) from public, anon;
grant execute on function public.decide_request(text, uuid, boolean, text) to authenticated;
revoke all on function public.platform_stats() from public, anon;
grant execute on function public.platform_stats() to authenticated;

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;

create policy "approved clubs are visible"
  on public.clubs for select to authenticated
  using (status = 'approved' or lead_id = (select auth.uid()) or (select public.is_reviewer()));

create policy "users see their own memberships"
  on public.club_members for select to authenticated
  using (user_id = (select auth.uid()));
