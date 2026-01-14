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
    evasion,
    maxEvasion: evasion,
    guard,
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
    lastFatigueTick: 0,
    pendingCardChoice: true,  // Começa precisando escolher card
    chosenCardId: undefined,
    chosenTargetId: undefined,
    availableCards,
    purchasedCards,
    activePosture: null
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
 * 
 * Stats padronizados para facilitar debug:
 * - Arma: Pistola Leve (velocidade +2)
 * - Armadura: Leve (defesa +1)
 * - Reação: 5 (tick base)
 * - Guarda: 8
 * - Vitalidade: 10
 * - Movimento: 4 hexes
 * - Cards: apenas "standard_shot" (Tiro Padrão, velocidade +3)
 * 
 * Velocidade final: Reação(5) + Arma(+2) + Card(+3) = 10
 */
export function createGenericEnemy(
  name: string,
  level: 'weak' | 'normal' | 'strong' | 'elite',
  theme: 'akashic' | 'tenebralux' = 'akashic'
): Combatant {
  // Stats fixos para teste - ignorar level por enquanto
  const FIXED_STATS = {
    // Atributos
    corpo: 2,
    reflexos: 2,
    coordenacao: 2,
    determinacao: 2,
    intuicao: 2,
    // Perícias
    tiro: 2,
    esquiva: 1,
    prontidao: 1,
    instinto: 1,
    percepcao: 1,
    atletismo: 0,
    resistencia: 1,
    resiliencia: 1,
    vigor: 1,
    luta: 0,
    laminas: 0,
  };
  
  // Arma: Pistola simples
  const weapon: TacticalWeapon = {
    id: 'npc_pistol',
    name: { akashic: 'Pistola Leve', tenebralux: 'Besta de Mão' },
    type: 'ballistic',
    tier: 1,
    damage: 4, // 1d6 média
    attackModifier: 0,
    range: 20,
    speedModifier: 1, // +1 velocidade (pistola)
    movementModifier: 0, // Pistola não penaliza movimento
    slots: 1,
    description: { akashic: 'Arma padrão de NPC', tenebralux: 'Arma padrão de NPC' }
  };
  
  // Armadura: Leve
  const armor: TacticalArmor = {
    id: 'npc_light_armor',
    name: { akashic: 'Armadura Leve', tenebralux: 'Couro Leve' },
    tier: 1,
    guardBonus: 1,
    damageReduction: 0,
    speedPenalty: 0,
    movementPenalty: 0,
    description: { akashic: 'Armadura padrão de NPC', tenebralux: 'Armadura padrão de NPC' }
  };
  
  // Calcular stats derivados usando valores fixos
  // Reação = Reflexos × 2 + Prontidão = 2×2 + 1 = 5
  const reaction = 5;
  // Guarda = Reflexos + Esquiva + Instinto + Armadura = 2 + 1 + 1 + 1 = 5 (base) + armor
  const guard = 5 + armor.guardBonus;
  // Evasão = Intuição × 2 + Percepção = 2×2 + 1 = 5
  const evasion = 5;
  // Vitalidade = Corpo × 2 + Resistência = 2×2 + 1 = 5 (base) -> ajustar para 10
  const vitality = 10;
  // Movimento = 4 hexes fixo
  const movement = 4;
  // Preparo = Determinação + Corpo + Vigor = 2 + 2 + 1 = 5
  const prep = 5;
  
  // Cards disponíveis: APENAS tiro padrão para simplificar
  const availableCards = ['standard_shot'];
  
  const stats: CombatantStats = {
    attributes: {
      corpo: FIXED_STATS.corpo,
      reflexos: FIXED_STATS.reflexos,
      coordenacao: FIXED_STATS.coordenacao,
      determinacao: FIXED_STATS.determinacao,
      intuicao: FIXED_STATS.intuicao
    },
    skills: {
      luta: FIXED_STATS.luta,
      laminas: FIXED_STATS.laminas,
      tiro: FIXED_STATS.tiro,
      esquiva: FIXED_STATS.esquiva,
      prontidao: FIXED_STATS.prontidao,
      atletismo: FIXED_STATS.atletismo,
      resistencia: FIXED_STATS.resistencia,
      percepcao: FIXED_STATS.percepcao,
      vigor: FIXED_STATS.vigor,
      resiliencia: FIXED_STATS.resiliencia,
      instinto: FIXED_STATS.instinto
    },
    vitality,
    maxVitality: vitality,
    evasion,
    maxEvasion: evasion,
    guard,
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
    lastFatigueTick: 0,
    pendingCardChoice: true,
    chosenCardId: undefined,
    chosenTargetId: undefined,
    availableCards,
    purchasedCards: [],
    activePosture: null
  };
  
  console.log('[createGenericEnemy]', {
    name,
    reaction,
    guard,
    vitality,
    movement,
    weaponSpeed: weapon.speedModifier,
    availableCards
  });
  
  return {
    id: crypto.randomUUID(),
    name,
    theme,
    characterId: undefined,
    stats,
    team: 'enemy'
  };
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
