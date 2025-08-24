import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SpecialAbility } from "@/types/UnitCard";
import { Plus, Edit, Trash2, Settings } from "lucide-react";

const DEFAULT_ABILITIES: SpecialAbility[] = [
  { id: '1', name: 'Batedor', level: 1, cost: 1, description: 'Ignora penalidade de terreno difícil' },
  { id: '2', name: 'Murada', level: 1, cost: 1, description: '+1 Defesa contra ataque à distância' },
  { id: '3', name: 'Disciplinada', level: 1, cost: 1, description: 'Ignora 1 ponto de pressão por rodada' },
  { id: '4', name: 'Emboscada', level: 1, cost: 1, description: 'Causa +1 hit se atacar de floresta ou colina' },
  { id: '5', name: 'Firme', level: 1, cost: 1, description: 'Nunca sofre dano extra de flanco' },
  { id: '6', name: 'Atiradores Precisos', level: 1, cost: 1, description: 'Alcance +6 hexágonos com tiro' },
  { id: '7', name: 'Carga Devastadora', level: 2, cost: 2, description: 'Ao se mover 12+ hexágonos, +1 hit no impacto' },
  { id: '8', name: 'Formação Impecável', level: 2, cost: 2, description: 'Remove até 2 pontos de pressão ao reorganizar' },
  { id: '9', name: 'Moral de Ferro', level: 2, cost: 2, description: 'Dificuldade de moral reduzida para 12' },
  { id: '10', name: 'Comando Avançado', level: 2, cost: 2, description: 'Reorganiza unidade desbandada a 2 hex de distância' },
];

interface SpecialAbilitiesManagerProps {
  selectedAbilities: SpecialAbility[];
  onAbilitiesChange: (abilities: SpecialAbility[]) => void;
  maxAbilities?: number;
}

