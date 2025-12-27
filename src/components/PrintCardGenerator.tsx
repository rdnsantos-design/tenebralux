import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Printer, Download, Eye, Image as ImageIcon } from "lucide-react";
import { Unit } from "@/types/Unit";
import { CardBackgroundImage, REQUIRED_WIDTH, REQUIRED_HEIGHT } from "@/types/CardBackgroundImage";
import { CardTemplate, CardData } from "@/types/CardTemplate";
import { CardRenderer } from "@/components/CardRenderer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface PrintCardGeneratorProps {
  units: Unit[];
  templates: CardTemplate[];
  onClose: () => void;
}

interface CardToPrint {
  id: string;
  unit: Unit;
  backgroundImage: CardBackgroundImage;
  copies: number;
}

export const PrintCardGenerator = ({ units, templates, onClose }: PrintCardGeneratorProps) => {
  const [backgroundImages, setBackgroundImages] = useState<CardBackgroundImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string>('');
  const [cardsToPrint, setCardsToPrint] = useState<CardToPrint[]>([]);
  const [previewCard, setPreviewCard] = useState<CardToPrint | null>(null);
  
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Carregar imagens do banco e unidades do localStorage
  useEffect(() => {
    loadBackgroundImages();
    loadAllUnits();
  }, [units]);
  
  // Combinar units (do ArmyManagement) com unitCards (do CardEditor)
  const loadAllUnits = () => {
    const savedCards = localStorage.getItem('unitCards');
    let cardUnits: Unit[] = [];
    
    if (savedCards) {
      try {
        const cards = JSON.parse(savedCards);
        // Converter UnitCard para Unit format
        cardUnits = cards.map((card: any) => ({
          id: card.id,
          templateId: '',
          regentId: '',
          name: card.name,
          attack: card.attack,
          defense: card.defense,
          ranged: card.ranged,
          movement: card.movement,
          morale: card.morale,
          experience: card.experience,
          totalForce: card.totalForce,
          maintenanceCost: card.maintenanceCost,
          specialAbilities: card.specialAbilities || [],
          currentXP: 0,
          kills: 0,
          battlesWon: 0,
          createdAt: card.id,
          updatedAt: card.id
        }));
      } catch (error) {
        console.error('Erro ao carregar cards:', error);
      }
    }
    
    // Combinar: cards criados primeiro, depois units do Army
    const combinedUnits = [...cardUnits, ...units.filter(u => !cardUnits.find(c => c.id === u.id))];
    setAllUnits(combinedUnits);
  };

  const loadBackgroundImages = async () => {
    setLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from('card_background_images')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setBackgroundImages(data || []);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
      toast.error('Erro ao carregar imagens do banco');
    } finally {
      setLoadingImages(false);
    }
  };

  const selectedUnit = allUnits.find(u => u.id === selectedUnitId);
  const selectedImage = backgroundImages.find(i => i.id === selectedImageId);
  const selectedTemplate = templates[0]; // Usa o primeiro template disponível

  const handleAddCard = () => {
    if (!selectedUnit || !selectedImage) {
      toast.error('Selecione uma unidade e uma imagem de fundo');
      return;
    }

    const newCard: CardToPrint = {
      id: `print_${Date.now()}`,
      unit: selectedUnit,
      backgroundImage: selectedImage,
      copies: 1
    };

    setCardsToPrint([...cardsToPrint, newCard]);
    toast.success('Card adicionado à fila de impressão');
    
    // Resetar seleções
    setSelectedUnitId('');
    setSelectedImageId('');
  };

  const handleRemoveCard = (cardId: string) => {
    setCardsToPrint(cardsToPrint.filter(c => c.id !== cardId));
  };

  const handleUpdateCopies = (cardId: string, copies: number) => {
    setCardsToPrint(cardsToPrint.map(c => 
      c.id === cardId ? { ...c, copies: Math.max(1, copies) } : c
    ));
  };

  const convertUnitToCardData = (unit: Unit): CardData => {
    return {
      name: unit.name,
      number: unit.id,
      attack: unit.attack,
      defense: unit.defense,
      ranged: unit.ranged,
      movement: unit.movement,
      morale: unit.morale,
      experience: unit.experience,
      totalForce: unit.totalForce,
      maintenanceCost: unit.maintenanceCost,
      specialAbilities: unit.specialAbilities.map(a => a.name),
      currentPosture: unit.currentPosture || 'Ofensiva',
      normalPressure: unit.normalPressure || 0,
      permanentPressure: unit.permanentPressure || 0,
      hits: unit.hits || 0
    };
  };

  const getTotalCards = () => {
    return cardsToPrint.reduce((sum, card) => sum + card.copies, 0);
  };

  const handlePrint = async () => {
    if (cardsToPrint.length === 0) {
      toast.error('Adicione pelo menos um card para imprimir');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Nenhum template disponível');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup bloqueado. Permita popups para imprimir.');
      return;
    }

    // Gerar HTML de todos os cards
    const allCardsHtml: string[] = [];
    
    for (const card of cardsToPrint) {
      for (let i = 0; i < card.copies; i++) {
        allCardsHtml.push(`
          <div class="card-item" style="
            width: 750px;
            height: 1050px;
            background-image: url(${card.backgroundImage.file_url});
            background-size: cover;
            background-position: center;
            position: relative;
            page-break-inside: avoid;
            box-sizing: border-box;
          ">
            <div class="card-overlay" style="
              position: absolute;
              bottom: 20px;
              left: 20px;
              right: 20px;
              color: white;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
              font-family: 'Cinzel', serif;
            ">
              <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${card.unit.name}</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 14px;">
                <div>AT: ${card.unit.attack}</div>
                <div>DEF: ${card.unit.defense}</div>
                <div>TIR: ${card.unit.ranged}</div>
                <div>MOV: ${card.unit.movement}</div>
                <div>MOR: ${card.unit.morale}</div>
                <div>FORÇA: ${card.unit.totalForce}</div>
              </div>
              <div style="margin-top: 8px; font-size: 12px;">${card.unit.experience}</div>
            </div>
          </div>
        `);
      }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Cards para Impressão</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Cinzel', Georgia, serif;
              background: white;
              padding: 20px;
            }
            .cards-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              justify-content: flex-start;
            }
            .card-item {
              flex-shrink: 0;
              transform: scale(0.3);
              transform-origin: top left;
              margin-right: -500px;
              margin-bottom: -700px;
            }
            @media print {
              .card-item {
                transform: scale(0.25);
                margin-right: -560px;
                margin-bottom: -780px;
              }
            }
          </style>
        </head>
        <body>
          <div class="cards-grid">
            ${allCardsHtml.join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownload = async () => {
    if (cardsToPrint.length === 0) {
      toast.error('Adicione pelo menos um card para baixar');
      return;
    }

    toast.info('Gerando imagens... Isso pode levar alguns segundos.');

    try {
      // Para cada card, gerar uma imagem individual
      for (const card of cardsToPrint) {
        for (let copy = 0; copy < card.copies; copy++) {
          const tempDiv = document.createElement('div');
          tempDiv.style.cssText = `
            width: ${REQUIRED_WIDTH}px;
            height: ${REQUIRED_HEIGHT}px;
            background-image: url(${card.backgroundImage.file_url});
            background-size: cover;
            background-position: center;
            position: fixed;
            top: -9999px;
            left: -9999px;
          `;
          document.body.appendChild(tempDiv);

          const canvas = await html2canvas(tempDiv, {
            width: REQUIRED_WIDTH,
            height: REQUIRED_HEIGHT,
            scale: 1,
            useCORS: true,
            allowTaint: true
          });

          document.body.removeChild(tempDiv);

          const link = document.createElement('a');
          link.download = `${card.unit.name.replace(/\s+/g, '_')}_${copy + 1}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();

          // Pequena pausa entre downloads
          await new Promise(r => setTimeout(r, 100));
        }
      }

      toast.success('Cards baixados com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar imagens:', error);
      toast.error('Erro ao gerar imagens');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gerador de Cards para Impressão</h1>
              <p className="text-muted-foreground">Selecione unidades e imagens de fundo para gerar cards</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={cardsToPrint.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Baixar ({getTotalCards()})
            </Button>
            <Button onClick={handlePrint} disabled={cardsToPrint.length === 0}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir ({getTotalCards()})
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seleção de Unidade e Imagem */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seletor de Unidade */}
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} - {unit.experience}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview da Unidade Selecionada */}
              {selectedUnit && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{selectedUnit.name}</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>AT: {selectedUnit.attack}</div>
                      <div>DEF: {selectedUnit.defense}</div>
                      <div>TIR: {selectedUnit.ranged}</div>
                      <div>MOV: {selectedUnit.movement}</div>
                      <div>MOR: {selectedUnit.morale}</div>
                      <div>FORÇA: {selectedUnit.totalForce}</div>
                    </div>
                    <Badge className="mt-2">{selectedUnit.experience}</Badge>
                  </CardContent>
                </Card>
              )}

              {/* Seletor de Imagem de Fundo */}
              <div className="space-y-2">
                <Label>Imagem de Fundo</Label>
                {loadingImages ? (
                  <p className="text-sm text-muted-foreground">Carregando imagens...</p>
                ) : backgroundImages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma imagem no banco. Vá até a aba "Imagens" para fazer upload.
                  </p>
                ) : (
                  <ScrollArea className="h-48 border rounded-md p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {backgroundImages.map((img) => (
                        <div
                          key={img.id}
                          className={`cursor-pointer rounded-md overflow-hidden border-2 transition-colors ${
                            selectedImageId === img.id 
                              ? 'border-primary' 
                              : 'border-transparent hover:border-muted-foreground'
                          }`}
                          onClick={() => setSelectedImageId(img.id)}
                        >
                          <img
                            src={img.file_url}
                            alt={img.file_name}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Preview da Imagem Selecionada */}
              {selectedImage && (
                <div className="rounded-md overflow-hidden border">
                  <img
                    src={selectedImage.file_url}
                    alt={selectedImage.file_name}
                    className="w-full h-40 object-cover"
                  />
                  <p className="text-xs text-muted-foreground p-2 truncate">
                    {selectedImage.file_name}
                  </p>
                </div>
              )}

              {/* Botão Adicionar */}
              <Button 
                onClick={handleAddCard} 
                className="w-full"
                disabled={!selectedUnitId || !selectedImageId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar à Fila
              </Button>
            </CardContent>
          </Card>

          {/* Fila de Impressão */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  Fila de Impressão
                </span>
                <Badge variant="secondary">{getTotalCards()} cards</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cardsToPrint.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum card na fila</p>
                  <p className="text-sm">Selecione uma unidade e uma imagem para adicionar</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {cardsToPrint.map((card) => (
                      <Card key={card.id} className="overflow-hidden">
                        <div className="flex items-center gap-4 p-4">
                          {/* Thumbnail da imagem */}
                          <div className="w-16 h-24 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={card.backgroundImage.file_url}
                              alt="Background"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Info da unidade */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{card.unit.name}</h4>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>AT: {card.unit.attack}</span>
                              <span>DEF: {card.unit.defense}</span>
                              <span>MOR: {card.unit.morale}</span>
                            </div>
                            <Badge variant="outline" className="mt-1">{card.unit.experience}</Badge>
                          </div>

                          {/* Controle de cópias */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateCopies(card.id, card.copies - 1)}
                              disabled={card.copies <= 1}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-medium">{card.copies}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateCopies(card.id, card.copies + 1)}
                            >
                              +
                            </Button>
                          </div>

                          {/* Preview e Remover */}
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewCard(card)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCard(card.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Preview */}
        {previewCard && selectedTemplate && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Preview: {previewCard.unit.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setPreviewCard(null)}>
                  ×
                </Button>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="border rounded-lg overflow-hidden shadow-lg">
                  <CardRenderer
                    template={selectedTemplate}
                    data={convertUnitToCardData(previewCard.unit)}
                    customBackgroundImage={previewCard.backgroundImage.file_url}
                    className="max-w-md"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
