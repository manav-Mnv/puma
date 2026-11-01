-- Regression: an account without a profile row (created before the identity
-- migration) can still finish onboarding; ensure_profile is not callable by users.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'early@paruluniversity.ac.in', now(), '{"name":"Early Bird"}');
-- Simulate the pre-migration state: user exists, profile does not.
delete from public.profiles where id = '00000000-0000-0000-0000-0000000000c1';

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';

select throws_ok($$ select public.ensure_profile('00000000-0000-0000-0000-0000000000c1') $$,
  '42501', null, 'Users cannot call ensure_profile directly');

select lives_ok($$
  select public.complete_onboarding(jsonb_build_object(
    'full_name', 'Early Bird', 'student_id', '24UG000777', 'institute_id', 1,
    'course', 'B.Tech CSE', 'year', 2, 'semester', 3, 'phone', '9876543210',
    'personal_email', 'early@gmail.com', 'gender', 'female', 'residence', 'day_scholar', 'consent', true))
$$, 'Onboarding recreates the missing profile and completes');

select is((select verification_status::text from public.profiles), 'verified',
  'Recreated profile keeps the Parul-email verification');
select isnt((select onboarded_at from public.profiles), null, 'Profile is onboarded');

reset role;
select * from finish();
rollback;
