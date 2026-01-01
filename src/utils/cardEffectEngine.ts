/**
 * Card Effect Engine
 * Sistema para processar e aplicar efeitos especiais de cartas táticas
 */

import { MassCombatTacticalCard } from '@/types/MassCombatTacticalCard';

// Tipos de efeitos suportados
export type EffectType = 
  | 'damage_reduction_first'       // Anula primeiro ponto de dano
  | 'ignore_climate_heat'          // Ignora penalidades de calor
  | 'ignore_climate_all'           // Ignora todas penalidades de clima
  | 'ignore_terrain_rough'         // Ignora penalidades de terreno acidentado/alagado
  | 'bonus_on_terrain_urban'       // +1 Atq/Def em terreno urbano ou cobertura
  | 'bonus_on_season_winter'       // +1 Atq/Def no inverno
  | 'bonus_on_defending'           // Bônus extra quando defendendo
  | 'bonus_on_initiative'          // Bônus baseado em quem tem iniciativa
  | 'enemy_attack_debuff'          // -1 Ataque inimigo
  | 'enemy_defense_debuff'         // -1 Defesa inimiga
  | 'enemy_disadvantage'           // Oponente rola com desvantagem
  | 'extra_damage_on_win'          // +1 PV de dano se vencer
  | 'cancel_enemy_card_cost2'      // Cancela carta inimiga com custo até 2
  | 'ignore_attack_card'           // Ignora efeitos de uma carta de ataque
  | 'untap_commander'              // Untap um comandante usado
  | 'force_tap_commander'          // Força tap em comandante inimigo
  | 'double_card_cavalry'          // Usa 2 cartas de cavalaria com um TAP
  | 'double_card_infantry_forest'  // Usa 2 cartas de infantaria em floresta
  | 'return_to_hand'               // Carta retorna à mão após uso
  | 'draw_card_on_initiative_win'  // Compra carta se vencer iniciativa
  | 'retaliation_damage'           // Causa dano ao atacante após receber dano
  | 'block_unit_type_infantry'     // Bloqueia cartas de infantaria inimigas
  | 'increase_climate_penalty_enemy'// Aumenta penalidade de clima para inimigo
  | 'force_secondary_terrain'      // Força terreno secundário específico
  | 'flexibility_any'              // Usa carta fora de especialização
  | 'flexibility_any_extra_cost'   // Usa fora de especialização com +1 VET
  | 'flexibility_infantry_as_cavalry'// Usa infantaria como cavalaria
  | 'flexibility_siege'            // Usa cerco sem especialista
  | 'choice_mobility_or_attack';   // Escolhe entre +1 mobilidade ou +1 ataque

// Contexto do jogo para processamento de efeitos
export interface GameContext {
  terrain?: string;
  secondaryTerrain?: string;
  climate?: string;
  season?: string;
  isDefending?: boolean;
  hasInitiative?: boolean;
  currentRound: number;
  currentPhase: string;
  myTotalDamage?: number;
  enemyTotalDamage?: number;
}

// Resultado do processamento de efeito
export interface EffectResult {
  attackModifier: number;
  defenseModifier: number;
  mobilityModifier: number;
  enemyAttackModifier: number;
  enemyDefenseModifier: number;
  damageReduction: number;
  extraDamageOnWin: number;
  retaliationDamage: number;
  specialEffects: string[];
  blockedCardTypes: string[];
  returnToHand: boolean;
  drawCards: number;
  cancelEnemyCardMaxCost?: number;
  forceEnemyDisadvantage: boolean;
  untapCommander: boolean;
  forceTapEnemyCommander: boolean;
  ignoreClimate: 'heat' | 'all' | null;
  ignoreTerrain: string[];
}

// Cria resultado vazio
function createEmptyResult(): EffectResult {
  return {
    attackModifier: 0,
    defenseModifier: 0,
    mobilityModifier: 0,
    enemyAttackModifier: 0,
    enemyDefenseModifier: 0,
    damageReduction: 0,
    extraDamageOnWin: 0,
    retaliationDamage: 0,
    specialEffects: [],
    blockedCardTypes: [],
    returnToHand: false,
    drawCards: 0,
    forceEnemyDisadvantage: false,
    untapCommander: false,
    forceTapEnemyCommander: false,
    ignoreClimate: null,
    ignoreTerrain: [],
  };
}

