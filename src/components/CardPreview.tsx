import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useState, useEffect } from "react";
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

  // Remove padding do root para alinhamento correto dos campos
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.classList.add('card-preview-mode');
    }
    
    return () => {
      const root = document.getElementById('root');
      if (root) {
        root.classList.remove('card-preview-mode');
      }
    };
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const cardElement = document.querySelector('.card-frame');
      if (cardElement) {
        // Criar múltiplas cópias do card baseado na seleção
        const cardsHtml = Array(cardsPerPage).fill(0).map((_, index) => 
          `<div class="card-frame" style="background-image: url(${template?.templateImage})">${cardElement.innerHTML}</div>`
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
                .card-frame {
                  width: 100mm !important;
                  height: 65mm !important;
                  position: relative !important;
                  overflow: hidden !important;
                  box-sizing: content-box !important;
                  background-size: 100mm 65mm !important;
                  background-repeat: no-repeat !important;
                  background-position: 0 0 !important;
                  border: 1px solid #ddd;
                  flex-shrink: 0;
                  writing-mode: horizontal-tb !important;
                }
                 .field {
                   position: absolute !important;
                   transform: none !important;
                   white-space: nowrap !important;
                   line-height: 1 !important;
                   letter-spacing: 0 !important;
                   box-sizing: border-box !important;
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
                  .card-frame { 
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
    const cardElement = document.querySelector('.card-frame') as HTMLElement;
    if (!cardElement) {
      console.error('Card frame element not found');
      return;
    }

    try {
      // Aguardar fontes carregarem
      await (document.fonts?.ready || Promise.resolve());

      if (cardsPerPage > 1) {
        // Múltiplos cards - criar container temporário
        const tempContainer = document.createElement('div');
        tempContainer.className = 'export-wrapper';
        tempContainer.style.cssText = `
          display: flex;
          flex-wrap: wrap;
          background-color: white;
          width: fit-content;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          transform: none !important;
          zoom: 1 !important;
        `;

        // Adicionar múltiplas cópias do card
        for (let i = 0; i < cardsPerPage; i++) {
          const cardClone = cardElement.cloneNode(true) as HTMLElement;
          cardClone.className = 'card-frame';
          tempContainer.appendChild(cardClone);
        }

        document.body.appendChild(tempContainer);

        // Capturar o container com múltiplos cards
        const canvas = await html2canvas(tempContainer, {
          backgroundColor: 'white',
          scale: window.devicePixelRatio || 1,
          useCORS: true,
          allowTaint: true,
          removeContainer: true,
          onclone: (doc) => {
            const frames = doc.querySelectorAll('.card-frame');
            frames.forEach((el) => {
              const frame = el as HTMLElement;
              frame.style.transform = 'none';
              frame.style.zoom = '1';
              frame.style.overflow = 'hidden';
              frame.style.width = '1181px';
              frame.style.height = '768px';
            });
          }
        });

        document.body.removeChild(tempContainer);

        // Log de diagnóstico
        console.log('FRAME canvas (multiple):', canvas.width, 'x', canvas.height);

        // Fazer o download
        const link = document.createElement('a');
        link.download = `${card.name}_${cardsPerPage}cards.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        // Card único - usar o MESMO DOM do preview
        const canvas = await html2canvas(cardElement, {
          width: 1181,
          height: 768,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: null,
          useCORS: true,
          scale: window.devicePixelRatio || 1,
          removeContainer: true,
          onclone: (doc) => {
            const el = doc.querySelector('.card-frame');
            if (el) {
              const frame = el as HTMLElement;
              frame.style.transform = 'none';
              frame.style.zoom = '1';
              frame.style.overflow = 'hidden';
              frame.style.width = '1181px';
              frame.style.height = '768px';
              
              // Validar todos os campos dentro do frame
              const fields = frame.querySelectorAll('.field');
              fields.forEach((field, i) => {
                const cs = getComputedStyle(field);
                console.log('export field', i, { 
                  left: cs.left, 
                  top: cs.top, 
                  width: cs.width, 
                  height: cs.height 
                });
              });
            }
          }
        });
        
        // Log de diagnóstico
        console.log('FRAME canvas (single):', canvas.width, 'x', canvas.height);
        
        // Fazer o download
        const link = document.createElement('a');
        link.download = `${card.name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('Erro ao fazer download:', error);
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

        <div className="flex justify-center preview-wrapper">
          {template ? (
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
              customBackgroundImage={card.customBackgroundImage}
              className="border border-gray-300"
            />
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