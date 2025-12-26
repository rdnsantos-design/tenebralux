import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardTemplate, TextFieldMapping } from '@/types/CardTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Hexagon, GripVertical, Trash2, Plus, Eye, EyeOff, 
  Move, Maximize2, RotateCcw, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { HEX_TEMPLATE_WIDTH, HEX_TEMPLATE_HEIGHT } from './TemplateCreator';

const FONT_OPTIONS = [
  'Arial, sans-serif',
  'Cinzel, serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  'Impact, sans-serif',
  'Trebuchet MS, sans-serif',
];

const HEX_FIELD_OPTIONS = [
  { id: 'name', label: 'Nome da Unidade', preview: 'Lanceiros de Anuire' },
  { id: 'experience', label: 'Experiência', preview: 'Veterano' },
  { id: 'attack', label: 'Ataque', preview: '+2' },
  { id: 'defense', label: 'Defesa', preview: '+3' },
  { id: 'ranged', label: 'Distância', preview: '+1' },
  { id: 'movement', label: 'Movimento', preview: '+2' },
  { id: 'morale', label: 'Moral', preview: '+4' },
  { id: 'total-force', label: 'Força Total', preview: '12' },
  { id: 'special-ability-1', label: 'Habilidade 1', preview: 'Escudos' },
  { id: 'special-ability-2', label: 'Habilidade 2', preview: 'Formação' },
  { id: 'special-ability-3', label: 'Habilidade 3', preview: 'Disciplina' },
];

interface HexTemplateMapperProps {
  template: CardTemplate;
  onTemplateUpdate: (template: CardTemplate) => void;
  onFinish?: () => void;
}

