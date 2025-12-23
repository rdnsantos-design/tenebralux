import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Army, Regent } from '@/types/Army';
import { Unit } from '@/types/Unit';
import { FieldCommander } from '@/types/FieldCommander';
import { toast } from 'sonner';

interface ArmyExporterProps {
  armies: Army[];
  regents: Regent[];
  units: Unit[];
  commanders: FieldCommander[];
}

export function ArmyExporter({ armies, regents, units, commanders }: ArmyExporterProps) {
  const [selectedArmyId, setSelectedArmyId] = useState<string>('');
  const [open, setOpen] = useState(false);

  const getRegentName = (regentId: string) => {
    const regent = regents.find(r => r.id === regentId);
    return regent?.name || 'Desconhecido';
  };

  const getCommanderById = (commanderId?: string) => {
    if (!commanderId) return null;
    return commanders.find(c => c.id === commanderId);
  };

  const handleExport = () => {
    if (!selectedArmyId) {
      toast.error('Selecione um exército para exportar');
      return;
    }

    const army = armies.find(a => a.id === selectedArmyId);
    if (!army) {
      toast.error('Exército não encontrado');
      return;
    }

    // Buscar unidades do exército
    const armyUnits = units.filter(u => u.armyId === army.id);
    
    // Buscar comandantes associados às unidades
    const commanderIds = new Set<string>();
    armyUnits.forEach(u => {
      if (u.commanderId) commanderIds.add(u.commanderId);
    });
    
    // Também adicionar o general do exército
    if (army.generalId) commanderIds.add(army.generalId);
    
    const armyCommanders = commanders.filter(c => commanderIds.has(c.id));

    // Preparar dados das unidades
    const unitsData = armyUnits.map(unit => {
      const commander = getCommanderById(unit.commanderId);
      return {
        'Nome': unit.name,
        'Ataque': unit.attack,
        'Defesa': unit.defense,
        'Tiro': unit.ranged,
        'Movimento': unit.movement,
        'Moral': unit.morale,
        'Experiência': unit.experience,
        'Força Total': unit.totalForce,
        'Manutenção': unit.maintenanceCost,
        'Comandante': commander?.nome_comandante || '-',
        'XP Acumulado': unit.experiencePoints,
        'Batalhas Vencidas': unit.battlesWon,
        'Batalhas Sobrevividas': unit.battlesSurvived,
        'Postura': unit.currentPosture || '-',
        'Pressão Normal': unit.normalPressure || 0,
        'Pressão Permanente': unit.permanentPressure || 0,
        'Hits': unit.hits || 0,
        'Habilidades Especiais': unit.specialAbilities?.map(a => a.name).join(', ') || '-'
      };
    });

    // Preparar dados dos comandantes
    const commandersData = armyCommanders.map(commander => ({
      'Nome': commander.nome_comandante,
      'Cultura': commander.cultura_origem,
      'Comando': commander.comando,
      'Estratégia': commander.estrategia,
      'Guarda': commander.guarda,
      'Prestígio': commander.pontos_prestigio,
      'Especialização Inicial': commander.especializacao_inicial,
      'Especializações Adicionais': commander.especializacoes_adicionais?.join(', ') || '-',
      'Classe': commander.classe || '-',
      'Nível': commander.nivel || '-',
      'AC': commander.ac || '-',
      'HP': commander.hit_points || '-',
      'Ataque': commander.ataque || '-',
      'Habilidades': commander.habilidades || '-',
      'Domínio': commander.dominio || '-',
      'Idade': commander.idade || '-',
      'Unidade de Origem': commander.unidade_de_origem || '-',
      'Notas': commander.notas || '-'
    }));

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Adicionar aba de unidades
    const wsUnits = XLSX.utils.json_to_sheet(unitsData);
    XLSX.utils.book_append_sheet(wb, wsUnits, 'Unidades');

    // Adicionar aba de comandantes
    const wsCommanders = XLSX.utils.json_to_sheet(commandersData);
    XLSX.utils.book_append_sheet(wb, wsCommanders, 'Comandantes');

    // Gerar nome do arquivo
    const regentName = getRegentName(army.regentId);
    const fileName = `${army.name}_${regentName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download
    XLSX.writeFile(wb, fileName);
    toast.success(`Exército "${army.name}" exportado com sucesso!`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Exército
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Exportar Exército para Excel
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selecione o Exército</Label>
            <Select value={selectedArmyId} onValueChange={setSelectedArmyId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um exército" />
              </SelectTrigger>
              <SelectContent>
                {armies.map((army) => (
                  <SelectItem key={army.id} value={army.id}>
                    {army.name} ({getRegentName(army.regentId)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedArmyId && (
            <div className="text-sm text-muted-foreground">
              {(() => {
                const army = armies.find(a => a.id === selectedArmyId);
                const armyUnits = units.filter(u => u.armyId === selectedArmyId);
                const commanderIds = new Set<string>();
                armyUnits.forEach(u => {
                  if (u.commanderId) commanderIds.add(u.commanderId);
                });
                if (army?.generalId) commanderIds.add(army.generalId);
                
                return (
                  <p>
                    Este exército possui <strong>{armyUnits.length}</strong> unidades 
                    e <strong>{commanderIds.size}</strong> comandantes associados.
                  </p>
                );
              })()}
            </div>
          )}

          <Button 
            onClick={handleExport} 
            disabled={!selectedArmyId}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
