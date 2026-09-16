export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          position: number;
          target_budget: number | null;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          position?: number;
          target_budget?: number | null;
          target_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          position?: number;
          target_budget?: number | null;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      extraction_logs: {
        Row: {
          created_at: string;
          domain: string | null;
          duration_ms: number | null;
          error_code: string | null;
          error_message: string | null;
          confidence: number | null;
          fallback_attempted: boolean;
          fallback_status: string | null;
          fields_found: Json;
          final_status: string | null;
          id: string;
          item_id: string | null;
          method: string | null;
          native_status: string | null;
          provider_used: string | null;
          requested_url: string;
          resolved_url: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          domain?: string | null;
          duration_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          confidence?: number | null;
          fallback_attempted?: boolean;
          fallback_status?: string | null;
          fields_found?: Json;
          final_status?: string | null;
          id?: string;
          item_id?: string | null;
          method?: string | null;
          native_status?: string | null;
          provider_used?: string | null;
          requested_url: string;
          resolved_url?: string | null;
          status: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          domain?: string | null;
          duration_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          confidence?: number | null;
          fallback_attempted?: boolean;
          fallback_status?: string | null;
          fields_found?: Json;
          final_status?: string | null;
          id?: string;
          item_id?: string | null;
          method?: string | null;
          native_status?: string | null;
          provider_used?: string | null;
          requested_url?: string;
          resolved_url?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "extraction_logs_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      item_collections: {
        Row: {
          collection_id: string;
          created_at: string;
          item_id: string;
          user_id: string;
        };
        Insert: {
          collection_id: string;
          created_at?: string;
          item_id: string;
          user_id: string;
        };
        Update: {
          collection_id?: string;
          created_at?: string;
          item_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_collections_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_collections_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      item_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          id: string;
          item_id: string;
          position: number;
          source_url: string | null;
          storage_path: string | null;
          user_id: string;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          item_id: string;
          position?: number;
          source_url?: string | null;
          storage_path?: string | null;
          user_id: string;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          item_id?: string;
          position?: number;
          source_url?: string | null;
          storage_path?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_images_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      items: {
        Row: {
          actual_purchase_price: number | null;
          amount_saved: number;
          availability: string | null;
          brand: string | null;
          canonical_url: string | null;
          category_id: string | null;
          created_at: string;
          currency: string | null;
          current_price: number | null;
          description: string | null;
          extraction_confidence: number | null;
          extraction_error: string | null;
          extraction_method: string | null;
          extraction_status: string;
          extraction_warnings: string[] | null;
          id: string;
          image_storage_path: string | null;
          is_archived: boolean;
          last_checked_at: string | null;
          normalized_url: string | null;
          original_price: number | null;
          personal_notes: string | null;
          primary_image_url: string | null;
          priority: string;
          purchase_reflection: string | null;
          purchased_at: string | null;
          rating: number | null;
          reason_for_wanting: string | null;
          review_count: number | null;
          source_domain: string | null;
          source_url: string | null;
          status: string;
          store_name: string | null;
          target_budget: number | null;
          target_purchase_date: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          actual_purchase_price?: number | null;
          amount_saved?: number;
          availability?: string | null;
          brand?: string | null;
          canonical_url?: string | null;
          category_id?: string | null;
          created_at?: string;
          currency?: string | null;
          current_price?: number | null;
          description?: string | null;
          extraction_confidence?: number | null;
          extraction_error?: string | null;
          extraction_method?: string | null;
          extraction_status?: string;
          extraction_warnings?: string[] | null;
          id?: string;
          image_storage_path?: string | null;
          is_archived?: boolean;
          last_checked_at?: string | null;
          normalized_url?: string | null;
          original_price?: number | null;
          personal_notes?: string | null;
          primary_image_url?: string | null;
          priority?: string;
          purchase_reflection?: string | null;
          purchased_at?: string | null;
          rating?: number | null;
          reason_for_wanting?: string | null;
          review_count?: number | null;
          source_domain?: string | null;
          source_url?: string | null;
          status?: string;
          store_name?: string | null;
          target_budget?: number | null;
          target_purchase_date?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          actual_purchase_price?: number | null;
          amount_saved?: number;
          availability?: string | null;
          brand?: string | null;
          canonical_url?: string | null;
          category_id?: string | null;
          created_at?: string;
          currency?: string | null;
          current_price?: number | null;
          description?: string | null;
          extraction_confidence?: number | null;
          extraction_error?: string | null;
          extraction_method?: string | null;
          extraction_status?: string;
          extraction_warnings?: string[] | null;
          id?: string;
          image_storage_path?: string | null;
          is_archived?: boolean;
          last_checked_at?: string | null;
          normalized_url?: string | null;
          original_price?: number | null;
          personal_notes?: string | null;
          primary_image_url?: string | null;
          priority?: string;
          purchase_reflection?: string | null;
          purchased_at?: string | null;
          rating?: number | null;
          reason_for_wanting?: string | null;
          review_count?: number | null;
          source_domain?: string | null;
          source_url?: string | null;
          status?: string;
          store_name?: string | null;
          target_budget?: number | null;
          target_purchase_date?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      price_history: {
        Row: {
          availability: string | null;
          checked_at: string;
          currency: string;
          id: string;
          item_id: string;
          price: number;
          user_id: string;
        };
        Insert: {
          availability?: string | null;
          checked_at?: string;
          currency: string;
          id?: string;
          item_id: string;
          price: number;
          user_id: string;
        };
        Update: {
          availability?: string | null;
          checked_at?: string;
          currency?: string;
          id?: string;
          item_id?: string;
          price?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_history_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          default_currency: string;
          default_view: string;
          display_name: string | null;
          id: string;
          theme: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          default_currency?: string;
          default_view?: string;
          display_name?: string | null;
          id: string;
          theme?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          default_currency?: string;
          default_view?: string;
          display_name?: string | null;
          id?: string;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
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
    Enums: {},
  },
} as const;
