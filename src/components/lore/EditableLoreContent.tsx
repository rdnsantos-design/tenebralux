import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit3, Save, X, Loader2 } from 'lucide-react';

interface EditableLoreContentProps {
  sectionId: string | undefined;
  title: string | null | undefined;
  content: string | undefined;
  icon: React.ReactNode;
  isLoading: boolean;
  onSave: (id: string, content: string, title?: string) => void;
  isSaving: boolean;
}

export function EditableLoreContent({
  sectionId,
  title,
  content,
  icon,
  isLoading,
  onSave,
  isSaving
}: EditableLoreContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || '');
  const [editedContent, setEditedContent] = useState(content || '');

  useEffect(() => {
    setEditedTitle(title || '');
    setEditedContent(content || '');
  }, [title, content]);

  const handleSave = () => {
    if (sectionId) {
      onSave(sectionId, editedContent, editedTitle);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(title || '');
    setEditedContent(content || '');
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[50vh]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-lg font-semibold"
                placeholder="Título da seção"
              />
            ) : (
              <span>{title || 'Sem título'}</span>
            )}
          </CardTitle>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-1"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-1"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[50vh] font-mono text-sm"
            placeholder="Insira o conteúdo aqui..."
          />
        ) : (
          <ScrollArea className="h-[50vh]">
            <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
              {content || 'Clique em "Editar" para adicionar conteúdo.'}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
