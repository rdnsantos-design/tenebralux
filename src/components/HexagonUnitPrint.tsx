import React, { forwardRef, useState, useRef } from 'react';
import { Unit } from '@/types/Unit';
import { Sword, Shield, Target, Footprints, Heart, Sparkles, Upload, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface HexagonUnitPrintProps {
  unit: Unit;
  copies?: number;
  backgroundImage?: string;
  onBackgroundChange?: (imageUrl: string | null) => void;
  showUploadControls?: boolean;
}

// 10cm corner-to-corner at 300 DPI = ~1181 pixels
// For a regular hexagon: height = width * (√3/2) ≈ 1023 pixels
export const HEX_WIDTH_PX = 1181;
export const HEX_HEIGHT_PX = Math.round(HEX_WIDTH_PX * (Math.sqrt(3) / 2));

export const HexagonUnitPrint = forwardRef<HTMLDivElement, HexagonUnitPrintProps>(
  ({ unit, copies = 1, backgroundImage, onBackgroundChange, showUploadControls = false }, ref) => {
    const [localBackground, setLocalBackground] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const hexClipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    const currentBackground = backgroundImage || localBackground;

    const experienceColors: Record<string, { bg: string; text: string }> = {
      'Verde': { bg: '#22c55e', text: '#ffffff' },
      'Regular': { bg: '#3b82f6', text: '#ffffff' },
      'Veterano': { bg: '#a855f7', text: '#ffffff' },
      'Elite': { bg: '#f59e0b', text: '#000000' },
      'Lendário': { bg: '#ef4444', text: '#ffffff' },
    };

    const expStyle = experienceColors[unit.experience] || experienceColors['Regular'];

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }

      // Validate dimensions
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        
        if (img.width !== HEX_WIDTH_PX || img.height !== HEX_HEIGHT_PX) {
          toast.error(
            `Dimensões incorretas: ${img.width}×${img.height}px. ` +
            `Use exatamente ${HEX_WIDTH_PX}×${HEX_HEIGHT_PX}px.`
          );
          return;
        }

        // Convert to base64 for display
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setLocalBackground(base64);
          onBackgroundChange?.(base64);
          toast.success('Imagem de fundo carregada com sucesso!');
        };
        reader.readAsDataURL(file);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        toast.error('Erro ao carregar a imagem');
      };

      img.src = objectUrl;
    };

    const handleRemoveBackground = () => {
      setLocalBackground(null);
      onBackgroundChange?.(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.info('Imagem de fundo removida');
    };

    const renderStat = (icon: React.ReactNode, value: number, label: string) => (
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-2xl font-bold">{value >= 0 ? `+${value}` : value}</span>
        </div>
        <span className="text-xs uppercase tracking-wider opacity-75">{label}</span>
      </div>
    );

    const unitsToRender = Array(copies).fill(unit);

    return (
      <div ref={ref} className="print-container bg-white p-4">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            .print-container {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .hex-unit {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Upload controls */}
        {showUploadControls && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/30 no-print">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Imagem de Fundo do Hexágono
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Dimensões exatas: {HEX_WIDTH_PX}×{HEX_HEIGHT_PX}px (PNG ou JPG, 300 DPI)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Carregar Imagem
                  </Button>
                  {currentBackground && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveBackground}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
              {currentBackground && (
                <div 
                  className="w-20 h-20 rounded border overflow-hidden"
                  style={{ clipPath: hexClipPath }}
                >
                  <img 
                    src={currentBackground} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          {unitsToRender.map((u, index) => (
            <div
              key={index}
              className="hex-unit relative"
              style={{
                width: `${HEX_WIDTH_PX / 3}px`, // Scale down for screen display
                height: `${HEX_HEIGHT_PX / 3}px`,
              }}
            >
              {/* Outer border hexagon */}
              <div
                className="absolute inset-0"
                style={{
                  clipPath: hexClipPath,
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                }}
              />

              {/* Background image or gradient */}
              <div
                className="absolute inset-[3px]"
                style={{
                  clipPath: hexClipPath,
                  background: currentBackground 
                    ? `url(${currentBackground}) center/cover no-repeat`
                    : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                }}
              />

              {/* Dark overlay for better text readability when using background image */}
              {currentBackground && (
                <div
                  className="absolute inset-[3px]"
                  style={{
                    clipPath: hexClipPath,
                    background: 'rgba(0, 0, 0, 0.4)',
                  }}
                />
              )}

              {/* Inner content hexagon */}
              <div
                className="absolute inset-[3px] flex flex-col items-center justify-between p-4"
                style={{
                  clipPath: hexClipPath,
                }}
              >
                {/* Unit name */}
                <div className="text-center pt-6 z-10">
                  <h3 
                    className="text-lg font-bold text-white leading-tight"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    {u.name}
                  </h3>
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-semibold mt-1"
                    style={{ backgroundColor: expStyle.bg, color: expStyle.text }}
                  >
                    {u.experience}
                  </span>
                </div>

                {/* Stats grid - center */}
                <div 
                  className="grid grid-cols-3 gap-2 text-white z-10"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {renderStat(<Sword className="w-4 h-4 text-red-400 drop-shadow" />, u.attack, 'ATQ')}
                  {renderStat(<Shield className="w-4 h-4 text-blue-400 drop-shadow" />, u.defense, 'DEF')}
                  {renderStat(<Target className="w-4 h-4 text-green-400 drop-shadow" />, u.ranged, 'DIS')}
                  {renderStat(<Footprints className="w-4 h-4 text-yellow-400 drop-shadow" />, u.movement, 'MOV')}
                  {renderStat(<Heart className="w-4 h-4 text-pink-400 drop-shadow" />, u.morale, 'MOR')}
                  {renderStat(<Sparkles className="w-4 h-4 text-purple-400 drop-shadow" />, u.totalForce, 'POD')}
                </div>

                {/* Special abilities - bottom */}
                <div className="text-center pb-4 z-10">
                  {u.specialAbilities.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 max-w-[200px]">
                      {u.specialAbilities.slice(0, 3).map((ability, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 bg-black/50 rounded text-white/90 backdrop-blur-sm"
                        >
                          {ability}
                        </span>
                      ))}
                      {u.specialAbilities.length > 3 && (
                        <span className="text-[10px] text-white/60">
                          +{u.specialAbilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Print dimensions info */}
        <div className="mt-4 text-center text-sm text-gray-500 print:hidden no-print">
          <p>Dimensão de impressão: 10cm × {(10 * Math.sqrt(3) / 2).toFixed(2)}cm (largura × altura)</p>
          <p className="text-xs">Hexágono regular com 10cm de canto a canto</p>
        </div>
      </div>
    );
  }
);

HexagonUnitPrint.displayName = 'HexagonUnitPrint';

export default HexagonUnitPrint;