// Processa efeito de uma carta
export function processCardEffect(
  card: MassCombatTacticalCard,
  context: GameContext
): EffectResult {
  const result = createEmptyResult();
  const effectType = card.effect_type as EffectType;

  if (!effectType) {
    // Carta sem efeito especial - aplica apenas bônus/penalidades base
    return result;
  }

  switch (effectType) {
    case 'damage_reduction_first':
      result.damageReduction = 1;
      result.specialEffects.push('Anula o primeiro ponto de dano desta rodada');
      break;

    case 'ignore_climate_heat':
      result.ignoreClimate = 'heat';
      result.specialEffects.push('Ignora penalidades de calor/deserto');
      break;

    case 'ignore_climate_all':
      result.ignoreClimate = 'all';
      result.specialEffects.push('Ignora todas as penalidades de clima');
      break;

    case 'ignore_terrain_rough':
      result.ignoreTerrain.push('Acidentado', 'Alagado');
      result.specialEffects.push('Ignora penalidades de terreno Acidentado ou Alagado');
      break;

    case 'bonus_on_terrain_urban':
      if (context.terrain === 'Urbano' || context.secondaryTerrain?.includes('Cobertura')) {
        result.attackModifier += 1;
        result.defenseModifier += 1;
        result.specialEffects.push('+1 Ataque e +1 Defesa (terreno Urbano/Cobertura)');
      }
      break;

    case 'bonus_on_season_winter':
      if (context.season === 'Inverno') {
        result.attackModifier += 1;
        result.defenseModifier += 1;
        result.specialEffects.push('+1 Ataque e +1 Defesa (Inverno)');
      }
      break;

    case 'bonus_on_defending':
      if (context.isDefending) {
        result.attackModifier += 1;
        result.specialEffects.push('+1 Ataque (defendendo)');
      }
      break;

    case 'bonus_on_initiative':
      if (context.hasInitiative) {
        result.attackModifier += 2;
        result.specialEffects.push('+2 Ataque (tem iniciativa)');
      } else if (context.isDefending) {
        result.attackModifier += 1;
        result.specialEffects.push('+1 Ataque (defendendo)');
      }
      break;

    case 'enemy_attack_debuff':
      result.enemyAttackModifier -= 1;
      result.specialEffects.push('-1 Ataque inimigo');
      break;

    case 'enemy_defense_debuff':
      result.enemyDefenseModifier -= 1;
      result.specialEffects.push('-1 Defesa inimiga');
      break;

    case 'enemy_disadvantage':
      result.forceEnemyDisadvantage = true;
      result.specialEffects.push('Oponente rola com desvantagem');
      break;

    case 'extra_damage_on_win':
      result.extraDamageOnWin = 1;
      result.specialEffects.push('+1 PV de dano se vencer');
      break;

    case 'cancel_enemy_card_cost2':
      result.cancelEnemyCardMaxCost = 2;
      result.specialEffects.push('Pode cancelar carta inimiga com custo até 2 VET');
      break;

    case 'ignore_attack_card':
      result.specialEffects.push('Ignora efeitos de uma carta de ataque inimiga');
      break;

    case 'untap_commander':
      result.untapCommander = true;
      result.specialEffects.push('Untap um comandante usado anteriormente');
      break;

    case 'force_tap_commander':
      result.forceTapEnemyCommander = true;
      result.specialEffects.push('Força tap em comandante inimigo com Comando 1');
      break;

    case 'double_card_cavalry':
      result.specialEffects.push('Pode usar 2 cartas de Cavalaria com um só TAP');
      break;

    case 'double_card_infantry_forest':
      if (context.terrain === 'Floresta') {
        result.specialEffects.push('Pode usar 2 cartas de Infantaria com mesmo comandante');
      }
      break;

    case 'return_to_hand':
      result.returnToHand = true;
      result.specialEffects.push('Esta carta retorna à mão após uso');
      break;

    case 'draw_card_on_initiative_win':
      if (context.hasInitiative) {
        result.drawCards = 1;
        result.specialEffects.push('Compra 1 carta (venceu iniciativa)');
      }
      break;

    case 'retaliation_damage':
      result.retaliationDamage = 1;
      result.specialEffects.push('Causa 1 PV ao atacante se receber dano');
      break;

    case 'block_unit_type_infantry':
      result.blockedCardTypes.push('Infantaria');
      result.specialEffects.push('Inimigo não pode usar cartas de Infantaria');
      break;

    case 'increase_climate_penalty_enemy':
      result.specialEffects.push('Aumenta penalidade de clima em 1 para o inimigo');
      break;

    case 'force_secondary_terrain':
      result.specialEffects.push('Considera Planície como terreno secundário ativo');
      break;

    case 'flexibility_any':
      result.specialEffects.push('Pode usar cartas fora de especialização');
      break;

    case 'flexibility_any_extra_cost':
      result.specialEffects.push('Usa cartas fora de especialização com +1 VET');
      break;

    case 'flexibility_infantry_as_cavalry':
      result.specialEffects.push('Usa cartas de Infantaria como Cavalaria');
      break;

    case 'flexibility_siege':
      result.specialEffects.push('Usa cartas de Cerco sem especialista');
      break;

    case 'choice_mobility_or_attack':
      result.specialEffects.push('Escolha: +1 Mobilidade OU +1 Ataque');
      break;
  }

  return result;
}

