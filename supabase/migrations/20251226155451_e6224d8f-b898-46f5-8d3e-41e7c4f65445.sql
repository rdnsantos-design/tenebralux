-- Limpar dados antigos
DELETE FROM mass_combat_terrain_compatibility;
DELETE FROM mass_combat_secondary_terrains;
DELETE FROM mass_combat_primary_terrains;

-- Inserir terrenos primários (7 terrenos)
INSERT INTO mass_combat_primary_terrains (name, description, attack_mod, defense_mod, mobility_mod, visibility, default_climate, allowed_climates)
VALUES
  ('Campo Aberto', 'Terreno mais neutro. Ideal para cavalaria. Permite quase todos os climas.', 0, 0, 1, 'normal', 'Céu Aberto', ARRAY['Céu Aberto', 'Chuva', 'Calor', 'Névoa', 'Ventos Fortes']),
  ('Montanhoso', 'Excelente para defensores. Penaliza ataques diretos. Difícil para cerco.', -1, 2, -2, 'normal', 'Céu Aberto', ARRAY['Céu Aberto', 'Nevasca', 'Geada', 'Ventos Fortes']),
  ('Alagado', 'Unidades móveis penalizadas. Ideal para infantaria leve e emboscadas.', -1, 1, -2, 'normal', 'Céu Aberto', ARRAY['Céu Aberto', 'Chuva', 'Névoa']),
  ('Urbano', 'Ideal para defensores e arqueiros. Cerco é comum. A mobilidade é restrita.', 1, 2, -1, 'normal', 'Céu Aberto', ARRAY['Céu Aberto', 'Chuva', 'Névoa', 'Calor']),
  ('Floresta', 'Favorece táticas de guerrilha e tropas leves. Penaliza tropas pesadas.', 1, 1, -1, 'baixa', 'Céu Aberto', ARRAY['Céu Aberto', 'Chuva', 'Névoa', 'Nevasca']),
  ('Extremo Frio', 'Penaliza unidades não adaptadas. Cultura Rjurik ignora penalidade de clima.', -1, 0, -2, 'normal', 'Nevasca', ARRAY['Nevasca', 'Geada', 'Ventos Fortes']),
  ('Extremo Quente', 'Penaliza resistência. Cultura Khinasi ignora penalidade de clima.', -1, 0, -1, 'normal', 'Calor', ARRAY['Calor', 'Tempestade de Areia', 'Ventos Fortes']);

-- Inserir terrenos secundários (15 terrenos)
INSERT INTO mass_combat_secondary_terrains (name, description, effect_description, attack_mod, defense_mod, mobility_mod, strategy_mod, is_universal, special_effects)
VALUES
  ('Elevação', 'Exército se posiciona em colina, fortificação elevada ou torre.', 'Bônus defensivo por posição elevada', 0, 1, 0, 0, true, NULL),
  ('Ocultação', 'Exército inicia emboscado; bônus se aplica apenas no 1º ataque.', 'Bônus de emboscada no primeiro turno', 1, 0, 0, 0, true, 'Bônus apenas no 1º turno'),
  ('Ponte', 'Penaliza manobra e favorece defesa.', 'Difícil travessia, excelente defesa', 1, 2, -2, 0, false, 'Bônus de ataque se atacante cruzando'),
  ('Ravina', 'Simula vantagem ao flanquear tropas presas em desnível.', 'Vantagem contra tropas em desnível', 1, 1, -1, 0, false, NULL),
  ('Passagem Estreita', 'Ideal para retardar avanços e concentrar defesa.', 'Gargalo defensivo', 0, 2, -1, 0, false, NULL),
  ('Torre', 'Representa presença de estrutura elevada; artilharia e arqueiros favorecidos.', 'Estrutura defensiva elevada', 0, 2, -2, 0, false, NULL),
  ('Acampamento', 'Exército não preparado, mas pronto para manobra.', 'Mobilidade alta, defesa baixa', 0, -1, 1, 0, false, NULL),
  ('Lodaçal', 'Penaliza ataques e mobilidade, mas reduz exposição.', 'Terreno difícil', -1, 1, -2, 0, false, NULL),
  ('Caverna', 'Exército protegido mas com dificuldade de se mover e atacar.', 'Proteção natural', -1, 1, -2, 0, false, NULL),
  ('Ruínas', 'Favorece arqueiros e infantaria leve, reduz mobilidade geral.', 'Cobertura parcial', 1, 1, -1, 0, false, NULL),
  ('Areia Fofa/Duna', 'Penaliza movimentação; culturas adaptadas ignoram penalidade.', 'Terreno instável', -1, 0, -2, 0, false, 'Khinasi ignora penalidade'),
  ('Nevasca', 'Penaliza visibilidade e movimento, mas confere defesa.', 'Condição climática severa', -1, 1, -2, 0, false, 'Rjurik ignora penalidade'),
  ('Geada', 'Penalidade leve; efeito climático intermediário.', 'Frio moderado', -1, 0, -1, 0, false, NULL),
  ('Vento Forte', 'Penaliza arqueria; pouco efeito sobre infantaria.', 'Vento intenso', -1, 0, 0, 0, false, NULL),
  ('Miragem', 'Engana movimentação inimiga; reduz defesa.', 'Ilusão do calor', 0, -1, 1, 0, false, NULL);

