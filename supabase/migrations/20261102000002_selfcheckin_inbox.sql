-- Day 8 (T13, T14): Mode B self check-in and the in-app notification inbox.

-- ---------------------------------------------------------------------------
-- Mode B: organizer shows one QR on a screen; students scan it with their phone.
-- Same UNIQUE(registration_id) guard as Mode A, so either mode, any device: one row.
-- ---------------------------------------------------------------------------
create function public.get_checkin_code(p_event_id uuid, p_rotate boolean default false)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'not_event_organizer' using errcode = '42501';
  end if;
  if p_rotate then
    -- If a photo of the screen QR is shared, the organizer issues a new code.
    update public.events set checkin_code = replace(gen_random_uuid()::text, '-', '')
    where id = p_event_id returning checkin_code into v_code;
  else
    select checkin_code into v_code from public.events where id = p_event_id;
  end if;
  return v_code;
end;
$$;

create function public.self_check_in(p_event_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events;
  v_registration public.registrations;
  v_attendance_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_event from public.events where id = p_event_id;
  if not found or v_event.checkin_code <> lower(trim(coalesce(p_code, ''))) then
    raise exception 'invalid_checkin_code' using errcode = '22023';
  end if;
  if v_event.status not in ('published', 'completed')
     or now() < v_event.starts_at - interval '2 hours'
     or now() > v_event.ends_at + interval '2 hours' then
    raise exception 'checkin_closed' using errcode = '22023';
  end if;

  select * into v_registration from public.registrations
  where event_id = p_event_id and user_id = v_uid and status = 'registered';
  if not found then
    raise exception 'not_registered' using errcode = 'P0002';
  end if;

  insert into public.attendance (registration_id, mode)
  values (v_registration.id, 'self')
  on conflict (registration_id) do nothing
  returning id into v_attendance_id;

  return jsonb_build_object(
    'status', case when v_attendance_id is null then 'already' else 'ok' end,
    'event_title', v_event.title
  );
end;
$$;

revoke all on function public.get_checkin_code(uuid, boolean) from public, anon;
grant execute on function public.get_checkin_code(uuid, boolean) to authenticated;
revoke all on function public.self_check_in(uuid, text) from public, anon;
grant execute on function public.self_check_in(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications (SRS §6): the in-app inbox is the source of truth; push later
-- reads from it. Rows are written only by triggers.
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text,
  critical boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

create function public.notify(p_user_id uuid, p_kind text, p_title text, p_body text, p_link text, p_critical boolean default false)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, title, body, link, critical)
  values (p_user_id, p_kind, p_title, p_body, p_link, p_critical);
$$;
revoke all on function public.notify(uuid, text, text, text, text, boolean) from public, anon, authenticated;

create function public.notify_on_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'registered' and (tg_op = 'INSERT' or old.status <> 'registered') then
    perform public.notify(new.user_id, 'registered', 'You’re in!',
      (select 'Your ticket for ' || title || ' is in Tickets.' from public.events where id = new.event_id),
      '/tickets');
  end if;
  return new;
end;
$$;
create trigger registrations_notify after insert or update of status on public.registrations
for each row execute function public.notify_on_registration();

create function public.notify_on_certificate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify(r.user_id, 'certificate', 'Certificate ready',
    'Your certificate for ' || (new.snapshot ->> 'event_title') || ' is ready.',
    '/certificates/' || new.serial)
  from public.attendance a join public.registrations r on r.id = a.registration_id
  where a.id = new.attendance_id;
  return new;
end;
$$;
create trigger certificates_notify after insert on public.certificates
for each row execute function public.notify_on_certificate();

-- Decisions on club events, and critical changes (cancelled / time or venue moved).
create function public.notify_on_event_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'pending' and new.status in ('published', 'rejected') then
    perform public.notify(new.creator_id, 'decision',
      case when new.status = 'published' then 'Event approved' else 'Event not approved' end,
      new.title || coalesce(': ' || new.remarks, ''), '/event/' || new.id);
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled'
     or new.starts_at <> old.starts_at or new.venue <> old.venue then
    perform public.notify(r.user_id, 'event_changed',
      case when new.status = 'cancelled' then 'Event cancelled' else 'Event updated' end,
      new.title || ' · ' || new.venue, '/event/' || new.id, true)
    from public.registrations r where r.event_id = new.id and r.status = 'registered';
  end if;
  return new;
end;
$$;
create trigger events_notify after update on public.events
for each row execute function public.notify_on_event_change();

create function public.notify_on_club_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    perform public.notify(new.lead_id, 'decision',
      case when new.status = 'approved' then 'Club approved — you’re the Club Lead' else 'Club not approved' end,
      new.name || coalesce(': ' || new.remarks, ''), '/clubs');
  end if;
  return new;
end;
$$;
create trigger clubs_notify after update on public.clubs
for each row execute function public.notify_on_club_decision();

create function public.mark_notifications_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant all on public.notifications to service_role;
revoke all on function public.mark_notifications_read() from public, anon;
grant execute on function public.mark_notifications_read() to authenticated;
revoke all on function public.notify_on_registration() from public, anon, authenticated;
revoke all on function public.notify_on_certificate() from public, anon, authenticated;
revoke all on function public.notify_on_event_change() from public, anon, authenticated;
revoke all on function public.notify_on_club_decision() from public, anon, authenticated;

alter table public.notifications enable row level security;
create policy "users read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
