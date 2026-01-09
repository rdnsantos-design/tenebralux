import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Planet, Faction, GalaxyFilters, FACTION_NAME_TO_ID } from '@/types/galaxy';
import planetsData from '@/data/galaxy/planets.json';

// Converter dados do JSON para formato do banco
function convertJsonPlanet(p: any): Planet {
  return {
    id: p.id,
    nome: p.nome,
    x: p.x,
    y: p.y,
    z: p.z,
    distancia: p.distancia,
    regiao: p.regiao,
    faccao: p.faccao,
    zona: p.zona as 'Core' | 'Periferia',
    tier: p.tier as 1 | 2 | 3 | 4 | 5,
    D: p.D,
    R: p.R,
    Def: p.Def,
    slotsProd: p.slotsProd,
    slotsCom: p.slotsCom,
    slotsSoc: p.slotsSoc,
    pcpTotal: p.pcpTotal,
    pcpGasto: p.pcpGasto,
    tagsPositivas: p.tagsPositivas || '',
    tagsNegativas: p.tagsNegativas || '',
    tipo: p.tipo,
    funcao: p.funcao,
    populacao: p.populacao,
    descricao: p.descricao || ''
  };
}

export function useGalaxyPlanets() {
  const queryClient = useQueryClient();

  // Buscar planetas do banco ou usar dados locais como fallback
  const { data: planets = [], isLoading } = useQuery({
    queryKey: ['galaxy-planets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galaxy_planets')
        .select('*')
        .order('id');
      
      if (error) {
        console.warn('Erro ao buscar planetas do banco, usando dados locais:', error);
        return (planetsData as any[]).map(convertJsonPlanet);
      }
      
      if (data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          x: Number(p.x),
          y: Number(p.y),
          z: Number(p.z),
          distancia: Number(p.distancia),
          regiao: p.regiao,
          faccao: p.faccao,
          zona: p.zona as 'Core' | 'Periferia',
          tier: p.tier as 1 | 2 | 3 | 4 | 5,
          D: p.d,
          R: p.r,
          Def: p.def,
          slotsProd: p.slots_prod,
          slotsCom: p.slots_com,
          slotsSoc: p.slots_soc,
          pcpTotal: p.pcp_total,
          pcpGasto: p.pcp_gasto,
          tagsPositivas: p.tags_positivas || '',
          tagsNegativas: p.tags_negativas || '',
          tipo: p.tipo,
          funcao: p.funcao,
          populacao: p.populacao,
          descricao: p.descricao || ''
        })) as Planet[];
      }
      
      // Se banco vazio, usar dados locais
      return (planetsData as any[]).map(convertJsonPlanet);
    }
  });

  // Buscar facções
  const { data: factions = [] } = useQuery({
    queryKey: ['galaxy-factions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galaxy_factions')
        .select('*')
        .order('planets_count', { ascending: false });
      
      if (error) throw error;
      return data as Faction[];
    }
  });

  // Atualizar planeta
  const updatePlanet = useMutation({
    mutationFn: async (planet: Partial<Planet> & { id: number }) => {
      const { error } = await supabase
        .from('galaxy_planets')
        .update({
          nome: planet.nome,
          x: planet.x,
          y: planet.y,
          z: planet.z,
          distancia: planet.distancia,
          regiao: planet.regiao,
          faccao: planet.faccao,
          zona: planet.zona,
          tier: planet.tier,
          d: planet.D,
          r: planet.R,
          def: planet.Def,
          slots_prod: planet.slotsProd,
          slots_com: planet.slotsCom,
          slots_soc: planet.slotsSoc,
          pcp_total: planet.pcpTotal,
          pcp_gasto: planet.pcpGasto,
          tags_positivas: planet.tagsPositivas,
          tags_negativas: planet.tagsNegativas,
          tipo: planet.tipo,
          funcao: planet.funcao,
          populacao: planet.populacao,
          descricao: planet.descricao
        })
        .eq('id', planet.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galaxy-planets'] });
      toast.success('Planeta atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  // Importar planetas do JSON para o banco
  const importPlanets = useMutation({
    mutationFn: async () => {
      const planetsToInsert = (planetsData as any[]).map(p => ({
        nome: p.nome,
        x: p.x,
        y: p.y,
        z: p.z,
        distancia: p.distancia,
        regiao: p.regiao,
        faccao: p.faccao,
        zona: p.zona,
        tier: p.tier,
        d: p.D,
        r: p.R,
        def: p.Def,
        slots_prod: p.slotsProd,
        slots_com: p.slotsCom,
        slots_soc: p.slotsSoc,
        pcp_total: p.pcpTotal,
        pcp_gasto: p.pcpGasto,
        tags_positivas: p.tagsPositivas || '',
        tags_negativas: p.tagsNegativas || '',
        tipo: p.tipo,
        funcao: p.funcao,
        populacao: p.populacao,
        descricao: p.descricao || ''
      }));

      const { error } = await supabase
        .from('galaxy_planets')
        .insert(planetsToInsert);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galaxy-planets'] });
      toast.success('312 planetas importados com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao importar: ' + error.message);
    }
  });

  // Filtrar planetas
  const filterPlanets = (filters: GalaxyFilters): Planet[] => {
    return planets.filter(planet => {
      // Filtro por facção
      if (filters.factions.length > 0) {
        const factionId = FACTION_NAME_TO_ID[planet.faccao] || planet.faccao.toLowerCase();
        if (!filters.factions.includes(factionId)) return false;
      }

      // Filtro por tier
      if (filters.tiers.length > 0 && !filters.tiers.includes(planet.tier)) {
        return false;
      }

      // Filtro por tipo
      if (filters.types.length > 0 && !filters.types.includes(planet.tipo)) {
        return false;
      }

      // Filtro por função
      if (filters.functions.length > 0 && !filters.functions.includes(planet.funcao)) {
        return false;
      }

      // Filtro por região
      if (filters.regions.length > 0 && !filters.regions.includes(planet.regiao)) {
        return false;
      }

      // Busca por nome
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!planet.nome.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  };

  // Estatísticas
  const getStats = () => {
    const totalPopulation = planets.reduce((sum, p) => sum + p.populacao, 0);
    const tierCounts = [0, 0, 0, 0, 0];
    planets.forEach(p => tierCounts[p.tier - 1]++);

    return {
      totalPlanets: planets.length,
      totalPopulation,
      tierCounts,
      factionCounts: factions.reduce((acc, f) => {
        acc[f.id] = f.planets_count;
        return acc;
      }, {} as Record<string, number>)
    };
  };

  return {
    planets,
    factions,
    isLoading,
    updatePlanet,
    importPlanets,
    filterPlanets,
    getStats
  };
}
