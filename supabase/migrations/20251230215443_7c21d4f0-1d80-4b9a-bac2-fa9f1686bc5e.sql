-- =====================================================
-- ATUALIZAR POLÍTICAS RLS PARA TABELAS DE DADOS DO USUÁRIO
-- =====================================================

-- REGENTS: Dados do usuário
DROP POLICY IF EXISTS "Anyone can view regents" ON public.regents;
DROP POLICY IF EXISTS "Anyone can insert regents" ON public.regents;
DROP POLICY IF EXISTS "Anyone can update regents" ON public.regents;
DROP POLICY IF EXISTS "Anyone can delete regents" ON public.regents;

CREATE POLICY "Users can view own regents" ON public.regents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own regents" ON public.regents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own regents" ON public.regents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own regents" ON public.regents FOR DELETE USING (auth.uid() = user_id);

-- CHARACTER_CARDS: Dados do usuário
DROP POLICY IF EXISTS "Anyone can view character cards" ON public.character_cards;
DROP POLICY IF EXISTS "Anyone can insert character cards" ON public.character_cards;
DROP POLICY IF EXISTS "Anyone can update character cards" ON public.character_cards;
DROP POLICY IF EXISTS "Anyone can delete character cards" ON public.character_cards;

CREATE POLICY "Users can view own character cards" ON public.character_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own character cards" ON public.character_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own character cards" ON public.character_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own character cards" ON public.character_cards FOR DELETE USING (auth.uid() = user_id);

-- FIELD_COMMANDERS: Dados do usuário
DROP POLICY IF EXISTS "Anyone can view commanders" ON public.field_commanders;
DROP POLICY IF EXISTS "Anyone can insert commanders" ON public.field_commanders;
DROP POLICY IF EXISTS "Anyone can update commanders" ON public.field_commanders;
DROP POLICY IF EXISTS "Anyone can delete commanders" ON public.field_commanders;

CREATE POLICY "Users can view own commanders" ON public.field_commanders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own commanders" ON public.field_commanders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own commanders" ON public.field_commanders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own commanders" ON public.field_commanders FOR DELETE USING (auth.uid() = user_id);

-- UNIT_INSTANCES: Dados do usuário
DROP POLICY IF EXISTS "Anyone can view unit instances" ON public.unit_instances;
DROP POLICY IF EXISTS "Anyone can insert unit instances" ON public.unit_instances;
DROP POLICY IF EXISTS "Anyone can update unit instances" ON public.unit_instances;
DROP POLICY IF EXISTS "Anyone can delete unit instances" ON public.unit_instances;

CREATE POLICY "Users can view own unit instances" ON public.unit_instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own unit instances" ON public.unit_instances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own unit instances" ON public.unit_instances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own unit instances" ON public.unit_instances FOR DELETE USING (auth.uid() = user_id);

-- UNIT_TEMPLATES: Dados do usuário
DROP POLICY IF EXISTS "Anyone can view unit templates" ON public.unit_templates;
DROP POLICY IF EXISTS "Anyone can insert unit templates" ON public.unit_templates;
DROP POLICY IF EXISTS "Anyone can update unit templates" ON public.unit_templates;
DROP POLICY IF EXISTS "Anyone can delete unit templates" ON public.unit_templates;

CREATE POLICY "Users can view own unit templates" ON public.unit_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own unit templates" ON public.unit_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own unit templates" ON public.unit_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own unit templates" ON public.unit_templates FOR DELETE USING (auth.uid() = user_id);

-- REALMS: Dados do usuário
DROP POLICY IF EXISTS "Anyone can view realms" ON public.realms;
DROP POLICY IF EXISTS "Anyone can insert realms" ON public.realms;
DROP POLICY IF EXISTS "Anyone can update realms" ON public.realms;
DROP POLICY IF EXISTS "Anyone can delete realms" ON public.realms;

CREATE POLICY "Users can view own realms" ON public.realms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own realms" ON public.realms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own realms" ON public.realms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own realms" ON public.realms FOR DELETE USING (auth.uid() = user_id);

