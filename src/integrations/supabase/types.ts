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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      card_background_images: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_url: string
          height: number
          id: string
          tags: string[] | null
          uploaded_at: string
          width: number
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_url: string
          height?: number
          id?: string
          tags?: string[] | null
          uploaded_at?: string
          width?: number
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_url?: string
          height?: number
          id?: string
          tags?: string[] | null
          uploaded_at?: string
          width?: number
        }
        Relationships: []
      }
      character_abilities: {
        Row: {
          ability_type: string
          affected_attribute: string | null
          attribute_modifier: number | null
          base_power_cost: number
          conditional_description: string | null
          conditional_type: string | null
          created_at: string
          description: string | null
          effect_type: string
          id: string
          name: string
          range_type: string | null
          updated_at: string
        }
        Insert: {
          ability_type?: string
          affected_attribute?: string | null
          attribute_modifier?: number | null
          base_power_cost?: number
          conditional_description?: string | null
          conditional_type?: string | null
          created_at?: string
          description?: string | null
          effect_type?: string
          id?: string
          name: string
          range_type?: string | null
          updated_at?: string
        }
        Update: {
          ability_type?: string
          affected_attribute?: string | null
          attribute_modifier?: number | null
          base_power_cost?: number
          conditional_description?: string | null
          conditional_type?: string | null
          created_at?: string
          description?: string | null
          effect_type?: string
          id?: string
          name?: string
          range_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      character_cards: {
        Row: {
          ability_id: string | null
          character_type: string[]
          coat_of_arms_url: string | null
          comando: number
          created_at: string
          culture: string
          custom_ability_description: string | null
          custom_ability_name: string | null
          custom_ability_power_cost: number | null
          domain: string | null
          estrategia: number
          guarda: number
          id: string
          name: string
          notes: string | null
          passive_affects_area: boolean | null
          passive_bonus_type: string | null
          passive_bonus_value: number | null
          portrait_url: string | null
          power_cost_override: number | null
          specialties: string[]
          total_power_cost: number
          updated_at: string
        }
        Insert: {
          ability_id?: string | null
          character_type?: string[]
          coat_of_arms_url?: string | null
          comando?: number
          created_at?: string
          culture: string
          custom_ability_description?: string | null
          custom_ability_name?: string | null
          custom_ability_power_cost?: number | null
          domain?: string | null
          estrategia?: number
          guarda?: number
          id?: string
          name: string
          notes?: string | null
          passive_affects_area?: boolean | null
          passive_bonus_type?: string | null
          passive_bonus_value?: number | null
          portrait_url?: string | null
          power_cost_override?: number | null
          specialties?: string[]
          total_power_cost?: number
          updated_at?: string
        }
        Update: {
          ability_id?: string | null
          character_type?: string[]
          coat_of_arms_url?: string | null
          comando?: number
          created_at?: string
          culture?: string
          custom_ability_description?: string | null
          custom_ability_name?: string | null
          custom_ability_power_cost?: number | null
          domain?: string | null
          estrategia?: number
          guarda?: number
          id?: string
          name?: string
          notes?: string | null
          passive_affects_area?: boolean | null
          passive_bonus_type?: string | null
          passive_bonus_value?: number | null
          portrait_url?: string | null
          power_cost_override?: number | null
          specialties?: string[]
          total_power_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_cards_ability_id_fkey"
            columns: ["ability_id"]
            isOneToOne: false
            referencedRelation: "character_abilities"
            referencedColumns: ["id"]
          },
        ]
      }
      character_system_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      field_commanders: {
        Row: {
          ac: number | null
          ataque: string | null
          classe: string | null
          coat_of_arms_url: string | null
          comando: number
          commander_photo_url: string | null
          created_at: string
          cultura_origem: string
          dominio: string | null
          especializacao_inicial: string
          especializacoes_adicionais: string[]
          estrategia: number
          guarda: number
          habilidades: string | null
          hit_points: number | null
          id: string
          idade: number | null
          nivel: number | null
          nome_comandante: string
          notas: string | null
          pontos_prestigio: number
          regent_id: string | null
          unidade_de_origem: string | null
          updated_at: string
        }
        Insert: {
          ac?: number | null
          ataque?: string | null
          classe?: string | null
          coat_of_arms_url?: string | null
          comando?: number
          commander_photo_url?: string | null
          created_at?: string
          cultura_origem: string
          dominio?: string | null
          especializacao_inicial: string
          especializacoes_adicionais?: string[]
          estrategia?: number
          guarda?: number
          habilidades?: string | null
          hit_points?: number | null
          id?: string
          idade?: number | null
          nivel?: number | null
          nome_comandante: string
          notas?: string | null
          pontos_prestigio?: number
          regent_id?: string | null
          unidade_de_origem?: string | null
          updated_at?: string
        }
        Update: {
          ac?: number | null
          ataque?: string | null
          classe?: string | null
          coat_of_arms_url?: string | null
          comando?: number
          commander_photo_url?: string | null
          created_at?: string
          cultura_origem?: string
          dominio?: string | null
          especializacao_inicial?: string
          especializacoes_adicionais?: string[]
          estrategia?: number
          guarda?: number
          habilidades?: string | null
          hit_points?: number | null
          id?: string
          idade?: number | null
          nivel?: number | null
          nome_comandante?: string
          notas?: string | null
          pontos_prestigio?: number
          regent_id?: string | null
          unidade_de_origem?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          created_at: string
          holding_type: Database["public"]["Enums"]["holding_type"]
          id: string
          level: number
          notes: string | null
          province_id: string
          regent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          holding_type: Database["public"]["Enums"]["holding_type"]
          id?: string
          level?: number
          notes?: string | null
          province_id: string
          regent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          holding_type?: Database["public"]["Enums"]["holding_type"]
          id?: string
          level?: number
          notes?: string | null
          province_id?: string
          regent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_regent_id_fkey"
            columns: ["regent_id"]
            isOneToOne: false
            referencedRelation: "regents"
            referencedColumns: ["id"]
          },
        ]
      }
      province_distances: {
        Row: {
          created_at: string
          distance_km: number
          from_province_name: string
          id: string
          to_province_name: string
        }
        Insert: {
          created_at?: string
          distance_km: number
          from_province_name: string
          id?: string
          to_province_name: string
        }
        Update: {
          created_at?: string
          distance_km?: number
          from_province_name?: string
          id?: string
          to_province_name?: string
        }
        Relationships: []
      }
      provinces: {
        Row: {
          arcane_line_level: number
          created_at: string
          cultura: string | null
          development: number
          fortification_level: number
          has_path: boolean
          has_port: boolean
          has_river: boolean
          id: string
          magic: number
          name: string
          realm_id: string
          road_level: number
          terrain_type: string | null
          updated_at: string
        }
        Insert: {
          arcane_line_level?: number
          created_at?: string
          cultura?: string | null
          development?: number
          fortification_level?: number
          has_path?: boolean
          has_port?: boolean
          has_river?: boolean
          id?: string
          magic?: number
          name: string
          realm_id: string
          road_level?: number
          terrain_type?: string | null
          updated_at?: string
        }
        Update: {
          arcane_line_level?: number
          created_at?: string
          cultura?: string | null
          development?: number
          fortification_level?: number
          has_path?: boolean
          has_port?: boolean
          has_river?: boolean
          id?: string
          magic?: number
          name?: string
          realm_id?: string
          road_level?: number
          terrain_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provinces_realm_id_fkey"
            columns: ["realm_id"]
            isOneToOne: false
            referencedRelation: "realms"
            referencedColumns: ["id"]
          },
        ]
      }
      realms: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      regents: {
        Row: {
          code: string | null
          created_at: string
          full_name: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tactical_cards: {
        Row: {
          affected_unit_types: string[]
          affects_enemy_unit: boolean
          attack_bonus: number
          bonus_cultures: string[]
          card_type: Database["public"]["Enums"]["tactical_card_type"]
          created_at: string
          defense_bonus: number
          description: string | null
          extra_lethal_damage: number
          extra_pressure_damage: number
          id: string
          ignores_pressure: boolean
          morale_bonus: number
          name: string
          penalty_cultures: string[]
          ranged_bonus: number
          required_command: number
          requires_specialization: boolean
          subtype: Database["public"]["Enums"]["tactical_card_subtype"]
          targets_outside_commander_unit: boolean
          updated_at: string
        }
        Insert: {
          affected_unit_types?: string[]
          affects_enemy_unit?: boolean
          attack_bonus?: number
          bonus_cultures?: string[]
          card_type: Database["public"]["Enums"]["tactical_card_type"]
          created_at?: string
          defense_bonus?: number
          description?: string | null
          extra_lethal_damage?: number
          extra_pressure_damage?: number
          id?: string
          ignores_pressure?: boolean
          morale_bonus?: number
          name: string
          penalty_cultures?: string[]
          ranged_bonus?: number
          required_command?: number
          requires_specialization?: boolean
          subtype: Database["public"]["Enums"]["tactical_card_subtype"]
          targets_outside_commander_unit?: boolean
          updated_at?: string
        }
        Update: {
          affected_unit_types?: string[]
          affects_enemy_unit?: boolean
          attack_bonus?: number
          bonus_cultures?: string[]
          card_type?: Database["public"]["Enums"]["tactical_card_type"]
          created_at?: string
          defense_bonus?: number
          description?: string | null
          extra_lethal_damage?: number
          extra_pressure_damage?: number
          id?: string
          ignores_pressure?: boolean
          morale_bonus?: number
          name?: string
          penalty_cultures?: string[]
          ranged_bonus?: number
          required_command?: number
          requires_specialization?: boolean
          subtype?: Database["public"]["Enums"]["tactical_card_subtype"]
          targets_outside_commander_unit?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      terrain_types: {
        Row: {
          created_at: string
          defense_mod: number
          id: string
          image_url: string | null
          level: number
          mod_anuire: string | null
          mod_brecht: string | null
          mod_khinasi: string | null
          mod_rjurik: string | null
          mod_vos: string | null
          morale_mod: number
          movement_mod: string
          name: string
          ranged_mod: number
          special: string | null
          tag: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          defense_mod?: number
          id?: string
          image_url?: string | null
          level?: number
          mod_anuire?: string | null
          mod_brecht?: string | null
          mod_khinasi?: string | null
          mod_rjurik?: string | null
          mod_vos?: string | null
          morale_mod?: number
          movement_mod?: string
          name: string
          ranged_mod?: number
          special?: string | null
          tag?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          defense_mod?: number
          id?: string
          image_url?: string | null
          level?: number
          mod_anuire?: string | null
          mod_brecht?: string | null
          mod_khinasi?: string | null
          mod_rjurik?: string | null
          mod_vos?: string | null
          morale_mod?: number
          movement_mod?: string
          name?: string
          ranged_mod?: number
          special?: string | null
          tag?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      travel_speeds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          speed_km_per_day: number
          travel_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          speed_km_per_day: number
          travel_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          speed_km_per_day?: number
          travel_type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      commander_specialization:
        | "Infantaria"
        | "Cavalaria"
        | "Arqueiro"
        | "Cerco"
        | "Milicia"
        | "Elite"
        | "Naval"
      holding_type: "ordem" | "guilda" | "templo" | "fonte_magica"
      tactical_card_subtype: "Buff" | "Debuff" | "Neutra" | "Instantânea"
      tactical_card_type: "Ataque" | "Defesa" | "Movimento" | "Moral"
      tactical_culture: "Anuire" | "Khinasi" | "Vos" | "Rjurik" | "Brecht"
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
      commander_specialization: [
        "Infantaria",
        "Cavalaria",
        "Arqueiro",
        "Cerco",
        "Milicia",
        "Elite",
        "Naval",
      ],
      holding_type: ["ordem", "guilda", "templo", "fonte_magica"],
      tactical_card_subtype: ["Buff", "Debuff", "Neutra", "Instantânea"],
      tactical_card_type: ["Ataque", "Defesa", "Movimento", "Moral"],
      tactical_culture: ["Anuire", "Khinasi", "Vos", "Rjurik", "Brecht"],
    },
  },
} as const
