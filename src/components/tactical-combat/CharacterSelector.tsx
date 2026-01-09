/**
 * Seletor de Personagem para Combate
 * Busca personagens do localStorage e/ou Supabase
 */

import { useState, useEffect } from 'react';
import { SavedCharacter } from '@/types/character-storage';
import { getAllCharacters } from '@/services/storage/characterStorage';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Swords, AlertCircle, Loader2 } from 'lucide-react';

interface CharacterSelectorProps {
  onSelect: (character: SavedCharacter) => void;
}

export function CharacterSelector({ onSelect }: CharacterSelectorProps) {
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCharacters() {
      setIsLoading(true);
      
      // Primeiro, tenta carregar do localStorage
      const localChars = getAllCharacters();
      
      // Depois, busca do Supabase
      try {
        const { data: cloudChars, error } = await supabase
          .from('characters')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar personagens da nuvem:', error);
          setCharacters(localChars);
        } else if (cloudChars && cloudChars.length > 0) {
          // Converte formato do Supabase para SavedCharacter
          const converted: SavedCharacter[] = cloudChars.map(c => ({
            id: c.id,
            name: c.name,
            theme: c.theme as 'akashic' | 'tenebralux',
            factionId: c.faction_id || '',
            cultureId: c.culture_id,
            createdAt: c.created_at || new Date().toISOString(),
            updatedAt: c.updated_at || new Date().toISOString(),
            data: c.data as any,
          }));
          
          // Mescla com locais (evita duplicatas por ID)
          const allIds = new Set(converted.map(c => c.id));
          const uniqueLocal = localChars.filter(c => !allIds.has(c.id));
          
          setCharacters([...converted, ...uniqueLocal]);
        } else {
          setCharacters(localChars);
        }
      } catch (err) {
        console.error('Erro ao carregar personagens:', err);
        setCharacters(localChars);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCharacters();
  }, []);

  const handleConfirm = () => {
    const selected = characters.find(c => c.id === selectedId);
    if (selected) {
      onSelect(selected);
    }
  };

  if (isLoading) {
    return (
      <Card className="text-center p-8">
        <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
        <h3 className="text-lg font-semibold">Carregando personagens...</h3>
      </Card>
    );
  }

  if (characters.length === 0) {
    return (
      <Card className="text-center p-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum Personagem Encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Crie um personagem no Character Builder primeiro.
        </p>
        <Button variant="outline" asChild>
          <a href="/character-builder">Ir para Character Builder</a>
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Selecionar Personagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {characters.map((char) => (
              <div
                key={char.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedId === char.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setSelectedId(char.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{char.data.name || 'Sem Nome'}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {char.data.culture || 'Sem Cultura'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {char.theme}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>Corpo: {char.data.attributes?.corpo || 0}</div>
                    <div>Reflexos: {char.data.attributes?.reflexos || 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button
          className="w-full"
          disabled={!selectedId}
          onClick={handleConfirm}
        >
          <Swords className="h-4 w-4 mr-2" />
          Iniciar Combate
        </Button>
      </CardContent>
    </Card>
  );
}
