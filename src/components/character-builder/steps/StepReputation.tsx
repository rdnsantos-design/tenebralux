import React, { useState, useEffect } from 'react';
import { useCharacterBuilder } from '@/contexts/CharacterBuilderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FactionReputation } from '@/types/character-builder';
import { getDefaultReputations, getReputationLabel } from '@/data/character/reputationFactions';

export function StepReputation() {
  const { draft, updateDraft } = useCharacterBuilder();
  const [newFactionName, setNewFactionName] = useState('');
  
  // Inicializar reputações se não existirem
  useEffect(() => {
    if (!draft.reputations && draft.theme) {
      const defaultReputations = getDefaultReputations(draft.theme);
      updateDraft({ reputations: defaultReputations });
    }
  }, [draft.theme, draft.reputations, updateDraft]);

  const reputations = draft.reputations || [];

  const handleReputationChange = (factionId: string, newValue: number) => {
    const updated = reputations.map(rep => 
      rep.factionId === factionId ? { ...rep, value: newValue } : rep
    );
    updateDraft({ reputations: updated });
  };

  const handleAddFaction = () => {
    if (!newFactionName.trim()) return;
    
    const newReputation: FactionReputation = {
      factionId: `custom_${Date.now()}`,
      factionName: newFactionName.trim(),
      value: 0,
      isCustom: true,
    };
    
    updateDraft({ reputations: [...reputations, newReputation] });
    setNewFactionName('');
  };

  const handleRemoveFaction = (factionId: string) => {
    const updated = reputations.filter(rep => rep.factionId !== factionId);
    updateDraft({ reputations: updated });
  };

  const handleNameChange = (factionId: string, newName: string) => {
    const updated = reputations.map(rep => 
      rep.factionId === factionId ? { ...rep, factionName: newName } : rep
    );
    updateDraft({ reputations: updated });
  };

  const getValueIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Users className="w-12 h-12 text-primary mx-auto mb-2" />
        <h2 className="text-2xl font-bold">Reputação</h2>
        <p className="text-muted-foreground">
          Defina a relação do seu personagem com as facções e organizações do mundo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Facções e Organizações
          </CardTitle>
          <CardDescription>
            Valores de -6 (Inimigo Mortal) a +6 (Aliado Devotado)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {reputations.map((rep) => {
                const repLabel = getReputationLabel(rep.value);
                
                return (
                  <div 
                    key={rep.factionId}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      rep.value > 0 && "border-green-500/30 bg-green-500/5",
                      rep.value < 0 && "border-red-500/30 bg-red-500/5",
                      rep.value === 0 && "border-border bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        {getValueIcon(rep.value)}
                        {rep.isCustom ? (
                          <Input
                            value={rep.factionName}
                            onChange={(e) => handleNameChange(rep.factionId, e.target.value)}
                            className="max-w-[200px] h-8"
                          />
                        ) : (
                          <span className="font-medium">{rep.factionName}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={cn("min-w-[80px] justify-center", repLabel.color)}
                        >
                          {repLabel.label}
                        </Badge>
                        <span className={cn(
                          "text-xl font-bold min-w-[40px] text-right",
                          rep.value > 0 && "text-green-500",
                          rep.value < 0 && "text-red-500",
                          rep.value === 0 && "text-muted-foreground"
                        )}>
                          {rep.value > 0 ? `+${rep.value}` : rep.value}
                        </span>
                        {rep.isCustom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveFaction(rep.factionId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <Slider
                      value={[rep.value]}
                      onValueChange={(values) => handleReputationChange(rep.factionId, values[0])}
                      min={-6}
                      max={6}
                      step={1}
                      className="w-full"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>-6 Inimigo</span>
                      <span>0 Neutro</span>
                      <span>+6 Aliado</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <Separator className="my-4" />
          
          {/* Adicionar nova facção */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="newFaction" className="sr-only">Nova Facção</Label>
              <Input
                id="newFaction"
                placeholder="Nome da nova facção ou organização..."
                value={newFactionName}
                onChange={(e) => setNewFactionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFaction()}
              />
            </div>
            <Button onClick={handleAddFaction} disabled={!newFactionName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Resumo rápido */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">
                {reputations.filter(r => r.value > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Aliados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">
                {reputations.filter(r => r.value === 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Neutros</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">
                {reputations.filter(r => r.value < 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Inimigos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
