export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string;
          admin_id: string;
          created_at: string;
          details: Json | null;
          id: string;
          target_user_id: string | null;
        };
        Insert: {
          action: string;
          admin_id: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          target_user_id?: string | null;
        };
        Update: {
          action?: string;
          admin_id?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          target_user_id?: string | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          author_name: string;
          body: string;
          created_at: string;
          id: string;
          lesson_id: string;
          user_id: string;
        };
        Insert: {
          author_name?: string;
          body: string;
          created_at?: string;
          id?: string;
          lesson_id: string;
          user_id: string;
        };
        Update: {
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          lesson_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          program_slug: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          program_slug: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          program_slug?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      horizon_trials: {
        Row: {
          completed_at: string | null;
          connections: number | null;
          cpf: string;
          created_at: string;
          credentials: Json | null;
          email: string | null;
          id: string;
          kind: string;
          m3u_url: string | null;
          password: string | null;
          plan: string | null;
          server_url: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
          username: string | null;
        };
        Insert: {
          completed_at?: string | null;
          connections?: number | null;
          cpf: string;
          created_at?: string;
          credentials?: Json | null;
          email?: string | null;
          id?: string;
          kind?: string;
          m3u_url?: string | null;
          password?: string | null;
          plan?: string | null;
          server_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          username?: string | null;
        };
        Update: {
          completed_at?: string | null;
          connections?: number | null;
          cpf?: string;
          created_at?: string;
          credentials?: Json | null;
          email?: string | null;
          id?: string;
          kind?: string;
          m3u_url?: string | null;
          password?: string | null;
          plan?: string | null;
          server_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      horizon_accounts: {
        Row: {
          activated_at: string | null;
          billing_period: string | null;
          connections: number | null;
          created_at: string;
          credentials: Json | null;
          error: string | null;
          id: string;
          m3u_url: string | null;
          password: string | null;
          plan: string | null;
          plan_id: string | null;
          plan_tier: string | null;
          provider_payment_id: string | null;
          server_url: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          activated_at?: string | null;
          billing_period?: string | null;
          connections?: number | null;
          created_at?: string;
          credentials?: Json | null;
          error?: string | null;
          id?: string;
          m3u_url?: string | null;
          password?: string | null;
          plan?: string | null;
          plan_id?: string | null;
          plan_tier?: string | null;
          provider_payment_id?: string | null;
          server_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          activated_at?: string | null;
          billing_period?: string | null;
          connections?: number | null;
          created_at?: string;
          credentials?: Json | null;
          error?: string | null;
          id?: string;
          m3u_url?: string | null;
          password?: string | null;
          plan?: string | null;
          plan_id?: string | null;
          plan_tier?: string | null;
          provider_payment_id?: string | null;
          server_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      horizon_plan_mappings: {
        Row: {
          billing_period: string;
          created_at: string;
          horizon_plan_id: string;
          id: string;
          label: string | null;
          plan_tier: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          billing_period: string;
          created_at?: string;
          horizon_plan_id: string;
          id?: string;
          label?: string | null;
          plan_tier: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          billing_period?: string;
          created_at?: string;
          horizon_plan_id?: string;
          id?: string;
          label?: string | null;
          plan_tier?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          body: string | null;
          created_at: string;
          duration: string | null;
          id: string;
          kind: string;
          module: string;
          program_slug: string;
          published: boolean;
          sort: number;
          title: string;
          video_url: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          duration?: string | null;
          id?: string;
          kind?: string;
          module?: string;
          program_slug: string;
          published?: boolean;
          sort?: number;
          title: string;
          video_url?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          duration?: string | null;
          id?: string;
          kind?: string;
          module?: string;
          program_slug?: string;
          published?: boolean;
          sort?: number;
          title?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_program_slug_fkey";
            columns: ["program_slug"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["slug"];
          },
        ];
      };
      login_attempts: {
        Row: {
          email: string;
          fails: number;
          locked_until: string | null;
          updated_at: string;
        };
        Insert: {
          email: string;
          fails?: number;
          locked_until?: string | null;
          updated_at?: string;
        };
        Update: {
          email?: string;
          fails?: number;
          locked_until?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      news: {
        Row: {
          author_id: string | null;
          author_name: string;
          author_role: string;
          body: string;
          category: string;
          cover_url: string | null;
          created_at: string;
          featured: boolean;
          id: string;
          kind: string;
          published: boolean;
          slug: string;
          summary: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          author_name?: string;
          author_role?: string;
          body?: string;
          category?: string;
          cover_url?: string | null;
          created_at?: string;
          featured?: boolean;
          id?: string;
          kind?: string;
          published?: boolean;
          slug: string;
          summary?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          author_name?: string;
          author_role?: string;
          body?: string;
          category?: string;
          cover_url?: string | null;
          created_at?: string;
          featured?: boolean;
          id?: string;
          kind?: string;
          published?: boolean;
          slug?: string;
          summary?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          id: string;
          method: string | null;
          paid_at: string | null;
          provider_payment_id: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          id?: string;
          method?: string | null;
          paid_at?: string | null;
          provider_payment_id?: string | null;
          status: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          id?: string;
          method?: string | null;
          paid_at?: string | null;
          provider_payment_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: string | null;
          address_complement: string | null;
          address_number: string | null;
          ban_reason: string | null;
          banned: boolean;
          birth_date: string | null;
          cep: string | null;
          city: string | null;
          cpf: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          last_ip: string | null;
          neighborhood: string | null;
          signup_ip: string | null;
          state: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          address?: string | null;
          address_complement?: string | null;
          address_number?: string | null;
          ban_reason?: string | null;
          banned?: boolean;
          birth_date?: string | null;
          cep?: string | null;
          city?: string | null;
          cpf?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          last_ip?: string | null;
          neighborhood?: string | null;
          signup_ip?: string | null;
          state?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          address?: string | null;
          address_complement?: string | null;
          address_number?: string | null;
          ban_reason?: string | null;
          banned?: boolean;
          birth_date?: string | null;
          cep?: string | null;
          city?: string | null;
          cpf?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          last_ip?: string | null;
          neighborhood?: string | null;
          signup_ip?: string | null;
          state?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          category: string;
          created_at: string;
          day: string;
          description: string;
          duration: string;
          image: string;
          image_url: string | null;
          published: boolean;
          rating: string;
          slug: string;
          sort: number;
          status: string;
          time: string;
          title: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          day?: string;
          description?: string;
          duration?: string;
          image?: string;
          image_url?: string | null;
          published?: boolean;
          rating?: string;
          slug: string;
          sort?: number;
          status?: string;
          time?: string;
          title: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          day?: string;
          description?: string;
          duration?: string;
          image?: string;
          image_url?: string | null;
          published?: boolean;
          rating?: string;
          slug?: string;
          sort?: number;
          status?: string;
          time?: string;
          title?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: string;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          billing_period: string;
          cancel_at_period_end: boolean;
          created_at: string;
          current_period_end: string | null;
          id: string;
          mp_preapproval_id: string | null;
          pending_period: string | null;
          pending_tier: string | null;
          plan_name: string;
          plan_tier: string;
          price_cents: number;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          billing_period?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          mp_preapproval_id?: string | null;
          pending_period?: string | null;
          pending_tier?: string | null;
          plan_name?: string;
          plan_tier?: string;
          price_cents?: number;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          billing_period?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          mp_preapproval_id?: string | null;
          pending_period?: string | null;
          pending_tier?: string | null;
          plan_name?: string;
          plan_tier?: string;
          price_cents?: number;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      login_clear: { Args: never; Returns: undefined };
      login_lock_status: { Args: { _email: string }; Returns: number };
      login_register_fail: { Args: { _email: string }; Returns: number };
      set_cancel_renewal: { Args: { _cancel: boolean }; Returns: undefined };
    };
    Enums: {
      app_role: "admin" | "user" | "admin_chefe";
      subscription_status: "pendente" | "ativa" | "cancelada" | "expirada";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "admin_chefe"],
      subscription_status: ["pendente", "ativa", "cancelada", "expirada"],
    },
  },
} as const;
