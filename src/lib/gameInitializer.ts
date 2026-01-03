import { 
  TacticalGameState, 
  BattleUnit, 
  BattleCommander, 
  HexData,
  HexCoord,
  PlayerId 
} from '@/types/tactical-game';
import { generateMapHexes, hexKey } from '@/lib/hexUtils';
import { StrategicArmy, StrategicArmyCommander, calculateHitPoints, calculateDefense } from '@/types/combat/strategic-army';

// Tipos para dados de terreno
interface TerrainConfig {
  primaryTerrain?: { id: string; name: string; modifiers?: any };
  secondaryTerrains?: Array<{ id: string; name: string; modifiers?: any }>;
  season?: { id: string; name: string; modifiers?: any };
}

interface TacticalMatchData {
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

interface ArmyDataForBattle {
  id: string;
  name: string;
  culture?: string;
  cultureName?: string;
  totalVet: number;
  attack: number;
  defense: number;
  mobility: number;
  hitPoints: number;
  commanders: StrategicArmyCommander[];
  units: GeneratedUnit[];
}

interface GeneratedUnit {
  id: string;
  name: string;
  unitType: 'Infantaria' | 'Cavalaria' | 'Arqueiros' | 'Cerco';
  experience: 'Amador' | 'Recruta' | 'Profissional' | 'Veterano' | 'Elite' | 'Lendário';
  attack: number;
  defense: number;
  ranged: number;
  movement: number;
  morale: number;
  specialAbilities: Array<{ id: string; name: string; level: 1 | 2; description: string }>;
}

// Gerar unidades baseado nos atributos do exército
function generateUnitsFromArmy(army: StrategicArmy, cultureName?: string): GeneratedUnit[] {
  const units: GeneratedUnit[] = [];
  
  // Número base de unidades baseado em VET (1 unidade por 20 VET, mínimo 3)
  const unitCount = Math.max(3, Math.min(10, Math.floor(army.totalVet / 20)));
  
  // Distribuição de tipos baseada na cultura e atributos
  // Exércitos com alta mobilidade têm mais cavalaria
  // Exércitos com alto ataque têm mais infantaria ofensiva
  // Exércitos com alta defesa têm infantaria defensiva
  
  const hasCavalry = army.mobility >= 2;
  const hasArchers = army.attack >= 2;
  
  for (let i = 0; i < unitCount; i++) {
    let unitType: GeneratedUnit['unitType'] = 'Infantaria';
    let specialAbilities: GeneratedUnit['specialAbilities'] = [];
    
    // Determinar tipo de unidade
    if (i === 0 && hasCavalry) {
      unitType = 'Cavalaria';
      specialAbilities = [{ 
        id: 'charge', 
        name: 'Carga', 
        level: 1, 
        description: 'Pode usar postura Carga para dobrar movimento'
      }];
    } else if (i === 1 && hasArchers) {
      unitType = 'Arqueiros';
    } else if (i % 3 === 0 && hasCavalry && i > 0) {
      unitType = 'Cavalaria';
      specialAbilities = [{ 
        id: 'charge', 
        name: 'Carga', 
        level: 1, 
        description: 'Pode usar postura Carga'
      }];
    } else if (i % 4 === 0 && hasArchers) {
      unitType = 'Arqueiros';
    } else {
      // Infantaria com possível Escudo
      if (army.defense >= 3 && i % 2 === 0) {
        specialAbilities = [{ 
          id: 'shield', 
          name: 'Escudo', 
          level: 1, 
          description: 'Pode usar postura Defensiva'
        }];
      }
    }
    
    // Determinar experiência baseado em VET
    let experience: GeneratedUnit['experience'] = 'Profissional';
    if (army.totalVet >= 150) {
      experience = i === 0 ? 'Elite' : 'Veterano';
    } else if (army.totalVet >= 100) {
      experience = 'Profissional';
    } else {
      experience = 'Recruta';
    }
    
    // Stats base + bônus do exército
    const baseStats = getBaseStatsByType(unitType);
    
    const unit: GeneratedUnit = {
      id: `${army.id}-unit-${i}`,
      name: `${getUnitTypeName(unitType, cultureName)} ${i + 1}`,
      unitType,
      experience,
      attack: baseStats.attack + Math.floor(army.attack / 2),
      defense: baseStats.defense + Math.floor((army.defense - 5) / 2),
      ranged: baseStats.ranged,
      movement: baseStats.movement + Math.floor(army.mobility / 2),
      morale: baseStats.morale + getExperienceMoraleBonus(experience),
      specialAbilities,
    };
    
    units.push(unit);
  }
  
  return units;
}

function getBaseStatsByType(unitType: GeneratedUnit['unitType']): { attack: number; defense: number; ranged: number; movement: number; morale: number } {
  switch (unitType) {
    case 'Infantaria':
      return { attack: 2, defense: 3, ranged: 0, movement: 3, morale: 3 };
    case 'Cavalaria':
      return { attack: 3, defense: 2, ranged: 0, movement: 5, morale: 3 };
    case 'Arqueiros':
      return { attack: 1, defense: 2, ranged: 3, movement: 3, morale: 2 };
    case 'Cerco':
      return { attack: 4, defense: 1, ranged: 0, movement: 2, morale: 2 };
    default:
      return { attack: 2, defense: 2, ranged: 0, movement: 3, morale: 3 };
  }
}

function getUnitTypeName(unitType: GeneratedUnit['unitType'], cultureName?: string): string {
  const culturePrefix = cultureName ? `${cultureName} ` : '';
  switch (unitType) {
    case 'Infantaria':
      return `${culturePrefix}Infantaria`;
    case 'Cavalaria':
      return `${culturePrefix}Cavalaria`;
    case 'Arqueiros':
      return `${culturePrefix}Arqueiros`;
    case 'Cerco':
      return `${culturePrefix}Cerco`;
    default:
      return `${culturePrefix}Unidade`;
  }
}

function getExperienceMoraleBonus(experience: GeneratedUnit['experience']): number {
  switch (experience) {
    case 'Amador': return -1;
    case 'Recruta': return 0;
    case 'Profissional': return 1;
    case 'Veterano': return 2;
    case 'Elite': return 3;
    case 'Lendário': return 4;
    default: return 0;
  }
}

export function convertStrategicArmyToArmyData(army: StrategicArmy): ArmyDataForBattle {
  const units = generateUnitsFromArmy(army, army.cultureName);
  
  return {
    id: army.id,
    name: army.name,
    culture: army.culture,
    cultureName: army.cultureName,
    totalVet: army.totalVet,
    attack: army.attack,
    defense: army.defense,
    mobility: army.mobility,
    hitPoints: army.hitPoints,
    commanders: army.commanders,
    units,
  };
}

export function initializeTacticalGame(
  match: TacticalMatchData,
  player1Army: ArmyDataForBattle,
  player2Army: ArmyDataForBattle,
  terrainConfig?: TerrainConfig
): TacticalGameState {
  // Gerar hexágonos do mapa com terreno
  const hexes = generateHexesWithTerrain(terrainConfig);
  
  const units: Record<string, BattleUnit> = {};
  const commanders: Record<string, BattleCommander> = {};
  
  // Calcular posições de deploy
  const p1Positions = calculateDeployPositions('player1', player1Army.units.length);
  const p2Positions = calculateDeployPositions('player2', player2Army.units.length);
  
  // Criar unidades do Player 1
  player1Army.units.forEach((genUnit, index) => {
    const position = p1Positions[index] || p1Positions[p1Positions.length - 1];
    const unit = createBattleUnitFromGenerated(genUnit, 'player1', position, 'SE', player1Army.cultureName);
    units[unit.id] = unit;
    
    const posKey = hexKey(position);
    if (hexes[posKey]) {
      hexes[posKey] = { ...hexes[posKey], unitId: unit.id };
    }
  });
  
  // Criar unidades do Player 2
  player2Army.units.forEach((genUnit, index) => {
    const position = p2Positions[index] || p2Positions[p2Positions.length - 1];
    const unit = createBattleUnitFromGenerated(genUnit, 'player2', position, 'NW', player2Army.cultureName);
    units[unit.id] = unit;
    
    const posKey = hexKey(position);
    if (hexes[posKey]) {
      hexes[posKey] = { ...hexes[posKey], unitId: unit.id };
    }
  });
  
  // Criar comandantes do Player 1
  const p1General = player1Army.commanders.find(c => c.isGeneral);
  if (p1General) {
    const cmd = createBattleCommanderFromStrategic(p1General, 'player1');
    const firstUnit = Object.values(units).find(u => u.owner === 'player1');
    if (firstUnit) {
      cmd.isEmbedded = true;
      cmd.embeddedUnitId = firstUnit.id;
      cmd.position = firstUnit.position;
    }
    commanders[cmd.id] = cmd;
  }
  
  // Comandantes adicionais do Player 1
  player1Army.commanders.filter(c => !c.isGeneral).forEach((cmdData, idx) => {
    const cmd = createBattleCommanderFromStrategic(cmdData, 'player1');
    const unitToEmbed = Object.values(units).filter(u => u.owner === 'player1')[idx + 1];
    if (unitToEmbed) {
      cmd.isEmbedded = true;
      cmd.embeddedUnitId = unitToEmbed.id;
      cmd.position = unitToEmbed.position;
    }
    commanders[cmd.id] = cmd;
  });
  
  // Criar comandantes do Player 2
  const p2General = player2Army.commanders.find(c => c.isGeneral);
  if (p2General) {
    const cmd = createBattleCommanderFromStrategic(p2General, 'player2');
    const firstUnit = Object.values(units).find(u => u.owner === 'player2');
    if (firstUnit) {
      cmd.isEmbedded = true;
      cmd.embeddedUnitId = firstUnit.id;
      cmd.position = firstUnit.position;
    }
    commanders[cmd.id] = cmd;
  }
  
  // Comandantes adicionais do Player 2
  player2Army.commanders.filter(c => !c.isGeneral).forEach((cmdData, idx) => {
    const cmd = createBattleCommanderFromStrategic(cmdData, 'player2');
    const unitToEmbed = Object.values(units).filter(u => u.owner === 'player2')[idx + 1];
    if (unitToEmbed) {
      cmd.isEmbedded = true;
      cmd.embeddedUnitId = unitToEmbed.id;
      cmd.position = unitToEmbed.position;
    }
    commanders[cmd.id] = cmd;
  });
  
  return {
    id: crypto.randomUUID(),
    matchId: match.id,
    turn: 1,
    phase: 'initiative',
    
    player1Id: match.player1_id,
    player1Name: match.player1_name,
    player1ArmyId: match.player1_army_id || '',
    player1Culture: player1Army.cultureName,
    
    player2Id: match.player2_id || '',
    player2Name: match.player2_name || '',
    player2ArmyId: match.player2_army_id || '',
    player2Culture: player2Army.cultureName,
    
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
      message: `⚔️ Batalha iniciada: ${match.player1_name} vs ${match.player2_name}!`,
    }],
    
