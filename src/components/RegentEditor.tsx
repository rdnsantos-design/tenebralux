import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Crown } from "lucide-react";
import { Regent } from "@/types/Domain";

interface RegentEditorProps {
  regent?: Regent | null;
  onSave: (regent: Omit<Regent, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  onCancel: () => void;
}

export const RegentEditor = ({ regent, onSave, onCancel }: RegentEditorProps) => {
  const [formData, setFormData] = useState({
    name: regent?.name || "",
    code: regent?.code || "",
    full_name: regent?.full_name || "",
    character: regent?.character || "",
    domain: regent?.domain || "",
    gold_bars: regent?.gold_bars || 0,
    regency_points: regent?.regency_points || 0,
    comando: regent?.comando || 1,
    estrategia: regent?.estrategia || 1,
    notes: regent?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      id: regent?.id,
      ...formData,
    });
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
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Ex: AV01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Ex: Lorde Aerick de Avanil"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="character">Jogador</Label>
                  <Input
                    id="character"
                    value={formData.character}
                    onChange={(e) => setFormData(prev => ({ ...prev, character: e.target.value }))}
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="domain">Domínio</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="Ex: Reino de Avanil"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gold_bars">Gold Bars (GB)</Label>
                  <Input
                    id="gold_bars"
                    type="number"
                    min="0"
                    value={formData.gold_bars}
                    onChange={(e) => setFormData(prev => ({ ...prev, gold_bars: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Recursos financeiros disponíveis</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regency_points">Regency Points (RP)</Label>
                  <Input
                    id="regency_points"
                    type="number"
                    min="0"
                    value={formData.regency_points}
                    onChange={(e) => setFormData(prev => ({ ...prev, regency_points: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Pontos de regência disponíveis</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comando">Comando (1-5)</Label>
                  <Input
                    id="comando"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.comando}
                    onChange={(e) => setFormData(prev => ({ ...prev, comando: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) }))}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">Perícia de comando militar</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estrategia">Estratégia (1-5)</Label>
                  <Input
                    id="estrategia"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.estrategia}
                    onChange={(e) => setFormData(prev => ({ ...prev, estrategia: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) }))}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">Perícia de estratégia militar</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionais..."
                  />
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
