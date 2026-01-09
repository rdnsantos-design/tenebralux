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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      characters: {
        Row: {
          created_at: string | null
          culture_id: string | null
          data: Json
          faction_id: string | null
          id: string
          is_public: boolean | null
          name: string
          share_code: string | null
          theme: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          culture_id?: string | null
          data: Json
          faction_id?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          share_code?: string | null
          theme?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          culture_id?: string | null
          data?: Json
          faction_id?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          share_code?: string | null
          theme?: string
          updated_at?: string | null
          user_id?: string
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      galaxy_factions: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          percent: number
          planets_count: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id: string
          name: string
          percent?: number
          planets_count?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          percent?: number
          planets_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      galaxy_lore_sections: {
        Row: {
          content: string
          created_at: string
          faction_id: string | null
          id: string
          section_type: string
          sort_order: number | null
          sub_section: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          faction_id?: string | null
          id?: string
          section_type: string
          sort_order?: number | null
          sub_section?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          faction_id?: string | null
          id?: string
          section_type?: string
          sort_order?: number | null
          sub_section?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      galaxy_organizations: {
        Row: {
          content: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          organization_type: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          organization_type: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          organization_type?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      galaxy_planets: {
        Row: {
          created_at: string
          d: number
          def: number
          descricao: string | null
          distancia: number
          faccao: string
          funcao: string
          id: number
          nome: string
          pcp_gasto: number
          pcp_total: number
          populacao: number
          r: number
          regiao: string
          slots_com: number
          slots_prod: number
          slots_soc: number
          tags_negativas: string | null
          tags_positivas: string | null
          tier: number
          tipo: string
          updated_at: string
          x: number
          y: number
          z: number
          zona: string
        }
        Insert: {
          created_at?: string
          d?: number
          def?: number
          descricao?: string | null
          distancia?: number
          faccao: string
          funcao?: string
          id?: number
          nome: string
          pcp_gasto?: number
          pcp_total?: number
          populacao?: number
          r?: number
          regiao: string
          slots_com?: number
          slots_prod?: number
          slots_soc?: number
          tags_negativas?: string | null
          tags_positivas?: string | null
          tier?: number
          tipo?: string
          updated_at?: string
          x?: number
          y?: number
          z?: number
          zona?: string
        }
        Update: {
          created_at?: string
          d?: number
          def?: number
          descricao?: string | null
          distancia?: number
          faccao?: string
          funcao?: string
          id?: number
          nome?: string
          pcp_gasto?: number
          pcp_total?: number
          populacao?: number
          r?: number
          regiao?: string
          slots_com?: number
          slots_prod?: number
          slots_soc?: number
          tags_negativas?: string | null
          tags_positivas?: string | null
          tier?: number
          tipo?: string
          updated_at?: string
          x?: number
          y?: number
          z?: number
          zona?: string
        }
        Relationships: []
      }
      game_played_cards: {
        Row: {
          card_id: string
          created_at: string
          id: string
          phase: string
          player_number: number
          round: number
          session_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          phase: string
          player_number: number
          round: number
          session_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          phase?: string
          player_number?: number
          round?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_played_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "mass_combat_tactical_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_played_cards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_round_results: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          player1_result: Json | null
          player2_result: Json | null
          round: number
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          player1_result?: Json | null
          player2_result?: Json | null
          round: number
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          player1_result?: Json | null
          player2_result?: Json | null
          round?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_round_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          current_phase: string | null
          current_round: number | null
          game_state: Json | null
          id: string
          player1_army_id: string | null
          player1_nickname: string | null
          player1_ready: boolean | null
          player2_army_id: string | null
          player2_nickname: string | null
          player2_ready: boolean | null
          room_code: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_phase?: string | null
          current_round?: number | null
          game_state?: Json | null
          id?: string
          player1_army_id?: string | null
          player1_nickname?: string | null
          player1_ready?: boolean | null
          player2_army_id?: string | null
          player2_nickname?: string | null
          player2_ready?: boolean | null
          room_code: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_phase?: string | null
          current_round?: number | null
          game_state?: Json | null
          id?: string
          player1_army_id?: string | null
          player1_nickname?: string | null
          player1_ready?: boolean | null
          player2_army_id?: string | null
          player2_nickname?: string | null
          player2_ready?: boolean | null
          room_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_player1_army_id_fkey"
            columns: ["player1_army_id"]
            isOneToOne: false
            referencedRelation: "strategic_armies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_player2_army_id_fkey"
            columns: ["player2_army_id"]
            isOneToOne: false
            referencedRelation: "strategic_armies"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      mass_combat_commander_templates: {
        Row: {
          comando: number
          created_at: string
          custo_vet: number
          especializacao: string
          estrategia: number
          guarda: number
          id: string
          numero: number
          updated_at: string
        }
        Insert: {
          comando?: number
          created_at?: string
          custo_vet?: number
          especializacao: string
          estrategia?: number
          guarda?: number
          id?: string
          numero: number
          updated_at?: string
        }
        Update: {
          comando?: number
          created_at?: string
          custo_vet?: number
          especializacao?: string
          estrategia?: number
          guarda?: number
          id?: string
          numero?: number
          updated_at?: string
        }
        Relationships: []
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
          attack_penalty: number
          card_type: string
          command_required: number
          created_at: string
          culture: string | null
          defense_bonus: number
          defense_penalty: number
          description: string | null
          effect_tag: string | null
          effect_type: string | null
          game_mode: string
          id: string
          major_condition: string | null
          major_effect: string | null
          minor_condition: string | null
          minor_effect: string | null
          mobility_bonus: number
          mobility_penalty: number
          name: string
          strategy_required: number
          unit_type: string
          updated_at: string
          vet_cost: number
          vet_cost_override: number | null
        }
        Insert: {
          attack_bonus?: number
          attack_penalty?: number
          card_type?: string
          command_required?: number
          created_at?: string
          culture?: string | null
          defense_bonus?: number
          defense_penalty?: number
          description?: string | null
          effect_tag?: string | null
          effect_type?: string | null
          game_mode?: string
          id?: string
          major_condition?: string | null
          major_effect?: string | null
          minor_condition?: string | null
          minor_effect?: string | null
          mobility_bonus?: number
          mobility_penalty?: number
          name: string
          strategy_required?: number
          unit_type: string
          updated_at?: string
          vet_cost?: number
          vet_cost_override?: number | null
        }
        Update: {
          attack_bonus?: number
          attack_penalty?: number
          card_type?: string
          command_required?: number
          created_at?: string
          culture?: string | null
          defense_bonus?: number
          defense_penalty?: number
          description?: string | null
          effect_tag?: string | null
          effect_type?: string | null
          game_mode?: string
          id?: string
          major_condition?: string | null
          major_effect?: string | null
          minor_condition?: string | null
          minor_effect?: string | null
          mobility_bonus?: number
          mobility_penalty?: number
          name?: string
          strategy_required?: number
          unit_type?: string
          updated_at?: string
          vet_cost?: number
          vet_cost_override?: number | null
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
      match_actions: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string
          id: string
          phase: Database["public"]["Enums"]["game_phase"]
          player_number: number
          room_id: string
          state_version: number
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string
          id?: string
          phase: Database["public"]["Enums"]["game_phase"]
          player_number: number
          room_id: string
          state_version: number
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          phase?: Database["public"]["Enums"]["game_phase"]
          player_number?: number
          room_id?: string
          state_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_actions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      match_state: {
        Row: {
          chosen_season_id: string | null
          chosen_secondary_terrain_id: string | null
          chosen_terrain_id: string | null
          combat_board_state: Json | null
          combat_phase: string | null
          combat_round: number
          created_at: string
          current_action_stack: Json | null
          first_attacker_player_number: number | null
          game_seed: string | null
          id: string
          initiative_roll_result: Json | null
          logistics_budget: number
          logistics_resolved: boolean
          logistics_round: number
          player1_army_attributes: Json | null
          player1_basic_cards_granted: boolean
          player1_basic_cards_state: Json | null
          player1_basic_cards_used: Json | null
          player1_cmd_state: Json | null
          player1_commanders: Json | null
          player1_culture: string | null
          player1_culture_confirmed: boolean
          player1_deck: Json | null
          player1_deck_confirmed: boolean
          player1_deployment_confirmed: boolean | null
          player1_deployment_formation: string | null
          player1_discard: Json | null
          player1_draw_pile: Json
          player1_general_id: string | null
          player1_hand: Json | null
          player1_hp: number | null
          player1_logistics_bid: number | null
          player1_logistics_confirmed: boolean
          player1_round1_bid: Json | null
          player1_round2_bid: Json | null
          player1_tiebreak_bid: number | null
          player1_tiebreak_confirmed: boolean
          player1_vet_budget: number
          player1_vet_remaining: number | null
          player1_vet_spent: number
          player2_army_attributes: Json | null
          player2_basic_cards_granted: boolean
          player2_basic_cards_state: Json | null
          player2_basic_cards_used: Json | null
          player2_cmd_state: Json | null
          player2_commanders: Json | null
          player2_culture: string | null
          player2_culture_confirmed: boolean
          player2_deck: Json | null
          player2_deck_confirmed: boolean
          player2_deployment_confirmed: boolean | null
          player2_deployment_formation: string | null
          player2_discard: Json | null
          player2_draw_pile: Json
          player2_general_id: string | null
          player2_hand: Json | null
          player2_hp: number | null
          player2_logistics_bid: number | null
          player2_logistics_confirmed: boolean
          player2_round1_bid: Json | null
          player2_round2_bid: Json | null
          player2_tiebreak_bid: number | null
          player2_tiebreak_confirmed: boolean
          player2_vet_budget: number
          player2_vet_remaining: number | null
          player2_vet_spent: number
          room_id: string
          scenario_options: Json | null
          scenario_winner: number | null
          season_tiebreak_eligible: Json | null
          selected_season_id: string | null
          selected_terrain_id: string | null
          terrain_tiebreak_eligible: Json | null
          tiebreak_players: number[] | null
          tiebreak_required: boolean
          updated_at: string
          version: number
          vet_agreed: number
          vet_cost_logistics_p1: number
          vet_cost_logistics_p2: number
        }
        Insert: {
          chosen_season_id?: string | null
          chosen_secondary_terrain_id?: string | null
          chosen_terrain_id?: string | null
          combat_board_state?: Json | null
          combat_phase?: string | null
          combat_round?: number
          created_at?: string
          current_action_stack?: Json | null
          first_attacker_player_number?: number | null
          game_seed?: string | null
          id?: string
          initiative_roll_result?: Json | null
          logistics_budget?: number
          logistics_resolved?: boolean
          logistics_round?: number
          player1_army_attributes?: Json | null
          player1_basic_cards_granted?: boolean
          player1_basic_cards_state?: Json | null
          player1_basic_cards_used?: Json | null
          player1_cmd_state?: Json | null
          player1_commanders?: Json | null
          player1_culture?: string | null
          player1_culture_confirmed?: boolean
          player1_deck?: Json | null
          player1_deck_confirmed?: boolean
          player1_deployment_confirmed?: boolean | null
          player1_deployment_formation?: string | null
          player1_discard?: Json | null
          player1_draw_pile?: Json
          player1_general_id?: string | null
          player1_hand?: Json | null
          player1_hp?: number | null
          player1_logistics_bid?: number | null
          player1_logistics_confirmed?: boolean
          player1_round1_bid?: Json | null
          player1_round2_bid?: Json | null
          player1_tiebreak_bid?: number | null
          player1_tiebreak_confirmed?: boolean
          player1_vet_budget?: number
          player1_vet_remaining?: number | null
          player1_vet_spent?: number
          player2_army_attributes?: Json | null
          player2_basic_cards_granted?: boolean
          player2_basic_cards_state?: Json | null
          player2_basic_cards_used?: Json | null
          player2_cmd_state?: Json | null
          player2_commanders?: Json | null
          player2_culture?: string | null
          player2_culture_confirmed?: boolean
          player2_deck?: Json | null
          player2_deck_confirmed?: boolean
          player2_deployment_confirmed?: boolean | null
          player2_deployment_formation?: string | null
          player2_discard?: Json | null
          player2_draw_pile?: Json
          player2_general_id?: string | null
          player2_hand?: Json | null
          player2_hp?: number | null
          player2_logistics_bid?: number | null
          player2_logistics_confirmed?: boolean
          player2_round1_bid?: Json | null
          player2_round2_bid?: Json | null
          player2_tiebreak_bid?: number | null
          player2_tiebreak_confirmed?: boolean
          player2_vet_budget?: number
          player2_vet_remaining?: number | null
          player2_vet_spent?: number
          room_id: string
          scenario_options?: Json | null
          scenario_winner?: number | null
          season_tiebreak_eligible?: Json | null
          selected_season_id?: string | null
          selected_terrain_id?: string | null
          terrain_tiebreak_eligible?: Json | null
          tiebreak_players?: number[] | null
          tiebreak_required?: boolean
          updated_at?: string
          version?: number
          vet_agreed?: number
          vet_cost_logistics_p1?: number
          vet_cost_logistics_p2?: number
        }
        Update: {
          chosen_season_id?: string | null
          chosen_secondary_terrain_id?: string | null
          chosen_terrain_id?: string | null
          combat_board_state?: Json | null
          combat_phase?: string | null
          combat_round?: number
          created_at?: string
          current_action_stack?: Json | null
          first_attacker_player_number?: number | null
          game_seed?: string | null
          id?: string
          initiative_roll_result?: Json | null
          logistics_budget?: number
          logistics_resolved?: boolean
          logistics_round?: number
          player1_army_attributes?: Json | null
          player1_basic_cards_granted?: boolean
          player1_basic_cards_state?: Json | null
          player1_basic_cards_used?: Json | null
          player1_cmd_state?: Json | null
          player1_commanders?: Json | null
          player1_culture?: string | null
          player1_culture_confirmed?: boolean
          player1_deck?: Json | null
          player1_deck_confirmed?: boolean
          player1_deployment_confirmed?: boolean | null
          player1_deployment_formation?: string | null
          player1_discard?: Json | null
          player1_draw_pile?: Json
          player1_general_id?: string | null
          player1_hand?: Json | null
          player1_hp?: number | null
          player1_logistics_bid?: number | null
          player1_logistics_confirmed?: boolean
          player1_round1_bid?: Json | null
          player1_round2_bid?: Json | null
          player1_tiebreak_bid?: number | null
          player1_tiebreak_confirmed?: boolean
          player1_vet_budget?: number
          player1_vet_remaining?: number | null
          player1_vet_spent?: number
          player2_army_attributes?: Json | null
          player2_basic_cards_granted?: boolean
          player2_basic_cards_state?: Json | null
          player2_basic_cards_used?: Json | null
          player2_cmd_state?: Json | null
          player2_commanders?: Json | null
          player2_culture?: string | null
          player2_culture_confirmed?: boolean
          player2_deck?: Json | null
          player2_deck_confirmed?: boolean
          player2_deployment_confirmed?: boolean | null
          player2_deployment_formation?: string | null
          player2_discard?: Json | null
          player2_draw_pile?: Json
          player2_general_id?: string | null
          player2_hand?: Json | null
          player2_hp?: number | null
          player2_logistics_bid?: number | null
          player2_logistics_confirmed?: boolean
          player2_round1_bid?: Json | null
          player2_round2_bid?: Json | null
          player2_tiebreak_bid?: number | null
          player2_tiebreak_confirmed?: boolean
          player2_vet_budget?: number
          player2_vet_remaining?: number | null
          player2_vet_spent?: number
          room_id?: string
          scenario_options?: Json | null
          scenario_winner?: number | null
          season_tiebreak_eligible?: Json | null
          selected_season_id?: string | null
          selected_terrain_id?: string | null
          terrain_tiebreak_eligible?: Json | null
          tiebreak_players?: number[] | null
          tiebreak_required?: boolean
          updated_at?: string
          version?: number
          vet_agreed?: number
          vet_cost_logistics_p1?: number
          vet_cost_logistics_p2?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_state_chosen_secondary_terrain_id_fkey"
            columns: ["chosen_secondary_terrain_id"]
            isOneToOne: false
            referencedRelation: "mass_combat_secondary_terrains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_state_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          user_id: string | null
        }
        Insert: {
          created_at?: string
          culture?: string | null
          id?: string
          name: string
          region?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          culture?: string | null
          id?: string
          name?: string
          region?: string | null
          updated_at?: string
          user_id?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      room_players: {
        Row: {
          created_at: string
          id: string
          is_host: boolean
          nickname: string
          player_number: number
          room_id: string
          session_id: string
          status: Database["public"]["Enums"]["player_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_host?: boolean
          nickname: string
          player_number: number
          room_id: string
          session_id: string
          status?: Database["public"]["Enums"]["player_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_host?: boolean
          nickname?: string
          player_number?: number
          room_id?: string
          session_id?: string
          status?: Database["public"]["Enums"]["player_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          current_phase: Database["public"]["Enums"]["game_phase"]
          host_nickname: string
          id: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_phase?: Database["public"]["Enums"]["game_phase"]
          host_nickname: string
          id?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_phase?: Database["public"]["Enums"]["game_phase"]
          host_nickname?: string
          id?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: []
      }
      rpg_attributes: {
        Row: {
          created_at: string
          description: string
          focus_label: string | null
          icon: string
          id: string
          name: string
          sort_order: number
          theme: string
          updated_at: string
          virtue_id: string
        }
        Insert: {
          created_at?: string
          description: string
          focus_label?: string | null
          icon?: string
          id: string
          name: string
          sort_order?: number
          theme?: string
          updated_at?: string
          virtue_id: string
        }
        Update: {
          created_at?: string
          description?: string
          focus_label?: string | null
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          theme?: string
          updated_at?: string
          virtue_id?: string
        }
        Relationships: []
      }
      rpg_challenges: {
        Row: {
          created_at: string
          description: string
          effect: string | null
          id: string
          name: string
          privilege_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          effect?: string | null
          id: string
          name: string
          privilege_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          effect?: string | null
          id?: string
          name?: string
          privilege_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rpg_challenges_privilege_id_fkey"
            columns: ["privilege_id"]
            isOneToOne: false
            referencedRelation: "rpg_privileges"
            referencedColumns: ["id"]
          },
        ]
      }
      rpg_privilege_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      rpg_privileges: {
        Row: {
          category_id: string
          created_at: string
          description: string
          effect: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description: string
          effect?: string | null
          id: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          effect?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rpg_privileges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rpg_privilege_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rpg_skill_specializations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          skill_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          skill_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          skill_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rpg_skill_specializations_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "rpg_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      rpg_skills: {
        Row: {
          attribute_id: string
          created_at: string
          description: string
          id: string
          name: string
          sort_order: number
          theme: string
          updated_at: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          description: string
          id: string
          name: string
          sort_order?: number
          theme?: string
          updated_at?: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
          theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rpg_skills_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "rpg_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_armies: {
        Row: {
          attack: number
          commanders: Json
          created_at: string
          culture_id: string | null
          defense: number
          id: string
          mobility: number
          name: string
          province_id: string | null
          realm_id: string | null
          regent_id: string | null
          tactical_cards: Json
          total_vet: number
          updated_at: string
        }
        Insert: {
          attack?: number
          commanders?: Json
          created_at?: string
          culture_id?: string | null
          defense?: number
          id?: string
          mobility?: number
          name: string
          province_id?: string | null
          realm_id?: string | null
          regent_id?: string | null
          tactical_cards?: Json
          total_vet?: number
          updated_at?: string
        }
        Update: {
          attack?: number
          commanders?: Json
          created_at?: string
          culture_id?: string | null
          defense?: number
          id?: string
          mobility?: number
          name?: string
          province_id?: string | null
          realm_id?: string | null
          regent_id?: string | null
          tactical_cards?: Json
          total_vet?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_armies_culture_id_fkey"
            columns: ["culture_id"]
            isOneToOne: false
            referencedRelation: "mass_combat_cultures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_armies_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_armies_realm_id_fkey"
            columns: ["realm_id"]
            isOneToOne: false
            referencedRelation: "realms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_armies_regent_id_fkey"
            columns: ["regent_id"]
            isOneToOne: false
            referencedRelation: "regents"
            referencedColumns: ["id"]
          },
        ]
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
      tactical_game_actions: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string | null
          id: string
          match_id: string | null
          player_id: string
          resulting_state_hash: string | null
          sequence_number: number
        }
        Insert: {
          action_data: Json
          action_type: string
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_id: string
          resulting_state_hash?: string | null
          sequence_number?: number
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_id?: string
          resulting_state_hash?: string | null
          sequence_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "tactical_game_actions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "tactical_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      tactical_game_states: {
        Row: {
          id: string
          last_action_at: string | null
          last_action_by: string | null
          last_action_type: string | null
          match_id: string | null
          state: Json
          updated_at: string | null
          version: number | null
        }
        Insert: {
          id?: string
          last_action_at?: string | null
          last_action_by?: string | null
          last_action_type?: string | null
          match_id?: string | null
          state: Json
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          id?: string
          last_action_at?: string | null
          last_action_by?: string | null
          last_action_type?: string | null
          match_id?: string | null
          state?: Json
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tactical_game_states_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "tactical_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      tactical_matches: {
        Row: {
          allow_spectators: boolean | null
          created_at: string | null
          id: string
          join_code: string
          max_power_points: number | null
          player1_army_id: string | null
          player1_id: string
          player1_name: string
          player1_ready: boolean | null
          player2_army_id: string | null
          player2_id: string | null
          player2_name: string | null
          player2_ready: boolean | null
          primary_terrain_id: string | null
          season_id: string | null
          secondary_terrain_ids: string[] | null
          status: string | null
          turn_time_limit: number | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          allow_spectators?: boolean | null
          created_at?: string | null
          id?: string
          join_code: string
          max_power_points?: number | null
          player1_army_id?: string | null
          player1_id: string
          player1_name: string
          player1_ready?: boolean | null
          player2_army_id?: string | null
          player2_id?: string | null
          player2_name?: string | null
          player2_ready?: boolean | null
          primary_terrain_id?: string | null
          season_id?: string | null
          secondary_terrain_ids?: string[] | null
          status?: string | null
          turn_time_limit?: number | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          allow_spectators?: boolean | null
          created_at?: string | null
          id?: string
          join_code?: string
          max_power_points?: number | null
          player1_army_id?: string | null
          player1_id?: string
          player1_name?: string
          player1_ready?: boolean | null
          player2_army_id?: string | null
          player2_id?: string | null
          player2_name?: string | null
          player2_ready?: boolean | null
          primary_terrain_id?: string | null
          season_id?: string | null
          secondary_terrain_ids?: string[] | null
          status?: string | null
          turn_time_limit?: number | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tactical_matches_primary_terrain_id_fkey"
            columns: ["primary_terrain_id"]
            isOneToOne: false
            referencedRelation: "mass_combat_primary_terrains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tactical_matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "mass_combat_seasons"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_card_to_deck:
        | {
            Args: {
              p_card_id: string
              p_category: string
              p_player_number: number
              p_room_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_card_id: string
              p_category: string
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
      add_commander:
        | {
            Args: {
              p_commander_id: string
              p_player_number: number
              p_room_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_commander_id: string
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
      advance_combat_phase: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      apply_damage: {
        Args: { p_damage: number; p_room_id: string; p_target_player: number }
        Returns: Json
      }
      calc_option_totals: {
        Args: { p_bid1: Json; p_bid2: Json; p_options: Json }
        Returns: Json
      }
      calc_player_vet_spent: {
        Args: { p_player_number: number; p_room_id: string }
        Returns: number
      }
      choose_first_attacker: {
        Args: {
          p_attacker_player_number: number
          p_room_id: string
          p_session_id: string
        }
        Returns: Json
      }
      choose_secondary_terrain: {
        Args: {
          p_room_id: string
          p_secondary_terrain_id: string
          p_session_id: string
        }
        Returns: Json
      }
      confirm_attack_maneuvers: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      confirm_culture: {
        Args: {
          p_culture_id: string
          p_player_number: number
          p_room_id: string
        }
        Returns: Json
      }
      confirm_deckbuilding:
        | {
            Args: { p_player_number: number; p_room_id: string }
            Returns: Json
          }
        | { Args: { p_room_id: string; p_session_id: string }; Returns: Json }
      confirm_defense_maneuvers: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      confirm_deployment:
        | { Args: { p_room_id: string; p_session_id: string }; Returns: Json }
        | {
            Args: {
              p_formation?: string
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
      confirm_initiative: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      confirm_main: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      confirm_maneuver: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      confirm_reaction: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      create_room: {
        Args: { p_host_nickname: string; p_session_id: string }
        Returns: {
          player_id: string
          room_code: string
          room_id: string
        }[]
      }
      finalize_scenario: { Args: { p_room_id: string }; Returns: Json }
      generate_room_code: { Args: never; Returns: string }
      generate_share_code: { Args: never; Returns: string }
      generate_tactical_join_code: { Args: never; Returns: string }
      get_match_state:
        | { Args: { p_room_id: string }; Returns: Json }
        | { Args: { p_room_id: string; p_session_id: string }; Returns: Json }
      get_player_number_by_session: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: number
      }
      get_vet_status: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      join_room: {
        Args: { p_nickname: string; p_room_code: string; p_session_id: string }
        Returns: {
          player_id: string
          player_number: number
          room_id: string
        }[]
      }
      play_attack_maneuver: {
        Args: {
          p_card_index: number
          p_commander_instance_id: string
          p_room_id: string
          p_session_id: string
        }
        Returns: Json
      }
      play_card: {
        Args: {
          p_card_id: string
          p_room_id: string
          p_session_id: string
          p_target?: Json
        }
        Returns: Json
      }
      play_defense_maneuver: {
        Args: {
          p_card_index: number
          p_commander_instance_id: string
          p_room_id: string
          p_session_id: string
        }
        Returns: Json
      }
      play_reaction_turn: {
        Args: { p_card_index?: number; p_room_id: string; p_session_id: string }
        Returns: Json
      }
      react_countermaneuver: {
        Args: {
          p_room_id: string
          p_session_id: string
          p_trigger_action_id: string
        }
        Returns: Json
      }
      recalc_player_vet: {
        Args: { p_player_number: number; p_room_id: string }
        Returns: undefined
      }
      remove_card_from_deck:
        | {
            Args: {
              p_card_id: string
              p_category: string
              p_player_number: number
              p_room_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_card_id: string
              p_category: string
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
      remove_commander:
        | {
            Args: {
              p_commander_id: string
              p_player_number: number
              p_room_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_commander_id: string
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
      resolve_combat_roll: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      resolve_combat_round: { Args: { p_room_id: string }; Returns: Json }
      resolve_initiative_roll: {
        Args: { p_room_id: string; p_session_id: string }
        Returns: Json
      }
      resolve_logistics_round: {
        Args: { p_room_id: string; p_round_number: number }
        Returns: Json
      }
      select_initiative_card: {
        Args: { p_card_index?: number; p_room_id: string; p_session_id: string }
        Returns: Json
      }
      select_main_card: {
        Args: { p_card_index: number; p_room_id: string; p_session_id: string }
        Returns: Json
      }
      select_maneuver_card:
        | {
            Args: {
              p_card_index: number
              p_commander_instance_id: string
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_card_index: number
              p_commander_instance_id: string
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
      select_reaction_card: {
        Args: { p_card_index: number; p_room_id: string; p_session_id: string }
        Returns: Json
      }
      set_army_attributes:
        | {
            Args: {
              p_attack: number
              p_defense: number
              p_mobility: number
              p_player_number: number
              p_room_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_attack: number
              p_defense: number
              p_mobility: number
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
      set_general:
        | {
            Args: {
              p_commander_id: string
              p_player_number: number
              p_room_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_commander_id: string
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
      set_player_ready: {
        Args: { p_player_id: string; p_ready: boolean }
        Returns: boolean
      }
      shuffle_jsonb_array: { Args: { arr: Json }; Returns: Json }
      start_combat:
        | { Args: { p_room_id: string }; Returns: Json }
        | { Args: { p_room_id: string; p_session_id: string }; Returns: Json }
      start_scenario_selection: { Args: { p_room_id: string }; Returns: Json }
      submit_logistics_bid: {
        Args: {
          p_bid: Json
          p_player_number: number
          p_room_id: string
          p_round_number: number
        }
        Returns: Json
      }
      use_basic_card:
        | {
            Args: {
              p_basic_card_key: string
              p_room_id: string
              p_session_id: string
              p_target?: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_card_type: string
              p_room_id: string
              p_session_id: string
            }
            Returns: Json
          }
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
      game_phase:
        | "lobby"
        | "culture_selection"
        | "scenario_selection"
        | "scenario_tiebreak"
        | "deckbuilding"
        | "deployment"
        | "combat_setup"
        | "combat"
        | "resolution"
        | "initiative_maneuver"
        | "initiative_reaction"
        | "initiative_roll"
        | "initiative_post"
      holding_type: "ordem" | "guilda" | "templo" | "fonte_magica"
      player_status: "joined" | "ready" | "disconnected"
      room_status:
        | "waiting"
        | "ready"
        | "in_progress"
        | "finished"
        | "cancelled"
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
      game_phase: [
        "lobby",
        "culture_selection",
        "scenario_selection",
        "scenario_tiebreak",
        "deckbuilding",
        "deployment",
        "combat_setup",
        "combat",
        "resolution",
        "initiative_maneuver",
        "initiative_reaction",
        "initiative_roll",
        "initiative_post",
      ],
      holding_type: ["ordem", "guilda", "templo", "fonte_magica"],
      player_status: ["joined", "ready", "disconnected"],
      room_status: ["waiting", "ready", "in_progress", "finished", "cancelled"],
      tactical_card_subtype: ["Buff", "Debuff", "Neutra", "Instantânea"],
      tactical_card_type: ["Ataque", "Defesa", "Movimento", "Moral"],
      tactical_culture: ["Anuire", "Khinasi", "Vos", "Rjurik", "Brecht"],
      unit_posture: ["Ofensiva", "Defensiva", "Carga", "Reorganização"],
    },
  },
} as const
