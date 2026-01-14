/**
 * Engine de Combate Tático Individual
 * 
 * Sistema de Timeline (Ticks):
 * - Reação = 12 - (Reflexos × 2 + Instinto) 
 * - Tick de ação = Reação + Velocidade da Carta + Velocidade da Arma
 * 
 * Ataque (2d6):
 * - 2d6 + Atributo + Perícia + Modificadores vs Guarda + Modificadores ambiente
 * - Crítico: 12 natural (dobra dano)
 * - Falha Crítica: 2 natural (consequência negativa)
 * 
 * Dano:
 * - Se Ataque > Guarda: Dano = Dano da Arma + (Margem × Ratio do tipo)
 * - Ratios: Balístico/Energia 1:1, Lâminas 1:2, Desarmado 1:4, Explosão 2:1
 */

import { 
  BattleState, 
  Combatant, 
  CombatAction, 
  ActionResult, 
  CombatCard,
  BattleLogEntry,
  HexCoord,
  WeaponType,
  CombatantStats
} from '@/types/tactical-combat';
import { getCardById } from '@/data/combat/cards';
import { createBasicHexMap, addRandomCover, hexKey } from '@/lib/hexCombatUtils';

// ============= RE-EXPORT DE FUNÇÕES DE CÁLCULO =============

export { 
  calculateReaction, 
  calculateGuard, 
  calculateEvasion, 
  calculateVitality, 
  calculateMovement, 
  calculatePrep 
} from '@/types/tactical-combat';

// ============= TIPOS DE MODIFICADORES DE COMBATE =============

export type DistanceRange = 'point-blank' | 'short' | 'medium' | 'long' | 'extreme';
export type LightingCondition = 'normal' | 'dim' | 'darkness';
export type CoverLevel = 'none' | 'partial' | 'substantial' | 'almost-total' | 'total';
export type TargetMovement = 'stationary' | 'normal' | 'running' | 'sprint';
export type PositionAdvantage = 'none' | 'elevated' | 'lowground' | 'flanking' | 'rear' | 'surprise';

export interface CombatModifiers {
  distance: DistanceRange;
  lighting: LightingCondition;
  cover: CoverLevel;
  targetMovement: TargetMovement;
  position: PositionAdvantage;
}

// ============= TABELAS DE MODIFICADORES =============

export const DISTANCE_MODIFIERS: Record<DistanceRange, { attack: number; guardMod: number }> = {
  'point-blank': { attack: 2, guardMod: -2 },  // ≤2m
  'short': { attack: 1, guardMod: 0 },          // ≤10m
  'medium': { attack: 0, guardMod: 0 },         // 10-50m
  'long': { attack: -2, guardMod: 0 },          // 50-200m
  'extreme': { attack: -4, guardMod: 0 },       // 200m+
};

export const LIGHTING_MODIFIERS: Record<LightingCondition, number> = {
  'normal': 0,
  'dim': -2,
  'darkness': -4,
};

export const COVER_GUARD_BONUS: Record<CoverLevel, number> = {
  'none': 0,
  'partial': 2,       // 25%
  'substantial': 4,   // 50%
  'almost-total': 6,  // 75%
  'total': 999,       // Impossível atacar
};

export const TARGET_MOVEMENT_MODIFIERS: Record<TargetMovement, number> = {
  'stationary': 2,
  'normal': 0,
  'running': -2,
  'sprint': -4,
};

export const POSITION_MODIFIERS: Record<PositionAdvantage, { attack: number; ignoreEsquiva: boolean }> = {
  'none': { attack: 0, ignoreEsquiva: false },
  'elevated': { attack: 2, ignoreEsquiva: false },
  'lowground': { attack: -2, ignoreEsquiva: false },
  'flanking': { attack: 2, ignoreEsquiva: false },
  'rear': { attack: 4, ignoreEsquiva: false },
  'surprise': { attack: 0, ignoreEsquiva: true },  // Alvo não usa Esquiva
};

// ============= RATIO DE DANO POR TIPO DE ARMA =============

export const DAMAGE_RATIOS: Record<WeaponType, number> = {
  'ballistic': 1,   // 1:1
  'energy': 1,      // 1:1
  'melee': 0.5,     // 1:2 (divide margem por 2)
  'explosive': 2,   // 2:1 (multiplica margem por 2)
};

