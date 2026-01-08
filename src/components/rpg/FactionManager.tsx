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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Shield,
  Handshake,
  Scale,
  BookOpen,
  Globe,
  Building2,
  Rocket,
  Skull,
  Sword,
  Crown,
  Landmark,
  TreePine,
  Ship,
  Axe,
  Save,
  Loader2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AKASHIC_FACTIONS,
  TENEBRA_FACTIONS,
  FactionDefinition,
  FactionSkillBonus
} from '@/data/character/factions';
import { VIRTUES } from '@/data/character/virtues';
import { ATTRIBUTES } from '@/data/character/attributes';
import { ThemeId } from '@/themes/types';

// Mapeamento de ícones disponíveis
const AVAILABLE_ICONS: Record<string, React.ElementType> = {
  Shield,
  Users,
  Handshake,
  Scale,
  BookOpen,
  Globe,
  Building2,
  Rocket,
  Skull,
  Sword,
  Crown,
  Landmark,
  TreePine,
  Ship,
  Axe,
  Sparkles,
};

const ICON_OPTIONS = Object.keys(AVAILABLE_ICONS);

interface FactionFormData {
  name: string;
  theme: ThemeId;
  description: string;
  color: string;
  icon: string;
  virtue: string;
  attributeBonuses: string[];
  freeSkillsPoints: number;
  freeSkillsCount: number;
}

const EMPTY_FORM: FactionFormData = {
  name: '',
  theme: 'akashic',
  description: '',
  color: '#3b82f6',
  icon: 'Shield',
  virtue: '',
  attributeBonuses: [],
  freeSkillsPoints: 0,
  freeSkillsCount: 0,
};

