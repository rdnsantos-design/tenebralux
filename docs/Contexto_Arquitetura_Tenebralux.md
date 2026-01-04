# 📖 TENEBRALUX - DOCUMENTO DE CONTEXTO E ARQUITETURA

## 1. VISÃO GERAL DO PROJETO

### 1.1 O que é o Tenebralux?

Tenebralux é uma plataforma de jogos de RPG e estratégia que suporta **2 temas** (cenários) e **4 modos de jogo** diferentes, todos interconectados.

### 1.2 Os Dois Temas

| Tema | Cenário | Estética |
|------|---------|----------|
| **Tenebra** (tenebralux) | Medieval fantasia | Reinos, magia, cavaleiros |
| **Akashic** (akashic) | Ficção científica | Impérios estelares, tecnologia |

O sistema de temas permite que **a mesma mecânica** funcione em ambos os cenários, apenas mudando os nomes e descrições. Exemplo:

| Conceito | Tenebra | Akashic |
|----------|---------|---------|
| Domínio | Reino | Sistema Estelar |
| Província | Província | Planeta |
| Regente | Regente | Chanceler |
| Magia | Arcanismo | Computação |
| Cavalaria | Cavalaria | Pilotos |
| Arqueiros | Arqueiros | Artilheiros |

### 1.3 Os Quatro Modos de Jogo

