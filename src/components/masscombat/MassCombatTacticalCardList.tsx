import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MassCombatTacticalCard, 
  MassCombatUnitType,
  MASS_COMBAT_UNIT_TYPES 
} from '@/types/MassCombatTacticalCard';
import { useMassCombatTacticalCards } from '@/hooks/useMassCombatTacticalCards';
import { MassCombatTacticalCardPreview } from './MassCombatTacticalCardPreview';
import { MassCombatTacticalCardEditor } from './MassCombatTacticalCardEditor';
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Download, 
  Edit, 
  Copy, 
  Trash2, 
  Loader2,
  Filter,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';

const UNIT_TYPE_COLORS: Record<string, { primary: string; secondary: string; text: string }> = {
  Infantaria: { primary: '#ea580c', secondary: '#fed7aa', text: '#9a3412' },
  Cavalaria: { primary: '#d97706', secondary: '#fef3c7', text: '#92400e' },
  Arqueiros: { primary: '#16a34a', secondary: '#dcfce7', text: '#166534' },
  Arqueria: { primary: '#16a34a', secondary: '#dcfce7', text: '#166534' },
  Cerco: { primary: '#78716c', secondary: '#e7e5e4', text: '#44403c' },
  Geral: { primary: '#9333ea', secondary: '#f3e8ff', text: '#6b21a8' },
  Genérica: { primary: '#9333ea', secondary: '#f3e8ff', text: '#6b21a8' },
  Terreno: { primary: '#059669', secondary: '#d1fae5', text: '#065f46' },
  Estação: { primary: '#0284c7', secondary: '#e0f2fe', text: '#075985' },
};
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