// ============= ROLAGEM DE DADOS =============

/**
 * Rola 2d6
 */
export function roll2d6(): { total: number; dice: [number, number] } {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return { total: d1 + d2, dice: [d1, d2] };
}

/**
 * Verifica se é crítico (12 natural - boxcars)
 */
export function isCritical(dice: [number, number]): boolean {
  return dice[0] + dice[1] === 12;
}

/**
 * Verifica se é falha crítica (2 natural - snake eyes)
 */
export function isFumble(dice: [number, number]): boolean {
  return dice[0] + dice[1] === 2;
}

// ============= CÁLCULO DE VELOCIDADE =============

/**
 * Calcula o tick em que a ação será resolvida
 * Fórmula: Tick Atual + Velocidade da Carta + Velocidade da Arma
 */
export function calculateActionTick(
  currentTick: number,
  cardSpeed: number,
  weaponSpeed: number,
  armorSpeedPenalty: number = 0
): number {
  // Garantir progresso na timeline: mesmo ações "0" devem avançar pelo menos 1 tick
  const delta = cardSpeed + weaponSpeed + armorSpeedPenalty;
  return currentTick + Math.max(1, delta);
}

// ============= CÁLCULO DE PENALIDADES POR DANO =============

export type VitalityState = 'healthy' | 'wounded' | 'severely-wounded' | 'incapacitated' | 'dying' | 'dead';

/**
 * Determina o estado de vitalidade e penalidade
 */
export function getVitalityState(current: number, max: number): { state: VitalityState; penalty: number } {
  if (current <= 0) {
    return { state: 'dead', penalty: 0 }; // Morte em 0 conforme solicitado
  }
  
  const percentage = (current / max) * 100;
  
  if (percentage > 50) {
    return { state: 'healthy', penalty: 0 };
  } else if (percentage > 25) {
    return { state: 'wounded', penalty: -1 };
  } else {
    return { state: 'severely-wounded', penalty: -2 };
  }
}

/**
 * Calcula modificadores totais de ataque
 */
export function calculateAttackModifiers(modifiers: Partial<CombatModifiers>): number {
  let total = 0;
  
  if (modifiers.distance) {
    total += DISTANCE_MODIFIERS[modifiers.distance].attack;
  }
  if (modifiers.lighting) {
    total += LIGHTING_MODIFIERS[modifiers.lighting];
  }
  if (modifiers.targetMovement) {
    total += TARGET_MOVEMENT_MODIFIERS[modifiers.targetMovement];
  }
  if (modifiers.position) {
    total += POSITION_MODIFIERS[modifiers.position].attack;
  }
  
  return total;
}

/**
 * Calcula bônus de guarda do defensor
 */
export function calculateDefenseModifiers(modifiers: Partial<CombatModifiers>): { guardBonus: number; ignoreEsquiva: boolean } {
  let guardBonus = 0;
  let ignoreEsquiva = false;
  
  if (modifiers.cover) {
    guardBonus += COVER_GUARD_BONUS[modifiers.cover];
  }
  if (modifiers.distance) {
    guardBonus += DISTANCE_MODIFIERS[modifiers.distance].guardMod;
  }
  if (modifiers.position === 'surprise') {
    ignoreEsquiva = true;
  }
  
  return { guardBonus, ignoreEsquiva };
}

// ============= RESOLUÇÃO DE ATAQUE =============

export interface AttackParams {
  attacker: Combatant;
  defender: Combatant;
  card: CombatCard;
  modifiers?: Partial<CombatModifiers>;
}

/**
 * Resolve um ataque entre dois combatentes usando 2d6
 */
