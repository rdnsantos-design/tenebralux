import React, { forwardRef } from 'react';
import { Unit } from '@/types/Unit';
import { Sword, Shield, Target, Footprints, Heart, Sparkles } from 'lucide-react';

interface HexagonUnitPrintProps {
  unit: Unit;
  copies?: number;
}

// 10cm corner-to-corner at 300 DPI = ~1181 pixels
// For a regular hexagon: height = width * (√3/2) ≈ 1023 pixels
const HEX_WIDTH_PX = 1181;
const HEX_HEIGHT_PX = Math.round(HEX_WIDTH_PX * (Math.sqrt(3) / 2));

export const HexagonUnitPrint = forwardRef<HTMLDivElement, HexagonUnitPrintProps>(
  ({ unit, copies = 1 }, ref) => {
    const hexClipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

    const experienceColors: Record<string, { bg: string; text: string }> = {
      'Verde': { bg: '#22c55e', text: '#ffffff' },
      'Regular': { bg: '#3b82f6', text: '#ffffff' },
      'Veterano': { bg: '#a855f7', text: '#ffffff' },
      'Elite': { bg: '#f59e0b', text: '#000000' },
      'Lendário': { bg: '#ef4444', text: '#ffffff' },
    };

    const expStyle = experienceColors[unit.experience] || experienceColors['Regular'];

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
          }
        `}</style>

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

              {/* Inner content hexagon */}
              <div
                className="absolute inset-[3px] flex flex-col items-center justify-between p-4"
                style={{
                  clipPath: hexClipPath,
                  background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                }}
              >
                {/* Unit name */}
                <div className="text-center pt-6 z-10">
                  <h3 
                    className="text-lg font-bold text-white leading-tight"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
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
                <div className="grid grid-cols-3 gap-2 text-white z-10">
                  {renderStat(<Sword className="w-4 h-4 text-red-400" />, u.attack, 'ATQ')}
                  {renderStat(<Shield className="w-4 h-4 text-blue-400" />, u.defense, 'DEF')}
                  {renderStat(<Target className="w-4 h-4 text-green-400" />, u.ranged, 'DIS')}
                  {renderStat(<Footprints className="w-4 h-4 text-yellow-400" />, u.movement, 'MOV')}
                  {renderStat(<Heart className="w-4 h-4 text-pink-400" />, u.morale, 'MOR')}
                  {renderStat(<Sparkles className="w-4 h-4 text-purple-400" />, u.totalForce, 'POD')}
                </div>

                {/* Special abilities - bottom */}
                <div className="text-center pb-4 z-10">
                  {u.specialAbilities.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 max-w-[200px]">
                      {u.specialAbilities.slice(0, 3).map((ability, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/80"
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
        <div className="mt-4 text-center text-sm text-gray-500 print:hidden">
          <p>Dimensão de impressão: 10cm × {(10 * Math.sqrt(3) / 2).toFixed(2)}cm (largura × altura)</p>
          <p className="text-xs">Hexágono regular com 10cm de canto a canto</p>
        </div>
      </div>
    );
  }
);

HexagonUnitPrint.displayName = 'HexagonUnitPrint';

export default HexagonUnitPrint;
