import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Crown } from "lucide-react";
import { Regent } from "@/types/Army";

interface RegentEditorProps {
  regent?: Regent | null;
  onSave: (regent: Regent) => void;
  onCancel: () => void;
}

export const RegentEditor = ({ regent, onSave, onCancel }: RegentEditorProps) => {
  const [formData, setFormData] = useState({
    name: regent?.name || "",
    character: regent?.character || "",
    domain: regent?.domain || "",
    goldBars: regent?.goldBars || 0,
    regencyPoints: regent?.regencyPoints || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const regentData: Regent = {
      id: regent?.id || `regent_${Date.now()}`,
      ...formData,
      createdAt: regent?.createdAt || new Date().toISOString(),
    };

    onSave(regentData);
  };

  const isEditing = !!regent;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Editar Regente' : 'Novo Regente'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Modifique os dados do regente' : 'Cadastre um novo regente para gerenciar exércitos'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Informações do Regente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Regente *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Lorde Aerick"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="character">Personagem *</Label>
                  <Input
                    id="character"
                    value={formData.character}
                    onChange={(e) => setFormData(prev => ({ ...prev, character: e.target.value }))}
                    placeholder="Ex: Rei de Avanil"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="domain">Domínio *</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="Ex: Reino de Avanil"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goldBars">Gold Bars (GB)</Label>
                  <Input
                    id="goldBars"
                    type="number"
                    min="0"
                    value={formData.goldBars}
                    onChange={(e) => setFormData(prev => ({ ...prev, goldBars: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Recursos financeiros disponíveis</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regencyPoints">Regency Points (RP)</Label>
                  <Input
                    id="regencyPoints"
                    type="number"
                    min="0"
                    value={formData.regencyPoints}
                    onChange={(e) => setFormData(prev => ({ ...prev, regencyPoints: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Pontos de regência disponíveis</p>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Salvar Alterações' : 'Cadastrar Regente'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};