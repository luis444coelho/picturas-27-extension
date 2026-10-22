---
bolt: 004-video-basic-edits
created: 2026-10-22T18:15:00Z
status: accepted
superseded_by: null
---

# ADR-008: `planExtras.js` como módulo de extensão do plano sem alterar o `plan.js` da B003

## Context

O `plan.js` da B003 calcula o plano de execução de uma tarefa a partir dos dados que os módulos de operação expõem: `estimate` (propriedades de saída do passo) e `copyable` (objeto por stream: `{ video: boolean, audio: boolean }` — indica se cada stream pode ser copiada). Este contrato foi suficiente para a B003 (sem operações concretas) e basta para operações simples.

A B004 introduz dois requisitos que não cabem nesse contrato:

1. **Cópia condicionada ao *keyframe*** (D-49, ADR-007): o plano precisa de um objeto `plan.keyframeCopy` — com `atMs`, `endMs`, `video`, `audio`, `preview` e `dropStep` — que o `plan.js` não calcula (não sabe nada de instantes de início nem de *keyframes*). Adicionar esta lógica ao `plan.js` misturaria regras específicas da `trim` com a lógica genérica do plano.
2. **Taxa de fotogramas de entrada de cada passo** (D-52): o filtro `fps=<fpsNum>/<fpsDen>` da operação `speed` precisa da taxa de fotogramas da entrada do passo — a saída do passo anterior numa cadeia. O `plan.js` calcula esta progressão mas não inclui as propriedades de entrada de cada passo na estrutura enviada ao worker (a verificar em V2).

A regra 2.6 do ADD proíbe alterar o `plan.js` da B003. O princípio de aberto para extensão, fechado para modificação, aponta na mesma direção.

O ponto de chamada no `tasks.js` é `plans.buildPlan(...)` (nome a confirmar em V3); após esse cálculo, é acrescentada uma única linha nova que chama `applyPlanExtras`.

## Decision

Cria-se o módulo `projects/video/planExtras.js`, aplicado ao plano já calculado pelo `plan.js`, sem substituir nem alterar o `plan.js`. O módulo exporta:

```js
applyPlanExtras(plan, steps, inputProps, registry)
```

onde:
- `plan` — o plano calculado pelo `plan.js`.
- `steps` — os passos da tarefa (com `operation`, `version`, `parameters`).
- `inputProps` — as propriedades do vídeo de entrada (`videos.meta`).
- `registry` — o registo de operações, para aceder ao `estimate` de cada módulo sem o recalcular.

A função percorre os passos propagando as propriedades com o `estimate` de cada módulo (como faz o `validateChain` da B003) e:

### 1. Propriedades de entrada de cada passo (`input: { fpsNum, fpsDen }`)

Para cada passo do plano, acrescenta `input: { fpsNum, fpsDen }` com a taxa de fotogramas da entrada desse passo — propagada a partir de `inputProps` e atualizada pelo `estimate` de cada passo anterior. O `speed.py` usa estes valores no filtro `fps=<fpsNum>/<fpsDen>` (D-52). Se a V2 confirmar que o `plan.js` já inclui estas propriedades na estrutura do passo enviada ao worker, este ponto não se aplica.

### 2. `CopiaNoKeyframe` (D-49, ADR-007)

Aplica-se quando se verificam todas as seguintes condições:

- Há exatamente um passo `trim` na cadeia.
- O codec de vídeo de entrada é o codec de saída do contentor MP4 segundo `formats.js` (V8) — tipicamente H.264.
- Todos os outros passos têm `copyable.video = true`.

Quando as condições se verificam, a função acrescenta ao plano global:

```text
plan.keyframeCopy = {
  atMs: step.parameters.startMs,
  endMs: step.parameters.endMs,
  video: { mode: "copy", genpts: <true se AVI, false caso contrário> },
  audio: {
    mode: "copy"    // entrada AAC e nenhum outro passo altera o áudio
         | "encode" // entrada MP3 ou outro codec não AAC
         | "none"   // sem streams de áudio (audioCodec: null)
  },
  preview: <plano da cópia de pré-visualização, mesma forma do plan.preview da B003>,
  dropStep: <índice do passo trim>
}
```

