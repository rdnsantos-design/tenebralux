import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Users, Plus, Trash2 } from "lucide-react";
import { Regent, Army, ArmyUnit } from "@/types/Army";
import { UnitCard } from "@/types/UnitCard";

interface ArmyEditorProps {
  army?: Army | null;
  regents: Regent[];
  onSave: (army: Army) => void;
  onCancel: () => void;
}

export const ArmyEditor = ({ army, regents, onSave, onCancel }: ArmyEditorProps) => {
  const [formData, setFormData] = useState({
    name: army?.name || "",
    regentId: army?.regentId || "",
  });
  const [units, setUnits] = useState<ArmyUnit[]>(army?.units || []);
  const [availableCards, setAvailableCards] = useState<UnitCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");

  // Carregar cards disponíveis
  useEffect(() => {
    const savedCards = localStorage.getItem('unitCards');
    if (savedCards) {
      try {
        const loadedCards = JSON.parse(savedCards);
        setAvailableCards(loadedCards);
      } catch (error) {
        console.error('Erro ao carregar cards:', error);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.regentId) {
      alert('Selecione um regente');
      return;
    }

    const armyData: Army = {
      id: army?.id || `army_${Date.now()}`,
      ...formData,
      units,
      createdAt: army?.createdAt || new Date().toISOString(),
    };

    onSave(armyData);
  };

  const handleAddUnit = () => {
    if (!selectedCardId) return;

    const selectedCard = availableCards.find(card => card.id === selectedCardId);
    if (!selectedCard) return;

    const newUnit: ArmyUnit = {
      id: `unit_${Date.now()}`,
      cardId: selectedCard.id,
      name: selectedCard.name,
      power: selectedCard.totalForce,
      creationCost: selectedCard.maintenanceCost * 3, // Exemplo: custo de criação = 3x manutenção
      maintenanceCost: selectedCard.maintenanceCost,
      isGarrisoned: false,
    };

    setUnits([...units, newUnit]);
    setSelectedCardId("");
  };

  const handleRemoveUnit = (unitId: string) => {
    setUnits(units.filter(unit => unit.id !== unitId));
  };

  const selectedRegent = regents.find(r => r.id === formData.regentId);
  const totalCreationCost = units.reduce((sum, unit) => sum + unit.creationCost, 0);
  const totalMaintenanceCost = units.reduce((sum, unit) => sum + unit.maintenanceCost, 0);

  const isEditing = !!army;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Editar Exército' : 'Novo Exército'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Modifique a composição do exército' : 'Monte um novo exército selecionando unidades'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Informações do Exército
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Exército *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Primeira Legião de Avanil"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regent">Regente Comandante *</Label>
                  <Select 
                    value={formData.regentId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, regentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um regente" />
                    </SelectTrigger>
                    <SelectContent>
                      {regents.map((regent) => (
                        <SelectItem key={regent.id} value={regent.id}>
                          {regent.name} - {regent.domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedRegent && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Recursos Disponíveis:</span>
                    </div>
                    <div></div>
                    <div>
                      Gold Bars: <Badge variant="outline">{selectedRegent.goldBars} GB</Badge>
                    </div>
                    <div>
                      Regency Points: <Badge variant="outline">{selectedRegent.regencyPoints} RP</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Unidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Selecionar Card de Unidade</Label>
                  <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma unidade militar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name} - Força: {card.totalForce} - Manutenção: {card.maintenanceCost}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button" 
                  onClick={handleAddUnit}
                  disabled={!selectedCardId}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {units.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Unidades do Exército ({units.length})</CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Custo Total de Criação: {totalCreationCost} GB</span>
                  <span>Custo Total de Manutenção: {totalMaintenanceCost} GB/turno</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {units.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{unit.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Poder: {unit.power} • Criação: {unit.creationCost} GB • Manutenção: {unit.maintenanceCost} GB
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveUnit(unit.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {isEditing ? 'Salvar Alterações' : 'Criar Exército'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};