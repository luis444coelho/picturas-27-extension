---
bolt: 005-video-visual-edits
created: 2026-10-22T20:39:40Z
status: accepted
superseded_by: null
---

# ADR-011: `planExtrasVisual.js` e ponte `visual_input.py` para os extras do plano da B005

## Context

O T-07 manda o plano levar a entrada completa do filtro escolhido, porque o worker não tem cópia do catálogo. A marca de água precisa de levar a origem do PNG no storage e a geometria final. O ADR-008 apresenta o `planExtras.js` como o padrão para estes casos, mas o `applyPlanExtras` sai logo quando não há `trim`, `remove_audio` nem `speed`, e essa lista é uma linha existente (regra 2.6).

No worker, o `executor._filters` passa a cada módulo só os `parameters` (com o `with_filter_input` da B004, que só trata a `speed`). Os campos do plano não chegam aos módulos.

## Decision

1. **Serviço de projetos:** o módulo novo `projects/video/planExtrasVisual.js` exporta `applyVisualPlanExtras(plan, steps, inputProps, registry)`, com a mesma assinatura e o mesmo padrão do ADR-008. É chamado por uma linha nova em `tasks.js`, logo a seguir à do `applyPlanExtras`. Acrescenta:
   - `plan.steps[i].filter = {id, type, matrix?}`, a entrada do `filters.json`;
   - `plan.steps[i].mark = {watermarkId, source, x, y, width, height, opacity}`, com a origem `video_src/wm-<watermarkId>.png` no *bucket* do dono e a caixa em píxeis de apresentação, calculada com as propriedades estimadas na entrada do passo.

   Não toca em nenhum campo da B003 nem da B004. Sem passos `filter` nem `watermark`, devolve o plano sem alterações.
2. **Worker:** o módulo novo `Tools/video/visual_input.py` é chamado por duas linhas novas no `task.py`, depois do bloco do *keyframe* e antes do `build_command`, só quando há passos `filter` ou `watermark`. Faz uma cópia do plano e, nela:
   - passa a entrada do filtro para `parameters._filter`;
   - descarrega a marca para `mark<i>.png` na pasta da tarefa e passa-a em `parameters._overlay`.

   Os valores do cliente com esses nomes são removidos. O plano persistido e a `recipe` não mudam.
3. **Filtro da marca no grafo único:** o `build_command` monta uma só cadeia linear `[0:V:0]…[v]`. O passo `watermark` fecha a cadeia com uma etiqueta, abre a fonte `movie=<png>,format=rgba,scale,colorchannelmixer=aa=<opacidade>` e continua a cadeia a partir do `overlay`. O resultado é um único `-filter_complex` válido, sem segunda entrada `-i` e sem alterar o `executor.py`. Continua a haver uma só recodificação (NFR-012).

## Rationale

- Segue o padrão do ADR-008 (módulo novo e uma linha de chamada) e a opção (b) da D-54, que a equipa já considerou válida.
- O worker continua sem regras de negócio: só copia dados do plano para os parâmetros locais dos módulos, como o `with_filter_input`.

### Alternatives Considered

- **Alterar a lista do `planExtras.js`:** proibido pela regra 2.6.
- **Catálogo no worker:** contraria o T-07 e o T-01.
- **Segunda entrada `-i` para a marca:** obrigava a mudar o `build_command` (mapeamentos `0:a:0` e lista de entradas).

## Consequences

### Positive

- As B007 e B008 podem acrescentar extras da mesma forma: um módulo novo e uma linha.
- A geometria da marca é calculada uma vez, no serviço de projetos.

### Negative

- Há dois módulos de extras e duas linhas de chamada sucessivas no `tasks.js`.
- O caminho do PNG entra no texto do grafo. O módulo recusa caminhos com caracteres especiais do *filtergraph*, e o caminho é sempre `/tmp/video/<taskId>/mark<i>.png`.

### Risks

- A fonte `movie` produz um só fotograma. O `overlay` usa `eof_action=repeat` para o manter em todos os fotogramas (WATERMARK-010). Isto é verificado nos testes da etapa 3.

## Related

- D-60, D-61 e D-63; ADR-008; ADR-010; ADR-004 (o plano persistido é reutilizado na republicação).