-- PROVINCES: Dados do usuário
DROP POLICY IF EXISTS "Anyone can view provinces" ON public.provinces;
DROP POLICY IF EXISTS "Anyone can insert provinces" ON public.provinces;
DROP POLICY IF EXISTS "Anyone can update provinces" ON public.provinces;
DROP POLICY IF EXISTS "Anyone can delete provinces" ON public.provinces;

CREATE POLICY "Users can view own provinces" ON public.provinces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own provinces" ON public.provinces FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own provinces" ON public.provinces FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own provinces" ON public.provinces FOR DELETE USING (auth.uid() = user_id);

-- HOLDINGS: Dados do usuário
DROP POLICY IF EXISTS "Anyone can view holdings" ON public.holdings;
DROP POLICY IF EXISTS "Anyone can insert holdings" ON public.holdings;
DROP POLICY IF EXISTS "Anyone can update holdings" ON public.holdings;
DROP POLICY IF EXISTS "Anyone can delete holdings" ON public.holdings;

CREATE POLICY "Users can view own holdings" ON public.holdings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own holdings" ON public.holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own holdings" ON public.holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own holdings" ON public.holdings FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABELAS DE REFERÊNCIA: Leitura para todos autenticados
-- =====================================================

-- TERRAIN_TYPES: Referência
DROP POLICY IF EXISTS "Anyone can view terrain types" ON public.terrain_types;
DROP POLICY IF EXISTS "Anyone can insert terrain types" ON public.terrain_types;
DROP POLICY IF EXISTS "Anyone can update terrain types" ON public.terrain_types;
DROP POLICY IF EXISTS "Anyone can delete terrain types" ON public.terrain_types;

CREATE POLICY "Authenticated users can view terrain types" ON public.terrain_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert terrain types" ON public.terrain_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update terrain types" ON public.terrain_types FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete terrain types" ON public.terrain_types FOR DELETE TO authenticated USING (true);

-- TACTICAL_CARDS: Referência
DROP POLICY IF EXISTS "Anyone can view tactical cards" ON public.tactical_cards;
DROP POLICY IF EXISTS "Anyone can insert tactical cards" ON public.tactical_cards;
DROP POLICY IF EXISTS "Anyone can update tactical cards" ON public.tactical_cards;
DROP POLICY IF EXISTS "Anyone can delete tactical cards" ON public.tactical_cards;

CREATE POLICY "Authenticated users can view tactical cards" ON public.tactical_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert tactical cards" ON public.tactical_cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tactical cards" ON public.tactical_cards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete tactical cards" ON public.tactical_cards FOR DELETE TO authenticated USING (true);

-- MASS_COMBAT_TACTICAL_CARDS: Referência
DROP POLICY IF EXISTS "Anyone can view mass combat tactical cards" ON public.mass_combat_tactical_cards;
DROP POLICY IF EXISTS "Anyone can insert mass combat tactical cards" ON public.mass_combat_tactical_cards;
DROP POLICY IF EXISTS "Anyone can update mass combat tactical cards" ON public.mass_combat_tactical_cards;
DROP POLICY IF EXISTS "Anyone can delete mass combat tactical cards" ON public.mass_combat_tactical_cards;

CREATE POLICY "Authenticated users can view mass combat tactical cards" ON public.mass_combat_tactical_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert mass combat tactical cards" ON public.mass_combat_tactical_cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update mass combat tactical cards" ON public.mass_combat_tactical_cards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete mass combat tactical cards" ON public.mass_combat_tactical_cards FOR DELETE TO authenticated USING (true);

-- MASS_COMBAT_CULTURES: Referência
DROP POLICY IF EXISTS "Anyone can view cultures" ON public.mass_combat_cultures;
DROP POLICY IF EXISTS "Anyone can insert cultures" ON public.mass_combat_cultures;
DROP POLICY IF EXISTS "Anyone can update cultures" ON public.mass_combat_cultures;
DROP POLICY IF EXISTS "Anyone can delete cultures" ON public.mass_combat_cultures;

