import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTerrains, useUpdateTerrain } from '@/hooks/useTerrains';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ImageIcon, Wand2 } from 'lucide-react';
import { TerrainHexTile } from './TerrainHexTile';

export function TerrainImageGenerator() {
  const { data: terrains, isLoading } = useTerrains();
  const updateTerrain = useUpdateTerrain();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTerrain, setCurrentTerrain] = useState<string | null>(null);

  const terrainsWithoutImages = terrains?.filter(t => !t.image_url) || [];
  const terrainsWithImages = terrains?.filter(t => t.image_url) || [];

  const generateSingleImage = async (terrainId: string, terrainName: string, terrainTag: string | null) => {
    try {
      const response = await supabase.functions.invoke('generate-terrain-image', {
        body: { terrainName, terrainTag },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to generate image');
      }

      await updateTerrain.mutateAsync({
        id: terrainId,
        image_url: response.data.imageUrl,
      });

      return true;
    } catch (error) {
      console.error(`Failed to generate image for ${terrainName}:`, error);
      return false;
    }
  };

  const generateAllImages = async () => {
    if (terrainsWithoutImages.length === 0) {
      toast.info('Todos os terrenos já possuem imagens');
      return;
    }

    setGenerating(true);
    setProgress(0);
    let successCount = 0;

    for (let i = 0; i < terrainsWithoutImages.length; i++) {
      const terrain = terrainsWithoutImages[i];
      setCurrentTerrain(terrain.name);
      
      const success = await generateSingleImage(terrain.id, terrain.name, terrain.tag);
      if (success) successCount++;
      
      setProgress(((i + 1) / terrainsWithoutImages.length) * 100);
      
      // Small delay to avoid rate limiting
      if (i < terrainsWithoutImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setGenerating(false);
    setCurrentTerrain(null);
    toast.success(`${successCount} de ${terrainsWithoutImages.length} imagens geradas com sucesso!`);
  };

  const regenerateImage = async (terrainId: string, terrainName: string, terrainTag: string | null) => {
    setCurrentTerrain(terrainName);
    const success = await generateSingleImage(terrainId, terrainName, terrainTag);
    setCurrentTerrain(null);
    
    if (success) {
      toast.success(`Imagem de ${terrainName} regenerada!`);
    } else {
      toast.error(`Falha ao regenerar imagem de ${terrainName}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Gerador de Imagens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {terrainsWithImages.length} de {terrains?.length || 0} terrenos com imagens
          </div>
          <Button
            onClick={generateAllImages}
            disabled={generating || terrainsWithoutImages.length === 0}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Gerar Imagens Faltantes ({terrainsWithoutImages.length})
              </>
            )}
          </Button>
        </div>

        {generating && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              Gerando: {currentTerrain}...
            </p>
          </div>
        )}

        {/* Preview of terrains with images */}
        {terrainsWithImages.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Terrenos com imagens:</h4>
            <div className="flex flex-wrap gap-2">
              {terrainsWithImages.map(terrain => (
                <div key={terrain.id} className="relative group">
                  <TerrainHexTile terrain={terrain} size="sm" showModifiers={false} />
                  <button
                    onClick={() => regenerateImage(terrain.id, terrain.name, terrain.tag)}
                    disabled={generating}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs rounded"
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    }}
                  >
                    {currentTerrain === terrain.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Regenerar'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terrains without images */}
        {terrainsWithoutImages.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Terrenos sem imagens:</h4>
            <div className="flex flex-wrap gap-2">
              {terrainsWithoutImages.map(terrain => (
                <div key={terrain.id} className="relative group">
                  <TerrainHexTile terrain={terrain} size="sm" showModifiers={false} />
                  <button
                    onClick={() => regenerateImage(terrain.id, terrain.name, terrain.tag)}
                    disabled={generating}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs rounded"
                    style={{
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    }}
                  >
                    {currentTerrain === terrain.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Gerar'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
