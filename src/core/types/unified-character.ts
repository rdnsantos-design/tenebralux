/**
 * UNIFIED CHARACTER SYSTEM
 * 
 * Este módulo unifica os diferentes tipos de personagem:
 * - Character (RPG completo com atributos, perícias, virtudes)
 * - CharacterCard (ficha tática para combate em massa)
 * - FieldCommander (comandante de campo)
 * 
 * Permite criar fichas táticas automaticamente a partir de personagens RPG.
 */

import { ThemeId } from '@/themes/types';
import { 
  BaseEntity,
  CharacterAttributes, 
  CharacterVirtues,
  DerivedStats,
  RegencyStats,
  CommandStats,
  ExperienceLevel
} from './base';
import { Character, Blessing, Equipment, calculateDerivedStats, calculateRegencyStats, regencyToCommandStats } from './character';
import { 
  CharacterType, 
  Specialty, 
  PassiveBonusType,
  CharacterAbility,
  DEFAULT_SPECIALTIES 
} from '@/types/entities/character-card';
import { CommanderSpecialization, CULTURES } from '@/types/entities/field-commander';

// ============================================
// GAME MODE CAPABILITIES
// ============================================

export type CharacterGameMode = 'rpg' | 'tactical' | 'domain' | 'campaign';

export interface CharacterCapabilities {
  rpg: boolean;        // Tem dados completos de RPG
  tactical: boolean;   // Pode ser usado em combate tático
  domain: boolean;     // Pode gerenciar domínios
  campaign: boolean;   // Pode participar de campanhas
}

// ============================================
// TACTICAL PROJECTION
// ============================================

/**
 * Projeção tática de um personagem para uso em combate em massa
 * Derivada automaticamente de Character ou definida manualmente
 */
export interface TacticalProjection {
  // Core combat stats (derivado de RegencyStats ou manual)
  comando: number;       // 1-6
  estrategia: number;    // 0-6  
  guarda: number;        // 0-6
  
  // Tipos de personagem no contexto tático
  characterTypes: CharacterType[];
  
  // Especialidades (derivadas ou manuais)
  specialties: Specialty[];
  
  // Bônus passivo (opcional)
  passiveBonus?: {
    type: PassiveBonusType;
    value: number;        // 1-3
    affectsArea: boolean;
  };
  
  // Habilidade especial (opcional)
  ability?: {
    name: string;
    description: string;
    powerCost: number;
  } | string; // ID de ability da biblioteca
  
  // Custo calculado
  powerCost: number;
  powerCostOverride?: number;
  
  // Cultura para efeitos táticos
  tacticalCulture: string;
}

// ============================================
// DOMAIN PROJECTION
// ============================================

/**
 * Projeção de domínio para uso em campanhas de regência
 */
export interface DomainProjection {
  // Stats de domínio
  administracao: number;
  politica: number;
  tecnologia: number;    // Akashic
  geomancia: number;     // Tenebralux
  
  // Linhagem (opcional)
  bloodlineStrength?: number;
  bloodlineType?: string;
  
  // Pontos de regência
  regencyPoints: number;
  
  // Holdings gerenciados
  managedHoldingIds?: string[];
}

// ============================================
// UNIFIED CHARACTER
// ============================================

/**
 * Personagem unificado que pode ser usado em todos os modos de jogo
 */
export interface UnifiedCharacter extends BaseEntity {
  // ========== IDENTIDADE ==========
  faction?: string;
  culture?: string;
  playerName?: string;
  isPC: boolean;
  
  // ========== RPG CORE (opcional se apenas tático) ==========
  attributes?: CharacterAttributes;
  skills?: Record<string, number>;
  virtues?: CharacterVirtues;
  blessings?: Blessing[];
  equipment?: Equipment[];
  experiencePoints?: number;
  
  // ========== STATS DERIVADOS (calculados) ==========
  derivedStats?: DerivedStats;
  regencyStats?: RegencyStats;
  
  // ========== PROJEÇÕES POR MODO ==========
  tactical?: TacticalProjection;
  domain?: DomainProjection;
  
  // ========== CAPABILITIES ==========
  capabilities: CharacterCapabilities;
  
  // ========== IMAGENS ==========
  portraitUrl?: string;
  coatOfArmsUrl?: string;
  
