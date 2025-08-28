import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Trash2, Eye, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LocationImport, Country, Province } from '@/types/Location';

interface LocationImportManagerProps {
  onCancel: () => void;
  onImportComplete: (countries: Country[]) => void;
}

export const LocationImportManager: React.FC<LocationImportManagerProps> = ({
  onCancel,
  onImportComplete
}) => {
  const [imports, setImports] = useState<LocationImport[]>([]);
  const [showImporter, setShowImporter] = useState(false);
  const [previewImport, setPreviewImport] = useState<LocationImport | null>(null);
  const [importing, setImporting] = useState(false);

  // Carregar importações salvas
  useEffect(() => {
    const savedImports = localStorage.getItem('locationImports');
    if (savedImports) {
      try {
        const parsedImports = JSON.parse(savedImports);
        setImports(parsedImports.map((imp: any) => ({
          ...imp,
          importDate: new Date(imp.importDate)
        })));
      } catch (error) {
        console.error('Erro ao carregar importações de localização:', error);
      }
    }
  }, []);

  // Salvar importações no localStorage
  useEffect(() => {
    if (imports.length > 0) {
      localStorage.setItem('locationImports', JSON.stringify(imports));
    }
  }, [imports]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      if (jsonData.length < 2) {
        alert('A planilha deve ter pelo menos um cabeçalho e uma linha de dados');
        return;
      }

      // Processar dados - esperamos colunas: País, Província
      const countries: { [key: string]: Country } = {};
      
      // Começar da linha 1 (pular cabeçalho)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const countryName = row[0]?.toString().trim();
        const provinceName = row[1]?.toString().trim();

        if (!countryName || !provinceName) continue;

        // Criar país se não existir
        if (!countries[countryName]) {
          countries[countryName] = {
            id: `country-${countryName.toLowerCase().replace(/\s+/g, '-')}`,
            name: countryName,
            provinces: []
          };
        }

        // Adicionar província se não existir
        const provinceExists = countries[countryName].provinces.some(p => p.name === provinceName);
        if (!provinceExists) {
          countries[countryName].provinces.push({
            id: `${countries[countryName].id}-${provinceName.toLowerCase().replace(/\s+/g, '-')}`,
            name: provinceName,
            countryId: countries[countryName].id
          });
        }
      }

      const countriesArray = Object.values(countries);
      const totalProvinces = countriesArray.reduce((total, country) => total + country.provinces.length, 0);

      const newImport: LocationImport = {
        id: `import-${Date.now()}`,
        fileName: file.name,
        importDate: new Date(),
        countries: countriesArray
      };

      handleNewImport(newImport);
      console.log(`Importação concluída: ${countriesArray.length} países, ${totalProvinces} províncias`);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      alert('Erro ao processar arquivo. Verifique se é uma planilha Excel válida.');
    } finally {
      setImporting(false);
      setShowImporter(false);
    }
  };

  const handleNewImport = (newImport: LocationImport) => {
    setImports(prev => [newImport, ...prev]);
  };

  const handleDeleteImport = (importId: string) => {
    setImports(prev => prev.filter(imp => imp.id !== importId));
    if (previewImport?.id === importId) {
      setPreviewImport(null);
    }
  };

  const handleUseImport = (importData: LocationImport) => {
    onImportComplete(importData.countries);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (showImporter) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Importar Localização</h1>
              <p className="text-muted-foreground">
                Importe uma planilha Excel com países e províncias
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowImporter(false)}>
              Voltar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Planilha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione uma planilha Excel</h3>
                <p className="text-muted-foreground mb-4">
                  A planilha deve ter duas colunas: País e Província
                </p>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p><strong>Formato esperado:</strong></p>
                  <p>Coluna A: Nome do País (ex: Brasil)</p>
                  <p>Coluna B: Nome da Província (ex: São Paulo)</p>
                </div>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="max-w-xs mx-auto"
                />
                {importing && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Processando arquivo...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (previewImport) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Visualizar Importação</h1>
              <p className="text-muted-foreground">
                {previewImport.fileName} - {previewImport.countries.length} países
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreviewImport(null)}>
                Voltar
              </Button>
              <Button onClick={() => handleUseImport(previewImport)}>
                <Check className="h-4 w-4 mr-2" />
                Usar Esta Importação
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Países e Províncias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {previewImport.countries.map(country => (
                  <div key={country.id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-lg mb-3">{country.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {country.provinces.map(province => (
                        <Badge key={province.id} variant="secondary">
                          {province.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {country.provinces.length} províncias
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciar Localização</h1>
            <p className="text-muted-foreground">
              Importe e gerencie planilhas de países e províncias
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Voltar
            </Button>
            <Button onClick={() => setShowImporter(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Nova Importação
            </Button>
          </div>
        </div>

        {imports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhuma importação encontrada</h3>
              <p className="text-muted-foreground text-center mb-6">
                Importe uma planilha Excel com países e províncias para começar
              </p>
              <Button onClick={() => setShowImporter(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Primeira Planilha
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {imports.map(importData => (
              <Card key={importData.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        {importData.fileName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Importado em {formatDate(importData.importDate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewImport(importData)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseImport(importData)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Usar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteImport(importData.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-medium">{importData.countries.length}</span>
                      <span className="text-muted-foreground ml-1">países</span>
                    </div>
                    <div>
                      <span className="font-medium">
                        {importData.countries.reduce((total, country) => total + country.provinces.length, 0)}
                      </span>
                      <span className="text-muted-foreground ml-1">províncias</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};