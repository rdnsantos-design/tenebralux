import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTacticalGame } from '@/contexts/TacticalGameContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Users, 
  Skull, 
  Flag,
  Clock
} from 'lucide-react';

export function BattleHeader() {
  const navigate = useNavigate();
  const { gameState, myPlayerId } = useTacticalGame();
  
  if (!gameState) return null;
  
  // Calcular estatísticas
  const getPlayerStats = (owner: 'player1' | 'player2') => {
    const units = Object.values(gameState.units).filter(u => u.owner === owner);
    const alive = units.filter(u => !u.isRouting && u.currentHealth > 0);
    const routing = units.filter(u => u.isRouting);
    const dead = units.filter(u => u.currentHealth <= 0);
    
    const totalHealth = units.reduce((sum, u) => sum + u.maxHealth, 0);
    const currentHealth = alive.reduce((sum, u) => sum + u.currentHealth, 0);
    const healthPercent = totalHealth > 0 ? (currentHealth / totalHealth) * 100 : 0;
    
    return { total: units.length, alive: alive.length, routing: routing.length, dead: dead.length, healthPercent };
  };
  
  const p1Stats = getPlayerStats('player1');
  const p2Stats = getPlayerStats('player2');
  
  const isP1 = myPlayerId === 'player1';
  
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Botão voltar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/tactical')}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Sair
        </Button>
        
        {/* Player 1 */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className={`font-semibold ${isP1 ? 'text-red-400' : 'text-slate-300'}`}>
                {gameState.player1Name}
              </span>
              {isP1 && <Badge className="bg-red-600 text-xs">Você</Badge>}
            </div>
            <div className="flex items-center justify-end gap-2 text-xs">
              <span className="text-green-400 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {p1Stats.alive}
              </span>
              {p1Stats.routing > 0 && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  {p1Stats.routing}
                </span>
              )}
              {p1Stats.dead > 0 && (
                <span className="text-red-400 flex items-center gap-1">
                  <Skull className="h-3 w-3" />
                  {p1Stats.dead}
                </span>
              )}
            </div>
          </div>
          <div className="w-32">
            <Progress 
              value={p1Stats.healthPercent} 
              className="h-2 bg-slate-700"
            />
          </div>
        </div>
        
        {/* Turno central */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{gameState.turn}</div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            Turno
          </div>
        </div>
        
        {/* Player 2 */}
        <div className="flex items-center gap-4">
          <div className="w-32">
            <Progress 
              value={p2Stats.healthPercent} 
              className="h-2 bg-slate-700"
            />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              {myPlayerId === 'player2' && <Badge className="bg-blue-600 text-xs">Você</Badge>}
              <span className={`font-semibold ${myPlayerId === 'player2' ? 'text-blue-400' : 'text-slate-300'}`}>
                {gameState.player2Name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {p2Stats.alive}
              </span>
              {p2Stats.routing > 0 && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  {p2Stats.routing}
                </span>
              )}
              {p2Stats.dead > 0 && (
                <span className="text-red-400 flex items-center gap-1">
                  <Skull className="h-3 w-3" />
                  {p2Stats.dead}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Espaço para manter simetria */}
        <div className="w-20"></div>
      </div>
    </div>
  );
}
