import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBulkImportDomains } from '@/hooks/useDomains';
import { FileSpreadsheet, Upload, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportPreview {
  realms: string[];
  provinces: Array<{
    name: string;
    realmName: string;
    development: number;
    magic: number;
    cultura: string;
  }>;
}

interface DomainImporterProps {
  onClose: () => void;
}

export const DomainImporter = ({ onClose }: DomainImporterProps) => {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState('');
  const bulkImport = useBulkImportDomains();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Find the "Provinciais" sheet
      const sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('provinciais') || 
        name.toLowerCase().includes('provinces')
      ) || workbook.SheetNames[0];
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('Planilha vazia ou formato inválido');
        return;
      }

      // Extract realms and provinces
      const realmsSet = new Set<string>();
      const provinces: ImportPreview['provinces'] = [];

      jsonData.forEach((row: any) => {
        const realmName = row['Reino'] || row['realm'] || row['Realm'] || '';
        const provinceName = row['Provincia'] || row['Província'] || row['province'] || row['Province'] || '';
        const development = parseInt(row['Desenvolvimento'] || row['Development'] || row['Level'] || '0') || 0;
        const magic = parseInt(row['Magia'] || row['Magic'] || row['Source'] || '0') || 0;
        const cultura = row['Cultura'] || row['Culture'] || '';

        if (realmName && provinceName) {
          realmsSet.add(realmName);
          provinces.push({
            name: provinceName,
            realmName,
            development: Math.min(10, Math.max(0, development)),
            magic: Math.min(10, Math.max(0, magic)),
            cultura,
          });
        }
      });

      if (provinces.length === 0) {
        toast.error('Nenhum dado válido encontrado. Verifique se as colunas estão corretas (Reino, Província, Desenvolvimento, Magia)');
        return;
      }

      setPreview({
        realms: Array.from(realmsSet).sort(),
        provinces,
      });

      toast.success(`${provinces.length} províncias encontradas em ${realmsSet.size} reinos`);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast.error('Erro ao processar arquivo Excel');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleImport = () => {
    if (!preview) return;
    bulkImport.mutate(preview, {
      onSuccess: () => {
        setPreview(null);
        onClose();
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Importar do Excel
        </CardTitle>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!preview ? (
          <>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Selecione um arquivo Excel (.xlsx, .xls) com as colunas:
              </p>
              <div className="text-sm text-muted-foreground mb-4">
                <code className="bg-muted px-2 py-1 rounded">Reino</code>,{' '}
                <code className="bg-muted px-2 py-1 rounded">Província</code>,{' '}
                <code className="bg-muted px-2 py-1 rounded">Desenvolvimento</code>,{' '}
                <code className="bg-muted px-2 py-1 rounded">Magia</code>,{' '}
                <code className="bg-muted px-2 py-1 rounded">Cultura</code>
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
          </>
        ) : (
          <>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium mb-2">Arquivo: {fileName}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Reinos:</span>
                  <span className="ml-2 font-semibold">{preview.realms.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Províncias:</span>
                  <span className="ml-2 font-semibold">{preview.provinces.length}</span>
                </div>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Reino</th>
                    <th className="text-left p-2">Província</th>
                    <th className="text-left p-2">Cultura</th>
                    <th className="text-center p-2">Des.</th>
                    <th className="text-center p-2">Mag.</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.provinces.slice(0, 50).map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{p.realmName}</td>
                      <td className="p-2">{p.name}</td>
                      <td className="p-2 text-muted-foreground">{p.cultura || '-'}</td>
                      <td className="text-center p-2">{p.development}</td>
                      <td className="text-center p-2">{p.magic}</td>
                    </tr>
                  ))}
                  {preview.provinces.length > 50 && (
                    <tr className="border-t">
                      <td colSpan={5} className="p-2 text-center text-muted-foreground">
                        ... e mais {preview.provinces.length - 50} províncias
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreview(null)}>
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
};
