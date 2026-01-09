/**
 * Serviço de conversão de personagem para combatente tático
 */

import { CharacterDraft } from '@/types/character-builder';
import { 
  Combatant, 
  CombatantStats, 
  TacticalWeapon, 
  TacticalArmor,
  calculateReaction,
  calculateGuard,
  calculateEvasion,
  calculateVitality,
  calculateMovement,
  calculatePrep
} from '@/types/tactical-combat';
import { getWeaponById, getArmorById, getAllWeapons, TACTICAL_ARMORS } from '@/data/combat/weapons';
import { getBasicCards, getAvailableCards } from '@/data/combat/cards';

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
  const intuicao = attributes.intuicao || 1;
  
  // Extrair perícias de combate
  const luta = skills.luta || 0;
  const laminas = skills.laminas || 0;
  const tiro = skills.tiro || 0;
  const esquiva = skills.esquiva || 0;
  const prontidao = skills.prontidao || 0;
  const atletismo = skills.atletismo || 0;
  const resistencia = skills.resistencia || 0;
  const resiliencia = skills.resiliencia || 0;
  const instinto = skills.instinto || 0;
  const percepcao = skills.percepcao || 0;
  const vigor = skills.vigor || 0;
  
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
  
  // Calcular stats de combate usando as fórmulas corretas
  // Reação = Reflexos × 2 + Prontidão
  const reaction = calculateReaction(reflexos, prontidao);
  // Guarda = Reflexos + Esquiva + Instinto
  const guard = calculateGuard(reflexos, esquiva, instinto);
  // Evasão = Intuição × 2 + Percepção
  const evasion = calculateEvasion(intuicao, percepcao);
  // Vitalidade = Corpo × 2 + Resistência
  const vitality = calculateVitality(corpo, resistencia);
  // Movimento = Corpo × 2 + Atletismo
  const movement = calculateMovement(corpo, atletismo);
  // Preparo = Determinação + Corpo + Vigor
  const prep = calculatePrep(determinacao, corpo, vigor);
  
  // Determinar cartas disponíveis (básicas + compradas)
  const purchasedCards: string[] = []; // TODO: carregar do personagem
  const availableCards = getAvailableCards(skills, purchasedCards).map(c => c.id);
  
  // Construir stats do combatente
  const stats: CombatantStats = {
    attributes: {
      corpo,
      reflexos,
      coordenacao,
      determinacao,
      intuicao
    },
    skills: {
      luta,
      laminas,
      tiro,
      esquiva,
      prontidao,
      atletismo,
      resistencia,
      percepcao,
      vigor,
      resiliencia,
      instinto
    },
    vitality,
    maxVitality: vitality,
    guard,
    evasion,
    reaction,
    movement,
    prep,
    weapon,
    armor,
    currentTick: 0,
    fatigue: 0,
    slowness: 0,
    wounds: 0,
    isDown: false,
    currentMovement: movement,
    availableCards,
    purchasedCards
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
    'knife': 'knife',
    'sword': 'sword_long',
    'axe': 'sword_long',
    'spear': 'sword_short',
    'pistol': 'pistol_ballistic_t1',
    'rifle': 'rifle_ballistic_t1',
    'shotgun': 'rifle_ballistic_t1',
    'machinegun': 'rifle_ballistic_t2',
    'launcher': 'rifle_ballistic_t2'
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
    'clothes': 'light_armor_t1',
    'shield': 'light_armor_t1',
    'vest': 'medium_armor_t1',
    'combat_armor': 'heavy_armor_t1'
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
    weak: { attr: 1, skill: 0, vitality: 6 },
    normal: { attr: 2, skill: 1, vitality: 10 },
    strong: { attr: 3, skill: 2, vitality: 14 },
    elite: { attr: 4, skill: 3, vitality: 20 }
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
      intuicao: s.attr,
      conhecimento: 1,
      raciocinio: 1,
      carisma: 1
    },
    skills: {
      luta: s.skill,
      laminas: s.skill,
      tiro: s.skill,
      esquiva: s.skill,
      prontidao: s.skill,
      atletismo: s.skill,
      resistencia: s.skill,
      resiliencia: s.skill,
      instinto: s.skill,
      percepcao: s.skill,
      vigor: s.skill
    }
  };
  
  const combatant = convertCharacterToCombatant(draft, { team: 'enemy' });
  
  // Ajustar vitalidade pelo nível
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
