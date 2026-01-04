import { useState, useCallback } from 'react';
import { CharacterDraft } from '@/types/character-builder';
import { TacticalUnit, CombatCard, ConversionOptions, ConversionResult } from '@/types/character-tactical';
import {
  convertCharacterToUnit,
  convertTeamToTactical,
  validateCharacterForBattle,
} from '@/services/tactical/characterConverter';
import { useCharacterStorage } from '@/hooks/useCharacterStorage';
import { useNavigate } from 'react-router-dom';

interface UseTacticalIntegrationReturn {
  // Estado
  isConverting: boolean;
  lastResult: ConversionResult | null;
  errors: string[];

  // Ações
  prepareForBattle: (characterId: string, options?: ConversionOptions) => Promise<ConversionResult | null>;
  prepareTeam: (characterIds: string[], commanderId?: string) => Promise<{
    units: TacticalUnit[];
    cards: CombatCard[];
    commander?: TacticalUnit;
    warnings: string[];
  } | null>;
  validateCharacter: (characterId: string) => { valid: boolean; errors: string[] };
  
  // Navegação
  goToBattle: (units: TacticalUnit[], cards: CombatCard[]) => void;
}

export function useTacticalIntegration(): UseTacticalIntegrationReturn {
  const [isConverting, setIsConverting] = useState(false);
  const [lastResult, setLastResult] = useState<ConversionResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  const { getCharacter } = useCharacterStorage();
  const navigate = useNavigate();

  const prepareForBattle = useCallback(async (
    characterId: string,
    options?: ConversionOptions
  ): Promise<ConversionResult | null> => {
    setIsConverting(true);
    setErrors([]);

    try {
      const saved = getCharacter(characterId);
      if (!saved) {
        throw new Error('Personagem não encontrado');
      }

      const character = saved.data;
      
      // Validar
      const validation = validateCharacterForBattle(character);
      if (!validation.valid) {
        setErrors(validation.errors);
        return null;
      }

      // Converter
      const result = convertCharacterToUnit(character, options);
      setLastResult(result);

      if (result.warnings.length > 0) {
        console.warn('Conversion warnings:', result.warnings);
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro na conversão';
      setErrors([message]);
      return null;
    } finally {
      setIsConverting(false);
    }
  }, [getCharacter]);

  const prepareTeam = useCallback(async (
    characterIds: string[],
    commanderId?: string
  ) => {
    setIsConverting(true);
    setErrors([]);

    try {
      const characters: (CharacterDraft & { id: string })[] = [];
      const validationErrors: string[] = [];

      for (const id of characterIds) {
        const saved = getCharacter(id);
        if (!saved) {
          throw new Error(`Personagem ${id} não encontrado`);
        }
        
        // Validar cada personagem
        const validation = validateCharacterForBattle(saved.data);
        if (!validation.valid) {
          validationErrors.push(...validation.errors.map(e => `${saved.name}: ${e}`));
        }
        
        characters.push({ ...saved.data, id });
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return null;
      }

      // Converter time
      const result = convertTeamToTactical(characters, commanderId, 'player');

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro na conversão do time';
      setErrors([message]);
      return null;
    } finally {
      setIsConverting(false);
    }
  }, [getCharacter]);

  const validateCharacter = useCallback((characterId: string) => {
    const saved = getCharacter(characterId);
    if (!saved) {
      return { valid: false, errors: ['Personagem não encontrado'] };
    }
    return validateCharacterForBattle(saved.data);
  }, [getCharacter]);

  const goToBattle = useCallback((units: TacticalUnit[], cards: CombatCard[]) => {
    // Salvar no sessionStorage para a página de batalha recuperar
    sessionStorage.setItem('battle_units', JSON.stringify(units));
    sessionStorage.setItem('battle_cards', JSON.stringify(cards));

    // Navegar para página de batalha tática
    navigate('/tactical');
  }, [navigate]);

  return {
    isConverting,
    lastResult,
    errors,
    prepareForBattle,
    prepareTeam,
    validateCharacter,
    goToBattle,
  };
}