export function resolveAttack(params: AttackParams): ActionResult {
  const { attacker, defender, card, modifiers = {} } = params;
  const stats = attacker.stats;
  const defenderStats = defender.stats;
  
  // Verificar cobertura total
  if (modifiers.cover === 'total') {
    return {
      success: false,
      message: `${attacker.name} não consegue atacar ${defender.name} - cobertura total!`
    };
  }
  
  // Determinar atributo e perícia baseado no tipo de arma
  let attribute = 0;
  let skill = 0;
  
  const weaponType = stats.weapon?.type || 'melee';
  
  if (weaponType === 'melee') {
    // Armas corpo a corpo usam Reflexos + Luta ou Lâminas
    attribute = stats.attributes.reflexos;
    skill = Math.max(stats.skills.luta || 0, stats.skills.laminas || 0);
  } else {
    // Armas de distância usam Coordenação + Tiro
    attribute = stats.attributes.coordenacao;
    skill = stats.skills.tiro || 0;
  }
  
  // Penalidade por ferimentos do atacante
  const attackerVitalityState = getVitalityState(stats.vitality, stats.maxVitality);
  const woundPenalty = attackerVitalityState.penalty;
  
  // Rolar dados
  const roll = roll2d6();
  const critical = isCritical(roll.dice);
  const fumble = isFumble(roll.dice);
  
  // Verificar falha crítica (automática)
  if (fumble) {
    return {
      success: false,
      attackRoll: roll.total,
      isCritical: false,
      isFumble: true,
      message: `FALHA CRÍTICA! ${attacker.name} erra completamente e sofre consequência!`
    };
  }
  
  // Calcular bônus de ataque
  const weaponAttackMod = stats.weapon?.attackModifier || 0;
  const environmentMod = calculateAttackModifiers(modifiers);
  const attackBonus = attribute + skill + card.attackModifier + weaponAttackMod + environmentMod + woundPenalty;
  const attackTotal = roll.total + attackBonus;
  
  // Calcular guarda do defensor
  const defenseMods = calculateDefenseModifiers(modifiers);
  const armorBonus = defenderStats.armor?.guardBonus || 0;
  
  // Se surpresa, não usa Esquiva
  let baseGuard: number;
  if (defenseMods.ignoreEsquiva) {
    baseGuard = (defenderStats.attributes.reflexos * 2) + armorBonus;
  } else {
    baseGuard = defenderStats.guard;
  }
  
  const targetDefense = baseGuard + defenseMods.guardBonus;
  
  // Verificar acerto
  const margin = attackTotal - targetDefense;
  
  // Crítico sempre acerta, mas precisa superar para causar dano extra
  if (margin <= 0 && !critical) {
    return {
      success: false,
      attackRoll: attackTotal,
      targetDefense,
      margin,
      isCritical: false,
      isFumble: false,
      message: `${attacker.name} erra o ataque contra ${defender.name}. (${attackTotal} vs ${targetDefense})`
    };
  }
  
  // Calcular dano
  const baseDamage = stats.weapon?.damage || 1;
  const damageRatio = DAMAGE_RATIOS[weaponType] || 1;
  
  // Dano da margem aplicando ratio do tipo de arma
  const marginDamage = Math.floor(Math.max(0, margin) * damageRatio);
  
  // Dano total = dano base + margem modificada pelo ratio
  let totalDamage = baseDamage + marginDamage;
  
  // Crítico dobra o dano total
  if (critical) {
    totalDamage *= 2;
  }
  
  // Redução de dano da armadura (se aplicável)
  const damageReduction = defenderStats.armor?.damageReduction || 0;
  const finalDamage = Math.max(1, totalDamage - damageReduction);
  
  return {
    success: true,
    attackRoll: attackTotal,
    targetDefense,
    margin,
    baseDamage,
    bonusDamage: marginDamage,
    totalDamage,
    reducedDamage: damageReduction,
    finalDamage,
    isCritical: critical,
    isFumble: false,
    effectTriggered: card.effect,
    distanceModifier: modifiers.distance ? DISTANCE_MODIFIERS[modifiers.distance].attack : undefined,
    coverBonus: modifiers.cover ? COVER_GUARD_BONUS[modifiers.cover] : undefined,
    message: critical 
      ? `CRÍTICO! ${attacker.name} causa ${finalDamage} de dano em ${defender.name}! (${attackTotal} vs ${targetDefense})`
      : `${attacker.name} acerta ${defender.name} causando ${finalDamage} de dano. (${attackTotal} vs ${targetDefense}, margem ${margin}×${damageRatio})`
  };
}

// ============= APLICAR RESULTADO =============

/**
 * Aplica o resultado de uma ação ao estado da batalha
 */
