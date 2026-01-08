-- Categorias de privilégios
CREATE TABLE public.rpg_privilege_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Gift',
  color TEXT NOT NULL DEFAULT '#888888',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rpg_privilege_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read privilege categories" ON public.rpg_privilege_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert privilege categories" ON public.rpg_privilege_categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update privilege categories" ON public.rpg_privilege_categories FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete privilege categories" ON public.rpg_privilege_categories FOR DELETE USING (auth.uid() IS NOT NULL);

-- Privilégios
CREATE TABLE public.rpg_privileges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.rpg_privilege_categories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  effect TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rpg_privileges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read privileges" ON public.rpg_privileges FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert privileges" ON public.rpg_privileges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update privileges" ON public.rpg_privileges FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete privileges" ON public.rpg_privileges FOR DELETE USING (auth.uid() IS NOT NULL);

-- Desafios/Vícios (vinculados a privilégios)
CREATE TABLE public.rpg_challenges (
  id TEXT PRIMARY KEY,
  privilege_id TEXT NOT NULL REFERENCES public.rpg_privileges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  effect TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rpg_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read challenges" ON public.rpg_challenges FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert challenges" ON public.rpg_challenges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update challenges" ON public.rpg_challenges FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete challenges" ON public.rpg_challenges FOR DELETE USING (auth.uid() IS NOT NULL);

-- Triggers para updated_at
CREATE TRIGGER update_rpg_privilege_categories_updated_at BEFORE UPDATE ON public.rpg_privilege_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rpg_privileges_updated_at BEFORE UPDATE ON public.rpg_privileges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rpg_challenges_updated_at BEFORE UPDATE ON public.rpg_challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais das categorias
INSERT INTO public.rpg_privilege_categories (id, name, icon, color, sort_order) VALUES
  ('recursos', 'Recursos e Status', 'Coins', '#f39c12', 1),
  ('educacao', 'Educação e Cultura', 'GraduationCap', '#3498db', 2),
  ('genetica', 'Genética e Saúde', 'Dna', '#27ae60', 3),
  ('conexoes', 'Conexões e Influência', 'Users', '#9b59b6', 4),
  ('talento', 'Talentos Naturais', 'Sparkles', '#e74c3c', 5);

-- Inserir privilégios
INSERT INTO public.rpg_privileges (id, name, category_id, description, effect, sort_order) VALUES
  ('nascido_elite', 'Nascido na Elite', 'recursos', 'Nasceu em família com grande riqueza e conexões sociais.', 'Começa com equipamento de qualidade superior e 3x mais créditos iniciais.', 1),
  ('conexoes_politicas', 'Conexões Políticas', 'recursos', 'Família com influência política. Portas se abrem para você.', '+1 em Diplomacia quando tratando com autoridades.', 2),
  ('educacao_elite', 'Educação de Elite', 'educacao', 'Formação nas melhores instituições.', '+1 em Conhecimento. Bônus em perícias científicas.', 1),
  ('poliglota', 'Poliglota Natural', 'educacao', 'Facilidade extraordinária com idiomas.', '+2 em Línguas. Aprende idiomas em metade do tempo.', 2),
  ('treinamento_marcial', 'Treinamento Marcial', 'educacao', 'Treinamento intensivo em artes marciais desde jovem.', '+1 em Combate Corpo a Corpo. Conhece técnicas avançadas.', 3),
  ('resistencia_sobrehumana', 'Resistência Sobrehumana', 'genetica', 'Sistema imunológico excepcional e resistência física.', '+1 em Corpo. Vantagem contra doenças e venenos.', 1),
  ('beleza_natural', 'Beleza Natural', 'genetica', 'Traços físicos excepcionalmente atraentes.', '+1 em Persuasão e Performance.', 2),
  ('reflexos_excepcionais', 'Reflexos Excepcionais', 'genetica', 'Tempo de reação muito acima da média.', '+1 em Reflexos. Vantagem em iniciativa.', 3),
  ('mentor_poderoso', 'Mentor Poderoso', 'conexoes', 'Um indivíduo influente guia sua carreira.', 'Pode pedir conselhos e favores a uma figura de autoridade.', 1),
  ('rede_contatos', 'Rede de Contatos', 'conexoes', 'Conhece pessoas em todos os lugares.', '+1 em Investigação para encontrar informações ou pessoas.', 2),
  ('memoria_eidetica', 'Memória Eidética', 'talento', 'Lembra de tudo que vê ou ouve.', '+2 em Pesquisa. Nunca esquece informações importantes.', 1),
  ('sexto_sentido', 'Sexto Sentido', 'talento', 'Intuição aguçada sobre perigos.', '+1 em Instinto. Sente emboscadas e traições.', 2);

-- Inserir desafios/vícios
INSERT INTO public.rpg_challenges (id, privilege_id, name, description, effect, sort_order) VALUES
  ('pressao_perfeicao', 'nascido_elite', 'Pressão da Perfeição', 'A família espera excelência absoluta em tudo.', 'Testes de Autocontrole em situações de falha pública. -1 em Superação quando observado.', 1),
  ('arrogancia_nobreza', 'nascido_elite', 'Arrogância da Nobreza', 'Comportamento elitista dificulta conexões com pessoas comuns.', '+1 dificuldade em testes sociais com classes inferiores. Visto como esnobe.', 2),
  ('obrigacoes_familiares', 'conexoes_politicas', 'Obrigações Familiares', 'Deve favores à família e pode ser convocado.', 'Periodicamente deve cumprir missões ou favores para a família.', 1),
  ('inimigos_herdados', 'conexoes_politicas', 'Inimigos Herdados', 'Rivais políticos da família te perseguem.', 'Tem inimigos poderosos que não escolheu ter.', 2),
  ('distante_realidade', 'educacao_elite', 'Distante da Realidade', 'Educação teórica não preparou para a vida real.', '-1 em Sobrevivência e situações práticas de rua.', 1),
  ('arrogancia_intelectual', 'educacao_elite', 'Arrogância Intelectual', 'Menospreza quem considera menos instruído.', '-1 em Empatia com pessoas "menos educadas".', 2),
  ('sotaque_marcante', 'poliglota', 'Sotaque Marcante', 'Seu modo de falar te identifica facilmente.', '-1 em Furtividade social. Facilmente rastreável.', 1),
  ('mistura_idiomas', 'poliglota', 'Mistura Idiomas', 'Sob stress, confunde palavras de diferentes línguas.', 'Sob stress, teste Autocontrole ou falha em comunicação.', 2),
  ('disciplina_rigida', 'treinamento_marcial', 'Disciplina Rígida', 'Treinamento brutal deixou marcas psicológicas.', 'Dificuldade em relaxar ou se divertir. -1 em situações sociais informais.', 1),
  ('sede_combate', 'treinamento_marcial', 'Sede de Combate', 'Instinto de lutar difícil de controlar.', 'Teste Autocontrole para evitar confrontos físicos.', 2),
  ('descuidado_saude', 'resistencia_sobrehumana', 'Descuidado com a Saúde', 'Nunca ficou doente, ignora sinais de alerta.', '-1 para perceber ferimentos próprios. Pode não notar envenenamento.', 1),
  ('dores_cronicas', 'resistencia_sobrehumana', 'Dores Crônicas', 'Resistência veio com custo de dores constantes.', '-1 em testes de Concentração. Dificuldade para dormir.', 2),
  ('vaidade', 'beleza_natural', 'Vaidade', 'Extremamente preocupado com aparência.', '-1 em Bravura quando aparência está ameaçada.', 1),
  ('objetificado', 'beleza_natural', 'Objetificado', 'Pessoas não levam você a sério.', '-1 em Intimidação. Subestimado frequentemente.', 2),
  ('hiperativo', 'reflexos_excepcionais', 'Hiperativo', 'Dificuldade em ficar parado ou esperar.', '-1 em testes que exigem paciência ou espera prolongada.', 1),
  ('reacao_exagerada', 'reflexos_excepcionais', 'Reação Exagerada', 'Responde a ameaças antes de pensar.', 'Teste Autocontrole para não reagir impulsivamente a sustos.', 2),
  ('sombra_mentor', 'mentor_poderoso', 'Sombra do Mentor', 'Sempre comparado ao mentor, nunca bom o suficiente.', '-1 em Autocontrole contra críticas. Complexo de inferioridade.', 1),
  ('divida_mentor', 'mentor_poderoso', 'Dívida com o Mentor', 'O mentor espera retorno do investimento.', 'Deve obediência e favores ao mentor.', 2),
  ('favores_devidos', 'rede_contatos', 'Favores Devidos', 'Sua rede é baseada em troca de favores.', 'Frequentemente cobrado por favores passados.', 1),
  ('informacao_comprometedora', 'rede_contatos', 'Informação Comprometedora', 'Seus contatos sabem demais sobre você.', 'Vulnerável a chantagem. Segredos podem vazar.', 2),
  ('traumas_vividos', 'memoria_eidetica', 'Traumas Vívidos', 'Memórias ruins são tão vívidas quanto as boas.', 'Flashbacks de experiências traumáticas. -1 Fortitude.', 1),
  ('sobrecarga_informacao', 'memoria_eidetica', 'Sobrecarga de Informação', 'Às vezes sabe demais para o próprio bem.', '+1 dificuldade para filtrar informação irrelevante.', 2),
  ('paranoico', 'sexto_sentido', 'Paranóico', 'Desconfia de todos, mesmo aliados.', '-1 em Empatia e Diplomacia. Dificuldade em confiar.', 1),
  ('pressentimentos', 'sexto_sentido', 'Pressentimentos Perturbadores', 'Visões e sensações que nem sempre fazem sentido.', 'Sofre de insônia e ansiedade. -1 em descanso.', 2);