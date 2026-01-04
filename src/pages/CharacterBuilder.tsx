import React from 'react';
import { CharacterBuilderProvider } from '@/contexts/CharacterBuilderContext';
import { CharacterWizard } from '@/components/character-builder';

export default function CharacterBuilder() {
  return (
    <CharacterBuilderProvider>
      <CharacterWizard />
    </CharacterBuilderProvider>
  );
}
