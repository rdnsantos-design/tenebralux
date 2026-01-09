/**
 * Engine de Combate Tático Individual
 * 
 * Sistema de Timeline (Ticks):
 * - Velocidade Total = Base de Reação + Velocidade da Manobra + Velocidade da Arma
 * 
 * Ataque:
 * - 2d6 + Atributo + Perícia vs Guarda do Oponente
 * - Crítico: 12 natural (dobra dano)
 * - Falha Crítica: 2 natural (consequência negativa)
 * 
 * Dano:
 * - Dano Base da Arma + (Margem de Sucesso ÷ Escala da Arma)
 * - Absorção reduz dano (mínimo 1 se acertou)
 */

import { 
  BattleState, 
  Combatant, 
  CombatAction, 
  ActionResult, 
  CombatManeuver,
  BattleLogEntry,
  getPostureModifiers
} from '@/types/tactical-combat';
import { getManeuverById } from '@/data/combat/maneuvers';

// ============= CÁLCULOS DERIVADOS =============

/**
 * Calcula a Base de Reação do combatente
 * Fórmula: (Reflexos + Prontidão) ÷ 2
 */
export function calculateReactionBase(reflexos: number, prontidao: number): number {
  return Math.floor((reflexos + prontidao) / 2);
}

/**
 * Calcula a Guarda do combatente
 * Fórmula: 7 + Reflexos + Luta (ou Lâminas se maior)
 */
export function calculateGuard(reflexos: number, luta: number, laminas: number): number {
  const bestMelee = Math.max(luta, laminas);
  return 7 + reflexos + bestMelee;
}

/**
 * Calcula a Evasão do combatente
 * Fórmula: 7 + Reflexos + Esquiva - Penalidade de Armadura
 */
export function calculateEvasion(reflexos: number, esquiva: number, armorPenalty: number = 0): number {
  return 7 + reflexos + esquiva - armorPenalty;
}

/**
 * Calcula a Vitalidade do combatente
 * Fórmula: 10 + (Corpo × 2) + Resistência
 */
export function calculateVitality(corpo: number, resistencia: number): number {
  return 10 + (corpo * 2) + resistencia;
}

/**
 * Calcula o Movimento do combatente
 * Fórmula: Corpo + Atletismo
 */
export function calculateMovement(corpo: number, atletismo: number): number {
  return corpo + atletismo;
}

/**
 * Calcula o Preparo do combatente (ticks de setup inicial)
 * Fórmula: 10 - Base de Reação (mínimo 1)
 */
export function calculatePrep(reactionBase: number): number {
  return Math.max(1, 10 - reactionBase);
}

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
 * Fórmula: Tick Atual + Base de Reação + Velocidade da Manobra + Velocidade da Arma
 */
export function calculateActionTick(
  currentTick: number,
  reactionBase: number,
  maneuverTime: number,
  weaponTime: number
): number {
  return currentTick + reactionBase + maneuverTime + weaponTime;
}

// ============= RESOLUÇÃO DE ATAQUE =============

export interface AttackParams {
  attacker: Combatant;
  defender: Combatant;
  maneuver: CombatManeuver;
}

/**
 * Resolve um ataque entre dois combatentes
 */