CREATE POLICY "Authenticated users can view cultures" ON public.mass_combat_cultures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cultures" ON public.mass_combat_cultures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cultures" ON public.mass_combat_cultures FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cultures" ON public.mass_combat_cultures FOR DELETE TO authenticated USING (true);

-- MASS_COMBAT_PRIMARY_TERRAINS: Referência
DROP POLICY IF EXISTS "Anyone can view primary terrains" ON public.mass_combat_primary_terrains;
DROP POLICY IF EXISTS "Anyone can insert primary terrains" ON public.mass_combat_primary_terrains;
DROP POLICY IF EXISTS "Anyone can update primary terrains" ON public.mass_combat_primary_terrains;
DROP POLICY IF EXISTS "Anyone can delete primary terrains" ON public.mass_combat_primary_terrains;

CREATE POLICY "Authenticated users can view primary terrains" ON public.mass_combat_primary_terrains FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert primary terrains" ON public.mass_combat_primary_terrains FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update primary terrains" ON public.mass_combat_primary_terrains FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete primary terrains" ON public.mass_combat_primary_terrains FOR DELETE TO authenticated USING (true);

-- MASS_COMBAT_SECONDARY_TERRAINS: Referência
DROP POLICY IF EXISTS "Anyone can view secondary terrains" ON public.mass_combat_secondary_terrains;
DROP POLICY IF EXISTS "Anyone can insert secondary terrains" ON public.mass_combat_secondary_terrains;
DROP POLICY IF EXISTS "Anyone can update secondary terrains" ON public.mass_combat_secondary_terrains;
DROP POLICY IF EXISTS "Anyone can delete secondary terrains" ON public.mass_combat_secondary_terrains;

CREATE POLICY "Authenticated users can view secondary terrains" ON public.mass_combat_secondary_terrains FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert secondary terrains" ON public.mass_combat_secondary_terrains FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update secondary terrains" ON public.mass_combat_secondary_terrains FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete secondary terrains" ON public.mass_combat_secondary_terrains FOR DELETE TO authenticated USING (true);

-- MASS_COMBAT_SEASONS: Referência
DROP POLICY IF EXISTS "Anyone can view seasons" ON public.mass_combat_seasons;
DROP POLICY IF EXISTS "Anyone can insert seasons" ON public.mass_combat_seasons;
DROP POLICY IF EXISTS "Anyone can update seasons" ON public.mass_combat_seasons;
DROP POLICY IF EXISTS "Anyone can delete seasons" ON public.mass_combat_seasons;

CREATE POLICY "Authenticated users can view seasons" ON public.mass_combat_seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert seasons" ON public.mass_combat_seasons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update seasons" ON public.mass_combat_seasons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete seasons" ON public.mass_combat_seasons FOR DELETE TO authenticated USING (true);

-- MASS_COMBAT_TERRAIN_COMPATIBILITY: Referência
DROP POLICY IF EXISTS "Anyone can view terrain compatibility" ON public.mass_combat_terrain_compatibility;
DROP POLICY IF EXISTS "Anyone can insert terrain compatibility" ON public.mass_combat_terrain_compatibility;
DROP POLICY IF EXISTS "Anyone can delete terrain compatibility" ON public.mass_combat_terrain_compatibility;

CREATE POLICY "Authenticated users can view terrain compatibility" ON public.mass_combat_terrain_compatibility FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert terrain compatibility" ON public.mass_combat_terrain_compatibility FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete terrain compatibility" ON public.mass_combat_terrain_compatibility FOR DELETE TO authenticated USING (true);

-- MASS_COMBAT_COMMANDER_TEMPLATES: Referência
DROP POLICY IF EXISTS "Anyone can view commander templates" ON public.mass_combat_commander_templates;
DROP POLICY IF EXISTS "Anyone can insert commander templates" ON public.mass_combat_commander_templates;
DROP POLICY IF EXISTS "Anyone can update commander templates" ON public.mass_combat_commander_templates;
DROP POLICY IF EXISTS "Anyone can delete commander templates" ON public.mass_combat_commander_templates;

