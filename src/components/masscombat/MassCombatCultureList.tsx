import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useMassCombatCultures } from '@/hooks/useMassCombatCultures';
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
  const { cultures, loading, createCulture, updateCulture, deleteCulture } = useMassCombatCultures();
  const [editingCulture, setEditingCulture] = useState<MassCombatCulture | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleSave = async (data: Omit<MassCombatCulture, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingCulture) {
        await updateCulture(editingCulture.id, data);
        toast.success('Cultura atualizada com sucesso!');
      } else {
        await createCulture(data);
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
      await deleteCulture(deleteConfirm);
      toast.success('Cultura excluída com sucesso!');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erro ao excluir cultura');
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartas de Cultura - Combate em Massa</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
            .card { border: 2px solid #ccc; border-radius: 8px; overflow: hidden; break-inside: avoid; }
            .header { padding: 16px; border-bottom: 1px solid #eee; background: #f9f9f9; }
            .header h3 { font-size: 18px; font-weight: bold; text-align: center; }
            .affinities { padding: 16px; border-bottom: 1px solid #eee; }
            .affinities h4 { font-size: 10px; text-transform: uppercase; text-align: center; margin-bottom: 12px; color: #666; }
            .affinity-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
            .affinity-item { text-align: center; padding: 8px; background: #f5f5f5; border-radius: 4px; }
            .affinity-label { font-size: 9px; color: #888; display: block; }
            .affinity-value { font-size: 11px; font-weight: 500; }
            .ability { padding: 16px; }
            .ability h4 { font-size: 10px; text-transform: uppercase; text-align: center; margin-bottom: 8px; color: #666; }
            .ability-text { padding: 12px; background: #f9f9f9; border-radius: 4px; font-size: 11px; text-align: center; line-height: 1.4; }
            @media print { .grid { grid-template-columns: repeat(2, 1fr); } }
          </style>
        </head>
        <body>
          <div class="grid">
            ${cultures.map(culture => `
              <div class="card">
                <div class="header"><h3>${culture.name}</h3></div>
                <div class="affinities">
                  <h4>Afinidades</h4>
                  <div class="affinity-grid">
                    <div class="affinity-item">
                      <span class="affinity-label">Terreno</span>
                      <span class="affinity-value">${culture.terrain_affinity}</span>
                    </div>
                    <div class="affinity-item">
                      <span class="affinity-label">Estação</span>
                      <span class="affinity-value">${culture.season_affinity}</span>
                    </div>
                    <div class="affinity-item">
                      <span class="affinity-label">Especialização</span>
                      <span class="affinity-value">${culture.specialization}</span>
                    </div>
                  </div>
                </div>
                <div class="ability">
                  <h4>Habilidade Especial</h4>
                  <div class="ability-text">${culture.special_ability}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
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
