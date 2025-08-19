import React from 'react';
import { CardTemplate, CardData } from '@/types/CardTemplate';

interface CardRendererProps {
  template: CardTemplate;
  data: CardData;
  className?: string;
}

export const CardRenderer: React.FC<CardRendererProps> = ({ template, data, className }) => {
  const renderField = (fieldId: string, value: string | number) => {
    const field = template.fields.find(f => f.id === fieldId);
    if (!field) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${field.x}px`,
      top: `${field.y}px`,
      fontSize: `${field.fontSize}px`,
      fontFamily: field.fontFamily,
      fontWeight: field.fontWeight || 'normal',
      color: field.color,
      textAlign: field.textAlign || 'left',
      transform: field.rotation ? `rotate(${field.rotation}deg)` : undefined,
      width: field.width ? `${field.width}px` : 'auto',
      height: field.height ? `${field.height}px` : 'auto',
      overflow: 'hidden',
      lineHeight: '1.2',
      maxHeight: field.maxLines ? `${field.fontSize * 1.2 * field.maxLines}px` : undefined,
      display: '-webkit-box',
      WebkitLineClamp: field.maxLines,
      WebkitBoxOrient: 'vertical' as const,
      textShadow: field.textShadow ? '2px 2px 4px rgba(0,0,0,0.5)' : undefined,
    };

    return (
      <div key={fieldId} style={style}>
        {value}
      </div>
    );
  };

  const renderPressureBoxes = () => {
    const pressureField = template.fields.find(f => f.id === 'pressure-boxes');
    if (!pressureField) return null;

    const boxes = [];
    const boxSize = 20;
    const spacing = 5;
    
    for (let i = 0; i < 14; i++) {
      const x = pressureField.x + (i % 7) * (boxSize + spacing);
      const y = pressureField.y + Math.floor(i / 7) * (boxSize + spacing);
      const isFilled = i < data.normalPressure;
      
      boxes.push(
        <div
          key={`pressure-${i}`}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${boxSize}px`,
            height: `${boxSize}px`,
            backgroundColor: isFilled ? '#000' : 'transparent',
            border: '1px solid #000',
          }}
        />
      );
    }
    
    return boxes;
  };

  const renderLifeBoxes = () => {
    const lifeField = template.fields.find(f => f.id === 'life-boxes');
    if (!lifeField) return null;

    const boxes = [];
    const boxSize = 20;
    const spacing = 5;
    
    for (let i = 0; i < 14; i++) {
      const x = lifeField.x + (i % 7) * (boxSize + spacing);
      const y = lifeField.y + Math.floor(i / 7) * (boxSize + spacing);
      const isFilled = i < (data.totalForce - data.hits);
      
      boxes.push(
        <div
          key={`life-${i}`}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${boxSize}px`,
            height: `${boxSize}px`,
            backgroundColor: isFilled ? '#ff69b4' : 'transparent',
            border: '1px solid #000',
          }}
        />
      );
    }
    
    return boxes;
  };

  const renderSpecialAbilities = () => {
    const abilitiesField = template.fields.find(f => f.id === 'special-abilities');
    if (!abilitiesField) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: `${abilitiesField.x}px`,
          top: `${abilitiesField.y}px`,
          width: abilitiesField.width ? `${abilitiesField.width}px` : 'auto',
          height: abilitiesField.height ? `${abilitiesField.height}px` : 'auto',
          fontSize: `${abilitiesField.fontSize}px`,
          fontFamily: abilitiesField.fontFamily,
          color: abilitiesField.color,
          overflow: 'hidden',
        }}
      >
        {data.specialAbilities.map((ability, index) => (
          <div key={index} style={{ marginBottom: '4px' }}>
            {ability}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block' }}>
      <img 
        src={template.templateImage} 
        alt="Card Template"
        style={{ 
          width: `${template.width}px`, 
          height: `${template.height}px`,
          display: 'block'
        }}
      />
      
      {/* Campos de texto simples */}
      {renderField('name', data.name)}
      {renderField('number', `# ${data.number}`)}
      {renderField('attack', data.attack)}
      {renderField('defense', data.defense)}
      {renderField('ranged', data.ranged)}
      {renderField('movement', data.movement)}
      {renderField('morale', data.morale)}
      {renderField('experience', data.experience)}
      {renderField('total-force', data.totalForce)}
      {renderField('maintenance-cost', data.maintenanceCost)}
      {renderField('posture', data.currentPosture)}
      
      {/* Campos especiais */}
      {renderSpecialAbilities()}
      {renderPressureBoxes()}
      {renderLifeBoxes()}
    </div>
  );
};