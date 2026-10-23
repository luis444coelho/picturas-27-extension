---
bolt: 004-video-basic-edits
unit: 002-video-transformations
stage: implement
created: 2026-10-22T17:44:38Z
status: implemented-awaiting-review
decision: D-54
---

# Verificações V1–V8 antes da implementação

Base inspecionada: `91aaad1`, ramo `bolt/004-video-basic-edits`. As alterações locais anteriores em `bolt.md` e `construction-log.md`, que já registavam `current_stage: implement` e a aprovação da etapa 3, foram preservadas. A equipa confirmou nesta retoma a passagem à etapa 4. Este documento complementa o desenho aprovado. As ligações foram implementadas na etapa 4, cujo resultado está em `implementation-report.md`; os testes completos da etapa 5 continuam pendentes.

Fontes: ADD v1.1 (2.6, T-01, T-02, T-05, T-06), D-49 a D-53, ADR-004/005/007/008, modelo e desenho da B004, stories ST-VID-001 a 003 e código atual das B001–B003. Não foi usado `docs/merge.md`.

## Resultado das verificações

1. **V1 — Confirmada por inspeção.** `projects/video/operations/index.js:6-25` permite acrescentar `MODULES.push(require(...))` antes de `createRegistry` ser executado na exportação. Colocar as entradas novas antes dessa exportação, fora do bloco de `VIDEO_TEST_OPERATIONS`; acrescentá-las depois da exportação deixaria a instância já criada sem as operações. `Tools/video/ops/__init__.py:6-19` permite imports e `OPERATIONS[...] = ...` adicionais, fora da condição de teste. A operação `test_reencode` mantém-se condicionada nos dois registos.

2. **V2(a) — Passa, sem alterar `plan.js`.** `plan.js:62-63` dá `audio.mode = "none"` quando a entrada **ou** o último `estimate` tem `audioCodec: null`. Basta o `estimate` de `remove_audio` devolver `audioCodec: null`. O executor não mapeia nenhuma stream de áudio nesse modo (`executor.py:48-53`), mesmo sem uma opção literal `-an`; o efeito é descartar todo o áudio. A cópia de vídeo H.264 continua a ser decidida pelo plano existente.

3. **V2(b) — Extras necessários.** `plan.js:147-151` envia só `operation`, `version` e `parameters`; descarta um `input` enviado no passo do cliente. `chain.propsFromMeta` (`chain.js:5-19`) lê `fps_num/fps_den` dos metadados persistidos. O `applyPlanExtras` deverá construir `plan.steps[i].input = {fpsNum, fpsDen}` com esses valores, propagados pelos `estimate`, nunca a partir de campos do cliente. É também necessário o adaptador descrito abaixo para chegar a `speed.py`.

4. **V2(c) — Forma confirmada; lacuna em D-54.** O `genpts` normal está em `plan.output.genpts` (`plan.js:84`), enquanto a alternativa o transporta em `keyframeCopy.video.genpts`, conforme ADR-007. Ao resolver a cópia, o helper tem de o colocar em `output.genpts`, juntamente com os modos de vídeo/áudio, omitir `dropStep` e selecionar `keyframeCopy.preview`. `plan.preview` tem `{browserProfile, whenCompatible, whenIncompatible}` (`plan.js:93-114`); os ramos são produzidos por `formats.previewPlan`. O plano normal de trim MP4 recodificado tem `preview: null` e não tem `targets.preview`. A alternativa de cópia pode precisar desse destino: a extensão foi autorizada pela D-54 (a).

5. **V3 — Ponto de chamada confirmado.** Acrescentar a chamada a `applyPlanExtras(plan, steps, chain.propsFromMeta(inputVideos[0].meta), registry)` depois de `tasks.js:337`, antes de `VideoTask.create` (`:341`). O `plan` é `const`, mas o objeto permite acrescentar os campos aprovados. O plano completo é guardado em `plan` (`:357`) e publicado depois (`:387`); `taskMessage` usa o plano persistido (`:102`). `validate` (`:261-279`) usa `prepare`/`plans.decide`, sem destinos, e não precisa dos extras. A D-54 (a) autoriza o acréscimo de `targets.preview` no próprio `applyPlanExtras`, antes da persistência/publicação.

