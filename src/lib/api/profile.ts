import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/api/database.types';
import { useSession } from '@/lib/api/session';
import { supabase } from '@/lib/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Institute = Database['public']['Tables']['institutes']['Row'];

export type OnboardingInput = {
  full_name: string;
  student_id: string;
  institute_id: number;
  institute_other?: string;
  course: string;
  year: number;
  semester: number;
  phone: string;
  personal_email?: string;
  gender: Database['public']['Enums']['gender'];
  residence: Database['public']['Enums']['residence'];
  consent: boolean;
};

export function useMyProfile() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    // A missing row returns null (→ onboarding, which recreates it) instead of
    // erroring and retrying, which used to leave the app on a blank screen.
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useInstitutes() {
  return useQuery({
    queryKey: ['institutes'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('institutes').select('*').order('is_other').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: OnboardingInput) => {
      const { data, error } = await supabase.rpc('complete_onboarding', { p: input });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (profile) => queryClient.setQueryData(['profile', profile.id], profile),
  });
}
