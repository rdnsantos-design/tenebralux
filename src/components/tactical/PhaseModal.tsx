import React, { useEffect, useState } from 'react';
import { useTacticalGame } from '@/contexts/TacticalGameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dices, Trophy, Swords, Target, Move, AlertTriangle, RefreshCw } from 'lucide-react';
import { GamePhase } from '@/types/tactical-game';

interface InitiativeResult {
  p1Roll: number;
  p2Roll: number;
  winner: 'player1' | 'player2';
  advantage: number;
}

export function PhaseModal() {
  const { gameState, rollInitiative } = useTacticalGame();
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);
  const [initiativeResult, setInitiativeResult] = useState<InitiativeResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showPhaseAnnouncement, setShowPhaseAnnouncement] = useState(false);
  const [announcedPhase, setAnnouncedPhase] = useState<GamePhase | null>(null);
  
  // Mostrar modal quando entrar na fase de iniciativa
  useEffect(() => {
    if (gameState?.phase === 'initiative' && !gameState.initiativeWinner) {
      setShowInitiativeModal(true);
      setInitiativeResult(null);
    } else if (gameState?.initiativeWinner && showInitiativeModal) {
      // Mostrar resultado
      setInitiativeResult({
        p1Roll: Math.floor(Math.random() * 6) + 1, // Simulação visual
        p2Roll: Math.floor(Math.random() * 6) + 1,
        winner: gameState.initiativeWinner,
        advantage: gameState.initiativeAdvantage || 0
      });
    }
  }, [gameState?.phase, gameState?.initiativeWinner]);

  // Anunciar mudanças de fase importantes
  useEffect(() => {
    if (gameState?.phase && gameState.phase !== 'initiative' && gameState.phase !== 'setup') {
      const importantPhases: GamePhase[] = ['melee', 'shooting', 'charge'];
      if (importantPhases.includes(gameState.phase) && announcedPhase !== gameState.phase) {
        setAnnouncedPhase(gameState.phase);
        setShowPhaseAnnouncement(true);
        setTimeout(() => setShowPhaseAnnouncement(false), 2000);
      }
    }
  }, [gameState?.phase]);
  
  const handleRollInitiative = async () => {
    setIsRolling(true);
    await rollInitiative();
    setTimeout(() => {
      setIsRolling(false);
    }, 1000);
  };

  const closeInitiativeModal = () => {
    if (gameState?.initiativeWinner) {
      setShowInitiativeModal(false);
    }
  };

  const getPhaseIcon = (phase: GamePhase) => {
    switch (phase) {
      case 'melee': return <Swords className="h-12 w-12" />;
      case 'shooting': return <Target className="h-12 w-12" />;
      case 'charge': return <Move className="h-12 w-12" />;
      case 'rout': return <AlertTriangle className="h-12 w-12" />;
      case 'reorganization': return <RefreshCw className="h-12 w-12" />;
      default: return null;
    }
  };

  const getPhaseLabel = (phase: GamePhase) => {
    switch (phase) {
      case 'melee': return 'Fase de Combate!';
      case 'shooting': return 'Fase de Tiro!';
      case 'charge': return 'Fase de Carga!';
      case 'rout': return 'Debandada!';
      case 'reorganization': return 'Reorganização';
      default: return phase;
    }
  };
  
  return (
    <>
      {/* Modal de Iniciativa */}
      <Dialog open={showInitiativeModal} onOpenChange={closeInitiativeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Dices className="h-8 w-8 text-purple-500" />
              Rolagem de Iniciativa
            </DialogTitle>
            <DialogDescription>
              Turno {gameState?.turn} - Determine quem age primeiro
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            {!initiativeResult ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center text-3xl font-bold ${isRolling ? 'animate-bounce bg-primary/20' : 'bg-muted'}`}>
                      {isRolling ? '?' : '-'}
                    </div>
                    <p className="mt-2 font-medium">Jogador 1</p>
                  </div>
                  <div className="flex items-center text-2xl font-bold text-muted-foreground">
                    VS
                  </div>
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center text-3xl font-bold ${isRolling ? 'animate-bounce bg-primary/20' : 'bg-muted'}`}>
                      {isRolling ? '?' : '-'}
                    </div>
                    <p className="mt-2 font-medium">Jogador 2</p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleRollInitiative} 
                  size="lg" 
                  className="w-full"
                  disabled={isRolling}
                >
                  <Dices className={`h-5 w-5 mr-2 ${isRolling ? 'animate-spin' : ''}`} />
                  {isRolling ? 'Rolando...' : 'Rolar Dados'}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center text-3xl font-bold ${initiativeResult.winner === 'player1' ? 'bg-green-500/20 border-green-500' : 'bg-muted'}`}>
                      {initiativeResult.p1Roll}
                    </div>
                    <p className="mt-2 font-medium">Jogador 1</p>
                  </div>
                  <div className="flex items-center text-2xl font-bold text-muted-foreground">
                    VS
                  </div>
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center text-3xl font-bold ${initiativeResult.winner === 'player2' ? 'bg-green-500/20 border-green-500' : 'bg-muted'}`}>
                      {initiativeResult.p2Roll}
                    </div>
                    <p className="mt-2 font-medium">Jogador 2</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <p className="text-xl font-bold">
                    {initiativeResult.winner === 'player1' ? 'Jogador 1' : 'Jogador 2'} venceu!
                  </p>
                  <Badge variant="secondary">
                    Vantagem: +{initiativeResult.advantage}
                  </Badge>
                </div>
                
                <Button onClick={closeInitiativeModal} className="w-full">
                  Continuar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Anúncio de Fase (overlay temporário) */}
      {showPhaseAnnouncement && announcedPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-background/95 border-2 rounded-xl p-8 animate-in zoom-in-50 fade-in duration-300 shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-primary">
                {getPhaseIcon(announcedPhase)}
              </div>
              <h2 className="text-3xl font-bold">{getPhaseLabel(announcedPhase)}</h2>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