6. **V4 — Reutilização do comando confirmada.** `executor.build_command` devolve uma lista de argumentos (`executor.py:30-73`). Em `task.py`, há espaço entre a construção (`:188`) e o log/execução (`:190-197`) para uma chamada adicional a um helper novo que insere `-ss/-to` antes do primeiro `-i`. Não é necessário substituir o comando completo nem alterar `build_command`. O executor já lida com vídeo/áudio copiados, áudio recodificado sem filtros (`anull`) e ausência de grafo. A duração de progresso é a do intervalo em `expectedDurationMs`.

7. **V5 — Pontos confirmados; transporte novo necessário.** Depois do download (`task.py:180-184`) e antes de `build_command`, resolver a alternativa com `keyframe.py`. `video_msg.build_reply` só cria `metadata.processingTime` e não transfere campos de `output`. Acrescentar a ligação em `TaskRunner._reply` antes de `_publish` (`task.py:114-119`), conforme o transporte abaixo. O upload de preview usa obrigatoriamente `targets['preview']` (`:222-223`); o worker não deve calcular esse destino. D-54 (a) aprovada.

8. **V6 — Ficheiro novo necessário.** `operations/test_reencode.js:5-29` só exporta a operação; `estimate` devolve uma cópia das propriedades e não exporta helper de recodificação. Criar `operations/reencodedProps.js` como previsto. Reutilizar `encoding.js` para os codecs/opções da D-39, sem alterar `test_reencode` nem `plan.js`.

9. **V7 — Integração do frontend confirmada por inspeção.**
   - (a) `video-player.tsx` recebe `{target, video}` e monta `VideoActions` na linha 92; permite acrescentar import e `VideoEditActions` adjacente. `ProjectVideo` (`lib/videos.ts:7-17`) não inclui `meta` nem permissão: os painéis novos devem obter metadados pelo `useVideoInfo`/`fetchVideoInfo` existente, sem mudar a assinatura do leitor ou a estrutura da listagem.
   - (b) Reprodução por `fetchVideoPlayback(target, video.id)` (`lib/videos.ts:128`); o servidor escolhe o preview. Usar um elemento `<video>` próprio do painel de trim, como previsto no desenho.
   - (c) `useVideoTask` já invalida `["projectVideos", projectId]` ao receber `completed` (`use-video-task.ts:47-50`), prefixo usado pela galeria e pela lista principal; não é necessário reconstruir o refrescamento. Os painéis precisam de manter montado o acompanhamento durante a tarefa.
   - (d) O hook é `useCanEditProject` (`providers/project-provider.tsx:343`), com recusa adicional de `session.user.type === "anonymous"` nos componentes novos. Não existe `useCanEdit` para esta integração.
   - (e) `video-info-panel.tsx:137-153` já apresenta qualquer `recipe`, com `step.operation` e parâmetros, sem catálogo de nomes traduzidos; os identificadores novos aparecem por esse caminho sem alterar o painel da B002.
   - (f) Existem `components/ui/dialog.tsx` e `alert-dialog.tsx`; reutilizar a confirmação explícita para remoção de áudio. Montar `lib/video-tasks.ts`, `use-video-task.ts` e `video-task-progress.tsx` da B003 nos painéis (D-47).

10. **V8 — Confirmada.** `formats.OUTPUT_CODECS.mp4.video === "h264"` (`formats.js:100-103`). Usar esse dado para a elegibilidade da cópia, e `formats.previewPlan`/`BROWSER_PROFILE` para a alternativa de preview. O worker recebe essas decisões; não replica a matriz.

## Ligações por acréscimo, antes de implementar

### FPS até ao `speed.py`

O caminho existente termina em `_filters`, que só entrega `step.parameters` aos módulos (`executor.py:22-27`). Adicionar apenas `step.input` no serviço de projetos não resolve essa ligação.

Proposta técnica sem mudança de assinaturas: criar um adaptador novo em `Tools/video/step_input.py`, importá-lo por uma linha nova no executor e acrescentar uma chamada dentro do ciclo de `_filters`, antes da chamada existente ao módulo. Para passos diferentes de `speed`, o adaptador devolve o passo recebido sem alterações. Para `speed`, devolve uma cópia local do passo e de `parameters`, com um campo interno `_input` sobrescrito pelo `step.input` calculado pelo serviço de projetos. Não altera a receita nem o plano persistido. `speed.video_filters(parameters)` lê esse campo interno para formar `fps=<fpsNum>/<fpsDen>`; `audio_filters(parameters)` mantém o contrato existente.

