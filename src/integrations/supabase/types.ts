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
  public: {
    Tables: {
      account_restrictions: {
        Row: {
          banned_until: string | null
          created_at: string
          reason: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          banned_until?: string | null
          created_at?: string
          reason?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          banned_until?: string | null
          created_at?: string
          reason?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_restrictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_targets: {
        Row: {
          coupon_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          coupon_id: string
          target_id: string
          target_type: string
        }
        Update: {
          coupon_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_targets_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string
          auto_apply: boolean
          cap_amount: number | null
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          max_uses_per_customer: number | null
          max_uses_total: number | null
          min_spend: number
          name: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          applies_to?: string
          auto_apply?: boolean
          cap_amount?: number | null
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses_per_customer?: number | null
          max_uses_total?: number | null
          min_spend?: number
          name: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          applies_to?: string
          auto_apply?: boolean
          cap_amount?: number | null
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses_per_customer?: number | null
          max_uses_total?: number | null
          min_spend?: number
          name?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      episode_media: {
        Row: {
          content_type: string
          episode_id: string
          size_bytes: number | null
          uploaded_at: string
          video_key: string
        }
        Insert: {
          content_type?: string
          episode_id: string
          size_bytes?: number | null
          uploaded_at?: string
          video_key: string
        }
        Update: {
          content_type?: string
          episode_id?: string
          size_bytes?: number | null
          uploaded_at?: string
          video_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_media_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: true
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_unlocks: {
        Row: {
          created_at: string
          episode_id: string
          granted_by: string | null
          id: string
          order_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          episode_id: string
          granted_by?: string | null
          id?: string
          order_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          episode_id?: string
          granted_by?: string | null
          id?: string
          order_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_unlocks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          duration_seconds: number
          episode_number: number
          id: string
          is_free: boolean
          is_published: boolean
          price_bdt: number | null
          series_id: string
          synopsis_html: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          episode_number: number
          id?: string
          is_free?: boolean
          is_published?: boolean
          price_bdt?: number | null
          series_id: string
          synopsis_html?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          episode_number?: number
          id?: string
          is_free?: boolean
          is_published?: boolean
          price_bdt?: number | null
          series_id?: string
          synopsis_html?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          coupon_id: string | null
          discount_bdt: number
          final_price_bdt: number
          id: string
          item_id: string
          item_type: string
          order_id: string
          title: string
          unit_price_bdt: number
        }
        Insert: {
          coupon_id?: string | null
          discount_bdt?: number
          final_price_bdt: number
          id?: string
          item_id: string
          item_type: string
          order_id: string
          title: string
          unit_price_bdt: number
        }
        Update: {
          coupon_id?: string | null
          discount_bdt?: number
          final_price_bdt?: number
          id?: string
          item_id?: string
          item_type?: string
          order_id?: string
          title?: string
          unit_price_bdt?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          discount_bdt: number
          id: string
          method: string
          paid_to: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_phone: string
          status: string
          subtotal_bdt: number
          total_bdt: number
          trx_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          discount_bdt?: number
          id?: string
          method: string
          paid_to?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_phone: string
          status?: string
          subtotal_bdt: number
          total_bdt: number
          trx_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          discount_bdt?: number
          id?: string
          method?: string
          paid_to?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_phone?: string
          status?: string
          subtotal_bdt?: number
          total_bdt?: number
          trx_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      passkey_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[]
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[]
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[]
          user_id?: string
        }
        Relationships: []
      }
      password_history: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bkash: string
          id: boolean
          instructions: string
          nagad: string
          rocket: string
          updated_at: string
        }
        Insert: {
          bkash?: string
          id?: boolean
          instructions?: string
          nagad?: string
          rocket?: string
          updated_at?: string
        }
        Update: {
          bkash?: string
          id?: boolean
          instructions?: string
          nagad?: string
          rocket?: string
          updated_at?: string
        }
        Relationships: []
      }
      popups: {
        Row: {
          action_target: string | null
          action_type: string
          action_url: string | null
          alt: string
          created_at: string
          delay_seconds: number
          ends_at: string | null
          frequency: string
          id: string
          image_key: string | null
          is_active: boolean
          placement: string
          sort_order: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_target?: string | null
          action_type?: string
          action_url?: string | null
          alt?: string
          created_at?: string
          delay_seconds?: number
          ends_at?: string | null
          frequency?: string
          id?: string
          image_key?: string | null
          is_active?: boolean
          placement?: string
          sort_order?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_target?: string | null
          action_type?: string
          action_url?: string | null
          alt?: string
          created_at?: string
          delay_seconds?: number
          ends_at?: string | null
          frequency?: string
          id?: string
          image_key?: string | null
          is_active?: boolean
          placement?: string
          sort_order?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_blocks: {
        Row: {
          blocked_by: string
          created_at: string
          id: string
          kind: string
          reason: string
          updated_at: string
          value: string
        }
        Insert: {
          blocked_by: string
          created_at?: string
          id?: string
          kind: string
          reason?: string
          updated_at?: string
          value: string
        }
        Update: {
          blocked_by?: string
          created_at?: string
          id?: string
          kind?: string
          reason?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          backdrop_url: string | null
          created_at: string
          description_html: string
          genres: string[]
          id: string
          is_featured: boolean
          is_published: boolean
          maturity_rating: string
          poster_url: string | null
          price_bdt: number
          release_year: number | null
          slug: string
          sort_order: number
          tagline: string
          title: string
          updated_at: string
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          description_html?: string
          genres?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          maturity_rating?: string
          poster_url?: string | null
          price_bdt?: number
          release_year?: number | null
          slug: string
          sort_order?: number
          tagline?: string
          title: string
          updated_at?: string
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          description_html?: string
          genres?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          maturity_rating?: string
          poster_url?: string | null
          price_bdt?: number
          release_year?: number | null
          slug?: string
          sort_order?: number
          tagline?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      series_unlocks: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          payment_id: string | null
          series_id: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          payment_id?: string | null
          series_id: string
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          payment_id?: string | null
          series_id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_unlocks_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_cleanup_queue: {
        Row: {
          attempts: number
          created_at: string
          updated_at: string
          video_key: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          updated_at?: string
          video_key: string
        }
        Update: {
          attempts?: number
          created_at?: string
          updated_at?: string
          video_key?: string
        }
        Relationships: []
      }
      viewer_sessions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          current_episode_id: string | null
          device_hash: string
          device_name: string
          first_touch: Json
          ip: string | null
          last_seen_at: string
          last_touch: Json
          revoked_at: string | null
          session_id: string
          state: string
          updated_at: string
          user_agent: string | null
          user_id: string
          watched_seconds: number
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          current_episode_id?: string | null
          device_hash: string
          device_name: string
          first_touch?: Json
          ip?: string | null
          last_seen_at?: string
          last_touch?: Json
          revoked_at?: string | null
          session_id: string
          state?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
          watched_seconds?: number
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          current_episode_id?: string | null
          device_hash?: string
          device_name?: string
          first_touch?: Json
          ip?: string | null
          last_seen_at?: string
          last_touch?: Json
          revoked_at?: string | null
          session_id?: string
          state?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "viewer_sessions_current_episode_id_fkey"
            columns: ["current_episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_watch_history: {
        Row: {
          created_at: string
          episode_id: string
          id: string
          last_watched_at: string
          session_id: string
          started_at: string
          updated_at: string
          user_id: string
          watched_seconds: number
        }
        Insert: {
          created_at?: string
          episode_id: string
          id?: string
          last_watched_at?: string
          session_id: string
          started_at?: string
          updated_at?: string
          user_id: string
          watched_seconds?: number
        }
        Update: {
          created_at?: string
          episode_id?: string
          id?: string
          last_watched_at?: string
          session_id?: string
          started_at?: string
          updated_at?: string
          user_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "viewer_watch_history_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_watch_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "viewer_sessions"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "viewer_watch_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_progress: {
        Row: {
          completed: boolean
          duration_seconds: number
          episode_id: string
          position_seconds: number
          series_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          duration_seconds?: number
          episode_id: string
          position_seconds?: number
          series_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          duration_seconds?: number
          episode_id?: string
          position_seconds?: number
          series_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_progress_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          kind: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          kind: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          kind?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      active_offers: {
        Args: never
        Returns: {
          cap_amount: number
          code: string
          coupon_id: string
          discount_type: string
          discount_value: number
          name: string
          target_id: string
          target_type: string
        }[]
      }
      coupon_use_count: {
        Args: { _coupon: string; _user?: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      password_is_reused: {
        Args: { _password: string; _user_id: string }
        Returns: boolean
      }
      record_viewer_presence: {
        Args: {
          p_agent: string
          p_city: string
          p_country: string
          p_device: string
          p_episode?: string
          p_ip: string
          p_name: string
          p_session: string
          p_state: string
          p_touch: Json
          p_user: string
        }
        Returns: undefined
      }
      record_viewer_presence_internal: {
        Args: {
          p_agent: string
          p_city: string
          p_country: string
          p_device: string
          p_episode: string
          p_ip: string
          p_name: string
          p_session: string
          p_state: string
          p_touch: Json
          p_user: string
        }
        Returns: undefined
      }
      snapshot_current_password: {
        Args: { _user_id: string }
        Returns: undefined
      }
      user_has_password: { Args: { _user_id: string }; Returns: boolean }
      verify_current_password: {
        Args: { _password: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager"
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
  public: {
    Enums: {
      app_role: ["admin", "manager"],
    },
  },
} as const