export const HexTemplateMapper: React.FC<HexTemplateMapperProps> = ({ 
  template, 
  onTemplateUpdate, 
  onFinish 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [dragState, setDragState] = useState<{
    fieldId: string;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    startMouseX: number;
    startMouseY: number;
    startWidth?: number;
    startHeight?: number;
  } | null>(null);

  const hexClipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

  // Scale factor for display
  const displayWidth = 400;
  const displayHeight = Math.round(displayWidth * (HEX_TEMPLATE_HEIGHT / HEX_TEMPLATE_WIDTH));
  const scaleX = displayWidth / HEX_TEMPLATE_WIDTH;
  const scaleY = displayHeight / HEX_TEMPLATE_HEIGHT;

  const addField = (fieldId: string) => {
    if (template.fields.some(f => f.id === fieldId)) {
      toast.error('Este campo já foi adicionado');
      return;
    }

    const newField: TextFieldMapping = {
      id: fieldId,
      x: HEX_TEMPLATE_WIDTH / 2 - 50, // Center horizontally
      y: HEX_TEMPLATE_HEIGHT / 2 - 15, // Center vertically
      width: 100,
      height: 30,
      fontSize: 18,
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      textAlign: 'center',
      textShadow: true,
    };

    onTemplateUpdate({
      ...template,
      fields: [...template.fields, newField]
    });
    setSelectedFieldId(fieldId);
    toast.success(`Campo "${HEX_FIELD_OPTIONS.find(o => o.id === fieldId)?.label}" adicionado`);
  };

  const updateField = useCallback((fieldId: string, updates: Partial<TextFieldMapping>) => {
    onTemplateUpdate({
      ...template,
      fields: template.fields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    });
  }, [template, onTemplateUpdate]);

  const removeField = (fieldId: string) => {
    onTemplateUpdate({
      ...template,
      fields: template.fields.filter(f => f.id !== fieldId)
    });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
    toast.info('Campo removido');
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string, mode: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();

    const field = template.fields.find(f => f.id === fieldId);
    if (!field) return;

    setSelectedFieldId(fieldId);
    setDragState({
      fieldId,
      mode,
      startX: field.x,
      startY: field.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: field.width || 100,
      startHeight: field.height || 30,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !containerRef.current) return;

    const deltaX = (e.clientX - dragState.startMouseX) / scaleX;
    const deltaY = (e.clientY - dragState.startMouseY) / scaleY;

    if (dragState.mode === 'move') {
      const newX = Math.max(0, Math.min(HEX_TEMPLATE_WIDTH - 50, dragState.startX + deltaX));
      const newY = Math.max(0, Math.min(HEX_TEMPLATE_HEIGHT - 20, dragState.startY + deltaY));
      updateField(dragState.fieldId, { x: Math.round(newX), y: Math.round(newY) });
    } else {
      const newWidth = Math.max(30, (dragState.startWidth || 100) + deltaX);
      const newHeight = Math.max(15, (dragState.startHeight || 30) + deltaY);
      updateField(dragState.fieldId, { 
        width: Math.round(newWidth), 
        height: Math.round(newHeight) 
      });
    }
  }, [dragState, scaleX, scaleY, updateField]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  const selectedField = template.fields.find(f => f.id === selectedFieldId);
  const unmappedFields = HEX_FIELD_OPTIONS.filter(
    opt => !template.fields.some(f => f.id === opt.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Hexagon className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Mapeamento: {template.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Arraste os campos para posicioná-los no hexágono
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={showPreview} onCheckedChange={setShowPreview} />
                <Label className="text-sm">Preview</Label>
              </div>
              {onFinish && (
                <Button onClick={onFinish}>
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campos disponíveis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Campos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unmappedFields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Todos os campos foram mapeados
                </p>
              ) : (
                unmappedFields.map(field => (
                  <Button
                    key={field.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addField(field.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {field.label}
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editor visual hexagonal */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Editor Visual</span>
              <Badge variant="secondary">
                {template.fields.length} campos mapeados
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={containerRef}
              className="relative mx-auto select-none"
              style={{ 
                width: displayWidth, 
                height: displayHeight,
              }}
            >
              {/* Hexagon background */}
              <div
                className="absolute inset-0 border-2 border-primary/30"
                style={{
                  clipPath: hexClipPath,
                  background: template.templateImage 
                    ? `url(${template.templateImage}) center/cover`
                    : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                }}
              />

              {/* Dark overlay when using background image */}
              {template.templateImage && (
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: hexClipPath,
                    background: 'rgba(0, 0, 0, 0.3)',
                  }}
                />
              )}

              {/* Mapped fields */}
              {template.fields.map(field => {
                const fieldConfig = HEX_FIELD_OPTIONS.find(o => o.id === field.id);
                const isSelected = selectedFieldId === field.id;
                const left = field.x * scaleX;
                const top = field.y * scaleY;
                const width = (field.width || 100) * scaleX;
                const height = (field.height || 30) * scaleY;

                return (
                  <div
                    key={field.id}
                    className={`absolute cursor-move transition-shadow ${
                      isSelected 
                        ? 'ring-2 ring-primary ring-offset-1 z-20' 
                        : 'hover:ring-1 hover:ring-primary/50 z-10'
                    }`}
                    style={{
                      left,
                      top,
                      width,
                      height,
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                      border: `1px solid ${isSelected ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)'}`,
                    }}
                    onClick={() => setSelectedFieldId(field.id)}
                    onMouseDown={(e) => handleMouseDown(e, field.id, 'move')}
                  >
                    {/* Field label */}
                    <div className="absolute -top-5 left-0 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded whitespace-nowrap">
                      {fieldConfig?.label}
                    </div>

                    {/* Preview text */}
                    {showPreview && (
                      <div
                        className="w-full h-full flex items-center overflow-hidden pointer-events-none"
                        style={{
                          fontSize: Math.max(8, field.fontSize * Math.min(scaleX, scaleY)),
                          fontFamily: field.fontFamily,
                          color: field.color,
                          textAlign: field.textAlign || 'center',
                          justifyContent: field.textAlign === 'left' ? 'flex-start' : field.textAlign === 'right' ? 'flex-end' : 'center',
                          textShadow: field.textShadow ? '0 1px 2px rgba(0,0,0,0.8)' : 'none',
                          fontWeight: field.fontWeight || 'normal',
                        }}
                      >
                        {fieldConfig?.preview}
                      </div>
                    )}

                    {/* Resize handle */}
                    {isSelected && (
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary cursor-se-resize rounded-sm"
                        onMouseDown={(e) => handleMouseDown(e, field.id, 'resize')}
                      />
                    )}

                    {/* Move icon */}
                    {isSelected && (
                      <div className="absolute -top-5 -right-1">
                        <Move className="w-3 h-3 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Hexagon border overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: hexClipPath,
                  border: '3px solid rgba(100, 100, 100, 0.5)',
                }}
              />
            </div>

            {/* Dimension info */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              Dimensões: {HEX_TEMPLATE_WIDTH}×{HEX_TEMPLATE_HEIGHT}px (9cm a 300 DPI)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Field properties editor */}
      {selectedField && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Propriedades: {HEX_FIELD_OPTIONS.find(o => o.id === selectedField.id)?.label}
              </CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeField(selectedField.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div>
                <Label className="text-xs">X (px)</Label>
                <Input
                  type="number"
                  value={selectedField.x}
                  onChange={e => updateField(selectedField.id, { x: parseInt(e.target.value) || 0 })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Y (px)</Label>
                <Input
                  type="number"
                  value={selectedField.y}
                  onChange={e => updateField(selectedField.id, { y: parseInt(e.target.value) || 0 })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Largura</Label>
                <Input
                  type="number"
                  value={selectedField.width || 100}
                  onChange={e => updateField(selectedField.id, { width: parseInt(e.target.value) || 100 })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Altura</Label>
                <Input
                  type="number"
                  value={selectedField.height || 30}
                  onChange={e => updateField(selectedField.id, { height: parseInt(e.target.value) || 30 })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Fonte (px)</Label>
                <Input
                  type="number"
                  value={selectedField.fontSize}
                  onChange={e => updateField(selectedField.id, { fontSize: parseInt(e.target.value) || 16 })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Cor</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={selectedField.color}
                    onChange={e => updateField(selectedField.id, { color: e.target.value })}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    type="text"
                    value={selectedField.color}
                    onChange={e => updateField(selectedField.id, { color: e.target.value })}
                    className="h-8 flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Família</Label>
                <Select 
                  value={selectedField.fontFamily} 
                  onValueChange={value => updateField(selectedField.id, { fontFamily: value })}
                >
                  <SelectTrigger className="h-8">
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
                <Label className="text-xs">Alinhamento</Label>
                <Select 
                  value={selectedField.textAlign || 'center'} 
                  onValueChange={value => updateField(selectedField.id, { textAlign: value as any })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={selectedField.textShadow || false}
                  onCheckedChange={checked => updateField(selectedField.id, { textShadow: checked })}
                />
                <Label className="text-sm">Sombra no texto</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Peso:</Label>
                <Select 
                  value={selectedField.fontWeight || 'normal'} 
                  onValueChange={value => updateField(selectedField.id, { fontWeight: value as any })}
                >
                  <SelectTrigger className="h-8 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="500">Médio</SelectItem>
                    <SelectItem value="600">Semi-Bold</SelectItem>
                    <SelectItem value="bold">Negrito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapped fields list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Campos Mapeados ({template.fields.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {template.fields.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Adicione campos da lista à esquerda para começar a mapear
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {template.fields.map(field => {
                const config = HEX_FIELD_OPTIONS.find(o => o.id === field.id);
                return (
                  <Badge
                    key={field.id}
                    variant={selectedFieldId === field.id ? 'default' : 'secondary'}
                    className="cursor-pointer py-1.5 px-3"
                    onClick={() => setSelectedFieldId(field.id)}
                  >
                    {config?.label}
                    <button
                      className="ml-2 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(field.id);
                      }}
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
