import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { UnitCard } from "@/types/UnitCard";

interface CardPreviewProps {
  card: UnitCard;
  onClose: () => void;
}

export const CardPreview = ({ card, onClose }: CardPreviewProps) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const cardElement = document.getElementById('printable-card');
      if (cardElement) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Card ${card.name}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                .card { width: 10cm; height: 7cm; }
                @media print {
                  body { margin: 0; padding: 0; }
                  .card { width: 10cm; height: 7cm; page-break-after: always; }
                }
              </style>
            </head>
            <body>
              ${cardElement.outerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    // Para implementar download como imagem, seria necessário usar canvas
    // Por enquanto, vamos usar o print
    handlePrint();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Preview do Card</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <div 
            id="printable-card"
            className="relative bg-white border-2 border-gray-800 rounded-lg shadow-lg"
            style={{
              width: '10cm',
              height: '7cm',
              backgroundImage: card.backgroundImage ? `url(${card.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Overlay para melhor legibilidade */}
            <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
            
            {/* Conteúdo do card */}
            <div className="relative h-full p-2 flex flex-col text-black">
              {/* Header */}
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-sm font-bold bg-white/90 px-2 py-1 rounded shadow max-w-[60%] truncate">
                  {card.name}
                </h2>
                <div className="bg-white/90 px-2 py-1 rounded shadow text-center">
                  <div className="text-xs font-medium">Força</div>
                  <div className="text-lg font-bold">{card.totalForce}</div>
                </div>
              </div>

              {/* Main content area */}
              <div className="flex flex-1 gap-2">
                {/* Left sidebar - Attributes */}
                <div className="bg-white/90 rounded shadow p-1 w-12">
                  <div className="space-y-1 text-center">
                    <div className="border-b pb-1">
                      <div className="text-xs font-bold">AT</div>
                      <div className="text-sm font-bold">{card.attack}</div>
                    </div>
                    <div className="border-b pb-1">
                      <div className="text-xs font-bold">DEF</div>
                      <div className="text-sm font-bold">{card.defense}</div>
                    </div>
                    <div className="border-b pb-1">
                      <div className="text-xs font-bold">TIR</div>
                      <div className="text-sm font-bold">{card.ranged}</div>
                    </div>
                    <div className="border-b pb-1">
                      <div className="text-xs font-bold">MOV</div>
                      <div className="text-sm font-bold">{card.movement}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold">MOR</div>
                      <div className="text-sm font-bold">{card.morale}</div>
                    </div>
                  </div>
                </div>

                {/* Center - Special abilities and image space */}
                <div className="flex-1 flex flex-col">
                  {card.specialAbilities.length > 0 && (
                    <div className="bg-white/90 rounded shadow p-1 mb-2">
                      <div className="text-xs font-bold mb-1">Habilidades:</div>
                      <div className="space-y-1">
                        {card.specialAbilities.map((ability, index) => (
                          <div key={ability.id} className="text-xs">
                            • {ability.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Spacer for center image area */}
                  <div className="flex-1"></div>
                </div>

                {/* Right sidebar - Postures */}
                <div className="bg-white/90 rounded shadow p-1 w-16">
                  <div className="text-xs font-bold text-center mb-1">Posturas</div>
                  <div className="space-y-1 text-xs text-center">
                    <div className="border rounded p-1">Ofensiva</div>
                    <div className="border rounded p-1">Defensiva</div>
                    <div className="border rounded p-1">Carga</div>
                    <div className="border rounded p-1">Reorganização</div>
                  </div>
                </div>
              </div>

              {/* Bottom - Damage markers */}
              <div className="mt-2">
                <div className="bg-white/90 rounded shadow p-1">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-bold">Pressão:</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-3 h-3 border border-red-500 rounded-full"></div>
                      ))}
                    </div>
                    <div className="text-xs font-bold">Perm:</div>
                    <div className="flex gap-1">
                      {[1, 2].map(i => (
                        <div key={i} className="w-3 h-3 border border-black rounded-full"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience level indicator */}
              <div className="absolute bottom-1 left-1">
                <Badge variant="outline" className="text-xs bg-white/90">
                  {card.experience}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Card details below */}
        <div className="mt-8 max-w-2xl mx-auto">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Detalhes da Unidade</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Nome:</strong> {card.name}
              </div>
              <div>
                <strong>Experiência:</strong> {card.experience}
              </div>
              <div>
                <strong>Força Total:</strong> {card.totalForce}
              </div>
              <div>
                <strong>Custo Manutenção:</strong> {card.maintenanceCost}
              </div>
            </div>
            
            {card.specialAbilities.length > 0 && (
              <div className="mt-4">
                <strong>Habilidades Especiais:</strong>
                <ul className="mt-2 space-y-1">
                  {card.specialAbilities.map((ability) => (
                    <li key={ability.id} className="text-sm">
                      • <strong>{ability.name}</strong> (Nível {ability.level}): {ability.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};