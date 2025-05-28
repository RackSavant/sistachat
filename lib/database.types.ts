export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chats: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feedback_solicitations: {
        Row: {
          id: string
          initiated_at: string | null
          outfit_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          initiated_at?: string | null
          outfit_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          initiated_at?: string | null
          outfit_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_solicitations_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_feedback_threads: {
        Row: {
          contacted_friend_identifier_text: string
          created_at: string | null
          id: string
          simulated_friend_reply_text: string | null
          solicitation_id: string
          status: string | null
          trusted_friend_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contacted_friend_identifier_text: string
          created_at?: string | null
          id?: string
          simulated_friend_reply_text?: string | null
          solicitation_id: string
          status?: string | null
          trusted_friend_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contacted_friend_identifier_text?: string
          created_at?: string | null
          id?: string
          simulated_friend_reply_text?: string | null
          solicitation_id?: string
          status?: string | null
          trusted_friend_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_feedback_threads_solicitation_id_fkey"
            columns: ["solicitation_id"]
            isOneToOne: false
            referencedRelation: "feedback_solicitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_feedback_threads_trusted_friend_id_fkey"
            columns: ["trusted_friend_id"]
            isOneToOne: false
            referencedRelation: "user_trusted_friends"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ai_feedback: string | null
          chat_id: string
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          message_type: string
          processed_image_url: string | null
          raw_image_url: string | null
          shopping_suggestions: Json | null
          storage_object_path: string | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          message_type?: string
          processed_image_url?: string | null
          raw_image_url?: string | null
          shopping_suggestions?: Json | null
          storage_object_path?: string | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          message_type?: string
          processed_image_url?: string | null
          raw_image_url?: string | null
          shopping_suggestions?: Json | null
          storage_object_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          aggregated_friend_feedback_summary_text: string | null
          created_at: string | null
          derived_score_signal_text: string | null
          feedback_status: string | null
          id: string
          image_url: string
          initial_ai_analysis_text: string | null
          notes: string | null
          storage_object_path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aggregated_friend_feedback_summary_text?: string | null
          created_at?: string | null
          derived_score_signal_text?: string | null
          feedback_status?: string | null
          id?: string
          image_url: string
          initial_ai_analysis_text?: string | null
          notes?: string | null
          storage_object_path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aggregated_friend_feedback_summary_text?: string | null
          created_at?: string | null
          derived_score_signal_text?: string | null
          feedback_status?: string | null
          id?: string
          image_url?: string
          initial_ai_analysis_text?: string | null
          notes?: string | null
          storage_object_path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_trusted_friends: {
        Row: {
          created_at: string | null
          friend_identifier_info: string | null
          friend_nickname: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_identifier_info?: string | null
          friend_nickname: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_identifier_info?: string | null
          friend_nickname?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_usage_quotas: {
        Row: {
          feedback_flows_initiated_this_period: number | null
          images_uploaded_this_period: number | null
          month_year_key: string
          period_end_date: string
          period_start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          feedback_flows_initiated_this_period?: number | null
          images_uploaded_this_period?: number | null
          month_year_key: string
          period_end_date: string
          period_start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          feedback_flows_initiated_this_period?: number | null
          images_uploaded_this_period?: number | null
          month_year_key?: string
          period_end_date?: string
          period_start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_current_chat: {
        Args: { p_user_id: string }
        Returns: string
      }
      increment_feedback_requests: {
        Args: { p_user_id: string; p_month_year_key: string }
        Returns: undefined
      }
      increment_uploads: {
        Args: { p_user_id: string; p_month_year_key: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
