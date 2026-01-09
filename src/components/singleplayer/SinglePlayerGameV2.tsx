/**
 * SinglePlayerGameV2 - Componente completo com estética TCG
 * Fases: army_selection → difficulty_select → scenario_selection → combat → finished
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Swords, Heart, Shield, Zap, Trophy, Bot, 
  ArrowLeft, Play, RotateCcw, Loader2, Crown,
  Target, Dice5, Check, X,
  Mountain, Sun, Users, Sparkles
} from 'lucide-react';
import { BotDifficulty } from '@/lib/botEngine';
import { StrategicArmy } from '@/types/combat/strategic-army';
import { useLocalArmies } from '@/hooks/useLocalArmies';
import { SinglePlayerArmyList } from './SinglePlayerArmyList';
import { SinglePlayerArmyBuilder } from './SinglePlayerArmyBuilder';
import { useSinglePlayerGameV2 } from '@/hooks/useSinglePlayerGameV2';
import { SPCard, SPCombatPhase, getPlayableCards } from '@/lib/singlePlayerCombatEngine';
import { SinglePlayerCardDetail } from './SinglePlayerCardDetail';

// TCG Components
import './tcg/TCGStyles.css';
import { 
  TCGCard, 
  TCGPlayerArea, 
  TCGCommander, 
  TCGBasicCards, 
  TCGBattleLog,
  TCGPhaseIndicator 
} from './tcg';

// ========================
// CONFIGURAÇÕES
// ========================

const DIFFICULTY_CONFIG: Record<BotDifficulty, { label: string; color: string; description: string; stars: number }> = {
  easy: { 
    label: 'Fácil', 
    color: 'bg-green-500', 
    description: 'Bot faz decisões aleatórias',
    stars: 1,
  },
  medium: { 
    label: 'Médio', 
    color: 'bg-yellow-500', 
    description: 'Bot usa estratégias básicas',
    stars: 2,
  },
  hard: { 
    label: 'Difícil', 
    color: 'bg-red-500', 
    description: 'Bot otimiza cada jogada',
    stars: 3,
  },
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
  const [viewingCard, setViewingCard] = useState<SPCard | null>(null);
  const [showBotDebug, setShowBotDebug] = useState(true);
  const [selectedBasicCard, setSelectedBasicCard] = useState<keyof import('@/lib/singlePlayerCombatEngine').SPBasicCardsUsed | null>(null);
  
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

  // ========================
  // DIFFICULTY SELECT - TCG Style
  // ========================

  if (localView === 'difficulty_select' && selectedArmy) {
    return (
      <div className="tcg-table min-h-screen flex flex-col items-center justify-center p-4">
        {/* Decorative Corners */}
        <div className="tcg-ornament tcg-ornament--tl" />
        <div className="tcg-ornament tcg-ornament--tr" />
        <div className="tcg-ornament tcg-ornament--bl" />
        <div className="tcg-ornament tcg-ornament--br" />
        
        <Button 
          variant="ghost" 
          className="absolute top-4 left-4 text-foreground/70 hover:text-foreground" 
          onClick={() => setLocalView('army_list')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="text-center mb-8 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <h1 className="text-3xl font-bold tracking-tight">Escolha a Dificuldade</h1>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            Jogando com: <span className="font-medium text-foreground">{selectedArmy.name}</span>
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="tcg-stat tcg-stat--attack">
              <Swords className="w-4 h-4" />
              {selectedArmy.attack}
            </div>
            <div className="tcg-stat tcg-stat--defense">
              <Shield className="w-4 h-4" />
              {selectedArmy.defense}
            </div>
            <div className="tcg-stat tcg-stat--mobility">
              <Zap className="w-4 h-4" />
              {selectedArmy.mobility}
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 w-full max-w-md relative z-10">
          {(Object.keys(DIFFICULTY_CONFIG) as BotDifficulty[]).map((diff) => {
            const config = DIFFICULTY_CONFIG[diff];
            return (
              <div 
                key={diff}
                className="tcg-card p-4 cursor-pointer"
                onClick={() => handleStartGame(diff)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-muted-foreground" />
                    <span className="text-lg font-bold">{config.label}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < config.stars ? config.color : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ========================
  // SCENARIO SELECTION - TCG Style
  // ========================

  if (state.phase === 'scenario_selection') {
    const hasWinner = state.scenarioWinner !== null;
    const playerWon = state.scenarioWinner === 'player';
    
    return (
      <div className="tcg-table min-h-screen flex flex-col p-4">
        {/* Decorative Corners */}
        <div className="tcg-ornament tcg-ornament--tl" />
        <div className="tcg-ornament tcg-ornament--tr" />
        <div className="tcg-ornament tcg-ornament--bl" />
        <div className="tcg-ornament tcg-ornament--br" />
        
        <div className="flex justify-between items-center mb-4 relative z-10">
          <Button variant="ghost" size="sm" onClick={handleBackToMenu}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Sair
          </Button>
          <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
            Seleção de Cenário
          </Badge>
        </div>
        
        {/* Player Areas */}
        <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
          <TCGPlayerArea
            name={state.playerCultureName}
            hp={state.playerHp}
            maxHp={state.playerMaxHp}
            attack={state.playerAttributes.attack}
            defense={state.playerAttributes.defense}
            mobility={state.playerAttributes.mobility}
            isPlayer
          />
          <TCGPlayerArea
            name={state.botName}
            hp={state.botHp}
            maxHp={state.botMaxHp}
            attack={state.botAttributes.attack}
            defense={state.botAttributes.defense}
            mobility={state.botAttributes.mobility}
            isPlayer={false}
          />
        </div>
        
        {/* Logistics Bid */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          {!hasWinner ? (
            <div className="tcg-card p-6 w-full max-w-md">
              <div className="tcg-card-frame" />
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Dice5 className="w-5 h-5 text-primary" />
                Lance de Logística
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Quem fizer o maior lance escolhe o cenário de batalha
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Seu lance</span>
                  <div className="tcg-round w-12 h-12 text-xl">{logisticsBid}</div>
                </div>
                <Slider
                  value={[logisticsBid]}
                  onValueChange={(v) => setLogisticsBid(v[0])}
                  min={0}
                  max={5}
                  step={1}
                  className="py-2"
                />
              </div>
              
              <Button 
                className="w-full mt-6 tcg-action-btn" 
                onClick={() => submitLogisticsBid(logisticsBid)}
              >
                <Dice5 className="w-4 h-4 mr-2" />
                Revelar Lances
              </Button>
            </div>
          ) : playerWon ? (
            <div className="tcg-card p-6 w-full max-w-md">
              <div className="tcg-card-frame" />
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-green-400">
                <Trophy className="w-5 h-5" />
                Você venceu! Escolha o cenário
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Seu lance: {state.playerLogisticsBid} vs {state.botName}: {state.botLogisticsBid}
              </p>
              
              <div className="space-y-3">
                {state.scenarioOptions.map((option, i) => (
                  <div 
                    key={i}
                    className="tcg-card p-3 cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => selectScenario(option.terrain_id, option.season_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mountain className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{option.terrain_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sun className="w-5 h-5 text-yellow-500" />
                        <span>{option.season_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="tcg-card p-6 w-full max-w-md">
              <div className="tcg-card-frame" />
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-red-400">
                <X className="w-5 h-5" />
                {state.botName} venceu a disputa
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Seu lance: {state.playerLogisticsBid} vs {state.botName}: {state.botLogisticsBid}
              </p>
              
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">
                  {state.botName} está escolhendo o cenário...
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Battle Log */}
        <div className="relative z-10 mt-4">
          <TCGBattleLog logs={state.battleLog} />
        </div>
      </div>
    );
  }

  // ========================
  // COMBAT - TCG Style
  // ========================

  if (state.phase === 'combat') {
    const { combatPhase, awaitingPlayer, board } = state;
    const playableCards = getPlayableCards(state.playerHand, combatPhase);
    const canPlayCard = selectedCardIndex !== null && 
                        (combatPhase.includes('reaction') || selectedCommanderId !== null);
    
    let actionLabel = 'Confirmar';
    if (combatPhase === 'initiative_roll') actionLabel = 'Rolar Iniciativa';
    if (combatPhase === 'initiative_post') actionLabel = '';
    if (combatPhase === 'combat_roll') actionLabel = 'Rolar Combate';
    if (combatPhase === 'combat_resolution') actionLabel = 'Próximo Round';
    
    return (
      <div className="tcg-table min-h-screen flex flex-col p-3 relative">
        {/* Decorative Corners */}
        <div className="tcg-ornament tcg-ornament--tl" />
        <div className="tcg-ornament tcg-ornament--tr" />
        <div className="tcg-ornament tcg-ornament--bl" />
        <div className="tcg-ornament tcg-ornament--br" />
        
        {/* Phase & Round Indicator */}
        <div className="relative z-10 mb-4">
          <TCGPhaseIndicator 
            currentPhase={combatPhase} 
            round={state.round}
            awaitingPlayer={awaitingPlayer}
            botName={state.botName}
          />
          
          {/* Terrain Badge */}
          {state.selectedTerrainName && (
            <div className="flex justify-center gap-3 mt-2">
              <div className="tcg-terrain-badge">
                <Mountain className="w-4 h-4" />
                <span>{state.selectedTerrainName}</span>
              </div>
              <div className="tcg-terrain-badge">
                <Sun className="w-4 h-4 text-yellow-500" />
                <span>{state.selectedSeasonName}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Enemy Area */}
        <div className="relative z-10 mb-3">
          <TCGPlayerArea
            name={state.botName}
            hp={state.botHp}
            maxHp={state.botMaxHp}
            attack={state.botAttributes.attack}
            defense={state.botAttributes.defense}
            mobility={state.botAttributes.mobility}
            isAttacker={board.current_attacker === 'bot'}
            isDefender={board.current_defender === 'bot'}
            isPlayer={false}
          />
        </div>
        
        {/* Battle Log */}
        <div className="relative z-10 mb-3">
          <TCGBattleLog logs={state.battleLog} />
        </div>
        
        {/* Choose Attacker/Defender */}
        {combatPhase === 'initiative_post' && awaitingPlayer && (
          <div className="relative z-10 mb-3 tcg-card p-4">
            <div className="tcg-card-frame" />
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Você venceu a iniciativa! Escolha sua posição:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="destructive" 
                className="tcg-action-btn"
                onClick={() => chooseFirstAttacker(true)}
              >
                <Swords className="w-4 h-4 mr-2" />
                Atacar
              </Button>
              <Button 
                variant="outline" 
                className="tcg-action-btn"
                onClick={() => chooseFirstAttacker(false)}
              >
                <Shield className="w-4 h-4 mr-2" />
                Defender
              </Button>
            </div>
          </div>
        )}
        
        {/* Player Area */}
        <div className="relative z-10 mb-3">
          <TCGPlayerArea
            name={selectedArmy?.name || 'Você'}
            hp={state.playerHp}
            maxHp={state.playerMaxHp}
            attack={state.playerAttributes.attack}
            defense={state.playerAttributes.defense}
            mobility={state.playerAttributes.mobility}
            isAttacker={board.current_attacker === 'player'}
            isDefender={board.current_defender === 'player'}
            isPlayer
          />
        </div>
        
        {/* Commanders */}
        <div className="relative z-10 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Comandantes
            </span>
          </div>
          <div className="flex gap-3 justify-center">
            {state.playerCommanders.map((cmd) => {
              const canSelect = !cmd.is_general || combatPhase.includes('reaction');
              return (
                <TCGCommander
                  key={cmd.instance_id}
                  commander={cmd}
                  isSelected={selectedCommanderId === cmd.instance_id}
                  canSelect={canSelect}
                  onClick={() => canSelect && setSelectedCommanderId(cmd.instance_id)}
                />
              );
            })}
          </div>
        </div>
        
        {/* Basic Cards */}
        <div className="relative z-10 mb-3">
          <TCGBasicCards
            basicCardsUsed={state.playerBasicCardsUsed}
            currentBonuses={state.playerBasicCardsBonuses}
            combatPhase={combatPhase}
            selectedBasicCard={selectedBasicCard}
            onSelectCard={setSelectedBasicCard}
            onConfirmCard={() => {
              if (selectedBasicCard) {
                useBasicCard(selectedBasicCard);
                setSelectedBasicCard(null);
              }
            }}
            disabled={!awaitingPlayer || state.isLoading}
          />
        </div>
        
        {/* Player Hand */}
        <div className="relative z-10 flex-1 min-h-0 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sua Mão
              </span>
              <Badge variant="outline" className="text-[10px] text-foreground">
                {state.playerHand.length} cartas
              </Badge>
              {playableCards.length > 0 && (
                <Badge className="text-[10px] bg-primary/20 text-primary">
                  {playableCards.length} jogáveis
                </Badge>
              )}
            </div>
          </div>
          
          <ScrollArea className="h-[160px]">
            <div className="flex flex-wrap gap-2 justify-center py-2">
              {state.playerHand.map((card, index) => {
                const isPlayable = playableCards.some(c => c.id === card.id);
                const isSelected = selectedCardIndex === index;
                
                return (
                  <TCGCard
                    key={`${card.id}-${index}`}
                    card={card}
                    isSelected={isSelected}
                    isPlayable={isPlayable}
                    onClick={() => isPlayable && setSelectedCardIndex(index)}
                    onDoubleClick={() => setViewingCard(card)}
                    size="sm"
                  />
                );
              })}
            </div>
          </ScrollArea>
        </div>
        
        {/* Bot Debug Panel */}
        {showBotDebug && (
          <div className="relative z-10 mb-3 tcg-card p-3 border-destructive/50">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">
                [DEBUG] Mão do {state.botName} ({state.botHand.length})
              </span>
            </div>
            <ScrollArea className="h-[80px]">
              <div className="flex flex-wrap gap-1.5 justify-center">
                {state.botHand.map((card, index) => (
                  <TCGCard
                    key={`bot-${card.id}-${index}`}
                    card={card}
                    size="sm"
                    onClick={() => setViewingCard(card)}
                    className="scale-75 origin-top-left"
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Actions */}
        <div className="relative z-10 flex gap-2">
          {combatPhase !== 'initiative_post' && awaitingPlayer && (
            <>
              <Button 
                className="flex-1 tcg-action-btn" 
                onClick={handlePlayCard}
                disabled={!canPlayCard || state.isLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                Jogar Carta
              </Button>
              {actionLabel && (
                <Button 
                  variant="secondary"
                  className="tcg-action-btn"
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
                className="tcg-action-btn"
                onClick={passTurn}
                disabled={state.isLoading}
              >
                Passar
              </Button>
            </>
          )}
          {!awaitingPlayer && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground py-3">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span>Aguardando {state.botName}...</span>
            </div>
          )}
        </div>
        
        {/* Card Detail Modal */}
        <SinglePlayerCardDetail 
          card={viewingCard} 
          open={viewingCard !== null} 
          onClose={() => setViewingCard(null)} 
        />
      </div>
    );
  }

  // ========================
  // FINISHED - TCG Style
  // ========================

  if (state.phase === 'finished') {
    const isWinner = state.winner === 'player';
    
    return (
      <div className="tcg-table min-h-screen flex flex-col items-center justify-center p-4">
        {/* Decorative Corners */}
        <div className="tcg-ornament tcg-ornament--tl" />
        <div className="tcg-ornament tcg-ornament--tr" />
        <div className="tcg-ornament tcg-ornament--bl" />
        <div className="tcg-ornament tcg-ornament--br" />
        
        <div className="tcg-card p-8 w-full max-w-md text-center relative z-10">
          <div className="tcg-card-frame" />
          
          {/* Result Icon */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            isWinner ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <Trophy className={`w-10 h-10 ${isWinner ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          
          {/* Title */}
          <h1 className={`text-3xl font-bold mb-2 ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
            {isWinner ? 'Vitória!' : 'Derrota'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isWinner 
              ? `Você derrotou ${state.botName}!`
              : `${state.botName} venceu a batalha.`
            }
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Seu HP</div>
              <div className="text-xl font-bold">{state.playerHp}/{state.playerMaxHp}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">HP Inimigo</div>
              <div className="text-xl font-bold">{state.botHp}/{state.botMaxHp}</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground mb-6">
            Rounds jogados: <span className="font-bold">{state.round}</span>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 tcg-action-btn" 
              onClick={() => {
                resetGame();
                if (selectedArmy) {
                  setLocalView('difficulty_select');
                } else {
                  handleBackToMenu();
                }
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Jogar Novamente
            </Button>
            <Button 
              variant="outline" 
              className="tcg-action-btn"
              onClick={handleBackToMenu}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Menu
            </Button>
          </div>
        </div>
        
        {/* Battle Log */}
        <div className="w-full max-w-md mt-4 relative z-10">
          <TCGBattleLog logs={state.battleLog} maxEntries={15} />
        </div>
      </div>
    );
  }

  // Fallback: Loading
  return (
    <div className="tcg-table min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );
}