  // ========== BIO ==========
  domainName?: string;
  age?: number;
  notes?: string;
  
  // ========== LINKS ==========
  linkedArmyIds?: string[];
  linkedDomainIds?: string[];
  regentId?: string;
}

// ============================================
// CONVERSION FUNCTIONS
// ============================================

/**
 * Converte atributo de Comando para escala tática (1-6)
 */
function clampToTactical(value: number, min: number = 0, max: number = 6): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/**
 * Mapeia especialização de comandante para especialidade tática
 */
function commanderSpecToTacticalSpec(spec: CommanderSpecialization): Specialty {
  const mapping: Record<CommanderSpecialization, Specialty> = {
    'Infantaria': 'Infantaria',
    'Cavalaria': 'Cavalaria',
    'Tiro': 'Arqueria',
    'Cerco': 'Sitio',
    'Magia': 'Infantaria', // Magia não tem equivalente direto
  };
  return mapping[spec] || 'Infantaria';
}

/**
 * Gera projeção tática a partir de stats de regência
 */
export function generateTacticalProjection(
  regency: RegencyStats,
  derived: DerivedStats,
  culture: string,
  options?: {
    characterTypes?: CharacterType[];
    specialties?: Specialty[];
    passiveBonus?: TacticalProjection['passiveBonus'];
    ability?: TacticalProjection['ability'];
  }
): TacticalProjection {
  const comando = clampToTactical(regency.comando, 1, 6);
  const estrategia = clampToTactical(regency.estrategia, 0, 6);
  const guarda = clampToTactical(Math.floor(derived.guarda / 3), 0, 6);
  
  // Custo base
  let powerCost = comando + (estrategia * 2) + (guarda * 0.5);
  
  // Adiciona custo de especialidades extras
  const specCount = options?.specialties?.length || 1;
  if (specCount > 1) {
    powerCost += 3 * ((specCount - 1) * specCount) / 2;
  }
  
  // Adiciona custo de bônus passivo
  if (options?.passiveBonus) {
    const bonusCosts: Record<number, number> = { 1: 1, 2: 3, 3: 5 };
    powerCost += bonusCosts[options.passiveBonus.value] || 0;
    if (options.passiveBonus.affectsArea) {
      powerCost += 1;
    }
  }
  
  return {
    comando,
    estrategia,
    guarda,
    characterTypes: options?.characterTypes || ['Comandante'],
    specialties: options?.specialties || ['Infantaria'],
    passiveBonus: options?.passiveBonus,
    ability: options?.ability,
    powerCost: Math.ceil(powerCost),
    tacticalCulture: culture,
  };
}

/**
 * Gera projeção de domínio a partir de stats de regência
 */
export function generateDomainProjection(
  regency: RegencyStats,
  options?: {
    bloodlineStrength?: number;
    bloodlineType?: string;
    regencyPoints?: number;
  }
): DomainProjection {
  return {
    administracao: regency.administracao,
    politica: regency.politica,
    tecnologia: regency.tecnologia,
    geomancia: regency.geomancia,
    bloodlineStrength: options?.bloodlineStrength,
    bloodlineType: options?.bloodlineType,
    regencyPoints: options?.regencyPoints || 0,
  };
}

/**
 * Cria um UnifiedCharacter a partir de um Character (RPG)
 */
export function characterToUnified(
  character: Character,
  options?: {
    tacticalOptions?: Parameters<typeof generateTacticalProjection>[3];
    domainOptions?: Parameters<typeof generateDomainProjection>[1];
    enableTactical?: boolean;
    enableDomain?: boolean;
  }
): UnifiedCharacter {
  const derivedStats = character.derivedStats || 
    calculateDerivedStats(character.attributes, character.skills);
  
  const regencyStats = character.regencyStats || 
    calculateRegencyStats(character.attributes, character.skills, character.theme);
  
  const unified: UnifiedCharacter = {
    id: character.id,
    name: character.name,
    description: character.description,
    theme: character.theme,
    created_at: character.created_at,
    updated_at: character.updated_at,
    
    faction: character.faction,
    culture: character.culture,
    isPC: true,
    
    attributes: character.attributes,
    skills: character.skills,
    virtues: character.virtues,
    blessings: character.blessings,
    equipment: character.equipment,
    experiencePoints: character.experiencePoints,
    
    derivedStats,
    regencyStats,
    
    capabilities: {
      rpg: true,
      tactical: options?.enableTactical ?? true,
      domain: options?.enableDomain ?? true,
      campaign: true,
    },
    
    linkedArmyIds: character.linkedArmyIds,
    linkedDomainIds: character.linkedDomainIds,
  };
  
  // Gera projeções se habilitadas
  if (unified.capabilities.tactical) {
    unified.tactical = generateTacticalProjection(
      regencyStats,
      derivedStats,
      character.culture || 'Anuire',
      options?.tacticalOptions
    );
  }
  
  if (unified.capabilities.domain) {
    unified.domain = generateDomainProjection(
      regencyStats,
      options?.domainOptions
    );
  }
  
  return unified;
}

