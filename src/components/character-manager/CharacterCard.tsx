import React from 'react';
import { SavedCharacter } from '@/types/character-storage';
import { getFactionById } from '@/data/character/factions';
import { BattleButton } from './BattleButton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Play, 
  Edit, 
  Copy, 
  Trash2,
  Sparkles,
  Swords,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CharacterCardProps {
  character: SavedCharacter;
  onContinue: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function CharacterCard({
  character,
  onContinue,
  onEdit,
  onDuplicate,
  onDelete,
}: CharacterCardProps) {
  const faction = getFactionById(character.factionId);
  const isAkashic = character.theme === 'akashic';

  return (
    <Card className={`bg-card border-l-4 overflow-hidden transition-shadow hover:shadow-lg ${
      isAkashic ? 'border-l-primary' : 'border-l-amber-500'
    }`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate text-foreground">
              {character.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {faction?.name || 'Sem facção'}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className={isAkashic 
            ? 'bg-primary/10 text-primary border-primary/30' 
            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
          }>
            {isAkashic ? (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Akashic
              </>
            ) : (
              <>
                <Swords className="w-3 h-3 mr-1" />
                Tenebra
              </>
            )}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Atualizado {formatDistanceToNow(new Date(character.updatedAt), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button onClick={onContinue} className="flex-1">
          <Play className="w-4 h-4 mr-2" />
          Continuar
        </Button>
        <BattleButton character={character} size="icon" />
      </CardFooter>
    </Card>
  );
}
