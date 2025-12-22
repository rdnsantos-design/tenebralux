import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileSpreadsheet, Trash2, Eye, Calendar, Users, Upload, X } from 'lucide-react';
import { ExcelImport, ImportedUnit } from '@/types/ExcelImport';
import { UnitCard, ExperienceLevel } from '@/types/UnitCard';
import * as XLSX from 'xlsx';

interface ExcelImportManagerProps {
  onCancel: () => void;
  onCreateCards: (units: UnitCard[]) => void;
}

export const ExcelImportManager: React.FC<ExcelImportManagerProps> = ({
  onCancel,
  onCreateCards
}) => {
  const [imports, setImports] = useState<ExcelImport[]>([]);
  const [showImporter, setShowImporter] = useState(false);
  const [previewImport, setPreviewImport] = useState<ExcelImport | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar importações salvas
  useEffect(() => {
    const savedImports = localStorage.getItem('excelImports');
    if (savedImports) {
      try {
        const parsed = JSON.parse(savedImports);
        setImports(parsed.map((imp: any) => ({
          ...imp,
          importDate: new Date(imp.importDate)
        })));
      } catch (error) {
        console.error('Erro ao carregar importações:', error);
      }
    }
  }, []);

  // Salvar importações
  useEffect(() => {
    localStorage.setItem('excelImports', JSON.stringify(imports));
  }, [imports]);

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
      
      setPreviewData(jsonData);
      
      // Criar unidades a partir dos dados com todos os campos
      const units: ImportedUnit[] = jsonData.map((row: any, index: number) => {
        // Nome
        const nameVariations = ['Nome da unidade', 'Nome', 'Name', 'nome', 'NOME', 'name', 'NAME'];
        let name = '';
        for (const variation of nameVariations) {
          if (row[variation] && row[variation].toString().trim()) {
            name = row[variation].toString().trim();
            break;
          }
        }
        if (!name) name = `Unidade ${index + 1}`;
        
        // Atributos numéricos
        const movement = parseInt(row['Movimento'] || row['Movement'] || row['movimento'] || row['MOVIMENTO']) || 1;
        const defense = parseInt(row['Defesa'] || row['Defense'] || row['defesa'] || row['DEFESA']) || 1;
        const morale = parseInt(row['Moral'] || row['Morale'] || row['moral'] || row['MORAL']) || 1;
        const attack = parseInt(row['Ataque'] || row['Attack'] || row['ataque'] || row['ATAQUE']) || 1;
        const charge = parseInt(row['Carga'] || row['Charge'] || row['carga'] || row['CARGA']) || 0;
        const ranged = parseInt(row['Tiro'] || row['Ranged'] || row['tiro'] || row['TIRO'] || row['Alcance']) || 0;
        const power = parseInt(row['Poder'] || row['Power'] || row['poder'] || row['PODER']) || 0;
        const maintenance = parseInt(row['Manutenção'] || row['Manutencao'] || row['Maintenance'] || row['manutenção'] || row['MANUTENÇÃO']) || 0;
        
        // Campos de texto
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

      handleNewImport(units, file.name);
    } catch (error) {
      console.error('Erro ao ler arquivo Excel:', error);
      alert('Erro ao ler arquivo Excel. Verifique se o formato está correto.');
    } finally {
      setImporting(false);
    }
  };

  const handleNewImport = (units: ImportedUnit[], fileName?: string) => {
    const newImport: ExcelImport = {
      id: `import-${Date.now()}`,
      fileName: fileName || `Importação ${imports.length + 1}`,
      importDate: new Date(),
      unitCount: units.length,
      units
    };

    setImports([...imports, newImport]);
    setShowImporter(false);
    setPreviewData([]);
  };

  const handleDeleteImport = (importId: string) => {
    setImports(imports.filter(imp => imp.id !== importId));
  };

  const handleCreateCardsFromImport = (importData: ExcelImport) => {
    const units: UnitCard[] = importData.units.map((unit, index) => {
      // Mapear experiência do Excel para ExperienceLevel
      const experienceMap: { [key: string]: ExperienceLevel } = {
        'Amador': 'Amador',
        'Recruta': 'Recruta',
        'Profissional': 'Profissional',
        'Veterano': 'Veterano',
        'Elite': 'Elite',
        'Lendário': 'Lendário'
      };
      const mappedExperience = experienceMap[unit.experience] || 'Profissional';
      
      return {
        id: `imported-${importData.id}-${index}`,
        name: unit.name,
        attack: unit.attack,
        defense: unit.defense,
        ranged: unit.ranged,
        movement: unit.movement,
        morale: unit.morale,
        experience: mappedExperience,
        totalForce: unit.power || (unit.attack + unit.defense + unit.ranged + unit.movement + unit.morale),
        maintenanceCost: unit.maintenance || Math.ceil((unit.attack + unit.defense + unit.ranged + unit.movement + unit.morale) * 0.2),
        specialAbilities: unit.ability ? [{ id: `ability-${index}`, name: unit.ability, level: 1 as const, cost: 0, description: '' }] : [],
        backgroundImage: ''
      };
    });

    onCreateCards(units);

    onCreateCards(units);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showImporter) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Importar Planilha Excel</h1>
              <p className="text-muted-foreground">
                Importe múltiplas unidades de uma planilha Excel
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
                    <>Processando arquivo...</>
                  ) : (
                    <>
                      <div className="text-center">
                        <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <div className="font-medium">Clique para selecionar arquivo Excel</div>
                        <div className="text-sm text-muted-foreground">
                          Formatos suportados: .xlsx, .xls
                        </div>
                      </div>
                    </>
                  )}
                </Button>
                
                <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Formato esperado da planilha (cabeçalho na linha 1):</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>• <strong>Nome:</strong> Nome da unidade</span>
                    <span>• <strong>Movimento:</strong> Valor de movimento</span>
                    <span>• <strong>Defesa:</strong> Valor de defesa</span>
                    <span>• <strong>Moral:</strong> Valor de moral</span>
                    <span>• <strong>Ataque:</strong> Valor de ataque</span>
                    <span>• <strong>Carga:</strong> Valor de carga</span>
                    <span>• <strong>Tiro:</strong> Valor de tiro</span>
                    <span>• <strong>Habilidade:</strong> Texto da habilidade</span>
                    <span>• <strong>Experiência:</strong> Nível de experiência</span>
                    <span>• <strong>Poder:</strong> Força total</span>
                    <span>• <strong>Manutenção:</strong> Custo de manutenção</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (previewImport) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Preview: {previewImport.fileName}</h1>
              <p className="text-muted-foreground">
                Importado em {formatDate(previewImport.importDate)} • {previewImport.unitCount} unidades
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleCreateCardsFromImport(previewImport)}>
                Criar Cards desta Importação
              </Button>
              <Button variant="outline" onClick={() => setPreviewImport(null)}>
                Voltar
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Unidades na Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-center p-2">Mov</th>
                      <th className="text-center p-2">Def</th>
                      <th className="text-center p-2">Moral</th>
                      <th className="text-center p-2">Atq</th>
                      <th className="text-center p-2">Carga</th>
                      <th className="text-center p-2">Tiro</th>
                      <th className="text-left p-2">Habilidade</th>
                      <th className="text-center p-2">Exp</th>
                      <th className="text-center p-2">Poder</th>
                      <th className="text-center p-2">Manut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewImport.units.map((unit, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{unit.name}</td>
                        <td className="text-center p-2">{unit.movement}</td>
                        <td className="text-center p-2">{unit.defense}</td>
                        <td className="text-center p-2">{unit.morale}</td>
                        <td className="text-center p-2">{unit.attack}</td>
                        <td className="text-center p-2">{unit.charge}</td>
                        <td className="text-center p-2">{unit.ranged}</td>
                        <td className="text-left p-2 text-xs">{unit.ability || '-'}</td>
                        <td className="text-center p-2 text-xs">{unit.experience}</td>
                        <td className="text-center p-2">{unit.power}</td>
                        <td className="text-center p-2">{unit.maintenance}</td>
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciador de Importações Excel</h1>
            <p className="text-muted-foreground">
              Gerencie suas importações de planilhas Excel
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowImporter(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Importação
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Voltar
            </Button>
          </div>
        </div>

        {imports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-4">Nenhuma importação ainda</h3>
              <p className="text-muted-foreground mb-6">
                Faça sua primeira importação de planilha Excel
              </p>
              <Button onClick={() => setShowImporter(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Primeira Importação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {imports.map((importData) => (
              <Card key={importData.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{importData.fileName}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(importData.importDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {importData.unitCount} unidades
                        </div>
                      </div>
                      <div className="text-sm">
                        <strong>Unidades:</strong> {importData.units.slice(0, 3).map(u => u.name).join(', ')}
                        {importData.units.length > 3 && ` e mais ${importData.units.length - 3}...`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewImport(importData)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateCardsFromImport(importData)}
                      >
                        Criar Cards
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteImport(importData.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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