# DOCUMENTAÇÃO TÉCNICA COMPLETA - VTT CARD GAME TÁTICO

## ✅ Revisão e Ajustes (compilado do chat)

Esta versão incorpora decisões finais tomadas durante o refinamento das regras:

- **Reações (incluindo Contra-Manobra) são pagas pelo GENERAL** usando **CMD livre** do General na rodada.
- **Contra-Manobra**: só mira **manobras** (nunca reações); custo dinâmico = **CMD do comandante oponente que baixou a manobra + 1**; requer **CMD_livre_do_general > custo** (estrito); consome esse custo do orçamento de CMD do General na rodada; **não conta** no limite de 2 reações por fase e **não entra** no limite de compra do deckbuilding (é carta básica "gratuita").
- **Cartas básicas**: cada jogador possui **1 única** de cada e pode usar **1 vez por rodada**; **não consomem CMD** (exceto Contra-Manobra).
- **Liberação de CMD**: cartas/efeitos de "liberar" **liberam CMD parcialmente** de **uma única manobra** (até um limite X); **não são cumulativas** (uma manobra não pode receber mais de um efeito de liberação). O CMD liberado está **vinculado à manobra específica** que o consumiu.
- **Afinidades culturais**:
  - Afinidade de **especialização**: comandantes da especialização da cultura ganham **+1 CMD** (para orçamento e checagens).
  - Afinidade de **terreno**: **+2 na iniciativa** quando o **terreno primário** é o terreno afim.
  - Afinidade de **estação**: **ignora o 1º nível** de penalidade de clima na estação afim.

**Versão:** 2.0  
**Data:** Janeiro 2026  
**Última atualização:** Alinhamento de nomenclaturas e cartas básicas

---

