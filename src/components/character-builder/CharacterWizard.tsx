import React from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { CharacterBuilderLayout } from './CharacterBuilderLayout';
import { StepPlaceholder } from './steps/StepPlaceholder';

// Imports futuros dos steps
// import { StepConcept } from './steps/StepConcept';
// import { StepAttributes } from './steps/StepAttributes';
// etc...

export function CharacterWizard() {
  const { currentStep } = useCharacterBuilder();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        // return <StepConcept />;
        return <StepPlaceholder />;
      case 2:
        // return <StepAttributes />;
        return <StepPlaceholder />;
      case 3:
        // return <StepSkills />;
        return <StepPlaceholder />;
      case 4:
        // return <StepDerived />;
        return <StepPlaceholder />;
      case 5:
        // return <StepBlessings />;
        return <StepPlaceholder />;
      case 6:
        // return <StepVirtues />;
        return <StepPlaceholder />;
      case 7:
        // return <StepEquipment />;
        return <StepPlaceholder />;
      case 8:
        // return <StepSummary />;
        return <StepPlaceholder />;
      default:
        return <StepPlaceholder />;
    }
  };

  return (
    <CharacterBuilderLayout>
      {renderStep()}
    </CharacterBuilderLayout>
  );
}
