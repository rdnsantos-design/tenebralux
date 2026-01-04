# Character Builder - Testes Automatizados

## Estrutura de Testes

```
src/test/
├── setup.ts                     # Setup global do Vitest
├── test-utils.tsx               # Wrappers e utilities
├── mocks/
│   └── jspdf.ts                 # Mock do jsPDF
├── unit/                        # Testes unitários
│   ├── core-types/
│   │   └── character.test.ts    # Testes de cálculos
│   ├── data/
│   │   ├── attributes.test.ts   # 8 atributos
│   │   ├── skills.test.ts       # 40 perícias
│   │   ├── virtues.test.ts      # 4 virtudes + níveis
│   │   ├── blessings.test.ts    # 12+ bênçãos
│   │   ├── derived-stats.test.ts # 10 stats derivados
│   │   ├── regency.test.ts      # 6 atributos de regência
│   │   ├── factions.test.ts     # Facções por tema
│   │   ├── cultures.test.ts     # Culturas por facção
│   │   └── equipment.test.ts    # Armas, armaduras, itens
│   ├── pdf/
│   │   └── characterSheetPDF.test.ts  # Serviço PDF
│   ├── hooks/
│   │   ├── useCharacterPDF.test.ts    # Hook PDF
│   │   ├── useCharacterStorage.test.ts # Hook de armazenamento
│   │   └── useTacticalIntegration.test.ts # Hook de integração tática
│   └── services/
│       ├── characterStorage.test.ts   # Serviço de storage
│       └── characterConverter.test.ts # Conversão Character → Tático
├── integration/
│   └── CharacterBuilderContext.test.tsx  # Contexto completo
├── components/
│   ├── StepConcept.test.tsx     # Componente de conceito
│   ├── StepSummary.pdf.test.tsx # Integração PDF no resumo
│   ├── CharacterManager.test.tsx # Componentes de gerenciamento
│   └── BattleButton.test.tsx    # Botão de batalha
└── e2e/
    ├── character-builder-flow.test.tsx  # Fluxo completo
    └── character-to-battle.test.tsx     # Fluxo Character → Batalha
```

## Executando os Testes

```bash
# Executar todos os testes
npx vitest

# Executar com coverage
npx vitest --coverage

# Executar em modo watch
npx vitest --watch

# Executar apenas testes unitários
npx vitest src/test/unit

# Executar apenas testes de integração
npx vitest src/test/integration

# Executar apenas testes de PDF
npx vitest --testPathPattern="pdf|PDF"

# Executar apenas testes de integração tática
npx vitest --testPathPattern="tactical|BattleButton|character-to-battle"

# Coverage para integração tática
npx vitest --coverage --testPathPattern="tactical"
```

## Cobertura Esperada

- **Core Types (character.ts)**: 100% - Crítico
- **Data files**: 90%+ - Importante
- **CharacterBuilderContext**: 85%+ - Importante  
- **PDF Service**: 80%+ - Importante
- **Componentes**: 70%+ - Nice to have

## Testes Implementados

### Unit Tests - Core Types (~25 testes)
- `calculateDerivedStats` - 13 testes
- `calculateRegencyStats` - 7 testes
- `regencyToCommandStats` - 2 testes
- `calculateCharacterPowerCost` - 4 testes
- `createDefaultCharacter` - 7 testes

### Unit Tests - Data Files (~50 testes)
- Attributes: 10 testes
- Skills: 12 testes
- Virtues: 15 testes
- Blessings: 12 testes
- Derived Stats: 12 testes
- Regency: 10 testes
- Factions: 8 testes
- Cultures: 6 testes
- Equipment: 12 testes

### Unit Tests - PDF (~30 testes)
- characterSheetPDF.test.ts:
  - generateCharacterPDF: 9 testes
  - downloadCharacterPDF: 3 testes
  - getCharacterPDFBlob: 2 testes
  - PDF Content Validation: 4 testes
  - Edge Cases: 8 testes
