/**
 * SinglePlayerGameV2 - Componente completo com todas as fases do multiplayer
 * Fases: army_selection → difficulty_select → scenario_selection → combat → finished
 * Combat Phases: initiative_maneuver → initiative_reaction → initiative_roll → 
 *                attack_maneuver → attack_reaction → defense_maneuver → 
 *                defense_reaction → combat_roll → combat_resolution
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Swords, Heart, Shield, Zap, Trophy, Bot, 
  ArrowLeft, Play, RotateCcw, Loader2, Crown,
  Target, ChevronRight, Dice5, Check, X,
  Mountain, Sun, Users
} from 'lucide-react';
import { BotDifficulty } from '@/lib/botEngine';
import { StrategicArmy } from '@/types/combat/strategic-army';
import { useLocalArmies } from '@/hooks/useLocalArmies';
import { SinglePlayerArmyList } from './SinglePlayerArmyList';
import { SinglePlayerArmyBuilder } from './SinglePlayerArmyBuilder';
import { useSinglePlayerGameV2 } from '@/hooks/useSinglePlayerGameV2';
import { SPCard, SPCommander, SPCombatPhase, SPBasicCardsUsed, getPlayableCards } from '@/lib/singlePlayerCombatEngine';
import { SinglePlayerBasicCards } from './SinglePlayerBasicCards';

// ========================
// CONFIGURAÇÕES
// ========================

const DIFFICULTY_CONFIG: Record<BotDifficulty, { label: string; color: string; description: string }> = {
  easy: { 
    label: 'Fácil', 
    color: 'bg-green-500', 
    description: 'Bot faz decisões aleatórias e passa frequentemente' 
  },
  medium: { 
    label: 'Médio', 
    color: 'bg-yellow-500', 
    description: 'Bot usa estratégias básicas e é mais consistente' 
  },
  hard: { 
    label: 'Difícil', 
    color: 'bg-red-500', 
    description: 'Bot otimiza cada jogada e raramente erra' 
  },
};

const PHASE_LABELS: Record<SPCombatPhase, string> = {
  'initiative_maneuver': 'Manobra de Iniciativa',
  'initiative_reaction': 'Reação (Iniciativa)',
  'initiative_roll': 'Rolagem de Iniciativa',
  'initiative_post': 'Escolher Atacante/Defensor',
  'attack_maneuver': 'Fase de Ataque',
  'attack_reaction': 'Reação (Ataque)',
  'defense_maneuver': 'Fase de Defesa',
  'defense_reaction': 'Reação (Defesa)',
  'combat_roll': 'Rolagem de Combate',
  'combat_resolution': 'Resolução',
  'round_end': 'Fim do Round',
};

type LocalView = 'army_list' | 'army_builder' | 'difficulty_select' | 'game';

interface SinglePlayerGameV2Props {
  onBack: () => void;
}

export function SinglePlayerGameV2({ onBack }: SinglePlayerGameV2Props) {
  const [localView, setLocalView] = useState<LocalView>('army_list');
  const [selectedArmy, setSelectedArmy] = useState<StrategicArmy | null>(null);
  const [editingArmy, setEditingArmy] = useState<StrategicArmy | undefined>(undefined);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCommanderId, setSelectedCommanderId] = useState<string | null>(null);
  const [logisticsBid, setLogisticsBid] = useState(3);
  
  const { save: saveArmy } = useLocalArmies();
  
  const {
    state,
    startGameWithArmy,
    submitLogisticsBid,
    selectScenario,
    playInitiativeManeuver,
    confirmInitiativeManeuver,
    playReaction,
    resolveInitiative,
    chooseFirstAttacker,
    playAttackManeuver,
    confirmAttackManeuvers,
    playDefenseManeuver,
    confirmDefenseManeuvers,
    resolveCombat,
    advanceToNextRound,
    passTurn,
    resetGame,
    useBasicCard,
  } = useSinglePlayerGameV2();

  // ========================
  // HANDLERS
  // ========================

  const handleSelectArmy = (army: StrategicArmy) => {
    setSelectedArmy(army);
    setLocalView('difficulty_select');
  };

  const handleCreateNew = () => {
    setEditingArmy(undefined);
    setLocalView('army_builder');
  };

  const handleEditArmy = (army: StrategicArmy) => {
    setEditingArmy(army);
    setLocalView('army_builder');
  };

  const handleSaveArmy = (army: StrategicArmy) => {
    saveArmy(army);
    setLocalView('army_list');
  };

  const handleStartGame = async (difficulty: BotDifficulty) => {
    if (!selectedArmy) return;
    await startGameWithArmy(selectedArmy, difficulty);
    setLocalView('game');
  };

  const handleBackToMenu = () => {
    resetGame();
    setSelectedArmy(null);
    setSelectedCardIndex(null);
    setSelectedCommanderId(null);
    setLocalView('army_list');
  };

  const handlePlayCard = () => {
    if (selectedCardIndex === null || !selectedCommanderId) return;
    
    const { combatPhase } = state;
    
    if (combatPhase === 'initiative_maneuver') {
      playInitiativeManeuver(selectedCardIndex, selectedCommanderId);
    } else if (combatPhase === 'attack_maneuver') {
      playAttackManeuver(selectedCardIndex, selectedCommanderId);
    } else if (combatPhase === 'defense_maneuver') {
      playDefenseManeuver(selectedCardIndex, selectedCommanderId);
    } else if (combatPhase === 'initiative_reaction' || 
               combatPhase === 'attack_reaction' || 
               combatPhase === 'defense_reaction') {
      playReaction(selectedCardIndex);
    }
    
    setSelectedCardIndex(null);
    setSelectedCommanderId(null);
  };

  const handleConfirmPhase = () => {
    const { combatPhase } = state;
    
    if (combatPhase === 'initiative_maneuver') {
      confirmInitiativeManeuver();
    } else if (combatPhase === 'initiative_roll') {
      resolveInitiative();
    } else if (combatPhase === 'attack_maneuver') {
      confirmAttackManeuvers();
    } else if (combatPhase === 'defense_maneuver') {
      confirmDefenseManeuvers();
    } else if (combatPhase === 'combat_roll') {
      resolveCombat();
    } else if (combatPhase === 'combat_resolution') {
      advanceToNextRound();
    }
  };

  // ========================
  // VIEWS: PRE-GAME
  // ========================

  if (localView === 'army_list') {
    return (
      <SinglePlayerArmyList
        onSelectArmy={handleSelectArmy}
        onCreateNew={handleCreateNew}
        onEditArmy={handleEditArmy}
        onBack={onBack}
      />
    );
  }

  if (localView === 'army_builder') {
    return (
      <SinglePlayerArmyBuilder
        army={editingArmy}
        onSave={handleSaveArmy}
        onCancel={() => setLocalView('army_list')}
      />
    );
  }

  if (localView === 'difficulty_select' && selectedArmy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Button variant="ghost" className="absolute top-4 left-4" onClick={() => setLocalView('army_list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Escolha a Dificuldade</h1>
          </div>
          <p className="text-muted-foreground">
            Jogando com: <span className="font-medium text-foreground">{selectedArmy.name}</span>
          </p>
          <div className="flex items-center justify-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Swords className="w-4 h-4 text-red-500" />
              {selectedArmy.attack}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-blue-500" />
              {selectedArmy.defense}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              {selectedArmy.mobility}
            </span>
          </div>
        </div>
        
        <div className="grid gap-4 w-full max-w-md">
          {(Object.keys(DIFFICULTY_CONFIG) as BotDifficulty[]).map((diff) => {
            const config = DIFFICULTY_CONFIG[diff];
            return (
              <Card 
                key={diff}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleStartGame(diff)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{config.label}</CardTitle>
                    <Badge className={config.color}>{diff.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ========================
  // VIEWS: SCENARIO SELECTION
  // ========================

  if (state.phase === 'scenario_selection') {
    const hasWinner = state.scenarioWinner !== null;
    const playerWon = state.scenarioWinner === 'player';
    
    return (
      <div className="min-h-screen flex flex-col bg-background p-4">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="sm" onClick={handleBackToMenu}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Sair
          </Button>
          <Badge variant="outline">Seleção de Cenário</Badge>
        </div>
        
        {/* HP Display */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="border-primary/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="font-bold">{state.playerCultureName}</span>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-bold">{state.playerHp}/{state.playerMaxHp}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="font-bold">{state.botName}</span>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-bold">{state.botHp}/{state.botMaxHp}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {!hasWinner ? (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Lance de Logística</CardTitle>
              <CardDescription>
                Quem fizer o maior lance escolhe o cenário de batalha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Seu lance</span>
                  <span className="font-bold text-lg">{logisticsBid}</span>
                </div>
                <Slider
                  value={[logisticsBid]}
                  onValueChange={(v) => setLogisticsBid(v[0])}
                  min={0}
                  max={5}
                  step={1}
                />
              </div>
              
              <Button className="w-full" onClick={() => submitLogisticsBid(logisticsBid)}>
                <Dice5 className="w-4 h-4 mr-2" />
                Revelar Lances
              </Button>
            </CardContent>
          </Card>
        ) : playerWon ? (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-green-500 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Você venceu! Escolha o cenário
              </CardTitle>
              <CardDescription>
                Seu lance: {state.playerLogisticsBid} vs {state.botName}: {state.botLogisticsBid}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {state.scenarioOptions.map((option, i) => (
                  <Card 
                    key={i}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => selectScenario(option.terrain_id, option.season_id)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mountain className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{option.terrain_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Sun className="w-5 h-5 text-yellow-500" />
                          <span>{option.season_name}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <X className="w-5 h-5" />
                {state.botName} venceu a disputa
              </CardTitle>
              <CardDescription>
                Seu lance: {state.playerLogisticsBid} vs {state.botName}: {state.botLogisticsBid}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                {state.botName} está escolhendo o cenário...
              </span>
            </CardContent>
          </Card>
        )}
        
        {/* Battle Log */}
        <Card className="mt-4">
          <CardContent className="py-2">
            <ScrollArea className="h-20">
              {state.battleLog.slice(-5).reverse().map((log, i) => (
                <div key={i} className="text-xs text-muted-foreground py-0.5">
                  {log.message}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================
  // VIEWS: COMBAT
  // ========================

  if (state.phase === 'combat') {
    const { combatPhase, awaitingPlayer, board } = state;
    const playableCards = getPlayableCards(state.playerHand, combatPhase);
    const canPlayCard = selectedCardIndex !== null && 
                        (combatPhase.includes('reaction') || selectedCommanderId !== null);
    
    // Determine action button label
    let actionLabel = 'Confirmar';
    if (combatPhase === 'initiative_roll') actionLabel = 'Rolar Iniciativa';
    if (combatPhase === 'initiative_post') actionLabel = '';
    if (combatPhase === 'combat_roll') actionLabel = 'Rolar Combate';
    if (combatPhase === 'combat_resolution') actionLabel = 'Próximo Round';
    
    return (
      <div className="min-h-screen flex flex-col bg-background p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline">Rodada {state.round}</Badge>
          <Badge className={awaitingPlayer ? 'bg-green-500' : 'bg-muted'}>
            {PHASE_LABELS[combatPhase]}
          </Badge>
          <Badge variant="outline" className={DIFFICULTY_CONFIG[state.botDifficulty].color}>
            {state.botName}
          </Badge>
        </div>
        
        {/* Phase Stepper */}
        <div className="flex items-center justify-center gap-1 mb-3 overflow-x-auto">
          {(['initiative_maneuver', 'initiative_roll', 'attack_maneuver', 'defense_maneuver', 'combat_roll'] as SPCombatPhase[]).map((phase, i) => {
            const isCurrent = combatPhase === phase || 
                              (phase === 'initiative_maneuver' && combatPhase === 'initiative_reaction') ||
                              (phase === 'attack_maneuver' && combatPhase === 'attack_reaction') ||
                              (phase === 'defense_maneuver' && combatPhase === 'defense_reaction');
            const isPast = ['initiative_maneuver', 'initiative_reaction', 'initiative_roll', 'initiative_post'].indexOf(combatPhase) > 
                           ['initiative_maneuver', 'initiative_reaction', 'initiative_roll', 'initiative_post'].indexOf(phase);
            
            return (
              <div 
                key={phase}
                className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                  isCurrent ? 'bg-primary text-primary-foreground' : 
                  isPast ? 'bg-muted text-muted-foreground' : 'bg-background border'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
        
        {/* Terrain & Season */}
        {state.selectedTerrainName && (
          <div className="flex justify-center gap-4 mb-2 text-sm">
            <span className="flex items-center gap-1">
              <Mountain className="w-4 h-4" />
              {state.selectedTerrainName}
            </span>
            <span className="flex items-center gap-1">
              <Sun className="w-4 h-4" />
              {state.selectedSeasonName}
            </span>
          </div>
        )}
        
        {/* HP Bars */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <Card className={`border-2 ${board.current_attacker === 'player' ? 'border-red-500' : board.current_defender === 'player' ? 'border-blue-500' : 'border-primary/50'}`}>
            <CardContent className="py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold truncate">{selectedArmy?.name || 'Você'}</span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span className="font-bold">{state.playerHp}</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(state.playerHp / state.playerMaxHp) * 100}%` }}
                />
              </div>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Swords className="w-3 h-3 text-red-500" />
                  {state.playerAttributes.attack}
                </span>
                <span className="flex items-center gap-0.5">
                  <Shield className="w-3 h-3 text-blue-500" />
                  {state.playerAttributes.defense}
                </span>
                <span className="flex items-center gap-0.5">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  {state.playerAttributes.mobility}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`border-2 ${board.current_attacker === 'bot' ? 'border-red-500' : board.current_defender === 'bot' ? 'border-blue-500' : 'border-destructive/50'}`}>
            <CardContent className="py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">{state.botName}</span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span className="font-bold">{state.botHp}</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${(state.botHp / state.botMaxHp) * 100}%` }}
                />
              </div>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Swords className="w-3 h-3 text-red-500" />
                  {state.botAttributes.attack}
                </span>
                <span className="flex items-center gap-0.5">
                  <Shield className="w-3 h-3 text-blue-500" />
                  {state.botAttributes.defense}
                </span>
                <span className="flex items-center gap-0.5">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  {state.botAttributes.mobility}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Choose Attacker/Defender (initiative_post) */}
        {combatPhase === 'initiative_post' && awaitingPlayer && (
          <Card className="mb-3">
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Você venceu a iniciativa!
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => chooseFirstAttacker(true)}
                >
                  <Swords className="w-4 h-4 mr-2" />
                  Atacar
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => chooseFirstAttacker(false)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Defender
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Battle Log */}
        <Card className="mb-3">
          <CardContent className="py-2">
            <ScrollArea className="h-20">
              {state.battleLog.slice(-8).reverse().map((log, i) => (
                <div 
                  key={i} 
                  className={`text-xs py-0.5 ${
                    log.type === 'damage' ? 'text-red-500 font-medium' :
                    log.type === 'effect' ? 'text-primary' :
                    log.type === 'phase' ? 'text-yellow-500 font-medium' :
                    'text-muted-foreground'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Commanders */}
        <Card className="mb-3">
          <CardHeader className="py-1.5">
            <CardTitle className="text-xs flex items-center gap-1">
              <Users className="w-3 h-3" />
              Comandantes
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1.5">
            <div className="flex gap-2">
              {state.playerCommanders.map((cmd) => {
                const isGeneral = cmd.is_general;
                const isSelected = selectedCommanderId === cmd.instance_id;
                const canSelect = !isGeneral || combatPhase.includes('reaction');
                
                return (
                  <div 
                    key={cmd.instance_id}
                    className={`p-2 border rounded text-xs flex-1 transition-colors ${
                      isSelected ? 'ring-2 ring-primary border-primary' : 
                      canSelect ? 'cursor-pointer hover:border-primary/50' : 
                      'opacity-50'
                    }`}
                    onClick={() => canSelect && setSelectedCommanderId(cmd.instance_id)}
                  >
                    <div className="font-medium flex items-center gap-1">
                      {isGeneral && <Crown className="w-3 h-3 text-yellow-500" />}
                      {cmd.especializacao}
                    </div>
                    <div className="text-muted-foreground">
                      CMD: {cmd.cmd_free}/{cmd.comando_base}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Basic Cards */}
        <SinglePlayerBasicCards
          basicCardsUsed={state.playerBasicCardsUsed}
          currentBonuses={state.playerBasicCardsBonuses}
          combatPhase={combatPhase}
          onUseCard={useBasicCard}
          disabled={!awaitingPlayer || state.isLoading}
        />
        
        {/* Hand */}
        <Card className="flex-1 min-h-0">
          <CardHeader className="py-1.5">
            <CardTitle className="text-xs">
              Mão ({state.playerHand.length}) 
              {playableCards.length > 0 && ` - ${playableCards.length} jogáveis`}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1.5">
            <ScrollArea className="h-[140px]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {state.playerHand.map((card, index) => {
                  const isPlayable = playableCards.some(c => c.id === card.id);
                  const isSelected = selectedCardIndex === index;
                  
                  return (
                    <div 
                      key={`${card.id}-${index}`}
                      className={`p-2 border rounded text-xs transition-colors ${
                        isSelected ? 'ring-2 ring-primary border-primary' : 
                        isPlayable ? 'cursor-pointer hover:border-primary/50' : 
                        'opacity-40'
                      }`}
                      onClick={() => isPlayable && setSelectedCardIndex(index)}
                    >
                      <div className="font-medium truncate">{card.name}</div>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] mt-1 ${
                          card.card_type === 'ofensiva' ? 'border-red-500 text-red-500' :
                          card.card_type === 'defensiva' ? 'border-blue-500 text-blue-500' :
                          card.card_type === 'movimentacao' ? 'border-yellow-500 text-yellow-500' :
                          'border-purple-500 text-purple-500'
                        }`}
                      >
                        {card.card_type}
                      </Badge>
                      <div className="mt-1 flex gap-1 flex-wrap text-[10px]">
                        {card.attack_bonus > 0 && (
                          <span className="text-red-500">+{card.attack_bonus} ATQ</span>
                        )}
                        {card.defense_bonus > 0 && (
                          <span className="text-blue-500">+{card.defense_bonus} DEF</span>
                        )}
                        {card.mobility_bonus > 0 && (
                          <span className="text-yellow-500">+{card.mobility_bonus} MOB</span>
                        )}
                        {card.command_required > 0 && (
                          <span className="text-muted-foreground">CMD:{card.command_required}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {combatPhase !== 'initiative_post' && awaitingPlayer && (
            <>
              <Button 
                className="flex-1" 
                onClick={handlePlayCard}
                disabled={!canPlayCard || state.isLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                Jogar Carta
              </Button>
              {actionLabel && (
                <Button 
                  variant="secondary"
                  onClick={handleConfirmPhase}
                  disabled={state.isLoading}
                >
                  {combatPhase === 'initiative_roll' || combatPhase === 'combat_roll' ? (
                    <Dice5 className="w-4 h-4 mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {actionLabel}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={passTurn}
                disabled={state.isLoading}
              >
                Passar
              </Button>
            </>
          )}
          {!awaitingPlayer && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Aguardando {state.botName}...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================
  // VIEWS: FINISHED
  // ========================

  if (state.phase === 'finished') {
    const isWinner = state.winner === 'player';
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isWinner ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Trophy className={`w-8 h-8 ${isWinner ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <CardTitle className="text-2xl mt-4">
              {isWinner ? 'Vitória!' : 'Derrota'}
            </CardTitle>
            <CardDescription>
              {isWinner 
                ? `Você derrotou ${state.botName}!`
                : `${state.botName} venceu a batalha.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Seu HP: </span>
                <span className="font-bold">{state.playerHp}/{state.playerMaxHp}</span>
              </div>
              <div>
                <span className="text-muted-foreground">HP do Bot: </span>
                <span className="font-bold">{state.botHp}/{state.botMaxHp}</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Rounds jogados: {state.round}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => {
                resetGame();
                if (selectedArmy) {
                  setLocalView('difficulty_select');
                } else {
                  handleBackToMenu();
                }
              }}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Jogar Novamente
              </Button>
              <Button variant="outline" onClick={handleBackToMenu}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Menu
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Battle Log */}
        <Card className="w-full max-w-md mt-4">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Log da Batalha</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <ScrollArea className="h-40">
              {state.battleLog.slice(-20).reverse().map((log, i) => (
                <div 
                  key={i} 
                  className={`text-xs py-0.5 ${
                    log.type === 'damage' ? 'text-red-500' :
                    log.type === 'effect' ? 'text-primary' :
                    log.type === 'phase' ? 'text-yellow-500 font-medium' :
                    'text-muted-foreground'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback: Loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}
