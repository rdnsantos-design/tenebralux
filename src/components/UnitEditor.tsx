import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
import { Unit } from '@/types/Unit';
import { UnitTemplate } from '@/types/UnitTemplate';
import { UnitCard } from '@/types/UnitCard';
import { Regent } from '@/types/Army';

interface UnitEditorProps {
  unit?: Unit | null;
  regentId: string;
  templates: UnitTemplate[];
  legacyCards: UnitCard[]; // Cards antigos para compatibilidade
  onSave: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function UnitEditor({ unit, regentId, templates, legacyCards, onSave, onCancel }: UnitEditorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(unit?.templateId || '');
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    attack: unit?.attack || 1,
    defense: unit?.defense || 1,
    ranged: unit?.ranged || 0,
    movement: unit?.movement || 1,
    morale: unit?.morale || 1,
    experience: unit?.experience || 'Recruta' as const,
    totalForce: unit?.totalForce || 1,
    maintenanceCost: unit?.maintenanceCost || 1,
    specialAbilities: unit?.specialAbilities || [],
  });

  // Combina templates novos com cards antigos para seleção
  const allTemplates = [
    ...templates.map(t => ({ id: t.id, name: t.name, type: 'template' as const, data: t })),
    ...legacyCards.map(c => ({ id: c.id, name: c.name, type: 'legacy' as const, data: c }))
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    const template = allTemplates.find(t => t.id === templateId);
    if (template) {
      const data = template.data;
      setFormData({
        name: '', // Usuário define o nome específico
        attack: data.attack,
        defense: data.defense,
        ranged: data.ranged,
        movement: data.movement,
        morale: data.morale,
        experience: data.experience,
        totalForce: data.totalForce,
        maintenanceCost: data.maintenanceCost,
        specialAbilities: data.specialAbilities || [],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Digite um nome para a unidade');
      return;
    }
    
    if (!selectedTemplateId && !unit) {
      alert('Selecione um template base');
      return;
    }

    onSave({
      templateId: selectedTemplateId || unit?.templateId || '',
      regentId,
      name: formData.name,
      attack: formData.attack,
      defense: formData.defense,
      ranged: formData.ranged,
      movement: formData.movement,
      morale: formData.morale,
      experience: formData.experience,
      totalForce: formData.totalForce,
      maintenanceCost: formData.maintenanceCost,
      specialAbilities: formData.specialAbilities,
      experiencePoints: unit?.experiencePoints || 0,
      battlesWon: unit?.battlesWon || 0,
      battlesSurvived: unit?.battlesSurvived || 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle>{unit ? 'Editar Unidade' : 'Nova Unidade'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Template */}
          {!unit && (
            <div className="space-y-2">
              <Label>Template Base *</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template de unidade" />
                </SelectTrigger>
                <SelectContent>
                  {allTemplates.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhum template disponível
                    </SelectItem>
                  ) : (
                    allTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.type === 'legacy' && '(card antigo)'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecione um template para usar como base dos atributos
              </p>
            </div>
          )}

          {/* Nome da Unidade */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Unidade *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: 1ª Guarda Real de Avanil"
              required
            />
            <p className="text-xs text-muted-foreground">
              Dê um nome único para esta instância de unidade
            </p>
          </div>

          {/* Atributos */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Atributos</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attack">Ataque</Label>
                <Input
                  id="attack"
                  type="number"
                  min={0}
                  max={6}
                  value={formData.attack}
                  onChange={(e) => setFormData({ ...formData, attack: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defense">Defesa</Label>
                <Input
                  id="defense"
                  type="number"
                  min={0}
                  max={6}
                  value={formData.defense}
                  onChange={(e) => setFormData({ ...formData, defense: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ranged">Tiro</Label>
                <Input
                  id="ranged"
                  type="number"
                  min={0}
                  max={6}
                  value={formData.ranged}
                  onChange={(e) => setFormData({ ...formData, ranged: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement">Movimento</Label>
                <Input
                  id="movement"
                  type="number"
                  min={0}
                  max={6}
                  value={formData.movement}
                  onChange={(e) => setFormData({ ...formData, movement: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="morale">Moral</Label>
                <Input
                  id="morale"
                  type="number"
                  min={0}
                  max={6}
                  value={formData.morale}
                  onChange={(e) => setFormData({ ...formData, morale: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Outros Atributos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalForce">Poder Total</Label>
              <Input
                id="totalForce"
                type="number"
                min={1}
                value={formData.totalForce}
                onChange={(e) => setFormData({ ...formData, totalForce: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenanceCost">Custo Manutenção</Label>
              <Input
                id="maintenanceCost"
                type="number"
                min={0}
                value={formData.maintenanceCost}
                onChange={(e) => setFormData({ ...formData, maintenanceCost: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Experiência</Label>
              <Select 
                value={formData.experience} 
                onValueChange={(v) => setFormData({ ...formData, experience: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Amador">Amador</SelectItem>
                  <SelectItem value="Recruta">Recruta</SelectItem>
                  <SelectItem value="Profissional">Profissional</SelectItem>
                  <SelectItem value="Veterano">Veterano</SelectItem>
                  <SelectItem value="Elite">Elite</SelectItem>
                  <SelectItem value="Lendário">Lendário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Habilidades Especiais */}
          {formData.specialAbilities.length > 0 && (
            <div className="space-y-2">
              <Label>Habilidades Especiais</Label>
              <div className="flex flex-wrap gap-2">
                {formData.specialAbilities.map((ability, index) => (
                  <Badge key={index} variant="secondary">
                    {ability.name} (Nv.{ability.level})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {unit ? 'Salvar Alterações' : 'Criar Unidade'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
