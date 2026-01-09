import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GalaxyLoreSection {
  id: string;
  section_type: string;
  faction_id: string | null;
  sub_section: string | null;
  title: string | null;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useGalaxyLore() {
  const queryClient = useQueryClient();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['galaxy-lore'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galaxy_lore_sections')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as GalaxyLoreSection[];
    }
  });

  const updateSection = useMutation({
    mutationFn: async ({ id, content, title }: { id: string; content: string; title?: string }) => {
      const updates: { content: string; title?: string } = { content };
      if (title !== undefined) updates.title = title;
      
      const { error } = await supabase
        .from('galaxy_lore_sections')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galaxy-lore'] });
      toast.success('Conteúdo salvo!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const getSection = (sectionType: string, factionId?: string, subSection?: string) => {
    return sections.find(s => 
      s.section_type === sectionType &&
      (factionId ? s.faction_id === factionId : !s.faction_id) &&
      (subSection ? s.sub_section === subSection : !s.sub_section)
    );
  };

  const getMainSection = (sectionType: string) => getSection(sectionType);
  
  const getFactionSection = (factionId: string, subSection: string) => 
    getSection('faccoes', factionId, subSection);

  return {
    sections,
    isLoading,
    updateSection,
    getSection,
    getMainSection,
    getFactionSection
  };
}