```
┌─────────────────────────────────────────────────────────────────┐
│                        TENEBRALUX                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  │   AVENTURA   │  │   BATALHA    │  │   CAMPANHA   │  │   DOMÍNIO    │
│  │    (RPG)     │  │    (Hex)     │  │   (Cards)    │  │    (4X)      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│  │ Personagens  │  │ Tabuleiro    │  │ Card Game    │  │ Estratégia   │
│  │ completos    │  │ hexagonal    │  │ de combate   │  │ em turnos    │
│  │              │  │              │  │ em massa     │  │              │
│  │ Atributos    │  │ Unidades     │  │ Exércitos    │  │ Reinos       │
│  │ Perícias     │  │ Comandantes  │  │ Generais     │  │ Províncias   │
│  │ Bênçãos      │  │ Terrenos     │  │ Cartas       │  │ Holdings     │
│  │ Virtudes     │  │ Táticas      │  │ Táticas      │  │ Regentes     │
│  │              │  │              │  │              │  │              │
│  │ Papel:       │  │ Papel:       │  │ Papel:       │  │ Papel:       │
│  │ HERÓI        │  │ COMANDANTE   │  │ GENERAL      │  │ REGENTE      │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. DESCRIÇÃO DOS MODOS DE JOGO

### 2.1 MODO AVENTURA (RPG)

**Objetivo:** Roleplay tradicional com personagens detalhados.

**Características:**
- Personagem completo com 8 atributos e 40 perícias
- Sistema de virtudes e vícios
- Bênçãos e desafios
- Combate individual (físico e social)
- Equipamento detalhado

**O personagem atua como:** HERÓI

**Usa:**
- Todos os atributos
- Todas as perícias
- Todos os stats derivados
- Cartas de manobra (tipo: combate, debate)

### 2.2 MODO BATALHA (Tabuleiro Hexagonal)

**Objetivo:** Combate tático com unidades em mapa hexagonal.

**Características:**
- Grid hexagonal com terrenos
- Unidades militares (infantaria, cavalaria, arqueiros, cerco)
- Comandantes liderando tropas
- Sistema de moral e routing
- Fases de movimento, tiro, contato

**O personagem atua como:** COMANDANTE

**Usa:**
- Estratégia (posicionamento, manobras)
- Comando (inspirar tropas, moral)
- Guarda (proteção pessoal)
- Escolta (guarda-costas)
- Cartas táticas (tipo: movimento, tiro, contato, moral, reação)

### 2.3 MODO CAMPANHA (Card Game de Combate em Massa)

**Objetivo:** Resolver batalhas de larga escala de forma rápida.

**Características:**
- Combate resolvido por cartas
- Exércitos representados por valores agregados
- Terreno e clima afetam o combate
- Culturas dão bônus diferentes

**O personagem atua como:** GENERAL

**Usa:**
- Estratégia
- Comando
- Cultura
- Cartas de campanha (tipo: ofensiva, defensiva, mobilidade, reação)

### 2.4 MODO DOMÍNIO (Estratégia 4X)

**Objetivo:** Gerenciar reinos/impérios em escala macro.

**Características:**
- Reinos com províncias
- Holdings (propriedades): Law, Temple, Guild, Source
- Ações de domínio: diplomacia, guerra, comércio, construção
- Pontos de regência como recurso
- Economia e exércitos

**O personagem atua como:** REGENTE

**Usa:**
- Administração (gestão de recursos)
- Política (intrigas, alianças)
- Tecnologia/Geomancia (desenvolvimento)
- Comando (guerras)
- Estratégia (campanhas militares)
- Cartas de domínio (tipo: política, militar, econômica)

---

## 3. SISTEMA DE PERSONAGENS

### 3.1 Personagem Completo (FullCharacter)

Usado no modo Aventura e como base para os outros modos.

```
┌─────────────────────────────────────────────────────────────────┐
│                      PERSONAGEM COMPLETO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  IDENTIFICAÇÃO                                                   │
│  ├── Nome                                                        │
│  ├── Tema (akashic | tenebralux)                                │
│  ├── Facção                                                      │
│  └── Cultura                                                     │
│                                                                  │
│  ATRIBUTOS (8) ─────────────────────────────────────────────────│
│  │                                                               │
│  │  SABEDORIA          CORAGEM           PERSEVERANÇA   HARMONIA│
│  │  ┌─────────┐       ┌─────────┐       ┌─────────┐    ┌───────┐│
│  │  │Conhecim.│       │ Corpo   │       │Determin.│    │Carisma││
│  │  │Raciocín.│       │Reflexos │       │Coordena.│    │Intuição│
│  │  └─────────┘       └─────────┘       └─────────┘    └───────┘│
│  │                                                               │
│  PERÍCIAS (40) ─ 5 por atributo ────────────────────────────────│
│  │                                                               │
│  │  Conhecimento: Ciências, Línguas, Economia, Diplomacia,      │
│  │                Militarismo                                    │
│  │  Raciocínio:   Engenharia, Pesquisa, Computação/Arcanismo,   │
│  │                Lógica, Investigação                           │
│  │  Corpo:        Resistência, Potência, Atletismo, Vigor,      │
│  │                Bravura                                        │
│  │  Reflexos:     Esquiva, Pilotagem/Condução, Luta, Prontidão, │
│  │                Tática                                         │
│  │  Determinação: Resiliência, Autocontrole, Sobrevivência,     │
│  │                Intimidação, Superação                         │
│  │  Coordenação:  Tiro/Arqueria, Lâminas, Destreza,             │
│  │                Artilharia/Cerco, Furtividade                  │
│  │  Carisma:      Persuasão, Enganação, Performance,            │
│  │                Intimidação, Liderança                         │
│  │  Intuição:     Percepção, Empatia, Instinto, Augúrio, Artes  │
│  │                                                               │
│  VIRTUDES (4) ──────────────────────────────────────────────────│
│  │  Sabedoria (0-3)                                              │
│  │  Coragem (0-3)                                                │
│  │  Perseverança (0-3)                                           │
│  │  Harmonia (0-3)                                               │
│  │                                                               │
│  BÊNÇÃOS E DESAFIOS ────────────────────────────────────────────│
│  │  Até 3 bênçãos, cada uma com 1 desafio obrigatório           │
│  │                                                               │
│  EQUIPAMENTO ───────────────────────────────────────────────────│
│  │  Armas, Armaduras, Itens                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Personagem Simplificado (Commander/CharacterCard)

Usado nos modos Batalha, Campanha e Domínio quando não se quer criar um personagem completo.

