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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ListChecks,
  Save,
  Loader2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { 
  useRpgSkills, 
  useRpgSkillSpecializations,
  useUpdateRpgSkill, 
  useCreateRpgSkill, 
  useDeleteRpgSkill,
  useCreateRpgSpecialization,
  useUpdateRpgSpecialization,
  useDeleteRpgSpecialization,
  RpgSkill,
  RpgSkillSpecialization,
} from '@/hooks/useRpgSkills';
import { useRpgAttributes, RpgAttribute } from '@/hooks/useRpgAttributes';

interface SkillFormData {
  id: string;
  name: string;
  attribute_id: string;
  description: string;
  sort_order: number;
}

const EMPTY_SKILL_FORM: SkillFormData = {
  id: '',
  name: '',
  attribute_id: '',
  description: '',
  sort_order: 0,
};

interface SpecFormData {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

const EMPTY_SPEC_FORM: SpecFormData = {
  id: '',
  name: '',
  description: '',
  sort_order: 0,
};

export function SkillManager() {
  const { data: skills = [], isLoading: skillsLoading } = useRpgSkills('akashic');
  const { data: attributes = [], isLoading: attrsLoading } = useRpgAttributes('akashic');
  const { data: allSpecializations = [] } = useRpgSkillSpecializations();
  
  const updateSkill = useUpdateRpgSkill();
  const createSkill = useCreateRpgSkill();
  const deleteSkill = useDeleteRpgSkill();
  
  const createSpec = useCreateRpgSpecialization();
  const updateSpec = useUpdateRpgSpecialization();
  const deleteSpec = useDeleteRpgSpecialization();

  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillFormData, setSkillFormData] = useState<SkillFormData>(EMPTY_SKILL_FORM);

  const [isSpecDialogOpen, setIsSpecDialogOpen] = useState(false);
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [currentSkillId, setCurrentSkillId] = useState<string | null>(null);
  const [specFormData, setSpecFormData] = useState<SpecFormData>(EMPTY_SPEC_FORM);

  const handleOpenCreateSkill = () => {
    setEditingSkillId(null);
    setSkillFormData({
      ...EMPTY_SKILL_FORM,
      sort_order: skills.length,
    });
    setIsSkillDialogOpen(true);
  };

  const handleOpenEditSkill = (skill: RpgSkill) => {
    setEditingSkillId(skill.id);
    setSkillFormData({
      id: skill.id,
      name: skill.name,
      attribute_id: skill.attribute_id,
      description: skill.description,
      sort_order: skill.sort_order,
    });
    setIsSkillDialogOpen(true);
  };

  const handleSaveSkill = async () => {
    if (!skillFormData.name.trim() || !skillFormData.attribute_id || !skillFormData.description.trim()) {
      return;
    }

    if (editingSkillId) {
      await updateSkill.mutateAsync({
        id: editingSkillId,
        name: skillFormData.name,
        description: skillFormData.description,
        attribute_id: skillFormData.attribute_id,
        sort_order: skillFormData.sort_order,
      });
    } else {
      const id = skillFormData.id || skillFormData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
      await createSkill.mutateAsync({
        id,
        name: skillFormData.name,
        description: skillFormData.description,
        attribute_id: skillFormData.attribute_id,
        theme: 'akashic',
        sort_order: skillFormData.sort_order,
      });
    }

    setIsSkillDialogOpen(false);
    setSkillFormData(EMPTY_SKILL_FORM);
    setEditingSkillId(null);
  };

  const handleDeleteSkill = async (id: string) => {
    await deleteSkill.mutateAsync(id);
  };

  // Specializations
  const handleOpenCreateSpec = (skillId: string) => {
    const skillSpecs = allSpecializations.filter(s => s.skill_id === skillId);
    setCurrentSkillId(skillId);
    setEditingSpecId(null);
    setSpecFormData({
      ...EMPTY_SPEC_FORM,
      sort_order: skillSpecs.length,
    });
    setIsSpecDialogOpen(true);
  };

  const handleOpenEditSpec = (spec: RpgSkillSpecialization) => {
    setCurrentSkillId(spec.skill_id);
    setEditingSpecId(spec.id);
    setSpecFormData({
      id: spec.id,
      name: spec.name,
      description: spec.description || '',
      sort_order: spec.sort_order,
    });
    setIsSpecDialogOpen(true);
  };

  const handleSaveSpec = async () => {
    if (!specFormData.name.trim() || !currentSkillId) {
      return;
    }

    if (editingSpecId) {
      await updateSpec.mutateAsync({
        id: editingSpecId,
        name: specFormData.name,
        description: specFormData.description || null,
        sort_order: specFormData.sort_order,
      });
    } else {
      await createSpec.mutateAsync({
        skill_id: currentSkillId,
        name: specFormData.name,
        description: specFormData.description || null,
        sort_order: specFormData.sort_order,
      });
    }

    setIsSpecDialogOpen(false);
    setSpecFormData(EMPTY_SPEC_FORM);
    setEditingSpecId(null);
    setCurrentSkillId(null);
  };

