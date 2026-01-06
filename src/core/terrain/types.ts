/**
 * TERRENOS UNIFICADOS
 * 
 * Tipos de terreno usados por todos os modos de jogo:
 * - Skirmish: Hexágonos com terreno principal + opcional secundário
 * - Warfare: Características generalistas de batalha
 */

// === MODOS DE USO ===
export type TerrainGameMode = 'skirmish' | 'warfare';

// === VISIBILIDADE ===
export type VisibilityLevel = 'normal' | 'baixa' | 'dificil' | 'encoberto';

export const VISIBILITY_OPTIONS: { value: VisibilityLevel; label: string; modifier: number }[] = [
  { value: 'normal', label: 'Normal', modifier: 0 },
  { value: 'baixa', label: 'Baixa', modifier: -1 },
  { value: 'dificil', label: 'Difícil', modifier: -2 },
  { value: 'encoberto', label: 'Encoberto', modifier: -99 },
];

// === CLIMA ===
export const CLIMATE_OPTIONS = [
  'Céu aberto',
  'Neblina leve',
  'Vento forte',
  'Chuva leve',
  'Neve',
  'Tempestade',
  'Nevasca',
  'Tempestade de areia',
] as const;

export type ClimateType = typeof CLIMATE_OPTIONS[number];

// === TERRENO PRINCIPAL ===
// Usado em ambos os modos: hexágonos (Skirmish) e características (Warfare)
export interface PrimaryTerrain {
  id: string;
  name: string;
  description: string | null;
  
  // Clima
  default_climate: string;
  allowed_climates: string[];
  
  // Modificadores de combate
  attack_mod: number;
  defense_mod: number;
  mobility_mod: number;
  visibility: VisibilityLevel;
  
  // Visual
  image_url: string | null;
  
  // Metadados
  created_at: string;
  updated_at: string;
}

// === TERRENO SECUNDÁRIO (Característica) ===
// Skirmish: Hexágono pode ter principal + secundário
// Warfare: Característica adicional de batalha
export interface SecondaryTerrain {
  id: string;
  name: string;
  description: string | null;
  effect_description: string | null;
  
  // Modificadores
  attack_mod: number;
  defense_mod: number;
  mobility_mod: number;
  strategy_mod: number;
  special_effects: string | null;
  
  // Compatibilidade
  is_universal: boolean; // Se pode ser usado com qualquer terreno principal
  
  // Visual
  image_url: string | null;
  
  // Efeitos específicos para Skirmish (modificadores por tipo de unidade)
  skirmish_effects?: {
    infantry_mod?: number;
    cavalry_mod?: number;
    ranged_mod?: number;
    siege_mod?: number;
  };
  
  // Metadados
  created_at: string;
  updated_at: string;
}

// === COMPATIBILIDADE ===
export interface TerrainCompatibility {
  id: string;
  primary_terrain_id: string;
  secondary_terrain_id: string;
  created_at: string;
}

// === HEX TERRAIN (Específico para Skirmish) ===
export interface HexTerrain {
  hexId: string;
  primaryTerrainId: string;
  secondaryTerrainId?: string; // Opcional
  climate?: ClimateType;
}