export function applyActionResult(
  state: BattleState,
  action: CombatAction,
  result: ActionResult
): BattleState {
  const newState = { ...state };
  newState.combatants = [...state.combatants];
  
  if (action.type === 'attack' && action.targetId && result.success && result.finalDamage) {
    const targetIndex = newState.combatants.findIndex(c => c.id === action.targetId);
    if (targetIndex >= 0) {
      const target = { ...newState.combatants[targetIndex] };
      target.stats = { ...target.stats };
      target.stats.vitality = Math.max(0, target.stats.vitality - result.finalDamage);
      
      // Verificar se está fora de combate
      if (target.stats.vitality <= 0) {
        target.stats.isDown = true;
      }
      
      newState.combatants[targetIndex] = target;
    }
  }
  
  // Adicionar ao log
  const logEntry: BattleLogEntry = {
    tick: state.currentTick,
    round: state.round,
    message: result.message,
    type: result.success ? 'damage' : 'action',
    combatantId: action.combatantId
  };
  newState.log = [...state.log, logEntry];
  
  return newState;
}

// ============= VERIFICAR CONDIÇÃO DE VITÓRIA =============

/**
 * Verifica se há um vencedor
 */
export function checkVictoryCondition(state: BattleState): 'player' | 'enemy' | 'draw' | null {
  const playerAlive = state.combatants.some(c => c.team === 'player' && !c.stats.isDown);
  const enemyAlive = state.combatants.some(c => c.team === 'enemy' && !c.stats.isDown);
  
  if (!playerAlive && !enemyAlive) return 'draw';
  if (!playerAlive) return 'enemy';
  if (!enemyAlive) return 'player';
  
  return null;
}

// ============= PRÓXIMO COMBATENTE =============

/**
 * Retorna o próximo combatente a agir baseado no tick atual
 */
export function getNextCombatant(state: BattleState): Combatant | null {
  const activeCombatants = state.combatants
    .filter(c => !c.stats.isDown)
    .sort((a, b) => a.stats.currentTick - b.stats.currentTick);
  
  return activeCombatants[0] || null;
}

// ============= INICIALIZAR BATALHA =============

/**
 * Inicializa o estado da batalha
 * 
 * Sistema de Ticks:
 * - Tick 0: Todos escolhem suas cartas simultaneamente (fase de escolha)
 * - O tick de ação = velocidade da carta + velocidade da arma
 * - Quem tiver menor tick de ação age primeiro
 * - Preparo NÃO afeta iniciativa - serve para fadiga (dano na evasão a cada X ticks)
 */
export function initializeBattle(combatants: Combatant[], withMap: boolean = true): BattleState {
  // Criar mapa se solicitado
  let map = undefined;
  if (withMap) {
    map = createBasicHexMap(10, 8);
    map = addRandomCover(map, 0.1);
  }
  
  // TODOS começam no tick 0 - a escolha do card define quando agirão
  const initializedCombatants = combatants.map((c, index) => {
    // Posicionar combatentes se houver mapa
    let position: HexCoord | undefined;
    if (withMap) {
      if (c.team === 'player') {
        // Jogadores no lado esquerdo
        position = { q: 1, r: 2 + index };
      } else {
        // Inimigos no lado direito
        const enemyIndex = combatants.filter((x, i) => i < index && x.team === 'enemy').length;
        position = { q: 8, r: 2 + enemyIndex };
      }
      // Marcar hex como ocupado
      if (map && position) {
        const tile = map.hexes.get(hexKey(position));
        if (tile) {
          tile.occupantId = c.id;
        }
      }
    }
    
    return {
      ...c,
      stats: {
        ...c.stats,
        currentTick: 0, // Todos começam no tick 0
        currentMovement: c.stats.movement,
        lastFatigueTick: 0,
        position,
        // Estado de escolha pendente - precisa escolher card
        pendingCardChoice: true
      }
    };
  });
  
  return {
    id: crypto.randomUUID(),
    currentTick: 0,
    maxTick: 100,
    phase: 'choosing', // Nova fase: escolha simultânea de cards
    combatants: initializedCombatants,
    actionQueue: [],
    pendingActions: [],
    log: [{
      tick: 0,
      round: 1,
      message: 'Combate iniciado! Escolha suas cartas.',
      type: 'system'
    }],
    round: 1,
    map
  };
}

// ============= ESCOLHER CARD (FASE DE ESCOLHA) =============

/**
 * Registra a escolha de card de um combatente
 * Na fase de escolha, todos escolhem simultaneamente
 * O tick de ação = velocidade do card + velocidade da arma
 */
