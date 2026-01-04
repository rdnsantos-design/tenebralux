import React from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { CharacterBuilderLayout } from './CharacterBuilderLayout';
import { StepConcept } from './steps/StepConcept';
import { StepAttributes } from './steps/StepAttributes';
import { StepSkills } from './steps/StepSkills';
import { StepDerived } from './steps/StepDerived';
import { StepBlessings } from './steps/StepBlessings';
import { StepVirtues } from './steps/StepVirtues';
import { StepEquipment } from './steps/StepEquipment';
import { StepSummary } from './steps/StepSummary';

export function CharacterWizard() {
  const { currentStep } = useCharacterBuilder();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepConcept />;
      case 2:
        return <StepAttributes />;
      case 3:
        return <StepSkills />;
      case 4:
        return <StepDerived />;
      case 5:
        return <StepBlessings />;
      case 6:
        return <StepVirtues />;
      case 7:
        return <StepEquipment />;
      case 8:
        return <StepSummary />;
      default:
        return <StepSummary />;
    }
  };

  return (
    <CharacterBuilderLayout>
      {renderStep()}
    </CharacterBuilderLayout>
  );
}