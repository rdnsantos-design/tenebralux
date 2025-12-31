-- Drop existing restrictive RLS policies and create public ones

-- REGENTS
DROP POLICY IF EXISTS "Users can view own regents" ON public.regents;
DROP POLICY IF EXISTS "Users can insert own regents" ON public.regents;
DROP POLICY IF EXISTS "Users can update own regents" ON public.regents;
DROP POLICY IF EXISTS "Users can delete own regents" ON public.regents;

CREATE POLICY "Public can view regents" ON public.regents FOR SELECT USING (true);
CREATE POLICY "Public can insert regents" ON public.regents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update regents" ON public.regents FOR UPDATE USING (true);
CREATE POLICY "Public can delete regents" ON public.regents FOR DELETE USING (true);

-- REALMS
DROP POLICY IF EXISTS "Users can view own realms" ON public.realms;
DROP POLICY IF EXISTS "Users can insert own realms" ON public.realms;
DROP POLICY IF EXISTS "Users can update own realms" ON public.realms;
DROP POLICY IF EXISTS "Users can delete own realms" ON public.realms;

CREATE POLICY "Public can view realms" ON public.realms FOR SELECT USING (true);
CREATE POLICY "Public can insert realms" ON public.realms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update realms" ON public.realms FOR UPDATE USING (true);
CREATE POLICY "Public can delete realms" ON public.realms FOR DELETE USING (true);

-- PROVINCES
DROP POLICY IF EXISTS "Users can view own provinces" ON public.provinces;
DROP POLICY IF EXISTS "Users can insert own provinces" ON public.provinces;
DROP POLICY IF EXISTS "Users can update own provinces" ON public.provinces;
DROP POLICY IF EXISTS "Users can delete own provinces" ON public.provinces;

CREATE POLICY "Public can view provinces" ON public.provinces FOR SELECT USING (true);
CREATE POLICY "Public can insert provinces" ON public.provinces FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update provinces" ON public.provinces FOR UPDATE USING (true);
CREATE POLICY "Public can delete provinces" ON public.provinces FOR DELETE USING (true);

-- HOLDINGS
DROP POLICY IF EXISTS "Users can view own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can insert own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can update own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can delete own holdings" ON public.holdings;

CREATE POLICY "Public can view holdings" ON public.holdings FOR SELECT USING (true);
CREATE POLICY "Public can insert holdings" ON public.holdings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update holdings" ON public.holdings FOR UPDATE USING (true);
CREATE POLICY "Public can delete holdings" ON public.holdings FOR DELETE USING (true);

-- FIELD_COMMANDERS
DROP POLICY IF EXISTS "Users can view own commanders" ON public.field_commanders;
DROP POLICY IF EXISTS "Users can insert own commanders" ON public.field_commanders;
DROP POLICY IF EXISTS "Users can update own commanders" ON public.field_commanders;
DROP POLICY IF EXISTS "Users can delete own commanders" ON public.field_commanders;

CREATE POLICY "Public can view commanders" ON public.field_commanders FOR SELECT USING (true);
CREATE POLICY "Public can insert commanders" ON public.field_commanders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update commanders" ON public.field_commanders FOR UPDATE USING (true);
CREATE POLICY "Public can delete commanders" ON public.field_commanders FOR DELETE USING (true);

-- UNIT_INSTANCES
DROP POLICY IF EXISTS "Users can view own unit instances" ON public.unit_instances;
DROP POLICY IF EXISTS "Users can insert own unit instances" ON public.unit_instances;
DROP POLICY IF EXISTS "Users can update own unit instances" ON public.unit_instances;
DROP POLICY IF EXISTS "Users can delete own unit instances" ON public.unit_instances;

CREATE POLICY "Public can view unit instances" ON public.unit_instances FOR SELECT USING (true);
CREATE POLICY "Public can insert unit instances" ON public.unit_instances FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update unit instances" ON public.unit_instances FOR UPDATE USING (true);
CREATE POLICY "Public can delete unit instances" ON public.unit_instances FOR DELETE USING (true);

-- UNIT_TEMPLATES
DROP POLICY IF EXISTS "Users can view own unit templates" ON public.unit_templates;
DROP POLICY IF EXISTS "Users can insert own unit templates" ON public.unit_templates;
DROP POLICY IF EXISTS "Users can update own unit templates" ON public.unit_templates;
DROP POLICY IF EXISTS "Users can delete own unit templates" ON public.unit_templates;

CREATE POLICY "Public can view unit templates" ON public.unit_templates FOR SELECT USING (true);
CREATE POLICY "Public can insert unit templates" ON public.unit_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update unit templates" ON public.unit_templates FOR UPDATE USING (true);
CREATE POLICY "Public can delete unit templates" ON public.unit_templates FOR DELETE USING (true);

-- CHARACTER_CARDS
DROP POLICY IF EXISTS "Users can view own character cards" ON public.character_cards;
DROP POLICY IF EXISTS "Users can insert own character cards" ON public.character_cards;
DROP POLICY IF EXISTS "Users can update own character cards" ON public.character_cards;
DROP POLICY IF EXISTS "Users can delete own character cards" ON public.character_cards;

CREATE POLICY "Public can view character cards" ON public.character_cards FOR SELECT USING (true);
CREATE POLICY "Public can insert character cards" ON public.character_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update character cards" ON public.character_cards FOR UPDATE USING (true);
CREATE POLICY "Public can delete character cards" ON public.character_cards FOR DELETE USING (true);