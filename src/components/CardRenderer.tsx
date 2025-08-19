import React, { useEffect, useRef, useState } from 'react';
import { CardTemplate, CardData } from '@/types/CardTemplate';

interface CardRendererProps {
  template: CardTemplate;
  data: CardData;
  className?: string;
  isExport?: boolean;
}

// Constantes do sistema de coordenadas
const BASE_W = 1181;
const BASE_H = 768;

// Funções auxiliares
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

interface FieldSpec {
  x: number;
  y: number; 
  w: number;
  h: number;
}

export const CardRenderer: React.FC<CardRendererProps> = ({ template, data, className, isExport = false }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);

  useEffect(() => {
    if (frameRef.current) {
      setIsFrameReady(true);
    }
  }, []);

  // Validação de campos do template
  const validateFields = (fields: any[]) => {
    const errs = [];
    for (const f of fields) {
      if (f.x < 0 || f.y < 0 || (f.width && f.width <= 0) || (f.height && f.height <= 0)) {
        errs.push(['neg/zero', f]);
      }
      if (f.x + (f.width || 100) > BASE_W || f.y + (f.height || 30) > BASE_H) {
        errs.push(['outOfBounds', f]);
      }
    }
    if (errs.length > 0) {
      console.warn('Template validation errors:', errs);
    }
    return errs;
  };

  // Sistema de escala e posicionamento
  const getScaledPosition = (spec: FieldSpec) => {
    if (!frameRef.current) return { left: 0, top: 0, width: 0, height: 0 };
    
    const rect = frameRef.current.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const scaleX = W / BASE_W;
    const scaleY = H / BASE_H;

    const toPxX = (x: number) => Math.round(x * scaleX);
    const toPxY = (y: number) => Math.round(y * scaleY);
    const toPxW = (w: number) => Math.round(w * scaleX);
    const toPxH = (h: number) => Math.round(h * scaleY);

    const L = toPxX(spec.x); // Mantém posição exata mapeada
    const T = toPxY(spec.y) - 8; // Move 8px up, mantém posição exata

    return {
      left: L,
      top: T,
      width: toPxW(spec.w),
      height: toPxH(spec.h)
    };
  };

  const renderField = (fieldId: string, value: string | number) => {
    const field = template.fields.find(f => f.id === fieldId);
    if (!field || !isFrameReady) return null;

    // Validar campo individualmente
    validateFields([field]);

    const spec: FieldSpec = {
      x: field.x,
      y: field.y,
      w: field.width || 100,
      h: field.height || 30
    };

    const pos = getScaledPosition(spec);

    const style: React.CSSProperties = {
      left: `${pos.left}px`,
      top: `${pos.top}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
      fontSize: `${Math.max(8, field.fontSize * Math.min(pos.width / spec.w, pos.height / spec.h))}px`,
      fontFamily: field.fontFamily,
      fontWeight: field.fontWeight || 'normal',
      color: field.color,
      textAlign: field.textAlign || 'left',
      transform: field.rotation ? `rotate(${field.rotation}deg)` : 'none',
      textShadow: field.textShadow ? '1px 1px 2px rgba(0,0,0,0.3)' : undefined,
      display: 'flex',
      alignItems: 'center',
      justifyContent: field.textAlign === 'center' ? 'center' : field.textAlign === 'right' ? 'flex-end' : 'flex-start',
      overflow: 'hidden'
    };

    return (
      <div key={fieldId} className="field" style={style}>
        {value}
      </div>
    );
  };

  const renderPressureBoxes = () => {
    const pressureField = template.fields.find(f => f.id === 'pressure-boxes');
    if (!pressureField || !isFrameReady) return null;

    const boxes = [];
    const boxSize = 20;
    const spacing = 5;
    
    for (let i = 0; i < 14; i++) {
      const x = pressureField.x + (i % 7) * (boxSize + spacing);
      const y = pressureField.y + Math.floor(i / 7) * (boxSize + spacing);
      const isFilled = i < data.normalPressure;
      
      const spec: FieldSpec = { x, y, w: boxSize, h: boxSize };
      const pos = getScaledPosition(spec);
      
      boxes.push(
        <div
          key={`pressure-${i}`}
          className="field"
          style={{
            left: `${pos.left}px`,
            top: `${pos.top}px`,
            width: `${pos.width}px`,
            height: `${pos.height}px`,
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
    if (!lifeField || !isFrameReady) return null;

    const boxes = [];
    const boxSize = 20;
    const spacing = 5;
    
    for (let i = 0; i < 14; i++) {
      const x = lifeField.x + (i % 7) * (boxSize + spacing);
      const y = lifeField.y + Math.floor(i / 7) * (boxSize + spacing);
      const isFilled = i < (data.totalForce - data.hits);
      
      const spec: FieldSpec = { x, y, w: boxSize, h: boxSize };
      const pos = getScaledPosition(spec);
      
      boxes.push(
        <div
          key={`life-${i}`}
          className="field"
          style={{
            left: `${pos.left}px`,
            top: `${pos.top}px`,
            width: `${pos.width}px`,
            height: `${pos.height}px`,
            backgroundColor: isFilled ? '#ff69b4' : 'transparent',
            border: '1px solid #000',
          }}
        />
      );
    }
    
    return boxes;
  };

  const renderSpecialAbilities = () => {
    if (!isFrameReady) return null;
    
    const elements = [];
    
    for (let i = 1; i <= 5; i++) {
      const abilityField = template.fields.find(f => f.id === `special-ability-${i}`);
      if (abilityField && data.specialAbilities[i - 1]) {
        // Validar campo
        validateFields([abilityField]);

        const spec: FieldSpec = {
          x: abilityField.x,
          y: abilityField.y,
          w: abilityField.width || 200,
          h: abilityField.height || 30
        };

        const pos = getScaledPosition(spec);
        
        elements.push(
          <div
            key={`ability-${i}`}
            className="field"
            style={{
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              width: `${pos.width}px`,
              height: `${pos.height}px`,
              fontSize: `${Math.max(8, abilityField.fontSize * Math.min(pos.width / spec.w, pos.height / spec.h))}px`,
              fontFamily: abilityField.fontFamily,
              fontWeight: abilityField.fontWeight || 'normal',
              color: abilityField.color,
              textAlign: abilityField.textAlign || 'left',
              transform: abilityField.rotation ? `rotate(${abilityField.rotation}deg)` : 'none',
              textShadow: abilityField.textShadow ? '1px 1px 2px rgba(0,0,0,0.5)' : undefined,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: abilityField.textAlign === 'center' ? 'center' : abilityField.textAlign === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {data.specialAbilities[i - 1]}
          </div>
        );
      }
    }
    
    return elements.length > 0 ? <>{elements}</> : null;
  };

  // Log de diagnóstico expandido
  useEffect(() => {
    if (isFrameReady && frameRef.current) {
      const rect = frameRef.current.getBoundingClientRect();
      console.log('🔍 DIAGNÓSTICO COMPLETO:');
      console.log('FRAME rect:', { width: rect.width, height: rect.height, left: rect.left, top: rect.top });
      console.log('BASE dimensions:', BASE_W, 'x', BASE_H);
      console.log('Scale factors:', rect.width / BASE_W, 'x', rect.height / BASE_H);
      
      // Log da imagem de fundo
      const bgImage = frameRef.current.style.backgroundImage;
      console.log('Background image:', bgImage);
      
      const fields = frameRef.current.querySelectorAll('.field');
      fields.forEach((el, i) => {
        const cs = getComputedStyle(el);
        console.log(`field ${i}:`, { 
          left: cs.left, 
          top: cs.top, 
          width: cs.width, 
          height: cs.height 
        });
      });
    }
  }, [isFrameReady, data]);

  return (
    <div 
      ref={frameRef}
      className={`card-frame ${className || ''}`}
      style={{ 
        backgroundImage: `url(${template.templateImage})`
      }}
    >
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
      
      {/* Boxes de pressão e vida */}
      {renderPressureBoxes()}
      {renderLifeBoxes()}
      
      {/* Habilidades especiais - MESMO sistema de coordenadas */}
      {renderSpecialAbilities()}
    </div>
  );
};