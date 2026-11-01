-- Pre-pilot: staff onboarding, edit/cancel events, attendance roster (CSV), event reminders.

-- ---------------------------------------------------------------------------
-- Staff onboarding: Faculty / AD / Admin give an MIS ID + designation instead of
-- student fields. Roles are still granted by an Admin; this only shapes the profile.
-- ---------------------------------------------------------------------------
alter table public.profiles add column is_staff boolean not null default false;
alter table public.profiles add column staff_mis_id text unique check (staff_mis_id ~ '^[A-Z0-9/-]{2,30}$');
alter table public.profiles add column designation text check (length(designation) between 2 and 80);

alter table public.profiles drop constraint profiles_onboarded_requires_fields;
alter table public.profiles add constraint profiles_onboarded_requires_fields check (
  onboarded_at is null or (
    full_name is not null and institute_id is not null and phone is not null and gender is not null
    and personal_email is not null and consent_at is not null
    and (
      (not is_staff and student_id is not null and course is not null and year is not null
        and semester is not null and residence is not null)
      or (is_staff and staff_mis_id is not null and designation is not null)
    )
  )
);

create or replace function public.complete_onboarding(p jsonb)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_staff boolean := coalesce(p ->> 'kind', 'student') = 'staff';
  v_student_id text := upper(regexp_replace(coalesce(p ->> 'student_id', ''), '\s', '', 'g'));
  v_mis_id text := upper(regexp_replace(coalesce(p ->> 'staff_mis_id', ''), '\s', '', 'g'));
  v_phone text := regexp_replace(coalesce(p ->> 'phone', ''), '\D', '', 'g');
  v_personal_email text := lower(trim(coalesce(p ->> 'personal_email', '')));
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  perform public.ensure_profile(v_uid);
  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile_missing' using errcode = 'P0002';
  end if;

  if v_staff then
    if v_profile.verification_status <> 'verified' then
      raise exception 'staff_requires_parul_email' using errcode = '22023';
    end if;
    if v_mis_id !~ '^[A-Z0-9/-]{2,30}$' then
      raise exception 'invalid_mis_id' using errcode = '22023';
    end if;
    if exists (select 1 from public.profiles where staff_mis_id = v_mis_id and id <> v_uid) then
      raise exception 'mis_id_taken' using errcode = '23505';
    end if;
  else
    if v_student_id !~ '^([0-9]{2}[A-Z]{2,5}[0-9]{3,8}|[0-9]{10,15})$' then
      raise exception 'invalid_student_id' using errcode = '22023';
    end if;
    if left(v_student_id, 2)::int > (extract(year from now())::int % 100) then
      raise exception 'invalid_student_id_year' using errcode = '22023';
    end if;
    if exists (select 1 from public.profiles where student_id = v_student_id and id <> v_uid) then
      raise exception 'student_id_taken' using errcode = '23505';
    end if;
  end if;

  if length(v_phone) = 12 and left(v_phone, 2) = '91' then
    v_phone := right(v_phone, 10);
  end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  if v_personal_email = '' then
    v_personal_email := v_profile.personal_email;
  end if;
  if v_personal_email is null or v_personal_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_personal_email' using errcode = '22023';
  end if;
  if public.is_parul_email(v_personal_email) then
    raise exception 'personal_email_is_parul' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.institutes i
    where i.id = (p ->> 'institute_id')::smallint and i.is_other
  ) and nullif(trim(p ->> 'institute_other'), '') is null then
    raise exception 'institute_other_required' using errcode = '22023';
  end if;

  if coalesce((p ->> 'consent')::boolean, false) is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;

  begin
    update public.profiles
    set full_name = nullif(trim(p ->> 'full_name'), ''),
        is_staff = v_staff,
        student_id = case when v_staff then student_id else v_student_id end,
        staff_mis_id = case when v_staff then v_mis_id end,
        designation = case when v_staff then nullif(trim(p ->> 'designation'), '') end,
        institute_id = (p ->> 'institute_id')::smallint,
        institute_other = nullif(trim(p ->> 'institute_other'), ''),
        course = case when v_staff then null else nullif(trim(p ->> 'course'), '') end,
        year = case when v_staff then null else (p ->> 'year')::smallint end,
        semester = case when v_staff then null else (p ->> 'semester')::smallint end,
        residence = case when v_staff then null else (p ->> 'residence')::public.residence end,
        phone = v_phone,
        gender = (p ->> 'gender')::public.gender,
        personal_email = v_personal_email,
        consent_at = coalesce(consent_at, now()),
        onboarded_at = coalesce(onboarded_at, now())
    where id = v_uid
    returning * into v_profile;
  exception
    when unique_violation then
      raise exception 'student_id_taken' using errcode = '23505';
    when check_violation or not_null_violation or invalid_text_representation then
      raise exception 'incomplete_profile' using errcode = '22023';
  end;

  return v_profile;
