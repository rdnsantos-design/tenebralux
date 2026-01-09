/**
 * Página de Teste de Combate Tático Single Player
 */

import { SinglePlayerCombat } from '@/components/tactical-combat';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TacticalCombatTest() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Swords className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Combate Tático - Teste</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <SinglePlayerCombat />
      </main>
    </div>
  );
}