O restante plano (`video: encode`, `audio: encode` com `atrim`) é a alternativa de recodificação. As duas alternativas ficam no plano guardado na tarefa (`VideoTask.plan`, ADR-004), por isso a republicação da rotina (D-41) não precisa de recalcular os extras.

### 3. Sem alterações a outros campos

A função não altera nenhum outro campo do plano. Não duplica a lógica do `plan.js`. As propriedades de entrada (`input`) e o `keyframeCopy` são dados adicionais, não substituições.

### Ponto de chamada

A chamada ao `applyPlanExtras` é acrescentada ao `tasks.js` da B003 com uma única linha nova, imediatamente após o cálculo do plano por `plans.buildPlan(...)` (V3). O `validate` não chama `applyPlanExtras` porque os extras não afetam os campos `output` usados na resposta de validação.

Este módulo é o ponto de extensão declarado para as operações que as B005, B007 e B008 vão introduzir e que precisem de dados que o contrato `estimate`/`copyable { video, audio }` não exprime.

## Rationale

As alternativas — alterar o `plan.js`, passar os dados extras pelo `estimate`, ou adicionar um campo `extras` ao contrato de operação — todas envolvem mudar código da B003 (proibido pela regra 2.6) ou inflacionam o contrato genérico com dados específicos de cada operação.

O `planExtras.js` como camada separada mantém o `plan.js` estável, permite que cada operação nova contribua com a sua lógica de extras sem risco de regressão nas operações existentes, e é reversível: se uma versão futura do plano absorver estes campos, o `planExtras.js` pode ser esvaziado gradualmente.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Alterar o `plan.js` para suportar `keyframeCopy` e `input.fpsNum/fpsDen` | Tudo num único módulo | Viola a regra 2.6; mistura lógica específica de `trim`/`speed` com lógica genérica | Proibido pela regra 2.6 |
| Incluir `keyframeCopy` no `estimate` do módulo `trim` | Sem módulo novo | O `estimate` descreve as propriedades de saída, não instruções de execução; mistura semânticas | Viola o contrato do `estimate` |
| Campo `extras` no contrato de operação (`{ validate, estimate, cost, copyable, extras }`) | Extensível | Muda o contrato e obriga a atualizar o `plan.js` e todos os módulos existentes | Quebra o contrato da B003; viola a regra 2.6 |
| Calcular `input.fpsNum/fpsDen` e `keyframeCopy` no worker | Sem módulo JS novo | O worker não tem acesso às regras de negócio nem ao registo de operações; viola o T-01 | Viola o T-01 |

## Consequences

### Positive

- O `plan.js` da B003 não é alterado; as operações existentes (B001–B003) não são afetadas.
- Cada operação nova acrescenta a sua lógica de extras ao `planExtras.js` de forma isolada.
- O ponto de chamada no `tasks.js` é uma única linha nova, fácil de auditar na regra 2.6.
- O plano guardado na tarefa já inclui os extras, o que simplifica a republicação pela rotina (D-41).
- Padrão explícito e documentado para as B005, B007 e B008.

### Negative

- Mais um módulo no serviço de projetos.
- A ordem de aplicação dos extras (primeiro `input`, depois `keyframeCopy`) tem de ser mantida consistente entre os contribuidores.

### Risks

- Se o `plan.js` for alterado numa versão futura (fora deste bolt) de forma incompatível com os extras, o `planExtras.js` pode precisar de revisão. Risco baixo enquanto a regra 2.6 estiver em vigor.
- Se a V2 confirmar que o `plan.js` já passa as propriedades de entrada de cada passo ao worker, o ponto 1 da função não se aplica e pode ser suprimido sem afetar o ponto 2.

## Related

- **Stories**: ST-VID-001 (AC2 — `keyframeCopy`), ST-VID-003 (AC1 — `fps=`)
- **Requirements**: REQ-VID-TRIM-010, REQ-VID-SPEED (taxa de fotogramas preservada, D-52)
- **ADD**: T-01, T-02, secção 2.6
- **Decisões**: D-49, D-52
- **ADRs**: ADR-004 (plano guardado no `VideoTask`), ADR-007 (`keyframeCopy` no worker)
- **Bolts afetados**: B005 (ajuste, marca de água — podem precisar de extras), B007 (conversão — `input.fpsNum/fpsDen`), B008 (cadeias — `keyframeCopy` no primeiro passo)