/**
 * Cria um UnifiedCharacter apenas tático (sem dados RPG)
 */
export function createTacticalOnlyCharacter(
  name: string,
  theme: ThemeId,
  tactical: TacticalProjection,
  options?: {
    culture?: string;
    portraitUrl?: string;
    coatOfArmsUrl?: string;
    notes?: string;
  }
): UnifiedCharacter {
  return {
    id: crypto.randomUUID(),
    name,
    theme,
    isPC: false,
    culture: options?.culture || tactical.tacticalCulture,
    
    tactical,
    
    capabilities: {
      rpg: false,
      tactical: true,
      domain: false,
      campaign: false,
    },
    
    portraitUrl: options?.portraitUrl,
    coatOfArmsUrl: options?.coatOfArmsUrl,
    notes: options?.notes,
  };
}

/**
 * Extrai CommandStats compatível com sistema tático existente
 */
export function unifiedToCommandStats(unified: UnifiedCharacter): CommandStats | null {
  if (unified.tactical) {
    return {
      command: unified.tactical.comando,
      strategy: unified.tactical.estrategia,
      guard: unified.tactical.guarda,
    };
  }
  
  if (unified.regencyStats && unified.derivedStats) {
    return regencyToCommandStats(unified.regencyStats, unified.derivedStats);
  }
  
  return null;
}

/**
 * Calcula custo de poder total do personagem
 */
export function calculateUnifiedPowerCost(unified: UnifiedCharacter): number {
  if (unified.tactical?.powerCostOverride !== undefined) {
    return unified.tactical.powerCostOverride;
  }
  
  if (unified.tactical) {
    return unified.tactical.powerCost;
  }
  
  return 0;
}

// ============================================
// VALIDATION
// ============================================

export interface UnifiedCharacterValidation {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}

export function validateUnifiedCharacter(char: Partial<UnifiedCharacter>): UnifiedCharacterValidation {
  const errors: UnifiedCharacterValidation['errors'] = [];
  const warnings: UnifiedCharacterValidation['warnings'] = [];
  
  // Nome obrigatório
  if (!char.name?.trim()) {
    errors.push({ field: 'name', message: 'Nome é obrigatório' });
  }
  
  // Theme obrigatório
  if (!char.theme) {
    errors.push({ field: 'theme', message: 'Tema é obrigatório' });
  }
  
  // Validação de RPG (se habilitado)
  if (char.capabilities?.rpg) {
    if (!char.attributes) {
      errors.push({ field: 'attributes', message: 'Atributos são obrigatórios para modo RPG' });
    }
    if (!char.skills || Object.keys(char.skills).length === 0) {
      warnings.push({ field: 'skills', message: 'Nenhuma perícia definida' });
    }
  }
  
  // Validação tática (se habilitado)
  if (char.capabilities?.tactical && char.tactical) {
    if (char.tactical.comando < 1 || char.tactical.comando > 6) {
      errors.push({ field: 'tactical.comando', message: 'Comando deve estar entre 1 e 6' });
    }
    if (char.tactical.estrategia < 0 || char.tactical.estrategia > 6) {
      errors.push({ field: 'tactical.estrategia', message: 'Estratégia deve estar entre 0 e 6' });
    }
    if (!char.tactical.specialties?.length) {
      warnings.push({ field: 'tactical.specialties', message: 'Nenhuma especialidade definida' });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Re-export tipos úteis
export { CULTURES } from '@/types/entities/field-commander';
export { DEFAULT_SPECIALTIES, CHARACTER_TYPES } from '@/types/entities/character-card';
