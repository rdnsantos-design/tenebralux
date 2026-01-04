import React from 'react';
import { WIZARD_STEPS } from '@/types/character-builder';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';

export function StepPlaceholder() {
  const { currentStep } = useCharacterBuilder();
  const stepDef = WIZARD_STEPS.find(s => s.step === currentStep);

  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold mb-2">{stepDef?.name}</h2>
      <p className="text-muted-foreground mb-4">{stepDef?.description}</p>
      <p className="text-sm text-muted-foreground">
        Este step será implementado no próximo prompt.
      </p>
    </div>
  );
}
