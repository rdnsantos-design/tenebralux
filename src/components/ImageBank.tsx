import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Images, Trash2, Search, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CardBackgroundImage } from '@/types/CardBackgroundImage';
import { toast } from '@/hooks/use-toast';

interface ImageBankProps {
  onSelectImage?: (image: CardBackgroundImage) => void;
  selectionMode?: boolean;
  refreshTrigger?: number;
}

export function ImageBank({ onSelectImage, selectionMode = false, refreshTrigger }: ImageBankProps) {
  const [images, setImages] = useState<CardBackgroundImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState<CardBackgroundImage | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('card_background_images')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar imagens',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  const handleDelete = async (image: CardBackgroundImage) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('card-backgrounds')
        .remove([image.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('card_background_images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      toast({
        title: 'Sucesso',
        description: 'Imagem excluída'
      });

      fetchImages();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir imagem',
        variant: 'destructive'
      });
    }
  };

  const filteredImages = images.filter(img => {
    const term = searchTerm.toLowerCase();
    return (
      img.file_name.toLowerCase().includes(term) ||
      img.description?.toLowerCase().includes(term) ||
      img.tags.some(tag => tag.toLowerCase().includes(term))
    );
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          Banco de Imagens ({images.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'Nenhuma imagem encontrada' : 'Nenhuma imagem no banco'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`group relative rounded-lg overflow-hidden border border-border bg-card transition-all ${
                  selectionMode ? 'cursor-pointer hover:ring-2 hover:ring-primary' : ''
                }`}
                onClick={() => selectionMode && onSelectImage?.(image)}
              >
                <div className="aspect-[750/1050] relative">
                  <img
                    src={image.file_url}
                    alt={image.file_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(image);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{image.file_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <img
                            src={image.file_url}
                            alt={image.file_name}
                            className="w-full rounded-lg"
                          />
                          <div className="flex flex-wrap gap-2">
                            {image.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                          {image.description && (
                            <p className="text-muted-foreground">{image.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {image.width}×{image.height}px • {formatFileSize(image.file_size)}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {!selectionMode && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs truncate">{image.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(image.file_size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
