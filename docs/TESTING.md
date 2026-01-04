# Character Builder - Testes Automatizados

## Estrutura de Testes

```
src/test/
├── setup.ts                     # Setup global do Vitest
├── test-utils.tsx               # Wrappers e utilities
├── unit/                        # Testes unitários
│   ├── core-types/
│   │   └── character.test.ts    # Testes de cálculos
│   └── data/
│       ├── attributes.test.ts   # 8 atributos
│       ├── skills.test.ts       # 40 perícias
│       ├── virtues.test.ts      # 4 virtudes + níveis
│       ├── blessings.test.ts    # 12+ bênçãos
│       ├── derived-stats.test.ts # 10 stats derivados
│       ├── regency.test.ts      # 6 atributos de regência
│       ├── factions.test.ts     # Facções por tema
│       ├── cultures.test.ts     # Culturas por facção
│       └── equipment.test.ts    # Armas, armaduras, itens
├── integration/
│   └── CharacterBuilderContext.test.tsx  # Contexto completo
├── components/
│   └── StepConcept.test.tsx     # Componente de conceito
└── e2e/
    └── character-builder-flow.test.tsx  # Fluxo completo
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
```

## Cobertura Esperada

- **Core Types (character.ts)**: 100% - Crítico
- **Data files**: 90%+ - Importante
- **CharacterBuilderContext**: 85%+ - Importante  
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

### Integration Tests - Context (~20 testes)
- Initial State: 5 testes
- updateDraft: 5 testes
- Navigation: 6 testes
- Validation: 4 testes
- Calculations: 3 testes
- Finalization: 2 testes

### Component Tests (~5 testes)
- StepConcept: 3 testes

### E2E Tests (~5 testes - placeholders)
- Full flow: 1 teste
- Validation flow: 1 teste
- Theme switching: 1 teste
- Calculation integration: 3 testes

## Total: ~105 testes
