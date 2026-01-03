import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTacticalGame } from '@/contexts/TacticalGameContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Home, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export function VictoryModal() {
  const navigate = useNavigate();
  const { gameState, myPlayerId } = useTacticalGame();
  
  const isFinished = gameState?.isFinished;
  const winner = gameState?.winner;
  
  const isWinner = winner === myPlayerId;
  const winnerName = winner === 'player1' 
    ? gameState?.player1Name 
    : gameState?.player2Name;
  
  // Dispara confetti se venceu
  useEffect(() => {
    if (isFinished && isWinner) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isFinished, isWinner]);
  
  if (!isFinished || !winner || !gameState) return null;
  
  // Calcular estatísticas da batalha
  const getStats = () => {
    const units = Object.values(gameState.units);
    const p1Units = units.filter(u => u.owner === 'player1');
    const p2Units = units.filter(u => u.owner === 'player2');
    
    return {
      turns: gameState.turn,
      p1Remaining: p1Units.filter(u => u.currentHealth > 0 && !u.isRouting).length,
      p1Total: p1Units.length,
      p2Remaining: p2Units.filter(u => u.currentHealth > 0 && !u.isRouting).length,
      p2Total: p2Units.length,
    };
  };
  
  const stats = getStats();
  
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700">
        <div className="flex flex-col items-center text-center py-6">
          {/* Ícone */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            isWinner 
              ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
              : 'bg-gradient-to-br from-slate-500 to-slate-700'
          }`}>
            <Trophy className={`h-10 w-10 ${isWinner ? 'text-amber-900' : 'text-slate-300'}`} />
          </div>
          
          {/* Título */}
          <div className="mb-6">
            <h2 className={`text-3xl font-bold mb-2 ${
              isWinner ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {isWinner ? 'VITÓRIA!' : 'DERROTA'}
            </h2>
            <p className="text-slate-400">
              {winnerName} venceu a batalha!
            </p>
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-xs">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Turnos</div>
              <div className="text-2xl font-bold text-white">{stats.turns}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Sobreviventes</div>
              <div className="text-2xl font-bold text-white">
                {winner === 'player1' ? stats.p1Remaining : stats.p2Remaining}
                <span className="text-sm text-slate-500 ml-1">
                  /{winner === 'player1' ? stats.p1Total : stats.p2Total}
                </span>
              </div>
            </div>
          </div>
          
          {/* Botões */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/tactical')}>
              <Home className="h-4 w-4 mr-2" />
              Menu
            </Button>
            <Button onClick={() => navigate('/tactical/create')}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Nova Batalha
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
