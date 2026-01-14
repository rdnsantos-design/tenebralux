/**
 * Componente Principal de Combate Single Player
 * Integra seleção de personagem, configuração de inimigos e arena
 */

import { useState } from 'react';
import { SavedCharacter } from '@/types/character-storage';
import { useTacticalCombat } from '@/hooks/useTacticalCombat';
import { CharacterSelector } from './CharacterSelector';
import { EnemyConfig, EnemyLevel } from './EnemyConfig';
import { CombatArena } from './CombatArena';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type SetupStep = 'character' | 'enemy' | 'battle';

export function SinglePlayerCombat() {
  const [step, setStep] = useState<SetupStep>('character');
  const [selectedCharacter, setSelectedCharacter] = useState<SavedCharacter | null>(null);
  const [enemyLevel, setEnemyLevel] = useState<EnemyLevel>('normal');
  const [enemyCount, setEnemyCount] = useState(1);

  const combat = useTacticalCombat({ theme: 'akashic' });

  const handleSelectCharacter = (character: SavedCharacter) => {
    setSelectedCharacter(character);
    setStep('enemy');
  };

  const handleStartBattle = () => {
    if (!selectedCharacter) return;
    
    combat.startBattle(selectedCharacter.data, enemyLevel, enemyCount);
    setStep('battle');
  };

  const handleReset = () => {
    combat.resetBattle();
    setSelectedCharacter(null);
    setStep('character');
  };

  const handleBack = () => {
    if (step === 'enemy') {
      setStep('character');
    }
  };

  // Renderizar baseado no step
  if (step === 'character') {
    return (
      <div className="max-w-md mx-auto py-8">
        <CharacterSelector onSelect={handleSelectCharacter} />
      </div>
    );
  }

  if (step === 'enemy') {
    return (
      <div className="max-w-md mx-auto py-8 space-y-4">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        {selectedCharacter && (
          <div className="text-center mb-4">
            <p className="text-muted-foreground">Personagem selecionado:</p>
            <p className="font-semibold text-lg">{selectedCharacter.data.name}</p>
          </div>
        )}
        
        <EnemyConfig
          enemyLevel={enemyLevel}
          enemyCount={enemyCount}
          onLevelChange={setEnemyLevel}
          onCountChange={setEnemyCount}
          onStart={handleStartBattle}
        />
      </div>
    );
  }

  // Battle step
  if (!combat.battleState) {
    return <div>Erro: Estado de batalha não inicializado</div>;
  }

  return (
    <div className="py-4">
      <CombatArena
        battleState={combat.battleState}
        currentCombatant={combat.currentCombatant}
        playerCombatantToChoose={combat.playerCombatantToChoose}
        isPlayerTurn={combat.isPlayerTurn}
        playerNeedsToChoose={combat.playerNeedsToChoose}
        playerCombatants={combat.playerCombatants}
        enemyCombatants={combat.enemyCombatants}
        availableCards={combat.availableCards}
        selectedCard={combat.selectedCard}
        selectedTarget={combat.selectedTarget}
        onSelectCard={combat.selectCard}
        onSelectTarget={combat.selectTarget}
        onConfirmAction={combat.confirmAction}
        onAIAction={combat.executeAIAction}
        onReset={handleReset}
        phase={combat.phase}
        validMoveHexes={combat.validMoveHexes}
        validTargetHexes={combat.validTargetHexes}
        onHexClick={combat.handleHexClick}
        actionMode={combat.actionMode}
        onToggleActionMode={combat.toggleActionMode}
      />
    </div>
  );
}
