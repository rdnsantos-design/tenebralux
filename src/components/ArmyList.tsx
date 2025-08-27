import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, Crown, Shield } from "lucide-react";
import { Army, Regent } from "@/types/Army";

interface ArmyListProps {
  armies: Army[];
  regents: Regent[];
  onEdit: (army: Army) => void;
  onDelete: (armyId: string) => void;
}

export const ArmyList = ({ armies, regents, onEdit, onDelete }: ArmyListProps) => {
  const getRegent = (regentId: string) => regents.find(r => r.id === regentId);

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
                <Crown className="w-4 h-4" />
                <span className="truncate">
                  {regent ? `${regent.name} - ${regent.domain}` : 'Regente não encontrado'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold">{army.units.length}</div>
                      <div className="text-xs text-muted-foreground">Unidades</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-semibold">{totalPower}</div>
                      <div className="text-xs text-muted-foreground">Poder Total</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Manutenção Total:</div>
                  <Badge variant="outline" className="text-xs">
                    {totalMaintenanceCost} GB/turno
                  </Badge>
                </div>

                {army.units.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Unidades principais:</div>
                    <div className="space-y-1">
                      {army.units.slice(0, 3).map((unit) => (
                        <div key={unit.id} className="text-xs">
                          • {unit.name} (Poder: {unit.power})
                        </div>
                      ))}
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

              <div className="text-xs text-muted-foreground border-t pt-2">
                Criado em {new Date(army.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};