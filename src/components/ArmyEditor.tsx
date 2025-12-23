import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Users, Plus, Trash2, UserCircle, Crown } from "lucide-react";
import { Regent, Army, ArmyUnit } from "@/types/Army";
import { UnitCard } from "@/types/UnitCard";
import { Country, Province } from "@/types/Location";
import { FieldCommander } from "@/types/FieldCommander";
import { useFieldCommanders } from "@/hooks/useFieldCommanders";

interface ArmyEditorProps {
  army?: Army | null;
  regents: Regent[];
  onSave: (army: Army) => void;
  onCancel: () => void;
}

export const ArmyEditor = ({ army, regents, onSave, onCancel }: ArmyEditorProps) => {
  const { commanders } = useFieldCommanders();
  const [formData, setFormData] = useState({
    name: army?.name || "",
    regentId: army?.regentId || "",
    generalId: army?.generalId || "",
  });
  const [units, setUnits] = useState<ArmyUnit[]>(army?.units || []);
  const [availableCards, setAvailableCards] = useState<UnitCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [countries, setCountries] = useState<Country[]>([]);

  // Filtrar comandantes do regente selecionado
  const regentCommanders = commanders.filter(
    (c) => c.regent_id === formData.regentId
  );

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

  // Carregar países das importações de localização
  useEffect(() => {
    const savedLocationImports = localStorage.getItem('locationImports');
    if (savedLocationImports) {
      try {
        const locationImports = JSON.parse(savedLocationImports);
        if (locationImports.length > 0) {
          // Usar a importação mais recente
          const latestImport = locationImports[0];
          setCountries(latestImport.countries || []);
        }
      } catch (error) {
        console.error('Erro ao carregar países:', error);
      }
    }
  }, []);

  // Filtrar províncias baseado no país selecionado
  const getProvincesForCountry = (countryId: string): Province[] => {
    if (!countryId || countries.length === 0) return [];
    const country = countries.find(c => c.id === countryId);
    return country?.provinces || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.regentId) {
      alert('Selecione um regente');
      return;
    }

    const armyData: Army = {
      id: army?.id || `army_${Date.now()}`,
      name: formData.name,
      regentId: formData.regentId,
      generalId: formData.generalId || undefined,
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
      countryId: '',
      provinceId: '',
    };

    setUnits([...units, newUnit]);
    setSelectedCardId("");
  };

  const handleUpdateUnitLocation = (unitId: string, countryId: string, provinceId: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, countryId, provinceId }
        : unit
    ));
  };

  const handleUpdateUnitCommander = (unitId: string, commanderId: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, commanderId: commanderId || undefined }
        : unit
    ));
  };

  const getCommanderName = (commanderId?: string) => {
    if (!commanderId) return null;
    const commander = commanders.find(c => c.id === commanderId);
    return commander?.nome_comandante || null;
  };

  const getLocationName = (countryId?: string, provinceId?: string) => {
    if (!countryId || countries.length === 0) return 'Sem localização';
    
    const country = countries.find(c => c.id === countryId);
    if (!country) return 'País não encontrado';
    
    if (provinceId) {
      const province = country.provinces.find(p => p.id === provinceId);
      return province ? `${province.name}, ${country.name}` : country.name;
    }
    
    return country.name;
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

                  <div className="space-y-2">
                    <Label htmlFor="general" className="flex items-center gap-1">
                      <Crown className="w-4 h-4 text-amber-500" />
                      General do Exército
                    </Label>
                    <Select 
                      value={formData.generalId || '__none__'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, generalId: value === '__none__' ? '' : value }))}
                      disabled={regentCommanders.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={regentCommanders.length === 0 ? "Nenhum comandante disponível" : "Selecione um general"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem general</SelectItem>
                        {regentCommanders.map((commander) => (
                          <SelectItem key={commander.id} value={commander.id}>
                            {commander.nome_comandante} - {commander.especializacao_inicial} (Cmd: {commander.comando})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {regentCommanders.length === 0 && formData.regentId && (
                      <p className="text-xs text-amber-600">
                        Nenhum comandante associado a este regente.
                      </p>
                    )}
                  </div>
                </div>

                {formData.generalId && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mt-4">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <span className="font-medium text-amber-700">General:</span>
                      <span className="text-amber-600">
                        {getCommanderName(formData.generalId)}
                      </span>
                    </div>
                  </div>
                )}

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
                <div className="space-y-4">
                   {units.map((unit) => (
                     <div key={unit.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {unit.name} {unit.unitNumber ? `#${unit.unitNumber}` : ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Poder: {unit.power} • Criação: {unit.creationCost} GB • Manutenção: {unit.maintenanceCost} GB
                            </div>
                            <div className="text-sm text-muted-foreground">
                              📍 {getLocationName(unit.countryId, unit.provinceId)}
                            </div>
                            {unit.commanderId && (
                              <div className="text-sm text-primary flex items-center gap-1 mt-1">
                                <UserCircle className="w-3 h-3" />
                                Comandante: {getCommanderName(unit.commanderId)}
                              </div>
                            )}
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

                         {/* Localização e Comandante da Unidade */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
                          <div className="space-y-2">
                            <Label className="text-xs">País</Label>
                            <Select 
                              value={unit.countryId || ''} 
                              onValueChange={(value) => handleUpdateUnitLocation(unit.id, value, '')}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="País..." />
                              </SelectTrigger>
                              <SelectContent className="bg-background border z-50 shadow-lg">
                                {countries.map(country => (
                                  <SelectItem key={country.id} value={country.id} className="text-xs hover:bg-accent cursor-pointer">
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Província</Label>
                            <Select 
                              value={unit.provinceId || ''} 
                              onValueChange={(value) => handleUpdateUnitLocation(unit.id, unit.countryId || '', value)}
                              disabled={!unit.countryId}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder={unit.countryId ? "Província..." : "Selecione país primeiro"} />
                              </SelectTrigger>
                              <SelectContent className="bg-background border z-50 shadow-lg">
                                {getProvincesForCountry(unit.countryId || '').map(province => (
                                  <SelectItem key={province.id} value={province.id} className="text-xs hover:bg-accent cursor-pointer">
                                    {province.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <UserCircle className="w-3 h-3" />
                              Comandante
                            </Label>
                            <Select 
                              value={unit.commanderId || '__none__'} 
                              onValueChange={(value) => handleUpdateUnitCommander(unit.id, value === '__none__' ? '' : value)}
                              disabled={regentCommanders.length === 0}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder={regentCommanders.length === 0 ? "Nenhum comandante" : "Selecionar..."} />
                              </SelectTrigger>
                              <SelectContent className="bg-background border z-50 shadow-lg">
                                <SelectItem value="__none__" className="text-xs hover:bg-accent cursor-pointer">
                                  Nenhum
                                </SelectItem>
                                {regentCommanders.map(commander => (
                                  <SelectItem key={commander.id} value={commander.id} className="text-xs hover:bg-accent cursor-pointer">
                                    {commander.nome_comandante} ({commander.especializacao_inicial})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                         </div>
                      </div>
                    ))}

                   {regentCommanders.length === 0 && formData.regentId && (
                     <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                       <p className="text-sm text-amber-600">
                         ⚠️ Nenhum comandante associado a este regente. Vá para "Comandantes de Campo" para criar e associar comandantes.
                       </p>
                     </div>
                   )}

                   {countries.length === 0 && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          💡 Importe uma planilha de localização na aba "Importações" para definir localização das unidades.
                        </p>
                      </div>
                    )}
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