// === DADOS INICIAIS ===
export const INITIAL_PRIMARY_TERRAINS: Omit<PrimaryTerrain, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Planície',
    description: 'Campo aberto com pouca cobertura e terreno plano.',
    default_climate: 'Céu aberto',
    allowed_climates: ['Céu aberto', 'Vento forte', 'Chuva leve'],
    attack_mod: 0,
    defense_mod: 0,
    mobility_mod: 1,
    visibility: 'normal',
    image_url: null,
  },
  {
    name: 'Floresta',
    description: 'Região densa de árvores, reduz visibilidade e mobilidade.',
    default_climate: 'Neblina leve',
    allowed_climates: ['Neblina leve', 'Chuva leve', 'Céu aberto'],
    attack_mod: -1,
    defense_mod: 1,
    mobility_mod: -1,
    visibility: 'baixa',
    image_url: null,
  },
  {
    name: 'Montanha',
    description: 'Terreno elevado e rochoso, favorece defesa.',
    default_climate: 'Vento forte',
    allowed_climates: ['Vento forte', 'Neve', 'Tempestade'],
    attack_mod: -1,
    defense_mod: 2,
    mobility_mod: -2,
    visibility: 'baixa',
    image_url: null,
  },
  {
    name: 'Deserto',
    description: 'Solo arenoso e instável, penaliza manobras pesadas.',
    default_climate: 'Céu aberto',
    allowed_climates: ['Céu aberto', 'Tempestade de areia', 'Vento forte'],
    attack_mod: 0,
    defense_mod: -1,
    mobility_mod: -1,
    visibility: 'baixa',
    image_url: null,
  },
  {
    name: 'Pântano',
    description: 'Área alagada, dificulta movimento e oculta tropas.',
    default_climate: 'Neblina leve',
    allowed_climates: ['Neblina leve', 'Chuva leve', 'Tempestade'],
    attack_mod: -1,
    defense_mod: 0,
    mobility_mod: -2,
    visibility: 'baixa',
    image_url: null,
  },
  {
    name: 'Costeiro',
    description: 'Margens de rio ou mar, expostas ao clima e instabilidade.',
    default_climate: 'Vento forte',
    allowed_climates: ['Céu aberto', 'Vento forte', 'Tempestade'],
    attack_mod: 0,
    defense_mod: 0,
    mobility_mod: 0,
    visibility: 'normal',
    image_url: null,
  },
  {
    name: 'Urbano',
    description: 'Batalha entre construções, becos e muralhas.',
    default_climate: 'Céu aberto',
    allowed_climates: ['Céu aberto', 'Neblina leve', 'Vento forte', 'Chuva leve', 'Neve', 'Tempestade'],
    attack_mod: 1,
    defense_mod: 1,
    mobility_mod: -1,
    visibility: 'baixa',
    image_url: null,
  },
  {
    name: 'Campo Nevado',
    description: 'Terreno coberto de neve, frio extremo e baixa mobilidade.',
    default_climate: 'Neve',
    allowed_climates: ['Neve', 'Nevasca', 'Céu aberto'],
    attack_mod: -1,
    defense_mod: 0,
    mobility_mod: -2,
    visibility: 'baixa',
    image_url: null,
  },
];

