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
  realm: string;
  province: string;
  provinceLevel: number;
  holdingType: string;
  holderCode: string;
  holderName: string;
  holdingLevel: number;
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
  // Law/Order holdings
  'law': 'ordem',
  'laws': 'ordem',
  'ordem': 'ordem',
  'ordens': 'ordem',
  'order': 'ordem',
  'orders': 'ordem',
  // Guild holdings
  'guild': 'guilda',
  'guilds': 'guilda',
  'guilda': 'guilda',
  'guildas': 'guilda',
  // Temple holdings
  'temple': 'templo',
  'temples': 'templo',
  'templo': 'templo',
  'templos': 'templo',
  // Source/Magic holdings
  'source': 'fonte_magica',
  'sources': 'fonte_magica',
  'fonte': 'fonte_magica',
  'fontes': 'fonte_magica',
  'fonte_magica': 'fonte_magica',
  'fonte magica': 'fonte_magica',
  'fontes mágicas': 'fonte_magica',
  'fontes magicas': 'fonte_magica',
  'magic': 'fonte_magica',
  'magical source': 'fonte_magica',
};

// Function to normalize and map holding type
const normalizeHoldingType = (type: string): HoldingType | null => {
  const normalized = type.toLowerCase().trim();
  
  // Direct match
  if (HOLDING_TYPE_MAP[normalized]) {
    return HOLDING_TYPE_MAP[normalized];
  }
  
  // Try removing special characters and extra spaces
  const cleaned = normalized.replace(/[^a-z\s]/g, '').trim();
  if (HOLDING_TYPE_MAP[cleaned]) {
    return HOLDING_TYPE_MAP[cleaned];
  }
  
  return null;
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
        const realm = row['realm'] || row['Reino'] || '';
        const province = row['province'] || row['Província'] || row['Provincia'] || '';
        const provinceLevel = parseInt(row['province_level'] || row['Nível da Província'] || '0') || 0;
        const holdingType = (row['holding_type'] || row['Tipo de Holding'] || row['Tipo'] || '').toLowerCase().trim();
        const holderCode = row['holder_code'] || row['Código Regente'] || row['regent_code'] || '';
        const holderName = row['holder_name'] || row['Nome do Regente'] || row['regent_name'] || '';
        const holdingLevel = parseInt(row['holding_level'] || row['Nível'] || row['level'] || '0') || 0;

        if (province && holdingType) {
          holdings.push({
            realm,
            province,
            provinceLevel,
            holdingType,
            holderCode: String(holderCode).trim(),
            holderName: String(holderName).trim(),
            holdingLevel,
          });

          if (holderCode) {
            regentsSet.add(String(holderCode).trim());
          }
          provincesSet.add(province);
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
        if (h.holderCode && !uniqueRegents.has(h.holderCode)) {
          uniqueRegents.set(h.holderCode, {
            code: h.holderCode,
            name: h.holderName || h.holderCode,
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
      const provinceByNameOnly = new Map<string, string>(); // province name only -> id
      
      provinces?.forEach((p: any) => {
        // Map by realm|province (normalized to lowercase and trimmed)
        const realmName = (p.realms?.name || '').toLowerCase().trim();
        const provinceName = p.name.toLowerCase().trim();
        const key = `${realmName}|${provinceName}`;
        provinceMap.set(key, p.id);
        
        // Also map by province name only for fallback
        provinceByNameOnly.set(provinceName, p.id);
      });

      // Phase 3: Create holdings
      setProgress({ current: 0, total: parsedData.length, phase: 'Criando holdings...' });
      
      let created = 0;
      let skipped = 0;
      const skippedReasons = {
        provinceNotFound: 0,
        unknownHoldingType: 0,
        insertError: 0,
      };
      const unknownHoldingTypes = new Set<string>();

      // Clear existing holdings first
      await supabase.from('holdings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      for (let i = 0; i < parsedData.length; i++) {
        const h = parsedData[i];
        
        // Find province - normalize to lowercase and trim
        const realmNormalized = (h.realm || '').toLowerCase().trim();
        const provinceNormalized = (h.province || '').toLowerCase().trim();
        const provinceKey = `${realmNormalized}|${provinceNormalized}`;
        
        let provinceId = provinceMap.get(provinceKey);
        
        // Fallback: try by province name only
        if (!provinceId) {
          provinceId = provinceByNameOnly.get(provinceNormalized);
        }

        if (!provinceId) {
          console.warn(`Province not found: ${h.realm}|${h.province}`);
          skippedReasons.provinceNotFound++;
          skipped++;
          setProgress({ current: i + 1, total: parsedData.length, phase: 'Criando holdings...' });
          continue;
        }

        // Map holding type using the normalizer
        const holdingType = normalizeHoldingType(h.holdingType);
        if (!holdingType) {
          console.warn(`Unknown holding type: "${h.holdingType}" for province ${h.province}`);
          unknownHoldingTypes.add(h.holdingType);
          skippedReasons.unknownHoldingType++;
          skipped++;
          setProgress({ current: i + 1, total: parsedData.length, phase: 'Criando holdings...' });
          continue;
        }

        // Get regent ID
        const regentId = h.holderCode ? regentsMap.get(h.holderCode) : undefined;

        // Create holding
        const { error } = await supabase
          .from('holdings')
          .insert({
            province_id: provinceId,
            holding_type: holdingType,
            regent_id: regentId || null,
            level: h.holdingLevel,
          });

        if (!error) {
          created++;
        } else {
          console.warn(`Insert error for ${h.province}:`, error);
          skippedReasons.insertError++;
          skipped++;
        }

        setProgress({ current: i + 1, total: parsedData.length, phase: 'Criando holdings...' });
      }

      // Log summary for debugging
      console.log('=== Import Summary ===');
      console.log(`Created: ${created}`);
      console.log(`Skipped: ${skipped}`);
      console.log(`  - Province not found: ${skippedReasons.provinceNotFound}`);
      console.log(`  - Unknown holding type: ${skippedReasons.unknownHoldingType}`);
      console.log(`  - Insert errors: ${skippedReasons.insertError}`);
      if (unknownHoldingTypes.size > 0) {
        console.log(`  - Unknown types found: ${Array.from(unknownHoldingTypes).join(', ')}`);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['regents'] });

      // Show detailed result
      let message = `Importação concluída! ${created} holdings criados.`;
      if (skipped > 0) {
        message += ` ${skipped} ignorados`;
        if (skippedReasons.provinceNotFound > 0) {
          message += ` (${skippedReasons.provinceNotFound} províncias não encontradas)`;
        }
        if (skippedReasons.unknownHoldingType > 0) {
          message += ` (${skippedReasons.unknownHoldingType} tipos desconhecidos: ${Array.from(unknownHoldingTypes).slice(0, 3).join(', ')})`;
        }
      }
      
      if (created > skipped) {
        toast.success(message);
      } else {
        toast.warning(message);
      }
      
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
              <code className="bg-muted px-1 rounded text-xs">realm</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">province</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">holding_type</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">holder_code</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">holder_name</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">holding_level</code>
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
                      <td className="p-2">{h.province}</td>
                      <td className="p-2 capitalize">{h.holdingType}</td>
                      <td className="p-2">
                        {h.holderName || h.holderCode || <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="text-center p-2">{h.holdingLevel}</td>
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
