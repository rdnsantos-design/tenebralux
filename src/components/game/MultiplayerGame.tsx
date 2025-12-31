import { useMemo } from 'react';
import { GameLobby } from './GameLobby';
import { GameSetup } from './GameSetup';
import { GameBoard } from './GameBoard';
import { useGameSession } from '@/hooks/useGameSession';
import { useStrategicArmies } from '@/hooks/useStrategicArmies';
import { useMassCombatTacticalCards } from '@/hooks/useMassCombatTacticalCards';
import { calculateDefense, calculateHitPoints, calculateVetSpent } from '@/types/combat/strategic-army';

export function MultiplayerGame() {
  const {
    session,
    playerNumber,
    playedCards,
    roundResults,
    loading,
    createSession,
    joinSession,
    selectArmy,
    setReady,
    startGame,
    playCard,
    removePlayedCard,
    advancePhase,
    submitRoundResults,
    endGame,
    leaveSession,
  } = useGameSession();

  const { armies } = useStrategicArmies();
  const { cards: allCards } = useMassCombatTacticalCards();

  const myArmyId = playerNumber === 1 ? session?.player1_army_id : session?.player2_army_id;
  const opponentArmyId = playerNumber === 1 ? session?.player2_army_id : session?.player1_army_id;

  const myArmy = useMemo(() => armies.find(a => a.id === myArmyId) || null, [armies, myArmyId]);
  const opponentArmy = useMemo(() => armies.find(a => a.id === opponentArmyId) || null, [armies, opponentArmyId]);

  // No session - show lobby
  if (!session) {
    return (
      <GameLobby
        onCreateRoom={createSession}
        onJoinRoom={joinSession}
        loading={loading}
      />
    );
  }

  // Session in setup phase
  if (session.status === 'waiting' || session.status === 'setup') {
    return (
      <GameSetup
        session={session}
        playerNumber={playerNumber!}
        armies={armies}
        selectedArmyId={myArmyId || null}
        onSelectArmy={selectArmy}
        onReady={setReady}
        onStartGame={startGame}
        onLeave={leaveSession}
      />
    );
  }

  // Game in progress
  if (session.status === 'playing') {
    return (
      <GameBoard
        session={session}
        playerNumber={playerNumber!}
        myArmy={myArmy}
        opponentArmy={opponentArmy}
        playedCards={playedCards}
        roundResults={roundResults}
        allCards={allCards}
        onPlayCard={playCard}
        onRemoveCard={removePlayedCard}
        onReady={setReady}
        onAdvancePhase={advancePhase}
        onSubmitResults={submitRoundResults}
        onEndGame={endGame}
      />
    );
  }

  // Game finished
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold mb-4">Jogo Encerrado</h2>
      <p className="text-muted-foreground mb-6">A batalha terminou.</p>
      <button onClick={leaveSession} className="text-primary hover:underline">
        Voltar ao Lobby
      </button>
    </div>
  );
}
