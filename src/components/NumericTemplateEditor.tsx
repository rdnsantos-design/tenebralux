import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CardTemplate, TextFieldMapping } from '@/types/CardTemplate';

// Constantes padronizadas do sistema de coordenadas
const BASE_W = 1181;
const BASE_H = 768;

interface NumericTemplateEditorProps {
  template: CardTemplate;
  onTemplateUpdate: (template: CardTemplate) => void;
}

export const NumericTemplateEditor: React.FC<NumericTemplateEditorProps> = ({
  template,
  onTemplateUpdate
}) => {
  const [editedTemplate, setEditedTemplate] = useState<CardTemplate>(template);

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

  const updateField = (fieldId: string, property: keyof TextFieldMapping, value: any) => {
    const updatedFields = editedTemplate.fields.map(field => 
      field.id === fieldId 
        ? { ...field, [property]: value }
        : field
    );

    const updatedTemplate = {
      ...editedTemplate,
      fields: updatedFields
    };

    setEditedTemplate(updatedTemplate);
  };

  const addField = (fieldId: string) => {
    const newField: TextFieldMapping = {
      id: fieldId,
      x: 100,
      y: 100,
      fontSize: 24,
      fontFamily: 'Cinzel',
      color: '#000000'
    };

    const updatedTemplate = {
      ...editedTemplate,
      fields: [...editedTemplate.fields, newField]
    };

    setEditedTemplate(updatedTemplate);
  };

  const saveTemplate = () => {
    onTemplateUpdate(editedTemplate);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Configuração do Template</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Largura do Template (px)</Label>
            <Input 
              type="number" 
              value={editedTemplate.width}
              onChange={(e) => setEditedTemplate({
                ...editedTemplate,
                width: parseInt(e.target.value) || BASE_W
              })}
            />
          </div>
          <div>
            <Label>Altura do Template (px)</Label>
            <Input 
              type="number" 
              value={editedTemplate.height}
              onChange={(e) => setEditedTemplate({
                ...editedTemplate,
                height: parseInt(e.target.value) || BASE_H
              })}
            />
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(fieldLabels).map(([fieldId, label]) => {
            const field = editedTemplate.fields.find(f => f.id === fieldId);
            
            if (!field) {
              return (
                <div key={fieldId} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{label}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addField(fieldId)}
                  >
                    Adicionar Campo
                  </Button>
                </div>
              );
            }

            return (
              <Card key={fieldId} className="p-4">
                <h4 className="font-semibold mb-3">{label}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Posição X (px)</Label>
                    <Input 
                      type="number" 
                      value={field.x}
                      onChange={(e) => updateField(fieldId, 'x', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Posição Y (px)</Label>
                    <Input 
                      type="number" 
                      value={field.y}
                      onChange={(e) => updateField(fieldId, 'y', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Tamanho da Fonte (px)</Label>
                    <Input 
                      type="number" 
                      value={field.fontSize}
                      onChange={(e) => updateField(fieldId, 'fontSize', parseInt(e.target.value) || 12)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <Label>Família da Fonte</Label>
                    <Input 
                      value={field.fontFamily}
                      onChange={(e) => updateField(fieldId, 'fontFamily', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Input 
                      type="color" 
                      value={field.color}
                      onChange={(e) => updateField(fieldId, 'color', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Alinhamento</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={field.textAlign || 'left'}
                      onChange={(e) => updateField(fieldId, 'textAlign', e.target.value as 'left' | 'center' | 'right')}
                    >
                      <option value="left">Esquerda</option>
                      <option value="center">Centro</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={saveTemplate}>
            Salvar Template
          </Button>
        </div>
      </Card>
    </div>
  );
};