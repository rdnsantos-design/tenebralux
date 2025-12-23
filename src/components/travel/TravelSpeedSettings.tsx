import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTravelSpeeds, useUpdateTravelSpeed } from '@/hooks/useTravel';
import { Settings, User, Users, Save, Loader2 } from 'lucide-react';

export function TravelSpeedSettings() {
  const { data: speeds, isLoading } = useTravelSpeeds();
  const updateSpeed = useUpdateTravelSpeed();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const handleEdit = (id: string, currentSpeed: number) => {
    setEditingId(id);
    setEditValue(currentSpeed);
  };

  const handleSave = (id: string) => {
    updateSpeed.mutate(
      { id, speed_km_per_day: editValue },
      { onSuccess: () => setEditingId(null) }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="w-4 h-4" />
          Configurar Velocidades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {speeds?.map(speed => (
          <div key={speed.id} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              {speed.travel_type === 'individual' ? (
                <User className="w-5 h-5 text-blue-500" />
              ) : (
                <Users className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{speed.label}</div>
              <div className="text-xs text-muted-foreground">{speed.description}</div>
            </div>
            <div className="flex items-center gap-2">
              {editingId === speed.id ? (
                <>
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                    className="w-20 text-right"
                    min={1}
                    max={200}
                  />
                  <span className="text-sm text-muted-foreground">km/dia</span>
                  <Button
                    size="sm"
                    onClick={() => handleSave(speed.id)}
                    disabled={updateSpeed.isPending}
                  >
                    {updateSpeed.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-mono font-bold">{speed.speed_km_per_day}</span>
                  <span className="text-sm text-muted-foreground">km/dia</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(speed.id, Number(speed.speed_km_per_day))}
                  >
                    Editar
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
