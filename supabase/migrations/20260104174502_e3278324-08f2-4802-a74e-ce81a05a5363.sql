-- ═══════════════════════════════════════════════════════════════
-- TABELA: profiles (extensão do auth.users)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- TABELA: characters (personagens do Character Builder)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados básicos (para listagem rápida)
  name TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'akashic',
  faction_id TEXT,
  culture_id TEXT,
  
  -- Dados completos (JSON)
  data JSONB NOT NULL,
  
  -- Compartilhamento
  is_public BOOLEAN DEFAULT FALSE,
  share_code TEXT UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para busca
CREATE INDEX idx_characters_user_id ON public.characters(user_id);
CREATE INDEX idx_characters_theme ON public.characters(theme);
CREATE INDEX idx_characters_name ON public.characters(name);
CREATE INDEX idx_characters_share_code ON public.characters(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX idx_characters_public ON public.characters(is_public) WHERE is_public = TRUE;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Profiles são visíveis para todos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar próprio profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir próprio profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para characters
CREATE POLICY "Usuários podem ver próprios personagens"
  ON public.characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Personagens públicos são visíveis para todos"
  ON public.characters FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Personagens compartilhados são acessíveis via código"
  ON public.characters FOR SELECT
  USING (share_code IS NOT NULL);

CREATE POLICY "Usuários podem criar próprios personagens"
  ON public.characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar próprios personagens"
  ON public.characters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar próprios personagens"
  ON public.characters FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- FUNÇÕES ÚTEIS
-- ═══════════════════════════════════════════════════════════════

-- Gerar código de compartilhamento único
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Gerar código de 8 caracteres
    code := upper(substr(md5(random()::text), 1, 8));
    
    -- Verificar se já existe
    SELECT COUNT(*) INTO exists_count FROM public.characters WHERE share_code = code;
    
    IF exists_count = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();