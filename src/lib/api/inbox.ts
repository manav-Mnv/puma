import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/lib/api/session';
import { supabase } from '@/lib/supabase';

export function useNotifications() {
  const { session } = useSession();
  return useQuery({
    queryKey: ['notifications', session?.user.id],
    enabled: !!session,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export function useUnreadCount() {
  return (useNotifications().data ?? []).filter((n) => !n.read_at).length;
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_notifications_read');
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