export const SpecialAbilitiesManager: React.FC<SpecialAbilitiesManagerProps> = ({
  selectedAbilities,
  onAbilitiesChange,
  maxAbilities = 5
}) => {
  const [availableAbilities, setAvailableAbilities] = useState<SpecialAbility[]>([]);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [editingAbility, setEditingAbility] = useState<SpecialAbility | null>(null);
  const [newAbility, setNewAbility] = useState<Partial<SpecialAbility>>({
    name: '',
    level: 1,
    cost: 1,
    description: ''
  });

  // Carrega habilidades do localStorage ou usa padrões
  useEffect(() => {
    const stored = localStorage.getItem('special-abilities');
    if (stored) {
      try {
        setAvailableAbilities(JSON.parse(stored));
      } catch {
        setAvailableAbilities(DEFAULT_ABILITIES);
      }
    } else {
      setAvailableAbilities(DEFAULT_ABILITIES);
    }
  }, []);

  // Salva habilidades no localStorage
  const saveAbilities = (abilities: SpecialAbility[]) => {
    setAvailableAbilities(abilities);
    localStorage.setItem('special-abilities', JSON.stringify(abilities));
  };

  const addSpecialAbility = (ability: SpecialAbility) => {
    if (selectedAbilities.find(a => a.id === ability.id) || selectedAbilities.length >= maxAbilities) return;
    onAbilitiesChange([...selectedAbilities, ability]);
  };

  const removeSpecialAbility = (abilityId: string) => {
    onAbilitiesChange(selectedAbilities.filter(a => a.id !== abilityId));
  };

  const handleCreateAbility = () => {
    if (!newAbility.name?.trim() || !newAbility.description?.trim()) return;
    
    const ability: SpecialAbility = {
      id: Date.now().toString(),
      name: newAbility.name.trim(),
      level: newAbility.level || 1,
      cost: newAbility.cost || 1,
      description: newAbility.description.trim()
    };

    saveAbilities([...availableAbilities, ability]);
    setNewAbility({ name: '', level: 1, cost: 1, description: '' });
  };

  const handleEditAbility = (ability: SpecialAbility) => {
    if (!ability.name.trim() || !ability.description.trim()) return;
    
    const updatedAbilities = availableAbilities.map(a => 
      a.id === ability.id ? ability : a
    );
    saveAbilities(updatedAbilities);
    
    // Atualiza também nas habilidades selecionadas se existir
    const updatedSelected = selectedAbilities.map(a => 
      a.id === ability.id ? ability : a
    );
    onAbilitiesChange(updatedSelected);
    
    setEditingAbility(null);
  };

  const handleDeleteAbility = (abilityId: string) => {
    const updatedAbilities = availableAbilities.filter(a => a.id !== abilityId);
    saveAbilities(updatedAbilities);
    
    // Remove também das selecionadas se existir
    const updatedSelected = selectedAbilities.filter(a => a.id !== abilityId);
    onAbilitiesChange(updatedSelected);
  };

  const resetToDefaults = () => {
    saveAbilities(DEFAULT_ABILITIES);
    // Remove habilidades selecionadas que não existem mais nos padrões
    const validSelected = selectedAbilities.filter(selected => 
      DEFAULT_ABILITIES.find(def => def.id === selected.id)
    );
    onAbilitiesChange(validSelected);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Habilidades Especiais (máx {maxAbilities})</CardTitle>
          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gerenciar Habilidades Especiais</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Criar Nova Habilidade */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Criar Nova Habilidade</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={newAbility.name || ''}
                          onChange={(e) => setNewAbility(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome da habilidade"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Nível</Label>
                          <Select 
                            value={newAbility.level?.toString()} 
                            onValueChange={(value) => setNewAbility(prev => ({ ...prev, level: parseInt(value) as 1 | 2 }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Nível 1</SelectItem>
                              <SelectItem value="2">Nível 2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Custo</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={newAbility.cost || 1}
                            onChange={(e) => setNewAbility(prev => ({ ...prev, cost: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={newAbility.description || ''}
                        onChange={(e) => setNewAbility(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrição do efeito da habilidade"
                        rows={2}
                      />
                    </div>
                    <Button 
                      onClick={handleCreateAbility}
                      disabled={!newAbility.name?.trim() || !newAbility.description?.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Habilidade
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de Habilidades */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Habilidades Disponíveis ({availableAbilities.length})</CardTitle>
                      <Button variant="outline" size="sm" onClick={resetToDefaults}>
                        Restaurar Padrões
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableAbilities.map((ability) => (
                        <div key={ability.id} className="border rounded-lg p-3">
                          {editingAbility?.id === ability.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={editingAbility.name}
                                  onChange={(e) => setEditingAbility(prev => prev ? { ...prev, name: e.target.value } : null)}
                                />
                                <div className="grid grid-cols-2 gap-1">
                                  <Select 
                                    value={editingAbility.level.toString()} 
                                    onValueChange={(value) => setEditingAbility(prev => prev ? { ...prev, level: parseInt(value) as 1 | 2 } : null)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">Nível 1</SelectItem>
                                      <SelectItem value="2">Nível 2</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={editingAbility.cost}
                                    onChange={(e) => setEditingAbility(prev => prev ? { ...prev, cost: parseInt(e.target.value) || 1 } : null)}
                                  />
                                </div>
                              </div>
                              <Textarea
                                value={editingAbility.description}
                                onChange={(e) => setEditingAbility(prev => prev ? { ...prev, description: e.target.value } : null)}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleEditAbility(editingAbility)}>
                                  Salvar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingAbility(null)}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{ability.name}</span>
                                  <span className="text-xs bg-muted px-2 py-1 rounded">
                                    Nível {ability.level}
                                  </span>
                                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                    Custo: {ability.cost}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{ability.description}</p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingAbility(ability)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteAbility(ability.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Habilidades Selecionadas ({selectedAbilities.length}/{maxAbilities})</Label>
          {selectedAbilities.length > 0 ? (
            <div className="space-y-2">
              {selectedAbilities.map((ability) => (
                <div key={ability.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{ability.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (Nível {ability.level}, Custo: {ability.cost})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpecialAbility(ability.id)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma habilidade selecionada</p>
          )}
        </div>
        
        <div>
          <Label>Adicionar Habilidade</Label>
          <Select 
            onValueChange={(abilityId) => {
              const ability = availableAbilities.find(a => a.id === abilityId);
              if (ability) {
                addSpecialAbility(ability);
              }
            }}
            disabled={selectedAbilities.length >= maxAbilities}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma habilidade" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background border">
              {availableAbilities
                .filter(ability => !selectedAbilities.find(a => a.id === ability.id))
                .map(ability => (
                  <SelectItem key={ability.id} value={ability.id}>
                    {ability.name} (Nível {ability.level}) - {ability.description}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};