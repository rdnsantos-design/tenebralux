import React from 'react';
import { CardTemplate, CardData } from '@/types/CardTemplate';

interface CardRendererProps {
  template: CardTemplate;
  data: CardData;
  className?: string;
}

export const CardRenderer: React.FC<CardRendererProps> = ({ template, data, className }) => {
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  
  const renderField = (fieldId: string, value: string | number) => {
    const field = template.fields.find(f => f.id === fieldId);
    if (!field || !imageRef.current || !imageLoaded) return null;

    // USAR A MESMA LÓGICA DO TEMPLATEMAPPER
    const imgRect = imageRef.current.getBoundingClientRect();
    if (!imgRect) return null;
    
    const scaleX = imgRect.width / template.width;
    const scaleY = imgRect.height / template.height;
    
    const leftPx = (field.x as number) * scaleX;
    const topPx = (field.y as number) * scaleY;
    const widthPx = (field.width || 100) * scaleX;
    const heightPx = (field.height || 30) * scaleY;
    
    console.log('CardRenderer - Cálculo de escala:', {
      fieldId,
      templateSize: { width: template.width, height: template.height },
      imageSize: { width: imgRect.width, height: imgRect.height },
      scale: { x: scaleX, y: scaleY },
      originalPos: { x: field.x, y: field.y },
      finalPos: { x: leftPx, y: topPx }
    });

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${leftPx}px`,
      top: `${topPx}px`,
      width: `${widthPx}px`,
      height: `${heightPx}px`,
      fontSize: `${Math.max(8, field.fontSize * Math.min(scaleX, scaleY))}px`,
      fontFamily: field.fontFamily,
      fontWeight: field.fontWeight || 'normal',
      color: field.color,
      textAlign: field.textAlign || 'left',
      transform: field.rotation ? `rotate(${field.rotation}deg)` : undefined,
      overflow: 'hidden',
      lineHeight: '1.2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: field.textAlign === 'center' ? 'center' : field.textAlign === 'right' ? 'flex-end' : 'flex-start',
      textShadow: field.textShadow ? '1px 1px 2px rgba(0,0,0,0.3)' : undefined,
      zIndex: 10,
      pointerEvents: 'none'
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
    const elements = [];
    
    for (let i = 1; i <= 5; i++) {
      const abilityField = template.fields.find(f => f.id === `special-ability-${i}`);
      if (abilityField && data.specialAbilities[i - 1]) {
        elements.push(
          <div
            key={`ability-${i}`}
            style={{
              position: 'absolute',
              left: `${abilityField.x}px`,
              top: `${abilityField.y}px`,
              width: abilityField.width ? `${abilityField.width}px` : 'auto',
              height: abilityField.height ? `${abilityField.height}px` : 'auto',
              fontSize: `${abilityField.fontSize}px`,
              fontFamily: abilityField.fontFamily,
              fontWeight: abilityField.fontWeight || 'normal',
              color: abilityField.color,
              textAlign: abilityField.textAlign || 'left',
              transform: abilityField.rotation ? `rotate(${abilityField.rotation}deg)` : undefined,
              textShadow: abilityField.textShadow ? '1px 1px 2px rgba(0,0,0,0.5)' : undefined,
              overflow: 'hidden',
            }}
          >
            {data.specialAbilities[i - 1]}
          </div>
        );
      }
    }
    
    return elements.length > 0 ? <>{elements}</> : null;
  };

  return (
    <div 
      className={className} 
      style={{ position: 'relative', display: 'inline-block', width: '100%', height: '100%' }}
    >
      <img 
        ref={imageRef}
        src={template.templateImage} 
        alt="Card Template"
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Campos mapeados */}
      {renderField('name', data.name)}
      {renderField('number', data.number)}
      {renderField('attack', data.attack)}
      {renderField('defense', data.defense)}
      {renderField('ranged', data.ranged)}
      {renderField('movement', data.movement)}
      {renderField('morale', data.morale)}
      {renderField('experience', data.experience)}
      {renderField('total-force', data.totalForce)}
      {renderField('maintenance-cost', data.maintenanceCost)}
      
      {/* Habilidades especiais */}
      {renderSpecialAbilities()}
    </div>
  );
};