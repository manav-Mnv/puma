-- T01/T02/T03 — identity paths, onboarding validation, RLS.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Test users ---------------------------------------------------------------
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'Asha@ParulUniversity.ac.in', now(), '{"full_name":"Asha Patel"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ravi.fresher@gmail.com',     now(), '{"name":"Ravi Shah"}'),
  ('00000000-0000-0000-0000-00000000000c', 'meera@paruluniversity.ac.in', null, '{}');

-- Path A: confirmed Parul email -> verified
select is(
  (select verification_status::text from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'verified', 'Path A: confirmed Parul email is Verified');
select is(
  (select parul_email from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'asha@paruluniversity.ac.in', 'Path A: Parul email stored lowercase');
select is(
  (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'Asha Patel', 'Name copied from sign-up metadata');

-- Path B: personal email -> unverified
select is(
  (select verification_status::text from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'unverified', 'Path B: personal email is Unverified');
select is(
  (select personal_email from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'ravi.fresher@gmail.com', 'Path B: personal email stored');

-- Unconfirmed Parul email is not Verified until confirmed
select is(
  (select verification_status::text from public.profiles where id = '00000000-0000-0000-0000-00000000000c'),
  'unverified', 'Unconfirmed Parul email stays Unverified');
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000c';
select is(
  (select verification_status::text from public.profiles where id = '00000000-0000-0000-0000-00000000000c'),
  'verified', 'Confirming the Parul email upgrades to Verified');

-- Link flow (T17): Path B user changes auth email to a confirmed Parul address
update auth.users set email = 'ravi@paruluniversity.ac.in', email_confirmed_at = now()
where id = '00000000-0000-0000-0000-00000000000b';
select is(
  (select verification_status::text from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'verified', 'Linking a confirmed Parul email upgrades Path B to Verified');
update auth.users set email = 'ravi.fresher@gmail.com' where id = '00000000-0000-0000-0000-00000000000b';

-- Act as user B (authenticated) -------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

select lives_ok($$
  select public.complete_onboarding(jsonb_build_object(
    'full_name', 'Ravi Shah', 'student_id', ' 25ug030303 ', 'institute_id', 1,
    'course', 'B.Tech CSE', 'year', 1, 'semester', 1, 'phone', '+91 98765 43210',
    'gender', 'male', 'residence', 'hosteller', 'consent', true))
$$, 'Valid onboarding succeeds (personal email reused from sign-up)');

select is(
  (select student_id from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  '25UG030303', 'Student ID normalised to uppercase without spaces');
select is(
  (select phone from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  '9876543210', 'Phone normalised to 10 digits');
select isnt(
  (select onboarded_at from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  null, 'onboarded_at set');

select throws_ok($$
  select public.complete_onboarding('{"student_id":"UG25","phone":"9876543210","consent":true}'::jsonb)
$$, '22023', 'invalid_student_id', 'Bad student ID format rejected');

select throws_ok($$
  select public.complete_onboarding('{"student_id":"99UG000001","phone":"9876543210","consent":true}'::jsonb)
$$, '22023', 'invalid_student_id_year', 'Future year prefix rejected');

select throws_ok($$
  select public.complete_onboarding('{"student_id":"25PG000001","phone":"12345","consent":true}'::jsonb)
$$, '22023', 'invalid_phone', 'Bad phone rejected');

select throws_ok($$
  select public.complete_onboarding(jsonb_build_object(
    'full_name', 'Ravi Shah', 'student_id', '25PG000001', 'institute_id', 1,
    'course', 'MBA', 'year', 1, 'semester', 1, 'phone', '9876543210',
    'gender', 'male', 'residence', 'hosteller', 'consent', false))
$$, '22023', 'consent_required', 'Consent is required');

-- RLS: B cannot see A, and cannot write profiles directly
select is((select count(*)::int from public.profiles), 1, 'RLS: user sees only their own profile');
select throws_ok($$ update public.profiles set role = 'admin' $$, '42501', null,
  'Direct profile updates are denied (no role escalation)');

-- Act as user A: duplicate student ID
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok($$
  select public.complete_onboarding(jsonb_build_object(
    'full_name', 'Asha Patel', 'student_id', '25UG030303', 'institute_id', 1,
    'course', 'B.Tech CSE', 'year', 1, 'semester', 1, 'phone', '9876543210',
    'personal_email', 'asha@gmail.com', 'gender', 'female', 'residence', 'day_scholar',
    'consent', true))
$$, '23505', 'student_id_taken', 'Duplicate student ID rejected');

reset role;

-- Every public table has RLS enabled
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0, 'Every public table has RLS enabled');

select * from finish();
rollback;
