/**
 * Lista de exércitos salvos para o modo single-player
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Swords, Shield, Zap, Heart, Users, Plus, 
  Trash2, Edit, Play, Crown, ArrowLeft
} from 'lucide-react';
import { StrategicArmy, calculateVetSpent } from '@/types/combat/strategic-army';
import { useLocalArmies } from '@/hooks/useLocalArmies';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SinglePlayerArmyListProps {
  onSelectArmy: (army: StrategicArmy) => void;
  onCreateNew: () => void;
  onEditArmy: (army: StrategicArmy) => void;
  onBack: () => void;
}

export function SinglePlayerArmyList({ 
  onSelectArmy, 
  onCreateNew, 
  onEditArmy,
  onBack 
}: SinglePlayerArmyListProps) {
  const { armies, loading, remove } = useLocalArmies();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando exércitos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background p-4">
      <Button variant="ghost" className="absolute top-4 left-4" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="text-center mb-6 pt-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Swords className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Seus Exércitos</h1>
        </div>
        <p className="text-muted-foreground">
          Selecione um exército para jogar ou crie um novo
        </p>
      </div>

      {/* Botão criar novo */}
      <Card 
        className="mb-4 cursor-pointer border-dashed border-2 hover:border-primary transition-colors"
        onClick={onCreateNew}
      >
        <CardContent className="py-6 flex items-center justify-center gap-2">
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Criar Novo Exército</span>
        </CardContent>
      </Card>

      {armies.length === 0 ? (
        <Card className="flex-1">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Você ainda não tem exércitos salvos.</p>
            <p className="text-sm">Crie seu primeiro exército para começar a jogar!</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-3">
            {armies.map((army) => {
              const vetInfo = calculateVetSpent(army);
              const general = army.commanders.find(c => c.isGeneral);
              
              return (
                <Card key={army.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {army.name}
                          {general && (
                            <Badge variant="outline" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              {general.especializacao}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {army.cultureName || army.culture}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {army.totalVet} VET
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Stats */}
                    <div className="flex flex-wrap gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Swords className="w-4 h-4 text-red-500" />
                        <span>{army.attack}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span>{army.defense}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>{army.mobility}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span>{army.hitPoints} PV</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span>{army.commanders.length} cmd</span>
                      </div>
                    </div>

                    {/* Cartas */}
                    <div className="text-xs text-muted-foreground mb-4">
                      {army.tacticalCards.length} cartas táticas
                      {vetInfo.remaining > 0 && (
                        <span className="ml-2 text-green-600">
                          ({vetInfo.remaining} VET restante)
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => onSelectArmy(army)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Jogar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => onEditArmy(army)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover exército?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover "{army.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => remove(army.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
