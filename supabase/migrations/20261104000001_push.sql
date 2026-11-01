-- T14: push notifications. Phones register an Expo push token; every inbox
-- notification is also sent to the user's phones via the Expo Push API (which
-- delivers through FCM on Android / APNs on iOS). Uses pg_net, so no extra server.

-- A user keeps at most 5 devices; newest first.
create function public.register_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$' then
    raise exception 'invalid_push_token' using errcode = '22023';
  end if;
  -- One device belongs to one account: remove it from anyone else first.
  update public.profiles
  set push_tokens = push_tokens - p_token
  where push_tokens ? p_token and id <> auth.uid();
  update public.profiles
  set push_tokens = (
    select coalesce(jsonb_agg(t), '[]'::jsonb)
    from (
      select t from jsonb_array_elements_text(jsonb_build_array(p_token) || (push_tokens - p_token)) t
      limit 5
    ) s
  )
  where id = auth.uid();
end;
$$;

create function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set push_tokens = push_tokens - p_token where id = auth.uid();
$$;

revoke all on function public.register_push_token(text) from public, anon;
grant execute on function public.register_push_token(text) to authenticated;
revoke all on function public.unregister_push_token(text) from public, anon;
grant execute on function public.unregister_push_token(text) to authenticated;

do $$
begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_net not available: push sending disabled (%).', sqlerrm;
end;
$$;

-- Fire-and-forget: a failed push never blocks the in-app notification.
create function public.push_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_messages jsonb;
begin
  select jsonb_agg(jsonb_build_object(
           'to', t,
           'title', new.title,
           'body', new.body,
           'sound', 'default',
           'priority', case when new.critical then 'high' else 'default' end,
           'channelId', 'default',
           'data', jsonb_build_object('link', new.link, 'kind', new.kind)
         ))
  into v_messages
  from public.profiles p, jsonb_array_elements_text(p.push_tokens) t
  where p.id = new.user_id;

  if v_messages is not null then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := v_messages,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json')
    );
  end if;
  return new;
exception when others then
  raise warning 'push send skipped: %', sqlerrm;
  return new;
end;
$$;

revoke all on function public.push_notification() from public, anon, authenticated;

create trigger notifications_push after insert on public.notifications
for each row execute function public.push_notification();
