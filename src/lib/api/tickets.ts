import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { FeedEvent } from '@/lib/api/events';
import { useSession } from '@/lib/api/session';
import { supabase } from '@/lib/supabase';

export type Ticket = {
  registrationId: string;
  ticketCode: string;
  checkedInAt: string | null;
  event: FeedEvent;
};

export type ScanResult = {
  status: 'ok' | 'already';
  full_name: string | null;
  student_id: string | null;
  verification_status: 'verified' | 'unverified';
  avatar_url: string | null;
};

/** QR payload. The prefix lets the scanner ignore unrelated QR codes. */
export function ticketQrValue(ticketCode: string) {
  return `edge:ticket:${ticketCode}`;
}

const cacheKey = (userId: string) => `edge.tickets.${userId}`;

async function fetchTickets(): Promise<Ticket[]> {
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('id, event_id, ticket_code')
    .eq('status', 'registered');
  if (error) throw error;
  if (!registrations.length) return [];

  const ids = registrations.map((r) => r.id);
  const eventIds = registrations.map((r) => r.event_id);
  const [events, attendance] = await Promise.all([
    supabase.from('event_feed').select('*').in('id', eventIds),
    supabase.from('attendance').select('registration_id, checked_in_at').in('registration_id', ids),
  ]);
  if (events.error) throw events.error;
  if (attendance.error) throw attendance.error;

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return registrations
    .map((r) => ({
      registrationId: r.id,
      ticketCode: r.ticket_code,
      checkedInAt: attendance.data.find((a) => a.registration_id === r.id)?.checked_in_at ?? null,
      event: events.data.find((e) => e.id === r.event_id)!,
    }))
    .filter((t) => t.event?.ends_at && new Date(t.event.ends_at).getTime() > cutoff)
    .sort((a, b) => a.event.starts_at!.localeCompare(b.event.starts_at!));
}

/**
 * My upcoming tickets. Saved on the device after every successful load so the QR
 * still opens with no network at the venue (NFR-2).
 */
export function useMyTickets() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['tickets', userId],
    enabled: !!userId,
    queryFn: async () => {
      try {
        const tickets = await fetchTickets();
        await AsyncStorage.setItem(cacheKey(userId!), JSON.stringify(tickets)).catch(() => {});
        return { tickets, offline: false };
      } catch (error) {
        const cached = await AsyncStorage.getItem(cacheKey(userId!)).catch(() => null);
        if (cached) return { tickets: JSON.parse(cached) as Ticket[], offline: true };
        throw error;
      }
    },
  });
}

export function useIsEventOrganizer(eventId: string | undefined) {
  const { session } = useSession();
  return useQuery({
    queryKey: ['organizer', eventId, session?.user.id],
    enabled: !!eventId && !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_event_organizer', { p_event_id: eventId! });
      if (error) throw error;
      return data;
    },
  });
}

export function useCheckedInCount(eventId: string) {
  return useQuery({
    queryKey: ['checked-in', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('event_checked_in_count', { p_event_id: eventId });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useCheckIn(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketCode: string) => {
      const { data, error } = await supabase.rpc('check_in_by_ticket', {
        p_event_id: eventId,
        p_ticket_code: ticketCode,
      });
      if (error) throw new Error(error.message);
      return data as unknown as ScanResult;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checked-in', eventId] }),
  });
}
