import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Upload, X, AlertTriangle, CheckCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { HoldingType } from '@/types/Domain';

interface ExcelHolding {
  realm: string;
  province: string;
  provinceId?: string;
  holdingType: string;
  holderCode: string;
  holdingLevel: number;
}

interface DbHolding {
  province_id: string;
  holding_type: string;
  level: number;
  regent_id: string | null;
}

interface MissingHolding {
  type: string;
  holderCode: string;
  level: number;
  provinceId?: string;
}

interface ProvinceMissing {
  realm: string;
  province: string;
  provinceId: string;
  missing: MissingHolding[];
  existing: string[];
}

interface VerificationResult {
  totalExcel: number;
  totalDb: number;
  missingCount: number;
  missingByType: Record<string, number>;
  provincesWithMissing: ProvinceMissing[];
}

interface HoldingsVerifierProps {
  onClose: () => void;
}

const HOLDING_TYPE_MAP: Record<string, string> = {
  'law': 'ordem',
  'guild': 'guilda',
  'temple': 'templo',
  'source': 'fonte_magica',
};

const HOLDING_TYPE_LABELS: Record<string, string> = {
  'ordem': 'Law',
  'guilda': 'Guild',
  'templo': 'Temple',
  'fonte_magica': 'Source',
};

export function HoldingsVerifier({ onClose }: HoldingsVerifierProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [filterRealm, setFilterRealm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      // 1. Parse Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Find Holdings long sheet
      let sheetName = workbook.SheetNames.find(name =>
        name.toLowerCase() === 'holdings long' || 
        name.toLowerCase().includes('holdings')
      );

      if (!sheetName) {
        // Look for sheet with holding_type column
        for (const name of workbook.SheetNames) {
          const testSheet = workbook.Sheets[name];
          const testData = XLSX.utils.sheet_to_json(testSheet, { range: 0 });
          if (testData.length > 0) {
            const firstRow = testData[0] as Record<string, unknown>;
            if ('holding_type' in firstRow || 'Tipo de Holding' in firstRow) {
              sheetName = name;
              break;
            }
          }
        }
      }

      if (!sheetName) {
        sheetName = workbook.SheetNames[workbook.SheetNames.length - 1];
      }

      console.log('Using sheet:', sheetName);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Parse Excel data
      const excelHoldings: ExcelHolding[] = [];
      const excelByProvince = new Map<string, ExcelHolding[]>();

      jsonData.forEach((row: any) => {
        const realm = (row['realm'] || row['Reino'] || '').toString().trim();
        const province = (row['province'] || row['Província'] || row['Provincia'] || '').toString().trim();
        const holdingType = (row['holding_type'] || row['Tipo de Holding'] || row['Tipo'] || '').toString().toLowerCase().trim();
        const holderCode = (row['holder_code'] || row['Código Regente'] || row['regent_code'] || '').toString().trim();
        const holdingLevel = parseInt(row['holding_level'] || row['Nível'] || row['level'] || '0') || 0;

        if (province && holdingType) {
          const normalizedType = HOLDING_TYPE_MAP[holdingType] || holdingType;
          const holding: ExcelHolding = {
            realm,
            province,
            holdingType: normalizedType,
            holderCode,
            holdingLevel,
          };
          excelHoldings.push(holding);

          const key = `${realm.toLowerCase()}|${province.toLowerCase()}`;
          if (!excelByProvince.has(key)) {
            excelByProvince.set(key, []);
          }
          excelByProvince.get(key)!.push(holding);
        }
      });

      console.log(`Parsed ${excelHoldings.length} holdings from Excel`);

      // 2. Get database data
      const { data: provinces } = await supabase
        .from('provinces')
        .select('id, name, realm_id, realms(name)');

      const { data: holdings } = await supabase
        .from('holdings')
        .select('province_id, holding_type, level, regent_id');

      const provinceMap = new Map<string, { id: string; realm: string; name: string }>();
      provinces?.forEach((p: any) => {
        const realmName = p.realms?.name || '';
        const key = `${realmName.toLowerCase()}|${p.name.toLowerCase()}`;
        provinceMap.set(key, { id: p.id, realm: realmName, name: p.name });
      });

      const dbByProvince = new Map<string, DbHolding[]>();
      holdings?.forEach((h: any) => {
        if (!dbByProvince.has(h.province_id)) {
          dbByProvince.set(h.province_id, []);
        }
        dbByProvince.get(h.province_id)!.push(h);
      });

      // 3. Compare and find missing
      const provincesWithMissing: ProvinceMissing[] = [];
      const missingByType: Record<string, number> = {
        ordem: 0,
        guilda: 0,
        templo: 0,
        fonte_magica: 0,
      };
      let totalMissing = 0;

      excelByProvince.forEach((excelList, key) => {
        const provinceInfo = provinceMap.get(key);
        if (!provinceInfo) {
          console.warn(`Province not found in DB: ${key}`);
          return;
        }

        const dbList = dbByProvince.get(provinceInfo.id) || [];
        const dbTypes = new Set(dbList.map(h => h.holding_type));
        
        // Group Excel holdings by type
        const excelByType = new Map<string, ExcelHolding[]>();
        excelList.forEach(h => {
          if (!excelByType.has(h.holdingType)) {
            excelByType.set(h.holdingType, []);
          }
          excelByType.get(h.holdingType)!.push(h);
        });

        // Count DB holdings by type
        const dbByType = new Map<string, DbHolding[]>();
        dbList.forEach(h => {
          if (!dbByType.has(h.holding_type)) {
            dbByType.set(h.holding_type, []);
          }
          dbByType.get(h.holding_type)!.push(h);
        });

        const missing: MissingHolding[] = [];

        // For each type in Excel, check if same count in DB
        excelByType.forEach((excelOfType, type) => {
          const dbOfType = dbByType.get(type) || [];
          
          if (excelOfType.length > dbOfType.length) {
            // Some are missing - try to identify which specific ones
            excelOfType.forEach(eh => {
              const excelWithLevel = excelOfType.filter(e => e.holdingLevel === eh.holdingLevel && e.holderCode === eh.holderCode).length;
              const dbWithLevel = dbOfType.filter(d => d.level === eh.holdingLevel).length;
              
              if (excelWithLevel > dbWithLevel) {
                // Check if already added
                const alreadyAdded = missing.filter(
                  m => m.type === type && m.level === eh.holdingLevel && m.holderCode === eh.holderCode
                ).length;
                const shouldAdd = excelWithLevel - dbWithLevel - alreadyAdded;
                
                if (shouldAdd > 0) {
                  missing.push({
                    type,
                    holderCode: eh.holderCode,
                    level: eh.holdingLevel,
                    provinceId: provinceInfo.id,
                  });
                  missingByType[type] = (missingByType[type] || 0) + 1;
                  totalMissing++;
                }
              }
            });
          }
        });

        if (missing.length > 0) {
          provincesWithMissing.push({
            realm: provinceInfo.realm,
            province: provinceInfo.name,
            provinceId: provinceInfo.id,
            missing,
            existing: Array.from(dbTypes),
          });
        }
      });

      // Sort by realm then province
      provincesWithMissing.sort((a, b) => {
        if (a.realm !== b.realm) return a.realm.localeCompare(b.realm);
        return a.province.localeCompare(b.province);
      });

      setResult({
        totalExcel: excelHoldings.length,
        totalDb: holdings?.length || 0,
        missingCount: totalMissing,
        missingByType,
        provincesWithMissing,
      });

      toast.success(`Verificação concluída! ${totalMissing} holdings faltantes encontrados.`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }

    event.target.value = '';
  };

  // Import missing holdings
  const handleImportMissing = async () => {
    if (!result || result.missingCount === 0) return;

    setImporting(true);
    let imported = 0;
    let failed = 0;

    try {
      // Get all regents for mapping
      const { data: regents } = await supabase.from('regents').select('id, code');
      const regentMap = new Map<string, string>();
      regents?.forEach(r => {
        if (r.code) regentMap.set(r.code, r.id);
      });

      // Collect all missing holdings to import
      const toImport: { province_id: string; holding_type: HoldingType; regent_id: string | null; level: number }[] = [];
      
      result.provincesWithMissing.forEach(p => {
        p.missing.forEach(m => {
          const regentId = m.holderCode ? regentMap.get(m.holderCode) : null;
          
          // First, ensure regent exists if we have a code
          if (m.holderCode && !regentId) {
            console.warn(`Regent not found: ${m.holderCode}`);
          }
          
          toImport.push({
            province_id: p.provinceId,
            holding_type: m.type as HoldingType,
            regent_id: regentId || null,
            level: m.level,
          });
        });
      });

      setImportProgress({ current: 0, total: toImport.length });

      // Create missing regents first
      const missingRegentCodes = new Set<string>();
      result.provincesWithMissing.forEach(p => {
        p.missing.forEach(m => {
          if (m.holderCode && !regentMap.has(m.holderCode)) {
            missingRegentCodes.add(m.holderCode);
          }
        });
      });

      for (const code of missingRegentCodes) {
        const { data: created } = await supabase
          .from('regents')
          .insert({ code, name: code })
          .select('id')
          .single();
        
        if (created) {
          regentMap.set(code, created.id);
        }
      }

      // Import holdings
      for (let i = 0; i < toImport.length; i++) {
        const h = toImport[i];
        
        // Re-check regent after creating missing ones
        const holdingData = {
          province_id: h.province_id,
          holding_type: h.holding_type,
          regent_id: h.regent_id || (result.provincesWithMissing.find(p => p.provinceId === h.province_id)?.missing.find(m => m.type === h.holding_type && m.level === h.level)?.holderCode ? regentMap.get(result.provincesWithMissing.find(p => p.provinceId === h.province_id)!.missing.find(m => m.type === h.holding_type && m.level === h.level)!.holderCode) : null) || null,
          level: h.level,
        };

        const { error } = await supabase.from('holdings').insert(holdingData);
        
        if (error) {
          console.error('Failed to insert:', holdingData, error);
          failed++;
        } else {
          imported++;
        }

        setImportProgress({ current: i + 1, total: toImport.length });
      }

      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['regents'] });

      if (failed === 0) {
        toast.success(`${imported} holdings importados com sucesso!`);
      } else {
        toast.warning(`${imported} importados, ${failed} falharam`);
      }

      // Clear result to force re-verification
      setResult(null);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const filteredProvinces = result?.provincesWithMissing.filter(p => {
    if (filterRealm && !p.realm.toLowerCase().includes(filterRealm.toLowerCase())) return false;
    if (filterType && !p.missing.some(m => m.type === filterType)) return false;
    return true;
  }) || [];

  const uniqueRealms = [...new Set(result?.provincesWithMissing.map(p => p.realm) || [])].sort();

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Verificar Holdings Faltantes
        </CardTitle>
        <Button size="icon" variant="ghost" onClick={onClose} disabled={importing}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Comparando dados...</p>
          </div>
        ) : importing ? (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="font-medium">Importando holdings faltantes...</p>
            <p className="text-sm text-muted-foreground">
              {importProgress.current} de {importProgress.total}
            </p>
            <div className="w-full bg-muted rounded-full h-2 max-w-md mx-auto">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: importProgress.total > 0 ? `${(importProgress.current / importProgress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ) : !result ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Selecione o arquivo Excel para comparar com o banco de dados
            </p>
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
                  Selecionar Arquivo Excel
                </span>
              </Button>
            </label>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{result.totalExcel}</p>
                <p className="text-sm text-muted-foreground">No Excel</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{result.totalDb}</p>
                <p className="text-sm text-muted-foreground">No Banco</p>
              </div>
              <div className={`rounded-lg p-4 text-center ${result.missingCount > 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                <p className="text-2xl font-bold">{result.missingCount}</p>
                <p className="text-sm text-muted-foreground">Faltantes</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{result.provincesWithMissing.length}</p>
                <p className="text-sm text-muted-foreground">Províncias Afetadas</p>
              </div>
            </div>

            {/* Missing by Type */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2">Faltantes por tipo:</span>
              {Object.entries(result.missingByType).map(([type, count]) => (
                <Badge 
                  key={type} 
                  variant={count > 0 ? "destructive" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setFilterType(filterType === type ? '' : type)}
                >
                  {HOLDING_TYPE_LABELS[type] || type}: {count}
                </Badge>
              ))}
              {filterType && (
                <Button size="sm" variant="ghost" onClick={() => setFilterType('')}>
                  Limpar filtro
                </Button>
              )}
            </div>

            {/* Realm Filter */}
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-muted-foreground">Filtrar por país:</span>
              <select 
                className="border rounded px-2 py-1 text-sm bg-background"
                value={filterRealm}
                onChange={(e) => setFilterRealm(e.target.value)}
              >
                <option value="">Todos ({uniqueRealms.length})</option>
                {uniqueRealms.map(realm => (
                  <option key={realm} value={realm}>{realm}</option>
                ))}
              </select>
            </div>

            {/* Missing Details */}
            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-4 space-y-3">
                {filteredProvinces.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>Nenhum holding faltante encontrado!</p>
                  </div>
                ) : (
                  filteredProvinces.map((p, i) => (
                    <div key={i} className="border rounded-lg p-3 bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {p.realm} → {p.province}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Existentes: {p.existing.map(t => HOLDING_TYPE_LABELS[t] || t).join(', ') || 'Nenhum'}
                          </p>
                        </div>
                        <Badge variant="destructive">{p.missing.length} faltante(s)</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.missing.map((m, j) => (
                          <Badge key={j} variant="outline" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {HOLDING_TYPE_LABELS[m.type] || m.type} (Lv.{m.level}) - {m.holderCode || 'Sem regente'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setResult(null)}>
                <Upload className="w-4 h-4 mr-2" />
                Novo Arquivo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('=== HOLDINGS FALTANTES ===');
                  filteredProvinces.forEach(p => {
                    p.missing.forEach(m => {
                      console.log(`${p.realm}|${p.province}|${m.type}|${m.holderCode}|${m.level}`);
                    });
                  });
                  toast.success('Lista exportada para o console (F12)');
                }}
              >
                Exportar Lista
              </Button>
              {result.missingCount > 0 && (
                <Button onClick={handleImportMissing} className="ml-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Importar {result.missingCount} Faltantes
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
