import React, { useState } from 'react';
import { CharacterBuilderProvider, useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { CharacterWizard } from '@/components/character-builder';
import { CharacterList } from '@/components/character-manager';

type View = 'list' | 'builder';

function CharacterBuilderContent() {
  const [view, setView] = useState<View>('list');
  const { loadCharacter, resetBuilder } = useCharacterBuilder();

  const handleCreateNew = () => {
    resetBuilder();
    setView('builder');
  };

  const handleEdit = (id: string) => {
    loadCharacter(id);
    setView('builder');
  };

  const handleContinue = (id: string) => {
    loadCharacter(id);
    setView('builder');
  };

  const handleBackToList = () => {
    setView('list');
  };

  if (view === 'builder') {
    return (
      <CharacterWizard 
        onBack={handleBackToList}
        onFinish={() => setView('list')}
      />
    );
  }

  return (
    <CharacterList
      onCreateNew={handleCreateNew}
      onEdit={handleEdit}
      onContinue={handleContinue}
    />
  );
}

export default function CharacterBuilder() {
  return (
    <CharacterBuilderProvider>
      <CharacterBuilderContent />
    </CharacterBuilderProvider>
  );
}