end;
$$;

-- ---------------------------------------------------------------------------
-- Edit / cancel events (organizer). The events_notify trigger sends registered
-- students a critical alert when the time or venue changes, or on cancel.
-- ---------------------------------------------------------------------------
create function public.update_event(p_event_id uuid, p jsonb)
returns public.events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'not_event_organizer' using errcode = '42501';
  end if;
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status in ('completed', 'cancelled') then
    raise exception 'event_not_editable' using errcode = '22023';
  end if;
  if (p ->> 'starts_at')::timestamptz < now() - interval '1 hour' then
    raise exception 'event_in_past' using errcode = '22023';
  end if;
  begin
    update public.events
    set title = trim(p ->> 'title'),
        description = coalesce(trim(p ->> 'description'), ''),
        venue = trim(p ->> 'venue'),
        starts_at = (p ->> 'starts_at')::timestamptz,
        ends_at = (p ->> 'ends_at')::timestamptz
    where id = p_event_id
    returning * into v_event;
  exception
    when check_violation or not_null_violation then
      raise exception 'invalid_event' using errcode = '22023';
  end;
  return v_event;
end;
$$;

create function public.cancel_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'not_event_organizer' using errcode = '42501';
  end if;
  update public.events set status = 'cancelled'
  where id = p_event_id and status in ('draft', 'pending', 'published');
  if not found then
    raise exception 'event_not_editable' using errcode = '22023';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Attendance roster for the HOD (CSV). Academic fields only, no phone or
-- personal email (SRS §10.1); Verified/Unverified flag included.
-- ---------------------------------------------------------------------------
create function public.event_roster(p_event_id uuid)
returns table (
  full_name text,
  student_id text,
  parul_email text,
  verification_status text,
  course text,
  year smallint,
  registered_at timestamptz,
  checked_in_at timestamptz,
  check_in_mode text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.is_event_organizer(p_event_id) or public.is_reviewer()) then
    raise exception 'not_event_organizer' using errcode = '42501';
  end if;
  return query
    select p.full_name, coalesce(p.student_id, p.staff_mis_id), p.parul_email,
           p.verification_status::text, p.course, p.year,
           r.created_at, a.checked_in_at, a.mode::text
    from public.registrations r
    join public.profiles p on p.id = r.user_id
    left join public.attendance a on a.registration_id = r.id
    where r.event_id = p_event_id and r.status = 'registered'
    order by p.full_name;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reminders: 2 hours before start, once per event.
-- ---------------------------------------------------------------------------
alter table public.events add column reminded_at timestamptz;

create function public.send_event_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int := 0;
  v_event record;
begin
  for v_event in
    update public.events set reminded_at = now()
    where status = 'published' and reminded_at is null
      and starts_at between now() and now() + interval '2 hours'
    returning id, title, venue, starts_at
  loop
    perform public.notify(r.user_id, 'reminder', 'Starting soon: ' || v_event.title,
      to_char(v_event.starts_at at time zone 'Asia/Kolkata', 'HH24:MI') || ' IST · ' || v_event.venue,
      '/event/' || v_event.id)
    from public.registrations r where r.event_id = v_event.id and r.status = 'registered';
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Every 10 minutes via pg_cron when available (Supabase has it; skip quietly elsewhere).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('edge-event-reminders', '*/10 * * * *', 'select public.send_event_reminders()');
exception when others then
  raise notice 'pg_cron not available: reminders not scheduled (%).', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select (is_staff, staff_mis_id, designation) on public.profiles to authenticated;
revoke all on function public.update_event(uuid, jsonb) from public, anon;
grant execute on function public.update_event(uuid, jsonb) to authenticated;
revoke all on function public.cancel_event(uuid) from public, anon;
grant execute on function public.cancel_event(uuid) to authenticated;
revoke all on function public.event_roster(uuid) from public, anon;
grant execute on function public.event_roster(uuid) to authenticated;
revoke all on function public.send_event_reminders() from public, anon, authenticated;
