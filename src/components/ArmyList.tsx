import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Army, Regent } from "@/types/Army";
import { Country, Province } from "@/types/Location";
import { Edit, Trash2, Users, Shield, Calendar, MapPin } from "lucide-react";

interface ArmyListProps {
  armies: Army[];
  regents: Regent[];
  onEdit: (army: Army) => void;
  onDelete: (armyId: string) => void;
}

export const ArmyList = ({ armies, regents, onEdit, onDelete }: ArmyListProps) => {
  const [countries, setCountries] = useState<Country[]>([]);

  // Carregar países das importações de localização
  useEffect(() => {
    const savedLocationImports = localStorage.getItem('locationImports');
    if (savedLocationImports) {  
      try {
        const locationImports = JSON.parse(savedLocationImports);
        if (locationImports.length > 0) {
          const latestImport = locationImports[0];
          setCountries(latestImport.countries || []);
        }
      } catch (error) {
        console.error('Erro ao carregar países:', error);
      }
    }
  }, []);

  const getRegent = (regentId: string) => {
    return regents.find(regent => regent.id === regentId);
  };

  const getLocationName = (countryId?: string, provinceId?: string) => {
    if (!countryId || countries.length === 0) return null;
    
    const country = countries.find(c => c.id === countryId);
    if (!country) return null;
    
    if (provinceId) {
      const province = country.provinces.find(p => p.id === provinceId);
      return province ? `${province.name}, ${country.name}` : country.name;
    }
    
    return country.name;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {armies.map((army) => {
        const regent = getRegent(army.regentId);
        const totalPower = army.units.reduce((sum, unit) => sum + unit.power, 0);
        const totalMaintenanceCost = army.units.reduce((sum, unit) => sum + unit.maintenanceCost, 0);

        return (
          <Card key={army.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-primary" />
                <span className="truncate">{army.name}</span>
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">
                  {regent ? `${regent.name} - ${regent.domain}` : 'Regente não encontrado'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{army.units.length} unidades</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Poder total: {army.units.reduce((total, unit) => total + unit.power, 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>💰 Manutenção: {army.units.reduce((total, unit) => total + unit.maintenanceCost, 0)} GB/turno</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Criado em {new Date(army.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {army.units.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Unidades principais:</div>
                    <div className="space-y-1">
                        {army.units.slice(0, 3).map((unit) => {
                          const locationName = getLocationName(unit.countryId, unit.provinceId);
                          return (
                            <div key={unit.id} className="text-xs">
                              • {unit.name} {unit.unitNumber ? `#${unit.unitNumber}` : ''} (Poder: {unit.power})
                              {locationName && locationName !== 'Sem localização' && (
                                <span className="text-muted-foreground ml-1">- {locationName}</span>
                              )}
                            </div>
                          );
                        })}
                      {army.units.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          ... e mais {army.units.length - 3} unidades
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(army)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(army.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};