import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardTemplate } from '@/types/CardTemplate';
import { Upload, Hexagon, AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// Dimensões do hexágono: 9cm de largura (canto a canto) a 300 DPI
// 9cm * (300 / 2.54) = 1063 pixels de largura
// Altura = largura * (√3/2) para hexágono regular ≈ 921 pixels
export const HEX_TEMPLATE_WIDTH = 1063;
export const HEX_TEMPLATE_HEIGHT = Math.round(HEX_TEMPLATE_WIDTH * (Math.sqrt(3) / 2)); // ≈ 921

interface TemplateCreatorProps {
  onTemplateCreated: (template: CardTemplate) => void;
  onCancel: () => void;
}

export const TemplateCreator: React.FC<TemplateCreatorProps> = ({ onTemplateCreated, onCancel }) => {
  const [templateName, setTemplateName] = useState('');
  const [templateImage, setTemplateImage] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [dimensionsValid, setDimensionsValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hexClipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        const isValid = img.width === HEX_TEMPLATE_WIDTH && img.height === HEX_TEMPLATE_HEIGHT;
        setImageDimensions({ width: img.width, height: img.height });
        setDimensionsValid(isValid);
        setImageLoaded(true);
        
        if (isValid) {
          setTemplateImage(imageUrl);
          toast.success('Imagem carregada com sucesso!');
        } else {
          setTemplateImage(imageUrl);
          toast.warning(
            `Dimensões incorretas: ${img.width}×${img.height}px. ` +
            `Use exatamente ${HEX_TEMPLATE_WIDTH}×${HEX_TEMPLATE_HEIGHT}px.`
          );
        }
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTemplate = () => {
    if (!templateName || !templateImage || !dimensionsValid) {
      if (!dimensionsValid) {
        toast.error('A imagem deve ter as dimensões corretas');
      }
      return;
    }

    const newTemplate: CardTemplate = {
      id: Date.now().toString(),
      name: templateName,
      templateImage,
      width: HEX_TEMPLATE_WIDTH,
      height: HEX_TEMPLATE_HEIGHT,
      fields: []
    };

    console.log('Criando template hexagonal:', newTemplate);
    onTemplateCreated(newTemplate);
    toast.success('Template hexagonal criado!');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Hexagon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Criar Template Hexagonal</h1>
            </div>
            <p className="text-muted-foreground">
              Faça upload de uma imagem hexagonal para usar como fundo das unidades
            </p>
          </div>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>

        {/* Instruções de dimensão */}
        <Alert className="mb-6">
          <Hexagon className="h-4 w-4" />
          <AlertDescription>
            <strong>Dimensões obrigatórias:</strong> {HEX_TEMPLATE_WIDTH}×{HEX_TEMPLATE_HEIGHT} pixels 
            (9cm de largura a 300 DPI). Use um editor de imagem para criar um hexágono com essas dimensões exatas.
          </AlertDescription>
        </Alert>

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
                  placeholder="Ex: Cavalaria Elite"
                />
              </div>

              <div>
                <Label>Imagem de Fundo Hexagonal</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/png,image/jpeg"
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar Imagem ({HEX_TEMPLATE_WIDTH}×{HEX_TEMPLATE_HEIGHT}px)
                  </Button>
                </div>
              </div>

              {imageLoaded && (
                <div className={`p-3 rounded-lg border ${dimensionsValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    {dimensionsValid ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div className="text-sm">
                      <p className={dimensionsValid ? 'text-green-700' : 'text-red-700'}>
                        Dimensões: {imageDimensions.width}×{imageDimensions.height}px
                      </p>
                      {dimensionsValid ? (
                        <p className="text-green-600 text-xs">Dimensões corretas!</p>
                      ) : (
                        <p className="text-red-600 text-xs">
                          Esperado: {HEX_TEMPLATE_WIDTH}×{HEX_TEMPLATE_HEIGHT}px
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateTemplate}
                disabled={!templateName || !templateImage || !dimensionsValid}
                className="w-full"
              >
                <Hexagon className="w-4 h-4 mr-2" />
                Criar Template Hexagonal
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview do Hexágono</CardTitle>
            </CardHeader>
            <CardContent>
              {templateImage ? (
                <div className="flex flex-col items-center gap-4">
                  {/* Preview hexagonal */}
                  <div 
                    className="relative mx-auto border-2 border-primary/20 overflow-hidden"
                    style={{ 
                      width: '280px', 
                      height: `${280 * (HEX_TEMPLATE_HEIGHT / HEX_TEMPLATE_WIDTH)}px`,
                      clipPath: hexClipPath 
                    }}
                  >
                    <img
                      src={templateImage}
                      alt="Template Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Imagem original */}
                  <div className="w-full">
                    <p className="text-xs text-muted-foreground text-center mb-2">Imagem original:</p>
                    <img
                      src={templateImage}
                      alt="Original"
                      className="w-full h-auto border rounded max-h-40 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-muted p-8 text-center mx-auto"
                  style={{ 
                    width: '280px', 
                    height: '243px',
                    clipPath: hexClipPath 
                  }}
                >
                  <Hexagon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Upload uma imagem hexagonal
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Guia de criação */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Como criar a imagem hexagonal</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Crie um novo documento com <strong>{HEX_TEMPLATE_WIDTH}×{HEX_TEMPLATE_HEIGHT} pixels</strong></li>
              <li>Desenhe ou adicione sua arte de fundo (paisagem, textura, ilustração)</li>
              <li>Se desejar, aplique uma máscara hexagonal para visualizar o recorte</li>
              <li>Exporte como PNG ou JPG com as dimensões exatas</li>
              <li>Faça upload da imagem aqui</li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Dica: O sistema aplicará automaticamente o recorte hexagonal na impressão.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
