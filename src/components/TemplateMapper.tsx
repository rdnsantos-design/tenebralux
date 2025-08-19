import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardTemplate, TextFieldMapping } from '@/types/CardTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FONT_OPTIONS = [
  'Arial, sans-serif',
  'Cinzel, serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  'Courier New, monospace',
  'Impact, sans-serif',
  'Trebuchet MS, sans-serif',
  'Comic Sans MS, cursive',
  'Palatino, serif'
];

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
  { id: 'special-ability-1', label: 'Habilidade Especial 1' },
  { id: 'special-ability-2', label: 'Habilidade Especial 2' },
  { id: 'special-ability-3', label: 'Habilidade Especial 3' },
  { id: 'special-ability-4', label: 'Habilidade Especial 4' },
  { id: 'special-ability-5', label: 'Habilidade Especial 5' },
];

interface TemplateMapperProps {
  template: CardTemplate;
  onTemplateUpdate: (template: CardTemplate) => void;
  onFinish?: () => void;
}

export const TemplateMapper: React.FC<TemplateMapperProps> = ({ template, onTemplateUpdate, onFinish }) => {
  const [selectedField, setSelectedField] = useState<string>('');
  const [clickMode, setClickMode] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [dragData, setDragData] = useState<{ 
    field: string; 
    startX: number; 
    startY: number; 
    startMouseX: number; 
    startMouseY: number;
    mode: 'move' | 'resize';
  } | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!clickMode || !selectedField) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Converter para coordenadas em pixels baseadas nas dimensões do template
    const scaleX = template.width / rect.width;
    const scaleY = template.height / rect.height;
    
    const x = Math.round(clickX * scaleX);
    const y = Math.round(clickY * scaleY);

    const newField: TextFieldMapping = {
      id: selectedField,
      x: x,
      y: y,
      width: 100, // largura padrão em pixels
      height: 30, // altura padrão em pixels
      fontSize: 24,
      fontFamily: 'Cinzel, serif',
      color: '#000000',
      textAlign: 'center',
      textShadow: false,
    };

    const updatedTemplate = {
      ...template,
      fields: [...template.fields.filter(f => f.id !== selectedField), newField]
    };

    onTemplateUpdate(updatedTemplate);
    setClickMode(false);
    setSelectedField('');
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

  const handleMouseDown = (e: React.MouseEvent, fieldId: string, mode: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    const field = template.fields.find(f => f.id === fieldId);
    if (!field) return;

    setDragData({
      field: fieldId,
      startX: field.x,
      startY: field.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      mode
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragData || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragData.startMouseX;
    const deltaY = e.clientY - dragData.startMouseY;

    const field = template.fields.find(f => f.id === dragData.field);
    if (!field) return;

    if (dragData.mode === 'move') {
      // Converter delta para pixels
      const scaleX = template.width / rect.width;
      const scaleY = template.height / rect.height;
      
      const deltaXPx = deltaX * scaleX;
      const deltaYPx = deltaY * scaleY;
      
      const newX = Math.max(0, Math.min(template.width - (field.width || 100), dragData.startX + deltaXPx));
      const newY = Math.max(0, Math.min(template.height - (field.height || 30), dragData.startY + deltaYPx));
      updateField(dragData.field, { x: Math.round(newX), y: Math.round(newY) });
    } else if (dragData.mode === 'resize') {
      // Converter delta para pixels
      const scaleX = template.width / rect.width;
      const scaleY = template.height / rect.height;
      
      const deltaWidthPx = deltaX * scaleX;
      const deltaHeightPx = deltaY * scaleY;
      
      const newWidth = Math.max(20, Math.min(template.width - field.x, (field.width || 100) + deltaWidthPx));
      const newHeight = Math.max(15, Math.min(template.height - field.y, (field.height || 30) + deltaHeightPx));
      updateField(dragData.field, { width: Math.round(newWidth), height: Math.round(newHeight) });
    }
  };

  const handleMouseUp = () => {
    setDragData(null);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragData) {
        handleMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Mapeamento de Template</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Template salvo automaticamente conforme você mapeia os campos
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  // Template já está sendo salvo automaticamente
                  alert('Template salvo com sucesso!');
                }}
                variant="default"
              >
                Salvar Template
              </Button>
              {onFinish && (
                <Button onClick={onFinish} variant="outline">
                  Finalizar Mapeamento
                </Button>
              )}
            </div>
          </div>
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
            />
            
            {/* Só mostra aviso quando está em modo de mapeamento */}
            {clickMode && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium shadow-lg">
                Clique para mapear: {FIELD_OPTIONS.find(opt => opt.id === selectedField)?.label}
              </div>
            )}

            {/* Visualizar campos mapeados com controles visuais */}
            {template.fields.map(field => {
              // Calcular posições e tamanhos baseados nas dimensões do template
              const imgRect = imageRef.current?.getBoundingClientRect();
              if (!imgRect) return null;
              
              const scaleX = imgRect.width / template.width;
              const scaleY = imgRect.height / template.height;
              
              const leftPx = (field.x as number) * scaleX;
              const topPx = (field.y as number) * scaleY;
              const widthPx = (field.width || 100) * scaleX;
              const heightPx = (field.height || 30) * scaleY;
              
              return (
                <div key={field.id}>
                  {/* Campo principal */}
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500/10 cursor-move flex items-center justify-center"
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, field.id, 'move')}
                  >
                    {/* Label do campo */}
                    <div className="absolute -top-6 left-0 bg-blue-500 text-white px-1 text-xs whitespace-nowrap rounded">
                      {FIELD_OPTIONS.find(opt => opt.id === field.id)?.label}
                    </div>
                    
                    {/* Texto de demonstração */}
                    <div 
                      className="text-xs font-medium pointer-events-none w-full h-full flex items-center"
                      style={{
                        fontSize: `${Math.max(8, field.fontSize * Math.min(scaleX, scaleY) * 0.6)}px`,
                        color: field.color,
                        fontFamily: field.fontFamily,
                        textAlign: field.textAlign || 'left',
                        justifyContent: field.textAlign === 'center' ? 'center' : field.textAlign === 'right' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {field.id === 'name' ? 'Nome da Unidade' : 
                       field.id === 'attack' ? '8' :
                       field.id === 'defense' ? '6' :
                       field.id === 'ranged' ? '4' :
                       field.id === 'movement' ? '3' :
                       field.id === 'morale' ? '7' :
                       field.id === 'experience' ? 'Veterano' :
                       field.id === 'total-force' ? '25' :
                       field.id === 'maintenance-cost' ? '3' :
                       'Texto'}
                    </div>
                    
                    {/* Alça de redimensionamento */}
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize border border-white"
                      onMouseDown={(e) => handleMouseDown(e, field.id, 'resize')}
                    />
                  </div>
                </div>
              );
            })}
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
                
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div>
                    <Label>X (px)</Label>
                    <Input
                      type="number"
                      value={field.x}
                      onChange={e => updateField(field.id, { x: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Y (px)</Label>
                    <Input
                      type="number"
                      value={field.y}
                      onChange={e => updateField(field.id, { y: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Largura (px)</Label>
                    <Input
                      type="number"
                      value={field.width || 100}
                      onChange={e => updateField(field.id, { width: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                  <div>
                    <Label>Altura (px)</Label>
                    <Input
                      type="number"
                      value={field.height || 30}
                      onChange={e => updateField(field.id, { height: parseInt(e.target.value) || 30 })}
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
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  <div>
                    <Label>Fonte</Label>
                    <Select 
                      value={field.fontFamily} 
                      onValueChange={value => updateField(field.id, { fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(font => (
                          <SelectItem key={font} value={font}>
                            <span style={{ fontFamily: font }}>{font.split(',')[0]}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Peso da Fonte</Label>
                    <Select 
                      value={field.fontWeight || 'normal'} 
                      onValueChange={value => updateField(field.id, { fontWeight: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Negrito</SelectItem>
                        <SelectItem value="500">Médio</SelectItem>
                        <SelectItem value="600">Semi-Bold</SelectItem>
                        <SelectItem value="700">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Alinhamento</Label>
                    <Select 
                      value={field.textAlign || 'left'} 
                      onValueChange={value => updateField(field.id, { textAlign: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`shadow-${field.id}`}
                      checked={field.textShadow || false}
                      onChange={e => updateField(field.id, { textShadow: e.target.checked })}
                    />
                    <Label htmlFor={`shadow-${field.id}`}>Sombra</Label>
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