export function MassCombatTacticalCardList() {
  const { cards, loading, createCard, updateCard, deleteCard, duplicateCard } = useMassCombatTacticalCards();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnitType, setFilterUnitType] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<MassCombatTacticalCard | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterUnitType === 'all' || card.unit_type === filterUnitType;
    return matchesSearch && matchesType;
  });

  const handleCreateNew = () => {
    setEditingCard(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (card: MassCombatTacticalCard) => {
    setEditingCard(card);
    setIsEditorOpen(true);
  };

  const handleSave = async (cardData: Omit<MassCombatTacticalCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingCard) {
        await updateCard(editingCard.id, cardData);
      } else {
        await createCard(cardData);
      }
      setIsEditorOpen(false);
      setEditingCard(undefined);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDuplicate = async (card: MassCombatTacticalCard) => {
    await duplicateCard(card);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteCard(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let imported = 0;
        for (const row of jsonData as Record<string, unknown>[]) {
          const cardData: Omit<MassCombatTacticalCard, 'id' | 'created_at' | 'updated_at'> = {
            name: String(row['Nome'] || row['name'] || ''),
            unit_type: (row['Tipo de Unidade'] || row['unit_type'] || 'Geral') as MassCombatUnitType,
            attack_bonus: Number(row['Bônus em Ataque'] || row['attack_bonus'] || 0),
            defense_bonus: Number(row['Bônus em Defesa'] || row['defense_bonus'] || 0),
            mobility_bonus: Number(row['Bônus em Mobilidade'] || row['mobility_bonus'] || 0),
            attack_penalty: Number(row['Penalidade em Ataque'] || row['attack_penalty'] || 0),
            defense_penalty: Number(row['Penalidade em Defesa'] || row['defense_penalty'] || 0),
            mobility_penalty: Number(row['Penalidade em Mobilidade'] || row['mobility_penalty'] || 0),
            command_required: Number(row['Comando Necessário'] || row['command_required'] || 1),
            strategy_required: Number(row['Estratégia Requerida'] || row['strategy_required'] || 1),
            culture: String(row['Cultura'] || row['culture'] || '') || undefined,
            description: String(row['Descrição'] || row['description'] || '') || undefined,
            minor_effect: String(row['Efeito Menor'] || row['minor_effect'] || '') || undefined,
            major_effect: String(row['Efeito Maior'] || row['major_effect'] || '') || undefined,
            minor_condition: String(row['Condição Menor'] || row['minor_condition'] || '') || undefined,
            major_condition: String(row['Condição Maior'] || row['major_condition'] || '') || undefined,
            vet_cost: Number(row['Custo VET'] || row['vet_cost'] || 0),
            vet_cost_override: row['VET Manual'] !== undefined ? Number(row['VET Manual']) : null,
          };

          if (cardData.name) {
            await createCard(cardData);
            imported++;
          }
        }

        toast.success(`${imported} cartas importadas com sucesso!`);
      } catch (error) {
        toast.error('Erro ao importar arquivo Excel');
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  };

  const handlePrintCards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão');
      return;
    }

    const cardsHtml = filteredCards.map(card => {
      const colors = UNIT_TYPE_COLORS[card.unit_type] || UNIT_TYPE_COLORS.Geral;
      
      const hasAnyBonus = card.attack_bonus > 0 || card.defense_bonus > 0 || card.mobility_bonus > 0;
      const hasAnyPenalty = card.attack_penalty > 0 || card.defense_penalty > 0 || card.mobility_penalty > 0;
      const hasEffectsOrConditions = card.minor_effect || card.major_effect || card.minor_condition || card.major_condition;
      
      const formatAttr = (bonus: number, penalty: number) => {
        if (bonus > 0 && penalty > 0) return `<span class="bonus">+${bonus}</span> / <span class="penalty">-${penalty}</span>`;
        if (bonus > 0) return `<span class="bonus">+${bonus}</span>`;
        if (penalty > 0) return `<span class="penalty">-${penalty}</span>`;
        return '<span class="neutral">-</span>';
      };
      
      return `
        <div class="card">
          <div class="card-header" style="background: linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd);">
            <div class="unit-type-badge">${card.unit_type}</div>
            <div class="vet-badge">VET ${card.vet_cost}</div>
          </div>
          
          <div class="card-name">${card.name}</div>
          
          ${(hasAnyBonus || hasAnyPenalty) ? `
          <div class="attributes-section">
            <div class="attr-grid">
              <div class="attr-item">
                <span class="attr-icon">⚔️</span>
                <span class="attr-label">ATQ</span>
                <span class="attr-value">${formatAttr(card.attack_bonus, card.attack_penalty)}</span>
              </div>
              <div class="attr-item">
                <span class="attr-icon">🛡️</span>
                <span class="attr-label">DEF</span>
                <span class="attr-value">${formatAttr(card.defense_bonus, card.defense_penalty)}</span>
              </div>
              <div class="attr-item">
                <span class="attr-icon">⚡</span>
                <span class="attr-label">MOB</span>
                <span class="attr-value">${formatAttr(card.mobility_bonus, card.mobility_penalty)}</span>
              </div>
            </div>
          </div>
          ` : ''}
          
          ${hasEffectsOrConditions ? `
          <div class="effects-conditions-section">
            <div class="section-title">⭐ Efeitos e Condições</div>
            ${card.minor_effect ? `<div class="effect-item"><span class="effect-label-small">Efeito Menor:</span> ${card.minor_effect}</div>` : ''}
            ${card.major_effect ? `<div class="effect-item major"><span class="effect-label-small">Efeito Maior:</span> ${card.major_effect}</div>` : ''}
            ${card.minor_condition ? `<div class="condition-item"><span class="condition-icon">⚠️</span> ${card.minor_condition}</div>` : ''}
            ${card.major_condition ? `<div class="condition-item major"><span class="condition-icon">🔺</span> ${card.major_condition}</div>` : ''}
          </div>
          ` : ''}
          
          ${card.description ? `
          <div class="description-section">
            <div class="description-text">${card.description}</div>
          </div>
          ` : ''}
          
          <div class="requirements-footer">
            <div class="req-item">
              <span class="req-icon">👑</span>
              <span>Comando <strong>${card.command_required}</strong></span>
            </div>
            ${card.culture ? `
            <div class="req-item">
              <span class="req-icon">🌍</span>
              <span><strong>${card.culture}</strong></span>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cartas de Combate Estratégico</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #f8f9fa;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            border-radius: 12px;
          }
          
          .header h1 {
            font-size: 28px;
            margin-bottom: 5px;
          }
          
          .header p {
            opacity: 0.8;
            font-size: 14px;
          }
          
          .cards-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            max-width: 1000px;
            margin: 0 auto;
          }
          
          .card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            break-inside: avoid;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
          }
          
          .card-header {
            padding: 10px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
          }
          
          .unit-type-badge {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: rgba(255,255,255,0.2);
            padding: 4px 10px;
            border-radius: 20px;
          }
          
          .vet-badge {
            font-size: 11px;
            font-weight: 700;
            background: rgba(0,0,0,0.3);
            padding: 4px 10px;
            border-radius: 20px;
          }
          
          .card-name {
            padding: 10px 12px;
            text-align: center;
            font-size: 13px;
            font-weight: 700;
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .attributes-section {
            padding: 8px 10px;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .attr-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            text-align: center;
          }
          
          .attr-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          }
          
          .attr-icon {
            font-size: 10px;
          }
          
          .attr-label {
            font-size: 8px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .attr-value {
            font-size: 11px;
            font-weight: 700;
          }
          
          .bonus {
            color: #059669;
          }
          
          .penalty {
            color: #dc2626;
          }
          
          .neutral {
            color: #9ca3af;
          }
          
          .effects-conditions-section {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
            background: #fffbeb;
          }
          
          .section-title {
            font-size: 9px;
            font-weight: 700;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          
          .effect-item {
            font-size: 9px;
            color: #374151;
            margin-bottom: 4px;
            line-height: 1.4;
          }
          
          .effect-item.major {
            color: #1f2937;
            font-weight: 500;
          }
          
          .effect-label-small {
            color: #d97706;
            font-weight: 600;
          }
          
          .condition-item {
            font-size: 9px;
            color: #6b7280;
            margin-bottom: 4px;
            line-height: 1.4;
            display: flex;
            align-items: flex-start;
            gap: 4px;
          }
          
          .condition-item.major {
            color: #991b1b;
          }
          
          .condition-icon {
            font-size: 8px;
          }
          
          .description-section {
            padding: 10px 12px;
            flex: 1;
          }
          
          .description-text {
            font-size: 10px;
            color: #6b7280;
            text-align: center;
            line-height: 1.5;
            font-style: italic;
          }
          
          .requirements-footer {
            background: #f3f4f6;
            padding: 8px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #e5e7eb;
            margin-top: auto;
          }
          
          .req-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            color: #4b5563;
          }
          
          .req-icon {
            font-size: 10px;
          }
          
          .req-item strong {
            color: #1f2937;
          }
          
          @media print {
            body {
              background: white;
              padding: 10px;
            }
            
            .header {
              margin-bottom: 15px;
              padding: 12px;
            }
            
            .header h1 {
              font-size: 22px;
            }
            
            .cards-grid {
              gap: 12px;
            }
            
            .card {
              box-shadow: none;
              border: 1px solid #d1d5db;
            }
          }
          
          @page {
            size: A4;
            margin: 8mm;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚔️ Cartas de Combate Estratégico</h1>
          <p>${filteredCards.length} cartas para impressão</p>
        </div>
        <div class="cards-grid">
          ${cardsHtml}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportExcel = () => {
    const exportData = cards.map(card => ({
      'Nome': card.name,
      'Tipo de Unidade': card.unit_type,
      'Bônus em Ataque': card.attack_bonus,
      'Bônus em Defesa': card.defense_bonus,
      'Bônus em Mobilidade': card.mobility_bonus,
      'Penalidade em Ataque': card.attack_penalty || 0,
      'Penalidade em Defesa': card.defense_penalty || 0,
      'Penalidade em Mobilidade': card.mobility_penalty || 0,
      'Efeito Menor': card.minor_effect || '',
      'Efeito Maior': card.major_effect || '',
      'Condição Menor': card.minor_condition || '',
      'Condição Maior': card.major_condition || '',
      'Comando Necessário': card.command_required,
      'Cultura': card.culture || '',
      'Descrição': card.description || '',
      'Custo VET': card.vet_cost,
      'VET Manual': card.vet_cost_override ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cartas Táticas');
    XLSX.writeFile(workbook, 'cartas_taticas_combate_massa.xlsx');
    toast.success('Cartas exportadas com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEditorOpen) {
    return (
      <MassCombatTacticalCardEditor
        card={editingCard}
        onSave={handleSave}
        onCancel={() => {
          setIsEditorOpen(false);
          setEditingCard(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cartas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterUnitType} onValueChange={setFilterUnitType}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {MASS_COMBAT_UNIT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={cards.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={handlePrintCards} disabled={filteredCards.length === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Carta
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {cards.length === 0 ? (
            <p>Nenhuma carta tática criada. Clique em "Nova Carta" ou importe um Excel.</p>
          ) : (
            <p>Nenhuma carta encontrada com os filtros aplicados.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map(card => (
            <div key={card.id} className="group relative">
              <MassCombatTacticalCardPreview card={card} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => handleEdit(card)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => handleDuplicate(card)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => setDeleteConfirmId(card.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir carta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A carta será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
