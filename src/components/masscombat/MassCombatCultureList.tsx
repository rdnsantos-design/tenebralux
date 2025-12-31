import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  useMassCombatCultures, 
  useCreateMassCombatCulture, 
  useUpdateMassCombatCulture, 
  useDeleteMassCombatCulture 
} from '@/hooks/useMassCombatCultures';
import { MassCombatCultureCardPreview } from './MassCombatCultureCardPreview';
import { MassCombatCultureEditor } from './MassCombatCultureEditor';
import { MassCombatCulture } from '@/types/combat/mass-combat-culture';
import { Plus, Printer, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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

export function MassCombatCultureList() {
  const { data: cultures = [], isLoading } = useMassCombatCultures();
  const createCulture = useCreateMassCombatCulture();
  const updateCulture = useUpdateMassCombatCulture();
  const deleteCulture = useDeleteMassCombatCulture();
  
  const [editingCulture, setEditingCulture] = useState<MassCombatCulture | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleSave = async (data: Omit<MassCombatCulture, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingCulture) {
        await updateCulture.mutateAsync({ id: editingCulture.id, ...data });
        toast.success('Cultura atualizada com sucesso!');
      } else {
        await createCulture.mutateAsync(data);
        toast.success('Cultura criada com sucesso!');
      }
      setEditingCulture(null);
      setIsCreating(false);
    } catch (error) {
      toast.error('Erro ao salvar cultura');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCulture.mutateAsync(deleteConfirm);
      toast.success('Cultura excluída com sucesso!');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erro ao excluir cultura');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const getCultureColor = (name: string) => {
      switch (name) {
        case 'Anuire': return { bg: '#fef3c7', border: '#d97706', header: '#b45309', text: '#92400e' };
        case 'Khinasi': return { bg: '#ffedd5', border: '#ea580c', header: '#c2410c', text: '#9a3412' };
        case 'Vos': return { bg: '#fee2e2', border: '#dc2626', header: '#b91c1c', text: '#991b1b' };
        case 'Brecht': return { bg: '#dbeafe', border: '#2563eb', header: '#1d4ed8', text: '#1e40af' };
        case 'Rjurik': return { bg: '#dcfce7', border: '#16a34a', header: '#15803d', text: '#166534' };
        default: return { bg: '#f3f4f6', border: '#6b7280', header: '#4b5563', text: '#374151' };
      }
    };

    const getTerrainIcon = (terrain: string) => {
      switch (terrain) {
        case 'Planície': return '🌾';
        case 'Desértico': return '☀️';
        case 'Ártico': return '❄️';
        case 'Alagado': return '💧';
        case 'Floresta': return '🌲';
        default: return '🏔️';
      }
    };

    const getSeasonIcon = (season: string) => {
      switch (season) {
        case 'Primavera': return '🌸';
        case 'Verão': return '🔥';
        case 'Outono': return '🍂';
        case 'Inverno': return '❄️';
        default: return '🌤️';
      }
    };

    const getSpecIcon = (spec: string) => {
      switch (spec) {
        case 'Cavalaria': return '🐴';
        case 'Infantaria': return '🛡️';
        case 'Arqueria': return '🏹';
        default: return '⚔️';
      }
    };

    const cardsHtml = cultures.map(culture => {
      const colors = getCultureColor(culture.name);
      return `
        <div class="card" style="border-color: ${colors.border}; background: ${colors.bg}">
          <div class="card-header" style="background: ${colors.header}">
            <h3>${culture.name}</h3>
            <span class="subtitle">Cultura de Cerith</span>
          </div>
          
          <div class="affinities">
            <div class="affinity-row">
              <div class="affinity-item">
                <span class="affinity-icon">${getTerrainIcon(culture.terrain_affinity)}</span>
                <div class="affinity-content">
                  <span class="affinity-label">Terreno</span>
                  <span class="affinity-value" style="color: ${colors.text}">${culture.terrain_affinity}</span>
                </div>
              </div>
              <div class="affinity-item">
                <span class="affinity-icon">${getSeasonIcon(culture.season_affinity)}</span>
                <div class="affinity-content">
                  <span class="affinity-label">Estação</span>
                  <span class="affinity-value" style="color: ${colors.text}">${culture.season_affinity}</span>
                </div>
              </div>
              <div class="affinity-item">
                <span class="affinity-icon">${getSpecIcon(culture.specialization)}</span>
                <div class="affinity-content">
                  <span class="affinity-label">Especialização</span>
                  <span class="affinity-value" style="color: ${colors.text}">${culture.specialization}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="ability">
            <div class="ability-header" style="background: ${colors.header}20; border-color: ${colors.border}">
              <span class="tap-icon">⟳</span>
              <span>Habilidade Especial</span>
            </div>
            <div class="ability-text" style="border-color: ${colors.border}40">${culture.special_ability}</div>
          </div>
          
          <div class="footer" style="background: ${colors.header}">
            Combate em Massa
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartas de Cultura - Combate em Massa</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #f0f0f0; }
            .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
            .card { 
              width: 200px; 
              min-height: 320px;
              border-radius: 12px; 
              border: 3px solid;
              overflow: hidden; 
              break-inside: avoid;
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .card-header { 
              padding: 16px 12px 8px;
              text-align: center;
              color: white;
            }
            .card-header h3 { 
              font-size: 22px; 
              font-weight: bold;
              margin: 0;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            .card-header .subtitle {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.8;
            }
            .affinities { 
              padding: 12px 8px;
            }
            .affinity-row {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .affinity-item { 
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 6px 8px;
              background: rgba(255,255,255,0.7);
              border-radius: 6px;
            }
            .affinity-icon {
              font-size: 18px;
              width: 28px;
              text-align: center;
            }
            .affinity-content {
              display: flex;
              flex-direction: column;
            }
            .affinity-label { 
              font-size: 8px; 
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .affinity-value { 
              font-size: 12px; 
              font-weight: 600;
            }
            .ability { 
              flex: 1;
              padding: 8px;
              display: flex;
              flex-direction: column;
            }
            .ability-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: 6px;
              border-radius: 6px 6px 0 0;
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid;
              border-bottom: none;
            }
            .tap-icon {
              font-size: 14px;
            }
            .ability-text { 
              flex: 1;
              padding: 10px;
              background: white;
              border-radius: 0 0 6px 6px;
              font-size: 10px;
              text-align: center;
              line-height: 1.5;
              border: 1px solid;
              border-top: none;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .footer {
              padding: 6px;
              text-align: center;
              color: white;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            @media print { 
              body { background: white; padding: 0; }
              .grid { grid-template-columns: repeat(5, 1fr); gap: 10px; } 
              .card { box-shadow: none; }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isCreating || editingCulture) {
    return (
      <MassCombatCultureEditor
        culture={editingCulture || undefined}
        onSave={handleSave}
        onCancel={() => {
          setIsCreating(false);
          setEditingCulture(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Cultura
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Cartas
        </Button>
      </div>

      {/* Cards Grid */}
      <div ref={printRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cultures.map((culture) => (
          <div key={culture.id} className="relative group">
            <MassCombatCultureCardPreview culture={culture} />
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={() => setEditingCulture(culture)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-7 w-7"
                onClick={() => setDeleteConfirm(culture.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {cultures.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma cultura cadastrada. Clique em "Nova Cultura" para começar.
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta cultura? Esta ação não pode ser desfeita.
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