export function chooseCard(
  state: BattleState,
  combatantId: string,
  cardId: string,
  targetId: string
): BattleState {
  const combatantIndex = state.combatants.findIndex(c => c.id === combatantId);
  if (combatantIndex < 0) return state;
  
  const combatant = state.combatants[combatantIndex];
  const card = getCardById(cardId);
  if (!card) return state;
  
  const weaponSpeed = combatant.stats.weapon?.speedModifier || 0;
  const armorPenalty = combatant.stats.armor?.speedPenalty || 0;
  
  // Calcular tick de ação baseado na velocidade do card + arma
  // IMPORTANTE: usar o tick atual da batalha como base (senão fica preso no 0)
  const actionTick = calculateActionTick(state.currentTick, card.speedModifier, weaponSpeed, armorPenalty);
  
  // Atualizar combatente com a escolha
  const updatedCombatant = {
    ...combatant,
    stats: {
      ...combatant.stats,
      currentTick: actionTick,
      pendingCardChoice: false,
      chosenCardId: cardId,
      chosenTargetId: targetId
    }
  };
  
  const newCombatants = [...state.combatants];
  newCombatants[combatantIndex] = updatedCombatant;
  
  // Verificar se todos escolheram
  const allChosen = newCombatants.every(c => !c.stats.pendingCardChoice || c.stats.isDown);
  
  let newState: BattleState = {
    ...state,
    combatants: newCombatants
  };
  
  // Se todos escolheram, mudar para fase de combate
  if (allChosen) {
    newState.phase = 'combat';
    newState.log = [...newState.log, {
      tick: 0,
      round: state.round,
      message: 'Todos escolheram! Resolvendo ações...',
      type: 'system'
    }];
  }
  
  return newState;
}

/**
 * IA escolhe card automaticamente
 */
export function aiChooseCard(state: BattleState, combatantId: string): BattleState {
  const combatant = state.combatants.find(c => c.id === combatantId);
  if (!combatant || !combatant.stats.pendingCardChoice) return state;
  
  // IA simples: escolhe carta aleatória
  const cards = combatant.stats.availableCards;
  if (cards.length === 0) return state;
  
  const randomCardId = cards[Math.floor(Math.random() * cards.length)];
  
  // Selecionar alvo (jogador vivo)
  const targets = state.combatants.filter(c => c.team === 'player' && !c.stats.isDown);
  if (targets.length === 0) return state;
  
  const randomTarget = targets[Math.floor(Math.random() * targets.length)];
  
  return chooseCard(state, combatantId, randomCardId, randomTarget.id);
}

// ============= EXECUTAR AÇÃO (FASE DE COMBATE) =============

/**
 * Resolve a próxima ação na timeline
 * Chamado quando é hora de um combatente agir (seu tick chegou)
 */
export function resolveNextAction(state: BattleState): BattleState {
  // Encontrar o combatente com menor tick (próximo a agir)
  const next = getNextCombatant(state);
  if (!next) return state;
  
  const cardId = next.stats.chosenCardId;
  const targetId = next.stats.chosenTargetId;
  
  if (!cardId || !targetId) {
    console.warn('Combatente sem card/alvo escolhido:', next.name);
    return state;
  }
  
  const target = state.combatants.find(c => c.id === targetId);
  const card = getCardById(cardId);
  
  if (!target || !card) return state;
  
  // Resolver ataque
  const result = resolveAttack({
    attacker: next,
    defender: target,
    card
  });
  
  // Criar ação
  const action: CombatAction = {
    id: crypto.randomUUID(),
    type: 'attack',
    combatantId: next.id,
    card,
    targetId,
    tick: next.stats.currentTick,
    executesAtTick: next.stats.currentTick,
    state: 'resolved',
    resolved: true,
    result
  };
  
  // Aplicar resultado
  let newState = applyActionResult(state, action, result);
  
  // Atualizar tick atual da batalha
  newState.currentTick = next.stats.currentTick;
  
  // Marcar que este combatente precisa escolher novo card
  const attackerIndex = newState.combatants.findIndex(c => c.id === next.id);
  if (attackerIndex >= 0) {
    const updatedAttacker = { ...newState.combatants[attackerIndex] };
    updatedAttacker.stats = {
      ...updatedAttacker.stats,
      pendingCardChoice: true,
      chosenCardId: undefined,
      chosenTargetId: undefined,
      // Aplicar movimento
      currentMovement: Math.max(0, updatedAttacker.stats.currentMovement + card.movementModifier)
    };
    newState.combatants[attackerIndex] = updatedAttacker;
  }
  
  // Adicionar ação à fila
  newState.actionQueue = [...newState.actionQueue, action];
  
  // Verificar vitória
  const victory = checkVictoryCondition(newState);
  if (victory) {
    newState.phase = victory === 'player' ? 'victory' : 'defeat';
    newState.winner = victory;
    newState.log = [...newState.log, {
      tick: newState.currentTick,
      round: newState.round,
      message: victory === 'player' ? 'Vitória!' : victory === 'enemy' ? 'Derrota!' : 'Empate!',
      type: 'system'
    }];
  } else {
    // Voltar para fase de escolha se alguém precisa escolher
    const needsChoice = newState.combatants.some(c => c.stats.pendingCardChoice && !c.stats.isDown);
    if (needsChoice) {
      newState.phase = 'choosing';
    }
  }
  
  return newState;
}

