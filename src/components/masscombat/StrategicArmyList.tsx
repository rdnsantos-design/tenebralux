import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Swords, 
  Shield, 
  Zap, 
  Heart,
  Users,
  MapPin,
  Crown
} from 'lucide-react';
import { StrategicArmy } from '@/types/combat/strategic-army';
import { StrategicArmyBuilder } from './StrategicArmyBuilder';
import { useStrategicArmies } from '@/hooks/useStrategicArmies';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

export function StrategicArmyList() {
  const { armies, loading, saveArmy, deleteArmy } = useStrategicArmies();
  const [editingArmy, setEditingArmy] = useState<StrategicArmy | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [armyToDelete, setArmyToDelete] = useState<StrategicArmy | null>(null);

  const handleSave = async (army: StrategicArmy) => {
    await saveArmy(army);
    setEditingArmy(null);
    setIsCreating(false);
  };

  const handleDelete = async () => {
    if (!armyToDelete) return;
    await deleteArmy(armyToDelete.id);
    setArmyToDelete(null);
  };

  // Se estiver editando ou criando, mostrar o builder
  if (isCreating || editingArmy) {
    return (
      <StrategicArmyBuilder
        army={editingArmy || undefined}
        onSave={handleSave}
        onCancel={() => {
          setEditingArmy(null);
          setIsCreating(false);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Exércitos Estratégicos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Exércitos Estratégicos</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Exército
        </Button>
      </div>

      {armies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum exército criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro exército estratégico usando pontos de VET
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Exército
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {armies.map((army) => (
            <Card key={army.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{army.name}</CardTitle>
                    {army.regentName && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Crown className="w-3 h-3" />
                        {army.regentName}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">{army.totalVet} VET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Localização */}
                {(army.realmName || army.provinceName) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {[army.provinceName, army.realmName].filter(Boolean).join(', ')}
                  </div>
                )}

                {/* Atributos */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <Heart className="w-4 h-4 mx-auto text-red-500 mb-1" />
                    <div className="font-bold">{army.hitPoints}</div>
                    <div className="text-[10px] text-muted-foreground">PV</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <Swords className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                    <div className="font-bold">{army.attack}</div>
                    <div className="text-[10px] text-muted-foreground">ATQ</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <Shield className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                    <div className="font-bold">{army.defense}</div>
                    <div className="text-[10px] text-muted-foreground">DEF</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <Zap className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
                    <div className="font-bold">{army.mobility}</div>
                    <div className="text-[10px] text-muted-foreground">MOB</div>
                  </div>
                </div>

                {/* Resumo */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {army.commanders.length > 0 && (
                    <Badge variant="secondary">
                      {army.commanders.length} Comandante{army.commanders.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {army.tacticalCards.length > 0 && (
                    <Badge variant="secondary">
                      {army.tacticalCards.reduce((sum, c) => sum + c.quantity, 0)} Carta{army.tacticalCards.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {army.vetRemaining > 0 && (
                    <Badge variant="outline" className="text-green-600">
                      {army.vetRemaining} VET livre
                    </Badge>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingArmy(army)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setArmyToDelete(army)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!armyToDelete} onOpenChange={() => setArmyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Exército</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o exército "{armyToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
