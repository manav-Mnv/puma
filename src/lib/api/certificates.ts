import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/lib/api/session';
import { supabase } from '@/lib/supabase';

export type CertificateSnapshot = {
  student_name: string | null;
  student_id: string | null;
  verification_status: 'verified' | 'unverified';
  event_title: string;
  event_starts_at: string;
  venue: string;
  issuer: string;
};

export type Certificate = {
  id: string;
  serial: string;
  issued_at: string;
  snapshot: CertificateSnapshot;
};

export type Verification =
  | { valid: false }
  | {
      valid: true;
      serial: string;
      student_name: string | null;
      event_title: string;
      event_starts_at: string;
      issuer: string;
      issued_at: string;
    };

export function useMyCertificates() {
  const { session } = useSession();
  return useQuery({
    queryKey: ['certificates', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, serial, issued_at, snapshot')
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Certificate[];
    },
  });
}

export function useMyCertificate(serial: string | undefined) {
  const { session } = useSession();
  return useQuery({
    queryKey: ['certificate', serial, session?.user.id],
    enabled: !!serial && !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, serial, issued_at, snapshot')
        .eq('serial', serial!.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Certificate | null;
    },
  });
}

export function useVerifyCertificate(serial: string | undefined) {
  return useQuery({
    queryKey: ['verify', serial],
    enabled: !!serial,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('verify_certificate', { p_serial: serial! });
      if (error) throw new Error(error.message);
      return data as unknown as Verification;
    },
  });
}

export function useCompleteEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('complete_event', { p_event_id: eventId });
      if (error) throw new Error(error.message);
      return data as unknown as { issued: number; total: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