Um `_input`/fps enviado pelo cliente em `parameters` nunca prevalece: o adaptador sobrescreve-o com a entrada do plano. Se o `input` de um passo `speed` estiver ausente ou mal formado, o adaptador falha em vez de recorrer aos parâmetros do cliente. O passo novo ainda não existe em tarefas anteriores das B001–B003. Testar o valor fracionário, a ausência do campo e a tentativa de sobreposição na etapa 5. Esta ligação acrescenta um ponto em `executor.py` além dos ficheiros enumerados no desenho, autorizado pela regra 2.6; não muda nenhuma assinatura nem linha existente.

### `-ss/-to` depois de `build_command`

O `keyframe.py` deverá resolver o plano numa cópia local, sem mutar a mensagem recebida, e devolver o modo efetivamente escolhido. No ramo de cópia, guarda localmente as opções de entrada do intervalo aprovado. Um helper novo insere-as na lista devolvida pelo executor, imediatamente antes do `-i` da única entrada da B004. A chamada entra após `cmd = executor.build_command(...)` e antes de logar/executar.

Sem opções de recorte, o helper devolve o comando anterior sem alteração. Com cópia, conserva todos os argumentos já construídos, incluindo `-fflags +genpts`, os mapas, os codecs, `-progress pipe:1` e o destino. Mantêm-se `executor.run`, `wait`, `on_progress`, `is_cancelled` e `expectedDurationMs`. Falha da sondagem de keyframe seleciona a recodificação e não injeta `-ss/-to`. A composição e a posição foram demonstradas numa sondagem em memória; precisão temporal com FFmpeg 5.1 ainda por testar.

### `metadata.videoMode` antes da publicação

O modo precisa de viajar desde a resolução/execução até `_reply`. Uma ligação possível sem mudar as assinaturas nem o retorno existente de `_execute` é um atributo novo do `TaskRunner`, limitado à entrega atual: inicializado e reiniciado antes de cada entrega (incluindo reentregas e descarte por cancelamento), preenchido em `_execute` com o modo escolhido para a operação B004. Para `trim`, é o resultado real de `resolve_keyframe_copy`; sem alternativa elegível, é `encode`. Para as outras operações B004, corresponde ao modo do plano executado.

Em `_reply`, acrescentar `metadata.videoMode` apenas em `completed` e quando esse modo tiver sido definido nesta execução. Não alterar `video_msg.py`, não confiar em campos do pedido para o modo, não atribuir o modo às mensagens da ingestão e não o deixar passar de uma tarefa para a seguinte. O log de keyframe usa o mesmo valor. Testar publicação real, cópia, recuo, `started`/falha/cancelamento sem modo e entregas consecutivas na etapa 5. O worker executa uma entrega de cada vez, como já documentado na B003.

### Destino do preview e limpeza tardia — D-54 (a) aprovada

O plano persistido deve conter a união dos destinos de que as alternativas possam precisar. Para um trim MP4 elegível para cópia, a D-54 aprovada autoriza acrescentar `targets.preview = {userId, projectId, stage: "video_preview", name: "<taskId>.mp4"}` no serviço de projetos. Os identificadores e o nome são derivados do destino MP4 `original` já calculado por `buildPlan`; não precisam de novos argumentos na assinatura do ADR-008.

Manter `plan.preview = null` e o plano normal de recodificação. `keyframeCopy.preview` usa a forma da B003, com o perfil do navegador e os dois ramos calculados por `formats.previewPlan` para o **resultado MP4**, incluindo o áudio da saída. Ao selecionar cópia, o worker aplica essa alternativa; o FFprobe do resultado escolhe se a preview é necessária. Num H.264 compatível, nenhuma preview é produzida; num incompatível, é gerada a cópia H.264 `yuv420p` do resultado. O destino fica conhecido mesmo se não for utilizado.

