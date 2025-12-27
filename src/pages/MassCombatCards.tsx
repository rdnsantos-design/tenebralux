import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MassCombatTacticalCardList } from '@/components/masscombat/MassCombatTacticalCardList';

export default function MassCombatCards() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/strategic-game">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Cartas de Combate Estratégico</h1>
              <p className="text-sm text-muted-foreground">
                Cartas para resolução rápida de combate em massa
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <MassCombatTacticalCardList />
      </main>
    </div>
  );
}
