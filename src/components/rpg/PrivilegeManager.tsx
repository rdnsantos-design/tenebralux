import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Gift, 
  AlertTriangle,
  Coins,
  GraduationCap,
  Dna,
  Users,
  Sparkles,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  PRIVILEGE_CATEGORIES, 
  PRIVILEGES, 
  PrivilegeDefinition,
  ChallengeDefinition,
  getPrivilegesByCategory 
} from '@/data/character/privileges';

// Mapeamento de ícones
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  recursos: Coins,
  educacao: GraduationCap,
  genetica: Dna,
  conexoes: Users,
  talento: Sparkles,
};

interface PrivilegeFormData {
  name: string;
  category: string;
  description: string;
  effect: string;
  challenges: [
    { id: string; name: string; description: string; effect: string },
    { id: string; name: string; description: string; effect: string }
  ];
}

const EMPTY_FORM: PrivilegeFormData = {
  name: '',
  category: '',
  description: '',
  effect: '',
  challenges: [
    { id: '', name: '', description: '', effect: '' },
    { id: '', name: '', description: '', effect: '' }
  ]
};

export function PrivilegeManager() {
  const [privileges, setPrivileges] = useState<PrivilegeDefinition[]>(PRIVILEGES);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrivilegeFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (privilege: PrivilegeDefinition) => {
    setEditingId(privilege.id);
    setFormData({
      name: privilege.name,
      category: privilege.category,
      description: privilege.description,
      effect: privilege.effect || '',
      challenges: [
        {
          id: privilege.challenges[0].id,
          name: privilege.challenges[0].name,
          description: privilege.challenges[0].description,
          effect: privilege.challenges[0].effect || '',
        },
        {
          id: privilege.challenges[1].id,
          name: privilege.challenges[1].name,
          description: privilege.challenges[1].description,
          effect: privilege.challenges[1].effect || '',
        }
      ]
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validação
    if (!formData.name.trim() || !formData.category || !formData.description.trim()) {
      return;
    }
    if (!formData.challenges[0].name.trim() || !formData.challenges[1].name.trim()) {
      return;
    }

    setIsSaving(true);

    // Gerar IDs para os desafios se não existirem
    const challenge1Id = formData.challenges[0].id || formData.challenges[0].name.toLowerCase().replace(/\s+/g, '_');
    const challenge2Id = formData.challenges[1].id || formData.challenges[1].name.toLowerCase().replace(/\s+/g, '_');

    const newPrivilege: PrivilegeDefinition = {
      id: editingId || formData.name.toLowerCase().replace(/\s+/g, '_'),
      name: formData.name,
      category: formData.category,
      description: formData.description,
      effect: formData.effect || undefined,
      challenges: [
        {
          id: challenge1Id,
          name: formData.challenges[0].name,
          description: formData.challenges[0].description,
          effect: formData.challenges[0].effect || undefined,
        },
        {
          id: challenge2Id,
          name: formData.challenges[1].name,
          description: formData.challenges[1].description,
          effect: formData.challenges[1].effect || undefined,
        }
      ]
    };

    // Simular salvamento (em memória por enquanto)
    setTimeout(() => {
      if (editingId) {
        setPrivileges(prev => prev.map(p => p.id === editingId ? newPrivilege : p));
      } else {
        setPrivileges(prev => [...prev, newPrivilege]);
      }
      setIsSaving(false);
      setIsDialogOpen(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
    }, 500);
  };

  const handleDelete = (id: string) => {
    setPrivileges(prev => prev.filter(p => p.id !== id));
  };

  const updateChallenge = (index: 0 | 1, field: keyof ChallengeDefinition, value: string) => {
    setFormData(prev => {
      const newChallenges = [...prev.challenges] as typeof prev.challenges;
      newChallenges[index] = { ...newChallenges[index], [field]: value };
      return { ...prev, challenges: newChallenges };
    });
  };

  const isFormValid = 
    formData.name.trim() !== '' &&
    formData.category !== '' &&
    formData.description.trim() !== '' &&
    formData.challenges[0].name.trim() !== '' &&
    formData.challenges[0].description.trim() !== '' &&
    formData.challenges[1].name.trim() !== '' &&
    formData.challenges[1].description.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Gerenciador de Privilégios
          </h2>
          <p className="text-muted-foreground">
            Crie e gerencie privilégios e seus desafios associados.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Privilégio
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Privilégio' : 'Novo Privilégio'}
              </DialogTitle>
              <DialogDescription>
                Cada privilégio deve ter exatamente 2 desafios associados.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Dados do Privilégio */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Nascido na Elite"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIVILEGE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do privilégio..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effect">Efeito (texto livre)</Label>
                  <Textarea
                    id="effect"
                    value={formData.effect}
                    onChange={(e) => setFormData(prev => ({ ...prev, effect: e.target.value }))}
                    placeholder="Ex: +1 em Diplomacia quando tratando com autoridades..."
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              {/* Desafios */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold">Desafios Associados</h3>
                  <Badge variant="secondary">Obrigatório: 2</Badge>
                </div>

                {[0, 1].map((index) => (
                  <Card key={index} className="border-destructive/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-destructive">
                        Desafio {index + 1} *
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          value={formData.challenges[index as 0 | 1].name}
                          onChange={(e) => updateChallenge(index as 0 | 1, 'name', e.target.value)}
                          placeholder="Ex: Pressão da Perfeição"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição *</Label>
                        <Textarea
                          value={formData.challenges[index as 0 | 1].description}
                          onChange={(e) => updateChallenge(index as 0 | 1, 'description', e.target.value)}
                          placeholder="Descrição do desafio..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Efeito (texto livre)</Label>
                        <Textarea
                          value={formData.challenges[index as 0 | 1].effect}
                          onChange={(e) => updateChallenge(index as 0 | 1, 'effect', e.target.value)}
                          placeholder="Ex: -1 em Autocontrole..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Privilégios</strong> representam vantagens de nascimento ou background do personagem.
                Cada privilégio deve ter <strong>exatamente 2 desafios</strong> associados - o jogador 
                escolherá um deles ao selecionar o privilégio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Privilégios por Categoria */}
      <Accordion type="multiple" defaultValue={PRIVILEGE_CATEGORIES.map(c => c.id)} className="space-y-3">
        {PRIVILEGE_CATEGORIES.map((category) => {
          const categoryPrivileges = privileges.filter(p => p.category === category.id);
          const IconComponent = CATEGORY_ICONS[category.id] || Gift;

          return (
            <AccordionItem 
              key={category.id} 
              value={category.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger 
                className="px-4 py-3 hover:no-underline"
                style={{ borderLeft: `4px solid ${category.color}` }}
              >
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: category.color }}
                    />
                    <span className="font-semibold">{category.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {categoryPrivileges.length} privilégio{categoryPrivileges.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  {categoryPrivileges.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum privilégio nesta categoria.
                    </p>
                  ) : (
                    categoryPrivileges.map((privilege) => (
                      <PrivilegeCard
                        key={privilege.id}
                        privilege={privilege}
                        categoryColor={category.color}
                        onEdit={() => handleOpenEdit(privilege)}
                        onDelete={() => handleDelete(privilege.id)}
                      />
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// Componente de Card de Privilégio
interface PrivilegeCardProps {
  privilege: PrivilegeDefinition;
  categoryColor: string;
  onEdit: () => void;
  onDelete: () => void;
}

function PrivilegeCard({ privilege, categoryColor, onEdit, onDelete }: PrivilegeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{privilege.name}</CardTitle>
            <CardDescription className="mt-1">
              {privilege.description}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Privilégio</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir "{privilege.name}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {privilege.effect && (
          <div className="mt-2 p-2 rounded bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
            <span className="font-medium">Efeito:</span> {privilege.effect}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Desafios:
          </div>
          <div className="grid gap-2">
            {privilege.challenges.map((challenge, idx) => (
              <div 
                key={challenge.id || idx}
                className="p-2 rounded bg-destructive/5 border border-destructive/20 text-sm"
              >
                <span className="font-medium text-destructive">{challenge.name}</span>
                <span className="text-muted-foreground"> - {challenge.description}</span>
                {challenge.effect && (
                  <p className="text-destructive/80 mt-1 text-xs">{challenge.effect}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
