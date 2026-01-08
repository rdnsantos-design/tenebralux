import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  BarChart3,
  Save,
  Loader2,
  BookOpen,
  Brain,
  Dumbbell,
  Zap,
  Target,
  Crosshair,
  Heart,
  Eye,
} from 'lucide-react';
import { useRpgAttributes, useUpdateRpgAttribute, useCreateRpgAttribute, useDeleteRpgAttribute, RpgAttribute } from '@/hooks/useRpgAttributes';
import { VIRTUES } from '@/data/character/virtues';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Brain,
  Dumbbell,
  Zap,
  Target,
  Crosshair,
  Heart,
  Eye,
  BarChart3,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

interface AttributeFormData {
  id: string;
  name: string;
  virtue_id: string;
  description: string;
  icon: string;
  focus_label: string;
  sort_order: number;
}

const EMPTY_FORM: AttributeFormData = {
  id: '',
  name: '',
  virtue_id: '',
  description: '',
  icon: 'BarChart3',
  focus_label: '',
  sort_order: 0,
};

export function AttributeManager() {
  const { data: attributes = [], isLoading } = useRpgAttributes('akashic');
  const updateAttribute = useUpdateRpgAttribute();
  const createAttribute = useCreateRpgAttribute();
  const deleteAttribute = useDeleteRpgAttribute();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AttributeFormData>(EMPTY_FORM);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
      sort_order: attributes.length,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (attr: RpgAttribute) => {
    setEditingId(attr.id);
    setFormData({
      id: attr.id,
      name: attr.name,
      virtue_id: attr.virtue_id,
      description: attr.description,
      icon: attr.icon,
      focus_label: attr.focus_label || '',
      sort_order: attr.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.virtue_id || !formData.description.trim()) {
      return;
    }

    if (editingId) {
      await updateAttribute.mutateAsync({
        id: editingId,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        focus_label: formData.focus_label || undefined,
        virtue_id: formData.virtue_id,
        sort_order: formData.sort_order,
      });
    } else {
      const id = formData.id || formData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
      await createAttribute.mutateAsync({
        id,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        focus_label: formData.focus_label || undefined,
        virtue_id: formData.virtue_id,
        theme: 'akashic',
        sort_order: formData.sort_order,
      });
    }

    setIsDialogOpen(false);
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteAttribute.mutateAsync(id);
  };

  const isFormValid = formData.name.trim() !== '' && formData.virtue_id !== '' && formData.description.trim() !== '';
  const isSaving = updateAttribute.isPending || createAttribute.isPending;

  // Group attributes by virtue
  const attributesByVirtue = VIRTUES.reduce((acc, virtue) => {
    acc[virtue.id] = attributes.filter(a => a.virtue_id === virtue.id);
    return acc;
  }, {} as Record<string, RpgAttribute[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Gerenciador de Atributos
          </h2>
          <p className="text-muted-foreground">
            Gerencie os 8 atributos base do sistema.
          </p>
        </div>
        
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Atributo
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Atributos</strong> são as características fundamentais de um personagem.
                Cada atributo está vinculado a uma <strong>Virtude</strong> e define quais 
                <strong> Perícias</strong> podem ser usadas com ele.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Atributos por Virtude */}
      <Accordion type="multiple" defaultValue={VIRTUES.map(v => v.id)} className="space-y-3">
        {VIRTUES.map((virtue) => {
          const virtueAttributes = attributesByVirtue[virtue.id] || [];

          return (
            <AccordionItem 
              key={virtue.id} 
              value={virtue.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger 
                className="px-4 py-3 hover:no-underline"
                style={{ borderLeft: `4px solid ${virtue.color}` }}
              >
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: virtue.color }}
                    />
                    <span className="font-semibold">{virtue.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {virtueAttributes.length} atributo{virtueAttributes.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  {virtueAttributes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum atributo nesta virtude.
                    </p>
                  ) : (
                    virtueAttributes.map((attr) => (
                      <AttributeCard
                        key={attr.id}
                        attribute={attr}
                        virtueColor={virtue.color}
                        onEdit={() => handleOpenEdit(attr)}
                        onDelete={() => handleDelete(attr.id)}
                      />
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Atributo' : 'Novo Atributo'}
            </DialogTitle>
            <DialogDescription>
              Configure os dados do atributo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Conhecimento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="virtue">Virtude *</Label>
                <Select
                  value={formData.virtue_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, virtue_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VIRTUES.map((virtue) => (
                      <SelectItem key={virtue.id} value={virtue.id}>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: virtue.color }}
                          />
                          {virtue.name}
                        </div>
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
                placeholder="Breve descrição do que o atributo representa..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((iconName) => {
                      const IconComponent = ICON_MAP[iconName];
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            {iconName}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="focus_label">Rótulo de Foco</Label>
                <Input
                  id="focus_label"
                  value={formData.focus_label}
                  onChange={(e) => setFormData(prev => ({ ...prev, focus_label: e.target.value }))}
                  placeholder="Ex: Dados"
                />
              </div>
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
  );
}

interface AttributeCardProps {
  attribute: RpgAttribute;
  virtueColor: string;
  onEdit: () => void;
  onDelete: () => void;
}

function AttributeCard({ attribute, virtueColor, onEdit, onDelete }: AttributeCardProps) {
  const IconComponent = ICON_MAP[attribute.icon] || BarChart3;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${virtueColor}20` }}
            >
              <IconComponent 
                className="w-5 h-5" 
                style={{ color: virtueColor }}
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{attribute.name}</CardTitle>
              <CardDescription className="mt-1">
                {attribute.description}
              </CardDescription>
              {attribute.focus_label && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Foco: {attribute.focus_label}
                </Badge>
              )}
            </div>
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
                  <AlertDialogTitle>Excluir Atributo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir "{attribute.name}"? 
                    Isso também excluirá todas as perícias vinculadas. Esta ação não pode ser desfeita.
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
      </CardHeader>
    </Card>
  );
}