export function FactionManager() {
  const [factions, setFactions] = useState<FactionDefinition[]>([
    ...AKASHIC_FACTIONS,
    ...TENEBRA_FACTIONS
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FactionFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const akashicFactions = factions.filter(f => f.theme === 'akashic');
  const tenebraFactions = factions.filter(f => f.theme === 'tenebralux');

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (faction: FactionDefinition) => {
    setEditingId(faction.id);
    setFormData({
      name: faction.name,
      theme: faction.theme,
      description: faction.description,
      color: faction.color,
      icon: faction.icon,
      virtue: faction.virtue || '',
      attributeBonuses: faction.attributeBonuses || [],
      freeSkillsPoints: faction.freeSkills?.points || 0,
      freeSkillsCount: faction.freeSkills?.skillCount || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      return;
    }

    setIsSaving(true);

    const newFaction: FactionDefinition = {
      id: editingId || formData.name.toLowerCase().replace(/\s+/g, '-'),
      name: formData.name,
      theme: formData.theme,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
      virtue: formData.virtue || undefined,
      attributeBonuses: formData.attributeBonuses.length > 0 ? formData.attributeBonuses : undefined,
      freeSkills: formData.freeSkillsPoints > 0 || formData.freeSkillsCount > 0
        ? { points: formData.freeSkillsPoints, skillCount: formData.freeSkillsCount }
        : undefined,
    };

    setTimeout(() => {
      if (editingId) {
        setFactions(prev => prev.map(f => f.id === editingId ? newFaction : f));
      } else {
        setFactions(prev => [...prev, newFaction]);
      }
      setIsSaving(false);
      setIsDialogOpen(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
    }, 500);
  };

  const handleDelete = (id: string) => {
    setFactions(prev => prev.filter(f => f.id !== id));
  };

  const toggleAttributeBonus = (attrId: string) => {
    setFormData(prev => ({
      ...prev,
      attributeBonuses: prev.attributeBonuses.includes(attrId)
        ? prev.attributeBonuses.filter(a => a !== attrId)
        : [...prev.attributeBonuses, attrId]
    }));
  };

  const isFormValid = formData.name.trim() !== '' && formData.description.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Gerenciador de Facções
          </h2>
          <p className="text-muted-foreground">
            Crie e gerencie facções e seus modificadores.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Facção
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Facção' : 'Nova Facção'}
              </DialogTitle>
              <DialogDescription>
                Configure os dados e modificadores da facção.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Dados Básicos */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Hegemonia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema *</Label>
                    <Select
                      value={formData.theme}
                      onValueChange={(value: ThemeId) => setFormData(prev => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="akashic">Akashic (Sci-Fi)</SelectItem>
                        <SelectItem value="tenebralux">Tenebralux (Medieval)</SelectItem>
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
                    placeholder="Descrição da facção..."
                    rows={2}
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
                          const IconComponent = AVAILABLE_ICONS[iconName];
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
                    <Label htmlFor="color">Cor</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Modificadores */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Modificadores
                </h3>

                {/* Virtude */}
                <div className="space-y-2">
                  <Label htmlFor="virtue">Virtude Inicial</Label>
                  <Select
                    value={formData.virtue}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, virtue: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma (ou livre escolha)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      <SelectItem value="choice">Livre Escolha</SelectItem>
                      {VIRTUES.map((virtue) => (
                        <SelectItem key={virtue.id} value={virtue.id}>
                          {virtue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    "Livre Escolha" permite ao jogador escolher a virtude inicial.
                  </p>
                </div>

                {/* Bônus de Atributos */}
                <div className="space-y-2">
                  <Label>Bônus de Atributos (+1)</Label>
                  <div className="flex flex-wrap gap-3">
                    {ATTRIBUTES.map((attr) => (
                      <div key={attr.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`attr-${attr.id}`}
                          checked={formData.attributeBonuses.includes(attr.id)}
                          onCheckedChange={() => toggleAttributeBonus(attr.id)}
                        />
                        <Label htmlFor={`attr-${attr.id}`} className="text-sm cursor-pointer">
                          {attr.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Perícias Livres */}
                <div className="space-y-2">
                  <Label>Perícias Livres</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="skillPoints" className="text-xs text-muted-foreground">
                        Níveis de Perícia
                      </Label>
                      <Input
                        id="skillPoints"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.freeSkillsPoints}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          freeSkillsPoints: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skillCount" className="text-xs text-muted-foreground">
                        Quantidade de Perícias
                      </Label>
                      <Input
                        id="skillCount"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.freeSkillsCount}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          freeSkillsCount: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ex: 5 níveis em 1 perícia, ou 4 níveis divididos em 2 perícias.
                  </p>
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

      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Facções</strong> representam as origens culturais e políticas dos personagens.
                Cada facção pode conceder <strong>virtudes</strong>, <strong>bônus de atributos</strong> 
                e <strong>perícias livres</strong> aos seus membros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Facções por Tema */}
      <Accordion type="multiple" defaultValue={['akashic', 'tenebralux']} className="space-y-3">
        {/* Akashic */}
        <AccordionItem value="akashic" className="border rounded-lg overflow-hidden">
          <AccordionTrigger 
            className="px-4 py-3 hover:no-underline"
            style={{ borderLeft: '4px solid #8b5cf6' }}
          >
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-violet-500" />
                <span className="font-semibold">Akashic (Sci-Fi)</span>
              </div>
              <Badge variant="secondary">
                {akashicFactions.length} facção{akashicFactions.length !== 1 ? 'ões' : ''}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid gap-3 pt-2">
              {akashicFactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma facção neste tema.
                </p>
              ) : (
                akashicFactions.map((faction) => (
                  <FactionCard
                    key={faction.id}
                    faction={faction}
                    onEdit={() => handleOpenEdit(faction)}
                    onDelete={() => handleDelete(faction.id)}
                  />
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tenebralux */}
        <AccordionItem value="tenebralux" className="border rounded-lg overflow-hidden">
          <AccordionTrigger 
            className="px-4 py-3 hover:no-underline"
            style={{ borderLeft: '4px solid #c0392b' }}
          >
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-red-500" />
                <span className="font-semibold">Tenebralux (Medieval Fantasy)</span>
              </div>
              <Badge variant="secondary">
                {tenebraFactions.length} facção{tenebraFactions.length !== 1 ? 'ões' : ''}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid gap-3 pt-2">
              {tenebraFactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma facção neste tema.
                </p>
              ) : (
                tenebraFactions.map((faction) => (
                  <FactionCard
                    key={faction.id}
                    faction={faction}
                    onEdit={() => handleOpenEdit(faction)}
                    onDelete={() => handleDelete(faction.id)}
                  />
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// Componente de Card de Facção
interface FactionCardProps {
  faction: FactionDefinition;
  onEdit: () => void;
  onDelete: () => void;
}

function FactionCard({ faction, onEdit, onDelete }: FactionCardProps) {
  const IconComponent = AVAILABLE_ICONS[faction.icon] || Users;
  const virtueLabel = faction.virtue === 'choice' 
    ? 'Livre Escolha' 
    : faction.virtue 
      ? VIRTUES.find(v => v.id === faction.virtue)?.name || faction.virtue
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${faction.color}20` }}
            >
              <IconComponent 
                className="w-5 h-5" 
                style={{ color: faction.color }}
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                {faction.name}
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: faction.color }}
                />
              </CardTitle>
              <CardDescription className="mt-1">
                {faction.description}
              </CardDescription>
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
                  <AlertDialogTitle>Excluir Facção</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir "{faction.name}"? Esta ação não pode ser desfeita.
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
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mt-2">
          {virtueLabel && (
            <Badge variant="outline" className="text-xs">
              Virtude: {virtueLabel}
            </Badge>
          )}
          {faction.attributeBonuses && faction.attributeBonuses.length > 0 && (
            <Badge variant="outline" className="text-xs">
              +1 {faction.attributeBonuses.map(a => 
                ATTRIBUTES.find(attr => attr.id === a)?.name || a
              ).join(', ')}
            </Badge>
          )}
          {faction.freeSkills && (
            <Badge variant="outline" className="text-xs">
              {faction.freeSkills.points} níveis em {faction.freeSkills.skillCount} perícia{faction.freeSkills.skillCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
