import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Shield, Swords, Crown, Printer, Target } from 'lucide-react';
import { useMassCombatCommanderTemplates, MassCombatCommanderTemplate } from '@/hooks/useMassCombatCommanderTemplates';
import { toast } from 'sonner';

const ESPECIALIZATIONS = [
  'Arqueria',
  'Infantaria',
  'Cavalaria',
  'Inf + Arq',
  'Inf + Cav',
  'Arq + Cav',
  'Cerco',
  'Magia'
];

const SPEC_COLORS: Record<string, string> = {
  'Arqueria': 'bg-green-600',
  'Infantaria': 'bg-blue-600',
  'Cavalaria': 'bg-amber-600',
  'Inf + Arq': 'bg-teal-600',
  'Inf + Cav': 'bg-purple-600',
  'Arq + Cav': 'bg-orange-600',
  'Cerco': 'bg-gray-600',
  'Magia': 'bg-violet-600'
};

export function MassCombatCommanderTemplateList() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useMassCombatCommanderTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MassCombatCommanderTemplate | null>(null);
  const [formData, setFormData] = useState({
    numero: 0,
    comando: 1,
    estrategia: 1,
    guarda: 2,
    especializacao: 'Infantaria',
    custo_vet: 4
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
      } else {
        await createTemplate(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      numero: templates.length + 1,
      comando: 1,
      estrategia: 1,
      guarda: 2,
      especializacao: 'Infantaria',
      custo_vet: 4
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: MassCombatCommanderTemplate) => {
    setEditingTemplate(template);
    setFormData({
      numero: template.numero,
      comando: template.comando,
      estrategia: template.estrategia,
      guarda: template.guarda,
      especializacao: template.especializacao,
      custo_vet: template.custo_vet
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este template?')) {
      await deleteTemplate(id);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão');
      return;
    }

    const cardsHtml = templates.map(template => {
      const specColor = SPEC_COLORS[template.especializacao] || 'bg-gray-600';
      const colorHex = {
        'bg-green-600': '#16a34a',
        'bg-blue-600': '#2563eb',
        'bg-amber-600': '#d97706',
        'bg-teal-600': '#0d9488',
        'bg-purple-600': '#9333ea',
        'bg-orange-600': '#ea580c',
        'bg-gray-600': '#4b5563',
        'bg-violet-600': '#7c3aed'
      }[specColor] || '#4b5563';

      return `
        <div class="card" style="border-color: ${colorHex};">
          <div class="card-header" style="background: linear-gradient(135deg, ${colorHex}, ${colorHex}dd);">
            <div class="card-number">#${template.numero}</div>
            <div class="card-spec">${template.especializacao}</div>
          </div>
          <div class="card-body">
            <div class="stat-row">
              <div class="stat">
                <div class="stat-icon">👑</div>
                <div class="stat-label">CMD</div>
                <div class="stat-value">${template.comando}</div>
              </div>
              <div class="stat">
                <div class="stat-icon">🎯</div>
                <div class="stat-label">ESTR</div>
                <div class="stat-value">${template.estrategia}</div>
              </div>
              <div class="stat">
                <div class="stat-icon">🛡️</div>
                <div class="stat-label">GUARDA</div>
                <div class="stat-value">${template.guarda}</div>
              </div>
            </div>
          </div>
          <div class="card-footer" style="background-color: ${colorHex};">
            <div class="vet-cost">
              <span class="vet-label">Custo VET:</span>
              <span class="vet-value">${template.custo_vet}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comandantes - Custo VET</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #f5f5f5;
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
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { opacity: 0.8; }
          .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            overflow: hidden;
            border: 3px solid;
            break-inside: avoid;
          }
          .card-header {
            padding: 15px;
            color: white;
            text-align: center;
          }
          .card-number {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          .card-spec {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .card-body {
            padding: 20px 15px;
          }
          .stat-row {
            display: flex;
            justify-content: space-around;
          }
          .stat {
            text-align: center;
          }
          .stat-icon {
            font-size: 20px;
            margin-bottom: 5px;
          }
          .stat-label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 3px;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
          }
          .card-footer {
            padding: 12px;
            color: white;
            text-align: center;
          }
          .vet-cost {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .vet-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .vet-value {
            font-size: 24px;
            font-weight: bold;
          }
          @media print {
            body { background: white; padding: 10px; }
            .header { break-after: avoid; }
            .cards-grid { gap: 15px; }
            .card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚔️ Comandantes de Campo</h1>
          <p>Fase de Construção de Exército - Custo em VET</p>
        </div>
        <div class="cards-grid">
          ${cardsHtml}
        </div>
        <script>
          setTimeout(() => window.print(), 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Comandantes Compráveis (VET)
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Editar Template' : 'Novo Template de Comandante'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      type="number"
                      min="1"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especializacao">Especialização</Label>
                    <Select
                      value={formData.especializacao}
                      onValueChange={(value) => setFormData({ ...formData, especializacao: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESPECIALIZATIONS.map(spec => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="comando">Comando</Label>
                    <Input
                      id="comando"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.comando}
                      onChange={(e) => setFormData({ ...formData, comando: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estrategia">Estratégia</Label>
                    <Input
                      id="estrategia"
                      type="number"
                      min="0"
                      max="5"
                      value={formData.estrategia}
                      onChange={(e) => setFormData({ ...formData, estrategia: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guarda">Guarda</Label>
                    <Input
                      id="guarda"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.guarda}
                      onChange={(e) => setFormData({ ...formData, guarda: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_vet">Custo VET</Label>
                  <Input
                    id="custo_vet"
                    type="number"
                    min="1"
                    value={formData.custo_vet}
                    onChange={(e) => setFormData({ ...formData, custo_vet: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTemplate ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Nº</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Crown className="h-4 w-4" /> CMD
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" /> ESTR
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" /> GUARDA
                </div>
              </TableHead>
              <TableHead>Especialização</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Swords className="h-4 w-4" /> Custo VET
                </div>
              </TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">#{template.numero}</TableCell>
                <TableCell>
                  <Badge variant="outline">{template.comando}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{template.estrategia}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{template.guarda}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${SPEC_COLORS[template.especializacao] || 'bg-gray-600'} text-white`}>
                    {template.especializacao}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-bold">
                    {template.custo_vet} VET
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {templates.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum template de comandante cadastrado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
