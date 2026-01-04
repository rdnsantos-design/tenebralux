import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileJson } from 'lucide-react';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (json: string) => Promise<void>;
  onExport: () => void;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  onImport,
  onExport,
}: ImportExportDialogProps) {
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    
    setIsImporting(true);
    try {
      await onImport(importText);
      setImportText('');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar / Exportar Personagens</DialogTitle>
          <DialogDescription>
            Faça backup dos seus personagens ou importe de outro dispositivo.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <FileJson className="w-4 h-4 mr-2" />
                Selecionar Arquivo JSON
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder="Ou cole o conteúdo JSON aqui..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleImport}
              disabled={!importText.trim() || isImporting}
              className="w-full"
            >
              {isImporting ? 'Importando...' : 'Importar Personagens'}
            </Button>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Exporte todos os seus personagens como um arquivo JSON.
              Você pode usar este arquivo para fazer backup ou transferir para outro dispositivo.
            </p>

            <Button onClick={onExport} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar Arquivo de Backup
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
