import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileSpreadsheet, Crown, Castle, Building, Church, Sparkles, Scale } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { HoldingType } from '@/types/Domain';

interface ParsedProvince {
  realm: string;
  name: string;
  development: number;
  magic: number;
  culture: string;
}

interface ParsedHolding {
  realm: string;
  province: string;
  holdingType: HoldingType;
  regentCode: string;
  regentName: string;
  level: number;
}

interface ParsedRegent {
  code: string;
  name: string;
}

interface ImportPreview {
  provinces: ParsedProvince[];
  holdings: ParsedHolding[];
  regents: ParsedRegent[];
  realms: string[];
}

interface FullDomainImporterProps {
  onClose: () => void;
}

const HOLDING_TYPE_MAP: Record<string, HoldingType> = {
  'law': 'ordem',
  'ordem': 'ordem',
  'guild': 'guilda',
  'guilda': 'guilda',
  'temple': 'templo',
  'templo': 'templo',
  'source': 'fonte_magica',
  'fonte_magica': 'fonte_magica',
  'fonte': 'fonte_magica',
};

const HOLDING_ICONS: Record<HoldingType, typeof Castle> = {
  'ordem': Scale,
  'guilda': Building,
  'templo': Church,
  'fonte_magica': Sparkles,
};

export const FullDomainImporter = ({ onClose }: FullDomainImporterProps) => {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setFileName(file.name);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Parse provinces from first sheet (looking for "Provinciais" or first sheet)
      const provincesSheet = workbook.Sheets[workbook.SheetNames[0]];
      const provincesJson = XLSX.utils.sheet_to_json(provincesSheet, { header: 1 }) as unknown[][];
      
      // Find holdings sheet (Page 7 or sheet named "Holdings")
      let holdingsSheet = workbook.Sheets['Holdings'] || workbook.Sheets['holdings'];
      if (!holdingsSheet) {
        // Try to find by looking at all sheets for the right columns
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
          if (json.length > 0) {
            const header = json[0];
            if (Array.isArray(header) && 
                (header.includes('holder_code') || header.includes('holding_type') || header.includes('realm'))) {
              holdingsSheet = sheet;
              break;
            }
          }
        }
      }
      
      const provinces: ParsedProvince[] = [];
      const holdings: ParsedHolding[] = [];
      const regentsMap = new Map<string, string>();
      const realmsSet = new Set<string>();
      
      // Parse provinces
      let currentRealm = '';
      for (let i = 1; i < provincesJson.length; i++) {
        const row = provincesJson[i];
        if (!Array.isArray(row) || row.length < 4) continue;
        
        const realm = row[0]?.toString().trim() || currentRealm;
        if (realm) currentRealm = realm;
        
        const provinceName = row[1]?.toString().trim();
        const development = parseInt(row[2]?.toString() || '0', 10);
        const magic = parseInt(row[3]?.toString() || '0', 10);
        const culture = row[4]?.toString().trim() || '';
        
        if (provinceName && currentRealm) {
          provinces.push({
            realm: currentRealm,
            name: provinceName,
            development: isNaN(development) ? 0 : development,
            magic: isNaN(magic) ? 0 : magic,
            culture,
          });
          realmsSet.add(currentRealm);
        }
      }
      
      // Parse holdings
      if (holdingsSheet) {
        const holdingsJson = XLSX.utils.sheet_to_json(holdingsSheet, { header: 1 }) as unknown[][];
        
        // Find header row
        let headerIndex = 0;
        for (let i = 0; i < Math.min(5, holdingsJson.length); i++) {
          const row = holdingsJson[i];
          if (Array.isArray(row) && 
              (row.includes('holder_code') || row.includes('holding_type') || 
               row.some(cell => cell?.toString().toLowerCase() === 'realm'))) {
            headerIndex = i;
            break;
          }
        }
        
        const header = holdingsJson[headerIndex] as string[];
        const realmIdx = header.findIndex(h => h?.toString().toLowerCase() === 'realm');
        const provinceIdx = header.findIndex(h => h?.toString().toLowerCase() === 'province');
        const typeIdx = header.findIndex(h => h?.toString().toLowerCase().includes('holding_type'));
        const codeIdx = header.findIndex(h => h?.toString().toLowerCase().includes('holder_code'));
        const nameIdx = header.findIndex(h => h?.toString().toLowerCase().includes('holder_name'));
        const levelIdx = header.findIndex(h => h?.toString().toLowerCase().includes('holding_level'));
        
        for (let i = headerIndex + 1; i < holdingsJson.length; i++) {
          const row = holdingsJson[i];
          if (!Array.isArray(row) || row.length < 6) continue;
          
          const realm = row[realmIdx]?.toString().trim();
          const province = row[provinceIdx]?.toString().trim();
          const typeRaw = row[typeIdx]?.toString().trim().toLowerCase();
          const regentCode = row[codeIdx]?.toString().trim();
          const regentName = row[nameIdx]?.toString().trim();
          const levelRaw = row[levelIdx];
          
          if (!realm || !province || !typeRaw) continue;
          
          const holdingType = HOLDING_TYPE_MAP[typeRaw];
          if (!holdingType) continue;
          
          // Parse level - handle "?" and other non-numeric values
          let level = 0;
          if (levelRaw !== undefined && levelRaw !== null && levelRaw !== '?') {
            const parsed = parseInt(levelRaw.toString(), 10);
            if (!isNaN(parsed)) level = parsed;
          }
          
          holdings.push({
            realm,
            province,
            holdingType,
            regentCode: regentCode || '',
            regentName: regentName || '',
            level,
          });
          
          if (regentCode && regentName) {
            regentsMap.set(regentCode, regentName);
          }
        }
      }
      
      const regents = Array.from(regentsMap.entries()).map(([code, name]) => ({ code, name }));
      
      setPreview({
        provinces,
        holdings,
        regents,
        realms: Array.from(realmsSet),
      });
      
      toast.success(`Arquivo processado: ${provinces.length} províncias, ${holdings.length} holdings, ${regents.length} regentes`);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar o arquivo Excel');
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    
    try {
      setIsImporting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }
      
      // Step 1: Create/update regents
      setProgressMessage('Importando regentes...');
      setProgress(10);
      
      let regentsCreated = 0;
      let regentsUpdated = 0;
      
      for (const regent of preview.regents) {
        const { data: existing } = await supabase
          .from('regents')
          .select('id')
          .eq('code', regent.code)
          .maybeSingle();
        
        if (existing) {
          await supabase
            .from('regents')
            .update({ name: regent.name, full_name: regent.name })
            .eq('id', existing.id);
          regentsUpdated++;
        } else {
          await supabase
            .from('regents')
            .insert({ 
              code: regent.code, 
              name: regent.name, 
              full_name: regent.name,
              user_id: user.id,
              gold_bars: 0,
              regency_points: 0,
              comando: 1,
              estrategia: 1,
            });
          regentsCreated++;
        }
      }
      
      // Step 2: Create/update realms
      setProgressMessage('Importando reinos...');
      setProgress(30);
      
      const realmMap = new Map<string, string>();
      
      for (const realmName of preview.realms) {
        const { data: existing } = await supabase
          .from('realms')
          .select('id')
          .eq('name', realmName)
          .maybeSingle();
        
        if (existing) {
          realmMap.set(realmName, existing.id);
        } else {
          const { data: newRealm, error } = await supabase
            .from('realms')
            .insert({ name: realmName, user_id: user.id })
            .select('id')
            .single();
          
          if (error) throw error;
          realmMap.set(realmName, newRealm.id);
        }
      }
      
      // Step 3: Create/update provinces
      setProgressMessage('Importando províncias...');
      setProgress(50);
      
      const provinceMap = new Map<string, string>();
      let provincesCreated = 0;
      let provincesUpdated = 0;
      
      for (const province of preview.provinces) {
        const realmId = realmMap.get(province.realm);
        if (!realmId) continue;
        
        const key = `${province.realm}|${province.name}`;
        
        const { data: existing } = await supabase
          .from('provinces')
          .select('id')
          .eq('name', province.name)
          .eq('realm_id', realmId)
          .maybeSingle();
        
        if (existing) {
          await supabase
            .from('provinces')
            .update({
              development: province.development,
              magic: province.magic,
              cultura: province.culture || null,
            })
            .eq('id', existing.id);
          provinceMap.set(key, existing.id);
          provincesUpdated++;
        } else {
          const { data: newProvince, error } = await supabase
            .from('provinces')
            .insert({
              name: province.name,
              realm_id: realmId,
              development: province.development,
              magic: province.magic,
              cultura: province.culture || null,
              user_id: user.id,
            })
            .select('id')
            .single();
          
          if (error) throw error;
          provinceMap.set(key, newProvince.id);
          provincesCreated++;
        }
      }
      
      // Step 4: Get regent map
      setProgressMessage('Mapeando regentes...');
      setProgress(70);
      
      const { data: allRegents } = await supabase
        .from('regents')
        .select('id, code');
      
      const regentIdMap = new Map<string, string>();
      allRegents?.forEach(r => {
        if (r.code) regentIdMap.set(r.code, r.id);
      });
      
      // Step 5: Create holdings
      setProgressMessage('Importando holdings...');
      setProgress(80);
      
      let holdingsCreated = 0;
      let holdingsSkipped = 0;
      
      for (const holding of preview.holdings) {
        const key = `${holding.realm}|${holding.province}`;
        const provinceId = provinceMap.get(key);
        
        if (!provinceId) {
          holdingsSkipped++;
          continue;
        }
        
        const regentId = holding.regentCode ? regentIdMap.get(holding.regentCode) : null;
        
        // Check if holding already exists
        const { data: existingHolding } = await supabase
          .from('holdings')
          .select('id')
          .eq('province_id', provinceId)
          .eq('holding_type', holding.holdingType)
          .eq('regent_id', regentId || '')
          .maybeSingle();
        
        if (!existingHolding) {
          const { error } = await supabase
            .from('holdings')
            .insert({
              province_id: provinceId,
              holding_type: holding.holdingType,
              regent_id: regentId,
              level: holding.level,
              user_id: user.id,
            });
          
          if (!error) holdingsCreated++;
          else holdingsSkipped++;
        } else {
          holdingsSkipped++;
        }
      }
      
      setProgress(100);
      setProgressMessage('Concluído!');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['regents'] });
      queryClient.invalidateQueries({ queryKey: ['realms'] });
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      
      toast.success(
        `Importação concluída!\n` +
        `Regentes: ${regentsCreated} criados, ${regentsUpdated} atualizados\n` +
        `Reinos: ${realmMap.size}\n` +
        `Províncias: ${provincesCreated} criadas, ${provincesUpdated} atualizadas\n` +
        `Holdings: ${holdingsCreated} criados, ${holdingsSkipped} ignorados`
      );
      
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error(`Erro na importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const getHoldingIcon = (type: HoldingType) => {
    const Icon = HOLDING_ICONS[type];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const getHoldingLabel = (type: HoldingType) => {
    const labels: Record<HoldingType, string> = {
      'ordem': 'Ordem',
      'guilda': 'Guilda',
      'templo': 'Templo',
      'fonte_magica': 'Fonte Mágica',
    };
    return labels[type];
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar Domínios Completos
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {isImporting ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{progressMessage}</p>
            <Progress value={progress} className="w-full" />
          </div>
        ) : preview ? (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Arquivo: <strong>{fileName}</strong>
            </div>
            
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <Castle className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{preview.realms.length}</div>
                <div className="text-xs text-muted-foreground">Reinos</div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <Building className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{preview.provinces.length}</div>
                <div className="text-xs text-muted-foreground">Províncias</div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <Crown className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{preview.regents.length}</div>
                <div className="text-xs text-muted-foreground">Regentes</div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <Church className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{preview.holdings.length}</div>
                <div className="text-xs text-muted-foreground">Holdings</div>
              </div>
            </div>
            
            {/* Holdings by type */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['ordem', 'guilda', 'templo', 'fonte_magica'] as HoldingType[]).map(type => (
                <Badge key={type} variant="outline" className="justify-center py-2">
                  {getHoldingIcon(type)}
                  <span className="ml-1">{getHoldingLabel(type)}: {preview.holdings.filter(h => h.holdingType === type).length}</span>
                </Badge>
              ))}
            </div>
            
            {/* Preview tables */}
            <div className="space-y-4">
              <h4 className="font-medium">Amostra de Províncias (primeiras 10)</h4>
              <div className="max-h-40 overflow-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reino</TableHead>
                      <TableHead>Província</TableHead>
                      <TableHead className="text-center">Des</TableHead>
                      <TableHead className="text-center">Mag</TableHead>
                      <TableHead>Cultura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.provinces.slice(0, 10).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.realm}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell className="text-center">{p.development}</TableCell>
                        <TableCell className="text-center">{p.magic}</TableCell>
                        <TableCell>{p.culture}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <h4 className="font-medium">Amostra de Holdings (primeiros 10)</h4>
              <div className="max-h-40 overflow-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reino</TableHead>
                      <TableHead>Província</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Regente</TableHead>
                      <TableHead className="text-center">Nível</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.holdings.slice(0, 10).map((h, i) => (
                      <TableRow key={i}>
                        <TableCell>{h.realm}</TableCell>
                        <TableCell>{h.province}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {getHoldingIcon(h.holdingType)}
                            {getHoldingLabel(h.holdingType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={h.regentName}>
                          {h.regentName || '-'}
                        </TableCell>
                        <TableCell className="text-center">{h.level}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPreview(null)}>
                Cancelar
              </Button>
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Tudo
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça upload de um arquivo Excel (.xlsx) contendo as abas de províncias e holdings.
              O arquivo deve conter:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li><strong>Aba 1:</strong> Províncias (Reino, Província, Desenvolvimento, Magia, Cultura)</li>
              <li><strong>Aba Holdings:</strong> Holdings (realm, province, holding_type, holder_code, holder_name, holding_level)</li>
            </ul>
            
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="domain-file-input"
              />
              <label
                htmlFor="domain-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Clique para selecionar um arquivo Excel
                </span>
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
