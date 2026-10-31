-- T06/T07 — Mode A check-in rules, duplicate guard, organizer-only access, admin search.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'prof@paruluniversity.ac.in', now(), '{"full_name":"Prof. Mehta"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'prof2@paruluniversity.ac.in', now(), '{"full_name":"Prof. Rao"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'stud@paruluniversity.ac.in', now(), '{"full_name":"Asha Patel"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'admin@paruluniversity.ac.in', now(), '{"full_name":"Admin"}');

update public.profiles set role = 'faculty'
  where id in ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles
set student_id = '25UG000001', institute_id = 1, course = 'B.Tech', year = 1, semester = 1,
    phone = '9876543210', gender = 'female', residence = 'hosteller', personal_email = 'asha@gmail.com',
    consent_at = now(), onboarded_at = now()
where id = '00000000-0000-0000-0000-0000000000b1';

-- Live event (started 30 min ago), a future event, and the student's tickets
insert into public.events (id, title, venue, starts_at, ends_at, creator_id, creator_role, status, is_verified)
values
  ('00000000-0000-0000-0000-0000000000e1', 'Live Talk', 'Hall 1', now() - interval '30 minutes',
   now() + interval '1 hour', '00000000-0000-0000-0000-0000000000f1', 'faculty', 'published', true),
  ('00000000-0000-0000-0000-0000000000e2', 'Next Week', 'Hall 2', now() + interval '7 days',
   now() + interval '7 days 2 hours', '00000000-0000-0000-0000-0000000000f1', 'faculty', 'published', true);
insert into public.registrations (event_id, user_id, ticket_code) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1', 'ticketlive'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000b1', 'ticketnext');

set local role authenticated;

-- Organizer scans -------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}';
select is(
  public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', 'edge:ticket:TICKETLIVE') ->> 'status',
  'ok', 'First scan checks the student in (prefix and case tolerated)');
select is(
  public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', 'ticketlive') ->> 'status',
  'already', 'Second scan says already checked in');
select is(
  public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', 'ticketlive') ->> 'full_name',
  'Asha Patel', 'Scan returns the student name for visual confirmation');
select is((select count(*)::int from public.attendance), 0,
  'Organizer cannot read the attendance table directly');
select is(public.event_checked_in_count('00000000-0000-0000-0000-0000000000e1'), 1,
  'Exactly one attendance row; organizer sees the live count');
select throws_ok(
  $$ select public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', 'ticketnext') $$,
  '22023', 'wrong_event', 'Ticket for another event is rejected');
select throws_ok(
  $$ select public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e2', 'ticketnext') $$,
  '22023', 'checkin_closed', 'Check-in is closed outside the event window');
select throws_ok(
  $$ select public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', 'nope') $$,
  'P0002', 'ticket_not_found', 'Unknown ticket is rejected');

-- Another faculty member is not the organizer --------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated"}';
select throws_ok(
  $$ select public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', 'ticketlive') $$,
  '42501', 'not_event_organizer', 'Only the event organizer can scan');

-- Student --------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select throws_ok(
  $$ select public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', 'ticketlive') $$,
  '42501', 'not_event_organizer', 'Students cannot check themselves in by ticket');
select is((select count(*)::int from public.attendance), 1, 'Student sees their own check-in');
select throws_ok($$ select * from public.admin_find_profiles('asha') $$,
  '42501', 'not_allowed_to_set_role', 'Students cannot search profiles');

-- Admin ----------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select is((select count(*)::int from public.admin_find_profiles('25ug000001')), 1,
  'Admin finds a student by student ID');
select is((select count(*)::int from public.admin_find_profiles('as')), 0,
  'Search needs at least 3 characters');
select is(
  public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', 'ticketlive') ->> 'status',
  'already', 'Admin can scan any event');

reset role;
select * from finish();
rollback;
