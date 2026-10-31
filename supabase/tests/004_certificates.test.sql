-- T08/T09 — complete_event issues one certificate per attendee, idempotently; public verify.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'prof@paruluniversity.ac.in', now(), '{"full_name":"Prof. Mehta"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'asha@paruluniversity.ac.in', now(), '{"full_name":"Asha Patel"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'ravi@gmail.com', now(), '{"full_name":"Ravi Shah"}');
update public.profiles set role = 'faculty' where id = '00000000-0000-0000-0000-0000000000f1';
update public.profiles set student_id = '25UG000001' where id = '00000000-0000-0000-0000-0000000000b1';

insert into public.events (id, title, venue, starts_at, ends_at, creator_id, creator_role, organizer_name, status, is_verified)
values
  ('00000000-0000-0000-0000-0000000000e1', 'Swift Workshop', 'Hall 1', now() - interval '2 hours',
   now() - interval '10 minutes', '00000000-0000-0000-0000-0000000000f1', 'faculty', 'Prof. Mehta', 'published', true),
  ('00000000-0000-0000-0000-0000000000e2', 'Future Talk', 'Hall 2', now() + interval '1 day',
   now() + interval '1 day 2 hours', '00000000-0000-0000-0000-0000000000f1', 'faculty', 'Prof. Mehta', 'published', true);
insert into public.registrations (id, event_id, user_id) values
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-00000000aa02', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b2');
-- Only Asha attended
insert into public.attendance (registration_id, mode) values ('00000000-0000-0000-0000-00000000aa01', 'scan');

set local role authenticated;

-- Student cannot complete
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select throws_ok($$ select public.complete_event('00000000-0000-0000-0000-0000000000e1') $$,
  '42501', 'not_event_organizer', 'Students cannot mark an event complete');

-- Organizer completes
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}';
select throws_ok($$ select public.complete_event('00000000-0000-0000-0000-0000000000e2') $$,
  '22023', 'event_not_started', 'An event cannot be completed before it starts');
select is(public.complete_event('00000000-0000-0000-0000-0000000000e1') ->> 'issued', '1',
  'One certificate for the one attendee');
select is(public.complete_event('00000000-0000-0000-0000-0000000000e1') ->> 'issued', '0',
  'Completing again issues no duplicates');
select is((select status::text from public.event_feed where id = '00000000-0000-0000-0000-0000000000e1'),
  'completed', 'Event is marked completed');
select is((select count(*)::int from public.certificates), 0, 'Organizer cannot read certificate rows directly');

-- Attendee sees exactly their certificate with a frozen snapshot
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select is((select count(*)::int from public.certificates), 1, 'Attendee sees their certificate');
select is((select snapshot ->> 'student_name' from public.certificates), 'Asha Patel', 'Snapshot has the name');
select matches((select serial from public.certificates), '^EDGE-[0-9A-F]{10}$', 'Serial format EDGE-XXXXXXXXXX');

-- Registered but absent student gets nothing
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select is((select count(*)::int from public.certificates), 0, 'No certificate without check-in');

-- Public verification (anon)
reset role;
create temporary table t_serial as select serial from public.certificates;
grant select on t_serial to anon;
set local role anon;
select is(public.verify_certificate(lower((select serial from t_serial))) ->> 'valid', 'true',
  'Anyone can verify a real serial (case-insensitive)');
select is(public.verify_certificate(lower((select serial from t_serial))) ->> 'student_name', 'Asha Patel',
  'Verification shows the name printed on the certificate');
select is(public.verify_certificate('EDGE-0000000000') ->> 'valid', 'false', 'Unknown serial is invalid');

reset role;
select * from finish();
rollback;
