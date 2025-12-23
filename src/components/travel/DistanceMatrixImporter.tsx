import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBulkImportDistances, useDistanceCount } from '@/hooks/useTravel';
import { FileSpreadsheet, Upload, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportPreview {
  provinces: string[];
  distanceCount: number;
  sample: Array<{ from: string; to: string; distance: number }>;
}

interface DistanceMatrixImporterProps {
  onClose: () => void;
}

export function DistanceMatrixImporter({ onClose }: DistanceMatrixImporterProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<Array<{ from: string; to: string; distance: number }>>([]);
  const bulkImport = useBulkImportDistances();
  const { data: currentCount } = useDistanceCount();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Find the sheet (first one or one with relevant name)
      const sheetName = workbook.SheetNames.find(name =>
        name.toLowerCase().includes('distancia') ||
        name.toLowerCase().includes('matriz') ||
        name.toLowerCase().includes('distance')
      ) || workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        toast.error('Planilha vazia ou formato inválido');
        return;
      }

      // Parse the matrix
      const headerRow = jsonData[0] as (string | number)[];
      const provinces: string[] = [];

      // Get province names from header (skip first cell)
      for (let i = 1; i < headerRow.length; i++) {
        const cellValue = headerRow[i];
        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
          provinces.push(String(cellValue).trim());
        }
      }

      // Build distance pairs
      const distances: Array<{ from: string; to: string; distance: number }> = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const fromProvince = row[0]?.toString().trim();
        if (!fromProvince) continue;

        for (let j = 1; j < row.length && j <= provinces.length; j++) {
          const toProvince = provinces[j - 1];
          const distance = parseFloat(row[j]);

          // Only add if valid distance and not same province
          if (!isNaN(distance) && distance > 0 && fromProvince !== toProvince) {
            distances.push({
              from: fromProvince,
              to: toProvince,
              distance,
            });
          }
        }
      }

      if (distances.length === 0) {
        toast.error('Nenhuma distância válida encontrada');
        return;
      }

      setParsedData(distances);
      setPreview({
        provinces,
        distanceCount: distances.length,
        sample: distances.slice(0, 10),
      });

      toast.success(`${distances.length} distâncias encontradas entre ${provinces.length} províncias`);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast.error('Erro ao processar arquivo Excel');
    }

    event.target.value = '';
  };

  const handleImport = () => {
    if (parsedData.length === 0) return;
    bulkImport.mutate(parsedData, {
      onSuccess: () => {
        setPreview(null);
        setParsedData([]);
        onClose();
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Importar Matriz de Distâncias
        </CardTitle>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentCount !== undefined && currentCount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>
              Já existem <strong>{currentCount}</strong> distâncias cadastradas. 
              A importação irá substituir todos os dados existentes.
            </span>
          </div>
        )}

        {!preview ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Selecione um arquivo Excel com a matriz de distâncias
            </p>
            <div className="text-sm text-muted-foreground mb-4">
              Formato esperado: matriz quadrada com nomes das províncias na primeira linha e coluna
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button asChild>
                <span>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </span>
              </Button>
            </label>
          </div>
        ) : (
          <>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium mb-2">Arquivo: {fileName}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Províncias:</span>
                  <span className="ml-2 font-semibold">{preview.provinces.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Distâncias:</span>
                  <span className="ml-2 font-semibold">{preview.distanceCount}</span>
                </div>
              </div>
            </div>

            <div className="max-h-[250px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">De</th>
                    <th className="text-left p-2">Para</th>
                    <th className="text-right p-2">Distância (km)</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{d.from}</td>
                      <td className="p-2">{d.to}</td>
                      <td className="text-right p-2 font-mono">{d.distance.toFixed(1)}</td>
                    </tr>
                  ))}
                  {preview.distanceCount > 10 && (
                    <tr className="border-t">
                      <td colSpan={3} className="p-2 text-center text-muted-foreground">
                        ... e mais {preview.distanceCount - 10} distâncias
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setPreview(null); setParsedData([]); }}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={bulkImport.isPending}>
                {bulkImport.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Importar Dados
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
