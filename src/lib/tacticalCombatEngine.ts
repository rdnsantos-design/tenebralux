/**
 * Engine de Combate Tático Individual
 * 
 * Sistema de Timeline (Ticks):
 * - Velocidade Total = Reação + Velocidade da Carta + Velocidade da Arma
 * 
 * Ataque:
 * - 2d6 + Coordenação/Reflexos + Perícia + Modificador da Carta vs Guarda/Evasão
 * - Crítico: 12 natural (dobra dano)
 * - Falha Crítica: 2 natural (consequência negativa)
 * 
 * Dano:
 * - Dano da Arma + Margem de Sucesso - Redução de Armadura
 */

import { 
  BattleState, 
  Combatant, 
  CombatAction, 
  ActionResult, 
  CombatCard,
  BattleLogEntry,
  HexCoord,
  calculateReaction,
  calculateGuard,
  calculateEvasion,
  calculateVitality,
  calculateMovement,
  calculatePrep
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
 * Verifica se é crítico (12 natural)
 */
export function isCritical(dice: [number, number]): boolean {
  return dice[0] + dice[1] === 12;
}

/**
 * Verifica se é falha crítica (2 natural)
 */
export function isFumble(dice: [number, number]): boolean {
  return dice[0] + dice[1] === 2;
}

// ============= CÁLCULO DE VELOCIDADE =============

/**
 * Calcula o tick em que a ação será resolvida
 * Fórmula: Tick Atual + Velocidade da Carta + Velocidade da Arma
 * (Menor reação = age mais rápido, mas a carta e arma adicionam tempo)
 */
export function calculateActionTick(
  currentTick: number,
  cardSpeed: number,
  weaponSpeed: number,
  armorSpeedPenalty: number = 0
): number {
  return currentTick + cardSpeed + weaponSpeed + armorSpeedPenalty;
}

// ============= RESOLUÇÃO DE ATAQUE =============

export interface AttackParams {
  attacker: Combatant;
  defender: Combatant;
  card: CombatCard;
}

/**
 * Resolve um ataque entre dois combatentes
 */
export function resolveAttack(params: AttackParams): ActionResult {
  const { attacker, defender, card } = params;
  const stats = attacker.stats;
  const defenderStats = defender.stats;
  
  // Determinar atributo e perícia baseado no tipo de arma
  let attribute = 0;
  let skill = 0;
  
  const weaponType = stats.weapon?.type;
  
  if (weaponType === 'melee') {
    // Armas corpo a corpo usam Reflexos + Luta ou Lâminas
    attribute = stats.attributes.reflexos;
    skill = Math.max(stats.skills.luta, stats.skills.laminas);
  } else {
    // Armas de distância usam Coordenação + Tiro
    attribute = stats.attributes.coordenacao;
    skill = stats.skills.tiro;
  }
  
  // Rolar dados
  const roll = roll2d6();
  const critical = isCritical(roll.dice);
  const fumble = isFumble(roll.dice);
  
  // Calcular bônus de ataque
  const weaponAttackMod = stats.weapon?.attackModifier || 0;
  const attackBonus = attribute + skill + card.attackModifier + weaponAttackMod;
  const attackTotal = roll.total + attackBonus;
  
  // Determinar defesa (Guarda para melee, Evasão para ranged)
  let targetDefense: number;
  
  if (weaponType === 'melee') {
    targetDefense = defenderStats.guard;
  } else {
    targetDefense = defenderStats.evasion;
  }
  
  // Verificar falha crítica
  if (fumble) {
    return {
      success: false,
      attackRoll: roll.total,
      targetDefense,
      isCritical: false,
      isFumble: true,
      message: `${attacker.name} cometeu uma falha crítica!`
    };
  }
  
  const margin = attackTotal - targetDefense;
  
  // Verificar acerto (crítico sempre acerta)
  if (margin < 0 && !critical) {
    return {
      success: false,
      attackRoll: attackTotal,
      targetDefense,
      margin,
      isCritical: false,
      isFumble: false,
      message: `${attacker.name} errou o ataque contra ${defender.name}. (${attackTotal} vs ${targetDefense})`
    };
  }
  
  // Calcular dano
  const baseDamage = stats.weapon?.damage || 1;
  
  // Dano total = dano base + margem de sucesso
  let totalDamage = baseDamage + Math.max(0, margin);
  
  // Crítico dobra o dano
  if (critical) {
    totalDamage *= 2;
  }
  
  // Redução de dano da armadura
  const damageReduction = defenderStats.armor?.damageReduction || 0;
  const finalDamage = Math.max(1, totalDamage - damageReduction);
  
  return {
    success: true,
    attackRoll: attackTotal,
    targetDefense,
    margin,
    baseDamage,
    bonusDamage: Math.max(0, margin),
    totalDamage,
    reducedDamage: damageReduction,
    finalDamage,
    isCritical: critical,
    isFumble: false,
    effectTriggered: card.effect,
    message: critical 
      ? `CRÍTICO! ${attacker.name} causa ${finalDamage} de dano em ${defender.name}!`
      : `${attacker.name} acerta ${defender.name} causando ${finalDamage} de dano. (${attackTotal} vs ${targetDefense})`
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
  const actionTick = calculateActionTick(0, card.speedModifier, weaponSpeed, armorPenalty);
  
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
