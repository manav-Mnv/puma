-- T08/T09 — Event completion and certificates (SRS §5 complete_event, verify_certificate; PRD §11).
-- Certificates are rows, not files: the PDF is rendered on demand from `snapshot`.

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null unique references public.attendance (id) on delete cascade,
  -- Human-readable, unguessable serial printed on the certificate and used by /verify.
  serial text not null unique
    default 'EDGE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  issued_at timestamptz not null default now(),
  reissue_reason text,
  -- Frozen at issue time so later profile edits don't silently change a certificate.
  snapshot jsonb not null
);

create index certificates_issued_at_idx on public.certificates (issued_at);

-- ---------------------------------------------------------------------------
-- complete_event: organizer marks the event finished; every checked-in attendee
-- gets a certificate. Idempotent: running it again only fills gaps.
-- ---------------------------------------------------------------------------
create function public.complete_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events;
  v_issued int;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not public.is_event_organizer(p_event_id) then
    raise exception 'not_event_organizer' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status not in ('published', 'completed') then
    raise exception 'event_not_open' using errcode = '22023';
  end if;
  if now() < v_event.starts_at then
    raise exception 'event_not_started' using errcode = '22023';
  end if;

  if v_event.status = 'published' then
    update public.events
    set status = 'completed', completed_at = now(), completed_by = v_uid
    where id = p_event_id;
  end if;

  insert into public.certificates (attendance_id, snapshot)
  select a.id,
         jsonb_build_object(
           'student_name', p.full_name,
           'student_id', p.student_id,
           'verification_status', p.verification_status,
           'event_title', v_event.title,
           'event_starts_at', v_event.starts_at,
           'venue', v_event.venue,
           'issuer', v_event.organizer_name
         )
  from public.attendance a
  join public.registrations r on r.id = a.registration_id
  join public.profiles p on p.id = r.user_id
  where r.event_id = p_event_id
  on conflict (attendance_id) do nothing;
  get diagnostics v_issued = row_count;

  return jsonb_build_object(
    'issued', v_issued,
    'total', (select count(*) from public.certificates c
              join public.attendance a on a.id = c.attendance_id
              join public.registrations r on r.id = a.registration_id
              where r.event_id = p_event_id)
  );
end;
$$;

-- Public verification: anyone with the serial (e.g. from the certificate QR) can
-- confirm it is genuine. Returns only what is printed on the certificate.
create function public.verify_certificate(p_serial text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object(
       'valid', true,
       'serial', c.serial,
       'student_name', c.snapshot ->> 'student_name',
       'event_title', c.snapshot ->> 'event_title',
       'event_starts_at', c.snapshot ->> 'event_starts_at',
       'issuer', c.snapshot ->> 'issuer',
       'issued_at', c.issued_at
     )
     from public.certificates c
     where c.serial = upper(trim(p_serial))),
    jsonb_build_object('valid', false)
  );
$$;

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------
revoke all on public.certificates from anon, authenticated;
grant select on public.certificates to authenticated;
grant all on public.certificates to service_role;

revoke all on function public.complete_event(uuid) from public, anon;
grant execute on function public.complete_event(uuid) to authenticated;
revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

alter table public.certificates enable row level security;

create policy "users see their own certificates"
  on public.certificates for select to authenticated
  using (exists (
    select 1 from public.attendance a
    join public.registrations r on r.id = a.registration_id
    where a.id = attendance_id and r.user_id = (select auth.uid())
  ));
