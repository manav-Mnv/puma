-- T06/T07 — Attendance (Mode A ticket scan) and admin role management.
-- SRS §2 (attendance), §5 (check_in_by_ticket), §9 (edge cases), AUTH-7.

create type public.attendance_mode as enum ('scan', 'self', 'manual');

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  -- UNIQUE is the duplicate guard: one attendance per registration, whatever the mode or device.
  registration_id uuid not null unique references public.registrations (id) on delete cascade,
  mode public.attendance_mode not null,
  scanned_by uuid references public.profiles (id),
  checked_in_at timestamptz not null default now(),
  added_post_completion boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- Organizer = the event's creator, or an Admin/Super Admin.
create function public.is_event_organizer(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.events where id = p_event_id and creator_id = auth.uid())
      or coalesce(public.my_role() in ('admin', 'super_admin'), false);
$$;

-- ---------------------------------------------------------------------------
-- Mode A: organizer scans a student's ticket QR
-- ---------------------------------------------------------------------------
create function public.check_in_by_ticket(p_event_id uuid, p_ticket_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events;
  v_registration public.registrations;
  v_profile public.profiles;
  v_attendance_id uuid;
  v_code text := lower(regexp_replace(coalesce(p_ticket_code, ''), '^edge:ticket:', '', 'i'));
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not public.is_event_organizer(p_event_id) then
    raise exception 'not_event_organizer' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'event_not_open' using errcode = '22023';
  end if;
  if v_event.status not in ('published', 'completed')
     or now() < v_event.starts_at - interval '2 hours'
     or now() > v_event.ends_at + interval '2 hours' then
    raise exception 'checkin_closed' using errcode = '22023';
  end if;

  select * into v_registration from public.registrations where ticket_code = v_code;
  if not found then
    raise exception 'ticket_not_found' using errcode = 'P0002';
  end if;
  if v_registration.event_id <> p_event_id then
    raise exception 'wrong_event' using errcode = '22023';
  end if;
  if v_registration.status <> 'registered' then
    raise exception 'registration_cancelled' using errcode = '22023';
  end if;

  insert into public.attendance (registration_id, mode, scanned_by)
  values (v_registration.id, 'scan', v_uid)
  on conflict (registration_id) do nothing
  returning id into v_attendance_id;

  select * into v_profile from public.profiles where id = v_registration.user_id;

  return jsonb_build_object(
    'status', case when v_attendance_id is null then 'already' else 'ok' end,
    'full_name', v_profile.full_name,
    'student_id', v_profile.student_id,
    'verification_status', v_profile.verification_status,
    'avatar_url', v_profile.avatar_url
  );
end;
$$;

-- Live counter for the organizer's scan screen.
create function public.event_checked_in_count(p_event_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'not_event_organizer' using errcode = '42501';
  end if;
  return (
    select count(*)::int from public.attendance a
    join public.registrations r on r.id = a.registration_id
    where r.event_id = p_event_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: find people to assign roles (set_role lives in the events migration)
-- ---------------------------------------------------------------------------
create function public.admin_find_profiles(p_query text)
returns table (
  id uuid,
  full_name text,
  parul_email text,
  personal_email text,
  student_id text,
  role public.app_role,
  verification_status public.verification_status
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_term text := '%' || lower(trim(coalesce(p_query, ''))) || '%';
begin
  if public.my_role() is null or public.my_role() not in ('admin', 'super_admin') then
    raise exception 'not_allowed_to_set_role' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_query, ''))) < 3 then
    return;
  end if;
  return query
    select p.id, p.full_name, p.parul_email, p.personal_email, p.student_id, p.role, p.verification_status
    from public.profiles p
    where lower(coalesce(p.full_name, '')) like v_term
       or lower(coalesce(p.parul_email, '')) like v_term
       or lower(coalesce(p.personal_email, '')) like v_term
       or lower(coalesce(p.student_id, '')) like v_term
    order by p.full_name nulls last
    limit 20;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on public.attendance from anon, authenticated;
grant select on public.attendance to authenticated;
grant all on public.attendance to service_role;

revoke all on function public.is_event_organizer(uuid) from public, anon;
grant execute on function public.is_event_organizer(uuid) to authenticated;
revoke all on function public.check_in_by_ticket(uuid, text) from public, anon;
grant execute on function public.check_in_by_ticket(uuid, text) to authenticated;
revoke all on function public.event_checked_in_count(uuid) from public, anon;
grant execute on function public.event_checked_in_count(uuid) to authenticated;
revoke all on function public.admin_find_profiles(text) from public, anon;
grant execute on function public.admin_find_profiles(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: students see their own check-ins (the ticket shows "Checked in ✓").
-- ---------------------------------------------------------------------------
alter table public.attendance enable row level security;

create policy "users see their own attendance"
  on public.attendance for select to authenticated
  using (exists (
    select 1 from public.registrations r
    where r.id = registration_id and r.user_id = (select auth.uid())
  ));
