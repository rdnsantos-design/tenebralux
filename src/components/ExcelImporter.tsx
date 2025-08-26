import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { UnitCard, ExperienceLevel } from "@/types/UnitCard";
import * as XLSX from 'xlsx';

interface ExcelImporterProps {
  onImport: (units: UnitCard[]) => void;
  onCancel: () => void;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ onImport, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

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
    } catch (error) {
      console.error('Erro ao ler arquivo Excel:', error);
      alert('Erro ao ler arquivo Excel. Verifique se o formato está correto.');
    } finally {
      setImporting(false);
    }
  };

  const mapExcelToUnitCard = (row: any, index: number): UnitCard => {
    // Debug: mostrar todas as chaves disponíveis
    console.log('Chaves disponíveis na linha:', Object.keys(row));
    console.log('Dados da linha:', row);
    
    // Mapear nome com mais variações possíveis
    const nameVariations = ['Nome', 'Name', 'nome', 'NOME', 'name', 'NAME', 'Unidade', 'unidade', 'Unit', 'unit'];
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
    const ranged = parseInt(row['Tiro'] || row['Ranged'] || row['tiro'] || row['TIRO'] || row['Alcance'] || row['alcance']) || 1;
    const movement = parseInt(row['Movimento'] || row['Movement'] || row['movimento'] || row['MOVIMENTO']) || 1;
    const morale = parseInt(row['Moral'] || row['Morale'] || row['moral'] || row['MORAL']) || 1;
    
    // Usar experiência padrão (será configurado posteriormente)
    const experience: ExperienceLevel = 'Profissional';

    // Calcular força total e custo de manutenção
    const baseForce = attack + defense + ranged + movement + morale;
    const totalForce = Math.round(baseForce);
    const maintenanceCost = Math.ceil(totalForce * 0.1);

    return {
      id: `imported-${index}`,
      name,
      attack,
      defense,
      ranged,
      movement,
      morale,
      experience,
      totalForce,
      maintenanceCost,
      specialAbilities: [],
      backgroundImage: ''
    };
  };

  const handleImport = () => {
    if (previewData.length === 0) return;

    const units = previewData.map((row, index) => mapExcelToUnitCard(row, index));
    onImport(units);
  };

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
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Cancelar
          </Button>
        </div>

        <div className="space-y-6">
          {/* Upload de arquivo */}
          <Card>
            <CardHeader>
              <CardTitle>1. Selecionar Arquivo Excel</CardTitle>
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

          {/* Preview dos dados */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>2. Preview dos Dados ({previewData.length} unidades)</CardTitle>
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
                        <th className="text-center p-2">Experiência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, index) => {
                        const unit = mapExcelToUnitCard(row, index);
                        return (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{unit.name}</td>
                            <td className="text-center p-2">{unit.attack}</td>
                            <td className="text-center p-2">{unit.defense}</td>
                            <td className="text-center p-2">{unit.ranged}</td>
                            <td className="text-center p-2">{unit.movement}</td>
                            <td className="text-center p-2">{unit.morale}</td>
                            <td className="text-center p-2">{unit.experience}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <p className="text-center text-muted-foreground mt-4">
                      ... e mais {previewData.length - 10} unidades
                    </p>
                  )}
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button onClick={handleImport} className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar {previewData.length} Unidades
                  </Button>
                  <Button variant="outline" onClick={() => setPreviewData([])}>
                    Selecionar Outro Arquivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};