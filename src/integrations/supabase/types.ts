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
          game_mode: string
          guarda: number
          id: string
          is_pc: boolean
          name: string
          notes: string | null
          passive_affects_area: boolean | null
          passive_bonus_type: string | null
          passive_bonus_value: number | null
          player_name: string | null
          portrait_url: string | null
          power_cost_override: number | null
          regent_id: string | null
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
          game_mode?: string
          guarda?: number
          id?: string
          is_pc?: boolean
          name: string
          notes?: string | null
          passive_affects_area?: boolean | null
          passive_bonus_type?: string | null
          passive_bonus_value?: number | null
          player_name?: string | null
          portrait_url?: string | null
          power_cost_override?: number | null
          regent_id?: string | null
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
          game_mode?: string
          guarda?: number
          id?: string
          is_pc?: boolean
          name?: string
          notes?: string | null
          passive_affects_area?: boolean | null
          passive_bonus_type?: string | null
          passive_bonus_value?: number | null
          player_name?: string | null
          portrait_url?: string | null
          power_cost_override?: number | null
          regent_id?: string | null
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
          {
            foreignKeyName: "character_cards_regent_id_fkey"
            columns: ["regent_id"]
            isOneToOne: false
            referencedRelation: "regents"
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
      hexagon_background_images: {
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
      mass_combat_cultures: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          season_affinity: string
          special_ability: string
          specialization: string
          terrain_affinity: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          season_affinity: string
          special_ability: string
          specialization: string
          terrain_affinity: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          season_affinity?: string
          special_ability?: string
          specialization?: string
          terrain_affinity?: string
          updated_at?: string
        }
        Relationships: []
      }
      mass_combat_primary_terrains: {
        Row: {
          allowed_climates: string[]
          attack_mod: number
          created_at: string
          default_climate: string
          defense_mod: number
          description: string | null
          id: string
          image_url: string | null
          mobility_mod: number
          name: string
          updated_at: string
          visibility: string
        }
        Insert: {
          allowed_climates?: string[]
          attack_mod?: number
          created_at?: string
          default_climate?: string
          defense_mod?: number
          description?: string | null
          id?: string
          image_url?: string | null
          mobility_mod?: number
          name: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          allowed_climates?: string[]
          attack_mod?: number
          created_at?: string
          default_climate?: string
          defense_mod?: number
          description?: string | null
          id?: string
          image_url?: string | null
          mobility_mod?: number
          name?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      mass_combat_seasons: {
        Row: {
          condition1_modifier: number
          condition1_name: string
          condition2_modifier: number
          condition2_name: string
          condition3_modifier: number
          condition3_name: string
          created_at: string
          description: string | null
          id: string
          modifier_type: string
          name: string
          updated_at: string
        }
        Insert: {
          condition1_modifier?: number
          condition1_name: string
          condition2_modifier?: number
          condition2_name: string
          condition3_modifier?: number
          condition3_name: string
          created_at?: string
          description?: string | null
          id?: string
          modifier_type: string
          name: string
          updated_at?: string
        }
        Update: {
          condition1_modifier?: number
          condition1_name?: string
          condition2_modifier?: number
          condition2_name?: string
          condition3_modifier?: number
          condition3_name?: string
          created_at?: string
          description?: string | null
          id?: string
          modifier_type?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mass_combat_secondary_terrains: {
        Row: {
          attack_mod: number
          created_at: string
          defense_mod: number
          description: string | null
          effect_description: string | null
          effect_tag: string | null
          id: string
          image_url: string | null
          is_universal: boolean
          mobility_mod: number
          name: string
          special_effects: string | null
          strategy_mod: number
          style: string | null
          updated_at: string
        }
        Insert: {
          attack_mod?: number
          created_at?: string
          defense_mod?: number
          description?: string | null
          effect_description?: string | null
          effect_tag?: string | null
          id?: string
          image_url?: string | null
          is_universal?: boolean
          mobility_mod?: number
          name: string
          special_effects?: string | null
          strategy_mod?: number
          style?: string | null
          updated_at?: string
        }
        Update: {
          attack_mod?: number
          created_at?: string
          defense_mod?: number
          description?: string | null
          effect_description?: string | null
          effect_tag?: string | null
          id?: string
          image_url?: string | null
          is_universal?: boolean
          mobility_mod?: number
          name?: string
          special_effects?: string | null
          strategy_mod?: number
          style?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mass_combat_tactical_cards: {
        Row: {
          attack_bonus: number
          command_required: number
          created_at: string
          culture: string | null
          defense_bonus: number
          description: string | null
          effect_tag: string | null
          effect_type: string | null
          game_mode: string
          id: string
          mobility_bonus: number
          name: string
          strategy_required: number
          unit_type: string
          updated_at: string
          vet_cost: number
        }
        Insert: {
          attack_bonus?: number
          command_required?: number
          created_at?: string
          culture?: string | null
          defense_bonus?: number
          description?: string | null
          effect_tag?: string | null
          effect_type?: string | null
          game_mode?: string
          id?: string
          mobility_bonus?: number
          name: string
          strategy_required?: number
          unit_type: string
          updated_at?: string
          vet_cost?: number
        }
        Update: {
          attack_bonus?: number
          command_required?: number
          created_at?: string
          culture?: string | null
          defense_bonus?: number
          description?: string | null
          effect_tag?: string | null
          effect_type?: string | null
          game_mode?: string
          id?: string
          mobility_bonus?: number
          name?: string
          strategy_required?: number
          unit_type?: string
          updated_at?: string
          vet_cost?: number
        }
        Relationships: []
      }
      mass_combat_terrain_compatibility: {
        Row: {
          created_at: string
          id: string
          primary_terrain_id: string
          secondary_terrain_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          primary_terrain_id: string
          secondary_terrain_id: string
        }
        Update: {
          created_at?: string
          id?: string
          primary_terrain_id?: string
          secondary_terrain_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mass_combat_terrain_compatibility_primary_terrain_id_fkey"
            columns: ["primary_terrain_id"]
            isOneToOne: false
            referencedRelation: "mass_combat_primary_terrains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mass_combat_terrain_compatibility_secondary_terrain_id_fkey"
            columns: ["secondary_terrain_id"]
            isOneToOne: false
            referencedRelation: "mass_combat_secondary_terrains"
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
          culture: string | null
          id: string
          name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          culture?: string | null
          id?: string
          name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          culture?: string | null
          id?: string
          name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regents: {
        Row: {
          character: string | null
          code: string | null
          comando: number
          created_at: string
          domain: string | null
          estrategia: number
          full_name: string | null
          gold_bars: number
          id: string
          name: string
          notes: string | null
          regency_points: number
          updated_at: string
        }
        Insert: {
          character?: string | null
          code?: string | null
          comando?: number
          created_at?: string
          domain?: string | null
          estrategia?: number
          full_name?: string | null
          gold_bars?: number
          id?: string
          name: string
          notes?: string | null
          regency_points?: number
          updated_at?: string
        }
        Update: {
          character?: string | null
          code?: string | null
          comando?: number
          created_at?: string
          domain?: string | null
          estrategia?: number
          full_name?: string | null
          gold_bars?: number
          id?: string
          name?: string
          notes?: string | null
          regency_points?: number
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
          game_mode: string
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
          game_mode?: string
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
          game_mode?: string
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
      unit_instances: {
        Row: {
          army_id: string | null
          attack: number
          background_image: string | null
          battles_fought: number
          battles_won: number
          commander_id: string | null
          created_at: string
          creation_cost: number
          current_posture: Database["public"]["Enums"]["unit_posture"] | null
          current_xp: number
          custom_background_image: string | null
          defense: number
          experience: Database["public"]["Enums"]["experience_level"]
          hits: number
          id: string
          is_disbanded: boolean
          is_garrisoned: boolean
          maintenance_cost: number
          morale: number
          movement: number
          name: string
          normal_pressure: number
          permanent_pressure: number
          province_id: string | null
          ranged: number
          regent_id: string | null
          special_abilities: Json
          template_id: string | null
          total_force: number
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          army_id?: string | null
          attack?: number
          background_image?: string | null
          battles_fought?: number
          battles_won?: number
          commander_id?: string | null
          created_at?: string
          creation_cost?: number
          current_posture?: Database["public"]["Enums"]["unit_posture"] | null
          current_xp?: number
          custom_background_image?: string | null
          defense?: number
          experience?: Database["public"]["Enums"]["experience_level"]
          hits?: number
          id?: string
          is_disbanded?: boolean
          is_garrisoned?: boolean
          maintenance_cost?: number
          morale?: number
          movement?: number
          name: string
          normal_pressure?: number
          permanent_pressure?: number
          province_id?: string | null
          ranged?: number
          regent_id?: string | null
          special_abilities?: Json
          template_id?: string | null
          total_force?: number
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          army_id?: string | null
          attack?: number
          background_image?: string | null
          battles_fought?: number
          battles_won?: number
          commander_id?: string | null
          created_at?: string
          creation_cost?: number
          current_posture?: Database["public"]["Enums"]["unit_posture"] | null
          current_xp?: number
          custom_background_image?: string | null
          defense?: number
          experience?: Database["public"]["Enums"]["experience_level"]
          hits?: number
          id?: string
          is_disbanded?: boolean
          is_garrisoned?: boolean
          maintenance_cost?: number
          morale?: number
          movement?: number
          name?: string
          normal_pressure?: number
          permanent_pressure?: number
          province_id?: string | null
          ranged?: number
          regent_id?: string | null
          special_abilities?: Json
          template_id?: string | null
          total_force?: number
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_instances_commander_id_fkey"
            columns: ["commander_id"]
            isOneToOne: false
            referencedRelation: "field_commanders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_instances_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_instances_regent_id_fkey"
            columns: ["regent_id"]
            isOneToOne: false
            referencedRelation: "regents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "unit_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_templates: {
        Row: {
          attack: number
          background_image: string | null
          created_at: string
          defense: number
          experience: Database["public"]["Enums"]["experience_level"]
          id: string
          maintenance_cost: number
          morale: number
          movement: number
          name: string
          ranged: number
          source_file: string | null
          special_abilities: Json
          total_force: number
          updated_at: string
        }
        Insert: {
          attack?: number
          background_image?: string | null
          created_at?: string
          defense?: number
          experience?: Database["public"]["Enums"]["experience_level"]
          id?: string
          maintenance_cost?: number
          morale?: number
          movement?: number
          name: string
          ranged?: number
          source_file?: string | null
          special_abilities?: Json
          total_force?: number
          updated_at?: string
        }
        Update: {
          attack?: number
          background_image?: string | null
          created_at?: string
          defense?: number
          experience?: Database["public"]["Enums"]["experience_level"]
          id?: string
          maintenance_cost?: number
          morale?: number
          movement?: number
          name?: string
          ranged?: number
          source_file?: string | null
          special_abilities?: Json
          total_force?: number
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
      experience_level:
        | "Amador"
        | "Recruta"
        | "Profissional"
        | "Veterano"
        | "Elite"
        | "Lendário"
      holding_type: "ordem" | "guilda" | "templo" | "fonte_magica"
      tactical_card_subtype: "Buff" | "Debuff" | "Neutra" | "Instantânea"
      tactical_card_type: "Ataque" | "Defesa" | "Movimento" | "Moral"
      tactical_culture: "Anuire" | "Khinasi" | "Vos" | "Rjurik" | "Brecht"
      unit_posture: "Ofensiva" | "Defensiva" | "Carga" | "Reorganização"
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
      experience_level: [
        "Amador",
        "Recruta",
        "Profissional",
        "Veterano",
        "Elite",
        "Lendário",
      ],
      holding_type: ["ordem", "guilda", "templo", "fonte_magica"],
      tactical_card_subtype: ["Buff", "Debuff", "Neutra", "Instantânea"],
      tactical_card_type: ["Ataque", "Defesa", "Movimento", "Moral"],
      tactical_culture: ["Anuire", "Khinasi", "Vos", "Rjurik", "Brecht"],
      unit_posture: ["Ofensiva", "Defensiva", "Carga", "Reorganização"],
    },
  },
} as const
