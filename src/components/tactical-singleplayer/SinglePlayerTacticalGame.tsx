/**
 * Componente principal do jogo tático single player
 * Gerencia o estado local e integra o bot
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HexGrid } from '@/components/tactical/HexGrid';
import { 
  TacticalGameState, 
  BattleUnit, 
  BattleCommander,
  HexCoord, 
  GamePhase,
  PlayerId,
  BattleLogEntry,
  HexData,
} from '@/types/tactical-game';
import { 
  BotDifficulty, 
  decideBotAction, 
  getBotThinkingDelay 
} from '@/lib/tacticalHexBotEngine';
import { hexKey, getNeighbors, hexDistance, generateMapHexes, isValidHex } from '@/lib/hexUtils';
import { ArrowLeft, Bot, User, Clock, Target, Loader2, SkipForward } from 'lucide-react';
import { toast } from 'sonner';

interface SinglePlayerTacticalGameProps {
  playerName: string;
  botName: string;
  difficulty: BotDifficulty;
  onExit: () => void;
}

// Criar estado inicial do jogo com exércitos de teste
function createInitialGameState(
  playerName: string,
  botName: string
): TacticalGameState {
  const hexes: Record<string, HexData> = {};
  const units: Record<string, BattleUnit> = {};
  const commanders: Record<string, BattleCommander> = {};
  
  // Gerar hexes do mapa
  const allHexes = generateMapHexes();
  for (const coord of allHexes) {
    const key = hexKey(coord);
    // Terreno variado
    let terrain: HexData['terrain'] = 'plains';
    if (Math.random() < 0.1) terrain = 'forest';
    if (Math.random() < 0.05) terrain = 'hill';
    
    hexes[key] = { coord, terrain };
  }
  
  // Criar unidades do jogador (lado esquerdo)
  const playerUnits: Partial<BattleUnit>[] = [
    { name: 'Infantaria Pesada', unitType: 'Infantaria', position: { q: 2, r: 3 } },
    { name: 'Arqueiros Longos', unitType: 'Arqueiros', position: { q: 2, r: 4 } },
    { name: 'Cavalaria Ligeira', unitType: 'Cavalaria', position: { q: 3, r: 3 } },
    { name: 'Lanceiros', unitType: 'Infantaria', position: { q: 3, r: 4 } },
  ];
  
  playerUnits.forEach((u, i) => {
    const id = `player_unit_${i}`;
    const baseStats = getUnitBaseStats(u.unitType!);
    units[id] = {
      id,
      cardId: id,
      name: u.name!,
      unitType: u.unitType!,
      experience: 'Veterano',
      owner: 'player1',
      position: u.position!,
      facing: 'N',
      posture: 'Ofensiva',
      isRouting: false,
      hasActedThisTurn: false,
      hitsReceived: 0,
      ...baseStats,
      currentAttack: baseStats.baseAttack,
      currentDefense: baseStats.baseDefense,
      currentRanged: baseStats.baseRanged,
      currentMovement: baseStats.baseMovement,
      currentMorale: baseStats.baseMorale,
      currentHealth: baseStats.maxHealth,
      currentPressure: 0,
      permanentPressure: 0,
      availableTacticalCards: [],
      specialAbilities: [],
    };
    
    // Marcar hex como ocupado
    hexes[hexKey(u.position!)] = { 
      ...hexes[hexKey(u.position!)], 
      unitId: id 
    };
  });
  
  // Criar unidades do bot (lado direito)
  const botUnits: Partial<BattleUnit>[] = [
    { name: 'Guarda Imperial', unitType: 'Infantaria', position: { q: 15, r: 3 } },
    { name: 'Besteiros', unitType: 'Arqueiros', position: { q: 15, r: 4 } },
    { name: 'Cavaleiros Negros', unitType: 'Cavalaria', position: { q: 14, r: 3 } },
    { name: 'Piqueiros', unitType: 'Infantaria', position: { q: 14, r: 4 } },
  ];
  
  botUnits.forEach((u, i) => {
    const id = `bot_unit_${i}`;
    const baseStats = getUnitBaseStats(u.unitType!);
    units[id] = {
      id,
      cardId: id,
      name: u.name!,
      unitType: u.unitType!,
      experience: 'Veterano',
      owner: 'player2',
      position: u.position!,
      facing: 'S',
      posture: 'Ofensiva',
      isRouting: false,
      hasActedThisTurn: false,
      hitsReceived: 0,
      ...baseStats,
      currentAttack: baseStats.baseAttack,
      currentDefense: baseStats.baseDefense,
      currentRanged: baseStats.baseRanged,
      currentMovement: baseStats.baseMovement,
      currentMorale: baseStats.baseMorale,
      currentHealth: baseStats.maxHealth,
      currentPressure: 0,
      permanentPressure: 0,
      availableTacticalCards: [],
      specialAbilities: [],
    };
    
    hexes[hexKey(u.position!)] = { 
      ...hexes[hexKey(u.position!)], 
      unitId: id 
    };
  });
  
  // Criar comandantes
  commanders['player_cmd'] = {
    id: 'player_cmd',
    name: playerName,
    owner: 'player1',
    strategy: 3,
    command: 3,
    guard: 2,
    position: { q: 1, r: 4 },
    isEmbedded: false,
    hasActedThisTurn: false,
    usedCommandThisTurn: 0,
  };
  
  commanders['bot_cmd'] = {
    id: 'bot_cmd',
    name: botName,
    owner: 'player2',
    strategy: 3,
    command: 3,
    guard: 2,
    position: { q: 16, r: 4 },
    isEmbedded: false,
    hasActedThisTurn: false,
    usedCommandThisTurn: 0,
  };
  
  return {
    id: crypto.randomUUID(),
    matchId: 'singleplayer',
    turn: 1,
    phase: 'movement',
    player1Id: 'player',
    player1Name: playerName,
    player1ArmyId: 'player_army',
    player2Id: 'bot',
    player2Name: botName,
    player2ArmyId: 'bot_army',
    activePlayer: 'player1',
    initiativeAdvantage: 1,
    unitsMovedThisPhase: 0,
    units,
    commanders,
    hexes,
    validMoves: [],
    validTargets: [],
    secondaryTerrainIds: [],
    battleLog: [{
      id: crypto.randomUUID(),
      turn: 1,
      phase: 'movement',
      timestamp: Date.now(),
      type: 'system',
      message: 'Batalha iniciada! Fase de Movimento.',
    }],
    isFinished: false,
  };
}

function getUnitBaseStats(unitType: BattleUnit['unitType']) {
  switch (unitType) {
    case 'Infantaria':
      return {
        baseAttack: 4,
        baseDefense: 4,
        baseRanged: 0,
        baseMovement: 3,
        baseMorale: 4,
        maxHealth: 10,
        maxPressure: 6,
      };
    case 'Cavalaria':
      return {
        baseAttack: 5,
        baseDefense: 3,
        baseRanged: 0,
        baseMovement: 5,
        baseMorale: 4,
        maxHealth: 8,
        maxPressure: 5,
      };
    case 'Arqueiros':
      return {
        baseAttack: 2,
        baseDefense: 2,
        baseRanged: 4,
        baseMovement: 3,
        baseMorale: 3,
        maxHealth: 6,
        maxPressure: 4,
      };
    case 'Cerco':
      return {
        baseAttack: 6,
        baseDefense: 2,
        baseRanged: 5,
        baseMovement: 1,
        baseMorale: 3,
        maxHealth: 12,
        maxPressure: 5,
      };
    default:
      return {
        baseAttack: 3,
        baseDefense: 3,
        baseRanged: 0,
        baseMovement: 3,
        baseMorale: 3,
        maxHealth: 8,
        maxPressure: 5,
      };
  }
}

export function SinglePlayerTacticalGame({
  playerName,
  botName,
  difficulty,
  onExit,
}: SinglePlayerTacticalGameProps) {
  const [gameState, setGameState] = useState<TacticalGameState>(() => 
    createInitialGameState(playerName, botName)
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isPlayerTurn = gameState.activePlayer === 'player1';
  
  // Calcular movimentos válidos
  const validMoves = useMemo((): HexCoord[] => {
    if (!selectedUnitId || !isPlayerTurn) return [];
    
    const unit = gameState.units[selectedUnitId];
    if (!unit || unit.owner !== 'player1' || unit.hasActedThisTurn) return [];
    if (gameState.phase !== 'movement') return [];
    
    return calculateValidMoves(unit, gameState);
  }, [gameState, selectedUnitId, isPlayerTurn]);
  
  // Calcular alvos válidos
  const validTargets = useMemo((): string[] => {
    if (!selectedUnitId || !isPlayerTurn) return [];
    
    const unit = gameState.units[selectedUnitId];
    if (!unit || unit.owner !== 'player1') return [];
    
    if (gameState.phase === 'melee') {
      return getValidMeleeTargets(unit, gameState);
    }
    if (gameState.phase === 'shooting' && unit.currentRanged > 0) {
      return getValidShootingTargets(unit, gameState);
    }
    
    return [];
  }, [gameState, selectedUnitId, isPlayerTurn]);

  // Executar ação do bot
  const executeBotTurn = useCallback(async () => {
    if (gameState.isFinished) return;
    
    setIsBotThinking(true);
    const delay = getBotThinkingDelay(difficulty);
    
    botTimeoutRef.current = setTimeout(() => {
      const action = decideBotAction(gameState, 'player2', difficulty);
      
      let newState = { ...gameState };
      
      if (action.type === 'move' && action.unitId && action.targetHex) {
        newState = executeMove(newState, action.unitId, action.targetHex);
        addLog(newState, 'movement', action.reason);
      } else if (action.type === 'attack' && action.unitId && action.targetUnitId) {
        newState = executeAttack(newState, action.unitId, action.targetUnitId);
        addLog(newState, 'combat', action.reason);
      } else if (action.type === 'end_phase') {
        newState = advancePhase(newState);
        addLog(newState, 'system', `Bot encerrou a fase`);
      }
      
      // Verificar vitória
      newState = checkVictory(newState);
      
      setGameState(newState);
      setIsBotThinking(false);
    }, delay);
  }, [gameState, difficulty]);

  // Efeito para turno do bot
  useEffect(() => {
    if (!isPlayerTurn && !isBotThinking && !gameState.isFinished) {
      executeBotTurn();
    }
    
    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, [isPlayerTurn, isBotThinking, gameState.isFinished, executeBotTurn]);

  // Handlers de ação do jogador
  const handleHexClick = (coord: HexCoord) => {
    if (!isPlayerTurn || isBotThinking) return;
    
    const key = hexKey(coord);
    const hex = gameState.hexes[key];
    
    // Clicou em hex com unidade
    if (hex?.unitId) {
      const clickedUnit = gameState.units[hex.unitId];
      
      // Se já tem unidade selecionada e é alvo válido, atacar
      if (selectedUnitId && validTargets.includes(hex.unitId)) {
        const newState = executeAttack(gameState, selectedUnitId, hex.unitId);
        const checkedState = checkVictory(newState);
        setGameState(checkedState);
        setSelectedUnitId(null);
        return;
      }
      
      // Selecionar/deselecionar unidade própria
      if (clickedUnit?.owner === 'player1') {
        setSelectedUnitId(selectedUnitId === hex.unitId ? null : hex.unitId);
      }
      return;
    }
    
    // Clicou em hex vazio - tentar mover
    if (selectedUnitId && validMoves.some(m => m.q === coord.q && m.r === coord.r)) {
      const newState = executeMove(gameState, selectedUnitId, coord);
      setGameState(newState);
      setSelectedUnitId(null);
    } else {
      setSelectedUnitId(null);
    }
  };

  const handleEndPhase = () => {
    if (!isPlayerTurn) return;
    
    const newState = advancePhase(gameState);
    addLog(newState, 'system', `${playerName} encerrou a fase`);
    setGameState(newState);
    setSelectedUnitId(null);
  };

  const selectedUnit = selectedUnitId ? gameState.units[selectedUnitId] : null;

  // Contagem de unidades
  const playerUnitsAlive = Object.values(gameState.units)
    .filter(u => u.owner === 'player1' && !u.isRouting).length;
  const botUnitsAlive = Object.values(gameState.units)
    .filter(u => u.owner === 'player2' && !u.isRouting).length;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onExit}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sair
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <User className="w-3 h-3" />
                {playerName}: {playerUnitsAlive} unidades
              </Badge>
              <span className="text-muted-foreground">vs</span>
              <Badge variant="outline" className="gap-1">
                <Bot className="w-3 h-3" />
                {botName}: {botUnitsAlive} unidades
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={isPlayerTurn ? 'default' : 'secondary'}>
              Turno {gameState.turn} - {gameState.phase}
            </Badge>
            
            {isPlayerTurn && !gameState.isFinished && (
              <Button size="sm" onClick={handleEndPhase}>
                <SkipForward className="w-4 h-4 mr-2" />
                Encerrar Fase
              </Button>
            )}
          </div>
        </div>
        
        {/* Turn indicator */}
        <div className="flex items-center justify-center gap-2 mt-2 text-sm">
          {isBotThinking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-muted-foreground">{botName} está pensando...</span>
            </>
          ) : isPlayerTurn ? (
            <>
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Seu turno!</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Turno do {botName}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map area */}
        <div className="flex-1 relative overflow-auto bg-gradient-to-br from-background to-muted/30">
          <HexGrid
            hexes={gameState.hexes}
            units={gameState.units}
            commanders={gameState.commanders}
            selectedHexKey={selectedUnit ? hexKey(selectedUnit.position) : undefined}
            validMoves={validMoves}
            validTargets={validTargets}
            onHexClick={handleHexClick}
          />
          
          {/* Victory Overlay */}
          {gameState.isFinished && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
              <Card className="max-w-md text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {gameState.winner === 'player1' ? '🎉 Vitória!' : '💀 Derrota'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {gameState.winner === 'player1'
                      ? `Você derrotou ${botName}!`
                      : `${botName} venceu a batalha.`}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setGameState(createInitialGameState(playerName, botName))}>
                      Jogar Novamente
                    </Button>
                    <Button variant="outline" onClick={onExit}>
                      Sair
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-l bg-card/50 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {/* Selected Unit */}
              {selectedUnit ? (
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {selectedUnit.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>ATQ: {selectedUnit.currentAttack}</div>
                      <div>DEF: {selectedUnit.currentDefense}</div>
                      <div>MOV: {selectedUnit.currentMovement}</div>
                      <div>MRL: {selectedUnit.currentMorale}</div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span>HP:</span>
                        <span>{selectedUnit.currentHealth}/{selectedUnit.maxHealth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pressão:</span>
                        <span>{selectedUnit.currentPressure}/{selectedUnit.maxPressure}</span>
                      </div>
                    </div>
                    {selectedUnit.hasActedThisTurn && (
                      <Badge variant="secondary" className="w-full justify-center">
                        Já agiu este turno
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Selecione uma unidade</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Battle Log */}
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Log de Batalha</CardTitle>
                </CardHeader>
                <CardContent className="p-2 max-h-64 overflow-auto">
                  <div className="space-y-1">
                    {[...gameState.battleLog].reverse().slice(0, 20).map((entry) => (
                      <div 
                        key={entry.id} 
                        className={`text-xs p-1.5 rounded ${
                          entry.type === 'system' 
                            ? 'bg-muted text-muted-foreground' 
                            : entry.type === 'combat'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        <span className="opacity-50">[T{entry.turn}]</span> {entry.message}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ========== FUNÇÕES AUXILIARES ==========

function calculateValidMoves(unit: BattleUnit, state: TacticalGameState): HexCoord[] {
  const validMoves: HexCoord[] = [];
  const movement = unit.currentMovement;
  
  const visited = new Set<string>();
  const queue: { coord: HexCoord; steps: number }[] = [{ coord: unit.position, steps: 0 }];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = hexKey(current.coord);
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (current.steps > 0 && current.steps <= movement) {
      const hex = state.hexes[key];
      if (!hex?.unitId) {
        validMoves.push(current.coord);
      }
    }
    
    if (current.steps < movement) {
      const neighbors = getNeighbors(current.coord);
      for (const neighbor of neighbors) {
        if (isValidHex(neighbor.q, neighbor.r) && !visited.has(hexKey(neighbor))) {
          queue.push({ coord: neighbor, steps: current.steps + 1 });
        }
      }
    }
  }
  
  return validMoves;
}

function getValidMeleeTargets(unit: BattleUnit, state: TacticalGameState): string[] {
  const targets: string[] = [];
  const neighbors = getNeighbors(unit.position);
  
  for (const neighbor of neighbors) {
    const key = hexKey(neighbor);
    const hex = state.hexes[key];
    
    if (hex?.unitId) {
      const target = state.units[hex.unitId];
      if (target && target.owner !== unit.owner && !target.isRouting) {
        targets.push(hex.unitId);
      }
    }
  }
  
  return targets;
}

function getValidShootingTargets(unit: BattleUnit, state: TacticalGameState): string[] {
  const targets: string[] = [];
  const range = 6;
  
  for (const [unitId, target] of Object.entries(state.units)) {
    if (target.owner === unit.owner) continue;
    if (target.isRouting) continue;
    
    const dist = hexDistance(unit.position, target.position);
    if (dist <= range && dist > 1) {
      targets.push(unitId);
    }
  }
  
  return targets;
}

function executeMove(state: TacticalGameState, unitId: string, to: HexCoord): TacticalGameState {
  const unit = state.units[unitId];
  if (!unit) return state;
  
  const fromKey = hexKey(unit.position);
  const toKey = hexKey(to);
  
  const newUnits = { ...state.units };
  const newHexes = { ...state.hexes };
  
  newUnits[unitId] = {
    ...unit,
    position: to,
    hasActedThisTurn: true,
  };
  
  if (newHexes[fromKey]) {
    newHexes[fromKey] = { ...newHexes[fromKey], unitId: undefined };
  }
  if (newHexes[toKey]) {
    newHexes[toKey] = { ...newHexes[toKey], unitId };
  }
  
  return {
    ...state,
    units: newUnits,
    hexes: newHexes,
    battleLog: [
      ...state.battleLog,
      {
        id: crypto.randomUUID(),
        turn: state.turn,
        phase: state.phase,
        timestamp: Date.now(),
        type: 'movement',
        message: `${unit.name} moveu para (${to.q}, ${to.r})`,
      }
    ],
  };
}

function executeAttack(state: TacticalGameState, attackerId: string, targetId: string): TacticalGameState {
  const attacker = state.units[attackerId];
  const target = state.units[targetId];
  
  if (!attacker || !target) return state;
  
  // Combate simplificado
  const attackRoll = Math.floor(Math.random() * 6) + 1 + attacker.currentAttack;
  const defenseRoll = Math.floor(Math.random() * 6) + 1 + target.currentDefense;
  
  const newUnits = { ...state.units };
  const logs: BattleLogEntry[] = [];
  
  let damage = 0;
  let pressure = 0;
  
  if (attackRoll > defenseRoll) {
    damage = Math.max(1, Math.floor((attackRoll - defenseRoll) / 2));
    pressure = 1;
    
    newUnits[targetId] = {
      ...target,
      currentHealth: Math.max(0, target.currentHealth - damage),
      currentPressure: target.currentPressure + pressure,
    };
    
    logs.push({
      id: crypto.randomUUID(),
      turn: state.turn,
      phase: state.phase,
      timestamp: Date.now(),
      type: 'combat',
      message: `${attacker.name} acerta ${target.name}! ${damage} dano, +${pressure} pressão`,
    });
    
    // Verificar rout
    if (newUnits[targetId].currentPressure >= newUnits[targetId].maxPressure) {
      newUnits[targetId] = { ...newUnits[targetId], isRouting: true };
      logs.push({
        id: crypto.randomUUID(),
        turn: state.turn,
        phase: state.phase,
        timestamp: Date.now(),
        type: 'rout',
        message: `${target.name} ENTRA EM ROTA!`,
      });
    }
    
    // Verificar morte
    if (newUnits[targetId].currentHealth <= 0) {
      logs.push({
        id: crypto.randomUUID(),
        turn: state.turn,
        phase: state.phase,
        timestamp: Date.now(),
        type: 'combat',
        message: `${target.name} foi DESTRUÍDA!`,
      });
    }
  } else {
    logs.push({
      id: crypto.randomUUID(),
      turn: state.turn,
      phase: state.phase,
      timestamp: Date.now(),
      type: 'combat',
      message: `${attacker.name} ataca ${target.name} mas é bloqueado!`,
    });
  }
  
  newUnits[attackerId] = { ...attacker, hasActedThisTurn: true };
  
  return {
    ...state,
    units: newUnits,
    battleLog: [...state.battleLog, ...logs],
  };
}

function advancePhase(state: TacticalGameState): TacticalGameState {
  const phases: GamePhase[] = ['movement', 'shooting', 'melee', 'reorganization'];
  const currentIndex = phases.indexOf(state.phase);
  
  let newPhase: GamePhase;
  let newTurn = state.turn;
  let newActivePlayer = state.activePlayer;
  
  if (currentIndex === phases.length - 1 || currentIndex === -1) {
    // Fim do turno
    newPhase = 'movement';
    
    if (state.activePlayer === 'player2') {
      newTurn = state.turn + 1;
    }
    
    newActivePlayer = state.activePlayer === 'player1' ? 'player2' : 'player1';
  } else {
    newPhase = phases[currentIndex + 1];
    newActivePlayer = state.activePlayer === 'player1' ? 'player2' : 'player1';
  }
  
  // Reset hasActed para novo turno
  const newUnits = { ...state.units };
  if (newPhase === 'movement' && newActivePlayer === 'player1' && newTurn > state.turn) {
    for (const id of Object.keys(newUnits)) {
      newUnits[id] = { ...newUnits[id], hasActedThisTurn: false };
    }
  }
  
  return {
    ...state,
    phase: newPhase,
    turn: newTurn,
    activePlayer: newActivePlayer,
    units: newUnits,
    unitsMovedThisPhase: 0,
    battleLog: [
      ...state.battleLog,
      {
        id: crypto.randomUUID(),
        turn: newTurn,
        phase: newPhase,
        timestamp: Date.now(),
        type: 'system',
        message: `Turno ${newTurn} - Fase: ${newPhase} - ${newActivePlayer === 'player1' ? 'Jogador' : 'Bot'}`,
      }
    ],
  };
}

function checkVictory(state: TacticalGameState): TacticalGameState {
  const playerUnits = Object.values(state.units)
    .filter(u => u.owner === 'player1' && !u.isRouting && u.currentHealth > 0);
  const botUnits = Object.values(state.units)
    .filter(u => u.owner === 'player2' && !u.isRouting && u.currentHealth > 0);
  
  if (playerUnits.length === 0) {
    return { ...state, isFinished: true, winner: 'player2' };
  }
  if (botUnits.length === 0) {
    return { ...state, isFinished: true, winner: 'player1' };
  }
  
  return state;
}

function addLog(state: TacticalGameState, type: BattleLogEntry['type'], message: string) {
  state.battleLog.push({
    id: crypto.randomUUID(),
    turn: state.turn,
    phase: state.phase,
    timestamp: Date.now(),
    type,
    message,
  });
}
