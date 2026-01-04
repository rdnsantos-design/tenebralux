import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CharacterBuilderProvider, useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { ThemeProvider } from '@/themes/ThemeContext';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Wrapper para os hooks
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <CharacterBuilderProvider>
          {children}
        </CharacterBuilderProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

describe('CharacterBuilderContext', () => {
  describe('Initial State', () => {
    it('should start at step 1', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      expect(result.current.currentStep).toBe(1);
    });

    it('should have default attributes set to 1', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      const attrs = result.current.draft.attributes;
      
      expect(attrs?.conhecimento).toBe(1);
      expect(attrs?.raciocinio).toBe(1);
      expect(attrs?.corpo).toBe(1);
      expect(attrs?.reflexos).toBe(1);
      expect(attrs?.determinacao).toBe(1);
      expect(attrs?.coordenacao).toBe(1);
      expect(attrs?.carisma).toBe(1);
      expect(attrs?.intuicao).toBe(1);
    });

    it('should have empty skills', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      expect(result.current.draft.skills).toEqual({});
    });

    it('should have zero virtues', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      const virtues = result.current.draft.virtues;
      
      expect(virtues?.sabedoria).toBe(0);
      expect(virtues?.coragem).toBe(0);
      expect(virtues?.perseveranca).toBe(0);
      expect(virtues?.harmonia).toBe(0);
    });

    it('should not be in simplified mode by default', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      expect(result.current.isSimplifiedMode).toBe(false);
    });
  });

  describe('updateDraft', () => {
    it('should update name', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({ name: 'Test Character' });
      });
      
      expect(result.current.draft.name).toBe('Test Character');
    });

    it('should update attributes', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({ 
          attributes: {
            conhecimento: 3,
            raciocinio: 3,
            corpo: 3,
            reflexos: 3,
            determinacao: 3,
            coordenacao: 3,
            carisma: 4,
            intuicao: 3,
          }
        });
      });
      
      expect(result.current.draft.attributes?.carisma).toBe(4);
    });

    it('should update skills', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({ 
          skills: { ciencias: 2, logica: 3 }
        });
      });
      
      expect(result.current.draft.skills?.ciencias).toBe(2);
      expect(result.current.draft.skills?.logica).toBe(3);
    });

    it('should merge updates with existing draft', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({ name: 'Hero' });
      });
      
      act(() => {
        result.current.updateDraft({ factionId: 'anuire' });
      });
      
      expect(result.current.draft.name).toBe('Hero');
      expect(result.current.draft.factionId).toBe('anuire');
    });
  });

  describe('resetBuilder', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      // Make some changes
      act(() => {
        result.current.updateDraft({ name: 'Test', factionId: 'anuire' });
        result.current.nextStep();
      });
      
      // Reset
      act(() => {
        result.current.resetBuilder();
      });
      
      expect(result.current.currentStep).toBe(1);
      expect(result.current.draft.name).toBeUndefined();
      expect(result.current.draft.factionId).toBeUndefined();
    });
  });

  describe('Navigation', () => {
    it('should not advance without valid step', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      // Step 1 requires name, so should fail
      let advanced = false;
      act(() => {
        advanced = result.current.nextStep();
      });
      
      expect(advanced).toBe(false);
      expect(result.current.currentStep).toBe(1);
    });

    it('should advance with valid step 1', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({ name: 'Test Character' });
      });
      
      let advanced = false;
      act(() => {
        advanced = result.current.nextStep();
      });
      
      expect(advanced).toBe(true);
      expect(result.current.currentStep).toBe(2);
    });

    it('should go back with prevStep', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({ name: 'Test' });
        result.current.nextStep();
      });
      
      expect(result.current.currentStep).toBe(2);
      
      act(() => {
        result.current.prevStep();
      });
      
      expect(result.current.currentStep).toBe(1);
    });

    it('should not go below step 1', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.prevStep();
      });
      
      expect(result.current.currentStep).toBe(1);
    });

    it('should allow goToStep for previous steps', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      // Setup: go to step 3
      act(() => {
        result.current.updateDraft({ 
          name: 'Test',
          attributes: {
            conhecimento: 3, raciocinio: 4, corpo: 3, reflexos: 3,
            determinacao: 3, coordenacao: 3, carisma: 3, intuicao: 3,
          }
        });
      });
      
      act(() => {
        result.current.nextStep(); // 1 -> 2
      });
      
      act(() => {
        result.current.nextStep(); // 2 -> 3
      });
      
      expect(result.current.currentStep).toBe(3);
      
      // Go back to step 1
      act(() => {
        result.current.goToStep(1);
      });
      
      expect(result.current.currentStep).toBe(1);
    });
  });

  describe('Validation', () => {
    it('should validate step 1 - name required', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      const validation = result.current.validateStep(1);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should validate step 1 - valid when name provided', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({ name: 'Valid Name' });
      });
      
      const validation = result.current.validateStep(1);
      expect(validation.isValid).toBe(true);
    });

    it('should validate step 2 - total points', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      // Default is 8 points, need 25
      const validation = result.current.validateStep(2);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'attributes')).toBe(true);
    });

    it('should validate step 2 - valid with 25 points', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({
          attributes: {
            conhecimento: 3, raciocinio: 4, corpo: 3, reflexos: 3,
            determinacao: 3, coordenacao: 3, carisma: 3, intuicao: 3,
          }
        });
      });
      
      const validation = result.current.validateStep(2);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Calculations', () => {
    it('should calculate attribute total', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      // Default: 8 attributes x 1 = 8
      expect(result.current.getAttributeTotal()).toBe(8);
      
      act(() => {
        result.current.updateDraft({
          attributes: {
            conhecimento: 3, raciocinio: 3, corpo: 3, reflexos: 3,
            determinacao: 3, coordenacao: 3, carisma: 4, intuicao: 3,
          }
        });
      });
      
      expect(result.current.getAttributeTotal()).toBe(25);
    });

    it('should get skill points for attribute', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({
          attributes: {
            conhecimento: 4, raciocinio: 3, corpo: 3, reflexos: 3,
            determinacao: 3, coordenacao: 3, carisma: 3, intuicao: 3,
          }
        });
      });
      
      expect(result.current.getSkillPointsForAttribute('conhecimento')).toBe(4);
      expect(result.current.getSkillPointsForAttribute('raciocinio')).toBe(3);
    });

    it('should get used skill points', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      act(() => {
        result.current.updateDraft({
          skills: { ciencias: 2, linguas: 1, economia: 1 } // conhecimento skills
        });
      });
      
      expect(result.current.getUsedSkillPoints('conhecimento')).toBe(4);
    });
  });

  describe('Finalization', () => {
    it('should not finalize with invalid data', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      expect(result.current.canFinalize()).toBe(false);
      expect(result.current.finalizeCharacter()).toBeNull();
    });

    it('should report canFinalize correctly', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      // Setup valid character
      act(() => {
        result.current.updateDraft({
          name: 'Complete Hero',
          theme: 'tenebralux',
          factionId: 'anuire',
          attributes: {
            conhecimento: 3, raciocinio: 4, corpo: 3, reflexos: 3,
            determinacao: 3, coordenacao: 3, carisma: 3, intuicao: 3,
          },
          skills: {
            ciencias: 1, linguas: 1, economia: 1,
            engenharia: 1, pesquisa: 1, computacao: 1, logica: 1,
            resistencia: 1, potencia: 1, atletismo: 1,
            esquiva: 1, pilotagem: 1, luta: 1,
            resiliencia: 1, autocontrole: 1, sobrevivencia: 1,
            tiro: 1, laminas: 1, destreza: 1,
            persuasao: 1, enganacao: 1, performance: 1,
            percepcao: 1, empatia: 1, instinto: 1,
          },
          startingVirtue: 'coragem',
          virtues: { sabedoria: 0, coragem: 1, perseveranca: 0, harmonia: 0 },
        });
      });
      
      expect(result.current.canFinalize()).toBe(true);
    });
  });

  describe('setSimplifiedMode', () => {
    it('should toggle simplified mode', () => {
      const { result } = renderHook(() => useCharacterBuilder(), { wrapper: Wrapper });
      
      expect(result.current.isSimplifiedMode).toBe(false);
      
      act(() => {
        result.current.setSimplifiedMode(true);
      });
      
      expect(result.current.isSimplifiedMode).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should throw error when used outside provider', () => {
      // Render without wrapper
      expect(() => {
        renderHook(() => useCharacterBuilder());
      }).toThrow('useCharacterBuilder must be used within CharacterBuilderProvider');
    });
  });
});