`VideoTask.plan` é `Mixed` (`models/videoTask.js:52`) e conserva os destinos; `taskMessage` republica esse plano sem recalcular. `tasks.js:198-201` enumera todos os destinos; o tratamento de resultado tardio (`:530-543`) e a corrida perdida para cancelamento (`:560-564`) eliminam a união das chaves recebidas com esses destinos persistidos. Assim, a limpeza abrange a preview mesmo quando a resposta não a enumera. `resultVideo` já grava `preview_key` quando produzida (`:480`), e a limpeza de recursos de projetos apagados já a inclui (`maintenance.js:152-161`). Mantêm-se as garantias e os limites existentes da B003; isto ainda não foi exercitado numa integração.

A D-54 (a) foi aprovada pela equipa. A secção 3 do ADR-008 foi esclarecida: `applyPlanExtras` pode acrescentar apenas esse destino quando ausente e necessário a alguma alternativa. Preserva `plan.preview`, `plan.output`, destinos existentes e assinatura. O worker usa o destino recebido, sem o calcular. Não foi criado ADR adicional.

## Verificação anterior à implementação (histórico)

1. **Passou:** inspeção de V1–V8 no código, com a incompatibilidade documental de preview identificada na D-54. Viabilidade por acréscimo identificada para fps, opções de entrada e publicação de metadados; as ligações ainda não existem.
2. **Passou:** sondagem Node em memória do `plan.js` existente, com substituição apenas de `storage.parseKey` para evitar a dependência HTTP: `remove_audio` sintética dá `audio: none`/vídeo copiado; os passos não conservam `input` do cliente; trim sintético recodificado omite `preview`/`targets.preview`; a política existente exige preview recodificada para H.264 `yuv444p` copiado. Os módulos de operações usados nessa sondagem são substitutos de diagnóstico, não implementação das operações da B004.
3. **Passou:** sondagem Python das funções `_filters`/`build_command` extraídas do AST do executor existente, sem dependências do worker: confirma ausência do fps na chamada ao filtro e demonstra inserção de `-ss/-to` antes de `-i`, preservando o resto da lista, `+genpts`, a ausência de grafo na cópia e `-progress`.
4. **Limitação local:** o carregamento direto do módulo Node não está disponível por falta de `axios` no host; a sondagem usou o módulo em memória com o substituto de `parseKey`, sem instalar dependências. Não se verificou a pilha com essa sondagem.
5. **Não executado:** implementação, lint, FFmpeg 5.1, publicação AMQP, MongoDB/storage, regressão B001–B003/imagem e testes manuais no browser. Nenhum resultado da etapa 5 é presumido.

## Checkpoint

A equipa aprovou a D-54 (a) e autorizou implementar a etapa 4. O ADR-008, o desenho e o índice foram esclarecidos antes do código. As verificações e a auditoria da implementação serão registadas separadamente no relatório da etapa 4. A auditoria abaixo é a da paragem anterior, antes de implementar.

## Auditoria desta paragem

Nota posterior, etapa 5: a auditoria abaixo é histórica da paragem antes da implementação. As verificações reais, correções de precisão/sincronismo e decisões D-55/56/57 estão no relatório de testes. D-56 acrescenta consulta explícita de controlo no canal existente (ADR-009); D-57 permite recodificar se o fim não for representável por cópia. O helper continua depois de `build_command`, preservando `executor.run` e os argumentos anteriores; acrescenta localmente a compensação da origem temporal e o limite de fotogramas na cópia segura, ou o limite de duração na velocidade com áudio. `plan.js` continua intacto.

Os dois comandos abaixo devolveram saída vazia:

```bash
git diff --numstat origin/main...HEAD -- . ':!memory-bank' ':!docs'
git diff HEAD --numstat -- . ':!memory-bank' ':!docs'
```

Zero linhas de código acrescentadas ou removidas; sem hunks de código para rever. Os hunks documentais acrescentam a D-54 e esta nota de retoma, preservando as alterações locais anteriores. `git diff --check` passou. O relatório novo ainda está por adicionar ao Git e foi inspecionado como ficheiro; os comandos `git diff` não incluem ficheiros não rastreados.

`git status --short`:

```text
 M docs/specsDuvidas.md
 M memory-bank/bolts/004-video-basic-edits/bolt.md
 M memory-bank/intents/001-video-processing-support/units/002-video-transformations/construction-log.md
?? memory-bank/bolts/004-video-basic-edits/implementation-preflight.md
`
