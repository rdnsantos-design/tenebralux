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
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: Arial, sans-serif; 
                  background: white;
                }
                .card-container { 
                  width: 10cm; 
                  height: 7cm; 
                  position: relative;
                  border: 2px solid #000;
                  border-radius: 8px;
                  overflow: hidden;
                  background-size: cover;
                  background-position: center;
                  background-repeat: no-repeat;
                }
                .card-overlay { 
                  position: absolute; 
                  inset: 0; 
                  background: rgba(0,0,0,0.2); 
                }
                .card-content { 
                  position: relative; 
                  height: 100%; 
                  padding: 8px; 
                  display: flex; 
                  flex-direction: column; 
                  color: #000; 
                }
                .card-header { 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: flex-start; 
                  margin-bottom: 4px; 
                }
                .card-title { 
                  background: rgba(255,255,255,0.9); 
                  padding: 4px 8px; 
                  border-radius: 4px; 
                  font-size: 12px; 
                  font-weight: bold; 
                  max-width: 60%; 
                  white-space: nowrap; 
                  overflow: hidden; 
                  text-overflow: ellipsis; 
                }
                .total-force { 
                  background: rgba(255,255,255,0.9); 
                  padding: 4px 8px; 
                  border-radius: 4px; 
                  text-align: center; 
                }
                .total-force-label { font-size: 8px; font-weight: normal; }
                .total-force-value { font-size: 16px; font-weight: bold; }
                .card-main { 
                  display: flex; 
                  flex: 1; 
                  gap: 8px; 
                }
                .attributes-sidebar { 
                  background: rgba(255,255,255,0.9); 
                  border-radius: 4px; 
                  padding: 4px; 
                  width: 48px; 
                }
                .attribute-item { 
                  text-align: center; 
                  padding: 2px 0; 
                  border-bottom: 1px solid #ccc; 
                }
                .attribute-item:last-child { border-bottom: none; }
                .attribute-label { font-size: 8px; font-weight: bold; }
                .attribute-value { font-size: 12px; font-weight: bold; }
                .center-content { 
                  flex: 1; 
                  display: flex; 
                  flex-direction: column; 
                }
                .abilities-section { 
                  background: rgba(255,255,255,0.9); 
                  border-radius: 4px; 
                  padding: 4px; 
                  margin-bottom: 8px; 
                }
                .abilities-title { font-size: 8px; font-weight: bold; margin-bottom: 4px; }
                .ability-item { font-size: 8px; margin-bottom: 2px; }
                .postures-sidebar { 
                  background: rgba(255,255,255,0.9); 
                  border-radius: 4px; 
                  padding: 4px; 
                  width: 64px; 
                }
                .postures-title { 
                  font-size: 8px; 
                  font-weight: bold; 
                  text-align: center; 
                  margin-bottom: 4px; 
                }
                .posture-item { 
                  border: 1px solid #000; 
                  border-radius: 2px; 
                  padding: 2px; 
                  font-size: 7px; 
                  text-align: center; 
                  margin-bottom: 2px; 
                }
                .damage-section { 
                  margin-top: 8px; 
                }
                .damage-markers { 
                  background: rgba(255,255,255,0.9); 
                  border-radius: 4px; 
                  padding: 4px; 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: center; 
                }
                .damage-label { font-size: 8px; font-weight: bold; }
                .damage-circles { display: flex; gap: 2px; }
                .damage-circle { 
                  width: 12px; 
                  height: 12px; 
                  border: 1px solid #000; 
                  border-radius: 50%; 
                }
                .pressure-circle { border-color: #dc2626; }
                .permanent-circle { border-color: #000; }
                .experience-badge { 
                  position: absolute; 
                  bottom: 4px; 
                  left: 4px; 
                  background: rgba(255,255,255,0.9); 
                  border: 1px solid #000; 
                  border-radius: 4px; 
                  padding: 2px 4px; 
                  font-size: 8px; 
                }
                @media print {
                  body { margin: 0; padding: 0; }
                  .card-container { page-break-after: always; }
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
            className="card-container"
            style={{
              width: '10cm',
              height: '7cm',
              position: 'relative',
              border: '2px solid #000',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundImage: card.backgroundImage ? `url(${card.backgroundImage})` : 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Overlay para melhor legibilidade */}
            <div className="card-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }}></div>
            
            {/* Conteúdo do card */}
            <div className="card-content" style={{ position: 'relative', height: '100%', padding: '8px', display: 'flex', flexDirection: 'column', color: '#000' }}>
              {/* Header */}
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div className="card-title" style={{ background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {card.name}
                </div>
                <div className="total-force" style={{ background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '4px', textAlign: 'center' }}>
                  <div className="total-force-label" style={{ fontSize: '8px', fontWeight: 'normal' }}>Força</div>
                  <div className="total-force-value" style={{ fontSize: '16px', fontWeight: 'bold' }}>{card.totalForce}</div>
                </div>
              </div>

              {/* Main content area */}
              <div className="card-main" style={{ display: 'flex', flex: 1, gap: '8px' }}>
                {/* Left sidebar - Attributes */}
                <div className="attributes-sidebar" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '4px', padding: '4px', width: '48px' }}>
                  <div className="attribute-item" style={{ textAlign: 'center', padding: '2px 0', borderBottom: '1px solid #ccc' }}>
                    <div className="attribute-label" style={{ fontSize: '8px', fontWeight: 'bold' }}>AT</div>
                    <div className="attribute-value" style={{ fontSize: '12px', fontWeight: 'bold' }}>{card.attack}</div>
                  </div>
                  <div className="attribute-item" style={{ textAlign: 'center', padding: '2px 0', borderBottom: '1px solid #ccc' }}>
                    <div className="attribute-label" style={{ fontSize: '8px', fontWeight: 'bold' }}>DEF</div>
                    <div className="attribute-value" style={{ fontSize: '12px', fontWeight: 'bold' }}>{card.defense}</div>
                  </div>
                  <div className="attribute-item" style={{ textAlign: 'center', padding: '2px 0', borderBottom: '1px solid #ccc' }}>
                    <div className="attribute-label" style={{ fontSize: '8px', fontWeight: 'bold' }}>TIR</div>
                    <div className="attribute-value" style={{ fontSize: '12px', fontWeight: 'bold' }}>{card.ranged}</div>
                  </div>
                  <div className="attribute-item" style={{ textAlign: 'center', padding: '2px 0', borderBottom: '1px solid #ccc' }}>
                    <div className="attribute-label" style={{ fontSize: '8px', fontWeight: 'bold' }}>MOV</div>
                    <div className="attribute-value" style={{ fontSize: '12px', fontWeight: 'bold' }}>{card.movement}</div>
                  </div>
                  <div className="attribute-item" style={{ textAlign: 'center', padding: '2px 0' }}>
                    <div className="attribute-label" style={{ fontSize: '8px', fontWeight: 'bold' }}>MOR</div>
                    <div className="attribute-value" style={{ fontSize: '12px', fontWeight: 'bold' }}>{card.morale}</div>
                  </div>
                </div>

                {/* Center - Special abilities and image space */}
                <div className="center-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {card.specialAbilities.length > 0 && (
                    <div className="abilities-section" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '4px', padding: '4px', marginBottom: '8px' }}>
                      <div className="abilities-title" style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '4px' }}>Habilidades:</div>
                      <div>
                        {card.specialAbilities.map((ability) => (
                          <div key={ability.id} className="ability-item" style={{ fontSize: '8px', marginBottom: '2px' }}>
                            • {ability.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Spacer for center image area */}
                  <div style={{ flex: 1 }}></div>
                </div>

                {/* Right sidebar - Postures */}
                <div className="postures-sidebar" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '4px', padding: '4px', width: '64px' }}>
                  <div className="postures-title" style={{ fontSize: '8px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>Posturas</div>
                  <div>
                    <div className="posture-item" style={{ border: '1px solid #000', borderRadius: '2px', padding: '2px', fontSize: '7px', textAlign: 'center', marginBottom: '2px' }}>Ofensiva</div>
                    <div className="posture-item" style={{ border: '1px solid #000', borderRadius: '2px', padding: '2px', fontSize: '7px', textAlign: 'center', marginBottom: '2px' }}>Defensiva</div>
                    <div className="posture-item" style={{ border: '1px solid #000', borderRadius: '2px', padding: '2px', fontSize: '7px', textAlign: 'center', marginBottom: '2px' }}>Carga</div>
                    <div className="posture-item" style={{ border: '1px solid #000', borderRadius: '2px', padding: '2px', fontSize: '7px', textAlign: 'center' }}>Reorganização</div>
                  </div>
                </div>
              </div>

              {/* Bottom - Damage markers */}
              <div className="damage-section" style={{ marginTop: '8px' }}>
                <div className="damage-markers" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '4px', padding: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="damage-label" style={{ fontSize: '8px', fontWeight: 'bold' }}>Pressão:</div>
                  <div className="damage-circles" style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="damage-circle pressure-circle" style={{ width: '12px', height: '12px', border: '1px solid #dc2626', borderRadius: '50%' }}></div>
                    ))}
                  </div>
                  <div className="damage-label" style={{ fontSize: '8px', fontWeight: 'bold' }}>Perm:</div>
                  <div className="damage-circles" style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2].map(i => (
                      <div key={i} className="damage-circle permanent-circle" style={{ width: '12px', height: '12px', border: '1px solid #000', borderRadius: '50%' }}></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Experience level indicator */}
              <div className="experience-badge" style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(255,255,255,0.9)', border: '1px solid #000', borderRadius: '4px', padding: '2px 4px', fontSize: '8px' }}>
                {card.experience}
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