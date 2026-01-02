import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Swords, Construction } from "lucide-react";

const TacticalHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <Card className="border-2 border-dashed border-muted-foreground/30">
          <CardHeader className="text-center">
            <div className="flex justify-center gap-4 mb-4">
              <Swords className="h-12 w-12 text-primary" />
              <Construction className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-3xl">Sistema de Batalha Tática</CardTitle>
            <CardDescription className="text-lg">
              Em Desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              O sistema de batalha tática com hexágonos está sendo desenvolvido.
            </p>
            <p className="text-sm text-muted-foreground">
              Este módulo permitirá combates táticos em tempo real com unidades no tabuleiro hexagonal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TacticalHome;
