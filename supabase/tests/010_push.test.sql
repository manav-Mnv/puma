-- T14: push token registration rules; notifications still insert with tokens present.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000b1', 'asha@paruluniversity.ac.in', now(), '{"name":"Asha"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'ravi@gmail.com', now(), '{"name":"Ravi"}');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';

select throws_ok($$ select public.register_push_token('not-a-token') $$, '22023', 'invalid_push_token',
  'Only Expo push tokens are accepted');
select lives_ok($$ select public.register_push_token('ExponentPushToken[abc123]') $$, 'Registers a device');
select lives_ok($$ select public.register_push_token('ExponentPushToken[abc123]') $$, 'Re-registering is harmless');
select is((select jsonb_array_length(push_tokens) from public.profiles), 1, 'No duplicate tokens');

-- Same phone signs in to another account: the token moves
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select lives_ok($$ select public.register_push_token('ExponentPushToken[abc123]') $$, 'Device moves to the new account');

reset role;
select is((select jsonb_array_length(push_tokens) from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'), 0,
  'Previous account no longer receives that device''s pushes');

select * from finish();
rollback;
