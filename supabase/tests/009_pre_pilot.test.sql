-- Pre-pilot: staff onboarding, edit/cancel + critical alerts, roster, reminders.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'prof@paruluniversity.ac.in', now(), '{"name":"Prof Mehta"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'asha@paruluniversity.ac.in', now(), '{"name":"Asha"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'ravi@gmail.com', now(), '{"name":"Ravi"}');

set local role authenticated;

-- Staff onboarding (verified Parul email)
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}';
select lives_ok($$ select public.complete_onboarding(jsonb_build_object(
  'kind','staff','full_name','Prof Mehta','staff_mis_id','pu-1234','designation','Assistant Professor',
  'institute_id',1,'phone','9876543210','personal_email','mehta@gmail.com','gender','male','consent',true)) $$,
  'Faculty completes the staff form without a student ID');
select is((select staff_mis_id || '/' || is_staff::text from public.profiles), 'PU-1234/true', 'MIS ID stored');

-- Unverified user cannot use the staff form
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select throws_ok($$ select public.complete_onboarding(jsonb_build_object(
  'kind','staff','full_name','Ravi','staff_mis_id','X99','designation','Lab Assistant',
  'institute_id',1,'phone','9876543210','gender','male','consent',true)) $$,
  '22023', 'staff_requires_parul_email', 'Staff form needs a verified Parul email');

reset role;
update public.profiles set role = 'faculty' where id = '00000000-0000-0000-0000-0000000000f1';
insert into public.events (id, title, venue, starts_at, ends_at, creator_id, creator_role, status, is_verified)
values ('00000000-0000-0000-0000-0000000000e1', 'Swift Workshop', 'Hall 1', now() + interval '1 hour',
        now() + interval '3 hours', '00000000-0000-0000-0000-0000000000f1', 'faculty', 'published', true);
insert into public.registrations (event_id, user_id)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1');

-- Reminders: once per event
select is(public.send_event_reminders(), 1, 'Reminder sent for the event starting within 2 hours');
select is(public.send_event_reminders(), 0, 'Reminders are not repeated');
select is((select count(*)::int from public.notifications where kind = 'reminder'), 1, 'Registrant got one reminder');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select throws_ok($$ select public.cancel_event('00000000-0000-0000-0000-0000000000e1') $$,
  '42501', 'not_event_organizer', 'Students cannot cancel events');
select throws_ok($$ select * from public.event_roster('00000000-0000-0000-0000-0000000000e1') $$,
  '42501', 'not_event_organizer', 'Students cannot download the roster');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}';
select is((select count(*)::int from public.event_roster('00000000-0000-0000-0000-0000000000e1')), 1,
  'Organizer gets the roster');
select is((select verification_status from public.event_roster('00000000-0000-0000-0000-0000000000e1')), 'verified',
  'Roster flags verification');
select lives_ok($$ select public.update_event('00000000-0000-0000-0000-0000000000e1', jsonb_build_object(
  'title','Swift Workshop','venue','Seminar Hall 2','starts_at', now() + interval '1 hour',
  'ends_at', now() + interval '3 hours')) $$, 'Organizer moves the venue');
select lives_ok($$ select public.cancel_event('00000000-0000-0000-0000-0000000000e1') $$, 'Organizer cancels');

reset role;
select is((select count(*)::int from public.notifications where kind = 'event_changed' and critical), 2,
  'Venue change and cancellation both alert the registrant (critical)');
select is((select status::text from public.events where id = '00000000-0000-0000-0000-0000000000e1'), 'cancelled',
  'Event is cancelled');

select * from finish();
rollback;