- useCharacterPDF.test.ts:
  - Estado inicial: 3 testes
  - downloadPDF: 5 testes
  - getPDFBlob: 3 testes
  - previewPDF: 2 testes

### Unit Tests - Storage (~60 testes)
- characterStorage.test.ts:
  - getAllCharacters: 3 testes
  - getCharacterById: 2 testes
  - saveCharacter: 5 testes
  - deleteCharacter: 3 testes
  - duplicateCharacter: 2 testes
  - filterCharacters: 10 testes
  - exportCharacters: 2 testes
  - exportSingleCharacter: 2 testes
  - importCharacters: 6 testes
  - getStorageStats: 3 testes
- useCharacterStorage.test.ts:
  - Initial State: 4 testes
  - loadCharacters: 2 testes
  - getCharacter: 2 testes
  - save: 4 testes
  - remove: 3 testes
  - duplicate: 2 testes
  - export: 2 testes
  - importFromJson: 3 testes
  - filters: 2 testes
  - stats: 1 teste

### Integration Tests - Context (~20 testes)
- Initial State: 5 testes
- updateDraft: 5 testes
- Navigation: 6 testes
- Validation: 4 testes
- Calculations: 3 testes
- Finalization: 2 testes

### Component Tests (~45 testes)
- StepConcept: 3 testes
- StepSummary.pdf: 8 testes
- CharacterManager.test.tsx:
  - CharacterCard: 10 testes
  - CharacterFilters: 3 testes
  - DeleteConfirmDialog: 4 testes
  - ImportExportDialog: 8 testes

### E2E Tests (~8 testes)
- Full flow: 1 teste
- Validation flow: 1 teste
- Theme switching: 1 teste
- Calculation integration: 3 testes
- Character to Battle flow: 3 testes

### Unit Tests - Tactical Integration (~45 testes)
- characterConverter.test.ts:
  - convertCharacterToUnit: 12 testes
  - Unit Type Detection: 6 testes
  - generateCombatCards: 10 testes
  - convertTeamToTactical: 6 testes
  - validateCharacterForBattle: 5 testes
  - Card Effects: 4 testes
  - Theme Support: 4 testes
  - Equipment Processing: 3 testes
- useTacticalIntegration.test.ts:
  - Estado inicial: 3 testes
  - prepareForBattle: 6 testes
  - prepareTeam: 3 testes
  - validateCharacter: 3 testes
  - goToBattle: 2 testes

### Component Tests - BattleButton (~20 testes)
- Renderização: 4 testes
- Interação: 8 testes
- Variants: 4 testes
- Error States: 3 testes

## Total: ~280 testes

### Unit Tests - Online/Sync (~24 testes) - Prompt 16.1
- useOnlineStatus.test.ts:
  - Estado inicial: 3 testes
  - Eventos de conexão: 3 testes
  - resetWasOffline: 1 teste
  - Cleanup: 1 teste
- useCharacterStorageHybrid.sync.test.ts:
  - Sync Automático: 4 testes
  - Sync Logic: 2 testes
- CharacterCard.battle.test.tsx:
  - Integração BattleButton: 6 testes
- offline-sync.test.tsx:
  - E2E Offline → Online: 4 testes
  - BattleButton fluxo: 2 testes

## Total Geral: ~304 testes

## Arquivos de Serviço PDF

### src/services/pdf/characterSheetPDF.ts
Serviço de geração de PDF com as funções:
- `generateCharacterPDF(character, options)` - Gera documento jsPDF
- `downloadCharacterPDF(character, theme)` - Faz download do PDF
- `getCharacterPDFBlob(character, theme)` - Retorna Blob do PDF

### src/hooks/useCharacterPDF.ts
Hook React com as funções:
- `downloadPDF(character, theme)` - Download com loading state
- `getPDFBlob(character, theme)` - Blob com loading state
- `previewPDF(character, theme)` - Abre preview em nova aba
- `isGenerating` - Estado de loading
- `error` - Estado de erro
