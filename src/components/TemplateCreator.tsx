import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardTemplate } from '@/types/CardTemplate';
import { Upload } from 'lucide-react';

// Constantes padronizadas do sistema de coordenadas
const STANDARD_WIDTH = 1181;
const STANDARD_HEIGHT = 768;

interface TemplateCreatorProps {
  onTemplateCreated: (template: CardTemplate) => void;
  onCancel: () => void;
}

export const TemplateCreator: React.FC<TemplateCreatorProps> = ({ onTemplateCreated, onCancel }) => {
  const [templateName, setTemplateName] = useState('');
  const [templateImage, setTemplateImage] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setTemplateImage(imageUrl);
      
      // Carregar imagem para obter dimensões
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setImageLoaded(true);
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTemplate = () => {
    if (!templateName || !templateImage) {
      console.log('Campos obrigatórios não preenchidos:', { templateName, templateImage: !!templateImage });
      return;
    }

    const newTemplate: CardTemplate = {
      id: Date.now().toString(),
      name: templateName,
      templateImage,
      width: STANDARD_WIDTH,  // Sempre usar dimensões padronizadas
      height: STANDARD_HEIGHT, // Sempre usar dimensões padronizadas
      fields: []
    };

    console.log('Criando template:', newTemplate);
    onTemplateCreated(newTemplate);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Criar Novo Template</h1>
            <p className="text-muted-foreground">Faça upload da sua imagem base do Canva</p>
          </div>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ex: Card Infantaria Padrão"
                />
              </div>

              <div>
                <Label>Imagem do Template (PNG)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/png,image/jpg,image/jpeg"
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar Imagem
                  </Button>
                </div>
              </div>

              {imageLoaded && (
                <div className="text-sm text-muted-foreground">
                  <p>Dimensões originais: {imageDimensions.width} x {imageDimensions.height} pixels</p>
                  <p>Dimensões do template: {STANDARD_WIDTH} x {STANDARD_HEIGHT} pixels</p>
                  {(imageDimensions.width !== STANDARD_WIDTH || imageDimensions.height !== STANDARD_HEIGHT) && (
                    <p className="text-xs mt-1 text-amber-600">
                      ⚠️ A imagem será redimensionada para as dimensões padrão do sistema
                    </p>
                  )}
                  {(imageDimensions.width === STANDARD_WIDTH && imageDimensions.height === STANDARD_HEIGHT) && (
                    <p className="text-xs mt-1 text-green-600">
                      ✅ A imagem já possui as dimensões corretas do sistema
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleCreateTemplate}
                disabled={!templateName || !templateImage}
                className="w-full"
              >
                Criar Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview da Imagem</CardTitle>
            </CardHeader>
            <CardContent>
              {templateImage ? (
                <img
                  src={templateImage}
                  alt="Template Preview"
                  className="w-full h-auto border rounded"
                />
              ) : (
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Faça upload da imagem do seu template criado no Canva
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};