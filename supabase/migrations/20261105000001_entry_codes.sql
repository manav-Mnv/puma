-- Short entry codes: a 6-character code per ticket (shown as K7P-4QX) that an
-- organizer can read out or type fast. Unique within an event; the QR keeps the
-- long ticket_code. Alphabet skips look-alikes (0/O, 1/I/L).

create function public.new_entry_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6);
$$;

alter table public.registrations add column entry_code text;

-- Backfill existing tickets (unique per event).
do $$
declare
  r record;
  v_code text;
begin
  for r in select id, event_id from public.registrations where entry_code is null loop
    loop
      v_code := public.new_entry_code();
      exit when not exists (select 1 from public.registrations where event_id = r.event_id and entry_code = v_code);
    end loop;
    update public.registrations set entry_code = v_code where id = r.id;
  end loop;
end;
$$;

alter table public.registrations alter column entry_code set not null;
alter table public.registrations add constraint registrations_event_entry_code_key unique (event_id, entry_code);
alter table public.registrations add constraint registrations_entry_code_format
  check (entry_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$');

create function public.set_entry_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.entry_code is null then
    loop
      new.entry_code := public.new_entry_code();
      exit when not exists (
        select 1 from public.registrations where event_id = new.event_id and entry_code = new.entry_code
      );
    end loop;
  end if;
  return new;
end;
$$;

create trigger registrations_set_entry_code before insert on public.registrations
for each row execute function public.set_entry_code();

revoke all on function public.new_entry_code() from public, anon, authenticated;
revoke all on function public.set_entry_code() from public, anon, authenticated;

-- Mode A accepts either the QR (long ticket code) or the typed short entry code.
create or replace function public.check_in_by_ticket(p_event_id uuid, p_ticket_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events;
  v_registration public.registrations;
  v_profile public.profiles;
  v_attendance_id uuid;
  v_raw text := regexp_replace(coalesce(p_ticket_code, ''), '^edge:ticket:', '', 'i');
  v_code text := lower(v_raw);
  v_entry text := upper(regexp_replace(v_raw, '[\s-]', '', 'g'));
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not public.is_event_organizer(p_event_id) then
    raise exception 'not_event_organizer' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'event_not_open' using errcode = '22023';
  end if;
  if v_event.status not in ('published', 'completed')
     or now() < v_event.starts_at - interval '2 hours'
     or now() > v_event.ends_at + interval '2 hours' then
    raise exception 'checkin_closed' using errcode = '22023';
  end if;

  if v_entry ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$' then
    select * into v_registration from public.registrations
    where event_id = p_event_id and entry_code = v_entry;
  else
    select * into v_registration from public.registrations where ticket_code = v_code;
  end if;
  if not found then
    raise exception 'ticket_not_found' using errcode = 'P0002';
  end if;
  if v_registration.event_id <> p_event_id then
    raise exception 'wrong_event' using errcode = '22023';
  end if;
  if v_registration.status <> 'registered' then
    raise exception 'registration_cancelled' using errcode = '22023';
  end if;

  insert into public.attendance (registration_id, mode, scanned_by)
  values (v_registration.id, 'scan', v_uid)
  on conflict (registration_id) do nothing
  returning id into v_attendance_id;

  select * into v_profile from public.profiles where id = v_registration.user_id;

  return jsonb_build_object(
    'status', case when v_attendance_id is null then 'already' else 'ok' end,
    'full_name', v_profile.full_name,
    'student_id', coalesce(v_profile.student_id, v_profile.staff_mis_id),
    'verification_status', v_profile.verification_status,
    'avatar_url', v_profile.avatar_url
  );
end;
$$;
