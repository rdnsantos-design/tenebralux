import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardTemplate, TextFieldMapping } from '@/types/CardTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TemplateMapperProps {
  template: CardTemplate;
  onTemplateUpdate: (template: CardTemplate) => void;
}

const FIELD_OPTIONS = [
  { id: 'name', label: 'Nome da Unidade' },
  { id: 'number', label: 'Número' },
  { id: 'attack', label: 'Ataque' },
  { id: 'defense', label: 'Defesa' },
  { id: 'ranged', label: 'Distância' },
  { id: 'movement', label: 'Movimento' },
  { id: 'morale', label: 'Moral' },
  { id: 'experience', label: 'Experiência' },
  { id: 'total-force', label: 'Força Total' },
  { id: 'maintenance-cost', label: 'Custo de Manutenção' },
  { id: 'posture', label: 'Postura' },
  { id: 'special-abilities', label: 'Habilidades Especiais' },
  { id: 'pressure-boxes', label: 'Caixas de Pressão' },
  { id: 'life-boxes', label: 'Caixas de Vida' },
];

export const TemplateMapper: React.FC<TemplateMapperProps> = ({ template, onTemplateUpdate }) => {
  const [selectedField, setSelectedField] = useState<string>('');
  const [clickMode, setClickMode] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!clickMode || !selectedField) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newField: TextFieldMapping = {
      id: selectedField,
      x: Math.round(x),
      y: Math.round(y),
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      textAlign: 'left',
    };

    const updatedTemplate = {
      ...template,
      fields: [...template.fields.filter(f => f.id !== selectedField), newField]
    };

    onTemplateUpdate(updatedTemplate);
    setClickMode(false);
    setSelectedField('');
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top)
    });
  };

  const updateField = (fieldId: string, updates: Partial<TextFieldMapping>) => {
    const updatedTemplate = {
      ...template,
      fields: template.fields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    };
    onTemplateUpdate(updatedTemplate);
  };

  const removeField = (fieldId: string) => {
    const updatedTemplate = {
      ...template,
      fields: template.fields.filter(f => f.id !== fieldId)
    };
    onTemplateUpdate(updatedTemplate);
  };

  const startMapping = () => {
    if (!selectedField) return;
    setClickMode(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mapeamento de Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Campo para mapear</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um campo" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={startMapping} 
              disabled={!selectedField}
              variant={clickMode ? "destructive" : "default"}
            >
              {clickMode ? 'Clique na imagem' : 'Mapear Campo'}
            </Button>
          </div>

          <div className="relative border rounded-lg overflow-hidden">
            <img
              ref={imageRef}
              src={template.templateImage}
              alt="Template"
              className={`max-w-full h-auto ${clickMode ? 'cursor-crosshair' : 'cursor-default'}`}
              onClick={handleImageClick}
              onMouseMove={handleImageMouseMove}
            />
            
            {clickMode && (
              <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-sm">
                Posição: {mousePos.x}, {mousePos.y}
              </div>
            )}

            {/* Visualizar campos mapeados */}
            {template.fields.map(field => (
              <div
                key={field.id}
                className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  width: field.width ? `${field.width}px` : '100px',
                  height: field.height ? `${field.height}px` : '20px',
                }}
              >
                <div className="absolute -top-6 left-0 bg-red-500 text-white px-1 text-xs">
                  {FIELD_OPTIONS.find(opt => opt.id === field.id)?.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de campos mapeados */}
      <Card>
        <CardHeader>
          <CardTitle>Campos Mapeados ({template.fields.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {template.fields.map(field => (
              <div key={field.id} className="border rounded p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">
                    {FIELD_OPTIONS.find(opt => opt.id === field.id)?.label}
                  </h4>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => removeField(field.id)}
                  >
                    Remover
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label>X</Label>
                    <Input
                      type="number"
                      value={field.x}
                      onChange={e => updateField(field.id, { x: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Y</Label>
                    <Input
                      type="number"
                      value={field.y}
                      onChange={e => updateField(field.id, { y: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Tamanho da Fonte</Label>
                    <Input
                      type="number"
                      value={field.fontSize}
                      onChange={e => updateField(field.id, { fontSize: parseInt(e.target.value) || 16 })}
                    />
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Input
                      type="color"
                      value={field.color}
                      onChange={e => updateField(field.id, { color: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};