```
┌─────────────────────────────────────────────────────────────────┐
│                   PERSONAGEM SIMPLIFICADO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  IDENTIFICAÇÃO                                                   │
│  ├── Nome                                                        │
│  ├── Tema                                                        │
│  └── Cultura                                                     │
│                                                                  │
│  ATRIBUTOS DE REGÊNCIA (5) ─────────────────────────────────────│
│  │                                                               │
│  │  Comando ────────── Liderança militar                         │
│  │  Estratégia ─────── Planejamento tático                       │
│  │  Administração ──── Gestão de recursos                        │
│  │  Política ───────── Intrigas e alianças                       │
│  │  Tecnologia/Geomancia ── Desenvolvimento (por tema)           │
│  │                                                               │
│  CAMPOS OPCIONAIS (para batalha) ───────────────────────────────│
│  │  Escolta ────────── Guarda-costas pessoal                     │
│  │  Especialização ─── Infantaria, Cavalaria, etc.               │
│  │                                                               │
│  CUSTO EM PONTOS DE PODER ──────────────────────────────────────│
│  │  Regência × 2 + Escolta                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Conversão entre Tipos

```
┌─────────────────┐
│ PERSONAGEM      │
│ COMPLETO        │
│ (FullCharacter) │
└────────┬────────┘
         │
         │ calculateRegencyStats()
         │ calculateDerivedStats()
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │   Commander     │     │  CharacterCard  │                    │
│  │   (Batalha)     │     │   (Campanha)    │                    │
│  │                 │     │                 │                    │
│  │ strategy        │     │ comando         │                    │
│  │ command         │     │ estrategia      │                    │
│  │ guard           │     │ guarda          │                    │
│  │ escolta         │     │ specialties     │                    │
│  │                 │     │ abilities       │                    │
│  └─────────────────┘     └─────────────────┘                    │
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │     Regent      │                          │
│                    │    (Domínio)    │                          │
│                    │                 │                          │
│                    │ administracao   │                          │
│                    │ politica        │                          │
│                    │ tecnologia      │                          │
│                    │ regencyPoints   │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. STATS DERIVADOS E FÓRMULAS

### 4.1 Características Derivadas (Aventura)

| Stat | Fórmula | Uso |
|------|---------|-----|
| **Vitalidade** | Corpo×2 + Resistência | HP físico |
| **Evasão** | Reflexos×2 + Instinto | Evitar ataques |
| **Guarda** | Reflexos×2 + Esquiva + Armadura | Defesa ativa |
| **Reação** | Intuição + Reflexos + Prontidão | Iniciativa |
| **Movimento** | Corpo×2 + Atletismo | Velocidade |
| **Vontade** | Raciocínio×2 + Resiliência | HP social |
| **Convicção** | Lógica + Determinação | Defesa social |
| **Influência** | Carisma | Ataque social |
| **Tensão** | Raciocínio + Determinação | Limite de stress |
| **Fortitude** | Autocontrole | Resistência a stress |

### 4.2 Atributos de Regência (Batalha/Campanha/Domínio)

| Atributo | Fórmula | Uso Principal |
|----------|---------|---------------|
| **Comando** | Carisma + Pesquisa | Inspirar tropas |
| **Estratégia** | Raciocínio + Militarismo | Manobras táticas |
| **Administração** | Raciocínio + Economia | Gestão de domínio |
| **Política** | Raciocínio + Diplomacia | Intrigas |
| **Tecnologia** (Akashic) | Conhecimento + Engenharia | Desenvolvimento |
| **Geomancia** (Tenebra) | Conhecimento + Arcanismo | Magia territorial |

---

## 5. SISTEMA DE CARTAS

### 5.1 Estrutura Unificada

Todas as cartas usam a mesma estrutura base, diferenciadas por `gameMode`:

```typescript
interface GameCard {
  id: string;
  name: string;
  theme: 'akashic' | 'tenebralux';
  
  // Classificação
  gameMode: 'aventura' | 'batalha' | 'campanha' | 'dominio';
  cardType: string;  // Varia por modo
  
  // Requisitos
  requirements: {
    attribute?: string;
    skill?: string;
    command?: number;
    strategy?: number;
    // ...
  };
  
  // Efeitos
  bonuses: { ... };
  penalties: { ... };
  effects: { ... };
}
```

### 5.2 Tipos de Carta por Modo