// ============= EXECUTAR AÇÃO (LEGADO - MANTER COMPATIBILIDADE) =============

/**
 * Executa uma ação de combate (modo legado)
 */
export function executeAction(
  state: BattleState,
  combatantId: string,
  cardId: string,
  targetId: string
): BattleState {
  const combatant = state.combatants.find(c => c.id === combatantId);
  const target = state.combatants.find(c => c.id === targetId);
  const card = getCardById(cardId);
  
  if (!combatant || !target || !card) {
    return state;
  }
  
  // Resolver ataque
  const result = resolveAttack({
    attacker: combatant,
    defender: target,
    card
  });
  
  // Criar ação
  const action: CombatAction = {
    id: crypto.randomUUID(),
    type: 'attack',
    combatantId,
    card,
    targetId,
    tick: state.currentTick,
    executesAtTick: state.currentTick,
    state: 'resolved',
    resolved: true,
    result
  };
  
  // Aplicar resultado
  let newState = applyActionResult(state, action, result);
  
  // Atualizar tick do atacante
  const attackerIndex = newState.combatants.findIndex(c => c.id === combatantId);
  if (attackerIndex >= 0) {
    const updatedAttacker = { ...newState.combatants[attackerIndex] };
    updatedAttacker.stats = { ...updatedAttacker.stats };
    
    const weaponSpeed = updatedAttacker.stats.weapon?.speedModifier || 0;
    const armorPenalty = updatedAttacker.stats.armor?.speedPenalty || 0;
    
    updatedAttacker.stats.currentTick = calculateActionTick(
      state.currentTick,
      card.speedModifier,
      weaponSpeed,
      armorPenalty
    );
    
    // Consumir movimento
    updatedAttacker.stats.currentMovement = Math.max(
      0, 
      updatedAttacker.stats.currentMovement + card.movementModifier
    );
    
    newState.combatants[attackerIndex] = updatedAttacker;
  }
  
  // Adicionar ação à fila
  newState.actionQueue = [...newState.actionQueue, action];
  
  // Verificar vitória
  const victory = checkVictoryCondition(newState);
  if (victory) {
    newState.phase = victory === 'player' ? 'victory' : 'defeat';
    newState.winner = victory;
    newState.log = [...newState.log, {
      tick: newState.currentTick,
      round: newState.round,
      message: victory === 'player' ? 'Vitória!' : victory === 'enemy' ? 'Derrota!' : 'Empate!',
      type: 'system'
    }];
  }
  
  return newState;
}

/**
 * Avança o tick para o próximo combatente
 */
export function advanceToNextTick(state: BattleState): BattleState {
  const next = getNextCombatant(state);
  if (!next) return state;
  
  const newTick = next.stats.currentTick;
  
  // Verificar mudança de rodada (a cada 10 ticks)
  const newRound = Math.floor(newTick / 10) + 1;
  
  // Resetar movimento se mudou de rodada
  let combatants = state.combatants;
  if (newRound > state.round) {
    combatants = state.combatants.map(c => ({
      ...c,
      stats: {
        ...c.stats,
        currentMovement: c.stats.movement
      }
    }));
  }
  
  return {
    ...state,
    combatants,
    currentTick: newTick,
    round: newRound
  };
}