-- Criar tabela de estações
CREATE TABLE IF NOT EXISTS mass_combat_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  common_climates TEXT[] NOT NULL DEFAULT '{}',
  rare_climates TEXT[] NOT NULL DEFAULT '{}',
  blocked_climates TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de climas com níveis progressivos
CREATE TABLE IF NOT EXISTS mass_combat_climates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  -- Nível 1 (Leve)
  level1_attack_mod INTEGER NOT NULL DEFAULT 0,
  level1_defense_mod INTEGER NOT NULL DEFAULT 0,
  level1_mobility_mod INTEGER NOT NULL DEFAULT 0,
  level1_strategy_mod INTEGER NOT NULL DEFAULT 0,
  level1_description TEXT,
  -- Nível 2 (Moderado)
  level2_attack_mod INTEGER NOT NULL DEFAULT 0,
  level2_defense_mod INTEGER NOT NULL DEFAULT 0,
  level2_mobility_mod INTEGER NOT NULL DEFAULT 0,
  level2_strategy_mod INTEGER NOT NULL DEFAULT 0,
  level2_description TEXT,
  -- Nível 3 (Severo)
  level3_attack_mod INTEGER NOT NULL DEFAULT 0,
  level3_defense_mod INTEGER NOT NULL DEFAULT 0,
  level3_mobility_mod INTEGER NOT NULL DEFAULT 0,
  level3_strategy_mod INTEGER NOT NULL DEFAULT 0,
  level3_description TEXT,
  special_effects TEXT,
  has_all_levels BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para estações
ALTER TABLE mass_combat_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons" ON mass_combat_seasons FOR SELECT USING (true);
CREATE POLICY "Anyone can insert seasons" ON mass_combat_seasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update seasons" ON mass_combat_seasons FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete seasons" ON mass_combat_seasons FOR DELETE USING (true);

-- RLS para climas
ALTER TABLE mass_combat_climates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view climates" ON mass_combat_climates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert climates" ON mass_combat_climates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update climates" ON mass_combat_climates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete climates" ON mass_combat_climates FOR DELETE USING (true);

-- Inserir estações
INSERT INTO mass_combat_seasons (name, description, common_climates, rare_climates, blocked_climates)
VALUES
  ('Verão', 'Estação quente com dias longos', ARRAY['Céu Aberto', 'Calor', 'Calor Escaldante', 'Chuva Leve'], ARRAY['Tempestade Elétrica', 'Tempestade de Areia'], ARRAY['Nevasca', 'Geada']),
  ('Inverno', 'Estação fria com dias curtos', ARRAY['Céu Aberto', 'Neve', 'Nevasca', 'Geada'], ARRAY['Névoa', 'Ventos Fortes'], ARRAY['Calor', 'Tempestade de Areia']),
  ('Primavera', 'Estação de transição com clima variável', ARRAY['Céu Aberto', 'Chuva', 'Névoa', 'Trovoada Leve'], ARRAY['Nevasca', 'Calor Escaldante'], ARRAY['Tempestade de Areia']),
  ('Outono', 'Estação de transição com temperaturas amenas', ARRAY['Céu Aberto', 'Névoa', 'Chuva', 'Geada Leve'], ARRAY['Trovoada', 'Nevasca'], ARRAY['Calor Escaldante']);

