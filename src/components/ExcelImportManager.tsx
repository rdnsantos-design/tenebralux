import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileSpreadsheet, Trash2, Eye, Calendar, Users, X, Loader2, Database, Check } from 'lucide-react';
import { UnitCard, ExperienceLevel } from '@/types/UnitCard';
import { useUnitTemplates, useBulkImportUnitTemplates, useDeleteUnitTemplate, UnitTemplate, SpecialAbility } from '@/hooks/useUnitTemplates';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ExcelImportManagerProps {
  onCancel: () => void;
  onCreateCards: (units: UnitCard[]) => void;
}

interface ImportedUnit {
  name: string;
  movement: number;
  defense: number;
  morale: number;
  attack: number;
  charge: number;
  ranged: number;
  ability: string;
  experience: string;
  power: number;
  maintenance: number;
}

export const ExcelImportManager: React.FC<ExcelImportManagerProps> = ({
  onCancel,
  onCreateCards
}) => {
  const [showImporter, setShowImporter] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedUnit[]>([]);
  const [previewFileName, setPreviewFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks do Supabase
  const { data: templates = [], isLoading } = useUnitTemplates();
  const bulkImport = useBulkImportUnitTemplates();
  const deleteTemplate = useDeleteUnitTemplate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Criar unidades a partir dos dados
      const units: ImportedUnit[] = jsonData.map((row: any, index: number) => {
        const keys = Object.keys(row);
        const firstColumn = keys[0];
        const nameVariations = ['Nome da unidade', 'Nome', 'Name', 'nome', 'NOME', 'name', 'NAME', 'Unidade', 'UNIDADE', 'unidade'];
        
        let name = '';
        
        if (firstColumn && row[firstColumn] && typeof row[firstColumn] === 'string') {
          name = row[firstColumn].toString().trim();
        }
        
        if (!name) {
          for (const variation of nameVariations) {
            if (row[variation] && row[variation].toString().trim()) {
              name = row[variation].toString().trim();
              break;
            }
          }
        }
        
        if (!name) name = `Unidade ${index + 1}`;
        
        const movement = parseInt(row['Movimento'] || row['Movement'] || row['movimento'] || row['MOVIMENTO']) || 1;
        const defense = parseInt(row['Defesa'] || row['Defense'] || row['defesa'] || row['DEFESA']) || 1;
        const morale = parseInt(row['Moral'] || row['Morale'] || row['moral'] || row['MORAL']) || 1;
        const attack = parseInt(row['Ataque'] || row['Attack'] || row['ataque'] || row['ATAQUE']) || 1;
        const charge = parseInt(row['Carga'] || row['Charge'] || row['carga'] || row['CARGA']) || 0;
        const ranged = parseInt(row['Tiro'] || row['Ranged'] || row['tiro'] || row['TIRO'] || row['Alcance']) || 0;
        const power = parseInt(row['Poder'] || row['Power'] || row['poder'] || row['PODER']) || 0;
        const maintenance = parseInt(row['Manutenção'] || row['Manutencao'] || row['Maintenance'] || row['manutenção'] || row['MANUTENÇÃO']) || 0;
        
        const ability = (row['Habilidade'] || row['Ability'] || row['habilidade'] || row['HABILIDADE'] || '').toString().trim();
        const experience = (row['Experiência'] || row['Experiencia'] || row['Experience'] || row['experiência'] || row['EXPERIÊNCIA'] || 'Profissional').toString().trim();
        
        return { 
          name, 
          movement,
          defense, 
          morale,
          attack, 
          charge,
          ranged, 
          ability,
          experience,
          power,
          maintenance
        };
      });

      setPreviewData(units);
      setPreviewFileName(file.name);
    } catch (error) {
      console.error('Erro ao ler arquivo Excel:', error);
      toast.error('Erro ao ler arquivo Excel. Verifique se o formato está correto.');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (previewData.length === 0) return;

    const experienceMap: Record<string, ExperienceLevel> = {
      'Amador': 'Amador',
      'Recruta': 'Recruta',
      'Profissional': 'Profissional',
      'Veterano': 'Veterano',
      'Elite': 'Elite',
      'Lendário': 'Lendário'
    };

    // Converter para formato do Supabase
    const templatesData = previewData.map((unit) => {
      const abilities: SpecialAbility[] = unit.ability 
        ? [{ id: crypto.randomUUID(), name: unit.ability, level: 1 as const, cost: 0, description: '' }] 
        : [];

      return {
        name: unit.name,
        source_file: previewFileName,
        attack: Math.min(6, Math.max(1, unit.attack)),
        defense: Math.min(6, Math.max(1, unit.defense)),
        ranged: Math.min(6, Math.max(0, unit.ranged)),
        movement: Math.min(6, Math.max(1, unit.movement)),
        morale: Math.min(6, Math.max(1, unit.morale)),
        experience: experienceMap[unit.experience] || 'Profissional' as ExperienceLevel,
        total_force: unit.power || (unit.attack + unit.defense + unit.ranged + unit.movement + unit.morale),
        maintenance_cost: unit.maintenance || Math.ceil((unit.attack + unit.defense + unit.ranged + unit.movement + unit.morale) * 0.2),
        special_abilities: abilities,
      };
    });

    try {
      await bulkImport.mutateAsync(templatesData);
      setShowImporter(false);
      setPreviewData([]);
      setPreviewFileName('');
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleCreateCardsFromTemplates = (templatesToConvert: UnitTemplate[]) => {
    const units: UnitCard[] = templatesToConvert.map((template) => ({
      id: template.id,
      name: template.name,
      attack: template.attack,
      defense: template.defense,
      ranged: template.ranged,
      movement: template.movement,
      morale: template.morale,
      experience: template.experience,
      totalForce: template.total_force,
      maintenanceCost: template.maintenance_cost,
      specialAbilities: template.special_abilities.map(a => ({
        ...a,
        level: a.level as 1 | 2
      })),
      backgroundImage: template.background_image || ''
    }));

    onCreateCards(units);
  };

  // Agrupar templates por arquivo de origem
  const templatesBySource = templates.reduce((acc, template) => {
    const source = template.source_file || 'Criados manualmente';
    if (!acc[source]) acc[source] = [];
    acc[source].push(template);
    return acc;
  }, {} as Record<string, UnitTemplate[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tela de preview após upload
  if (previewData.length > 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Confirmar Importação</h1>
              <p className="text-muted-foreground">
                {previewFileName} • {previewData.length} templates para importar
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmImport}
                disabled={bulkImport.isPending}
                className="flex items-center gap-2"
              >
                {bulkImport.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                Salvar no Banco de Dados
              </Button>
              <Button variant="outline" onClick={() => {
                setPreviewData([]);
                setPreviewFileName('');
              }}>
                Cancelar
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Templates a serem importados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 sticky top-0">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-center p-2">Mov</th>
                      <th className="text-center p-2">Def</th>
                      <th className="text-center p-2">Moral</th>
                      <th className="text-center p-2">Atq</th>
                      <th className="text-center p-2">Tiro</th>
                      <th className="text-left p-2">Habilidade</th>
                      <th className="text-center p-2">Exp</th>
                      <th className="text-center p-2">Força</th>
                      <th className="text-center p-2">Manut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((unit, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{unit.name}</td>
                        <td className="text-center p-2">{unit.movement}</td>
                        <td className="text-center p-2">{unit.defense}</td>
                        <td className="text-center p-2">{unit.morale}</td>
                        <td className="text-center p-2">{unit.attack}</td>
                        <td className="text-center p-2">{unit.ranged}</td>
                        <td className="text-left p-2 text-xs max-w-32 truncate">{unit.ability || '-'}</td>
                        <td className="text-center p-2 text-xs">{unit.experience}</td>
                        <td className="text-center p-2">{unit.power || '-'}</td>
                        <td className="text-center p-2">{unit.maintenance || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showImporter) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Importar Planilha Excel</h1>
              <p className="text-muted-foreground">
                Importe templates de unidades de uma planilha Excel
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowImporter(false)} className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Selecionar Arquivo Excel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  disabled={importing}
                >
                  {importing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando arquivo...
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-medium">Clique para selecionar arquivo Excel</div>
                      <div className="text-sm text-muted-foreground">
                        Formatos suportados: .xlsx, .xls
                      </div>
                    </div>
                  )}
                </Button>
                
                <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Formato esperado (cabeçalho na linha 1):</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>• <strong>Nome:</strong> Nome da unidade</span>
                    <span>• <strong>Movimento:</strong> Valor (1-6)</span>
                    <span>• <strong>Defesa:</strong> Valor (1-6)</span>
                    <span>• <strong>Moral:</strong> Valor (1-6)</span>
                    <span>• <strong>Ataque:</strong> Valor (1-6)</span>
                    <span>• <strong>Tiro:</strong> Valor (0-6)</span>
                    <span>• <strong>Habilidade:</strong> Texto</span>
                    <span>• <strong>Experiência:</strong> Nível</span>
                    <span>• <strong>Poder:</strong> Força total</span>
                    <span>• <strong>Manutenção:</strong> Custo</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Templates de Unidades</h1>
            <p className="text-muted-foreground">
              Gerencie templates importados do Excel • {templates.length} templates no banco de dados
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowImporter(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Importar Excel
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Voltar
            </Button>
          </div>
        </div>

        {templates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-4">Nenhum template ainda</h3>
              <p className="text-muted-foreground mb-6">
                Importe sua primeira planilha Excel para criar templates de unidades
              </p>
              <Button onClick={() => setShowImporter(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Primeira Importação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(templatesBySource).map(([source, sourceTemplates]) => (
              <Card key={source}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      {source}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({sourceTemplates.length} templates)
                      </span>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleCreateCardsFromTemplates(sourceTemplates)}
                    >
                      Criar Cards
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 sticky top-0">
                          <th className="text-left p-2">Nome</th>
                          <th className="text-center p-2">Atq</th>
                          <th className="text-center p-2">Def</th>
                          <th className="text-center p-2">Tiro</th>
                          <th className="text-center p-2">Mov</th>
                          <th className="text-center p-2">Moral</th>
                          <th className="text-center p-2">Exp</th>
                          <th className="text-center p-2">Força</th>
                          <th className="text-center p-2">Manut</th>
                          <th className="text-center p-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sourceTemplates.map((template) => (
                          <tr key={template.id} className="border-b hover:bg-muted/30">
                            <td className="p-2 font-medium">{template.name}</td>
                            <td className="text-center p-2">{template.attack}</td>
                            <td className="text-center p-2">{template.defense}</td>
                            <td className="text-center p-2">{template.ranged}</td>
                            <td className="text-center p-2">{template.movement}</td>
                            <td className="text-center p-2">{template.morale}</td>
                            <td className="text-center p-2 text-xs">{template.experience}</td>
                            <td className="text-center p-2">{template.total_force}</td>
                            <td className="text-center p-2">{template.maintenance_cost}</td>
                            <td className="text-center p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-destructive hover:text-destructive h-7 w-7 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
