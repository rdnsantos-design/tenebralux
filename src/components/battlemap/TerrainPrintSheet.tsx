import { forwardRef } from 'react';
import { TerrainType } from '@/types/Terrain';
import { TerrainHexTile } from './TerrainHexTile';

interface TerrainPrintSheetProps {
  terrains: TerrainType[];
  copies?: number;
}

export const TerrainPrintSheet = forwardRef<HTMLDivElement, TerrainPrintSheetProps>(
  ({ terrains, copies = 1 }, ref) => {
    // Expand terrains based on copies
    const expandedTerrains = terrains.flatMap(terrain => 
      Array.from({ length: copies }, (_, i) => ({ ...terrain, copyIndex: i }))
    );

    return (
      <div ref={ref} className="bg-white p-8 print:p-4">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}
        </style>
        
        {/* Title for print */}
        <h1 className="text-2xl font-bold mb-6 text-center text-black print:text-black">
          Tiles de Terreno - Mapa de Batalha
        </h1>
        
        {/* Hexagon grid with offset rows */}
        <div className="flex flex-wrap gap-1 justify-center">
          {expandedTerrains.map((terrain, index) => (
            <div 
              key={`${terrain.id}-${terrain.copyIndex}`}
              className="print:break-inside-avoid"
              style={{
                marginTop: index % 2 === 1 ? '20px' : '0',
              }}
            >
              <TerrainHexTile terrain={terrain} size="md" showModifiers={true} />
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 border-t pt-4 print:mt-4 print:pt-2">
          <h2 className="font-bold mb-2 text-black">Legenda dos Modificadores:</h2>
          <div className="grid grid-cols-4 gap-4 text-sm text-black">
            <div>🦶 = Movimento</div>
            <div>🛡️ = Defesa</div>
            <div>❤️ = Moral</div>
            <div>🏹 = Tiro/Ranged</div>
          </div>
        </div>
        
        {/* Cultural notes */}
        <div className="mt-4 text-xs text-gray-600 print:text-black">
          <p><strong>Nota:</strong> Alguns terrenos possuem modificadores especiais por cultura. Consulte a tabela completa para detalhes.</p>
        </div>
      </div>
    );
  }
);

TerrainPrintSheet.displayName = 'TerrainPrintSheet';