-- Inserir climas com níveis progressivos
INSERT INTO mass_combat_climates (name, description, 
  level1_attack_mod, level1_defense_mod, level1_mobility_mod, level1_strategy_mod, level1_description,
  level2_attack_mod, level2_defense_mod, level2_mobility_mod, level2_strategy_mod, level2_description,
  level3_attack_mod, level3_defense_mod, level3_mobility_mod, level3_strategy_mod, level3_description,
  special_effects, has_all_levels)
VALUES
  ('Céu Aberto', 'Condições ideais sem interferência climática', 0, 0, 0, 0, 'Nenhum efeito', 0, 0, 0, 0, NULL, 0, 0, 0, 0, NULL, NULL, false),
  ('Chuva', 'Precipitação que afeta visibilidade e movimento', 0, 0, 0, 0, '–1 ataque à distância', 0, 0, -1, 0, '–1 ataque à distância, –1 mobilidade', 0, -1, -1, 0, '–2 ataque à distância, –1 defesa, –1 mobilidade', 'Penaliza ataques à distância', true),
  ('Nevasca / Neve', 'Tempestade de neve que reduz visibilidade e movimento', 0, 0, -1, 0, '–1 mobilidade', 0, 0, -1, 0, '–1 mobilidade, –1 iniciativa', -1, 0, -2, -1, '–2 mobilidade, –1 ataque, –1 estratégia', 'Penaliza mobilidade progressivamente', true),
  ('Calor / Escaldante', 'Temperaturas elevadas que afetam resistência', 0, 0, -1, 0, '–1 mobilidade (se defesa < ataque)', 0, 0, -1, 0, '–1 mobilidade, –1 iniciativa', -1, 0, -1, 0, '–1 mobilidade, –2 iniciativa, –1 ataque', 'Penaliza tropas pesadas', true),
  ('Tempestade de Areia', 'Vento carregado de areia que obscurece visão', 0, 0, 0, -1, '–1 estratégia', 0, 0, -1, -1, '–1 estratégia, –1 mobilidade', -1, -1, 0, -2, '–2 estratégia, –1 ataque, –1 defesa', 'Khinasi menos afetados', true),
  ('Névoa / Neblina', 'Baixa visibilidade por condensação', 0, 0, 0, -1, '–1 estratégia', 0, 0, 0, -1, '–1 estratégia, –1 ataque à distância', -1, 0, -1, -2, '–2 estratégia, –1 ataque, –1 mobilidade', 'Favorece emboscadas', true),
  ('Ventos Fortes', 'Rajadas intensas que afetam projéteis', 0, 0, 0, 0, '–1 ataque à distância', 0, 0, 0, 0, '–2 ataque à distância', 0, 0, -1, 0, '–2 ataque à distância, –1 mobilidade', 'Penaliza arqueiros', true),
  ('Geada Súbita', 'Formação rápida de gelo nas superfícies', 0, 0, -1, 0, '–1 mobilidade', 0, -1, -1, 0, '–1 mobilidade, –1 defesa', 0, -2, -2, 0, '–2 mobilidade, –2 defesa', 'Terreno escorregadio', true),
  ('Tempestade Elétrica', 'Trovoada com relâmpagos frequentes', 0, 0, 0, -1, '–1 estratégia (ruído), risco mágico', 0, -1, 0, -1, '–1 estratégia, –1 defesa', 0, 0, 0, -2, '–2 estratégia, risco de dano em rolagens mágicas', 'Interfere com magia', true),
  ('Chuva Ácida', 'Precipitação mágica corrosiva', 0, -1, 0, 0, '–1 defesa (unidades sem proteção mágica)', 0, -1, 0, 0, '–1 defesa, dano fixo a cada rodada', 0, -2, 0, 0, '–2 defesa, dano fixo e risco de quebrar cartas', 'Origem mágica', true);