  const handleDeleteSpec = async (id: string) => {
    await deleteSpec.mutateAsync(id);
  };

  const isSkillFormValid = skillFormData.name.trim() !== '' && skillFormData.attribute_id !== '' && skillFormData.description.trim() !== '';
  const isSpecFormValid = specFormData.name.trim() !== '';
  const isSavingSkill = updateSkill.isPending || createSkill.isPending;
  const isSavingSpec = updateSpec.isPending || createSpec.isPending;

  // Group skills by attribute
  const skillsByAttribute = attributes.reduce((acc, attr) => {
    acc[attr.id] = skills.filter(s => s.attribute_id === attr.id);
    return acc;
  }, {} as Record<string, RpgSkill[]>);

  if (skillsLoading || attrsLoading) {
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
            <ListChecks className="w-6 h-6 text-primary" />
            Gerenciador de Perícias
          </h2>
          <p className="text-muted-foreground">
            Gerencie as 40 perícias e suas especializações.
          </p>
        </div>
        
        <Button onClick={handleOpenCreateSkill}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Perícia
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <ListChecks className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Perícias</strong> representam habilidades específicas que um personagem pode desenvolver.
                Cada perícia está vinculada a um <strong>Atributo</strong> e pode ter várias 
                <strong> Especializações (Ênfases)</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Perícias por Atributo */}
      <Accordion type="multiple" defaultValue={attributes.map(a => a.id)} className="space-y-3">
        {attributes.map((attr) => {
          const attrSkills = skillsByAttribute[attr.id] || [];

          return (
            <AccordionItem 
              key={attr.id} 
              value={attr.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{attr.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {attrSkills.length} perícia{attrSkills.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  {attrSkills.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma perícia neste atributo.
                    </p>
                  ) : (
                    attrSkills.map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        specializations={allSpecializations.filter(s => s.skill_id === skill.id)}
                        onEdit={() => handleOpenEditSkill(skill)}
                        onDelete={() => handleDeleteSkill(skill.id)}
                        onAddSpec={() => handleOpenCreateSpec(skill.id)}
                        onEditSpec={handleOpenEditSpec}
                        onDeleteSpec={handleDeleteSpec}
                      />
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Dialog de Criação/Edição de Perícia */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSkillId ? 'Editar Perícia' : 'Nova Perícia'}
            </DialogTitle>
            <DialogDescription>
              Configure os dados da perícia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill-name">Nome *</Label>
                <Input
                  id="skill-name"
                  value={skillFormData.name}
                  onChange={(e) => setSkillFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Ciências"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attribute">Atributo *</Label>
                <Select
                  value={skillFormData.attribute_id}
                  onValueChange={(value) => setSkillFormData(prev => ({ ...prev, attribute_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {attributes.map((attr) => (
                      <SelectItem key={attr.id} value={attr.id}>
                        {attr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-description">Descrição *</Label>
              <Textarea
                id="skill-description"
                value={skillFormData.description}
                onChange={(e) => setSkillFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição do que a perícia representa..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSkillDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSkill} disabled={!isSkillFormValid || isSavingSkill}>
              {isSavingSkill ? (
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

      {/* Dialog de Criação/Edição de Especialização */}
      <Dialog open={isSpecDialogOpen} onOpenChange={setIsSpecDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSpecId ? 'Editar Especialização' : 'Nova Especialização'}
            </DialogTitle>
            <DialogDescription>
              Configure os dados da especialização (ênfase).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="spec-name">Nome *</Label>
              <Input
                id="spec-name"
                value={specFormData.name}
                onChange={(e) => setSpecFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Astrofísica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spec-description">Descrição</Label>
              <Textarea
                id="spec-description"
                value={specFormData.description}
                onChange={(e) => setSpecFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição da especialização..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSpecDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSpec} disabled={!isSpecFormValid || isSavingSpec}>
              {isSavingSpec ? (
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

interface SkillCardProps {
  skill: RpgSkill;
  specializations: RpgSkillSpecialization[];
  onEdit: () => void;
  onDelete: () => void;
  onAddSpec: () => void;
  onEditSpec: (spec: RpgSkillSpecialization) => void;
  onDeleteSpec: (id: string) => void;
}

function SkillCard({ skill, specializations, onEdit, onDelete, onAddSpec, onEditSpec, onDeleteSpec }: SkillCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{skill.name}</CardTitle>
            <CardDescription className="mt-1">
              {skill.description}
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
                  <AlertDialogTitle>Excluir Perícia</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir "{skill.name}"? 
                    Isso também excluirá todas as especializações. Esta ação não pode ser desfeita.
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
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Especializações ({specializations.length})
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              {specializations.map((spec) => (
                <div key={spec.id} className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-sm font-medium">{spec.name}</span>
                    {spec.description && (
                      <p className="text-xs text-muted-foreground">{spec.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditSpec(spec)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Especialização</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{spec.name}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteSpec(spec.id)} className="bg-destructive text-destructive-foreground">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={onAddSpec}>
                <Plus className="w-3 h-3 mr-1" />
                Adicionar Especialização
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
