import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/api/database.types';
import type { FeedEvent } from '@/lib/api/events';
import { useMyProfile } from '@/lib/api/profile';
import { useSession } from '@/lib/api/session';
import { supabase } from '@/lib/supabase';

export type Club = Database['public']['Tables']['clubs']['Row'];
export type QueueItem = Database['public']['Functions']['review_queue']['Returns'][number];
type Role = Database['public']['Enums']['app_role'];

const STAFF: Role[] = ['faculty', 'club_lead', 'ad', 'admin', 'super_admin'];

/** What the current user may see in the Manage portal. */
export function usePortalAccess() {
  const role = useMyProfile().data?.role;
  return {
    role,
    isStaff: !!role && STAFF.includes(role),
    canCreateDirect: !!role && ['faculty', 'ad', 'admin', 'super_admin'].includes(role),
    isClubLead: role === 'club_lead',
    isReviewer: !!role && ['ad', 'admin', 'super_admin'].includes(role),
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
  };
}

function rpcError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Events I created, in every status (pending / rejected included). */
export function useMyEvents() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['my-events', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_feed')
        .select('*')
        .eq('creator_id', userId!)
        .order('starts_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as FeedEvent[];
    },
  });
}

export function useClubs() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['clubs', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [clubs, memberships] = await Promise.all([
        supabase.from('clubs').select('*').order('name'),
        supabase.from('club_members').select('club_id'),
      ]);
      if (clubs.error) throw clubs.error;
      if (memberships.error) throw memberships.error;
      const joined = new Set(memberships.data.map((m) => m.club_id));
      return clubs.data.map((club) => ({ ...club, joined: joined.has(club.id), isMine: club.lead_id === userId }));
    },
  });
}

export function useMyApprovedClubs() {
  const clubs = useClubs();
  return (clubs.data ?? []).filter((c) => c.isMine && c.status === 'approved');
}

export function useRequestClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data, error } = await supabase.rpc('request_club', { p_name: name, p_description: description });
      rpcError(error);
      return data!;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubs'] }),
  });
}

export function useToggleMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, join }: { clubId: string; join: boolean }) => {
      const { error } = join
        ? await supabase.rpc('join_club', { p_club_id: clubId })
        : await supabase.rpc('leave_club', { p_club_id: clubId });
      rpcError(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubs'] }),
  });
}

export function useReviewQueue(enabled: boolean) {
  return useQuery({
    queryKey: ['review-queue'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('review_queue');
      rpcError(error);
      return data ?? [];
    },
  });
}

export function useDecide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { kind: string; id: string; approve: boolean; remarks?: string }) => {
      const { error } = await supabase.rpc('decide_request', {
        p_kind: args.kind,
        p_id: args.id,
        p_approve: args.approve,
        p_remarks: args.remarks ?? '',
      });
      rpcError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export type PlatformStats = Record<
  'users' | 'verified' | 'onboarded' | 'staff' | 'clubs' | 'pending' | 'events' | 'registrations' | 'checkins' | 'certificates',
  number
>;

export function usePlatformStats(enabled: boolean) {
  return useQuery({
    queryKey: ['platform-stats'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('platform_stats');
      rpcError(error);
      return data as unknown as PlatformStats;
    },
  });
}

/**
 * T17: send a confirmation to the student's Parul mailbox. Once they confirm,
 * the database marks them Verified and swaps a temporary ID for the enrollment
 * number in the mailbox name (e.g. 2503031461401@paruluniversity.ac.in).
 */
export function useLinkParulEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      const clean = email.trim().toLowerCase();
      if (!/^[^@\s]+@paruluniversity\.ac\.in$/.test(clean)) throw new Error('not_parul_email');
      const { error } = await supabase.auth.updateUser({ email: clean });
      if (error) throw error;
    },
  });
}
