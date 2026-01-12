import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CharacterSheet } from '@/components/character-builder/CharacterSheet';
import { SavedCharacter } from '@/types/character-storage';
import { CharacterDraft } from '@/types/character-builder';
import { ThemeId } from '@/themes/types';
import { X, Download, FileText } from 'lucide-react';
import { useCharacterPDF } from '@/hooks/useCharacterPDF';

interface CharacterSheetDialogProps {
  character: SavedCharacter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CharacterSheetDialog({ 
  character, 
  open, 
  onOpenChange 
}: CharacterSheetDialogProps) {
  const { downloadPDF, isGenerating } = useCharacterPDF();

  if (!character) return null;

  // Usar os dados do personagem salvo
  const draft: CharacterDraft = {
    ...character.data,
    name: character.name,
    theme: character.theme as ThemeId,
    factionId: character.factionId,
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadPDF(draft, character.theme as ThemeId);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ficha de {character.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-4">
            <CharacterSheet 
              draft={draft} 
              theme={character.theme as ThemeId} 
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
