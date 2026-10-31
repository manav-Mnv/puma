import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/api/database.types';
import { useMyProfile } from '@/lib/api/profile';
import { supabase } from '@/lib/supabase';

export type AppRole = Database['public']['Enums']['app_role'];
export type AdminProfile = Database['public']['Functions']['admin_find_profiles']['Returns'][number];

export function useIsAdmin() {
  const role = useMyProfile().data?.role;
  return role === 'admin' || role === 'super_admin';
}

export function useAdminFindProfiles(query: string) {
  const term = query.trim();
  return useQuery({
    queryKey: ['admin-profiles', term],
    enabled: term.length >= 3,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_find_profiles', { p_query: term });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useSetRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data, error } = await supabase.rpc('set_role', { p_user_id: userId, p_role: role });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-profiles'] }),
  });
}
