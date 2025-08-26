import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileSpreadsheet, Trash2, Eye, Calendar, Users, Upload, X } from 'lucide-react';
import { ExcelImport } from '@/types/ExcelImport';
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
      
      // Criar unidades a partir dos dados
      const units = jsonData.map((row: any, index: number) => {
        const nameVariations = ['Nome da unidade', 'Nome', 'Name', 'nome', 'NOME', 'name', 'NAME'];
        let name = '';
        for (const variation of nameVariations) {
          if (row[variation] && row[variation].toString().trim()) {
            name = row[variation].toString().trim();
            break;
          }
        }
        if (!name) name = `Unidade ${index + 1}`;
        
        const attack = parseInt(row['Ataque'] || row['Attack'] || row['ataque'] || row['ATAQUE']) || 1;
        const defense = parseInt(row['Defesa'] || row['Defense'] || row['defesa'] || row['DEFESA']) || 1;
        const ranged = parseInt(row['Tiro'] || row['Ranged'] || row['tiro'] || row['TIRO'] || row['Alcance']) || 1;
        const movement = parseInt(row['Movimento'] || row['Movement'] || row['movimento'] || row['MOVIMENTO']) || 1;
        const morale = parseInt(row['Moral'] || row['Morale'] || row['moral'] || row['MORAL']) || 1;
        
        return { name, attack, defense, ranged, movement, morale };
      });

      handleNewImport(units, file.name);
    } catch (error) {
      console.error('Erro ao ler arquivo Excel:', error);
      alert('Erro ao ler arquivo Excel. Verifique se o formato está correto.');
    } finally {
      setImporting(false);
    }
  };

  const handleNewImport = (units: Array<{name: string, attack: number, defense: number, ranged: number, movement: number, morale: number}>, fileName?: string) => {
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
    const units: UnitCard[] = importData.units.map((unit, index) => ({
      id: `imported-${importData.id}-${index}`,
      name: unit.name,
      attack: unit.attack,
      defense: unit.defense,
      ranged: unit.ranged,
      movement: unit.movement,
      morale: unit.morale,
      experience: 'Profissional' as const,
      totalForce: unit.attack + unit.defense + unit.ranged + unit.movement + unit.morale,
      maintenanceCost: Math.ceil((unit.attack + unit.defense + unit.ranged + unit.movement + unit.morale) * 0.2),
      specialAbilities: [],
      backgroundImage: ''
    }));

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
                  <h4 className="font-medium mb-2">Formato esperado da planilha:</h4>
                  <ul className="space-y-1">
                    <li>• <strong>Nome:</strong> Nome da unidade</li>
                    <li>• <strong>Ataque:</strong> Valor de ataque (1-6)</li>
                    <li>• <strong>Defesa:</strong> Valor de defesa (1-6)</li>
                    <li>• <strong>Tiro:</strong> Valor de tiro/alcance (1-6)</li>
                    <li>• <strong>Movimento:</strong> Valor de movimento (1-6)</li>
                    <li>• <strong>Moral:</strong> Valor de moral (1-6)</li>
                  </ul>
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
                    <tr className="border-b">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-center p-2">Ataque</th>
                      <th className="text-center p-2">Defesa</th>
                      <th className="text-center p-2">Tiro</th>
                      <th className="text-center p-2">Movimento</th>
                      <th className="text-center p-2">Moral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewImport.units.map((unit, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{unit.name}</td>
                        <td className="text-center p-2">{unit.attack}</td>
                        <td className="text-center p-2">{unit.defense}</td>
                        <td className="text-center p-2">{unit.ranged}</td>
                        <td className="text-center p-2">{unit.movement}</td>
                        <td className="text-center p-2">{unit.morale}</td>
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