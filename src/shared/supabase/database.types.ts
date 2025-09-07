/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
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
    PostgrestVersion: '12.2.3 (519615d)'
  }
  public: {
    Tables: {
      body_measures: {
        Row: {
          created_at: string
          height: number
          hip: number | null
          id: number
          neck: number
          owner: number
          target_timestamp: string
          waist: number
        }
        Insert: {
          created_at?: string
          height: number
          hip?: number | null
          id?: number
          neck: number
          owner: number
          target_timestamp: string
          waist: number
        }
        Update: {
          created_at?: string
          height?: number
          hip?: number | null
          id?: number
          neck?: number
          owner?: number
          target_timestamp?: string
          waist?: number
        }
        Relationships: [
          {
            foreignKeyName: 'body_measures_owner_fkey'
            columns: ['owner']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      cached_searches: {
        Row: {
          search: string
        }
        Insert: {
          search: string
        }
        Update: {
          search?: string
        }
        Relationships: []
      }
      days: {
        Row: {
          created_at: string
          id: number
          meals: Json
          owner: number
          target_day: string
        }
        Insert: {
          created_at?: string
          id?: number
          meals?: Json
          owner: number
          target_day: string
        }
        Update: {
          created_at?: string
          id?: number
          meals?: Json
          owner?: number
          target_day?: string
        }
        Relationships: [
          {
            foreignKeyName: 'days_test_owner_fkey'
            columns: ['owner']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      days_bkp: {
        Row: {
          created_at: string | null
          id: number
          meals: Json
          owner: number | null
          target_day: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          meals?: Json
          owner?: number | null
          target_day: string
        }
        Update: {
          created_at?: string | null
          id?: number
          meals?: Json
          owner?: number | null
          target_day?: string
        }
        Relationships: [
          {
            foreignKeyName: 'days_bkp_owner_fkey'
            columns: ['owner']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      days_test_bkp: {
        Row: {
          created_at: string | null
          id: number
          meals: Json
          owner: number | null
          target_day: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          meals?: Json
          owner?: number | null
          target_day: string
        }
        Update: {
          created_at?: string | null
          id?: number
          meals?: Json
          owner?: number | null
          target_day?: string
        }
        Relationships: [
          {
            foreignKeyName: 'days_test_bkp_owner_fkey'
            columns: ['owner']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      foods: {
        Row: {
          created_at: string | null
          ean: string | null
          id: number
          macros: Json
          name: string
          source: Json | null
        }
        Insert: {
          created_at?: string | null
          ean?: string | null
          id?: number
          macros: Json
          name: string
          source?: Json | null
        }
        Update: {
          created_at?: string | null
          ean?: string | null
          id?: number
          macros?: Json
          name?: string
          source?: Json | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          id: number
          name: string
          recipe: number | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          recipe?: number | null
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          recipe?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_recipe_fkey'
            columns: ['recipe']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          id: number
          name: string
          quantity: number
          reference: number
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          quantity: number
          reference: number
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          quantity?: number
          reference?: number
        }
        Relationships: [
          {
            foreignKeyName: 'items_reference_fkey'
            columns: ['reference']
            isOneToOne: false
            referencedRelation: 'foods'
            referencedColumns: ['id']
          },
        ]
      }
      macro_profiles: {
        Row: {
          created_at: string
          gramsPerKgCarbs: number | null
          gramsPerKgFat: number | null
          gramsPerKgProtein: number | null
          id: number
          owner: number | null
          target_day: string | null
        }
        Insert: {
          created_at?: string
          gramsPerKgCarbs?: number | null
          gramsPerKgFat?: number | null
          gramsPerKgProtein?: number | null
          id?: number
          owner?: number | null
          target_day?: string | null
        }
        Update: {
          created_at?: string
          gramsPerKgCarbs?: number | null
          gramsPerKgFat?: number | null
          gramsPerKgProtein?: number | null
          id?: number
          owner?: number | null
          target_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'macro_profiles_owner_fkey'
            columns: ['owner']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      recent_foods: {
        Row: {
          created_at: string
          id: number
          last_used: string
          reference_id: number
          times_used: number
          type: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          last_used: string
          reference_id: number
          times_used: number
          type?: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          last_used?: string
          reference_id?: number
          times_used?: number
          type?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'recent_foods_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string | null
          id: number
          items: Json
          name: string
          owner: number
          prepared_multiplier: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          items?: Json
          name: string
          owner: number
          prepared_multiplier: number
        }
        Update: {
          created_at?: string | null
          id?: number
          items?: Json
          name?: string
          owner?: number
          prepared_multiplier?: number
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_owner_fkey'
            columns: ['owner']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          birthdate: string
          created_at: string
          desired_weight: number
          diet: string
          favorite_foods: number[] | null
          gender: string
          id: number
          macro_profile: Json | null
          name: string
          uuid: string | null
        }
        Insert: {
          birthdate?: string
          created_at?: string
          desired_weight: number
          diet?: string
          favorite_foods?: number[] | null
          gender?: string
          id?: number
          macro_profile?: Json | null
          name: string
          uuid?: string | null
        }
        Update: {
          birthdate?: string
          created_at?: string
          desired_weight?: number
          diet?: string
          favorite_foods?: number[] | null
          gender?: string
          id?: number
          macro_profile?: Json | null
          name?: string
          uuid?: string | null
        }
        Relationships: []
      }
      weights: {
        Row: {
          created_at: string
          id: number
          owner: number
          target_timestamp: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: number
          owner: number
          target_timestamp: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: number
          owner?: number
          target_timestamp?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: 'weights_owner_fkey'
            columns: ['owner']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      days_test: {
        Row: {
          created_at: string | null
          id: number | null
          meals: Json | null
          owner: number | null
          target_day: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          meals?: Json | null
          owner?: number | null
          target_day?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          meals?: Json | null
          owner?: number | null
          target_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'days_test_owner_fkey'
            columns: ['owner']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      gtrgm_compress: {
        Args: { '': unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { '': unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { '': unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { '': unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { '': unknown }
        Returns: unknown
      }
      search_favorite_foods_with_scoring: {
        Args: { p_user_id: number; p_search_term: string; p_limit?: number }
        Returns: {
          id: number
          name: string
          ean: string
          macros: Json
          source: Json
          created_at: string
        }[]
      }
      search_foods_with_scoring: {
        Args: { p_search_term: string; p_limit?: number }
        Returns: {
          id: number
          name: string
          ean: string
          macros: Json
          source: Json
          created_at: string
        }[]
      }
      search_recent_foods_with_names: {
        Args: { p_user_id: number; p_search_term?: string; p_limit?: number }
        Returns: {
          recent_food_id: number
          user_id: number
          type: string
          reference_id: number
          last_used: string
          times_used: number
          template_id: number
          template_name: string
          template_ean: string
          template_source: Json
          template_macros: Json
          template_owner: number
          template_items: Json
          template_prepared_multiplier: number
        }[]
      }
      set_limit: {
        Args: { '': number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { '': string }
        Returns: string[]
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