| Modo | Tipos de Carta |
|------|----------------|
| **Aventura** | combate, debate |
| **Batalha** | movimento, tiro, contato, moral, reação |
| **Campanha** | ofensiva, defensiva, mobilidade, reação |
| **Domínio** | política, militar, econômica |

---

## 6. SISTEMA DE TERRENOS

### 6.1 Terrenos para Batalha (Hex)

Usados no tabuleiro hexagonal do modo Batalha.

```
┌─────────────────────────────────────────┐
│           TERRENO HEX                    │
├─────────────────────────────────────────┤
│ Tipo: Floresta, Montanha, Planície...   │
│ Modificadores de movimento              │
│ Modificadores de combate                │
│ Cobertura                               │
│ Imagem do hex                           │
└─────────────────────────────────────────┘
```

### 6.2 Terrenos para Campanha (Card Game)

Usados como cartas de terreno no modo Campanha.

```
┌─────────────────────────────────────────┐
│         TERRENO CAMPANHA                 │
├─────────────────────────────────────────┤
│ Tipo primário                           │
│ Tipos secundários compatíveis           │
│ Modificadores de ataque/defesa          │
│ Efeitos especiais                       │
│ Clima associado                         │
└─────────────────────────────────────────┘
```

---

## 7. ESTRUTURA ATUAL DO PROJETO

### 7.1 Arquivos Principais

```
src/
├── themes/                    # TEMA SYSTEM ✅
│   ├── ThemeContext.tsx      # Provider e hooks
│   ├── akashic.ts            # Labels Akashic
│   ├── tenebralux.ts         # Labels Tenebra
│   └── types.ts              # ThemeId, ThemeLabels
│
├── core/types/               # TIPOS UNIFICADOS ⚠️ (precisa atualização)
│   ├── base.ts               # BaseEntity, CharacterAttributes
│   ├── character.ts          # Character, calculateDerivedStats
│   ├── commander.ts          # Commander, createCommanderFromCharacter
│   ├── card.ts               # GameCard (4 modos)
│   ├── domain.ts             # Realm, Province, Holding
│   ├── army.ts               # Army
│   └── unit.ts               # Unit
│
├── types/entities/           # TIPOS ESPECÍFICOS ✅
│   ├── character-card.ts     # CharacterCard simplificado
│   ├── field-commander.ts    # FieldCommander
│   ├── regent.ts             # Regent
│   └── ...
│
├── components/
│   ├── characters/           # CHARACTER CARDS ✅
│   ├── tactical/             # BATALHA HEX ✅
│   ├── masscombat/           # CAMPANHA CARDS ✅
│   ├── domains/              # DOMÍNIO ✅
│   ├── battlemap/            # TERRENOS HEX ✅
│   └── ui/                   # shadcn/ui ✅
│
├── pages/
│   ├── CharacterCards.tsx    # /characters
│   ├── TacticalHomePage.tsx  # /tactical
│   ├── MassCombat.tsx        # /mass-combat
│   ├── Domains.tsx           # /domains
│   ├── BattleMap.tsx         # /battlemap
│   └── ...
│
└── hooks/                    # DATA HOOKS ✅
    ├── useCharacterCards.ts
    ├── useTacticalCards.ts
    ├── useMassCombatTacticalCards.ts
    ├── useDomains.ts
    └── ...
```

### 7.2 Rotas Existentes

| Rota | Página | Módulo |
|------|--------|--------|
| `/` | Dashboard | Geral |
| `/characters` | CharacterCards | Personagens simplificados |
| `/tactical` | TacticalHomePage | Batalha Hex |
| `/tactical/create` | CreateTacticalMatchPage | Batalha Hex |
| `/tactical/battle/:id` | TacticalBattlePage | Batalha Hex |
| `/mass-combat` | MassCombat | Campanha Cards |
| `/mass-combat-cards` | MassCombatCards | Campanha Cards |
| `/domains` | Domains | Domínio 4X |
| `/battlemap` | BattleMap | Terrenos Hex |
| `/field-commanders` | FieldCommanders | Comandantes |
| `/army` | ArmyManagement | Exércitos |

### 7.3 Tabelas Supabase Existentes