    isFinished: false,
  };
}

function generateHexesWithTerrain(terrainConfig?: TerrainConfig): Record<string, HexData> {
  const hexes: Record<string, HexData> = {};
  const mapHexes = generateMapHexes();
  
  // Determinar terreno base
  const baseTerrain = terrainConfig?.primaryTerrain?.name?.toLowerCase() || 'plains';
  
  // Mapear nomes de terreno para tipos válidos
  const terrainMap: Record<string, HexData['terrain']> = {
    'planície': 'plains',
    'planícies': 'plains',
    'plains': 'plains',
    'floresta': 'forest',
    'forest': 'forest',
    'colina': 'hill',
    'colinas': 'hill',
    'hill': 'hill',
    'hills': 'hill',
    'rio': 'river',
    'river': 'river',
    'fortificação': 'fortification',
    'fortification': 'fortification',
  };
  
  const primaryTerrain = terrainMap[baseTerrain] || 'plains';
  
  // Coletar terrenos secundários
  const secondaryTerrains = terrainConfig?.secondaryTerrains?.map(
    t => terrainMap[t.name.toLowerCase()] || 'plains'
  ).filter(t => t !== 'plains') || [];
  
  for (const coord of mapHexes) {
    const key = hexKey(coord);
    
    // Determinar terreno deste hex
    let terrain: HexData['terrain'] = primaryTerrain;
    
    // Adicionar variação com terrenos secundários
    if (secondaryTerrains.length > 0) {
      const rand = Math.random();
      if (rand < 0.15) {
        terrain = secondaryTerrains[Math.floor(Math.random() * secondaryTerrains.length)];
      }
    } else {
      // Variação aleatória padrão
      if (Math.random() < 0.08) terrain = 'forest';
      if (Math.random() < 0.04) terrain = 'hill';
    }
    
    hexes[key] = { coord, terrain };
  }
  
  return hexes;
}

