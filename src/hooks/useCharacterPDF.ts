/**
 * Hook for generating and downloading character PDFs
 */

import { useState, useCallback } from 'react';
import { CharacterDraft } from '@/types/character-builder';
import { 
  generateCharacterPDF, 
  downloadCharacterPDF, 
  getCharacterPDFBlob 
} from '@/services/pdf/characterSheetPDF';

interface UseCharacterPDFReturn {
  isGenerating: boolean;
  error: string | null;
  downloadPDF: (character: CharacterDraft, theme: 'akashic' | 'tenebralux') => Promise<void>;
  getPDFBlob: (character: CharacterDraft, theme: 'akashic' | 'tenebralux') => Promise<Blob>;
  previewPDF: (character: CharacterDraft, theme: 'akashic' | 'tenebralux') => void;
}

export function useCharacterPDF(): UseCharacterPDFReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCharacter = useCallback((character: CharacterDraft): void => {
    if (!character.name || character.name.trim() === '') {
      throw new Error('Personagem precisa ter um nome para gerar PDF');
    }
  }, []);

  const downloadPDF = useCallback(async (
    character: CharacterDraft, 
    theme: 'akashic' | 'tenebralux'
  ): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      validateCharacter(character);
      downloadCharacterPDF(character, theme);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar PDF';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [validateCharacter]);

  const getPDFBlob = useCallback(async (
    character: CharacterDraft, 
    theme: 'akashic' | 'tenebralux'
  ): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      validateCharacter(character);
      return getCharacterPDFBlob(character, theme);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar PDF';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [validateCharacter]);

  const previewPDF = useCallback((
    character: CharacterDraft, 
    theme: 'akashic' | 'tenebralux'
  ): void => {
    setError(null);
    
    try {
      const doc = generateCharacterPDF(character, { theme });
      const url = doc.output('bloburl');
      window.open(url as unknown as string, '_blank');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao visualizar PDF';
      setError(message);
    }
  }, []);

  return {
    isGenerating,
    error,
    downloadPDF,
    getPDFBlob,
    previewPDF,
  };
}
