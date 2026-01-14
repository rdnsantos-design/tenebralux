import React, { useState } from 'react';
import { CharacterBuilderProvider, useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { CharacterWizard } from '@/components/character-builder';
import { CharacterList } from '@/components/character-manager';
import { CharacterTypeModal } from '@/components/character-builder/CharacterTypeModal';
import { SimplifiedCharacterEditor } from '@/components/character-builder/SimplifiedCharacterEditor';
import { SimplifiedCharacter } from '@/types/simplified-character';
import { v4 as uuidv4 } from 'uuid';

type View = 'list' | 'builder' | 'simplified';

function CharacterBuilderContent() {
  const [view, setView] = useState<View>('list');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingSimplified, setEditingSimplified] = useState<SimplifiedCharacter | undefined>();
  const { loadCharacter, resetBuilder } = useCharacterBuilder();

  // Load simplified characters from localStorage
  const getSimplifiedCharacters = (): SimplifiedCharacter[] => {
    try {
      const stored = localStorage.getItem('simplifiedCharacters');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveSimplifiedCharacter = (data: Omit<SimplifiedCharacter, 'id' | 'createdAt' | 'updatedAt'>) => {
    const characters = getSimplifiedCharacters();
    const now = new Date().toISOString();
    
    if (editingSimplified) {
      // Update existing
      const updated = characters.map(c => 
        c.id === editingSimplified.id 
          ? { ...data, id: editingSimplified.id, createdAt: editingSimplified.createdAt, updatedAt: now }
          : c
      );
      localStorage.setItem('simplifiedCharacters', JSON.stringify(updated));
    } else {
      // Create new
      const newChar: SimplifiedCharacter = {
        ...data,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now
      } as SimplifiedCharacter;
      localStorage.setItem('simplifiedCharacters', JSON.stringify([...characters, newChar]));
    }
    
    setEditingSimplified(undefined);
    setView('list');
  };

  const handleCreateNew = () => {
    setShowTypeModal(true);
  };

  const handleSelectComplete = () => {
    resetBuilder();
    setView('builder');
  };

  const handleSelectSimplified = () => {
    setEditingSimplified(undefined);
    setView('simplified');
  };

  const handleEdit = async (id: string) => {
    // Check if it's a simplified character
    const simplified = getSimplifiedCharacters().find(c => c.id === id);
    if (simplified) {
      setEditingSimplified(simplified);
      setView('simplified');
      return;
    }
    
    // Otherwise, load full character
    await loadCharacter(id);
    setView('builder');
  };

  const handleContinue = async (id: string) => {
    await loadCharacter(id);
    setView('builder');
  };

  const handleBackToList = () => {
    setEditingSimplified(undefined);
    setView('list');
  };

  if (view === 'simplified') {
    return (
      <SimplifiedCharacterEditor
        character={editingSimplified}
        onSave={saveSimplifiedCharacter}
        onCancel={handleBackToList}
      />
    );
  }

  if (view === 'builder') {
    return (
      <CharacterWizard 
        onBack={handleBackToList}
        onFinish={() => setView('list')}
      />
    );
  }

  return (
    <>
      <CharacterList
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onContinue={handleContinue}
      />
      <CharacterTypeModal
        open={showTypeModal}
        onOpenChange={setShowTypeModal}
        onSelectComplete={handleSelectComplete}
        onSelectSimplified={handleSelectSimplified}
      />
    </>
  );
}

export default function CharacterBuilder() {
  return (
    <CharacterBuilderProvider>
      <CharacterBuilderContent />
    </CharacterBuilderProvider>
  );
}
