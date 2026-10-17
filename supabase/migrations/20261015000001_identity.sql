-- T01/T02/T03/T18 — Identity foundation for EDGE.
-- Two student paths (SRS §3, ADR-004):
--   Path A: confirmed @paruluniversity.ac.in email  -> verified
--   Path B: any other email + student ID            -> unverified until a Parul email is linked
-- Every table: explicit GRANTs + RLS (Supabase Data API change, 2026-10-30).

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('student', 'faculty', 'club_lead', 'ad', 'admin', 'super_admin');
create type public.verification_status as enum ('verified', 'unverified');
create type public.gender as enum ('female', 'male', 'non_binary', 'prefer_not_to_say');
create type public.residence as enum ('hosteller', 'day_scholar');

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
create table public.allowed_email_domains (
  domain text primary key check (domain = lower(domain))
);

create table public.institutes (
  id smallint generated always as identity primary key,
  name text not null unique,
  is_other boolean not null default false
);

create table public.departments (
  id smallint generated always as identity primary key,
  institute_id smallint not null references public.institutes (id),
  name text not null,
  unique (institute_id, name)
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  parul_email text unique,
  personal_email text,
  student_id text unique check (student_id ~ '^[0-9]{2}[A-Z]{2,5}[0-9]{3,8}$'),
  institute_id smallint references public.institutes (id),
  institute_other text,
  course text,
  year smallint check (year between 1 and 6),
  semester smallint check (semester between 1 and 12),
  phone text check (phone ~ '^[6-9][0-9]{9}$'),
  gender public.gender,
  residence public.residence,
  role public.app_role not null default 'student',
  department_id smallint references public.departments (id),
  verification_status public.verification_status not null default 'unverified',
  consent_at timestamptz,
  onboarded_at timestamptz,
  avatar_url text,
  push_tokens jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_onboarded_requires_fields check (
    onboarded_at is null or (
      full_name is not null and student_id is not null and institute_id is not null
      and course is not null and year is not null and semester is not null
      and phone is not null and gender is not null and residence is not null
      and personal_email is not null and consent_at is not null
    )
  ),
  constraint profiles_verified_requires_parul_email check (
    verification_status = 'unverified' or parul_email is not null
  )
);

create index profiles_department_id_idx on public.profiles (department_id);
create index profiles_institute_id_idx on public.profiles (institute_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.is_parul_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.allowed_email_domains d
    where d.domain = lower(split_part(p_email, '@', 2))
  );
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Keep profiles in sync with auth.users (sign-up, email confirmation, email change).
-- A Parul email only counts as Verified once Supabase has confirmed it
-- (Google sign-in arrives already confirmed).
create function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(new.email);
  v_is_parul boolean := new.email is not null and public.is_parul_email(new.email);
  v_confirmed boolean := new.email_confirmed_at is not null;
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, full_name, avatar_url, parul_email, personal_email, verification_status)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
      case when v_is_parul then v_email end,
      case when v_is_parul then null else v_email end,
      case when v_is_parul and v_confirmed then 'verified' else 'unverified' end::public.verification_status
    );
  elsif v_is_parul and v_confirmed then
    -- Email confirmed or changed to a Parul address (link flow, T17): upgrade to Verified.
    update public.profiles
    set parul_email = v_email,
        verification_status = 'verified'
    where id = new.id
      and (parul_email is distinct from v_email or verification_status <> 'verified');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.sync_profile_from_auth();

create trigger on_auth_user_email_updated
after update of email, email_confirmed_at on auth.users
for each row execute function public.sync_profile_from_auth();

-- ---------------------------------------------------------------------------
-- complete_onboarding: the only way a student fills in their profile.
-- Raises machine-readable messages the client maps to localized strings.
-- ---------------------------------------------------------------------------
create function public.complete_onboarding(p jsonb)
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

-- ---------------------------------------------------------------------------
-- Grants (explicit, least privilege). Profile writes only via RPC.
-- ---------------------------------------------------------------------------
revoke all on public.allowed_email_domains, public.institutes, public.departments, public.profiles
  from anon, authenticated;

grant select on public.institutes, public.departments to anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.allowed_email_domains, public.institutes, public.departments, public.profiles
  to service_role;

revoke all on function public.complete_onboarding(jsonb) from public, anon;
grant execute on function public.complete_onboarding(jsonb) to authenticated;
revoke all on function public.is_parul_email(text) from public, anon, authenticated;
revoke all on function public.sync_profile_from_auth() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.allowed_email_domains enable row level security;
alter table public.institutes enable row level security;
alter table public.departments enable row level security;
alter table public.profiles enable row level security;

create policy "institutes are readable by everyone"
  on public.institutes for select to anon, authenticated using (true);

create policy "departments are readable by everyone"
  on public.departments for select to anon, authenticated using (true);

create policy "users read their own profile"
  on public.profiles for select to authenticated using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- Reference data (ADR-004). Institute list is a placeholder until D3.
-- ---------------------------------------------------------------------------
insert into public.allowed_email_domains (domain) values ('paruluniversity.ac.in');

insert into public.institutes (name, is_other) values
  ('Parul Institute of Engineering & Technology', false),
  ('Parul Institute of Technology', false),
  ('Parul Institute of Management & Research', false),
  ('Parul Institute of Pharmacy', false),
  ('Parul Institute of Computer Application', false),
  ('Other', true);
