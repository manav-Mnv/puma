// Generated shape of the Supabase schema. Regenerate with `npm run db:types`
// (local) or the Supabase MCP after each migration — do not edit by hand.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      allowed_email_domains: {
        Row: { domain: string };
        Insert: { domain: string };
        Update: { domain?: string };
        Relationships: [];
      };
      departments: {
        Row: { id: number; institute_id: number; name: string };
        Insert: { id?: never; institute_id: number; name: string };
        Update: { id?: never; institute_id?: number; name?: string };
        Relationships: [
          {
            foreignKeyName: 'departments_institute_id_fkey';
            columns: ['institute_id'];
            isOneToOne: false;
            referencedRelation: 'institutes';
            referencedColumns: ['id'];
          },
        ];
      };
      institutes: {
        Row: { id: number; is_other: boolean; name: string };
        Insert: { id?: never; is_other?: boolean; name: string };
        Update: { id?: never; is_other?: boolean; name?: string };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          consent_at: string | null;
          course: string | null;
          created_at: string;
          department_id: number | null;
          full_name: string | null;
          gender: Database['public']['Enums']['gender'] | null;
          id: string;
          institute_id: number | null;
          institute_other: string | null;
          onboarded_at: string | null;
          parul_email: string | null;
          personal_email: string | null;
          phone: string | null;
          push_tokens: Json;
          residence: Database['public']['Enums']['residence'] | null;
          role: Database['public']['Enums']['app_role'];
          semester: number | null;
          student_id: string | null;
          updated_at: string;
          verification_status: Database['public']['Enums']['verification_status'];
          year: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          consent_at?: string | null;
          course?: string | null;
          created_at?: string;
          department_id?: number | null;
          full_name?: string | null;
          gender?: Database['public']['Enums']['gender'] | null;
          id: string;
          institute_id?: number | null;
          institute_other?: string | null;
          onboarded_at?: string | null;
          parul_email?: string | null;
          personal_email?: string | null;
          phone?: string | null;
          push_tokens?: Json;
          residence?: Database['public']['Enums']['residence'] | null;
          role?: Database['public']['Enums']['app_role'];
          semester?: number | null;
          student_id?: string | null;
          updated_at?: string;
          verification_status?: Database['public']['Enums']['verification_status'];
          year?: number | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      complete_onboarding: {
        Args: { p: Json };
        Returns: Database['public']['Tables']['profiles']['Row'];
      };
    };
    Enums: {
      app_role: 'student' | 'faculty' | 'club_lead' | 'ad' | 'admin' | 'super_admin';
      gender: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';
      residence: 'hosteller' | 'day_scholar';
      verification_status: 'verified' | 'unverified';
    };
    CompositeTypes: { [_ in never]: never };
  };
};
