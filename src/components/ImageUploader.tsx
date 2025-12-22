import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { REQUIRED_WIDTH, REQUIRED_HEIGHT } from '@/types/CardBackgroundImage';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onUploadSuccess: () => void;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  width?: number;
  height?: number;
}

export function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateImageDimensions = (file: File): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        
        if (width === REQUIRED_WIDTH && height === REQUIRED_HEIGHT) {
          resolve({
            valid: true,
            message: `Dimensões corretas: ${width}×${height}px`,
            width,
            height
          });
        } else {
          resolve({
            valid: false,
            message: `Dimensões incorretas: ${width}×${height}px. Necessário: ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT}px`,
            width,
            height
          });
        }
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({
          valid: false,
          message: 'Erro ao carregar imagem'
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setValidation({ valid: false, message: 'Arquivo deve ser uma imagem' });
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    
    const result = await validateImageDimensions(file);
    setValidation(result);
  };

  const handleUpload = async () => {
    if (!selectedFile || !validation?.valid) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `backgrounds/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('card-backgrounds')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('card-backgrounds')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('card_background_images')
        .insert({
          file_name: selectedFile.name,
          file_path: filePath,
          file_url: publicUrl,
          width: validation.width,
          height: validation.height,
          file_size: selectedFile.size,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          description: description || null
        });

      if (dbError) throw dbError;

      toast({
        title: 'Sucesso!',
        description: 'Imagem enviada com sucesso'
      });

      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setValidation(null);
      setTags('');
      setDescription('');
      if (inputRef.current) inputRef.current.value = '';
      
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar imagem',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setValidation(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Imagem de Fundo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Requisitos: {REQUIRED_WIDTH}×{REQUIRED_HEIGHT}px (Tamanho Poker, 300 DPI)</Label>
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
        </div>

        {preview && (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 rounded-lg border border-border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {validation && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                validation.valid 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {validation.valid ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{validation.message}</span>
              </div>
            )}

            {validation?.valid && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="cavalaria, medieval, floresta..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição da imagem..."
                  />
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? 'Enviando...' : 'Enviar Imagem'}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
