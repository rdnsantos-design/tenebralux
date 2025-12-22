import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';
import { FieldCommander, SPECIALIZATIONS, CULTURES, CommanderSpecialization } from '@/types/FieldCommander';
import { TacticalCulture } from '@/types/TacticalCard';
import { Regent } from '@/types/Army';

interface CommanderEditorProps {
  commander?: FieldCommander | null;
  regents?: Regent[];
  onSave: (commander: Omit<FieldCommander, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export function CommanderEditor({ commander, regents = [], onSave, onCancel }: CommanderEditorProps) {
  const [formData, setFormData] = useState({
    nome_comandante: '',
    cultura_origem: 'Anuire' as TacticalCulture,
    especializacao_inicial: 'Infantaria' as CommanderSpecialization,
    comando: 1,
    estrategia: 0,
    guarda: 3,
    pontos_prestigio: 0,
    especializacoes_adicionais: [] as CommanderSpecialization[],
    unidade_de_origem: '',
    notas: '',
    regent_id: '' as string | undefined
  });

  useEffect(() => {
    if (commander) {
      setFormData({
        nome_comandante: commander.nome_comandante,
        cultura_origem: commander.cultura_origem,
        especializacao_inicial: commander.especializacao_inicial,
        comando: commander.comando,
        estrategia: commander.estrategia,
        guarda: commander.guarda,
        pontos_prestigio: commander.pontos_prestigio,
        especializacoes_adicionais: commander.especializacoes_adicionais || [],
        unidade_de_origem: commander.unidade_de_origem || '',
        notas: commander.notas || '',
        regent_id: commander.regent_id || ''
      });
    }
  }, [commander]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      unidade_de_origem: formData.unidade_de_origem || undefined,
      notas: formData.notas || undefined,
      regent_id: formData.regent_id || undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle>{commander ? 'Editar Comandante' : 'Novo Comandante'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Comandante *</Label>
              <Input
                id="nome"
                value={formData.nome_comandante}
                onChange={(e) => setFormData({ ...formData, nome_comandante: e.target.value })}
                placeholder="Ex: Sir Marcus Goldhelm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cultura">Cultura de Origem *</Label>
              <Select
                value={formData.cultura_origem}
                onValueChange={(value: TacticalCulture) => setFormData({ ...formData, cultura_origem: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cultura" />
                </SelectTrigger>
                <SelectContent>
                  {CULTURES.map((cultura) => (
                    <SelectItem key={cultura} value={cultura}>
                      {cultura}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="especializacao">Especialização Inicial *</Label>
              <Select
                value={formData.especializacao_inicial}
                onValueChange={(value: CommanderSpecialization) => setFormData({ ...formData, especializacao_inicial: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a especialização" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade de Origem</Label>
              <Input
                id="unidade"
                value={formData.unidade_de_origem}
                onChange={(e) => setFormData({ ...formData, unidade_de_origem: e.target.value })}
                placeholder="Ex: 1ª Guarda Real de Anuire"
              />
            </div>
          </div>

          {/* Associação com Regente */}
          {regents.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold mb-4">Associação com Regente</h3>
              <div className="space-y-2">
                <Label htmlFor="regent">Regente</Label>
                <Select
                  value={formData.regent_id || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, regent_id: value === '__none__' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um regente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {regents.map((regent) => (
                      <SelectItem key={regent.id} value={regent.id}>
                        {regent.name} - {regent.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Associar a um regente permite vincular este comandante a unidades dos exércitos do regente.
                </p>
              </div>
            </div>
          )}

          {/* Atributos */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Atributos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comando">Comando</Label>
                <Input
                  id="comando"
                  type="number"
                  min={1}
                  value={formData.comando}
                  onChange={(e) => setFormData({ ...formData, comando: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground">Pontos de compra tática</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estrategia">Estratégia</Label>
                <Input
                  id="estrategia"
                  type="number"
                  min={0}
                  value={formData.estrategia}
                  onChange={(e) => setFormData({ ...formData, estrategia: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Pontos de compra estratégica</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guarda">Guarda</Label>
                <Input
                  id="guarda"
                  type="number"
                  min={1}
                  value={formData.guarda}
                  onChange={(e) => setFormData({ ...formData, guarda: parseInt(e.target.value) || 3 })}
                />
                <p className="text-xs text-muted-foreground">Pontos de vida</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prestigio">Pontos de Prestígio</Label>
                <Input
                  id="prestigio"
                  type="number"
                  min={0}
                  value={formData.pontos_prestigio}
                  onChange={(e) => setFormData({ ...formData, pontos_prestigio: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Para evolução</p>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas e Histórico</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Observações, histórico de batalhas, etc..."
              rows={4}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {commander ? 'Salvar Alterações' : 'Criar Comandante'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
