import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Download, Database, Swords, Shield, Move, Eye, Lightbulb, Cloud, Printer } from 'lucide-react';
import { 
  useMassCombatPrimaryTerrains, 
  useMassCombatSecondaryTerrains,
  useMassCombatTerrainCompatibility,
  useDeleteMassCombatPrimaryTerrain,
  useDeleteMassCombatSecondaryTerrain,
  useSeedMassCombatTerrains
} from '@/hooks/useMassCombatTerrains';
import { MassCombatPrimaryTerrain, MassCombatSecondaryTerrain, VISIBILITY_OPTIONS } from '@/types/MassCombatTerrain';
import { MassCombatTerrainHex } from './MassCombatTerrainHex';
import { MassCombatPrimaryTerrainCard } from './MassCombatPrimaryTerrainCard';
import { PrimaryTerrainEditor } from './PrimaryTerrainEditor';
import { SecondaryTerrainEditor } from './SecondaryTerrainEditor';
import { TerrainCompatibilityManager } from './TerrainCompatibilityManager';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function MassCombatTerrainList() {
  const { data: primaryTerrains = [], isLoading: loadingPrimary } = useMassCombatPrimaryTerrains();
  const { data: secondaryTerrains = [], isLoading: loadingSecondary } = useMassCombatSecondaryTerrains();
  const { data: compatibility = [] } = useMassCombatTerrainCompatibility();
  
  const deletePrimary = useDeleteMassCombatPrimaryTerrain();
  const deleteSecondary = useDeleteMassCombatSecondaryTerrain();
  const seedTerrains = useSeedMassCombatTerrains();
  
  const [editingPrimary, setEditingPrimary] = useState<MassCombatPrimaryTerrain | null>(null);
  const [editingSecondary, setEditingSecondary] = useState<MassCombatSecondaryTerrain | null>(null);
  const [primaryEditorOpen, setPrimaryEditorOpen] = useState(false);
  const [secondaryEditorOpen, setSecondaryEditorOpen] = useState(false);
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'primary' | 'secondary'; id: string; name: string } | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);

  const handlePrintPrimaryTerrains = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = primaryTerrains.map(terrain => {
      const formatMod = (v: number) => v > 0 ? `+${v}` : `${v}`;
      const getModColor = (v: number) => v > 0 ? '#16a34a' : v < 0 ? '#dc2626' : '#6b7280';
      const getModBg = (v: number) => v > 0 ? '#dcfce7' : v < 0 ? '#fee2e2' : '#f3f4f6';
      
      return `
        <div class="card">
          <div class="card-header">${terrain.name}</div>
          <div class="card-subtitle">Terreno Primário</div>
          <div class="modifiers">
            <div class="mod">
              <div class="mod-value" style="background: ${getModBg(terrain.attack_mod)}; color: ${getModColor(terrain.attack_mod)}">${formatMod(terrain.attack_mod)}</div>
              <div class="mod-label">⚔️ Ataque</div>
            </div>
            <div class="mod">
              <div class="mod-value" style="background: ${getModBg(terrain.defense_mod)}; color: ${getModColor(terrain.defense_mod)}">${formatMod(terrain.defense_mod)}</div>
              <div class="mod-label">🛡️ Defesa</div>
            </div>
            <div class="mod">
              <div class="mod-value" style="background: ${getModBg(terrain.mobility_mod)}; color: ${getModColor(terrain.mobility_mod)}">${formatMod(terrain.mobility_mod)}</div>
              <div class="mod-label">⚡ Mobilidade</div>
            </div>
          </div>
          <div class="description">${terrain.description || ''}</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartas de Terreno Primário</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
            .card { 
              width: 200px; height: 280px; 
              background: white; 
              border-radius: 12px; 
              border: 3px solid #374151;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              break-inside: avoid;
            }
            .card-header { 
              background: #374151; 
              color: white; 
              text-align: center; 
              font-size: 18px; 
              font-weight: bold; 
              padding: 12px 8px 4px;
            }
            .card-subtitle {
              background: #374151;
              color: rgba(255,255,255,0.7);
              text-align: center;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding-bottom: 8px;
            }
            .modifiers { 
              display: flex; 
              justify-content: space-around; 
              padding: 12px 8px;
              background: #fafafa;
            }
            .mod { text-align: center; }
            .mod-value { 
              width: 44px; height: 44px; 
              border-radius: 10px; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              font-size: 20px;
              font-weight: bold;
              margin: 0 auto 4px;
            }
            .mod-label { font-size: 10px; color: #666; }
            .description { 
              flex: 1;
              padding: 12px;
              font-size: 11px;
              text-align: center;
              color: #374151;
              display: flex;
              align-items: center;
              justify-content: center;
              line-height: 1.4;
              border-top: 2px dashed #e5e7eb;
              margin: 0 8px;
            }
            @media print { 
              body { background: white; padding: 0; }
              .grid { grid-template-columns: repeat(4, 1fr); gap: 8px; } 
              .card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml}</div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintSecondaryTerrains = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const getStyleColor = (style: string) => {
      switch (style) {
        case 'Ofensivo': return { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' };
        case 'Defensivo': return { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb' };
        default: return { bg: '#f5f3ff', border: '#8b5cf6', text: '#7c3aed' };
      }
    };

    const getCompatiblePrimaries = (secondaryId: string) => {
      return compatibility
        .filter(c => c.secondary_terrain_id === secondaryId)
        .map(c => primaryTerrains.find(p => p.id === c.primary_terrain_id)?.name)
        .filter(Boolean)
        .join(', ');
    };

    const cardsHtml = secondaryTerrains.map(terrain => {
      const style = (terrain as any).style || 'Versátil';
      const effectTag = (terrain as any).effect_tag;
      const colors = getStyleColor(style);
      const compatibles = getCompatiblePrimaries(terrain.id);

      return `
        <div class="card" style="border-color: ${colors.border}">
          <div class="card-header" style="background: ${colors.border}">${terrain.name}</div>
          <div class="card-subtitle" style="background: ${colors.border}">Terreno Secundário</div>
          <div class="style-badge" style="background: ${colors.bg}; color: ${colors.text}; border-color: ${colors.border}">${style}</div>
          ${effectTag ? `<div class="tag-badge">🎯 ${effectTag}</div>` : ''}
          <div class="effect">${terrain.effect_description || ''}</div>
          <div class="compatibles">
            <div class="compatibles-label">Terrenos Permitidos:</div>
            <div class="compatibles-list">${compatibles}</div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartas de Terreno Secundário</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
            .card { 
              width: 200px; height: 300px; 
              background: white; 
              border-radius: 12px; 
              border: 3px solid #374151;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              break-inside: avoid;
            }
            .card-header { 
              background: #374151; 
              color: white; 
              text-align: center; 
              font-size: 14px; 
              font-weight: bold; 
              padding: 10px 8px 4px;
            }
            .card-subtitle {
              background: #374151;
              color: rgba(255,255,255,0.7);
              text-align: center;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding-bottom: 6px;
            }
            .style-badge {
              margin: 8px auto 4px;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              border: 1px solid;
            }
            .tag-badge {
              text-align: center;
              font-size: 11px;
              color: #374151;
              padding: 4px;
            }
            .effect { 
              flex: 1;
              padding: 10px 12px;
              font-size: 11px;
              text-align: center;
              color: #374151;
              display: flex;
              align-items: center;
              justify-content: center;
              line-height: 1.4;
              font-weight: 500;
            }
            .compatibles {
              padding: 8px;
              background: #f9fafb;
              border-top: 1px dashed #e5e7eb;
            }
            .compatibles-label {
              font-size: 8px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .compatibles-list {
              font-size: 9px;
              color: #374151;
              line-height: 1.3;
            }
            @media print { 
              body { background: white; padding: 0; }
              .grid { grid-template-columns: repeat(4, 1fr); gap: 8px; } 
              .card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml}</div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSeedData = async () => {
    try {
      const result = await seedTerrains.mutateAsync();
      toast.success(`Dados carregados: ${result.primaryCount} terrenos primários, ${result.secondaryCount} secundários`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar dados');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      if (deleteConfirm.type === 'primary') {
        await deletePrimary.mutateAsync(deleteConfirm.id);
      } else {
        await deleteSecondary.mutateAsync(deleteConfirm.id);
      }
      toast.success('Terreno excluído!');
    } catch (error) {
      toast.error('Erro ao excluir terreno');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Primary terrains sheet
    const primaryData = primaryTerrains.map(t => ({
      Nome: t.name,
      Descrição: t.description || '',
      'Clima Padrão': t.default_climate,
      'Climas Permitidos': t.allowed_climates.join(', '),
      Ataque: t.attack_mod,
      Defesa: t.defense_mod,
      Mobilidade: t.mobility_mod,
      Visibilidade: t.visibility,
    }));
    const primaryWs = XLSX.utils.json_to_sheet(primaryData);
    XLSX.utils.book_append_sheet(wb, primaryWs, 'Terrenos Primários');
    
    // Secondary terrains sheet
    const secondaryData = secondaryTerrains.map(t => ({
      Nome: t.name,
      Descrição: t.description || '',
      'Efeito': t.effect_description || '',
      Ataque: t.attack_mod,
      Defesa: t.defense_mod,
      Mobilidade: t.mobility_mod,
      Estratégia: t.strategy_mod,
      'Efeitos Especiais': t.special_effects || '',
      Universal: t.is_universal ? 'Sim' : 'Não',
      'Terrenos Compatíveis': getCompatiblePrimaryNames(t.id).join(', '),
    }));
    const secondaryWs = XLSX.utils.json_to_sheet(secondaryData);
    XLSX.utils.book_append_sheet(wb, secondaryWs, 'Terrenos Secundários');
    
    XLSX.writeFile(wb, 'terrenos_combate_em_massa.xlsx');
    toast.success('Exportado para Excel!');
  };

  const getCompatiblePrimaryNames = (secondaryId: string): string[] => {
    const compatiblePrimaryIds = compatibility
      .filter(c => c.secondary_terrain_id === secondaryId)
      .map(c => c.primary_terrain_id);
    
    return primaryTerrains
      .filter(p => compatiblePrimaryIds.includes(p.id))
      .map(p => p.name);
  };

  const getCompatibleSecondaryTerrains = (primaryId: string): MassCombatSecondaryTerrain[] => {
    const compatibleSecondaryIds = compatibility
      .filter(c => c.primary_terrain_id === primaryId)
      .map(c => c.secondary_terrain_id);
    
    return secondaryTerrains.filter(
      s => s.is_universal || compatibleSecondaryIds.includes(s.id)
    );
  };

  const formatMod = (value: number) => {
    if (value === 0) return '0';
    return value > 0 ? `+${value}` : `${value}`;
  };

  if (loadingPrimary || loadingSecondary) {
    return <div className="p-8 text-center text-muted-foreground">Carregando terrenos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-2">
        {primaryTerrains.length === 0 && secondaryTerrains.length === 0 && (
          <Button onClick={handleSeedData} disabled={seedTerrains.isPending}>
            <Database className="w-4 h-4 mr-2" />
            Carregar Dados Iniciais
          </Button>
        )}
        <Button onClick={handlePrintPrimaryTerrains} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Primários
        </Button>
        <Button onClick={handlePrintSecondaryTerrains} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Secundários
        </Button>
        <Button onClick={handleExportExcel} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
        <Button onClick={() => setCompatibilityOpen(true)} variant="outline">
          Gerenciar Compatibilidade
        </Button>
      </div>

      <Tabs defaultValue="primary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="primary">Terrenos Primários ({primaryTerrains.length})</TabsTrigger>
          <TabsTrigger value="secondary">Terrenos Secundários ({secondaryTerrains.length})</TabsTrigger>
        </TabsList>
        
        {/* Primary Terrains */}
        <TabsContent value="primary" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingPrimary(null); setPrimaryEditorOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Terreno Primário
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {primaryTerrains.map(terrain => (
              <Card key={terrain.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <MassCombatTerrainHex terrain={terrain} type="primary" size="sm" showModifiers={false} />
                      <div>
                        <CardTitle className="text-lg">{terrain.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">{terrain.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingPrimary(terrain); setPrimaryEditorOpen(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm({ type: 'primary', id: terrain.id, name: terrain.name })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Modifiers */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="gap-1">
                      <Swords className="w-3 h-3" />
                      {formatMod(terrain.attack_mod)}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="w-3 h-3" />
                      {formatMod(terrain.defense_mod)}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Move className="w-3 h-3" />
                      {formatMod(terrain.mobility_mod)}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Eye className="w-3 h-3" />
                      {VISIBILITY_OPTIONS.find(v => v.value === terrain.visibility)?.label || terrain.visibility}
                    </Badge>
                  </div>
                  
                  {/* Climate info */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Cloud className="w-3 h-3" />
                      <span>Padrão: {terrain.default_climate}</span>
                    </div>
                    {terrain.allowed_climates.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {terrain.allowed_climates.map(climate => (
                          <Badge key={climate} variant="outline" className="text-xs">
                            {climate}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Compatible secondary terrains */}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Terrenos secundários compatíveis:</p>
                    <div className="flex flex-wrap gap-1">
                      {getCompatibleSecondaryTerrains(terrain.id).slice(0, 5).map(sec => (
                        <Badge key={sec.id} variant="outline" className="text-xs">
                          {sec.name}
                        </Badge>
                      ))}
                      {getCompatibleSecondaryTerrains(terrain.id).length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{getCompatibleSecondaryTerrains(terrain.id).length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Secondary Terrains */}
        <TabsContent value="secondary" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingSecondary(null); setSecondaryEditorOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Terreno Secundário
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {secondaryTerrains.map(terrain => (
              <Card key={terrain.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <MassCombatTerrainHex terrain={terrain} type="secondary" size="sm" showModifiers={false} />
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{terrain.name}</CardTitle>
                          {terrain.is_universal && (
                            <Badge variant="default" className="text-xs">Universal</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{terrain.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setEditingSecondary(terrain); setSecondaryEditorOpen(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm({ type: 'secondary', id: terrain.id, name: terrain.name })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Effect description */}
                  {terrain.effect_description && (
                    <p className="text-sm font-medium text-primary mb-2">{terrain.effect_description}</p>
                  )}
                  
                  {/* Modifiers */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {terrain.attack_mod !== 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Swords className="w-3 h-3" />
                        {formatMod(terrain.attack_mod)}
                      </Badge>
                    )}
                    {terrain.defense_mod !== 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="w-3 h-3" />
                        {formatMod(terrain.defense_mod)}
                      </Badge>
                    )}
                    {terrain.mobility_mod !== 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Move className="w-3 h-3" />
                        {formatMod(terrain.mobility_mod)}
                      </Badge>
                    )}
                    {terrain.strategy_mod !== 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {formatMod(terrain.strategy_mod)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Special effects */}
                  {terrain.special_effects && (
                    <p className="text-xs text-muted-foreground italic">{terrain.special_effects}</p>
                  )}
                  
                  {/* Compatible primary terrains */}
                  {!terrain.is_universal && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Compatível com:</p>
                      <div className="flex flex-wrap gap-1">
                        {getCompatiblePrimaryNames(terrain.id).map(name => (
                          <Badge key={name} variant="outline" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Editors */}
      <PrimaryTerrainEditor
        terrain={editingPrimary}
        open={primaryEditorOpen}
        onOpenChange={setPrimaryEditorOpen}
      />
      
      <SecondaryTerrainEditor
        terrain={editingSecondary}
        open={secondaryEditorOpen}
        onOpenChange={setSecondaryEditorOpen}
      />
      
      <TerrainCompatibilityManager
        open={compatibilityOpen}
        onOpenChange={setCompatibilityOpen}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o terreno "{deleteConfirm?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
