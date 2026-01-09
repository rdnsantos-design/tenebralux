import React, { useState, useEffect } from 'react';
import { Planet, TIER_LIMITS, PLANET_TYPES, PLANET_FUNCTIONS, REGIONS, POSITIVE_TAGS, NEGATIVE_TAGS, PlanetType, PlanetFunction } from '@/types/galaxy';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Save, X } from 'lucide-react';

interface PlanetEditorProps {
  planet: Planet | null;
  open: boolean;
  onClose: () => void;
  onSave: (planet: Partial<Planet> & { id: number }) => void;
  factions: { id: string; name: string }[];
}

export function PlanetEditor({ planet, open, onClose, onSave, factions }: PlanetEditorProps) {
  const [formData, setFormData] = useState<Partial<Planet>>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (planet) {
      setFormData({ ...planet });
      setErrors([]);
    }
  }, [planet]);

  if (!planet) return null;

  const tierLimits = TIER_LIMITS[formData.tier as 1 | 2 | 3 | 4 | 5] || TIER_LIMITS[1];

  const validate = (): string[] => {
    const errs: string[] = [];
    const limits = TIER_LIMITS[formData.tier as 1 | 2 | 3 | 4 | 5];

    if ((formData.D || 0) > limits.maxD) {
      errs.push(`D não pode exceder ${limits.maxD} para Tier ${formData.tier}`);
    }
    if ((formData.R || 0) > limits.maxR) {
      errs.push(`R não pode exceder ${limits.maxR} para Tier ${formData.tier}`);
    }
    if ((formData.Def || 0) > limits.maxDef) {
      errs.push(`Def não pode exceder ${limits.maxDef} para Tier ${formData.tier}`);
    }
    if ((formData.slotsProd || 0) > (formData.D || 0)) {
      errs.push('Slots de Produção não podem exceder D');
    }
    if ((formData.slotsCom || 0) > (formData.D || 0)) {
      errs.push('Slots de Comércio não podem exceder D');
    }
    if ((formData.slotsSoc || 0) > (formData.D || 0)) {
      errs.push('Slots de Sociedade não podem exceder D');
    }

    return errs;
  };

  const handleSave = () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave({ ...formData, id: planet.id } as Planet);
    onClose();
  };

  const updateField = <K extends keyof Planet>(field: K, value: Planet[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Planeta: {planet.nome}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Erros de validação */}
            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
                {errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    {err}
                  </div>
                ))}
              </div>
            )}

            {/* Informações Básicas */}
            <section>
              <h3 className="font-semibold mb-3">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={formData.nome || ''}
                    onChange={(e) => updateField('nome', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Facção</Label>
                  <Select
                    value={formData.faccao}
                    onValueChange={(v) => updateField('faccao', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {factions.map(f => (
                        <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v) => updateField('tipo', v as PlanetType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANET_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Função</Label>
                  <Select
                    value={formData.funcao}
                    onValueChange={(v) => updateField('funcao', v as PlanetFunction)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANET_FUNCTIONS.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tier</Label>
                  <Select
                    value={String(formData.tier)}
                    onValueChange={(v) => updateField('tier', Number(v) as 1 | 2 | 3 | 4 | 5)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(t => (
                        <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator />

            {/* Coordenadas */}
            <section>
              <h3 className="font-semibold mb-3">Coordenadas</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>X</Label>
                  <Input
                    type="number"
                    value={formData.x || 0}
                    onChange={(e) => updateField('x', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Y</Label>
                  <Input
                    type="number"
                    value={formData.y || 0}
                    onChange={(e) => updateField('y', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Z</Label>
                  <Input
                    type="number"
                    value={formData.z || 0}
                    onChange={(e) => updateField('z', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Região</Label>
                  <Select
                    value={formData.regiao}
                    onValueChange={(v) => updateField('regiao', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3">
                <Label>Zona</Label>
                <RadioGroup
                  value={formData.zona}
                  onValueChange={(v) => updateField('zona', v as 'Core' | 'Periferia')}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Core" id="zona-core" />
                    <Label htmlFor="zona-core">Core</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Periferia" id="zona-periferia" />
                    <Label htmlFor="zona-periferia">Periferia</Label>
                  </div>
                </RadioGroup>
              </div>
            </section>

            <Separator />

            {/* Atributos */}
            <section>
              <h3 className="font-semibold mb-3">Atributos (baseados no Tier {formData.tier})</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Desenvolvimento (D): {formData.D}</Label>
                    <span className="text-xs text-muted-foreground">máx: {tierLimits.maxD}</span>
                  </div>
                  <Slider
                    value={[formData.D || 1]}
                    onValueChange={([v]) => updateField('D', v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Recursos (R): {formData.R}</Label>
                    <span className="text-xs text-muted-foreground">máx: {tierLimits.maxR}</span>
                  </div>
                  <Slider
                    value={[formData.R || 1]}
                    onValueChange={([v]) => updateField('R', v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Defesa (Def): {formData.Def}</Label>
                    <span className="text-xs text-muted-foreground">máx: {tierLimits.maxDef}</span>
                  </div>
                  <Slider
                    value={[formData.Def || 0]}
                    onValueChange={([v]) => updateField('Def', v)}
                    min={0}
                    max={6}
                    step={1}
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Slots */}
            <section>
              <h3 className="font-semibold mb-3">Slots (máx = D)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Produção</Label>
                  <Input
                    type="number"
                    value={formData.slotsProd || 1}
                    onChange={(e) => updateField('slotsProd', Number(e.target.value))}
                    min={1}
                    max={formData.D || 10}
                  />
                </div>
                <div>
                  <Label>Comércio</Label>
                  <Input
                    type="number"
                    value={formData.slotsCom || 1}
                    onChange={(e) => updateField('slotsCom', Number(e.target.value))}
                    min={1}
                    max={formData.D || 10}
                  />
                </div>
                <div>
                  <Label>Sociedade</Label>
                  <Input
                    type="number"
                    value={formData.slotsSoc || 1}
                    onChange={(e) => updateField('slotsSoc', Number(e.target.value))}
                    min={1}
                    max={formData.D || 10}
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* PCP */}
            <section>
              <h3 className="font-semibold mb-3">PCP (Point Creation Pool)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total</Label>
                  <Input
                    type="number"
                    value={formData.pcpTotal || 0}
                    onChange={(e) => updateField('pcpTotal', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Gasto</Label>
                  <Input
                    type="number"
                    value={formData.pcpGasto || 0}
                    onChange={(e) => updateField('pcpGasto', Number(e.target.value))}
                  />
                </div>
              </div>
              {(formData.pcpGasto || 0) > (formData.pcpTotal || 0) && (
                <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Sobre-desenvolvido ({Math.round(((formData.pcpGasto || 0) / (formData.pcpTotal || 1)) * 100)}%)
                </p>
              )}
            </section>

            <Separator />

            {/* Tags */}
            <section>
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="space-y-3">
                <div>
                  <Label>Tags Positivas (separadas por vírgula)</Label>
                  <Input
                    value={formData.tagsPositivas || ''}
                    onChange={(e) => updateField('tagsPositivas', e.target.value)}
                    placeholder="Hub Histórico, Centro Acadêmico..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opções: {POSITIVE_TAGS.map(t => t.name).join(', ')}
                  </p>
                </div>
                <div>
                  <Label>Tags Negativas (separadas por vírgula)</Label>
                  <Input
                    value={formData.tagsNegativas || ''}
                    onChange={(e) => updateField('tagsNegativas', e.target.value)}
                    placeholder="Facções Internas, Fronteira Pirata..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opções: {NEGATIVE_TAGS.map(t => t.name).join(', ')}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* População e Descrição */}
            <section>
              <h3 className="font-semibold mb-3">População e Descrição</h3>
              <div className="space-y-3">
                <div>
                  <Label>População</Label>
                  <Input
                    type="number"
                    value={formData.populacao || 0}
                    onChange={(e) => updateField('populacao', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao || ''}
                    onChange={(e) => updateField('descricao', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
