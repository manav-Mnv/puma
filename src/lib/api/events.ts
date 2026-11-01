import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/api/database.types';
import { useMyProfile } from '@/lib/api/profile';
import { useSession } from '@/lib/api/session';
import { supabase } from '@/lib/supabase';

export type FeedEvent = Database['public']['Views']['event_feed']['Row'];
export type Registration = Database['public']['Tables']['registrations']['Row'];

export type CreateEventInput = {
  title: string;
  description: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  club_id?: string;
};

const EVENT_CREATOR_ROLES = ['faculty', 'ad', 'admin', 'super_admin'] as const;

/** Upcoming and ongoing published events, soonest first, optionally filtered by text. */
export function useEvents(search: string) {
  const term = search.trim();
  return useQuery({
    queryKey: ['events', term],
    queryFn: async () => {
      let query = supabase
        .from('event_feed')
        .select('*')
        .eq('status', 'published')
        .gte('ends_at', new Date().toISOString())
        .order('starts_at')
        .limit(50);
      if (term) {
        const like = `%${term.replace(/[%_,()]/g, ' ')}%`;
        query = query.or(`title.ilike.${like},venue.ilike.${like},organizer_name.ilike.${like}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('event_feed').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyRegistration(eventId: string | undefined) {
  const { session } = useSession();
  return useQuery({
    queryKey: ['registration', eventId, session?.user.id],
    enabled: !!eventId && !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidateEvent() {
  const queryClient = useQueryClient();
  return (registration: Registration) => {
    queryClient.setQueryData(['registration', registration.event_id, registration.user_id], registration);
    queryClient.invalidateQueries({ queryKey: ['event', registration.event_id] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };
}

export function useRegister() {
  const onSuccess = useInvalidateEvent();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.rpc('register_for_event', { p_event_id: eventId });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess,
  });
}

export function useCancelRegistration() {
  const onSuccess = useInvalidateEvent();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.rpc('cancel_registration', { p_event_id: eventId });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess,
  });
}

export function useCanCreateEvents() {
  const role = useMyProfile().data?.role;
  return !!role && (EVENT_CREATOR_ROLES as readonly string[]).includes(role);
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const { data, error } = await supabase.rpc('create_event', { p: input });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}
