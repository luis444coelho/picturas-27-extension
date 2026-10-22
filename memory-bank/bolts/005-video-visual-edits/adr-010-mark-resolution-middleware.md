---
bolt: 005-video-visual-edits
created: 2026-10-22T20:39:40Z
status: accepted
superseded_by: null
---

# ADR-010: Dimensões da marca de água gravadas pelo servidor em `parameters._mark`, antes da validação

## Context

A REQ-VID-WATERMARK-005 define a escala da marca como uma fração da largura do quadro, e a RN3 do UC-VID-004 exige que a marca caiba inteira no quadro. Para verificar os limites antes de criar a tarefa, a altura da marca tem de ser conhecida, e essa altura depende da proporção da imagem carregada ou do texto gerado (D-59, D-61).

O `validate(parameters, inputProps, profile)` do registo de operações (T-01) é síncrono e é chamado pelo `chain.validateChain` da B003, a partir do `tasks.js` (`prepare`), no `…/validate` e na aceitação `…/:video/operations`. Nenhum destes pontos pode mudar (regra 2.6), e nenhum lê a coleção `video_watermarks` nem gera texto. Os dados não podem vir do cliente (T-01: as propriedades de entrada são sempre lidas pelo servidor).

## Decision

Um router novo, `projects/routes/videoVisual.js`, é montado por uma linha nova em `projects/app.js`, **antes** do router de vídeo da B001. Nos pedidos `POST …/videos/validate` e `POST …/videos/:video/operations`, um *middleware*:

1. Remove sempre `parameters._mark` de todos os passos `watermark` do corpo. Um valor enviado pelo cliente nunca chega à validação.
2. Repete a autorização de `canEdit`, sem responder: link de partilha válido com permissão `edit`, projeto existente, chamador `free` ou `premium`. Se falhar, passa o pedido sem `_mark`, e o router da B001 recusa-o com os códigos habituais. Nada é escrito no storage sem autorização.
3. Resolve cada marca (`projects/video/watermarks.js`):
   - **Imagem:** lê `video_watermarks` pelo `watermarkId` e pelo projeto.
   - **Texto:** gera o PNG com o sharp (DejaVu Sans, branco, D-59). Na aceitação, guarda-o (`video_src/wm-<id>.png`) e regista-o, um registo por projeto e texto (*hash*). No `…/validate`, só o mede em memória.
4. Grava `parameters._mark = {watermarkId?, width, height}` e passa o pedido ao router da B001.

O `watermark.validate` usa o `_mark`. Sem ele, responde `INVALID_WATERMARK_CONTENT`. As rotas novas de pré-visualização da marca (D-62) usam a mesma resolução.

## Rationale

- A regra fica no serviço de projetos e os dados vêm sempre do servidor, como o `_input` da B004 no worker.
- Nenhuma linha do `chain.js`, do `tasks.js` nem do router da B001 muda, e a assinatura do `validate` mantém-se.
- Escrever só depois da autorização evita que pedidos não autorizados criem objetos no storage de outro utilizador.

### Alternatives Considered

- **Escala nas duas dimensões (D-61 b):** dispensava o *middleware*, mas falhava o critério "exatamente 20% da largura" da WATERMARK-005.
- **Dimensões enviadas pelo cliente:** contraria o T-01, porque não se podem verificar no `validate` síncrono.
- **Validar os limites só no worker:** a falha seria tardia, depois de reservar quota (contraria a ST-VID-004, AC2).

## Consequences

### Positive

- Os limites são verificados antes da tarefa e da quota, com a mesma geometria (`watermarkGeometry.js`) na validação, no plano (ADR-011) e na pré-visualização.
- A `recipe` guarda o `_mark.watermarkId`, o que torna o resultado reproduzível. A limpeza da D-60 usa esse campo.

### Negative

- A autorização dos dois routers é feita duas vezes nestes pedidos (mais leituras de `Project` e do tipo de utilizador).
- A `recipe` inclui um campo de servidor (`_mark`). Quando uma receita é reutilizada (B008), o *middleware* volta a calculá-lo.

### Risks

- Uma marca de texto guardada numa aceitação que depois falha (lugar ocupado, quota) fica sem referência e é apagada pela limpeza ao fim de 24 h (D-60).

## Related

- D-59, D-60, D-61 e D-62; ADR-011; ADR-008 (padrão do `_input` e dos extras do plano).
