export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_forecasts: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          forecast_date: string
          forecast_period: string
          id: string
          notes: string | null
          predicted_demand: number
          product_id: string
          supplier_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          forecast_date: string
          forecast_period: string
          id?: string
          notes?: string | null
          predicted_demand: number
          product_id: string
          supplier_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          forecast_date?: string
          forecast_period?: string
          id?: string
          notes?: string | null
          predicted_demand?: number
          product_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string | null
          details: string | null
          farm_stage: string | null
          farm_start_date: string | null
          farmer_id: string
          id: string
          livestock_type: string
          location: string
          name: string
          number_of_chicken: number | null
          number_of_fish: number | null
          size: number
          size_unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          farm_stage?: string | null
          farm_start_date?: string | null
          farmer_id: string
          id?: string
          livestock_type: string
          location: string
          name: string
          number_of_chicken?: number | null
          number_of_fish?: number | null
          size: number
          size_unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          farm_stage?: string | null
          farm_start_date?: string | null
          farmer_id?: string
          id?: string
          livestock_type?: string
          location?: string
          name?: string
          number_of_chicken?: number | null
          number_of_fish?: number | null
          size?: number
          size_unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farms_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          average_monthly_consumption: number | null
          created_at: string | null
          current_stock: number
          farm_id: string
          feed_frequency: number | null
          feed_frequency_unit: string | null
          id: string
          last_order_date: string | null
          last_updated_at: string | null
          last_updated_by: string | null
          low_stock_threshold: number | null
          product_id: string
        }
        Insert: {
          average_monthly_consumption?: number | null
          created_at?: string | null
          current_stock?: number
          farm_id: string
          feed_frequency?: number | null
          feed_frequency_unit?: string | null
          id?: string
          last_order_date?: string | null
          last_updated_at?: string | null
          last_updated_by?: string | null
          low_stock_threshold?: number | null
          product_id: string
        }
        Update: {
          average_monthly_consumption?: number | null
          created_at?: string | null
          current_stock?: number
          farm_id?: string
          feed_frequency?: number | null
          feed_frequency_unit?: string | null
          id?: string
          last_order_date?: string | null
          last_updated_at?: string | null
          last_updated_by?: string | null
          low_stock_threshold?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          farmer_id: string
          id: string
          order_id: string | null
          outstanding_balance: number
          repayment_schedule: string
          status: string | null
          terms_months: number
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          farmer_id: string
          id?: string
          order_id?: string | null
          outstanding_balance: number
          repayment_schedule: string
          status?: string | null
          terms_months: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          farmer_id?: string
          id?: string
          order_id?: string | null
          outstanding_balance?: number
          repayment_schedule?: string
          status?: string | null
          terms_months?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_batch_items: {
        Row: {
          batch_id: string
          created_at: string | null
          id: string
          order_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          id?: string
          order_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "order_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_batch_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_batches: {
        Row: {
          batch_name: string
          created_at: string | null
          dispatch_date: string | null
          expected_delivery_date: string | null
          id: string
          status: string | null
          supplier_id: string
          total_orders: number | null
          updated_at: string | null
        }
        Insert: {
          batch_name: string
          created_at?: string | null
          dispatch_date?: string | null
          expected_delivery_date?: string | null
          id?: string
          status?: string | null
          supplier_id: string
          total_orders?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_name?: string
          created_at?: string | null
          dispatch_date?: string | null
          expected_delivery_date?: string | null
          id?: string
          status?: string | null
          supplier_id?: string
          total_orders?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          delivery_date: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          status: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity: number
          status?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          status?: string | null
          unit_price?: number
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
          created_at: string | null
          delivery_address: string
          delivery_date: string | null
          discount: number | null
          farm_id: string
          farmer_id: string
          id: string
          is_credit: boolean | null
          order_date: string | null
          payment_date: string | null
          payment_method: string | null
          status: string | null
          supplier_id: string
          total_price: number
          total_quantity: number
          transaction_reference: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_address: string
          delivery_date?: string | null
          discount?: number | null
          farm_id: string
          farmer_id: string
          id?: string
          is_credit?: boolean | null
          order_date?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          supplier_id: string
          total_price?: number
          total_quantity?: number
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_address?: string
          delivery_date?: string | null
          discount?: number | null
          farm_id?: string
          farmer_id?: string
          id?: string
          is_credit?: boolean | null
          order_date?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          supplier_id?: string
          total_price?: number
          total_quantity?: number
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability_status: string | null
          barcode: string | null
          category: string
          created_at: string | null
          description: string | null
          discount_available: number | null
          feed_type: string
          id: string
          image_url: string | null
          minimum_order_quantity: number | null
          name: string
          nutritional_content: string | null
          stock_quantity: number | null
          supplier_id: string
          unit: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          availability_status?: string | null
          barcode?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          discount_available?: number | null
          feed_type: string
          id?: string
          image_url?: string | null
          minimum_order_quantity?: number | null
          name: string
          nutritional_content?: string | null
          stock_quantity?: number | null
          supplier_id: string
          unit: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          availability_status?: string | null
          barcode?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          discount_available?: number | null
          feed_type?: string
          id?: string
          image_url?: string | null
          minimum_order_quantity?: number | null
          name?: string
          nutritional_content?: string | null
          stock_quantity?: number | null
          supplier_id?: string
          unit?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          assigned_agent_id: string | null
          bank_account_number: string | null
          cooperative_association: string | null
          created_at: string | null
          id: string
          is_suspended: boolean | null
          language: string | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_agent_id?: string | null
          bank_account_number?: string | null
          cooperative_association?: string | null
          created_at?: string | null
          id: string
          is_suspended?: boolean | null
          language?: string | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_agent_id?: string | null
          bank_account_number?: string | null
          cooperative_association?: string | null
          created_at?: string | null
          id?: string
          is_suspended?: boolean | null
          language?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_analytics: {
        Row: {
          created_at: string | null
          fulfillment_rate: number | null
          id: string
          period_end: string
          period_start: string
          product_id: string
          supplier_id: string
          total_orders: number | null
          total_quantity: number | null
          total_sales: number | null
        }
        Insert: {
          created_at?: string | null
          fulfillment_rate?: number | null
          id?: string
          period_end: string
          period_start: string
          product_id: string
          supplier_id: string
          total_orders?: number | null
          total_quantity?: number | null
          total_sales?: number | null
        }
        Update: {
          created_at?: string | null
          fulfillment_rate?: number | null
          id?: string
          period_end?: string
          period_start?: string
          product_id?: string
          supplier_id?: string
          total_orders?: number | null
          total_quantity?: number | null
          total_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_analytics_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string
          business_registration_number: string
          contact_name: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string
        }
        Insert: {
          address: string
          business_registration_number: string
          contact_name: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone: string
        }
        Update: {
          address?: string
          business_registration_number?: string
          contact_name?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
    Enums: {},
  },
} as const
