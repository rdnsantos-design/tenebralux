/**
 * Serviço de conversão de personagem para combatente tático
 */

import { CharacterDraft } from '@/types/character-builder';
import { 
  Combatant, 
  CombatantStats, 
  TacticalWeapon, 
  TacticalArmor 
} from '@/types/tactical-combat';
import { 
  calculateReactionBase, 
  calculateGuard, 
  calculateEvasion, 
  calculateVitality, 
  calculateMovement, 
  calculatePrep 
} from '@/lib/tacticalCombatEngine';
import { getWeaponById, getArmorById, getAllWeapons, TACTICAL_ARMORS } from '@/data/combat/weapons';
import { getBasicManeuversBySkill } from '@/data/combat/maneuvers';

export interface CharacterToCombatantOptions {
  team: 'player' | 'enemy';
  weaponOverride?: string;
  armorOverride?: string;
}

/**
 * Converte um CharacterDraft para um Combatant de batalha tática
 */
export function convertCharacterToCombatant(
  character: CharacterDraft,
  options: CharacterToCombatantOptions
): Combatant {
  const attributes = character.attributes || {};
  const skills = character.skills || {};
  
  // Extrair atributos
  const corpo = attributes.corpo || 1;
  const reflexos = attributes.reflexos || 1;
  const coordenacao = attributes.coordenacao || 1;
  const determinacao = attributes.determinacao || 1;
  
  // Extrair perícias de combate
  const luta = skills.luta || 0;
  const laminas = skills.laminas || 0;
  const tiro = skills.tiro || 0;
  const esquiva = skills.esquiva || 0;
  const prontidao = skills.prontidao || 0;
  const atletismo = skills.atletismo || 0;
  const resistencia = skills.resistencia || 0;
  const resiliencia = skills.resiliencia || 0;
  
  // Calcular stats derivados
  const reactionBase = calculateReactionBase(reflexos, prontidao);
  
  // Buscar arma e armadura
  let weapon: TacticalWeapon | undefined;
  let armor: TacticalArmor | undefined;
  
  if (options.weaponOverride) {
    weapon = getWeaponById(options.weaponOverride);
  } else if (character.weaponId) {
    // Tentar mapear do equipamento do character builder para arma tática
    weapon = mapEquipmentToTacticalWeapon(character.weaponId);
  }
  
  if (options.armorOverride) {
    armor = getArmorById(options.armorOverride);
  } else if (character.armorId) {
    armor = mapEquipmentToTacticalArmor(character.armorId);
  }
  
  // Se não tem arma, usar punhos
  if (!weapon) {
    weapon = getWeaponById('fist');
  }
  
  // Se não tem armadura, usar "sem armadura"
  if (!armor) {
    armor = getArmorById('no_armor');
  }
  
  const armorPenalty = armor?.evasionPenalty || 0;
  
  // Calcular stats de combate
  const guard = calculateGuard(reflexos, luta, laminas);
  const evasion = calculateEvasion(reflexos, esquiva, armorPenalty);
  const vitality = calculateVitality(corpo, resistencia);
  const movement = calculateMovement(corpo, atletismo);
  const prep = calculatePrep(reactionBase);
  
  // Determinar manobras disponíveis
  const availableManeuvers: string[] = [];
  
  if (luta > 0) {
    getBasicManeuversBySkill('luta').forEach(m => availableManeuvers.push(m.id));
  }
  if (laminas > 0) {
    getBasicManeuversBySkill('laminas').forEach(m => availableManeuvers.push(m.id));
  }
  if (tiro > 0) {
    getBasicManeuversBySkill('tiro').forEach(m => availableManeuvers.push(m.id));
  }
  
  // Construir stats do combatente
  const stats: CombatantStats = {
    attributes: {
      corpo,
      reflexos,
      coordenacao,
      determinacao
    },
    skills: {
      luta,
      laminas,
      tiro,
      esquiva,
      prontidao,
      atletismo,
      resistencia,
      resiliencia
    },
    vitality,
    maxVitality: vitality,
    guard,
    evasion,
    reactionBase,
    movement,
    prep,
    weapon,
    armor,
    currentTick: prep,
    fatigue: 0,
    slowness: 0,
    wounds: 0,
    isDown: false,
    posture: 'balanced',
    availableManeuvers
  };
  
  return {
    id: crypto.randomUUID(),
    name: character.name || 'Desconhecido',
    theme: character.theme || 'akashic',
    characterId: undefined, // Será preenchido se vier de um personagem salvo
    stats,
    team: options.team
  };
}

/**
 * Mapeia um equipamento do character builder para uma arma tática
 */
function mapEquipmentToTacticalWeapon(equipmentId: string): TacticalWeapon | undefined {
  // Mapeamento de IDs do equipment.ts para tactical weapons
  const mapping: Record<string, string> = {
    'knife': 'knife_tactical',
    'sword': 'long_sword',
    'axe': 'long_sword', // Usar espada longa como aproximação
    'spear': 'short_sword', // Usar espada curta como aproximação
    'pistol': 'pistol_standard',
    'rifle': 'rifle',
    'shotgun': 'shotgun',
    'machinegun': 'rifle', // Usar rifle como aproximação
    'launcher': 'rocket_launcher'
  };
  
  const tacticalId = mapping[equipmentId];
  return tacticalId ? getWeaponById(tacticalId) : undefined;
}

/**
 * Mapeia um equipamento do character builder para uma armadura tática
 */
function mapEquipmentToTacticalArmor(equipmentId: string): TacticalArmor | undefined {
  // Mapeamento de IDs do equipment.ts para tactical armors
  const mapping: Record<string, string> = {
    'clothes': 'light_vest',
    'shield': 'light_vest',
    'vest': 'tactical_vest',
    'combat_armor': 'heavy_armor'
  };
  
  const tacticalId = mapping[equipmentId];
  return tacticalId ? getArmorById(tacticalId) : undefined;
}

/**
 * Cria um inimigo genérico para testes
 */
export function createGenericEnemy(
  name: string,
  level: 'weak' | 'normal' | 'strong' | 'elite',
  theme: 'akashic' | 'tenebralux' = 'akashic'
): Combatant {
  const statsByLevel = {
    weak: { attr: 1, skill: 0, vitality: 8 },
    normal: { attr: 2, skill: 1, vitality: 12 },
    strong: { attr: 3, skill: 2, vitality: 16 },
    elite: { attr: 4, skill: 3, vitality: 24 }
  };
  
  const s = statsByLevel[level];
  
  const draft: CharacterDraft = {
    name,
    theme,
    attributes: {
      corpo: s.attr,
      reflexos: s.attr,
      coordenacao: s.attr,
      determinacao: s.attr,
      conhecimento: 1,
      raciocinio: 1,
      carisma: 1,
      intuicao: 1
    },
    skills: {
      luta: s.skill,
      laminas: s.skill,
      tiro: s.skill,
      esquiva: s.skill,
      prontidao: s.skill,
      atletismo: s.skill,
      resistencia: s.skill,
      resiliencia: s.skill
    }
  };
  
  const combatant = convertCharacterToCombatant(draft, { team: 'enemy' });
  combatant.stats.maxVitality = s.vitality;
  combatant.stats.vitality = s.vitality;
  
  return combatant;
}

/**
 * Retorna lista de armas disponíveis para seleção
 */
export function getAvailableWeapons(): TacticalWeapon[] {
  return getAllWeapons();
}

/**
 * Retorna lista de armaduras disponíveis para seleção
 */
export function getAvailableArmors(): TacticalArmor[] {
  return TACTICAL_ARMORS;
}
