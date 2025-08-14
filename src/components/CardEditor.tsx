import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { UnitCard, ExperienceLevel, SpecialAbility } from "@/types/UnitCard";

interface CardEditorProps {
  card?: UnitCard | null;
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

export const CardEditor = ({ card, onSave, onCancel }: CardEditorProps) => {
  const [formData, setFormData] = useState<UnitCard>({
    id: card?.id || '',
    name: card?.name || '',
    attack: card?.attack || 2,
    defense: card?.defense || 2,
    ranged: card?.ranged || 0,
    movement: card?.movement || 2,
    morale: card?.morale || 2,
    experience: card?.experience || 'Green',
    totalForce: card?.totalForce || 0,
    maintenanceCost: card?.maintenanceCost || 0,
    specialAbilities: card?.specialAbilities || [],
    backgroundImage: card?.backgroundImage || '',
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, backgroundImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotalForce = () => {
    const baseForce = formData.attack + formData.defense + (formData.ranged * 0.5) + formData.morale;
    const abilityCost = formData.specialAbilities.reduce((sum, ability) => sum + ability.cost, 0);
    return Math.round(baseForce + abilityCost);
  };

  useEffect(() => {
    const totalForce = calculateTotalForce();
    const maintenanceCost = Math.ceil(totalForce * 0.1);
    setFormData(prev => ({ ...prev, totalForce, maintenanceCost }));
  }, [formData.attack, formData.defense, formData.ranged, formData.morale, formData.specialAbilities]);

  const handleSave = () => {
    onSave(formData);
  };

  const handleAttributeChange = (attr: keyof UnitCard, value: number) => {
    const maxValue = experienceLimits[formData.experience];
    const clampedValue = Math.max(0, Math.min(value, maxValue));
    setFormData(prev => ({ ...prev, [attr]: clampedValue }));
  };

  const addSpecialAbility = (abilityId: string) => {
    const ability = specialAbilitiesDatabase.find(a => a.id === abilityId);
    if (ability && !formData.specialAbilities.find(a => a.id === abilityId)) {
      setFormData(prev => ({
        ...prev,
        specialAbilities: [...prev.specialAbilities, ability]
      }));
    }
  };

  const removeSpecialAbility = (abilityId: string) => {
    setFormData(prev => ({
      ...prev,
      specialAbilities: prev.specialAbilities.filter(a => a.id !== abilityId)
    }));
  };

  const availableAbilities = specialAbilitiesDatabase.filter(
    ability => !formData.specialAbilities.find(selected => selected.id === ability.id)
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">
            {card ? 'Editar Card' : 'Novo Card'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Unidade</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Infantaria Pesada Khinasi"
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Nível de Experiência</Label>
                  <Select 
                    value={formData.experience} 
                    onValueChange={(value: ExperienceLevel) => 
                      setFormData(prev => ({ ...prev, experience: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Green">Green (máx 3)</SelectItem>
                      <SelectItem value="Profissional">Profissional (máx 4)</SelectItem>
                      <SelectItem value="Veterano">Veterano (máx 5)</SelectItem>
                      <SelectItem value="Elite">Elite (máx 6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundImage">Imagem de Fundo</Label>
                  <div className="space-y-2">
                    <Input
                      id="backgroundImage"
                      value={formData.backgroundImage}
                      onChange={(e) => setFormData(prev => ({ ...prev, backgroundImage: e.target.value }))}
                      placeholder="Cole a URL da imagem aqui"
                    />
                    <div className="text-center text-sm text-muted-foreground">ou</div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="flex-1"
                      />
                      {formData.backgroundImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, backgroundImage: '' }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {formData.backgroundImage && (
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">Preview:</div>
                        <div 
                          className="w-full h-20 bg-cover bg-center rounded border"
                          style={{ backgroundImage: `url(${formData.backgroundImage})` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atributos (1-{experienceLimits[formData.experience]})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="attack">Ataque</Label>
                    <Input
                      id="attack"
                      type="number"
                      min="1"
                      max={experienceLimits[formData.experience]}
                      value={formData.attack}
                      onChange={(e) => handleAttributeChange('attack', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defense">Defesa</Label>
                    <Input
                      id="defense"
                      type="number"
                      min="1"
                      max={experienceLimits[formData.experience]}
                      value={formData.defense}
                      onChange={(e) => handleAttributeChange('defense', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ranged">Tiro</Label>
                    <Input
                      id="ranged"
                      type="number"
                      min="0"
                      max={experienceLimits[formData.experience]}
                      value={formData.ranged}
                      onChange={(e) => handleAttributeChange('ranged', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="movement">Movimento</Label>
                    <Input
                      id="movement"
                      type="number"
                      min="1"
                      max={experienceLimits[formData.experience]}
                      value={formData.movement}
                      onChange={(e) => handleAttributeChange('movement', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="morale">Moral</Label>
                    <Input
                      id="morale"
                      type="number"
                      min="1"
                      max={experienceLimits[formData.experience]}
                      value={formData.morale}
                      onChange={(e) => handleAttributeChange('morale', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Força Total e Manutenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{formData.totalForce}</div>
                    <div className="text-sm text-muted-foreground">Força Total</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{formData.maintenanceCost}</div>
                    <div className="text-sm text-muted-foreground">Custo Manutenção</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Habilidades Especiais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.specialAbilities.length > 0 && (
                  <div className="space-y-2">
                    <Label>Habilidades Selecionadas</Label>
                    {formData.specialAbilities.map((ability) => (
                      <div key={ability.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{ability.name}</span>
                            <Badge variant={ability.level === 1 ? "secondary" : "default"}>
                              Nível {ability.level}
                            </Badge>
                            <Badge variant="outline">Custo {ability.cost}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {ability.description}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSpecialAbility(ability.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {availableAbilities.length > 0 && (
                  <div>
                    <Label>Adicionar Habilidade</Label>
                    <Select onValueChange={addSpecialAbility}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma habilidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAbilities.map((ability) => (
                          <SelectItem key={ability.id} value={ability.id}>
                            <div className="flex items-center gap-2">
                              <span>{ability.name}</span>
                              <Badge variant={ability.level === 1 ? "secondary" : "default"} className="text-xs">
                                Nível {ability.level}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={onCancel} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Salvar Card
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};