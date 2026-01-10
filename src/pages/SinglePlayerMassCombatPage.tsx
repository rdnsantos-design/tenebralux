// ========================
// SINGLE PLAYER MASS COMBAT PAGE
// Página principal do modo single player
// ========================

import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSinglePlayerMassCombat } from '@/hooks/useSinglePlayerMassCombat';
import {
  SinglePlayerMassCombatSetup,
  SinglePlayerCultureSelection,
  SinglePlayerScenarioSelection,
  SinglePlayerDeckbuilding,
  SinglePlayerDeployment,
  SinglePlayerCombatScreen,
} from '@/components/singleplayer/masscombat';

export default function SinglePlayerMassCombatPage() {
  const {
    gameState,
    isLoading,
    isBotThinking,
    cultures,
    tacticalCards,
    commanderTemplates,
    startGame,
    selectPlayerCulture,
    confirmCulturePhase,
    submitLogisticsBid,
    setPlayerAttributes,
    addPlayerCommander,
    removePlayerCommander,
    setPlayerGeneral,
    addCardToDeck,
    removeCardFromDeck,
    confirmDeckbuilding,
    confirmDeployment,
    playCard,
    passPhase,
    resetGame,
  } = useSinglePlayerMassCombat();

  // Loading inicial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Setup inicial
  if (!gameState || gameState.phase === 'setup') {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-4">
          <Link to="/mass-combat">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
        <SinglePlayerMassCombatSetup onStart={startGame} />
      </div>
    );
  }

  // Renderizar fase atual
  const renderPhase = () => {
    switch (gameState.phase) {
      case 'culture_selection':
        return (
          <SinglePlayerCultureSelection
            cultures={cultures}
            selectedCulture={gameState.player.culture}
            playerNickname={gameState.player.nickname}
            botNickname={gameState.bot.nickname}
            isBotThinking={isBotThinking}
            onSelect={selectPlayerCulture}
            onConfirm={confirmCulturePhase}
          />
        );

      case 'scenario_selection':
        if (!gameState.scenarioOptions) return null;
        return (
          <SinglePlayerScenarioSelection
            terrains={gameState.scenarioOptions.terrains}
            seasons={gameState.scenarioOptions.seasons}
            playerNickname={gameState.player.nickname}
            botNickname={gameState.bot.nickname}
            isBotThinking={isBotThinking}
            maxBudget={10}
            onSubmit={submitLogisticsBid}
          />
        );

      case 'deckbuilding':
        return (
          <SinglePlayerDeckbuilding
            vetBudget={gameState.vetBudget}
            chosenScenario={gameState.chosenScenario}
            attributes={gameState.player.attributes}
            commanders={gameState.player.commanders}
            generalId={gameState.player.generalId}
            deck={gameState.player.deck}
            commanderTemplates={commanderTemplates}
            tacticalCards={tacticalCards}
            isBotThinking={isBotThinking}
            onSetAttributes={setPlayerAttributes}
            onAddCommander={addPlayerCommander}
            onRemoveCommander={removePlayerCommander}
            onSetGeneral={setPlayerGeneral}
            onAddCard={addCardToDeck}
            onRemoveCard={removeCardFromDeck}
            onConfirm={confirmDeckbuilding}
          />
        );

      case 'deployment':
        return (
          <SinglePlayerDeployment
            playerHp={gameState.player.hp}
            botHp={gameState.bot.hp}
            chosenScenario={gameState.chosenScenario}
            isBotThinking={isBotThinking}
            onConfirm={confirmDeployment}
          />
        );

      case 'combat':
      case 'finished':
        return (
          <SinglePlayerCombatScreen
            player={gameState.player}
            bot={gameState.bot}
            combatRound={gameState.combatRound}
            combatSubPhase={gameState.combatSubPhase}
            currentAttacker={gameState.currentAttacker}
            isBotThinking={isBotThinking}
            winner={gameState.winner}
            actionLog={gameState.actionLog}
            onPlayCard={playCard}
            onPass={passPhase}
            onNewGame={resetGame}
          />
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Fase não implementada: {gameState.phase}</p>
            <Button onClick={resetGame} className="mt-4">Reiniciar</Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto py-4 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={resetGame}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Sair da Partida
          </Button>
          <div className="text-sm text-muted-foreground">
            {gameState.player.nickname} vs {gameState.bot.nickname}
          </div>
        </div>

        {/* Conteúdo da fase */}
        <div className="flex justify-center">
          {renderPhase()}
        </div>
      </div>
    </div>
  );
}
