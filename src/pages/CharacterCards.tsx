import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Loader2, Crown } from 'lucide-react';
import { useCharacterCards } from '@/hooks/useCharacterCards';
import { CharacterCardEditor } from '@/components/characters/CharacterCardEditor';
import { CharacterList } from '@/components/characters/CharacterList';
import { SystemConfigurator } from '@/components/characters/SystemConfigurator';
import { AbilityLibrary } from '@/components/characters/AbilityLibrary';
import { RegentList } from '@/components/domains/RegentList';
import { CharacterCard } from '@/types/CharacterCard';

type ViewMode = 'list' | 'create' | 'edit';

export default function CharacterCards() {
  const navigate = useNavigate();
  const { 
    cards, abilities, config, loading,
    createCard, updateCard, deleteCard,
    createAbility, updateAbility, deleteAbility,
    updateConfig
  } = useCharacterCards();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterCard | null>(null);

  const handleNewCharacter = () => {
    setSelectedCharacter(null);
    setViewMode('create');
  };

  const handleEditCharacter = (character: CharacterCard) => {
    setSelectedCharacter(character);
    setViewMode('edit');
  };

  const handleSaveCharacter = async (data: Omit<CharacterCard, 'id' | 'created_at' | 'updated_at'>) => {
    if (viewMode === 'edit' && selectedCharacter) {
      await updateCard(selectedCharacter.id, data);
    } else {
      await createCard(data);
    }
    setViewMode('list');
    setSelectedCharacter(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedCharacter(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-background p-6">
        <CharacterCardEditor
          character={selectedCharacter || undefined}
          abilities={abilities}
          config={config}
          onSave={handleSaveCharacter}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Cartas de Personagem</h1>
              <p className="text-muted-foreground">Sistema Tenebra Lux</p>
            </div>
          </div>
          <Button onClick={handleNewCharacter}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Personagem
          </Button>
        </div>

        <Tabs defaultValue="characters" className="space-y-6">
          <TabsList>
            <TabsTrigger value="characters">Personagens</TabsTrigger>
            <TabsTrigger value="regents" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Regentes
            </TabsTrigger>
            <TabsTrigger value="abilities">Habilidades</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
          </TabsList>

          <TabsContent value="characters">
            <CharacterList
              characters={cards}
              config={config}
              onEdit={handleEditCharacter}
              onDelete={deleteCard}
            />
          </TabsContent>

          <TabsContent value="regents">
            <RegentList />
          </TabsContent>

          <TabsContent value="abilities">
            <AbilityLibrary
              abilities={abilities}
              config={config}
              onCreateAbility={createAbility}
              onUpdateAbility={updateAbility}
              onDeleteAbility={deleteAbility}
            />
          </TabsContent>

          <TabsContent value="config">
            <SystemConfigurator
              config={config}
              onUpdateConfig={updateConfig}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
