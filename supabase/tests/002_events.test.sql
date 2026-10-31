-- T04/T05 — event creation rules, idempotent registration, RLS and secrets.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'prof@paruluniversity.ac.in', now(), '{"full_name":"Prof. Mehta"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'stud@paruluniversity.ac.in', now(), '{"full_name":"Asha"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'other@gmail.com', now(), '{"full_name":"Ravi"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'admin@paruluniversity.ac.in', now(), '{"full_name":"Admin"}');

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles
set student_id = '25UG000001', institute_id = 1, course = 'B.Tech', year = 1, semester = 1,
    phone = '9876543210', gender = 'female', residence = 'hosteller', personal_email = 'asha@gmail.com',
    consent_at = now(), onboarded_at = now()
where id = '00000000-0000-0000-0000-0000000000b1';

set local role authenticated;

-- Admin promotes the professor to faculty ---------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok(
  $$ select public.set_role('00000000-0000-0000-0000-0000000000f1', 'faculty') $$,
  'Admin can make a verified user Faculty');
select throws_ok(
  $$ select public.set_role('00000000-0000-0000-0000-0000000000b2', 'faculty') $$,
  '22023', 'staff_requires_parul_email', 'Unverified users cannot become staff');
select throws_ok(
  $$ select public.set_role('00000000-0000-0000-0000-0000000000b1', 'super_admin') $$,
  '42501', 'not_allowed_to_set_role', 'Nobody can grant super_admin through the API');

-- Students cannot create events or set roles ----------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select throws_ok(
  $$ select public.create_event(jsonb_build_object('title','Hack Night','venue','Lab 4',
       'starts_at', now() + interval '1 day', 'ends_at', now() + interval '1 day 3 hours')) $$,
  '42501', 'not_allowed_to_create_events', 'Students cannot create events');
select throws_ok(
  $$ select public.set_role('00000000-0000-0000-0000-0000000000b1', 'admin') $$,
  '42501', 'not_allowed_to_set_role', 'Students cannot change roles');

-- Faculty creates a verified, published event ---------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}';
select lives_ok(
  $$ select public.create_event(jsonb_build_object('title','Swift Workshop','venue','Seminar Hall 2',
       'description','Intro to SwiftUI',
       'starts_at', now() + interval '2 days', 'ends_at', now() + interval '2 days 2 hours')) $$,
  'Faculty can create an event');
select is(
  (select status::text || '/' || is_verified::text || '/' || organizer_name
     from public.event_feed where title = 'Swift Workshop'),
  'published/true/Prof. Mehta', 'Faculty event is published, verified, with organizer name');
select throws_ok(
  $$ select public.create_event(jsonb_build_object('title','Bad','venue','X',
       'starts_at', now() + interval '2 days', 'ends_at', now() + interval '1 day')) $$,
  '22023', 'invalid_event', 'End before start is rejected');
select throws_ok(
  $$ select checkin_code from public.events limit 1 $$,
  '42501', null, 'The Mode B check-in code is not readable through the API');

-- Registration ----------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select lives_ok(
  $$ select public.register_for_event((select id from public.event_feed where title = 'Swift Workshop')) $$,
  'Onboarded student can register');
select lives_ok(
  $$ select public.register_for_event((select id from public.event_feed where title = 'Swift Workshop')) $$,
  'Registering twice is harmless');
select is((select count(*)::int from public.registrations), 1, 'Still exactly one registration');
select is(
  (select registered_count from public.event_feed where title = 'Swift Workshop'), 1,
  'Feed shows the registered count');

select lives_ok(
  $$ select public.cancel_registration((select id from public.event_feed where title = 'Swift Workshop')) $$,
  'Student can cancel');
select is(
  (select registered_count from public.event_feed where title = 'Swift Workshop'), 0,
  'Cancelled registrations are not counted');
select lives_ok(
  $$ select public.register_for_event((select id from public.event_feed where title = 'Swift Workshop')) $$,
  'Student can re-register after cancelling');

-- Not-onboarded user is blocked, and cannot see others' tickets ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select throws_ok(
  $$ select public.register_for_event((select id from public.event_feed where title = 'Swift Workshop')) $$,
  '42501', 'profile_incomplete', 'Users without a complete profile cannot register');
select is((select count(*)::int from public.registrations), 0, 'RLS: other users cannot see registrations or tickets');

reset role;
select * from finish();
rollback;