export function resolveAttack(params: AttackParams): ActionResult {
  const { attacker, defender, maneuver } = params;
  const stats = attacker.stats;
  const defenderStats = defender.stats;
  
  // Determinar atributo e perícia baseado na skill da manobra
  let attribute = 0;
  let skill = 0;
  
  switch (maneuver.skill) {
    case 'luta':
      attribute = stats.attributes.reflexos;
      skill = stats.skills.luta;
      break;
    case 'laminas':
      attribute = stats.attributes.coordenacao;
      skill = stats.skills.laminas;
      break;
    case 'tiro':
      attribute = stats.attributes.coordenacao;
      skill = stats.skills.tiro;
      break;
  }
  
  // Modificadores de postura
  const postureModsAttacker = getPostureModifiers(stats.posture);
  const postureModsDefender = getPostureModifiers(defenderStats.posture);
  
  // Rolar dados
  const roll = roll2d6();
  const critical = isCritical(roll.dice);
  const fumble = isFumble(roll.dice);
  
  // Calcular bônus de ataque
  let attackBonus = attribute + skill + maneuver.attackModifier + postureModsAttacker.attack;
  
  // Bônus especial para Tiro com Mira: +Tiro × 2
  if (maneuver.id === 'aimed_shot') {
    attackBonus += stats.skills.tiro * 2;
  }
  
  const attackTotal = roll.total + attackBonus;
  
  // Determinar defesa (Guarda ou Evasão baseado no tipo de ataque)
  let targetDefense: number;
  let defenseType: 'guard' | 'evasion';
  
  if (maneuver.skill === 'tiro') {
    // Ataques à distância usam Evasão
    targetDefense = defenderStats.evasion + postureModsDefender.evasion;
    defenseType = 'evasion';
  } else {
    // Ataques corpo a corpo usam Guarda
    targetDefense = defenderStats.guard + postureModsDefender.defense;
    defenseType = 'guard';
  }
  
  // Verificar acerto
  if (fumble) {
    return {
      success: false,
      attackRoll: roll.total,
      targetGuard: targetDefense,
      isCritical: false,
      isFumble: true,
      message: `${attacker.name} cometeu uma falha crítica!`
    };
  }
  
  const margin = attackTotal - targetDefense;
  
  if (margin < 0 && !critical) {
    return {
      success: false,
      attackRoll: attackTotal,
      targetGuard: targetDefense,
      margin,
      isCritical: false,
      isFumble: false,
      message: `${attacker.name} errou o ataque contra ${defender.name}. (${attackTotal} vs ${targetDefense})`
    };
  }
  
  // Calcular dano
  const weapon = stats.weapon;
  const baseDamage = weapon?.baseDamage || 2; // Dano desarmado padrão
  const damageScale = weapon?.damageScale || 4; // Escala desarmada padrão
  
  // Dano bônus: margem ÷ escala
  const bonusDamage = Math.floor(Math.max(0, margin) / damageScale);
  
  // Multiplicador de dano da manobra
  let totalDamage = Math.floor((baseDamage + bonusDamage) * maneuver.damageMultiplier);
  
  // Crítico dobra o dano
  if (critical) {
    totalDamage *= 2;
  }
  
  // Absorção da armadura
  const absorption = defenderStats.armor?.absorption || 0;
  const finalDamage = Math.max(1, totalDamage - absorption); // Mínimo 1 de dano se acertou
  
  return {
    success: true,
    attackRoll: attackTotal,
    targetGuard: targetDefense,
    margin,
    baseDamage,
    bonusDamage,
    totalDamage,
    absorbed: Math.min(absorption, totalDamage - 1),
    finalDamage,
    isCritical: critical,
    isFumble: false,
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
 */
export function initializeBattle(combatants: Combatant[]): BattleState {
  // Calcular prep para cada combatente e definir tick inicial
  const initializedCombatants = combatants.map(c => {
    const prep = calculatePrep(c.stats.reactionBase);
    return {
      ...c,
      stats: {
        ...c.stats,
        currentTick: prep
      }
    };
  });
  
  return {
    id: crypto.randomUUID(),
    currentTick: 0,
    phase: 'combat',
    combatants: initializedCombatants,
    actionQueue: [],
    log: [{
      tick: 0,
      round: 1,
      message: 'Combate iniciado!',
      type: 'system'
    }],
    round: 1
  };
}

// ============= EXECUTAR AÇÃO =============

/**
 * Executa uma ação de combate
 */
export function executeAction(
  state: BattleState,
  combatantId: string,
  maneuverId: string,
  targetId: string
): BattleState {
  const combatant = state.combatants.find(c => c.id === combatantId);
  const target = state.combatants.find(c => c.id === targetId);
  const maneuver = getManeuverById(maneuverId);
  
  if (!combatant || !target || !maneuver) {
    return state;
  }
  
  // Resolver ataque
  const result = resolveAttack({
    attacker: combatant,
    defender: target,
    maneuver
  });
  
  // Criar ação
  const action: CombatAction = {
    id: crypto.randomUUID(),
    type: 'attack',
    combatantId,
    maneuver,
    targetId,
    tick: state.currentTick,
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
    
    const weaponTime = updatedAttacker.stats.weapon?.timeModifier || 0;
    updatedAttacker.stats.currentTick = calculateActionTick(
      state.currentTick,
      updatedAttacker.stats.reactionBase,
      maneuver.timeModifier,
      weaponTime
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
  
  return {
    ...state,
    currentTick: newTick,
    round: newRound
  };
}