export const INITIAL_SECONDARY_TERRAINS: Omit<SecondaryTerrain, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Elevação',
    description: 'Colinas, encostas, torres de observação ou cumes naturais.',
    effect_description: '+1 na Defesa e +1 na Estratégia.',
    attack_mod: 0,
    defense_mod: 1,
    mobility_mod: 0,
    strategy_mod: 1,
    special_effects: null,
    is_universal: false,
    image_url: null,
  },
  {
    name: 'Ocultação',
    description: 'Florestas densas, névoa, vegetação alta ou ruínas que ocultam movimento.',
    effect_description: '+1 na Defesa, -1 no Ataque.',
    attack_mod: -1,
    defense_mod: 1,
    mobility_mod: 0,
    strategy_mod: 0,
    special_effects: null,
    is_universal: true,
    image_url: null,
  },
  {
    name: 'Passagem Estreita',
    description: 'Pontes, gargalos naturais, ruínas estreitas ou portões de fortalezas.',
    effect_description: '+2 na Defesa, -2 na Mobilidade.',
    attack_mod: 0,
    defense_mod: 2,
    mobility_mod: -2,
    strategy_mod: 0,
    special_effects: null,
    is_universal: false,
    image_url: null,
  },
  {
    name: 'Solo Instável',
    description: 'Dunas móveis, neve espessa ou lama instável.',
    effect_description: '-1 na Mobilidade, -1 na Defesa de Cavalaria.',
    attack_mod: 0,
    defense_mod: -1,
    mobility_mod: -1,
    strategy_mod: 0,
    special_effects: '-1 Defesa para Cavalaria',
    is_universal: false,
    image_url: null,
    skirmish_effects: { cavalry_mod: -1 },
  },
  {
    name: 'Vegetação Densa',
    description: 'Selvas ou bosques emaranhados com obstáculos naturais.',
    effect_description: '+1 na Defesa para Infantaria, -1 na Mobilidade geral.',
    attack_mod: 0,
    defense_mod: 1,
    mobility_mod: -1,
    strategy_mod: 0,
    special_effects: '+1 Defesa para Infantaria',
    is_universal: false,
    image_url: null,
    skirmish_effects: { infantry_mod: 1 },
  },
  {
    name: 'Ruínas',
    description: 'Vestígios de construções, vilarejos abandonados ou campos destruídos.',
    effect_description: '+1 na Defesa para Arqueiros e Unidades de Cerco, -1 no Ataque da Cavalaria.',
    attack_mod: 0,
    defense_mod: 1,
    mobility_mod: 0,
    strategy_mod: 0,
    special_effects: '+1 Defesa para Arqueiros/Cerco, -1 Ataque para Cavalaria',
    is_universal: false,
    image_url: null,
    skirmish_effects: { ranged_mod: 1, siege_mod: 1, cavalry_mod: -1 },
  },
  {
    name: 'Gelo Escorregadio',
    description: 'Superfícies cobertas por gelo fino ou neve compacta.',
    effect_description: '-1 na Mobilidade geral, +1 na Defesa contra Cargas.',
    attack_mod: 0,
    defense_mod: 1,
    mobility_mod: -1,
    strategy_mod: 0,
    special_effects: '+1 Defesa contra Cargas',
    is_universal: false,
    image_url: null,
  },
  {
    name: 'Lama Profunda',
    description: 'Terrenos encharcados ou lodosos que prendem os pés.',
    effect_description: '-1 na Mobilidade, -1 no Ataque de Unidades de Cerco.',
    attack_mod: -1,
    defense_mod: 0,
    mobility_mod: -1,
    strategy_mod: 0,
    special_effects: '-1 Ataque para Unidades de Cerco',
    is_universal: false,
    image_url: null,
    skirmish_effects: { siege_mod: -1 },
  },
  {
    name: 'Emboscada',
    description: 'Posicionamento surpresa ou ataque relâmpago.',
    effect_description: '+2 na Estratégia na rodada, +1 no primeiro Ataque.',
    attack_mod: 1,
    defense_mod: 0,
    mobility_mod: 0,
    strategy_mod: 2,
    special_effects: '+1 no primeiro Ataque da rodada',
    is_universal: false,
    image_url: null,
  },
  {
    name: 'Ventos Fortes',
    description: 'Correntes de vento intensas que afetam projéteis.',
    effect_description: '-1 no Ataque de Arqueiros, +1 na Defesa contra Projéteis.',
    attack_mod: -1,
    defense_mod: 1,
    mobility_mod: 0,
    strategy_mod: 0,
    special_effects: '-1 Ataque para Arqueiros, +1 Defesa contra Projéteis',
    is_universal: false,
    image_url: null,
    skirmish_effects: { ranged_mod: -1 },
  },
];

// Mapa de compatibilidade: terreno secundário -> lista de terrenos principais compatíveis
export const TERRAIN_COMPATIBILITY_MAP: Record<string, string[]> = {
  'Elevação': ['Planície', 'Floresta', 'Montanha', 'Deserto', 'Urbano', 'Campo Nevado'],
  'Ocultação': ['Planície', 'Floresta', 'Montanha', 'Deserto', 'Pântano', 'Costeiro', 'Urbano', 'Campo Nevado'],
  'Passagem Estreita': ['Urbano', 'Montanha', 'Costeiro'],
  'Solo Instável': ['Deserto', 'Campo Nevado', 'Pântano', 'Costeiro'],
  'Vegetação Densa': ['Floresta', 'Montanha', 'Campo Nevado'],
  'Ruínas': ['Urbano', 'Planície', 'Costeiro', 'Campo Nevado'],
  'Gelo Escorregadio': ['Campo Nevado', 'Montanha'],
  'Lama Profunda': ['Pântano', 'Campo Nevado', 'Costeiro', 'Floresta'],
  'Emboscada': ['Planície', 'Floresta', 'Montanha', 'Deserto', 'Pântano', 'Costeiro', 'Campo Nevado'],
  'Ventos Fortes': ['Planície', 'Montanha', 'Campo Nevado', 'Costeiro'],
};
