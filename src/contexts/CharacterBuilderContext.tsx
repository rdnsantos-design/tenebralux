import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CharacterDraft, WizardStep, StepValidation, ValidationError } from '@/types/character-builder';
import { Character, CharacterAttributes, calculateDerivedStats, calculateRegencyStats } from '@/core/types';
import { useTheme } from '@/themes';
import { getSkillsByAttribute } from '@/data/character/skills';
import { getStartingVirtue } from '@/data/character/virtues';

interface CharacterBuilderContextType {
  // Estado
  currentStep: WizardStep;
  draft: CharacterDraft;
  isSimplifiedMode: boolean;
  
  // Navegação
  nextStep: () => boolean;
  prevStep: () => void;
  goToStep: (step: WizardStep) => void;
  
  // Dados
  updateDraft: (data: Partial<CharacterDraft>) => void;
  resetBuilder: () => void;
  setSimplifiedMode: (value: boolean) => void;
  
  // Validação
  validateStep: (step: WizardStep) => StepValidation;
  getStepValidation: (step: WizardStep) => StepValidation;
  canProceedToStep: (step: WizardStep) => boolean;
  
  // Cálculos
  getAttributeTotal: () => number;
  getSkillPointsForAttribute: (attributeId: string) => number;
  getUsedSkillPoints: (attributeId: string) => number;
  
  // Finalização
  finalizeCharacter: () => Character | null;
  canFinalize: () => boolean;
}

const CharacterBuilderContext = createContext<CharacterBuilderContextType | null>(null);

const DEFAULT_ATTRIBUTES: CharacterAttributes = {
  conhecimento: 1,
  raciocinio: 1,
  corpo: 1,
  reflexos: 1,
  determinacao: 1,
  coordenacao: 1,
  carisma: 1,
  intuicao: 1,
};

const TOTAL_ATTRIBUTE_POINTS = 25;
const BASE_ATTRIBUTE_POINTS = 8; // 8 atributos x 1 ponto mínimo

