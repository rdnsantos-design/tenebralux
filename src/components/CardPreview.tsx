import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useState } from "react";
import { UnitCard } from "@/types/UnitCard";
import { CardRenderer } from "@/components/CardRenderer";
import { CardTemplate, CardData } from "@/types/CardTemplate";
import html2canvas from "html2canvas";

interface CardPreviewProps {
  card: UnitCard;
  template?: CardTemplate;
  onClose: () => void;
}

export const CardPreview = ({ card, template, onClose }: CardPreviewProps) => {
  const [cardsPerPage, setCardsPerPage] = useState(1);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const cardElement = document.getElementById('printable-card');
      if (cardElement) {
        // Criar múltiplas cópias do card baseado na seleção
        const cardsHtml = Array(cardsPerPage).fill(0).map((_, index) => 
          `<div class="card-container">${cardElement.innerHTML}</div>`
        ).join('');

        printWindow.document.write(`
          <html class="print-mode">
            <head>
              <title>Card ${card.name}</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                  margin: 0; 
                  padding: 10mm; 
                  font-family: 'Cinzel', serif; 
                  background: white;
                  font-size: 12px;
                }
                .print-container {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 5mm;
                  justify-content: flex-start;
                  align-items: flex-start;
                }
                .card-container {
                  display: inline-block !important;
                  width: 100mm !important;
                  height: 65mm !important;
                  position: relative !important;
                  background: white;
                  border: 1px solid #ddd;
                  flex-shrink: 0;
                  overflow: hidden;
                }
                .card-container > div {
                  width: 100% !important;
                  height: 100% !important;
                  position: relative !important;
                  background-size: cover !important;
                  background-position: center !important;
                  background-repeat: no-repeat !important;
                }
                .card-container img {
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: contain !important;
                  display: block !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .card-container > div > div {
                  position: absolute !important;
                  color: inherit !important;
                  font-family: inherit !important;
                  font-size: inherit !important;
                  font-weight: inherit !important;
                  text-align: inherit !important;
                  transform-origin: top left !important;
                }
                @media print {
                  body { 
                    margin: 0; 
                    padding: 5mm; 
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .print-container {
                    gap: 3mm;
                  }
                  .card-container { 
                    page-break-inside: avoid;
                    border: 0.5pt solid #999;
                    width: 100mm !important;
                    height: 65mm !important;
                  }
                }
              </style>
            </head>
            <body>
              <div class="print-container">
                ${cardsHtml}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = async () => {
    const cardElement = document.getElementById('printable-card');
    if (!cardElement) return;

    try {
      // Se for múltiplos cards, criar um container temporário
      if (cardsPerPage > 1) {
        const tempContainer = document.createElement('div');
        tempContainer.style.display = 'flex';
        tempContainer.style.flexWrap = 'wrap';
        tempContainer.style.gap = '10px';
        tempContainer.style.padding = '20px';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.width = 'fit-content';

        // Adicionar múltiplas cópias do card
        for (let i = 0; i < cardsPerPage; i++) {
          const cardClone = cardElement.cloneNode(true) as HTMLElement;
          cardClone.id = `printable-card-${i}`;
          tempContainer.appendChild(cardClone);
        }

        document.body.appendChild(tempContainer);

        // Capturar o container com múltiplos cards
        const canvas = await html2canvas(tempContainer, {
          backgroundColor: 'white',
          scale: 2,
          useCORS: true,
          allowTaint: true
        });

        document.body.removeChild(tempContainer);

        // Fazer o download
        const link = document.createElement('a');
        link.download = `${card.name}_${cardsPerPage}cards.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        // Card único
        const canvas = await html2canvas(cardElement, {
          backgroundColor: 'white',
          scale: 2,
          useCORS: true,
          allowTaint: true
        });

        const link = document.createElement('a');
        link.download = `${card.name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('Erro ao gerar PNG:', error);
    }
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
          <div className="flex gap-2 items-center">
            <Select value={cardsPerPage.toString()} onValueChange={(value) => setCardsPerPage(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 card</SelectItem>
                <SelectItem value="2">2 cards</SelectItem>
                <SelectItem value="3">3 cards</SelectItem>
                <SelectItem value="4">4 cards</SelectItem>
                <SelectItem value="6">6 cards</SelectItem>
              </SelectContent>
            </Select>
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
          {template ? (
            <div 
              id="printable-card" 
              className="card-container"
              style={{
                width: '600px',
                height: '390px',
                maxWidth: 'none',
                maxHeight: 'none',
                margin: '0 auto',
                display: 'inline-block',
                aspectRatio: '100/65',
                border: '1px solid #ddd',
                backgroundColor: 'white'
              }}
            >
              <CardRenderer 
                template={template} 
                data={{
                  name: card.name,
                  number: card.id,
                  attack: card.attack,
                  defense: card.defense,
                  ranged: card.ranged,
                  movement: card.movement,
                  morale: card.morale,
                  experience: card.experience,
                  totalForce: card.totalForce,
                  maintenanceCost: card.maintenanceCost,
                  specialAbilities: card.specialAbilities.map(a => a.name),
                  currentPosture: 'Ofensiva',
                  normalPressure: 0,
                  permanentPressure: 0,
                  hits: 0
                }} 
              />
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Nenhum template selecionado para este card.</p>
            </div>
          )}
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