// Combina resultados de múltiplas cartas
export function combineEffectResults(results: EffectResult[]): EffectResult {
  const combined = createEmptyResult();

  for (const result of results) {
    combined.attackModifier += result.attackModifier;
    combined.defenseModifier += result.defenseModifier;
    combined.mobilityModifier += result.mobilityModifier;
    combined.enemyAttackModifier += result.enemyAttackModifier;
    combined.enemyDefenseModifier += result.enemyDefenseModifier;
    combined.damageReduction += result.damageReduction;
    combined.extraDamageOnWin += result.extraDamageOnWin;
    combined.retaliationDamage += result.retaliationDamage;
    combined.specialEffects.push(...result.specialEffects);
    combined.blockedCardTypes.push(...result.blockedCardTypes);
    combined.returnToHand = combined.returnToHand || result.returnToHand;
    combined.drawCards += result.drawCards;
    combined.forceEnemyDisadvantage = combined.forceEnemyDisadvantage || result.forceEnemyDisadvantage;
    combined.untapCommander = combined.untapCommander || result.untapCommander;
    combined.forceTapEnemyCommander = combined.forceTapEnemyCommander || result.forceTapEnemyCommander;
    
    if (result.cancelEnemyCardMaxCost !== undefined) {
      combined.cancelEnemyCardMaxCost = Math.max(
        combined.cancelEnemyCardMaxCost || 0,
        result.cancelEnemyCardMaxCost
      );
    }

    if (result.ignoreClimate === 'all') {
      combined.ignoreClimate = 'all';
    } else if (result.ignoreClimate === 'heat' && combined.ignoreClimate !== 'all') {
      combined.ignoreClimate = 'heat';
    }

    combined.ignoreTerrain.push(...result.ignoreTerrain);
  }

  // Remove duplicatas
  combined.specialEffects = [...new Set(combined.specialEffects)];
  combined.blockedCardTypes = [...new Set(combined.blockedCardTypes)];
  combined.ignoreTerrain = [...new Set(combined.ignoreTerrain)];

  return combined;
}

// Processa todas as cartas jogadas e retorna o resultado combinado
export function processAllPlayedCards(
  cards: MassCombatTacticalCard[],
  context: GameContext
): EffectResult {
  const results = cards.map(card => processCardEffect(card, context));
  return combineEffectResults(results);
}

// Calcula modificadores totais de uma carta (base + efeito)
export function calculateCardTotalModifiers(
  card: MassCombatTacticalCard,
  context: GameContext
): {
  attack: number;
  defense: number;
  mobility: number;
  effectResult: EffectResult;
} {
  const effectResult = processCardEffect(card, context);

  return {
    attack: (card.attack_bonus || 0) - (card.attack_penalty || 0) + effectResult.attackModifier,
    defense: (card.defense_bonus || 0) - (card.defense_penalty || 0) + effectResult.defenseModifier,
    mobility: (card.mobility_bonus || 0) - (card.mobility_penalty || 0) + effectResult.mobilityModifier,
    effectResult,
  };
}

// Descrição legível do efeito
export function getEffectDescription(effectType: string | null | undefined): string {
  if (!effectType) return '';

  const descriptions: Record<string, string> = {
    damage_reduction_first: 'Anula o primeiro ponto de dano',
    ignore_climate_heat: 'Ignora penalidades de calor',
    ignore_climate_all: 'Ignora todas penalidades de clima',
    ignore_terrain_rough: 'Ignora terreno difícil',
    bonus_on_terrain_urban: 'Bônus em terreno urbano',
    bonus_on_season_winter: 'Bônus no inverno',
    bonus_on_defending: 'Bônus ao defender',
    bonus_on_initiative: 'Bônus com iniciativa',
    enemy_attack_debuff: 'Reduz ataque inimigo',
    enemy_defense_debuff: 'Reduz defesa inimiga',
    enemy_disadvantage: 'Inimigo com desvantagem',
    extra_damage_on_win: 'Dano extra se vencer',
    cancel_enemy_card_cost2: 'Cancela carta inimiga',
    ignore_attack_card: 'Ignora carta de ataque',
    untap_commander: 'Untap comandante',
    force_tap_commander: 'Força tap inimigo',
    double_card_cavalry: '2 cartas de cavalaria',
    double_card_infantry_forest: '2 cartas de infantaria',
    return_to_hand: 'Retorna à mão',
    draw_card_on_initiative_win: 'Compra carta',
    retaliation_damage: 'Dano de retaliação',
    block_unit_type_infantry: 'Bloqueia infantaria',
    increase_climate_penalty_enemy: 'Piora clima inimigo',
    force_secondary_terrain: 'Força terreno secundário',
    flexibility_any: 'Flexibilidade de especialização',
    flexibility_any_extra_cost: 'Flex. com custo extra',
    flexibility_infantry_as_cavalry: 'Infantaria como cavalaria',
    flexibility_siege: 'Usa cerco sem especialista',
    choice_mobility_or_attack: 'Escolha: mobilidade ou ataque',
  };

  return descriptions[effectType] || effectType;
}
