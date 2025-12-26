import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, Shield, Brain, Sword, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { 
  FieldCommander, 
  SPECIALIZATIONS, 
  EVOLUTION_COSTS, 
  calculateDerivedFields,
  canEvolve,
  applyEvolution,
  addSpecialization,
  CommanderSpecialization
} from '@/types/FieldCommander';
import { toast } from 'sonner';

interface CommanderEvolutionProps {
  commander: FieldCommander;
  onEvolve: (id: string, updates: Partial<FieldCommander>) => Promise<void>;
  onBack: () => void;
}

export function CommanderEvolution({ commander, onEvolve, onBack }: CommanderEvolutionProps) {
  const [selectedSpec, setSelectedSpec] = useState<CommanderSpecialization | ''>('');
  const derived = calculateDerivedFields(commander);

  const allSpecs = [commander.especializacao_inicial, ...commander.especializacoes_adicionais];
  const availableSpecs = SPECIALIZATIONS.filter(spec => !allSpecs.includes(spec));

  const handleEvolve = async (attribute: 'comando' | 'estrategia' | 'guarda') => {
    try {
      const updates = applyEvolution(commander, attribute);
      await onEvolve(commander.id, updates);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao evoluir');
    }
  };

  const handleAddSpec = async () => {
    if (!selectedSpec) return;
    try {
      const updates = addSpecialization(commander, selectedSpec);
      await onEvolve(commander.id, updates);
      setSelectedSpec('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar especialização');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Evoluir: {commander.nome_comandante}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Cultura: {commander.cultura_origem} | Especialização: {commander.especializacao_inicial}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">{commander.pontos_prestigio} PP</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Atributos Atuais e Evolução */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Comando */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sword className="w-5 h-5 text-red-500" />
                <span className="font-semibold">Comando</span>
              </div>
              <span className="text-3xl font-bold">{commander.comando}</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>• {derived.pontos_compra_taticos} pts compra tática</p>
              <p>• {derived.unidades_lideradas} unidades lideradas</p>
              <p>• {derived.area_influencia} área de influência</p>
            </div>
            <Button 
              onClick={() => handleEvolve('comando')} 
              disabled={!canEvolve(commander, 'comando')}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              +1 Comando ({EVOLUTION_COSTS.comando} PP)
            </Button>
          </CardContent>
        </Card>

        {/* Estratégia */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">Estratégia</span>
              </div>
              <span className="text-3xl font-bold">{commander.estrategia}</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>• {derived.pontos_compra_estrategicos} pts compra estratégica</p>
              <p>• Cartas de nível estratégico</p>
              <p>• Bonificadores de moral</p>
            </div>
            <Button 
              onClick={() => handleEvolve('estrategia')} 
              disabled={!canEvolve(commander, 'estrategia')}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              +1 Estratégia ({EVOLUTION_COSTS.estrategia} PP)
            </Button>
          </CardContent>
        </Card>

        {/* Guarda */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Guarda</span>
              </div>
              <span className="text-3xl font-bold">{commander.guarda}</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>• Pontos de vida em batalha</p>
              <p>• Resistência a ataques diretos</p>
              <p>• Sobrevivência do comandante</p>
            </div>
            <Button 
              onClick={() => handleEvolve('guarda')} 
              disabled={!canEvolve(commander, 'guarda')}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              +1 Guarda ({EVOLUTION_COSTS.guarda} PP)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Especializações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Especializações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="default" className="text-sm">
              {commander.especializacao_inicial} (Inicial)
            </Badge>
            {commander.especializacoes_adicionais.map((spec) => (
              <Badge key={spec} variant="secondary" className="text-sm">
                {spec}
              </Badge>
            ))}
          </div>

          {availableSpecs.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedSpec} onValueChange={(v: CommanderSpecialization) => setSelectedSpec(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Adicionar especialização..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSpecs.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddSpec} 
                disabled={!selectedSpec || !canEvolve(commander, 'nova_especializacao')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar ({EVOLUTION_COSTS.nova_especializacao} PP)
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-4">
            Especializações reduzem o custo de cartas de combate relacionadas ao tipo de unidade.
          </p>
        </CardContent>
      </Card>

      {/* Tabela de Custos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabela de Custos de Evolução</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold text-red-500">{EVOLUTION_COSTS.comando} PP</p>
              <p className="text-sm text-muted-foreground">+1 Comando</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold text-blue-500">{EVOLUTION_COSTS.estrategia} PP</p>
              <p className="text-sm text-muted-foreground">+1 Estratégia</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold text-green-500">{EVOLUTION_COSTS.guarda} PP</p>
              <p className="text-sm text-muted-foreground">+1 Guarda</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-2xl font-bold text-purple-500">{EVOLUTION_COSTS.nova_especializacao} PP</p>
              <p className="text-sm text-muted-foreground">Nova Especialização</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
