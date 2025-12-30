import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MassCombatCulture } from '@/types/combat/mass-combat-culture';
import { ArrowLeft, Save } from 'lucide-react';

interface MassCombatCultureEditorProps {
  culture?: MassCombatCulture;
  onSave: (culture: Omit<MassCombatCulture, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const TERRAINS = ['Planície', 'Desértico', 'Ártico', 'Alagado', 'Floresta', 'Montanha', 'Pântano', 'Costeiro'];
const SEASONS = ['Primavera', 'Verão', 'Outono', 'Inverno'];
const SPECIALIZATIONS = ['Cavalaria', 'Infantaria', 'Arqueria', 'Cerco'];

export function MassCombatCultureEditor({ culture, onSave, onCancel }: MassCombatCultureEditorProps) {
  const [formData, setFormData] = React.useState({
    name: culture?.name || '',
    terrain_affinity: culture?.terrain_affinity || 'Planície',
    season_affinity: culture?.season_affinity || 'Primavera',
    specialization: culture?.specialization || 'Infantaria',
    special_ability: culture?.special_ability || '',
    description: culture?.description || '',
    image_url: culture?.image_url || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle>{culture ? 'Editar Cultura' : 'Nova Cultura'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Cultura</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da cultura"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terrain">Afinidade de Terreno</Label>
              <Select
                value={formData.terrain_affinity}
                onValueChange={(value) => setFormData({ ...formData, terrain_affinity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERRAINS.map((terrain) => (
                    <SelectItem key={terrain} value={terrain}>{terrain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">Afinidade de Estação</Label>
              <Select
                value={formData.season_affinity}
                onValueChange={(value) => setFormData({ ...formData, season_affinity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((season) => (
                    <SelectItem key={season} value={season}>{season}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Especialização</Label>
              <Select
                value={formData.specialization}
                onValueChange={(value) => setFormData({ ...formData, specialization: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_ability">Habilidade Especial</Label>
            <Textarea
              id="special_ability"
              value={formData.special_ability}
              onChange={(e) => setFormData({ ...formData, special_ability: e.target.value })}
              placeholder="Descreva a habilidade especial da cultura..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição adicional da cultura..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