## 📚 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Nomenclaturas e Taxonomia](#nomenclaturas-e-taxonomia)
3. [Cartas Básicas](#cartas-básicas)
4. [Sistema de CMD](#sistema-de-cmd)
5. [Sistema de Liberação de CMD](#sistema-de-liberação-de-cmd)
6. [Arquitetura do Banco de Dados](#arquitetura-do-banco-de-dados)
7. [Estrutura de Estado](#estrutura-de-estado)
8. [Regras de Negócio](#regras-de-negócio)

---

## 🎯 VISÃO GERAL

### Objetivo do Projeto

Construir um **VTT (Virtual TableTop) multiplayer em tempo real** para um card game tático de guerra inspirado em Birthright. O sistema backend (cartas, terrenos, culturas, comandantes) já existe no Supabase. Esta aplicação deve orquestrar as fases de jogo, validar regras, sincronizar estado entre dois jogadores e fornecer uma interface clara e performática.

### Características Principais

- **Multiplayer síncrono**: 2 jogadores em tempo real via Supabase Realtime
- **Sistema de Logística Pré-Jogo**: Gastar VET para controlar terreno/estação
- **Economia de CMD**: Pool de comando por rodada (comandantes e general)
- **Reações Triggered**: Sistema de prioridade alternada
- **Sistema de Cartas**: Manobras, Reações, Cartas Básicas infinitas
- **Combate Abstrato**: Resolução por d20 + modificadores

---

## 📖 NOMENCLATURAS E TAXONOMIA

### Tipos de Carta

| Valor | Descrição |
|-------|-----------|
| `manobra` | Carta ativa jogada por um comandante durante uma fase |
| `reação` | Carta reativa jogada pelo General em resposta a um gatilho |

### Tipos de Manobra (apenas para `card_type = 'manobra'`)

| Valor | Descrição |
|-------|-----------|
| `ofensiva` | Manobras focadas em ataque |
| `defensiva` | Manobras focadas em defesa |
| `movimentação` | Manobras focadas em mobilidade, iniciativa ou suporte |

### Especializações de Comandantes

| Valor | Descrição |
|-------|-----------|
| `Infantaria` | Especialização em tropas de infantaria |
| `Arqueria` | Especialização em tropas de arqueiros |
| `Cavalaria` | Especialização em tropas montadas |

> **Nota:** Um comandante pode ter de **1 a 3 especializações** (array).

### Especializações Requeridas pelas Cartas

| Valor | Descrição |
|-------|-----------|
| `Infantaria` | Requer comandante com especialização Infantaria |
| `Arqueria` | Requer comandante com especialização Arqueria |
| `Cavalaria` | Requer comandante com especialização Cavalaria |
| `Generalista` | Pode ser usada por **qualquer comandante**, independente da especialização |

---

## 🃏 CARTAS BÁSICAS

Cada jogador possui exatamente **1 cópia** de cada carta básica. Elas:
- Não podem ser compradas (vêm "de graça" no deck)
- Podem ser usadas **1 vez por rodada**
- **Não consomem CMD** (exceto Contra-Manobra)
- Têm a tag `is_basic = true`

### Lista Completa de Cartas Básicas

#### 1. Ataque Básico
| Campo | Valor |
|-------|-------|
| **Tipo** | Manobra |
| **Tipo de Manobra** | Ofensiva |
| **Especialização** | Generalista |
| **Custo CMD** | 0 |
| **Efeito** | Soma +1 na rolagem de ataque do exército |

#### 2. Defesa Básica
| Campo | Valor |
|-------|-------|
| **Tipo** | Manobra |
| **Tipo de Manobra** | Defensiva |
| **Especialização** | Generalista |
| **Custo CMD** | 0 |
| **Efeito** | Soma +1 na defesa total do exército |

#### 3. Movimentação Básica
| Campo | Valor |
|-------|-------|
| **Tipo** | Manobra |
| **Tipo de Manobra** | Movimentação |
| **Especialização** | Generalista |
| **Custo CMD** | 0 |
| **Efeito** | Soma +1 na rolagem de iniciativa do exército |

#### 4. Reforço Básico
| Campo | Valor |
|-------|-------|
| **Tipo** | Manobra |
| **Tipo de Manobra** | Movimentação |
| **Especialização** | Generalista |
| **Custo CMD** | 0 |
| **Efeito** | Recupera +1 na guarda do comandante alvo |

#### 5. Assalto Básico
| Campo | Valor |
|-------|-------|
| **Tipo** | Manobra |
| **Tipo de Manobra** | Ofensiva |
| **Especialização** | Generalista |
| **Custo CMD** | 0 |
| **Efeito** | Ataca um comandante ou general (regras de ataque ao líder aplicam-se) |

#### 6. Contra-Manobra Básica
| Campo | Valor |
|-------|-------|
| **Tipo** | Reação |
| **Especialização** | Generalista |
| **Custo CMD** | **CMD do comandante que usou a manobra alvo + 1** (dinâmico, pago pelo General) |
| **Condição** | Uma carta de manobra baixada na fase atual |
| **Efeito** | Anula uma carta de manobra |

### Tabela Resumida

| Nome | Tipo | Tipo Manobra | Especialização | CMD | Efeito |
|------|------|--------------|----------------|-----|--------|
| Ataque Básico | Manobra | Ofensiva | Generalista | 0 | +1 ataque |
| Defesa Básica | Manobra | Defensiva | Generalista | 0 | +1 defesa |
| Movimentação Básica | Manobra | Movimentação | Generalista | 0 | +1 iniciativa |
| Reforço Básico | Manobra | Movimentação | Generalista | 0 | +1 guarda alvo |
| Assalto Básico | Manobra | Ofensiva | Generalista | 0 | Ataque ao líder |
| Contra-Manobra | Reação | - | Generalista | CMD_alvo + 1 | Anula manobra |

---

## ⚡ SISTEMA DE CMD

### Orçamento por Rodada

- **Comandantes de campo** possuem `cmd_effective` (base + bônus/afinidades).
- Cada comandante pode gastar, ao longo da rodada, a **soma dos custos de CMD** das manobras que ele ativou.
- **O General** possui um orçamento separado (`general_cmd_effective`) usado **apenas para reações** (inclui Contra-Manobra).

### Fórmula de CMD Livre

```
cmd_livre = cmd_effective - cmd_spent_na_rodada
```

### Regras Importantes

1. Cartas básicas (exceto Contra-Manobra) **não consomem CMD**.
2. Contra-Manobra é paga pelo **General** com custo dinâmico.
3. CMD pode ser **liberado** por efeitos especiais (ver seção seguinte).

---

## 🔓 SISTEMA DE LIBERAÇÃO DE CMD

### Conceito

Alguns efeitos (geralmente reações) permitem "liberar CMD" de uma manobra já usada por um comandante.

### Regras Críticas

1. **Vinculação à Manobra**: O CMD liberado está **vinculado à manobra específica** que o consumiu. Não é CMD "genérico".

2. **Escolha da Manobra**: Ao usar um efeito de liberação, o jogador deve **escolher uma manobra** que foi jogada por um comandante.

3. **Quantidade Liberada**: Se a carta libera X CMD, mas a manobra escolhida custou Y (onde Y > X), apenas X CMD são liberados.
   - Exemplo: Carta libera 2 CMD, manobra custou 4 → libera 2, sobram 2 "travados".

4. **Representação Visual**: A carta da manobra é **virada na horizontal** para indicar que teve CMD liberado.

5. **Não Cumulativo**: Uma manobra que já teve CMD liberado **não pode receber outro efeito de liberação**.

### Estrutura de Dados

```typescript
interface ManeuverPlay {
  id: string;
  card: Card;
  commander_id: string;
  cmd_consumed: number;        // CMD original consumido
  cmd_released: number;        // CMD já liberado (0 a cmd_consumed)
  is_rotated: boolean;         // true se teve liberação parcial
}

interface LiberarCMDEffect {
  trigger_condition: string;   // Ex: "Quando um comandante com especialização em arqueria começar uma fase com todos os CMDs comprometidos"
  libera_cmd_quantidade: number; // Quantidade máxima a liberar
}
```

### Exemplo de Uso

1. Comandante A usa "Carga de Cavalaria" (custo 4 CMD)
2. Jogador usa reação "Reagrupamento Tático" que "libera 2 CMD"
3. Jogador escolhe a manobra "Carga de Cavalaria"
4. Sistema:
   - Marca `cmd_released = 2` na manobra
   - Marca `is_rotated = true`
   - Comandante A recupera 2 CMD disponíveis
   - Ainda há 2 CMD "travados" naquela manobra

---

## 🗄️ ARQUITETURA DO BANCO DE DADOS

### Schema de Cartas Táticas

```sql
-- Tabela: mass_combat_tactical_cards (ATUALIZADA)
CREATE TABLE mass_combat_tactical_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  
  -- NOVO: Tipo de carta (substitui unit_type para esta taxonomia)
  card_type TEXT NOT NULL DEFAULT 'manobra', 
    -- 'manobra' | 'reação'
  
  -- NOVO: Tipo de manobra (apenas quando card_type = 'manobra')
  maneuver_type TEXT,
    -- 'ofensiva' | 'defensiva' | 'movimentação' | NULL (se reação)
  
  -- NOVO: Especialização requerida
  specialization TEXT NOT NULL DEFAULT 'Generalista',
    -- 'Infantaria' | 'Arqueria' | 'Cavalaria' | 'Generalista'
  
  -- NOVO: Flags de carta básica
  is_basic BOOLEAN NOT NULL DEFAULT false,
  is_contramaneuver BOOLEAN NOT NULL DEFAULT false,
  
  -- Bônus e penalidades (mantidos)
  attack_bonus INTEGER NOT NULL DEFAULT 0,
  defense_bonus INTEGER NOT NULL DEFAULT 0,
  mobility_bonus INTEGER NOT NULL DEFAULT 0,
  attack_penalty INTEGER NOT NULL DEFAULT 0,
  defense_penalty INTEGER NOT NULL DEFAULT 0,
  mobility_penalty INTEGER NOT NULL DEFAULT 0,
  
  -- Requisitos (mantidos)
  command_required INTEGER NOT NULL DEFAULT 0,
  strategy_required INTEGER NOT NULL DEFAULT 1,
  
  -- Efeitos (mantidos)
  minor_effect TEXT,
  major_effect TEXT,
  minor_condition TEXT,
  major_condition TEXT,
  
  -- Descrição e texto
  description TEXT,
  
  -- NOVO: Campos para efeitos de liberação de CMD
  trigger_condition TEXT,         -- Condição para ativar (para reações)
  libera_cmd_quantidade INTEGER,  -- Quantidade de CMD a liberar (se aplicável)
  
  -- Custos (mantidos)
  vet_cost INTEGER NOT NULL DEFAULT 0,
  vet_cost_override INTEGER,
  
  -- Tags (mantidos)
  effect_type TEXT,
  effect_tag TEXT,
  
  -- Metadados
  culture TEXT,
  game_mode TEXT NOT NULL DEFAULT 'estrategico',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- LEGADO: unit_type será depreciado, mas mantido por compatibilidade
  unit_type TEXT
);

-- Índices para performance
CREATE INDEX idx_tactical_cards_card_type ON mass_combat_tactical_cards(card_type);
CREATE INDEX idx_tactical_cards_specialization ON mass_combat_tactical_cards(specialization);
CREATE INDEX idx_tactical_cards_is_basic ON mass_combat_tactical_cards(is_basic);
```

### Schema de Templates de Comandante

```sql
-- Tabela: mass_combat_commander_templates (mantida, referência)
-- Especialização já é array (especializacoes text[]) ou string
-- Se for string, considerar migração para array no futuro
```

---

## 📊 ESTRUTURA DE ESTADO

### Interface Card (Atualizada)

```typescript
interface Card {
  id: string;
  name: string;
  
  // NOVO: Taxonomia clara
  card_type: 'manobra' | 'reação';
  maneuver_type?: 'ofensiva' | 'defensiva' | 'movimentação'; // só para manobras
  
  // NOVO: Especialização
  specialization: 'Infantaria' | 'Arqueria' | 'Cavalaria' | 'Generalista';
  
  // NOVO: Flags
  is_basic: boolean;
  is_contramaneuver: boolean;
  
  // Requisitos
  command_required: number;
  strategy_required: number;
  
  // Bônus
  attack_bonus: number;
  defense_bonus: number;
  mobility_bonus: number;
  
  // Efeitos
  description?: string;
  minor_effect?: string;
  major_effect?: string;
  
  // Para efeitos de liberação de CMD
  trigger_condition?: string;
  libera_cmd_quantidade?: number;
  
  // Custos
  vet_cost: number;
  
  // Cultura (opcional)
  culture?: string;
}
```

### Interface ManeuverPlay (Nova)

```typescript
interface ManeuverPlay {
  id: string;
  card: Card;
  commander_id: string;
  
  // CMD tracking
  cmd_consumed: number;
  cmd_released: number;        // 0 a cmd_consumed
  
  // Visual state
  is_rotated: boolean;         // true se teve liberação
  
  // Cancelamento
  effect_cancelled: boolean;   // true se contra-manobra anulou
}
```

### Interface Commander (Atualizada)

```typescript
interface Commander {
  id: string;
  name: string;
  
  // Stats base
  cmd: number;
  strategy: number;
  guard: number;
  
  // NOTA: Array de especializações (1 a 3)
  specialization: ('Infantaria' | 'Arqueria' | 'Cavalaria')[];
  
  vet_cost: number;
}
```

---

## 🎮 REGRAS DE NEGÓCIO

### Cartas Básicas (Resumo)

1. Todo jogador possui as 6 cartas básicas automaticamente.
2. Cada uma pode ser usada **1 vez por rodada**.
3. **Não consomem CMD** (exceto Contra-Manobra).
4. Não entram nos limites de compra do deckbuilding.
5. Contra-Manobra não conta no limite de 2 reações por fase.

### Contra-Manobra

- **Tipo:** Reação básica
- **Alvo:** Apenas manobras (nunca reações)
- **Custo:** CMD do comandante oponente + 1 (pago pelo General)
- **Requisito:** `general_cmd_livre > custo` (estrito, não ≥)
- **Efeito:** Cancela o efeito da manobra (custos já foram pagos)

### Liberação de CMD (Resumo)

1. Escolhe **uma manobra específica** de um comandante.
2. Libera **até X CMD** (onde X é definido pela carta de liberação).
3. O comandante recupera esses CMD para uso na rodada.
4. A manobra fica **virada** (marcação visual).
5. **Não cumulativo:** uma manobra só pode receber um efeito de liberação.

### Validação de Especialização

```typescript
function canCommanderPlayCard(commander: Commander, card: Card): boolean {
  // Generalista pode ser usada por qualquer comandante
  if (card.specialization === 'Generalista') {
    return true;
  }
  
  // Comandante deve ter a especialização requerida
  return commander.specialization.includes(card.specialization);
}
```

### Afinidades Culturais

1. **Especialização:** Comandantes com a especialização da cultura ganham **+1 CMD**.
2. **Terreno:** Se o terreno primário é o afim, **+2 na rolagem de iniciativa**.
3. **Estação:** Na estação afim, **ignora o 1º nível** de penalidade de clima.

---

## ✅ MUDANÇAS EM RELAÇÃO À VERSÃO 1.0

| Item | Antes | Agora |
|------|-------|-------|
| Cartas básicas | 5 (ATK, DEF, INI, Cura, Contra) | **6** (+ Assalto Básico) |
| Taxonomia | `type: 'initiative' \| 'attack' \| 'defense' \| 'reaction'` | `card_type: 'manobra' \| 'reação'` + `maneuver_type` |
| Especialização genérica | `null` | `'Generalista'` |
| unit_type | Campo principal | **Depreciado** (mantido por compatibilidade) |
| Liberar CMD | Genérico | **Vinculado à manobra específica** |

---

## 📝 PENDÊNCIAS PARA IMPLEMENTAÇÃO

### Fase 1: Migração de Schema
- [ ] Adicionar campos `card_type`, `maneuver_type`, `specialization`, `is_basic`, `is_contramaneuver` à tabela
- [ ] Adicionar campos `trigger_condition`, `libera_cmd_quantidade`
- [ ] Migrar dados existentes de `unit_type` para nova taxonomia
- [ ] Criar as 6 cartas básicas

### Fase 2: Código
- [ ] Atualizar hooks e tipos TypeScript
- [ ] Atualizar editores de cartas
- [ ] Atualizar previews de cartas
- [ ] Implementar validação de especialização

### Fase 3: Commit/Reveal
- [ ] **ADIADO** para fase posterior

---

## 📊 MAPEAMENTO unit_type → card_type/maneuver_type

Para migração dos dados existentes:

| unit_type (antigo) | card_type | maneuver_type |
|-------------------|-----------|---------------|
| Infantaria | manobra | ofensiva |
| Cavalaria | manobra | ofensiva |
| Arqueiros | manobra | defensiva |
| Cerco | manobra | ofensiva |
| Geral | manobra | movimentação |

> **Nota:** Este mapeamento é aproximado. Cartas específicas podem precisar de ajuste manual.

---

**FIM DO DOCUMENTO**
