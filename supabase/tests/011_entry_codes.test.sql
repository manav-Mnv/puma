-- Short entry codes: generated, unique per event, usable for Mode A check-in.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'prof@paruluniversity.ac.in', now(), '{"name":"Prof"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'asha@paruluniversity.ac.in', now(), '{"name":"Asha"}');
update public.profiles set role = 'faculty' where id = '00000000-0000-0000-0000-0000000000f1';
insert into public.events (id, title, venue, starts_at, ends_at, creator_id, creator_role, status, is_verified)
values ('00000000-0000-0000-0000-0000000000e1', 'Live Talk', 'Hall 1', now() - interval '10 minutes',
        now() + interval '1 hour', '00000000-0000-0000-0000-0000000000f1', 'faculty', 'published', true);
insert into public.registrations (event_id, user_id)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1');

select matches((select entry_code from public.registrations), '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$',
  'Each ticket gets a 6-character entry code without look-alike characters');
select throws_ok($$ insert into public.registrations (event_id, user_id, entry_code)
  select event_id, '00000000-0000-0000-0000-0000000000f1', entry_code from public.registrations $$,
  '23505', null, 'Entry codes are unique within an event');

create temporary table t_entry as
  select substr(entry_code, 1, 3) || '-' || lower(substr(entry_code, 4, 3)) as typed from public.registrations;
grant select on t_entry to authenticated;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}';

select is(public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', (select typed from t_entry)) ->> 'status',
  'ok', 'Organizer checks in by typing the short code (dash and lowercase tolerated)');
select is(public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', (select typed from t_entry)) ->> 'status',
  'already', 'Second entry of the same code says already');
select throws_ok($$ select public.check_in_by_ticket('00000000-0000-0000-0000-0000000000e1', 'ZZZ-ZZZ') $$,
  'P0002', 'ticket_not_found', 'Unknown short code is rejected');

reset role;
select * from finish();
rollback;