- `character_cards` - Personagens simplificados
- `character_abilities` - Habilidades de personagem
- `tactical_cards` - Cartas táticas (batalha hex)
- `mass_combat_tactical_cards` - Cartas de campanha
- `terrains` - Terrenos hex
- `mass_combat_terrains` - Terrenos campanha
- `realms` - Reinos
- `provinces` - Províncias
- `holdings` - Holdings
- `regents` - Regentes
- `armies` - Exércitos
- `unit_templates` - Templates de unidade
- `unit_instances` - Instâncias de unidade

---

## 8. O QUE SERÁ CRIADO/MODIFICADO

### 8.1 Fase 0: Atualização Core Types

**Modificar:**
- `src/core/types/base.ts` - Adicionar RegencyStats
- `src/core/types/character.ts` - Adicionar calculateRegencyStats
- `src/core/types/commander.ts` - Usar RegencyStats

### 8.2 Fase 1: Character Builder

**Criar:**
- Nova rota `/character-builder`
- Contexto `CharacterBuilderContext`
- Dados em `src/data/character/`
- Componentes em `src/components/character-builder/`
- Wizard de 8 etapas

**Substituir:**
- `/characters` será redirecionado para `/character-builder`
- CharacterCards existente será integrado

### 8.3 Fase 2: Unificação de Cards

**Modificar:**
- Unificar hooks de cards
- Interface única de criação
- Filtro por gameMode

### 8.4 Fase 3: Unificação de Terrenos

**Modificar:**
- Interface única para criar terrenos
- Configuração diferente por tipo (hex vs card)

---

## 9. FLUXO DE USO TÍPICO

### 9.1 Jogador cria personagem completo

```
1. Acessa /character-builder
2. Preenche 8 etapas do wizard
3. Sistema calcula automaticamente:
   - Stats derivados (10)
   - Atributos de regência (5)
4. Personagem salvo pode ser usado em:
   - Aventura (como Herói)
   - Batalha (como Comandante)
   - Campanha (como General)
   - Domínio (como Regente)
```

### 9.2 Jogador cria comandante rápido

```
1. Acessa /character-builder (modo simplificado)
2. Define apenas:
   - Nome
   - Atributos de regência
   - Escolta (opcional)
3. Sistema calcula custo em pontos
4. Comandante usado em Batalha/Campanha
```

### 9.3 Mestre prepara batalha

```
1. Cria terreno hex em /battlemap
2. Cria cartas táticas em /tactical-cards
3. Jogadores trazem seus comandantes
4. Inicia partida em /tactical
```

### 9.4 Mestre gerencia campanha

```
1. Cria reinos em /domains
2. Atribui regentes (personagens)
3. Jogadores fazem ações de domínio
4. Conflitos resolvidos em /mass-combat
5. Batalhas importantes vão para /tactical
```

---

## 10. PERGUNTAS PARA VALIDAÇÃO

Antes de prosseguir, confirme:

1. **A estrutura de pastas está correta?**
   - Core types em `src/core/types/`
   - Theme em `src/themes/`
   - Novos dados em `src/data/character/`

2. **O fluxo de conversão faz sentido?**
   - Character → Commander (via calculateRegencyStats)
   - Character → CharacterCard (via regencyStats)
   - Character → Regent (via domainStats)

3. **As fórmulas estão corretas?**
   - Regência: Comando = Carisma + Pesquisa, etc.
   - Derivados: Convicção = Lógica + Determinação, etc.

4. **A integração com existente está clara?**
   - Não quebrar /tactical
   - Não quebrar /mass-combat
   - Não quebrar /domains

5. **O Theme System será usado corretamente?**
   - Labels dinâmicos para perícias
   - Tecnologia vs Geomancia por tema
   - Nomes de entidades por tema

---

## 11. CHECKLIST DE COMPATIBILIDADE

Após cada prompt, verificar:

- [ ] `/tactical` funciona normalmente
- [ ] `/mass-combat` funciona normalmente
- [ ] `/domains` funciona normalmente
- [ ] `/characters` funciona (ou redireciona)
- [ ] `/battlemap` funciona normalmente
- [ ] Theme switcher funciona
- [ ] Console sem erros
- [ ] Dados do Supabase intactos