function calculateDeployPositions(player: PlayerId, unitCount: number): HexCoord[] {
  const positions: HexCoord[] = [];
  const startCol = player === 'player1' ? 0 : 17;
  
  for (let i = 0; i < unitCount; i++) {
    const colOffset = Math.floor(i / 10);
    const col = player === 'player1' 
      ? startCol + colOffset 
      : startCol - colOffset;
    const row = (i % 10) + 1;
    const q = Math.max(0, Math.min(19, col));
    const r = row - Math.floor(q / 2);
    positions.push({ q, r });
  }
  
  return positions;
}

function createBattleUnitFromGenerated(
  genUnit: GeneratedUnit,
  owner: PlayerId,
  position: HexCoord,
  facing: string,
  culture?: string
): BattleUnit {
  return {
    id: crypto.randomUUID(),
    cardId: genUnit.id,
    name: genUnit.name,
    unitType: genUnit.unitType,
    experience: genUnit.experience,
    culture,
    
    baseAttack: genUnit.attack,
    baseDefense: genUnit.defense,
    baseRanged: genUnit.ranged,
    baseMovement: genUnit.movement,
    baseMorale: genUnit.morale,
    
    currentAttack: genUnit.attack,
    currentDefense: genUnit.defense,
    currentRanged: genUnit.ranged,
    currentMovement: genUnit.movement,
    currentMorale: genUnit.morale,
    
    maxHealth: genUnit.defense,
    currentHealth: genUnit.defense,
    maxPressure: genUnit.morale,
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
    specialAbilities: genUnit.specialAbilities.map(a => ({
      id: a.id,
      name: a.name,
      level: a.level,
      cost: 0,
      description: a.description,
    })),
  };
}

function createBattleCommanderFromStrategic(
  commander: StrategicArmyCommander,
  owner: PlayerId
): BattleCommander {
  return {
    id: crypto.randomUUID(),
    name: `Comandante ${commander.especializacao}`,
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
