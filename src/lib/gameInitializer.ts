import { 
  TacticalGameState, 
  BattleUnit, 
  BattleCommander, 
  HexData,
  HexCoord,
  PlayerId 
} from '@/types/tactical-game';
import { generateMapHexes, hexKey } from '@/lib/hexUtils';

interface TacticalMatch {
  id: string;
  player1_id: string;
  player1_name: string;
  player1_army_id?: string | null;
  player2_id?: string | null;
  player2_name?: string | null;
  player2_army_id?: string | null;
  primary_terrain_id?: string | null;
  secondary_terrain_ids?: string[] | null;
  season_id?: string | null;
}

interface ArmyData {
  id: string;
  name: string;
  units: Array<{
    id: string;
    name: string;
    unit_type: string;
    experience: string;
    attack: number;
    defense: number;
    ranged: number;
    movement: number;
    morale: number;
    special_abilities?: Array<{ id: string; name: string; level: number; description: string }>;
  }>;
  commander?: {
    id: string;
    nome_comandante: string;
    estrategia: number;
    comando: number;
    guarda: number;
  };
}

export function initializeTacticalGame(
  match: TacticalMatch,
  player1Army: ArmyData,
  player2Army: ArmyData
): TacticalGameState {
  // Gerar hexágonos do mapa
  const hexes: Record<string, HexData> = {};
  const mapHexes = generateMapHexes();
  
  for (const coord of mapHexes) {
    const key = hexKey(coord);
    // Adicionar variação de terreno aleatória para visualização
    let terrain: HexData['terrain'] = 'plains';
    if (Math.random() < 0.08) terrain = 'forest';
    if (Math.random() < 0.04) terrain = 'hill';
    
    hexes[key] = { coord, terrain };
  }
  
  const units: Record<string, BattleUnit> = {};
  const commanders: Record<string, BattleCommander> = {};
  
  // Posicionar unidades do Player 1 (esquerda, colunas 0-2)
  player1Army.units.forEach((armyUnit, index) => {
    const col = Math.floor(index / 10);
    const row = index % 10 + 1;
    const position: HexCoord = { q: col, r: row - Math.floor(col / 2) };
    
    const unit = createBattleUnit(armyUnit, 'player1', position, 'SE');
    units[unit.id] = unit;
    
    const posKey = hexKey(position);
    if (hexes[posKey]) {
      hexes[posKey] = { ...hexes[posKey], unitId: unit.id };
    }
  });
  
  // Posicionar unidades do Player 2 (direita, colunas 17-19)
  player2Army.units.forEach((armyUnit, index) => {
    const col = 19 - Math.floor(index / 10);
    const row = index % 10 + 1;
    const position: HexCoord = { q: col, r: row - Math.floor(col / 2) };
    
    const unit = createBattleUnit(armyUnit, 'player2', position, 'NW');
    units[unit.id] = unit;
    
    const posKey = hexKey(position);
    if (hexes[posKey]) {
      hexes[posKey] = { ...hexes[posKey], unitId: unit.id };
    }
  });
  
  // Comandantes
  if (player1Army.commander) {
    const cmd = createBattleCommander(player1Army.commander, 'player1');
    // Embarcar na primeira unidade
    const firstUnit = Object.values(units).find(u => u.owner === 'player1');
    if (firstUnit) {
      cmd.isEmbedded = true;
      cmd.embeddedUnitId = firstUnit.id;
      cmd.position = firstUnit.position;
    }
    commanders[cmd.id] = cmd;
  }
  
  if (player2Army.commander) {
    const cmd = createBattleCommander(player2Army.commander, 'player2');
    const firstUnit = Object.values(units).find(u => u.owner === 'player2');
    if (firstUnit) {
      cmd.isEmbedded = true;
      cmd.embeddedUnitId = firstUnit.id;
      cmd.position = firstUnit.position;
    }
    commanders[cmd.id] = cmd;
  }
  
  return {
    id: crypto.randomUUID(),
    matchId: match.id,
    turn: 1,
    phase: 'initiative',
    
    player1Id: match.player1_id,
    player1Name: match.player1_name,
    player1ArmyId: match.player1_army_id || '',
    
    player2Id: match.player2_id || '',
    player2Name: match.player2_name || '',
    player2ArmyId: match.player2_army_id || '',
    
    activePlayer: 'player1',
    initiativeAdvantage: 0,
    unitsMovedThisPhase: 0,
    
    units,
    commanders,
    hexes,
    
    validMoves: [],
    validTargets: [],
    
    primaryTerrainId: match.primary_terrain_id || undefined,
    secondaryTerrainIds: match.secondary_terrain_ids || [],
    seasonId: match.season_id || undefined,
    
    battleLog: [{
      id: crypto.randomUUID(),
      turn: 1,
      phase: 'setup',
      timestamp: Date.now(),
      type: 'system',
      message: `Batalha iniciada: ${match.player1_name} vs ${match.player2_name}!`,
    }],
    
    isFinished: false,
  };
}

function createBattleUnit(
  armyUnit: ArmyData['units'][0],
  owner: PlayerId,
  position: HexCoord,
  facing: string
): BattleUnit {
  return {
    id: crypto.randomUUID(),
    cardId: armyUnit.id,
    name: armyUnit.name,
    unitType: armyUnit.unit_type as BattleUnit['unitType'],
    experience: armyUnit.experience as BattleUnit['experience'],
    
    baseAttack: armyUnit.attack,
    baseDefense: armyUnit.defense,
    baseRanged: armyUnit.ranged,
    baseMovement: armyUnit.movement,
    baseMorale: armyUnit.morale,
    
    currentAttack: armyUnit.attack,
    currentDefense: armyUnit.defense,
    currentRanged: armyUnit.ranged,
    currentMovement: armyUnit.movement,
    currentMorale: armyUnit.morale,
    
    maxHealth: armyUnit.defense,
    currentHealth: armyUnit.defense,
    maxPressure: armyUnit.morale,
    currentPressure: 0,
    permanentPressure: 0,
    
    owner,
    position,
    facing: facing as BattleUnit['facing'],
    posture: 'Ofensiva',
    isRouting: false,
    hasActedThisTurn: false,
    hitsReceived: 0,
    
    availableTacticalCards: [],
    specialAbilities: (armyUnit.special_abilities || []).map(a => ({
      id: a.id,
      name: a.name,
      level: (a.level === 1 || a.level === 2 ? a.level : 1) as 1 | 2,
      cost: 0,
      description: a.description,
    })),
  };
}

function createBattleCommander(
  commander: NonNullable<ArmyData['commander']>,
  owner: PlayerId
): BattleCommander {
  return {
    id: crypto.randomUUID(),
    name: commander.nome_comandante,
    owner,
    strategy: commander.estrategia,
    command: commander.comando,
    guard: commander.guarda,
    position: { q: 0, r: 0 },
    isEmbedded: false,
    hasActedThisTurn: false,
    usedCommandThisTurn: 0,
  };
}
