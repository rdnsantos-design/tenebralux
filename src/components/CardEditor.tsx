import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnitCard, ExperienceLevel, SpecialAbility } from "@/types/UnitCard";
import { SpecialAbilitiesManager } from "@/components/SpecialAbilitiesManager";
import { CardRenderer } from '@/components/CardRenderer';
import { CardTemplate, CardData } from '@/types/CardTemplate';
import { ExcelImport } from '@/types/ExcelImport';

interface CardEditorProps {
  card?: UnitCard | null;
  templates?: CardTemplate[];
  importedUnits?: UnitCard[];
  onSave: (card: UnitCard) => void;
  onCancel: () => void;
}

const experienceLimits = {
  'Amador': 2,
  'Recruta': 3,
  'Profissional': 4,
  'Veterano': 5,
  'Elite': 6,
  'Lendário': 7
};

const experienceModifiers = {
  'Amador': { moral: -2, points: 0 },
  'Recruta': { moral: -1, points: -1 }, // Remove 1 ponto
  'Profissional': { moral: 0, points: 2 },
  'Veterano': { moral: 1, points: 4 },
  'Elite': { moral: 2, points: 6 },
  'Lendário': { moral: 3, points: 8 }
};

export const CardEditor: React.FC<CardEditorProps> = ({ 
  card, 
  templates = [],
  importedUnits = [],
  onSave, 
  onCancel 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [selectedSkin, setSelectedSkin] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<Array<{id: string, name: string, importName: string} & UnitCard>>([]);
  const [baseAttributes, setBaseAttributes] = useState({
    attack: card?.attack || 1,
    defense: card?.defense || 1,
    ranged: card?.ranged || 1,
    movement: card?.movement || 1,
    morale: card?.morale || 1
  });
  const [availablePoints, setAvailablePoints] = useState(0);
  const [unitData, setUnitData] = useState<UnitCard>({
    id: card?.id || '',
    name: card?.name || '',
    attack: card?.attack || 1,
    defense: card?.defense || 1,
    ranged: card?.ranged || 1,
    movement: card?.movement || 1,
    morale: card?.morale || 1,
    experience: card?.experience || 'Profissional',
    totalForce: card?.totalForce || 0,
    maintenanceCost: card?.maintenanceCost || 0,
    specialAbilities: card?.specialAbilities || [],
    backgroundImage: card?.backgroundImage || '',
    customBackgroundImage: card?.customBackgroundImage || ''
  });

  const [imageProcessing, setImageProcessing] = useState(false);

  // Carregar unidades das importações salvas
  useEffect(() => {
    const savedImports = localStorage.getItem('excelImports');
    if (savedImports) {
      try {
        const imports: ExcelImport[] = JSON.parse(savedImports);
        const allUnits: Array<{id: string, name: string, importName: string} & UnitCard> = [];
        
        imports.forEach(importData => {
          importData.units.forEach((unit, index) => {
            const unitCard: UnitCard = {
              id: `${importData.id}-${index}`,
              name: unit.name,
              attack: unit.attack,
              defense: unit.defense,
              ranged: unit.ranged,
              movement: unit.movement,
              morale: unit.morale,
              experience: 'Profissional',
              totalForce: unit.attack + unit.defense + unit.ranged + unit.movement + unit.morale,
              maintenanceCost: Math.ceil((unit.attack + unit.defense + unit.ranged + unit.movement + unit.morale) * 0.1),
              specialAbilities: [],
              backgroundImage: ''
            };
            
            allUnits.push({
              ...unitCard,
              importName: importData.fileName
            });
          });
        });
        
        setAvailableUnits(allUnits);
      } catch (error) {
        console.error('Erro ao carregar importações:', error);
      }
    }
  }, []);

  const calculateTotalForce = useCallback(() => {
    const baseForce = unitData.attack + unitData.defense + unitData.ranged + unitData.movement + unitData.morale;
    const abilitiesBonus = unitData.specialAbilities.reduce((acc, ability) => {
      return acc + ability.cost;
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

  // Aplicar modificadores de experiência
  useEffect(() => {
    const modifier = experienceModifiers[unitData.experience as ExperienceLevel];
    const adjustedMorale = Math.max(1, baseAttributes.morale + modifier.moral);
    
    setUnitData(prev => ({
      ...prev,
      morale: adjustedMorale
    }));
    
    setAvailablePoints(modifier.points);
  }, [unitData.experience, baseAttributes.morale]);

  const handleAttributeChange = (attribute: keyof UnitCard, value: number | string) => {
    if (attribute === 'experience') {
      setUnitData(prev => ({ ...prev, [attribute]: value as ExperienceLevel }));
      return;
    }
    
    if (typeof value === 'number' && ['attack', 'defense', 'ranged', 'movement', 'morale'].includes(attribute)) {
      const maxValue = experienceLimits[unitData.experience as ExperienceLevel];
      value = Math.min(Math.max(value, 1), maxValue);
      
      // Criar nova versão temporária dos dados para calcular pontos
      const tempUnitData = { ...unitData, [attribute]: value };
      
      // Calcular pontos totais que seriam usados
      const currentTotal = tempUnitData.attack + tempUnitData.defense + tempUnitData.ranged + tempUnitData.movement;
      const baseTotal = baseAttributes.attack + baseAttributes.defense + baseAttributes.ranged + baseAttributes.movement;
      const attributePoints = currentTotal - baseTotal;
      
      // Pontos gastos em moral (além do bônus de experiência)
      const modifier = experienceModifiers[unitData.experience as ExperienceLevel];
      const baseMoraleWithBonus = Math.max(1, baseAttributes.morale + modifier.moral);
      const moralePoints = Math.max(0, tempUnitData.morale - baseMoraleWithBonus);
      
      // Pontos gastos em habilidades especiais
      const abilityPoints = unitData.specialAbilities.reduce((total, ability) => total + ability.level, 0);
      
      const totalPointsUsed = attributePoints + moralePoints + abilityPoints;
      
      // Verificar se há pontos suficientes
      if (totalPointsUsed > availablePoints) {
        return; // Não permite gastar mais pontos do que disponível
      }
      
      setUnitData(prev => ({ ...prev, [attribute]: value }));
    } else if (attribute === 'name') {
      setUnitData(prev => ({ ...prev, [attribute]: value as string }));
    }
  };

  const getUsedPoints = () => {
    const currentTotal = unitData.attack + unitData.defense + unitData.ranged + unitData.movement;
    const baseTotal = baseAttributes.attack + baseAttributes.defense + baseAttributes.ranged + baseAttributes.movement;
    
    // Pontos gastos em atributos
    const attributePoints = currentTotal - baseTotal;
    
    // Pontos gastos em moral (além do bônus de experiência)
    const modifier = experienceModifiers[unitData.experience as ExperienceLevel];
    const baseMoraleWithBonus = Math.max(1, baseAttributes.morale + modifier.moral);
    const moralePoints = Math.max(0, unitData.morale - baseMoraleWithBonus);
    
    // Pontos gastos em habilidades especiais
    const abilityPoints = unitData.specialAbilities.reduce((total, ability) => total + ability.level, 0);
    
    return attributePoints + moralePoints + abilityPoints;
  };

  const handleSpecialAbilitiesChange = (abilities: SpecialAbility[]) => {
    // Verificar se há pontos suficientes para as habilidades
    const abilityPoints = abilities.reduce((total, ability) => total + ability.level, 0);
    
    // Calcular pontos já usados em outros atributos
    const currentTotal = unitData.attack + unitData.defense + unitData.ranged + unitData.movement;
    const baseTotal = baseAttributes.attack + baseAttributes.defense + baseAttributes.ranged + baseAttributes.movement;
    const attributePoints = currentTotal - baseTotal;
    
    const modifier = experienceModifiers[unitData.experience as ExperienceLevel];
    const baseMoraleWithBonus = Math.max(1, baseAttributes.morale + modifier.moral);
    const moralePoints = Math.max(0, unitData.morale - baseMoraleWithBonus);
    
    const totalPointsUsed = attributePoints + moralePoints + abilityPoints;
    
    if (totalPointsUsed <= availablePoints) {
      setUnitData(prev => ({
        ...prev,
        specialAbilities: abilities
      }));
    }
  };

  const handleSkinUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const skinUrl = e.target?.result as string;
        setSelectedSkin(skinUrl);
        setUnitData(prev => ({ ...prev, customBackgroundImage: skinUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!unitData.name.trim()) return;
    
    const cardToSave = {
      ...unitData,
      id: card?.id || Date.now().toString(),
      templateId: selectedTemplate?.id,
      customBackgroundImage: selectedSkin || unitData.customBackgroundImage
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
    currentPosture: 'Ofensiva',
    normalPressure: 0,
    permanentPressure: 0,
    hits: 0
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
            
            {/* Selecionar Unidade Importada */}
            {!card && (
              <Card>
                <CardHeader>
                  <CardTitle>1. Selecionar Unidade Base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableUnits.length > 0 ? (
                    <>
                      <div>
                        <Label htmlFor="importedUnit">Escolher Unidade da Planilha</Label>
                        <Select 
                          value=""
                          onValueChange={(value) => {
                            const selectedUnit = availableUnits.find(unit => unit.id === value);
                            if (selectedUnit) {
                              const newBaseAttributes = {
                                attack: selectedUnit.attack,
                                defense: selectedUnit.defense,
                                ranged: selectedUnit.ranged,
                                movement: selectedUnit.movement,
                                morale: selectedUnit.morale
                              };
                              setBaseAttributes(newBaseAttributes);
                              setUnitData({
                                id: card?.id || '',
                                name: selectedUnit.name,
                                attack: selectedUnit.attack,
                                defense: selectedUnit.defense,
                                ranged: selectedUnit.ranged,
                                movement: selectedUnit.movement,
                                morale: selectedUnit.morale,
                                experience: 'Profissional',
                                totalForce: selectedUnit.totalForce,
                                maintenanceCost: selectedUnit.maintenanceCost,
                                specialAbilities: selectedUnit.specialAbilities || [],
                                backgroundImage: selectedUnit.backgroundImage || '',
                                customBackgroundImage: selectedUnit.customBackgroundImage || ''
                              });
                              setAvailablePoints(experienceModifiers['Profissional'].points);
                            }
                          }}
                        >
                          <SelectTrigger className="bg-background border">
                            <SelectValue placeholder="Escolher unidade..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50 shadow-lg">
                            {availableUnits.map(unit => (
                              <SelectItem key={unit.id} value={unit.id} className="hover:bg-accent cursor-pointer">
                                {unit.name} ({unit.importName} - Força: {unit.totalForce})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Selecione uma unidade como base e depois ajuste a experiência e distribua pontos
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <p className="text-muted-foreground mb-2">Nenhuma unidade importada encontrada</p>
                      <p className="text-sm text-muted-foreground">
                        Vá para "Gerenciar Excel" para importar planilhas com unidades, ou preencha manualmente os campos abaixo
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>2. Informações Básicas</CardTitle>
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
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      {Object.keys(experienceLimits).map(level => (
                        <SelectItem key={level} value={level} className="hover:bg-accent">
                          {level} (máx: {experienceLimits[level as ExperienceLevel]}) - Moral: {experienceModifiers[level as ExperienceLevel].moral >= 0 ? '+' : ''}{experienceModifiers[level as ExperienceLevel].moral}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pontos para Distribuir */}
            <Card>
              <CardHeader>
                <CardTitle>3. Pontos para Distribuir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pontos Disponíveis</Label>
                    <div className="text-2xl font-bold text-primary">{availablePoints}</div>
                  </div>
                  <div>
                    <Label>Pontos Usados</Label>
                    <div className="text-2xl font-bold text-secondary">{getUsedPoints()}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Distribua os pontos nos atributos, moral e habilidades especiais
                </p>
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
                  { key: 'movement', label: 'Movimento', icon: '👟' }
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
                
                {/* Moral - editável com pontos */}
                <div className="col-span-2">
                  <Label htmlFor="morale">💪 Moral</Label>
                  <Input
                    id="morale"
                    type="number"
                    min="1"
                    max={experienceLimits[unitData.experience]}
                    value={unitData.morale}
                    onChange={(e) => handleAttributeChange('morale', parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Base: {baseAttributes.morale} + Experiência: {experienceModifiers[unitData.experience as ExperienceLevel].moral} + Pontos extras: {Math.max(0, unitData.morale - Math.max(1, baseAttributes.morale + experienceModifiers[unitData.experience as ExperienceLevel].moral))}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Habilidades Especiais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">4. Habilidades Especiais</h3>
              <p className="text-sm text-muted-foreground">
                Habilidade Nível 1 = 1 ponto | Habilidade Nível 2 = 2 pontos
              </p>
              <SpecialAbilitiesManager
                selectedAbilities={unitData.specialAbilities}
                onAbilitiesChange={handleSpecialAbilitiesChange}
                maxAbilities={5}
              />
            </div>

            {/* Seleção de Skin */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>🎨 Personalizar Visual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customSkin">Imagem de Fundo Personalizada</Label>
                    <Input
                      id="customSkin"
                      type="file"
                      accept="image/*"
                      onChange={handleSkinUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Carregue uma imagem com as mesmas proporções do template ({selectedTemplate.width}x{selectedTemplate.height}px)
                    </p>
                  </div>
                  
                  {/* Skins Predefinidas */}
                  {selectedTemplate.availableSkins && selectedTemplate.availableSkins.length > 0 && (
                    <div>
                      <Label>Skins Predefinidas</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          type="button"
                          className={`p-2 border rounded-lg hover:border-primary transition-colors ${
                            !selectedSkin ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                          onClick={() => {
                            setSelectedSkin('');
                            setUnitData(prev => ({ ...prev, customBackgroundImage: '' }));
                          }}
                        >
                          <img
                            src={selectedTemplate.templateImage}
                            alt="Original"
                            className="w-full h-16 object-cover rounded"
                          />
                          <p className="text-xs mt-1">Original</p>
                        </button>
                        
                        {selectedTemplate.availableSkins.map((skinUrl, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`p-2 border rounded-lg hover:border-primary transition-colors ${
                              selectedSkin === skinUrl ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => {
                              setSelectedSkin(skinUrl);
                              setUnitData(prev => ({ ...prev, customBackgroundImage: skinUrl }));
                            }}
                          >
                            <img
                              src={skinUrl}
                              alt={`Skin ${index + 1}`}
                              className="w-full h-16 object-cover rounded"
                            />
                            <p className="text-xs mt-1">Skin {index + 1}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                      customBackgroundImage={selectedSkin || unitData.customBackgroundImage}
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