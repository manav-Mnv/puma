-- Fix: accounts created before the identity migration (2026-10-31) had no profile,
-- so the app waited forever. Backfill them, and make onboarding self-healing.

-- Creates the profile for an auth user if it is missing. Same rules as the
-- sign-up trigger (sync_profile_from_auth): confirmed Parul email -> verified.
create function public.ensure_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, parul_email, personal_email, verification_status)
  select
    u.id,
    coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
    coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
    case when public.is_parul_email(u.email) then lower(u.email) end,
    case when public.is_parul_email(u.email) then null else lower(u.email) end,
    case when public.is_parul_email(u.email) and u.email_confirmed_at is not null
      then 'verified' else 'unverified' end::public.verification_status
  from auth.users u
  where u.id = p_user_id
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.ensure_profile(uuid) from public, anon, authenticated;

-- Backfill every existing account that has no profile.
select public.ensure_profile(u.id)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

create or replace function public.complete_onboarding(p jsonb)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_student_id text := upper(regexp_replace(coalesce(p ->> 'student_id', ''), '\s', '', 'g'));
  v_phone text := regexp_replace(coalesce(p ->> 'phone', ''), '\D', '', 'g');
  v_personal_email text := lower(trim(coalesce(p ->> 'personal_email', '')));
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if v_student_id !~ '^[0-9]{2}[A-Z]{2,5}[0-9]{3,8}$' then
    raise exception 'invalid_student_id' using errcode = '22023';
  end if;
  if left(v_student_id, 2)::int > (extract(year from now())::int % 100) then
    raise exception 'invalid_student_id_year' using errcode = '22023';
  end if;

  if length(v_phone) = 12 and left(v_phone, 2) = '91' then
    v_phone := right(v_phone, 10);
  end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  perform public.ensure_profile(v_uid);
  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile_missing' using errcode = 'P0002';
  end if;

  -- Path B students already have a personal email from sign-up.
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
        student_id = v_student_id,
        institute_id = (p ->> 'institute_id')::smallint,
        institute_other = nullif(trim(p ->> 'institute_other'), ''),
        course = nullif(trim(p ->> 'course'), ''),
        year = (p ->> 'year')::smallint,
        semester = (p ->> 'semester')::smallint,
        phone = v_phone,
        gender = (p ->> 'gender')::public.gender,
        residence = (p ->> 'residence')::public.residence,
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
