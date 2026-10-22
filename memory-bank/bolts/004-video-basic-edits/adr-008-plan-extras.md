---
bolt: 004-video-basic-edits
created: 2026-10-22T18:15:00Z
status: accepted
superseded_by: null
---

# ADR-008: `planExtras.js` como módulo de extensão do plano sem alterar o `plan.js` da B003

## Context

O `plan.js` da B003 calcula o plano de execução de uma tarefa a partir dos dados que os módulos de operação expõem: `estimate` (propriedades de saída do passo) e `copyable` (booleano que indica se a stream de vídeo pode ser copiada). Este contrato foi suficiente para a B003 (sem operações concretas) e seria suficiente para a maioria das operações simples.

A B004 introduz dois requisitos que não cabem nesse contrato:

1. **Cópia condicionada ao *keyframe*** (D-49, ADR-007): o plano precisa de um campo `keyframeCopy: { atMs }` que o `plan.js` não calcula (não sabe nada de instantes de início nem de *keyframes*). Adicionar este campo ao `plan.js` misturaria lógica da `trim` com a lógica genérica do plano.
2. **Taxa de fotogramas de entrada de cada passo** (D-52): o filtro `fps=<taxa original>` da operação `speed` precisa da taxa de fotogramas da entrada do passo, não do vídeo original. Em cadeias, a entrada de um passo é a saída do anterior, e o `plan.js` já calcula esta progressão — mas não a inclui na estrutura do passo enviada ao worker.

A regra 2.6 do ADD proíbe alterar o `plan.js` da B003. O princípio Open/Closed (aberto para extensão, fechado para modificação) aponta na mesma direção.

## Decision

Cria-se o módulo `projects/video/planExtras.js`, aplicado ao plano já calculado pelo `plan.js`, sem substituir nem alterar o `plan.js`. O módulo exporta uma função `applyPlanExtras(plan, steps, inputMeta)` que:

1. Percorre os passos do plano.
2. Para cada passo `trim` cuja operação marcou `keyframeCopy` como permitida, acrescenta `keyframeCopy: { atMs: step.params.startMs }` ao passo do plano.
3. Para cada passo, acrescenta `inputFps: { num, den }` com a taxa de fotogramas da entrada desse passo (propagada a partir de `inputMeta`, atualizada pelo `estimate` de cada passo anterior).
4. Não altera nenhum outro campo do plano. Não duplica a lógica do `plan.js`.

A chamada ao `applyPlanExtras` é acrescentada ao `tasks.js` da B003 com uma única linha nova, depois da chamada existente ao `plan()`. O `validate` não chama `applyPlanExtras` porque os extras não afetam os campos `output` usados na resposta de validação.

Este módulo é o ponto de extensão declarado para as operações que as B005, B007 e B008 vão introduzir e que precisem de dados que o contrato `estimate`/`copyable` não exprime.

## Rationale

As alternativas — alterar o `plan.js`, passar os dados extras pelo `estimate` ou adicionar um campo `extras` ao contrato de operação — todas envolvem mudar código da B003 (proibido pela regra 2.6) ou inflacionam o contrato genérico com dados específicos de cada operação.

O `planExtras.js` como camada separada mantém o `plan.js` estável, permite que cada operação nova contribua com a sua lógica de extras sem risco de regressão nas operações existentes, e é reversível: se uma versão futura do plano absorver estes campos, o `planExtras.js` pode ser esvaziado gradualmente.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Alterar o `plan.js` para suportar `keyframeCopy` e `inputFps` | Tudo num único módulo | Viola a regra 2.6; mistura lógica específica de `trim`/`speed` com a lógica genérica | Proibido pela regra 2.6 |
| Incluir `keyframeCopy` no `estimate` do módulo `trim` | Sem módulo novo | O `estimate` descreve as propriedades de saída, não instruções de execução; mistura semânticas | Viola o contrato do `estimate` |
| Campo `extras` no contrato de operação (`{ validate, estimate, cost, copyable, extras }`) | Extensível | Muda o contrato e obriga a atualizar o `plan.js` e todos os módulos existentes | Quebra o contrato da B003; viola a regra 2.6 |
| Calcular `inputFps` e `keyframeCopy` no worker | Sem módulo JS novo | O worker não tem acesso às regras de negócio; viola o T-01 (decisões no serviço de projetos) | Viola o T-01 |

## Consequences

### Positive

- O `plan.js` da B003 não é alterado; as operações existentes (B001–B003) não são afetadas.
- Cada operação nova acrescenta a sua lógica de extras ao `planExtras.js` de forma isolada.
- O ponto de chamada no `tasks.js` é uma única linha, fácil de auditar na regra 2.6.
- Padrão explícito e documentado para as B005, B007 e B008.

### Negative

- Mais um módulo no serviço de projetos.
- A ordem de aplicação dos extras (primeiro `keyframeCopy`, depois `inputFps`, ou outra) tem de ser mantida consistente entre os contribuidores.

### Risks

- Se o `plan.js` for alterado numa versão futura (fora deste bolt) de forma incompatível com os extras, o `planExtras.js` pode precisar de ser revisto. Risco baixo enquanto a regra 2.6 estiver em vigor.

## Related

- **Stories**: ST-VID-001 (AC2 — `keyframeCopy`), ST-VID-003 (AC1 — `fps=`)
- **Requirements**: REQ-VID-TRIM-010, REQ-VID-SPEED-004 (taxa de fotogramas preservada)
- **ADD**: T-01, T-02, secção 2.6
- **Decisões**: D-49, D-52
- **ADRs**: ADR-007 (`keyframeCopy` no worker), ADR-004 (campos do `VideoTask`)
- **Bolts afetados**: B005 (ajuste, marca de água — podem precisar de extras), B007 (conversão — `inputFps` de entrada), B008 (cadeias — `keyframeCopy` no primeiro passo)
