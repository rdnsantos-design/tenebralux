import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnitCard, ExperienceLevel, SpecialAbility } from "@/types/UnitCard";

import { CardRenderer } from '@/components/CardRenderer';
import { CardTemplate, CardData } from '@/types/CardTemplate';

interface CardEditorProps {
  card?: UnitCard | null;
  templates?: CardTemplate[];
  onSave: (card: UnitCard) => void;
  onCancel: () => void;
}

const specialAbilitiesDatabase: SpecialAbility[] = [
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

const experienceLimits = {
  'Green': 3,
  'Profissional': 4,
  'Veterano': 5,
  'Elite': 6
};

export const CardEditor: React.FC<CardEditorProps> = ({ 
  card, 
  templates = [], 
  onSave, 
  onCancel 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [unitData, setUnitData] = useState<UnitCard>({
    id: card?.id || '',
    name: card?.name || '',
    attack: card?.attack || 1,
    defense: card?.defense || 1,
    ranged: card?.ranged || 1,
    movement: card?.movement || 1,
    morale: card?.morale || 1,
    experience: card?.experience || 'Green',
    totalForce: card?.totalForce || 0,
    maintenanceCost: card?.maintenanceCost || 0,
    specialAbilities: card?.specialAbilities || [],
    currentPosture: card?.currentPosture || 'Ofensiva',
    normalPressure: card?.normalPressure || 0,
    permanentPressure: card?.permanentPressure || 0,
    hits: card?.hits || 0,
    disbanded: card?.disbanded || false,
    backgroundImage: card?.backgroundImage || ''
  });

  const [imageProcessing, setImageProcessing] = useState(false);

  const calculateTotalForce = useCallback(() => {
    const baseForce = unitData.attack + unitData.defense + unitData.ranged + unitData.movement + unitData.morale;
    const abilitiesBonus = unitData.specialAbilities.reduce((acc, ability) => {
      const foundAbility = specialAbilitiesDatabase.find(db => db.name === ability.name);
      return acc + (foundAbility?.cost || 0);
    }, 0);
    return Math.round(baseForce + abilitiesBonus);
  }, [unitData.attack, unitData.defense, unitData.ranged, unitData.movement, unitData.morale, unitData.specialAbilities]);

  useEffect(() => {
    const newTotalForce = calculateTotalForce();
    const newMaintenanceCost = Math.ceil(newTotalForce * 0.1);
    
    setUnitData(prev => ({
      ...prev,
      totalForce: newTotalForce,
      maintenanceCost: newMaintenanceCost
    }));
  }, [calculateTotalForce]);

  const handleAttributeChange = (attribute: keyof UnitCard, value: number | string) => {
    if (typeof value === 'number' && ['attack', 'defense', 'ranged', 'movement', 'morale'].includes(attribute)) {
      const maxValue = experienceLimits[unitData.experience as ExperienceLevel];
      value = Math.min(Math.max(value, 1), maxValue);
    }
    
    setUnitData(prev => ({ ...prev, [attribute]: value }));
  };

  const addSpecialAbility = (ability: SpecialAbility) => {
    if (unitData.specialAbilities.find(a => a.name === ability.name)) return;
    setUnitData(prev => ({
      ...prev,
      specialAbilities: [...prev.specialAbilities, ability]
    }));
  };

  const removeSpecialAbility = (abilityName: string) => {
    setUnitData(prev => ({
      ...prev,
      specialAbilities: prev.specialAbilities.filter(a => a.name !== abilityName)
    }));
  };

  const handleSave = () => {
    if (!unitData.name.trim()) return;
    
    const cardToSave = {
      ...unitData,
      id: card?.id || Date.now().toString()
    };
    
    onSave(cardToSave);
  };

  const convertToCardData = (unit: UnitCard): CardData => ({
    name: unit.name,
    number: unit.id,
    attack: unit.attack,
    defense: unit.defense,
    ranged: unit.ranged,
    movement: unit.movement,
    morale: unit.morale,
    experience: unit.experience,
    totalForce: unit.totalForce,
    maintenanceCost: unit.maintenanceCost,
    specialAbilities: unit.specialAbilities.map(a => a.name),
    currentPosture: unit.currentPosture || 'Ofensiva',
    normalPressure: unit.normalPressure || 0,
    permanentPressure: unit.permanentPressure || 0,
    hits: unit.hits || 0
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {card ? 'Editar Card' : 'Novo Card'}
            </h1>
            <p className="text-muted-foreground">
              {selectedTemplate ? `Usando template: ${selectedTemplate.name}` : 'Configure os atributos da unidade'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!unitData.name.trim()}>
              Salvar Card
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="space-y-6">
            {/* Seleção de Template */}
            {!card && templates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedTemplate(
                          selectedTemplate?.id === template.id ? null : template
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={template.templateImage}
                            alt={template.name}
                            className="w-16 h-16 object-contain border rounded"
                          />
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {template.fields.length} campos mapeados
                            </p>
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <div className="ml-auto text-primary">✓</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Unidade</Label>
                  <Input
                    id="name"
                    value={unitData.name}
                    onChange={(e) => handleAttributeChange('name', e.target.value)}
                    placeholder="Ex: Infantaria Pesada de Anuire"
                  />
                </div>
                
                <div>
                  <Label htmlFor="experience">Nível de Experiência</Label>
                  <Select 
                    value={unitData.experience} 
                    onValueChange={(value: ExperienceLevel) => handleAttributeChange('experience', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(experienceLimits).map(level => (
                        <SelectItem key={level} value={level}>
                          {level} (máx: {experienceLimits[level as ExperienceLevel]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Atributos */}
            <Card>
              <CardHeader>
                <CardTitle>Atributos (1-{experienceLimits[unitData.experience]})</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {[
                  { key: 'attack', label: 'Ataque', icon: '⚔️' },
                  { key: 'defense', label: 'Defesa', icon: '🛡️' },
                  { key: 'ranged', label: 'Tiro', icon: '🏹' },
                  { key: 'movement', label: 'Movimento', icon: '👟' },
                  { key: 'morale', label: 'Moral', icon: '💪' }
                ].map(({ key, label, icon }) => (
                  <div key={key}>
                    <Label htmlFor={key}>{icon} {label}</Label>
                    <Input
                      id={key}
                      type="number"
                      min="1"
                      max={experienceLimits[unitData.experience]}
                      value={unitData[key as keyof UnitCard] as number}
                      onChange={(e) => handleAttributeChange(key as keyof UnitCard, parseInt(e.target.value) || 1)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Força Total e Manutenção */}
            <Card>
              <CardHeader>
                <CardTitle>Força Total e Manutenção</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Força Total</Label>
                  <div className="text-2xl font-bold text-primary">{unitData.totalForce}</div>
                  <p className="text-sm text-muted-foreground">Calculado automaticamente</p>
                </div>
                <div>
                  <Label>Custo de Manutenção</Label>
                  <div className="text-2xl font-bold text-secondary">{unitData.maintenanceCost}</div>
                  <p className="text-sm text-muted-foreground">10% da força total</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview do Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview do Card</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="flex justify-center">
                    <CardRenderer
                      template={selectedTemplate}
                      data={convertToCardData(unitData)}
                      className="max-w-full"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <h3 className="text-lg font-medium mb-2">Preview do Card</h3>
                    <p className="text-muted-foreground mb-4">
                      {templates.length > 0 
                        ? 'Selecione um template para ver o preview' 
                        : 'Crie um template para visualizar o card'
                      }
                    </p>
                    <div className="text-sm space-y-1">
                      <div><strong>Nome:</strong> {unitData.name || 'Sem nome'}</div>
                      <div><strong>Força:</strong> {unitData.totalForce}</div>
                      <div><strong>Ataque:</strong> {unitData.attack} | <strong>Defesa:</strong> {unitData.defense}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};