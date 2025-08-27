import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Crown, Coins, Star } from "lucide-react";
import { Regent } from "@/types/Army";

interface RegentListProps {
  regents: Regent[];
  onEdit: (regent: Regent) => void;
  onDelete: (regentId: string) => void;
}

export const RegentList = ({ regents, onEdit, onDelete }: RegentListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {regents.map((regent) => (
        <Card key={regent.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5 text-primary" />
              <span className="truncate">{regent.name}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              {regent.character}
            </p>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {regent.domain}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-600" />
                  <div>
                    <div className="font-semibold">{regent.goldBars}</div>
                    <div className="text-xs text-muted-foreground">GB</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-semibold">{regent.regencyPoints}</div>
                    <div className="text-xs text-muted-foreground">RP</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(regent)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(regent.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground border-t pt-2">
              Criado em {new Date(regent.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};