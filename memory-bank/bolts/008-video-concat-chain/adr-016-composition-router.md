---
bolt: 008-video-concat-chain
created: 2026-10-23T00:47:57Z
status: accepted
superseded_by: null
---

# ADR-016: Router de composição antes do router de vídeo, com as três fases e o `_clips` gravado pelo servidor

## Context

A B008 tem de validar as cadeias em três fases pela ordem estrutura → passos → limites (ADD 4.9, D-80), aceitar junções numa rota sem `:video` (ADD 4.8, D-78) e dar ao `validate` e ao `estimate` da `concat` as propriedades de cada clip à saída da sua sub-cadeia. A aceitação, o `chain.validateChain` e o registo de operações da B003 não fazem a fase 1 nem a fase 3, só conhecem uma entrada por pedido, e a assinatura `validate(parameters, inputProps, profile)` não traz as propriedades dos clips. A regra 2.6 proíbe mudar essas linhas.

## Decision

1. Um router novo, `projects/routes/videoComposition.js` (com o par no gateway, se a V7 o exigir), montado antes do router de vídeo e do router da B005 que grava o `_mark`, intercepta `POST …/videos/validate`, `POST …/videos/:video/operations` e a rota nova `POST …/videos/operations`.
2. Corre a fase 1 (`chainStructure.checkStructure`, D-79) e responde 422 se falhar.
3. **Com junção:** lê os `videos.meta` dos clips distintos, faz os passos 4 e 5 da aceitação por clip, valida cada sub-cadeia com o `chain.validateChain` da B003 (erros em `{index, clipIndex, stepIndex}`), grava `parameters._clips = [{videoId, input, output}]` por cima do que o cliente enviar, valida a cadeia de topo, corre a fase 3 e trata o pedido por inteiro: no `validate` responde 200; no `operations` chama as funções de aceitação do `tasks.js` com a lista de entradas (V1).
4. **Sem junção:** corre a fase 2 em memória (`chain.validateChain` com os `videos.meta` do vídeo da rota). Se falhar, faz `next` sem responder, e é a B003 que devolve o `INVALID_STEP_PARAMS`. Só com a fase 2 válida corre a fase 3 (`LIMIT_EXCEEDED` do resultado final); sem erros, `next`, e o pedido segue sem mudanças pela B003.
5. A rota com `:video` e uma junção, ou a rota sem `:video` sem junção no início, dá 422 `INVALID_REQUEST {field: "steps"}` (D-78).

## Rationale

O padrão já foi aceite no ADR-010 (*middleware* montado antes do router de vídeo que grava um campo do servidor nos `parameters` antes da validação). Mantém a B003 como única dona da aceitação, do plano, do lugar, da quota e da fase 2 das cadeias sem junção, e põe a ordem da D-80 num só sítio.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Acrescentar as fases 1 e 3 e a junção ao `tasks.js` e ao `chain.js` | Um só caminho | Muda linhas e assinaturas da B003 | Regra 2.6 |
| Mudar a assinatura do `validate` para receber as propriedades dos clips | Contrato explícito | Muda o registo e todas as operações | Regra 2.6 |
| Fase 3 sem fase 2 prévia no router (a primeira versão do desenho) | Menos cálculo | Uma cadeia com parâmetros inválidos podia receber `LIMIT_EXCEEDED` em vez de `INVALID_STEP_PARAMS` | Corrigida no checkpoint do Estágio 2 |
| Router de cadeias completamente separado, sem passar pela B003 | Controlo total | Duplica a aceitação, o plano e a quota | Duas implementações a manter |

## Consequences

### Positive

- A ordem estrutura → passos → limites vale com e sem junção.
- A `concat` é uma operação do registo como as outras: o `plan.js` e o `expectedDurationMs` usam o seu `estimate` sem mudanças.
- As cadeias sem junção continuam a sair da B003 com as mesmas respostas.

### Negative

- A fase 2 corre duas vezes nas cadeias sem junção (no router e na B003); é um cálculo em memória.
- O `_clips` fica no `recipe` do resultado, como o `_mark`.

### Risks

- Um pedido que chegue ao registo sem passar pelo router (por exemplo, uma rota futura) daria uma `concat` sem `_clips`: o `validate` da `concat` rejeita-o com `INVALID_REQUEST {field: "clips"}`.
- A V1 pode mostrar que o `tasks.js` não tem um ponto de entrada com várias entradas; nesse caso regista-se uma dúvida e para-se.

## Related

- **Stories**: ST-VID-013, ST-VID-014
- **Standards**: regra 2.6; T-01, T-03, 4.8, 4.9
- **Previous ADRs**: ADR-008, ADR-010, ADR-011
- **Dúvidas**: D-78, D-79, D-80, D-81; verificações V1, V2, V7, V13, V14

## Impacto da D-86 (revisão da B008)

A equipa retirou os limites fixos de quantidade (D-86): a fase 1 deste router deixa de devolver o `CHAIN_TOO_LONG` (10 passos), e o `concat.checkClips` deixa de devolver o `TOO_MANY_INPUTS` (10/50 clips), em todos os perfis. O resto da decisão mantém-se:

- a ordem estrutura → passos → limites (D-80);
- as regras da D-79 e da D-85;
- a contagem N, que passa a servir só para o custo e para o `totalSteps`;
- o mínimo de 2 clips (`INSUFFICIENT_INPUTS`);
- os limites de duração e de tamanho por perfil (D-81);
- a quota dos Registados, verificada antes da tarefa (B003);
- o `_clips` gravado pelo servidor.

**Proteção técnica (D-88 a):** não há limite novo. Os limites que já existem são os 100 kB do `express.json`, os 16 MB do documento do `VideoTask` e os recursos do worker. Um 413 passa a `INVALID_REQUEST {field: "steps", reason: "too_large"}` no gateway de vídeo. A etapa 5 mede uma junção de 100 clips curtos e uma cadeia longa num Premium; se alguma falhar, regista-se uma dúvida com o teto configurável da opção (b).

**O router passa a responder também a `POST …/videos/chain/validate`.** A resposta é a do `…/validate`, mais as propriedades estimadas à entrada de cada passo, para os componentes de configuração das composições (ADR-020).
