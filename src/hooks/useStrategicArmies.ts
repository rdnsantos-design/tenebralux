import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StrategicArmy, calculateDefense, calculateHitPoints, calculateVetSpent } from '@/types/combat/strategic-army';

export function useStrategicArmies() {
  const [armies, setArmies] = useState<StrategicArmy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArmies = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('strategic_armies')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedArmies: StrategicArmy[] = (data || []).map((row: any) => {
        const commanders = row.commanders || [];
        const tacticalCards = row.tactical_cards || [];
        const vetInfo = calculateVetSpent({
          totalVet: row.total_vet,
          attackPurchased: row.attack,
          defensePurchased: row.defense,
          mobilityPurchased: row.mobility,
          commanders,
          tacticalCards,
        });

        return {
          id: row.id,
          name: row.name,
          culture: row.culture_id || '',
          regentId: row.regent_id,
          realmId: row.realm_id,
          provinceId: row.province_id,
          totalVet: row.total_vet,
          attackPurchased: row.attack,
          defensePurchased: row.defense,
          mobilityPurchased: row.mobility,
          attack: row.attack,
          defense: calculateDefense(row.defense),
          mobility: row.mobility,
          hitPoints: calculateHitPoints(row.total_vet),
          commanders,
          tacticalCards,
          vetSpentOnAttributes: vetInfo.attributes,
          vetSpentOnCommanders: vetInfo.commanders,
          vetSpentOnCards: vetInfo.cards,
          vetRemaining: vetInfo.remaining,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });

      setArmies(transformedArmies);
    } catch (err: any) {
      console.error('Error fetching armies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveArmy = async (army: StrategicArmy) => {
    try {
      const dbArmy = {
        id: army.id,
        name: army.name,
        total_vet: army.totalVet,
        attack: army.attackPurchased,
        defense: army.defensePurchased,
        mobility: army.mobilityPurchased,
        culture_id: army.culture || null,
        regent_id: army.regentId || null,
        realm_id: army.realmId || null,
        province_id: army.provinceId || null,
        commanders: JSON.parse(JSON.stringify(army.commanders)),
        tactical_cards: JSON.parse(JSON.stringify(army.tacticalCards)),
      };

      const { error: upsertError } = await supabase
        .from('strategic_armies')
        .upsert(dbArmy as any);

      if (upsertError) throw upsertError;

      toast.success('Exército salvo com sucesso!');
      await fetchArmies();
    } catch (err: any) {
      console.error('Error saving army:', err);
      toast.error('Erro ao salvar exército: ' + err.message);
      throw err;
    }
  };

  const deleteArmy = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('strategic_armies')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Exército excluído!');
      await fetchArmies();
    } catch (err: any) {
      console.error('Error deleting army:', err);
      toast.error('Erro ao excluir exército: ' + err.message);
    }
  };

  useEffect(() => {
    fetchArmies();
  }, []);

  return { armies, loading, error, fetchArmies, saveArmy, deleteArmy };
}
