export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      allowed_email_domains: {
        Row: {
          domain: string
        }
        Insert: {
          domain: string
        }
        Update: {
          domain?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          id: number
          institute_id: number
          name: string
        }
        Insert: {
          id?: never
          institute_id: number
          name: string
        }
        Update: {
          id?: never
          institute_id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      institutes: {
        Row: {
          id: number
          is_other: boolean
          name: string
        }
        Insert: {
          id?: never
          is_other?: boolean
          name: string
        }
        Update: {
          id?: never
          is_other?: boolean
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consent_at: string | null
          course: string | null
          created_at: string
          department_id: number | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          institute_id: number | null
          institute_other: string | null
          onboarded_at: string | null
          parul_email: string | null
          personal_email: string | null
          phone: string | null
          push_tokens: Json
          residence: Database["public"]["Enums"]["residence"] | null
          role: Database["public"]["Enums"]["app_role"]
          semester: number | null
          student_id: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          consent_at?: string | null
          course?: string | null
          created_at?: string
          department_id?: number | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          institute_id?: number | null
          institute_other?: string | null
          onboarded_at?: string | null
          parul_email?: string | null
          personal_email?: string | null
          phone?: string | null
          push_tokens?: Json
          residence?: Database["public"]["Enums"]["residence"] | null
          role?: Database["public"]["Enums"]["app_role"]
          semester?: number | null
          student_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          consent_at?: string | null
          course?: string | null
          created_at?: string
          department_id?: number | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          institute_id?: number | null
          institute_other?: string | null
          onboarded_at?: string | null
          parul_email?: string | null
          personal_email?: string | null
          phone?: string | null
          push_tokens?: Json
          residence?: Database["public"]["Enums"]["residence"] | null
          role?: Database["public"]["Enums"]["app_role"]
          semester?: number | null
          student_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_url: string | null
          created_at: string
          creator_id: string
          creator_role: Database["public"]["Enums"]["app_role"]
          department_id: number | null
          description: string
          ends_at: string
          id: string
          is_verified: boolean
          organizer_name: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          venue: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["registration_status"]
          ticket_code: string
          updated_at: string
          user_id: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      event_feed: {
        Row: {
          cover_url: string | null
          created_at: string | null
          creator_id: string | null
          creator_role: Database["public"]["Enums"]["app_role"] | null
          department_id: number | null
          description: string | null
          ends_at: string | null
          id: string | null
          is_verified: boolean | null
          organizer_name: string | null
          registered_count: number | null
          starts_at: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          title: string | null
          venue: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_registration: {
        Args: { p_event_id: string }
        Returns: Database["public"]["Tables"]["registrations"]["Row"]
      }
      create_event: {
        Args: { p: Json }
        Returns: Database["public"]["Tables"]["events"]["Row"]
      }
      event_registered_count: { Args: { p_event_id: string }; Returns: number }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      register_for_event: {
        Args: { p_event_id: string }
        Returns: Database["public"]["Tables"]["registrations"]["Row"]
      }
      set_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: Database["public"]["Tables"]["profiles"]["Row"]
      }
      complete_onboarding: {
        Args: { p: Json }
        Returns: {
          avatar_url: string | null
          consent_at: string | null
          course: string | null
          created_at: string
          department_id: number | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          institute_id: number | null
          institute_other: string | null
          onboarded_at: string | null
          parul_email: string | null
          personal_email: string | null
          phone: string | null
          push_tokens: Json
          residence: Database["public"]["Enums"]["residence"] | null
          role: Database["public"]["Enums"]["app_role"]
          semester: number | null
          student_id: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          year: number | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_parul_email: { Args: { p_email: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "student"
        | "faculty"
        | "club_lead"
        | "ad"
        | "admin"
        | "super_admin"
      event_status:
        | "draft"
        | "pending"
        | "published"
        | "rejected"
        | "completed"
        | "cancelled"
      registration_status: "registered" | "cancelled"
      gender: "female" | "male" | "non_binary" | "prefer_not_to_say"
      residence: "hosteller" | "day_scholar"
      verification_status: "verified" | "unverified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "student",
        "faculty",
        "club_lead",
        "ad",
        "admin",
        "super_admin",
      ],
      gender: ["female", "male", "non_binary", "prefer_not_to_say"],
      residence: ["hosteller", "day_scholar"],
      verification_status: ["verified", "unverified"],
    },
  },
} as const
