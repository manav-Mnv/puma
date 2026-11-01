-- Day 7: clubs, Club Lead event approval, review queue, admin rules, enrollment upgrade.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000b1', 'fresher@gmail.com', now(), '{"name":"Fresher"}'),
  ('00000000-0000-0000-0000-0000000000ad', 'ad@paruluniversity.ac.in', now(), '{"name":"AD"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'admin@paruluniversity.ac.in', now(), '{"name":"Admin"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'admin2@paruluniversity.ac.in', now(), '{"name":"Admin Two"}'),
  ('00000000-0000-0000-0000-0000000000e9', '2503031461401@paruluniversity.ac.in', now(), '{"name":"Enrolled"}');
update public.profiles set role = 'ad' where id = '00000000-0000-0000-0000-0000000000ad';
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles
set student_id = '25UG024310', institute_id = 1, course = 'B.Tech', year = 1, semester = 1,
    phone = '9876543210', gender = 'male', residence = 'hosteller', consent_at = now(), onboarded_at = now()
where id = '00000000-0000-0000-0000-0000000000b1';

-- Enrollment-number mailbox prefills the student ID at sign-up
select is((select student_id from public.profiles where id = '00000000-0000-0000-0000-0000000000e9'),
  '2503031461401', 'Parul mailbox named after the enrollment number prefills the ID');

-- T17: fresher links their Parul enrollment mailbox → ID replaced, verified
update auth.users set email = '2503031461402@paruluniversity.ac.in', email_confirmed_at = now()
where id = '00000000-0000-0000-0000-0000000000b1';
select is((select student_id || '/' || verification_status from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'),
  '2503031461402/verified', 'Linking the Parul email swaps temporary ID for enrollment and verifies');

set local role authenticated;

-- Student requests a club; not a reviewer
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select lives_ok($$ select public.request_club('Swift Coding Club', 'iOS dev at Parul') $$, 'Student can request a club');
select throws_ok($$ select public.request_club('Swift Coding Club', 'dup') $$, '23505', 'club_name_taken', 'Club names are unique');
select throws_ok($$ select * from public.review_queue() $$, '42501', 'not_reviewer', 'Students cannot see the review queue');
select throws_ok($$ select public.create_event(jsonb_build_object('title','Meetup','venue','Lab 1',
  'starts_at', now() + interval '1 day', 'ends_at', now() + interval '1 day 2 hours',
  'club_id', (select id from public.clubs limit 1))) $$, '42501', 'not_club_lead', 'Pending club cannot host events');

-- AD reviews: rejection needs remarks; approval makes the requester Club Lead
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ad","role":"authenticated"}';
select is((select count(*)::int from public.review_queue()), 1, 'AD sees the pending club');
select throws_ok($$ select public.decide_request('club', (select id from public.clubs limit 1), false, '') $$,
  '22023', 'remarks_required', 'Rejecting needs remarks');
select lives_ok($$ select public.decide_request('club', (select id from public.clubs limit 1), true) $$, 'AD approves the club');

-- Club Lead submits an event → pending, unverified
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'), 'club_lead',
  'Requester becomes Club Lead');
select is((public.create_event(jsonb_build_object('title','Swift Meetup','venue','Lab 1',
  'starts_at', now() + interval '1 day', 'ends_at', now() + interval '1 day 2 hours',
  'club_id', (select id from public.clubs limit 1)))).status::text, 'pending', 'Club event waits for approval');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ad","role":"authenticated"}';
select lives_ok($$ select public.decide_request('event', (select id from public.review_queue() limit 1), true) $$,
  'AD approves the club event');
select is((select status::text || '/' || is_verified::text from public.event_feed where title = 'Swift Meetup'),
  'published/true', 'Approved club event is published and verified');

-- Only Super Admin creates Admins; Admins cannot demote each other
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select throws_ok($$ select public.set_role('00000000-0000-0000-0000-0000000000a2', 'admin') $$,
  '42501', 'not_allowed_to_set_role', 'Admins cannot create Admins');
select throws_ok($$ select public.platform_stats() $$, '42501', 'not_super_admin', 'Stats are Super Admin only');

reset role;
update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-0000000000a2';
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}';
select is((public.platform_stats() ->> 'clubs')::int, 1, 'Super Admin sees platform stats');

reset role;
select * from finish();
rollback;
