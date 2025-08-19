import React, { useState } from 'react';
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
  const [imageDimensions, setImageDimensions] = useState({
    width: template.width || 1181,
    height: template.height || 767
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
        <div className="relative border rounded-lg overflow-hidden bg-gray-50">
          <img
            src={template.templateImage}
            alt="Template"
            className="w-full h-auto"
            style={{ maxHeight: '500px', objectFit: 'contain' }}
          />
          
          {/* Visualizar campos mapeados */}
          {template.fields.map(field => {
            const img = document.querySelector('.relative img') as HTMLImageElement;
            if (!img) return null;
            
            // Calcular posições baseadas na imagem exibida
            const imgRect = img.getBoundingClientRect();
            const scaleX = img.offsetWidth / imageDimensions.width;
            const scaleY = img.offsetHeight / imageDimensions.height;
            
            return (
              <div
                key={field.id}
                className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                style={{
                  left: `${(field.x as number) * scaleX}px`,
                  top: `${(field.y as number) * scaleY}px`,
                  width: `${Math.max(60, field.fontSize * scaleX * 3)}px`,
                  height: `${Math.max(20, field.fontSize * scaleY * 1.2)}px`,
                }}
              >
                <div className="absolute -top-6 left-0 bg-red-500 text-white px-1 text-xs whitespace-nowrap">
                  {fieldLabels[field.id as keyof typeof fieldLabels]}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Campos para Mapear */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">3. Coordenadas dos Campos (pixels do Canva)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          💡 No Canva: clique no campo → veja X e Y na barra lateral direita → insira aqui
        </p>
        
        <div className="space-y-6">
          {Object.entries(fieldLabels).map(([fieldId, label]) => (
            <div key={fieldId} className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">{label}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label>X (pixels)</Label>
                  <Input 
                    type="number" 
                    value={getFieldValue(fieldId, 'x')}
                    onChange={(e) => updateField(fieldId, 'x', parseInt(e.target.value) || 0)}
                    placeholder="Ex: 100"
                  />
                </div>
                <div>
                  <Label>Y (pixels)</Label>
                  <Input 
                    type="number" 
                    value={getFieldValue(fieldId, 'y')}
                    onChange={(e) => updateField(fieldId, 'y', parseInt(e.target.value) || 0)}
                    placeholder="Ex: 150"
                  />
                </div>
                <div>
                  <Label>Tamanho da Fonte</Label>
                  <Input 
                    type="number" 
                    value={getFieldValue(fieldId, 'fontSize')}
                    onChange={(e) => updateField(fieldId, 'fontSize', parseInt(e.target.value) || 24)}
                    placeholder="Ex: 24"
                  />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input 
                    type="color" 
                    value={getFieldValue(fieldId, 'color') || '#000000'}
                    onChange={(e) => updateField(fieldId, 'color', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
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