/**
 * Hand-written from supabase/migrations/20260812144453_remote_schema.sql
 * (the `supabase` CLI isn't authenticated in this environment, so `supabase
 * gen types` can't run — see docs/claude-code-admin-prompt.md section 3).
 * Regenerate with `supabase gen types typescript --linked` once the CLI is
 * logged in; the shape here should match exactly.
 *
 * Postgres `numeric` columns come back from supabase-js as strings, not
 * numbers — those fields are typed `string` below, not `number`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Required by @supabase/postgrest-js's `GenericTable`/`GenericView` so the
 * client library's own generics resolve correctly (`.rpc()` typing silently
 * degrades to `any` without it). Built from the FK constraints in the
 * migration; cross-schema FKs (e.g. admin_users -> auth.users) are omitted.
 */
export type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type BandAppliesToEnum = "jewellery" | "bullion";
export type MetalEnum = "gold" | "silver";
export type OrderStatusEnum =
  | "pending_payment"
  | "paid"
  | "processing"
  | "ready"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed";
export type PricingModeEnum = "dynamic_jewellery" | "dynamic_bullion" | "fixed";
export type ProductTypeEnum = "in_stock" | "made_to_order";
export type PurityEnum = "24k" | "22k" | "21k" | "18k" | "9k" | "999" | "925";

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          email: string | null;
          label: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          label?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Insert"]>;
        Relationships: [];
      };
      ai_faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          keywords: string[];
          category: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          search_vector: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          keywords?: string[];
          category?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_faqs"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_path: string | null;
          sort_order: number;
          is_active: boolean;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      gold_price_log: {
        Row: {
          id: string;
          fetched_at: string;
          run_label: string | null;
          gold_per_gram_24k_pence: string | null;
          silver_per_gram_999_pence: string | null;
          source: string;
          raw_response: Json | null;
          succeeded: boolean;
          error_message: string | null;
          applied_at: string | null;
          products_updated: number;
          guard_override: boolean;
        };
        Insert: {
          id?: string;
          fetched_at?: string;
          run_label?: string | null;
          gold_per_gram_24k_pence?: string | null;
          silver_per_gram_999_pence?: string | null;
          source: string;
          raw_response?: Json | null;
          succeeded?: boolean;
          error_message?: string | null;
          applied_at?: string | null;
          products_updated?: number;
          guard_override?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["gold_price_log"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          sku: string;
          weight_grams: string | null;
          purity: PurityEnum | null;
          image_path: string | null;
          quantity: number;
          price_at_purchase: number;
          line_total_pence: number;
          metal_rate_pence_per_gram: string | null;
          markup_percent: string | null;
          vat_percent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          sku: string;
          weight_grams?: string | null;
          purity?: PurityEnum | null;
          image_path?: string | null;
          quantity: number;
          price_at_purchase: number;
          line_total_pence: number;
          metal_rate_pence_per_gram?: string | null;
          markup_percent?: string | null;
          vat_percent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          status: OrderStatusEnum;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          is_collection: boolean;
          delivery_line1: string | null;
          delivery_line2: string | null;
          delivery_city: string | null;
          delivery_postcode: string | null;
          delivery_country: string;
          subtotal_pence: number;
          shipping_pence: number;
          total_pence: number;
          currency: string;
          price_lock_id: string | null;
          gold_price_log_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          payment_method_label: string | null;
          customer_notes: string | null;
          internal_notes: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          status?: OrderStatusEnum;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          is_collection?: boolean;
          delivery_line1?: string | null;
          delivery_line2?: string | null;
          delivery_city?: string | null;
          delivery_postcode?: string | null;
          delivery_country?: string;
          subtotal_pence: number;
          shipping_pence?: number;
          total_pence: number;
          currency?: string;
          price_lock_id?: string | null;
          gold_price_log_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          payment_method_label?: string | null;
          customer_notes?: string | null;
          internal_notes?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_gold_price_log_id_fkey";
            columns: ["gold_price_log_id"];
            isOneToOne: false;
            referencedRelation: "gold_price_log";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_price_lock_id_fkey";
            columns: ["price_lock_id"];
            isOneToOne: false;
            referencedRelation: "price_locks";
            referencedColumns: ["id"];
          },
        ];
      };
      price_locks: {
        Row: {
          id: string;
          created_at: string;
          expires_at: string;
          gold_price_log_id: string | null;
          items: Json;
          subtotal_pence: number;
          shipping_pence: number;
          total_pence: number;
          stripe_payment_intent_id: string | null;
          consumed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          expires_at: string;
          gold_price_log_id?: string | null;
          items: Json;
          subtotal_pence: number;
          shipping_pence?: number;
          total_pence: number;
          stripe_payment_intent_id?: string | null;
          consumed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["price_locks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "price_locks_gold_price_log_id_fkey";
            columns: ["gold_price_log_id"];
            isOneToOne: false;
            referencedRelation: "gold_price_log";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          category_id: string;
          product_type: ProductTypeEnum;
          pricing_mode: PricingModeEnum;
          metal: MetalEnum;
          purity: PurityEnum;
          weight_grams: string | null;
          price_pence: number | null;
          price_calculated_at: string | null;
          price_source_log_id: string | null;
          stock_quantity: number;
          lead_time_days: number | null;
          is_active: boolean;
          is_featured: boolean;
          sort_order: number;
          tags: string[];
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
          search_vector: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          slug: string;
          short_description?: string | null;
          description?: string | null;
          category_id: string;
          product_type?: ProductTypeEnum;
          pricing_mode?: PricingModeEnum;
          metal?: MetalEnum;
          purity?: PurityEnum;
          weight_grams?: string | null;
          price_pence?: number | null;
          price_calculated_at?: string | null;
          price_source_log_id?: string | null;
          stock_quantity?: number;
          lead_time_days?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          tags?: string[];
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_price_source_log_id_fkey";
            columns: ["price_source_log_id"];
            isOneToOne: false;
            referencedRelation: "gold_price_log";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing_bands: {
        Row: {
          id: string;
          applies_to: BandAppliesToEnum;
          label: string;
          min_weight_g: string;
          max_weight_g: string;
          markup_percent: string;
          vat_percent: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          applies_to: BandAppliesToEnum;
          label: string;
          min_weight_g: string | number;
          max_weight_g: string | number;
          markup_percent?: string | number;
          vat_percent?: string | number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_bands"]["Insert"]>;
        Relationships: [];
      };
      reviews_cache: {
        Row: {
          id: string;
          google_review_id: string | null;
          author_name: string;
          author_photo_url: string | null;
          rating: number;
          review_text: string | null;
          relative_time: string | null;
          published_at: string | null;
          fetched_at: string;
          display_order: number;
          is_visible: boolean;
        };
        Insert: {
          id?: string;
          google_review_id?: string | null;
          author_name: string;
          author_photo_url?: string | null;
          rating: number;
          review_text?: string | null;
          relative_time?: string | null;
          published_at?: string | null;
          fetched_at?: string;
          display_order?: number;
          is_visible?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["reviews_cache"]["Insert"]>;
        Relationships: [];
      };
      reviews_summary: {
        Row: {
          id: boolean;
          average_rating: string | null;
          review_count: number | null;
          fetched_at: string;
        };
        Insert: {
          id?: boolean;
          average_rating?: string | null;
          review_count?: number | null;
          fetched_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews_summary"]["Insert"]>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: Json;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          notes?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      current_metal_prices: {
        Row: {
          gold_per_gram_24k_pence: string | null;
          silver_per_gram_999_pence: string | null;
          gold_per_tola_pence: string | null;
          fetched_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      find_pricing_band: {
        Args: { p_applies_to: BandAppliesToEnum; p_weight_g: number };
        Returns: Database["public"]["Tables"]["pricing_bands"]["Row"];
      };
      calculate_dynamic_price_pence: {
        Args: {
          p_applies_to: BandAppliesToEnum;
          p_weight_g: number;
          p_rate_per_gram_pence: number;
          p_round_to_pence?: number;
        };
        Returns: number | null;
      };
      purge_expired_price_locks: {
        Args: Record<string, never>;
        Returns: number;
      };
      apply_metal_prices: {
        Args: { p_log_id: string };
        Returns: { updated_count: number; skipped_count: number }[];
      };
    };
    Enums: {
      band_applies_to_enum: BandAppliesToEnum;
      metal_enum: MetalEnum;
      order_status_enum: OrderStatusEnum;
      pricing_mode_enum: PricingModeEnum;
      product_type_enum: ProductTypeEnum;
      purity_enum: PurityEnum;
    };
  };
}
