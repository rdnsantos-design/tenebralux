import React from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { CharacterBuilderLayout } from './CharacterBuilderLayout';
import { StepConcept } from './steps/StepConcept';
import { StepAttributes } from './steps/StepAttributes';
import { StepSkills } from './steps/StepSkills';
import { StepDerived } from './steps/StepDerived';
import { StepPrivileges } from './steps/StepPrivileges';
import { StepVirtues } from './steps/StepVirtues';
import { StepEquipment } from './steps/StepEquipment';
import { StepReputation } from './steps/StepReputation';
import { StepSummary } from './steps/StepSummary';

interface CharacterWizardProps {
  onBack?: () => void;
  onFinish?: () => void;
}

export function CharacterWizard({ onBack, onFinish }: CharacterWizardProps) {
  const { currentStep } = useCharacterBuilder();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepConcept onBack={onBack} />;
      case 2:
        return <StepAttributes />;
      case 3:
        return <StepSkills />;
      case 4:
        return <StepDerived />;
      case 5:
        return <StepPrivileges />;
      case 6:
        return <StepVirtues />;
      case 7:
        return <StepEquipment />;
      case 8:
        return <StepReputation />;
      case 9:
        return <StepSummary onFinish={onFinish} />;
      default:
        return <StepSummary onFinish={onFinish} />;
    }
  };

  return (
    <CharacterBuilderLayout>
      {renderStep()}
    </CharacterBuilderLayout>
  );
}