export function CharacterBuilderProvider({ children }: { children: React.ReactNode }) {
  const { activeTheme } = useTheme();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<CharacterDraft>({
    theme: activeTheme,
    attributes: { ...DEFAULT_ATTRIBUTES },
    skills: {},
    virtues: { sabedoria: 0, coragem: 0, perseveranca: 0, harmonia: 0 },
  });
  const [isSimplifiedMode, setSimplifiedMode] = useState(false);

  // Atualizar tema do draft quando theme global muda
  useEffect(() => {
    setDraft(prev => ({ ...prev, theme: activeTheme }));
  }, [activeTheme]);

  const updateDraft = useCallback((data: Partial<CharacterDraft>) => {
    setDraft(prev => ({ ...prev, ...data }));
  }, []);

  const resetBuilder = useCallback(() => {
    setCurrentStep(1);
    setDraft({
      theme: activeTheme,
      attributes: { ...DEFAULT_ATTRIBUTES },
      skills: {},
      virtues: { sabedoria: 0, coragem: 0, perseveranca: 0, harmonia: 0 },
    });
    setSimplifiedMode(false);
  }, [activeTheme]);

  // Cálculos
  const getAttributeTotal = useCallback((): number => {
    if (!draft.attributes) return BASE_ATTRIBUTE_POINTS;
    return Object.values(draft.attributes).reduce((sum, val) => sum + (val || 0), 0);
  }, [draft.attributes]);

  const getSkillPointsForAttribute = useCallback((attributeId: string): number => {
    return draft.attributes?.[attributeId as keyof CharacterAttributes] || 1;
  }, [draft.attributes]);

  const getUsedSkillPoints = useCallback((attributeId: string): number => {
    if (!draft.skills) return 0;
    const skillsForAttribute = getSkillsByAttribute(attributeId);
    const skillIds = skillsForAttribute.map(s => s.id);
    return Object.entries(draft.skills)
      .filter(([skillId]) => skillIds.includes(skillId))
      .reduce((sum, [, level]) => sum + level, 0);
  }, [draft.skills]);

  // Validação por step
  const validateStep = useCallback((step: WizardStep): StepValidation => {
    const errors: ValidationError[] = [];

    switch (step) {
      case 1: // Conceito
        if (!draft.name?.trim()) {
          errors.push({ field: 'name', message: 'Nome é obrigatório' });
        }
        if (!draft.theme) {
          errors.push({ field: 'theme', message: 'Selecione um tema' });
        }
        break;

      case 2: // Atributos
        const total = getAttributeTotal();
        if (total !== TOTAL_ATTRIBUTE_POINTS) {
          errors.push({ 
            field: 'attributes', 
            message: `Distribua exatamente ${TOTAL_ATTRIBUTE_POINTS} pontos (atual: ${total})` 
          });
        }
        break;

      case 3: // Perícias
        // Validar que todos os pontos foram distribuídos
        const totalAttributePoints = Object.values(draft.attributes || {}).reduce((sum, val) => sum + (val || 0), 0);
        const totalSkillPoints = Object.values(draft.skills || {}).reduce((sum, val) => sum + (val || 0), 0);
        
        if (totalSkillPoints !== totalAttributePoints) {
          errors.push({
            field: 'skills',
            message: `Distribua todos os pontos de perícia (${totalSkillPoints}/${totalAttributePoints})`
          });
        }
        break;

      case 4: // Derivados
        // Step informativo - sempre válido se chegou aqui
        // Os valores são calculados automaticamente
        break;

      case 5: // Bênçãos
        // Cada bênção precisa de um desafio
        if (draft.blessingIds?.length) {
          for (const blessingId of draft.blessingIds) {
            if (!draft.challengeIds?.[blessingId]) {
              errors.push({ 
                field: `challenge_${blessingId}`, 
                message: 'Selecione um desafio para esta bênção' 
              });
            }
          }
        }
        break;
        
      case 6: // Virtudes
        // Se facção não define virtude, jogador precisa escolher
        const startingVirtue = getStartingVirtue(draft.factionId);
        if (startingVirtue === 'choice' && !draft.startingVirtue) {
          errors.push({ 
            field: 'startingVirtue', 
            message: 'Escolha uma virtude inicial' 
          });
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }, [draft, getAttributeTotal]);

  const getStepValidation = useCallback((step: WizardStep): StepValidation => {
    return validateStep(step);
  }, [validateStep]);

  const canProceedToStep = useCallback((targetStep: WizardStep): boolean => {
    // Pode voltar para qualquer step anterior
    if (targetStep <= currentStep) return true;
    
    // Para avançar, todos os steps anteriores devem ser válidos
    for (let s = 1; s < targetStep; s++) {
      if (!validateStep(s as WizardStep).isValid) {
        return false;
      }
    }
    return true;
  }, [currentStep, validateStep]);

  // Navegação
  const nextStep = useCallback((): boolean => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      return false;
    }
    if (currentStep < 8) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
      return true;
    }
    return false;
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: WizardStep) => {
    if (step >= 1 && step <= 8 && canProceedToStep(step)) {
      setCurrentStep(step);
    }
  }, [canProceedToStep]);

  // Finalização
  const canFinalize = useCallback((): boolean => {
    for (let s = 1; s <= 7; s++) {
      if (!validateStep(s as WizardStep).isValid) {
        return false;
      }
    }
    return true;
  }, [validateStep]);

  const finalizeCharacter = useCallback((): Character | null => {
    if (!canFinalize()) return null;
    if (!draft.name || !draft.theme || !draft.attributes) return null;

    const attributes = draft.attributes as CharacterAttributes;
    const skills = draft.skills || {};
    const theme = draft.theme;

    const derivedStats = calculateDerivedStats(attributes, skills);
    const regencyStats = calculateRegencyStats(attributes, skills, theme);

    const character: Character = {
      id: crypto.randomUUID(),
      name: draft.name,
      theme: theme,
      faction: draft.factionId,
      culture: draft.culture,
      attributes,
      skills,
      virtues: {
        sabedoria: draft.virtues?.sabedoria ?? 0,
        coragem: draft.virtues?.coragem ?? 0,
        perseveranca: draft.virtues?.perseveranca ?? 0,
        harmonia: draft.virtues?.harmonia ?? 0,
      },
      blessings: [], // Será preenchido quando implementar bênçãos
      derivedStats,
      regencyStats,
      equipment: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return character;
  }, [draft, canFinalize]);

  const value = useMemo(() => ({
    currentStep,
    draft,
    isSimplifiedMode,
    nextStep,
    prevStep,
    goToStep,
    updateDraft,
    resetBuilder,
    setSimplifiedMode,
    validateStep,
    getStepValidation,
    canProceedToStep,
    getAttributeTotal,
    getSkillPointsForAttribute,
    getUsedSkillPoints,
    finalizeCharacter,
    canFinalize,
  }), [
    currentStep,
    draft,
    isSimplifiedMode,
    nextStep,
    prevStep,
    goToStep,
    updateDraft,
    resetBuilder,
    validateStep,
    getStepValidation,
    canProceedToStep,
    getAttributeTotal,
    getSkillPointsForAttribute,
    getUsedSkillPoints,
    finalizeCharacter,
    canFinalize,
  ]);

  return (
    <CharacterBuilderContext.Provider value={value}>
      {children}
    </CharacterBuilderContext.Provider>
  );
}

export function useCharacterBuilder() {
  const context = useContext(CharacterBuilderContext);
  if (!context) {
    throw new Error('useCharacterBuilder must be used within CharacterBuilderProvider');
  }
  return context;
}
