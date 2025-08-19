import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CardTemplate, TextFieldMapping } from '@/types/CardTemplate';

interface SimpleTemplateEditorProps {
  template: CardTemplate;
  onTemplateUpdate: (template: CardTemplate) => void;
  onFinish?: () => void;
}

const fieldLabels = {
  'name': 'Nome da Unidade',
  'number': 'Número do Card',
  'attack': 'Ataque',
  'defense': 'Defesa', 
  'ranged': 'Distância (Tiro)',
  'movement': 'Movimento',
  'morale': 'Moral',
  'experience': 'Experiência',
  'total-force': 'Força Total',
  'maintenance-cost': 'Custo de Manutenção'
};

export const SimpleTemplateEditor: React.FC<SimpleTemplateEditorProps> = ({
  template,
  onTemplateUpdate,
  onFinish
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const [imageDimensions, setImageDimensions] = useState({
    width: template.width || 1181,
    height: template.height || 767
  });

  // IMPORTANTE: Valores de teste APENAS para preview visual - NÃO são salvos no card
  const [testValues, setTestValues] = useState({
    name: 'Cavaleiros de Ferro',
    number: '#001',
    attack: '8',
    defense: '6',
    ranged: '4',
    movement: '3',
    morale: '7',
    experience: 'Veterano',
    'total-force': '12',
    'maintenance-cost': '25'
  });

  const updateField = (fieldId: string, property: keyof TextFieldMapping, value: any) => {
    const existingField = template.fields.find(f => f.id === fieldId);
    
    if (!existingField) {
      // Criar novo campo
      const newField: TextFieldMapping = {
        id: fieldId,
        x: 0,
        y: 0,
        fontSize: 24,
        fontFamily: 'Cinzel, serif',
        color: '#000000',
        textAlign: 'center',
        [property]: value
      };
      
      const updatedTemplate = {
        ...template,
        fields: [...template.fields, newField]
      };
      onTemplateUpdate(updatedTemplate);
    } else {
      // Atualizar campo existente
      const updatedFields = template.fields.map(field => 
        field.id === fieldId 
          ? { ...field, [property]: value }
          : field
      );

      const updatedTemplate = {
        ...template,
        fields: updatedFields
      };
      onTemplateUpdate(updatedTemplate);
    }
  };

  const updateImageDimensions = (width: number, height: number) => {
    setImageDimensions({ width, height });
    const updatedTemplate = {
      ...template,
      width,
      height
    };
    onTemplateUpdate(updatedTemplate);
  };

  const getFieldValue = (fieldId: string, property: keyof TextFieldMapping): string | number => {
    const field = template.fields.find(f => f.id === fieldId);
    if (!field) return property === 'fontSize' ? 24 : property === 'color' ? '#000000' : 0;
    const value = field[property];
    return (typeof value === 'string' || typeof value === 'number') ? value : 0;
  };

  return (
    <div className="space-y-6">
      {/* Configurações da Imagem */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">1. Dimensões da Imagem do Canva</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Largura (pixels)</Label>
            <Input 
              type="number" 
              value={imageDimensions.width}
              onChange={(e) => updateImageDimensions(parseInt(e.target.value) || 1181, imageDimensions.height)}
              placeholder="Ex: 1181"
            />
          </div>
          <div>
            <Label>Altura (pixels)</Label>
            <Input 
              type="number" 
              value={imageDimensions.height}
              onChange={(e) => updateImageDimensions(imageDimensions.width, parseInt(e.target.value) || 767)}
              placeholder="Ex: 767"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          💡 No Canva, clique com o botão direito na imagem → "Baixar" → você verá as dimensões
        </p>
      </Card>

      {/* Preview da Imagem com Campos */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">2. Preview em Tempo Real</h3>
        <p className="text-sm text-muted-foreground mb-4">
          ⚡ Os campos aparecem <strong>instantaneamente</strong> conforme você digita as coordenadas abaixo
        </p>
        <div 
          ref={containerRef}
          className="relative border-2 border-blue-500 rounded-lg overflow-hidden bg-gray-50"
          style={{ maxWidth: '800px', margin: '0 auto' }}
        >
          <img
            ref={imageRef}
            src={template.templateImage}
            alt="Template"
            className="w-full h-auto block"
            style={{ maxHeight: '600px', objectFit: 'contain' }}
            onLoad={() => {
              setImageLoaded(true);
            }}
          />
          
          {/* Visualizar campos mapeados EM TEMPO REAL */}
          {imageLoaded && template.fields.map(field => {
            if (!imageRef.current || !containerRef.current) return null;
            
            const img = imageRef.current;
            const scaleX = img.offsetWidth / imageDimensions.width;
            const scaleY = img.offsetHeight / imageDimensions.height;
            
            // Calcular posição baseada nas coordenadas do Canva
            const leftPx = (field.x as number) * scaleX;
            const topPx = (field.y as number) * scaleY;
            
            // Obter o valor de teste para este campo
            const testValue = testValues[field.id as keyof typeof testValues] || fieldLabels[field.id as keyof typeof fieldLabels] || 'Texto';
            
            // Calcular tamanho do texto baseado na escala
            const scaledFontSize = Math.max(10, field.fontSize * Math.min(scaleX, scaleY) * 0.7);
            
            return (
              <div
                key={field.id}
                className="absolute pointer-events-none select-none"
                style={{
                  left: `${leftPx}px`,
                  top: `${topPx}px`,
                  transform: field.rotation ? `rotate(${field.rotation}deg)` : undefined,
                  transformOrigin: 'top left',
                  zIndex: 10,
                }}
              >
                {/* Fundo semi-transparente para melhor legibilidade */}
                <div
                  className="absolute inset-0 bg-white/80 border border-red-500 rounded"
                  style={{
                    width: field.width ? `${(field.width as number) * scaleX}px` : field.id === 'name' ? 'max-content' : 'auto',
                    minWidth: field.id === 'name' ? 'max-content' : '40px',
                    height: 'auto',
                    minHeight: '20px',
                  }}
                />
                
                {/* Texto do campo */}
                <div
                  className="relative px-1 py-0.5 font-medium"
                  style={{
                    fontSize: `${scaledFontSize}px`,
                    fontFamily: field.fontFamily,
                    fontWeight: field.fontWeight || 'normal',
                    color: field.color,
                    textAlign: field.textAlign || 'center',
                    textShadow: field.textShadow ? '1px 1px 2px rgba(0,0,0,0.5)' : undefined,
                    width: field.width ? `${(field.width as number) * scaleX}px` : 'auto',
                    lineHeight: '1.1',
                    whiteSpace: field.id === 'name' ? 'nowrap' : 'normal',
                    overflow: field.id === 'name' ? 'visible' : 'hidden',
                  }}
                >
                  {testValue}
                </div>
                
                
                {/* Indicador de posição (cruz) */}
                <div className="absolute top-0 left-0 w-2 h-2 bg-red-600 border border-white rounded-full transform -translate-x-1 -translate-y-1"></div>
              </div>
            );
          })}
          
          {/* Grid de referência (opcional) */}
          <div className="absolute inset-0 pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            opacity: 0.3
          }}></div>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-sm text-muted-foreground">
            🎯 <strong>Vermelho</strong> = Posição exata • <strong>Fundo branco</strong> = Área do texto
          </p>
        </div>
      </Card>

      {/* Valores de Teste */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">📝 Valores de Referência (Para Mapeamento Visual)</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ IMPORTANTE</h4>
          <p className="text-sm text-yellow-700">
            Estes valores são apenas para <strong>posicionar os campos visualmente</strong>. 
            Os dados reais serão inseridos na criação do card.
          </p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Digite valores de exemplo para ver como ficam posicionados:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(fieldLabels).map(([fieldId, label]) => (
            <div key={fieldId}>
              <Label className="text-sm font-medium">{label}</Label>
              <Input 
                value={testValues[fieldId as keyof typeof testValues] || ''}
                onChange={(e) => setTestValues(prev => ({
                  ...prev,
                  [fieldId]: e.target.value
                }))}
                placeholder={
                  fieldId === 'name' ? 'Nome da unidade' :
                  fieldId === 'number' ? '#001' :
                  fieldId.includes('attack') || fieldId.includes('defense') || 
                  fieldId.includes('ranged') || fieldId.includes('movement') || 
                  fieldId.includes('morale') ? '0-9' :
                  fieldId === 'experience' ? 'Veterano' :
                  'Valor'
                }
                className="mt-1"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Campos para Mapear */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">3. Configure os Campos (Veja o resultado em tempo real acima ⬆️)</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Como usar:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Digite <strong>X,Y</strong> → Veja o campo aparecer na imagem instantaneamente</li>
            <li>2. Ajuste as coordenadas até ficar no lugar certo</li>
            <li>3. Configure formatação (fonte, cor, tamanho)</li>
            <li>4. Use os <strong>valores de teste</strong> abaixo para ver o texto real</li>
          </ul>
        </div>
        
        <div className="space-y-6">
          {Object.entries(fieldLabels).map(([fieldId, label]) => {
            const field = template.fields.find(f => f.id === fieldId);
            return (
              <div key={fieldId} className="border rounded-lg p-6 bg-white">
                <h4 className="font-semibold mb-4 text-lg">{label}</h4>
                
                {/* Linha 1: Posição e Tamanho */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">X (pixels)</Label>
                    <Input 
                      type="number" 
                      value={field?.x || ''}
                      onChange={(e) => updateField(fieldId, 'x', parseInt(e.target.value) || 0)}
                      placeholder="Ex: 100"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Y (pixels)</Label>
                    <Input 
                      type="number" 
                      value={field?.y || ''}
                      onChange={(e) => updateField(fieldId, 'y', parseInt(e.target.value) || 0)}
                      placeholder="Ex: 150"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Tamanho da Fonte</Label>
                    <Input 
                      type="number" 
                      value={field?.fontSize || ''}
                      onChange={(e) => updateField(fieldId, 'fontSize', parseInt(e.target.value) || 24)}
                      placeholder="Ex: 24"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Cor</Label>
                    <Input 
                      type="color" 
                      value={field?.color || '#000000'}
                      onChange={(e) => updateField(fieldId, 'color', e.target.value)}
                      className="mt-1 h-10"
                    />
                  </div>
                </div>

                {/* Linha 2: Formatação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Fonte</Label>
                    <select 
                      className="w-full p-2 border rounded mt-1 bg-white"
                      value={field?.fontFamily || 'Cinzel, serif'}
                      onChange={(e) => updateField(fieldId, 'fontFamily', e.target.value)}
                    >
                      <option value="Cinzel, serif">Cinzel (Elegante)</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Times New Roman, serif">Times New Roman</option>
                      <option value="Helvetica, sans-serif">Helvetica</option>
                      <option value="Verdana, sans-serif">Verdana</option>
                      <option value="Impact, sans-serif">Impact (Forte)</option>
                      <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Peso da Fonte</Label>
                    <select 
                      className="w-full p-2 border rounded mt-1 bg-white"
                      value={field?.fontWeight || 'normal'}
                      onChange={(e) => updateField(fieldId, 'fontWeight', e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Negrito</option>
                      <option value="300">Leve</option>
                      <option value="500">Médio</option>
                      <option value="600">Semi-Bold</option>
                      <option value="700">Bold</option>
                      <option value="800">Extra Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Alinhamento</Label>
                    <select 
                      className="w-full p-2 border rounded mt-1 bg-white"
                      value={field?.textAlign || 'center'}
                      onChange={(e) => updateField(fieldId, 'textAlign', e.target.value)}
                    >
                      <option value="left">← Esquerda</option>
                      <option value="center">⬛ Centro</option>
                      <option value="right">→ Direita</option>
                    </select>
                  </div>
                </div>

                {/* Linha 3: Opções Avançadas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Largura (opcional)</Label>
                    <Input 
                      type="number" 
                      value={field?.width || ''}
                      onChange={(e) => updateField(fieldId, 'width', parseInt(e.target.value) || undefined)}
                      placeholder="Auto"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Deixe vazio para largura automática</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Rotação (graus)</Label>
                    <Input 
                      type="number" 
                      value={field?.rotation || ''}
                      onChange={(e) => updateField(fieldId, 'rotation', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2 mt-6">
                      <input
                        type="checkbox"
                        id={`shadow-${fieldId}`}
                        checked={field?.textShadow || false}
                        onChange={(e) => updateField(fieldId, 'textShadow', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`shadow-${fieldId}`} className="text-sm">Sombra no texto</Label>
                    </div>
                  </div>
                </div>

                {/* Preview específico do campo */}
                {field && (
                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <Label className="text-sm font-medium text-gray-600">Preview com seu texto:</Label>
                    <div 
                      className="mt-2"
                      style={{
                        fontSize: `${Math.max(12, field.fontSize * 0.5)}px`,
                        fontFamily: field.fontFamily,
                        fontWeight: field.fontWeight || 'normal',
                        color: field.color,
                        textAlign: field.textAlign || 'center',
                        textShadow: field.textShadow ? '1px 1px 2px rgba(0,0,0,0.3)' : undefined,
                        transform: field.rotation ? `rotate(${field.rotation}deg)` : undefined,
                        transformOrigin: 'left center'
                      }}
                    >
                      {testValues[fieldId as keyof typeof testValues] || 'Digite um valor de teste acima'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Ações */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onFinish}>
          Voltar
        </Button>
        <Button onClick={() => alert('Template salvo automaticamente!')}>
          Template Salvo ✓
        </Button>
      </div>
    </div>
  );
};