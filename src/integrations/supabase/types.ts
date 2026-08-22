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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string
          id: string
          owner_email: string
          updated_at: string
          whatsapp_phone_number_id: string
          whatsapp_token: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_email?: string
          updated_at?: string
          whatsapp_phone_number_id?: string
          whatsapp_token?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_email?: string
          updated_at?: string
          whatsapp_phone_number_id?: string
          whatsapp_token?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          birthday: string | null
          created_at: string
          favourite_item: string | null
          id: string
          last_visit: string | null
          name: string
          phone: string
          reward_points: number
          saved_address: string | null
          total_spend: number
          updated_at: string
          user_id: string | null
          visits: number
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          favourite_item?: string | null
          id?: string
          last_visit?: string | null
          name: string
          phone: string
          reward_points?: number
          saved_address?: string | null
          total_spend?: number
          updated_at?: string
          user_id?: string | null
          visits?: number
        }
        Update: {
          birthday?: string | null
          created_at?: string
          favourite_item?: string | null
          id?: string
          last_visit?: string | null
          name?: string
          phone?: string
          reward_points?: number
          saved_address?: string | null
          total_spend?: number
          updated_at?: string
          user_id?: string | null
          visits?: number
        }
        Relationships: []
      }
      discounts: {
        Row: {
          category_ids: string[]
          coupon_code: string | null
          created_at: string
          end_hour: number | null
          ends_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_amount: number
          name: string
          product_ids: string[]
          start_hour: number | null
          starts_at: string | null
          type: string
          updated_at: string
          usage_count: number
          value: number
        }
        Insert: {
          category_ids?: string[]
          coupon_code?: string | null
          created_at?: string
          end_hour?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number
          name: string
          product_ids?: string[]
          start_hour?: number | null
          starts_at?: string | null
          type?: string
          updated_at?: string
          usage_count?: number
          value?: number
        }
        Update: {
          category_ids?: string[]
          coupon_code?: string | null
          created_at?: string
          end_hour?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number
          name?: string
          product_ids?: string[]
          start_hour?: number | null
          starts_at?: string | null
          type?: string
          updated_at?: string
          usage_count?: number
          value?: number
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          cost_per_unit: number
          created_at: string
          expiry_date: string | null
          id: string
          low_stock_threshold: number
          name: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          low_stock_threshold?: number
          name: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          low_stock_threshold?: number
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_rules: {
        Row: {
          created_at: string
          discount_percent: number
          expiry_days: number
          id: string
          is_active: boolean
          reward_points: number
          updated_at: string
          visits_required: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number
          expiry_days?: number
          id?: string
          is_active?: boolean
          reward_points?: number
          updated_at?: string
          visits_required: number
        }
        Update: {
          created_at?: string
          discount_percent?: number
          expiry_days?: number
          id?: string
          is_active?: boolean
          reward_points?: number
          updated_at?: string
          visits_required?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          banner_url: string | null
          category_ids: string[]
          coupon_code: string | null
          created_at: string
          description: string
          discount_percent: number
          ends_at: string | null
          id: string
          is_active: boolean
          product_ids: string[]
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category_ids?: string[]
          coupon_code?: string | null
          created_at?: string
          description?: string
          discount_percent?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          product_ids?: string[]
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category_ids?: string[]
          coupon_code?: string | null
          created_at?: string
          description?: string
          discount_percent?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          product_ids?: string[]
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          instructions: string | null
          line_total: number
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          weight_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string | null
          line_total?: number
          name: string
          order_id: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          weight_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string | null
          line_total?: number
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          weight_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_charge: number
          discount: number
          discount_label: string | null
          id: string
          notes: string | null
          order_number: string
          packing_charge: number
          payment_method: string
          payment_status: string
          session_token: string
          status: string
          subtotal: number
          table_number: number | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_charge?: number
          discount?: number
          discount_label?: string | null
          id?: string
          notes?: string | null
          order_number: string
          packing_charge?: number
          payment_method?: string
          payment_status?: string
          session_token?: string
          status?: string
          subtotal?: number
          table_number?: number | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_charge?: number
          discount?: number
          discount_label?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          packing_charge?: number
          payment_method?: string
          payment_status?: string
          session_token?: string
          status?: string
          subtotal?: number
          table_number?: number | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          calories: number
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_available: boolean
          is_popular: boolean
          is_recommended: boolean
          is_special: boolean
          is_spicy: boolean
          is_veg: boolean
          name: string
          offer_price: number | null
          prep_time_mins: number
          price: number
          price_per_kg: number | null
          rating: number
          review_count: number
          sold_by_weight: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          calories?: number
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_popular?: boolean
          is_recommended?: boolean
          is_special?: boolean
          is_spicy?: boolean
          is_veg?: boolean
          name: string
          offer_price?: number | null
          prep_time_mins?: number
          price?: number
          price_per_kg?: number | null
          rating?: number
          review_count?: number
          sold_by_weight?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          calories?: number
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_popular?: boolean
          is_recommended?: boolean
          is_special?: boolean
          is_spicy?: boolean
          is_veg?: boolean
          name?: string
          offer_price?: number | null
          prep_time_mins?: number
          price?: number
          price_per_kg?: number | null
          rating?: number
          review_count?: number
          sold_by_weight?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_settings: {
        Row: {
          address: string
          banner_url: string | null
          closing_time: string
          created_at: string
          currency: string
          delivery_charge: number
          gst_number: string
          id: string
          logo_url: string | null
          name: string
          opening_time: string
          packing_charge: number
          phone: string
          tagline: string
          tax_percent: number
          theme: string
          updated_at: string
          upi_id: string
        }
        Insert: {
          address?: string
          banner_url?: string | null
          closing_time?: string
          created_at?: string
          currency?: string
          delivery_charge?: number
          gst_number?: string
          id?: string
          logo_url?: string | null
          name?: string
          opening_time?: string
          packing_charge?: number
          phone?: string
          tagline?: string
          tax_percent?: number
          theme?: string
          updated_at?: string
          upi_id?: string
        }
        Update: {
          address?: string
          banner_url?: string | null
          closing_time?: string
          created_at?: string
          currency?: string
          delivery_charge?: number
          gst_number?: string
          id?: string
          logo_url?: string | null
          name?: string
          opening_time?: string
          packing_charge?: number
          phone?: string
          tagline?: string
          tax_percent?: number
          theme?: string
          updated_at?: string
          upi_id?: string
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          seats: number
          table_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          seats?: number
          table_number: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          seats?: number
          table_number?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          customer_name: string
          id: string
          is_published: boolean
          product_id: string | null
          rating: number
        }
        Insert: {
          comment?: string
          created_at?: string
          customer_name: string
          id?: string
          is_published?: boolean
          product_id?: string | null
          rating?: number
        }
        Update: {
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_published?: boolean
          product_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "customer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "customer"],
    },
  },
} as const
