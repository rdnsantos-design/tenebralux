import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Upload, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { HoldingType } from '@/types/Domain';

interface ParsedHolding {
  reino: string;
  provincia: string;
  tipoHolding: string;
  codigoRegente: string;
  nomeRegente: string;
  nivel: number;
}

interface ImportPreview {
  totalHoldings: number;
  uniqueRegents: number;
  uniqueProvinces: number;
  sample: ParsedHolding[];
}

interface HoldingsImporterProps {
  onClose: () => void;
}

// Map holding type names to database enum values
const HOLDING_TYPE_MAP: Record<string, HoldingType> = {
  'law': 'ordem',
  'ordem': 'ordem',
  'guild': 'guilda',
  'guilda': 'guilda',
  'guildas': 'guilda',
  'temple': 'templo',
  'templo': 'templo',
  'templos': 'templo',
  'source': 'fonte_magica',
  'fonte': 'fonte_magica',
  'fonte_magica': 'fonte_magica',
  'fontes mágicas': 'fonte_magica',
  'fontes magicas': 'fonte_magica',
};

export function HoldingsImporter({ onClose }: HoldingsImporterProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<ParsedHolding[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Find the "Holdings long" sheet
      const sheetName = workbook.SheetNames.find(name =>
        name.toLowerCase().includes('holdings') ||
        name.toLowerCase().includes('holding')
      ) || workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('Planilha vazia ou formato inválido');
        return;
      }

      // Parse the data
      const holdings: ParsedHolding[] = [];
      const regentsSet = new Set<string>();
      const provincesSet = new Set<string>();

      jsonData.forEach((row: any) => {
        const reino = row['Reino'] || row['realm'] || '';
        const provincia = row['Província'] || row['Provincia'] || row['province'] || '';
        const tipoHolding = (row['Tipo de Holding'] || row['Tipo'] || row['type'] || '').toLowerCase().trim();
        const codigoRegente = row['Código Regente'] || row['Codigo Regente'] || row['regent_code'] || '';
        const nomeRegente = row['Nome do Regente'] || row['Nome Regente'] || row['regent_name'] || '';
        const nivel = parseInt(row['Nível'] || row['Nivel'] || row['level'] || '0') || 0;

        if (provincia && tipoHolding) {
          holdings.push({
            reino,
            provincia,
            tipoHolding,
            codigoRegente: String(codigoRegente).trim(),
            nomeRegente: String(nomeRegente).trim(),
            nivel,
          });

          if (codigoRegente) {
            regentsSet.add(codigoRegente);
          }
          provincesSet.add(provincia);
        }
      });

      if (holdings.length === 0) {
        toast.error('Nenhum dado válido encontrado. Verifique se as colunas estão corretas.');
        return;
      }

      setParsedData(holdings);
      setPreview({
        totalHoldings: holdings.length,
        uniqueRegents: regentsSet.size,
        uniqueProvinces: provincesSet.size,
        sample: holdings.slice(0, 10),
      });

      toast.success(`${holdings.length} holdings encontrados`);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast.error('Erro ao processar arquivo Excel');
    }

    event.target.value = '';
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);

    try {
      // Phase 1: Create/update regents
      setProgress({ current: 0, total: 0, phase: 'Importando regentes...' });
      
      const regentsMap = new Map<string, string>(); // code -> id
      const uniqueRegents = new Map<string, { code: string; name: string }>();
      
      parsedData.forEach(h => {
        if (h.codigoRegente && !uniqueRegents.has(h.codigoRegente)) {
          uniqueRegents.set(h.codigoRegente, {
            code: h.codigoRegente,
            name: h.nomeRegente || h.codigoRegente,
          });
        }
      });

      const regentsList = Array.from(uniqueRegents.values());
      setProgress({ current: 0, total: regentsList.length, phase: 'Importando regentes...' });

      for (let i = 0; i < regentsList.length; i++) {
        const regent = regentsList[i];
        
        // Check if exists
        const { data: existing } = await supabase
          .from('regents')
          .select('id')
          .eq('code', regent.code)
          .maybeSingle();

        if (existing) {
          regentsMap.set(regent.code, existing.id);
        } else {
          const { data: created, error } = await supabase
            .from('regents')
            .insert({ code: regent.code, name: regent.name })
            .select('id')
            .single();

          if (error) throw error;
          regentsMap.set(regent.code, created.id);
        }

        setProgress({ current: i + 1, total: regentsList.length, phase: 'Importando regentes...' });
      }

      // Phase 2: Get province mapping
      setProgress({ current: 0, total: 0, phase: 'Mapeando províncias...' });
      
      const { data: provinces } = await supabase
        .from('provinces')
        .select('id, name, realm_id, realms(name)');

      const provinceMap = new Map<string, string>(); // "realm|province" -> id
      provinces?.forEach((p: any) => {
        const key = `${p.realms?.name?.toLowerCase()}|${p.name.toLowerCase()}`;
        provinceMap.set(key, p.id);
        // Also map by province name only for fallback
        provinceMap.set(p.name.toLowerCase(), p.id);
      });

      // Phase 3: Create holdings
      setProgress({ current: 0, total: parsedData.length, phase: 'Criando holdings...' });
      
      let created = 0;
      let skipped = 0;

      // Clear existing holdings first
      await supabase.from('holdings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      for (let i = 0; i < parsedData.length; i++) {
        const h = parsedData[i];
        
        // Find province
        const provinceKey = `${h.reino.toLowerCase()}|${h.provincia.toLowerCase()}`;
        let provinceId = provinceMap.get(provinceKey);
        
        // Fallback: try by province name only
        if (!provinceId) {
          provinceId = provinceMap.get(h.provincia.toLowerCase());
        }

        if (!provinceId) {
          skipped++;
          setProgress({ current: i + 1, total: parsedData.length, phase: 'Criando holdings...' });
          continue;
        }

        // Map holding type
        const holdingType = HOLDING_TYPE_MAP[h.tipoHolding];
        if (!holdingType) {
          skipped++;
          setProgress({ current: i + 1, total: parsedData.length, phase: 'Criando holdings...' });
          continue;
        }

        // Get regent ID
        const regentId = h.codigoRegente ? regentsMap.get(h.codigoRegente) : undefined;

        // Create holding
        const { error } = await supabase
          .from('holdings')
          .insert({
            province_id: provinceId,
            holding_type: holdingType,
            regent_id: regentId || null,
            level: h.nivel,
          });

        if (!error) {
          created++;
        } else {
          skipped++;
        }

        setProgress({ current: i + 1, total: parsedData.length, phase: 'Criando holdings...' });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['regents'] });

      toast.success(`Importação concluída! ${created} holdings criados, ${skipped} ignorados.`);
      onClose();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Importar Holdings do Excel
        </CardTitle>
        <Button size="icon" variant="ghost" onClick={onClose} disabled={isImporting}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isImporting ? (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">{progress.phase}</p>
              {progress.total > 0 && (
                <p className="text-sm text-muted-foreground">
                  {progress.current} de {progress.total}
                </p>
              )}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ) : !preview ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Selecione o arquivo Excel com a aba "Holdings long"
            </p>
            <div className="text-sm text-muted-foreground mb-4">
              Colunas esperadas: <br />
              <code className="bg-muted px-1 rounded text-xs">Reino</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">Província</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">Tipo de Holding</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">Código Regente</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">Nome do Regente</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">Nível</code>
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
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Holdings:</span>
                  <span className="ml-2 font-semibold">{preview.totalHoldings}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Regentes:</span>
                  <span className="ml-2 font-semibold">{preview.uniqueRegents}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Províncias:</span>
                  <span className="ml-2 font-semibold">{preview.uniqueProvinces}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                A importação irá <strong>substituir</strong> todos os holdings existentes
                e criar os regentes que não existirem.
              </span>
            </div>

            <div className="max-h-[250px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Província</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Regente</th>
                    <th className="text-center p-2">Nível</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((h, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{h.provincia}</td>
                      <td className="p-2 capitalize">{h.tipoHolding}</td>
                      <td className="p-2">
                        {h.nomeRegente || h.codigoRegente || <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="text-center p-2">{h.nivel}</td>
                    </tr>
                  ))}
                  {preview.totalHoldings > 10 && (
                    <tr className="border-t">
                      <td colSpan={4} className="p-2 text-center text-muted-foreground">
                        ... e mais {preview.totalHoldings - 10} holdings
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
              <Button onClick={handleImport}>
                <Check className="w-4 h-4 mr-2" />
                Importar Dados
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
