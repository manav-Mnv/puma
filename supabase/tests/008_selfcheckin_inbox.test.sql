-- Day 8: Mode B self check-in + notifications.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'prof@paruluniversity.ac.in', now(), '{"name":"Prof"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'asha@paruluniversity.ac.in', now(), '{"name":"Asha"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'ravi@gmail.com', now(), '{"name":"Ravi"}');
update public.profiles set role = 'faculty' where id = '00000000-0000-0000-0000-0000000000f1';
insert into public.events (id, title, venue, starts_at, ends_at, creator_id, creator_role, status, is_verified, checkin_code)
values ('00000000-0000-0000-0000-0000000000e1', 'Live Talk', 'Hall 1', now() - interval '10 minutes',
        now() + interval '1 hour', '00000000-0000-0000-0000-0000000000f1', 'faculty', 'published', true, 'screencode');
insert into public.registrations (event_id, user_id)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1');

select is((select count(*)::int from public.notifications where user_id = '00000000-0000-0000-0000-0000000000b1'
             and kind = 'registered'), 1, 'Registering creates a notification');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select throws_ok($$ select public.get_checkin_code('00000000-0000-0000-0000-0000000000e1') $$,
  '42501', 'not_event_organizer', 'Students cannot read the screen code');
select throws_ok($$ select public.self_check_in('00000000-0000-0000-0000-0000000000e1', 'wrong') $$,
  '22023', 'invalid_checkin_code', 'Wrong code is rejected');
select is(public.self_check_in('00000000-0000-0000-0000-0000000000e1', 'SCREENCODE') ->> 'status', 'ok',
  'Registered student checks in by scanning the screen');
select is(public.self_check_in('00000000-0000-0000-0000-0000000000e1', 'screencode') ->> 'status', 'already',
  'Second scan is harmless');
select is((select count(*)::int from public.notifications), 1, 'Student sees only their own notifications');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select throws_ok($$ select public.self_check_in('00000000-0000-0000-0000-0000000000e1', 'screencode') $$,
  'P0002', 'not_registered', 'Unregistered students cannot self check in');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}';
select isnt(public.get_checkin_code('00000000-0000-0000-0000-0000000000e1', true), 'screencode',
  'Organizer can rotate the code');
select lives_ok($$ select public.complete_event('00000000-0000-0000-0000-0000000000e1') $$, 'Complete issues certificates');

reset role;
select is((select count(*)::int from public.notifications where user_id = '00000000-0000-0000-0000-0000000000b1'
             and kind = 'certificate'), 1, 'Certificate creates a notification');

select * from finish();
rollback;
