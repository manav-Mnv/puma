-- Enrollment numbers (all digits) and temporary IDs are both accepted and unique.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'one@gmail.com', now(), '{"name":"One"}'),
  ('00000000-0000-0000-0000-0000000000d2', 'two@gmail.com', now(), '{"name":"Two"}');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';
select lives_ok($$
  select public.complete_onboarding(jsonb_build_object(
    'full_name', 'One', 'student_id', '2503 0314 61401', 'institute_id', 1, 'course', 'B.Tech',
    'year', 1, 'semester', 1, 'phone', '9876543210', 'gender', 'male', 'residence', 'hosteller', 'consent', true))
$$, 'Enrollment number accepted (spaces removed)');
select is((select student_id from public.profiles), '2503031461401', 'Stored without spaces');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}';
select throws_ok($$
  select public.complete_onboarding(jsonb_build_object(
    'full_name', 'Two', 'student_id', '2503031461401', 'institute_id', 1, 'course', 'B.Tech',
    'year', 1, 'semester', 1, 'phone', '9876543210', 'gender', 'male', 'residence', 'hosteller', 'consent', true))
$$, '23505', 'student_id_taken', 'Same enrollment number cannot be used twice');
select throws_ok($$
  select public.complete_onboarding(jsonb_build_object(
    'full_name', 'Two', 'student_id', '250303146', 'institute_id', 1, 'course', 'B.Tech',
    'year', 1, 'semester', 1, 'phone', '9876543210', 'gender', 'male', 'residence', 'hosteller', 'consent', true))
$$, '22023', 'invalid_student_id', 'Too-short number is rejected');

reset role;
select * from finish();
rollback;