CREATE POLICY "Authenticated users can view commander templates" ON public.mass_combat_commander_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert commander templates" ON public.mass_combat_commander_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update commander templates" ON public.mass_combat_commander_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete commander templates" ON public.mass_combat_commander_templates FOR DELETE TO authenticated USING (true);

-- TRAVEL_SPEEDS: Referência
DROP POLICY IF EXISTS "Anyone can view travel speeds" ON public.travel_speeds;
DROP POLICY IF EXISTS "Anyone can insert travel speeds" ON public.travel_speeds;
DROP POLICY IF EXISTS "Anyone can update travel speeds" ON public.travel_speeds;
DROP POLICY IF EXISTS "Anyone can delete travel speeds" ON public.travel_speeds;

CREATE POLICY "Authenticated users can view travel speeds" ON public.travel_speeds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert travel speeds" ON public.travel_speeds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update travel speeds" ON public.travel_speeds FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete travel speeds" ON public.travel_speeds FOR DELETE TO authenticated USING (true);

-- PROVINCE_DISTANCES: Referência
DROP POLICY IF EXISTS "Anyone can view distances" ON public.province_distances;
DROP POLICY IF EXISTS "Anyone can insert distances" ON public.province_distances;
DROP POLICY IF EXISTS "Anyone can update distances" ON public.province_distances;
DROP POLICY IF EXISTS "Anyone can delete distances" ON public.province_distances;

CREATE POLICY "Authenticated users can view distances" ON public.province_distances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert distances" ON public.province_distances FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update distances" ON public.province_distances FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete distances" ON public.province_distances FOR DELETE TO authenticated USING (true);

-- CHARACTER_ABILITIES: Referência
DROP POLICY IF EXISTS "Anyone can view abilities" ON public.character_abilities;
DROP POLICY IF EXISTS "Anyone can insert abilities" ON public.character_abilities;
DROP POLICY IF EXISTS "Anyone can update abilities" ON public.character_abilities;
DROP POLICY IF EXISTS "Anyone can delete abilities" ON public.character_abilities;

CREATE POLICY "Authenticated users can view abilities" ON public.character_abilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert abilities" ON public.character_abilities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update abilities" ON public.character_abilities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete abilities" ON public.character_abilities FOR DELETE TO authenticated USING (true);

-- CHARACTER_SYSTEM_CONFIG: Referência
DROP POLICY IF EXISTS "Anyone can view config" ON public.character_system_config;
DROP POLICY IF EXISTS "Anyone can update config" ON public.character_system_config;

CREATE POLICY "Authenticated users can view config" ON public.character_system_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update config" ON public.character_system_config FOR UPDATE TO authenticated USING (true);

-- CARD_BACKGROUND_IMAGES: Referência
DROP POLICY IF EXISTS "Anyone can view card background images" ON public.card_background_images;
DROP POLICY IF EXISTS "Anyone can insert card background images" ON public.card_background_images;
DROP POLICY IF EXISTS "Anyone can delete card background images" ON public.card_background_images;

CREATE POLICY "Authenticated users can view card background images" ON public.card_background_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert card background images" ON public.card_background_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete card background images" ON public.card_background_images FOR DELETE TO authenticated USING (true);

-- HEXAGON_BACKGROUND_IMAGES: Referência
DROP POLICY IF EXISTS "Anyone can view hexagon background images" ON public.hexagon_background_images;
DROP POLICY IF EXISTS "Anyone can insert hexagon background images" ON public.hexagon_background_images;
DROP POLICY IF EXISTS "Anyone can update hexagon background images" ON public.hexagon_background_images;
DROP POLICY IF EXISTS "Anyone can delete hexagon background images" ON public.hexagon_background_images;

CREATE POLICY "Authenticated users can view hexagon background images" ON public.hexagon_background_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert hexagon background images" ON public.hexagon_background_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update hexagon background images" ON public.hexagon_background_images FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete hexagon background images" ON public.hexagon_background_images FOR DELETE TO authenticated USING (true);