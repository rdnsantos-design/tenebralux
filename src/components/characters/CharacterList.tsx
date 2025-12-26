import { CharacterCard, SystemConfig } from '@/types/CharacterCard';
import { CharacterCardPreview } from './CharacterCardPreview';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CharacterListProps {
  characters: CharacterCard[];
  config: SystemConfig;
  onEdit: (character: CharacterCard) => void;
  onDelete: (id: string) => void;
}

export function CharacterList({ characters, config, onEdit, onDelete }: CharacterListProps) {
  if (characters.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhum personagem criado ainda. Clique em "Novo Personagem" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {characters.map(character => (
        <div key={character.id} className="relative group">
          <CharacterCardPreview 
            character={character} 
            config={config}
            scale={0.9}
          />
          
          {/* Action buttons overlay */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(character)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir personagem?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O personagem "{character.name}" será excluído permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(character.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
