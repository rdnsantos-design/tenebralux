import { useStrategicArmies } from '@/hooks/useStrategicArmies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Swords, Users, Check, AlertTriangle } from 'lucide-react';

interface TacticalArmySelectorProps {
  onSelect: (armyId: string) => void;
  selectedArmyId?: string;
  maxPower?: number;
}

export function TacticalArmySelector({ 
  onSelect, 
  selectedArmyId, 
  maxPower 
}: TacticalArmySelectorProps) {
  const { armies, loading } = useStrategicArmies();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (armies.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhum exército disponível.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Crie exércitos em "Combate em Massa" primeiro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {armies.map(army => {
          const isSelected = army.id === selectedArmyId;
          const armyVet = army.totalVet || 0;
          const exceedsLimit = maxPower && armyVet > maxPower;
          
          return (
            <Card 
              key={army.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'hover:border-muted-foreground/50'
              } ${exceedsLimit ? 'opacity-60' : ''}`}
              onClick={() => !exceedsLimit && onSelect(army.id)}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {army.name}
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CardTitle>
                  <Badge variant={exceedsLimit ? 'destructive' : 'secondary'}>
                    {armyVet} VET
                    {exceedsLimit && (
                      <AlertTriangle className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4 pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Swords className="h-4 w-4" />
                    <span>{army.attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>{army.defense}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {Array.isArray(army.commanders) 
                        ? army.commanders.length 
                        : 0} comandantes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
