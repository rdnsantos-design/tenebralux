import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Plus, Building2, Sword, Skull, FlaskConical, Heart,
  Edit3, Save, X, Trash2, Loader2
} from 'lucide-react';
import { 
  useGalaxyOrganizations, 
  OrganizationType, 
  ORGANIZATION_TYPES,
  GalaxyOrganization 
} from '@/hooks/useGalaxyOrganizations';

const TYPE_ICONS: Record<OrganizationType, React.ElementType> = {
  corporacao: Building2,
  militar: Sword,
  criminosa: Skull,
  cientifica: FlaskConical,
  social: Heart
};

function OrganizationCard({ 
  org, 
  onUpdate, 
  onDelete,
  isUpdating,
  isDeleting 
}: { 
  org: GalaxyOrganization;
  onUpdate: (id: string, data: Partial<GalaxyOrganization>) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(org.name);
  const [editedDescription, setEditedDescription] = useState(org.description || '');
  const [editedContent, setEditedContent] = useState(org.content);

  const typeInfo = ORGANIZATION_TYPES.find(t => t.id === org.organization_type);
  const Icon = TYPE_ICONS[org.organization_type];

  const handleSave = () => {
    onUpdate(org.id, {
      name: editedName,
      description: editedDescription,
      content: editedContent
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(org.name);
    setEditedDescription(org.description || '');
    setEditedContent(org.content);
    setIsEditing(false);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${typeInfo?.color}`} />
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="font-semibold"
              />
            ) : (
              <CardTitle className="text-lg">{org.name}</CardTitle>
            )}
            <Badge variant="outline" className={typeInfo?.color}>
              {typeInfo?.label}
            </Badge>
          </div>
          
          <div className="flex gap-1">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isUpdating}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deletar organização?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja deletar "{org.name}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(org.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deletar'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Descrição breve..."
              className="text-sm"
            />
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Conteúdo detalhado..."
              className="min-h-[200px]"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {org.description && (
              <p className="text-sm text-muted-foreground italic">{org.description}</p>
            )}
            <ScrollArea className="max-h-[200px]">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {org.content || 'Clique em editar para adicionar conteúdo.'}
              </p>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateOrganizationDialog({ 
  onCreate,
  isCreating 
}: { 
  onCreate: (data: { name: string; organization_type: OrganizationType; description: string; content: string }) => void;
  isCreating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<OrganizationType>('corporacao');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      organization_type: type,
      description: description.trim(),
      content: content.trim()
    });
    setName('');
    setDescription('');
    setContent('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Organização
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Organização</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da organização"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={type} onValueChange={(v) => setType(v as OrganizationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPES.map(t => {
                    const Icon = TYPE_ICONS[t.id];
                    return (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${t.color}`} />
                          {t.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição breve</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Uma breve descrição..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detalhes sobre a organização..."
              className="min-h-[150px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OrganizationsSection() {
  const { 
    organizations, 
    isLoading, 
    createOrganization, 
    updateOrganization, 
    deleteOrganization,
    getByType 
  } = useGalaxyOrganizations();
  
  const [activeType, setActiveType] = useState<OrganizationType | 'all'>('all');

  const filteredOrgs = activeType === 'all' 
    ? organizations 
    : getByType(activeType);

  const handleCreate = (data: { name: string; organization_type: OrganizationType; description: string; content: string }) => {
    createOrganization.mutate({
      ...data,
      image_url: null,
      sort_order: 0
    });
  };

  const handleUpdate = (id: string, data: Partial<GalaxyOrganization>) => {
    updateOrganization.mutate({ id, ...data });
  };

  const handleDelete = (id: string) => {
    deleteOrganization.mutate(id);
  };

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Organizações
          </h2>
          <p className="text-sm text-muted-foreground">
            Corporações, grupos militares, organizações criminosas e mais
          </p>
        </div>
        <CreateOrganizationDialog 
          onCreate={handleCreate} 
          isCreating={createOrganization.isPending} 
        />
      </div>

      {/* Type filter tabs */}
      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as OrganizationType | 'all')}>
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="all" className="gap-2">
            Todas
            <Badge variant="secondary" className="ml-1">{organizations.length}</Badge>
          </TabsTrigger>
          {ORGANIZATION_TYPES.map(type => {
            const Icon = TYPE_ICONS[type.id];
            const count = getByType(type.id).length;
            return (
              <TabsTrigger key={type.id} value={type.id} className="gap-2">
                <Icon className={`w-4 h-4 ${type.color}`} />
                <span className="hidden sm:inline">{type.label}</span>
                {count > 0 && <Badge variant="secondary" className="ml-1">{count}</Badge>}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Organizations list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOrgs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {activeType === 'all' 
                ? 'Nenhuma organização criada ainda.' 
                : `Nenhuma organização do tipo "${ORGANIZATION_TYPES.find(t => t.id === activeType)?.label}" encontrada.`}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Clique em "Nova Organização" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrgs.map(org => (
            <OrganizationCard
              key={org.id}
              org={org}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isUpdating={updateOrganization.isPending}
              isDeleting={deleteOrganization.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
