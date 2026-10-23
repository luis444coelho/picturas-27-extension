---
stage: implement
bolt: 008-video-concat-chain
created: 2026-10-23T01:10:39Z
status: checkpoint
---

# Implementation Report — Junção, cadeias e predefinições de vídeo (B008, etapa 4)

Implementação do `ddd-02-technical-design.md` (com a correção do checkpoint do Estágio 2) e dos ADR-016 a ADR-019, a partir dos pontos de acréscimo do `implementation-preflight.md` (V1 a V14). Regra 2.6: só ficheiros novos e linhas acrescentadas.

## Serviço de projetos

**Novos:**

- `projects/video/compositionLimits.js`: clips por perfil (10/50), mínimo 2, 10 passos; duração a partir do `profiles.js` (V8).
- `projects/video/chainStructure.js`: fase 1 (D-78, D-79, D-85), por esta ordem: `empty_chain`, `frame_extraction` (nome reservado `extract_frames`), `concat_in_preset`, `multiple_concat` (junção num clip ou segunda junção), `concat_not_first`, `convert_not_last` (topo e clips), `CHAIN_TOO_LONG`; contagem N; verificação de operações e versões conhecidas e limpeza dos campos do servidor para as predefinições.
- `projects/video/operations/concat.js`: `concat` v1; `checkClips` (`INVALID_REQUEST`, `INSUFFICIENT_INPUTS`, `TOO_MANY_INPUTS`); `validate` com a soma das durações (`LIMIT_EXCEEDED {total, limit}`); `estimate` do primeiro clip à saída da sua sub-cadeia, dimensões pares, áudio de qualquer clip; `cost = 1 + Σ passos dos clips` (pelo `chainCost` da B003, V2); `copyable` falso.
- `projects/video/composition.js`: as três fases (D-80, D-81), o `_clips` gravado pelo servidor, a resolução do `_mark` dos passos dos clips e dos passos finais (V13), a aceitação com junção pela `tasks.submit` da B003 com uma entrada por ocorrência (V1), o pré-controlo das cadeias sem junção (fase 2 em memória antes da fase 3; com a fase 2 inválida devolve `null` e a B003 responde `INVALID_STEP_PARAMS`, correção do checkpoint do Estágio 2) e a validação da estrutura das predefinições (ADR-018).
- `projects/video/planExtrasComposition.js`: `plan.composition` (clips com o ficheiro distinto, passos com `input` e extras da B005, saídas; alvo `W×H` e fps; áudio `concat`/`none`), `plan.inputs` só com os vídeos distintos, correção do áudio quando só um clip que não o primeiro tem áudio (V3), `plan.convert.previewInSameInvocation` para cadeias de vários passos terminadas em AVI (V4).
- `projects/routes/videoComposition.js`: router montado entre o da B005 e o de vídeo (V7, V13): `POST …/videos/validate` (com junção e sem `videoId`, respondido aqui; os outros pré-controlados e passados à B003), `POST …/:video/operations` (pré-controlo), `POST …/videos/operations` (junção), `POST /video/chain-structure` (interna, ADR-018).

**Linhas acrescentadas:** `projects/app.js` (+2: `require` e `app.use`), `projects/video/operations/index.js` (+1), `projects/video/errors.js` (+9: cinco códigos no fim do `MESSAGES`), `projects/models/videoTask.js` (+1: `error.phase`), `projects/video/tasks.js` (+18: `require` e chamada do `applyCompositionPlanExtras`; `totalSteps = chainCost` com junção, V1; quatro pontos da fase, V6).

## Serviço de utilizadores e gateway

- `users/models/videoPreset.js` (coleção `videopresets`, índice único `{owner_id, name_key}`) e `users/routes/videoPresets.js` (`GET`, `POST`, `PATCH /:id`, `DELETE /:id` em `/users/:user/video-presets`; JWT do dono, recusa do `anonymous`, nome de 1 a 50 sem distinguir maiúsculas, `PRESET_NAME_TAKEN`, sem limite de número, sem partilha, erros no formato do vídeo). `users/app.js` +2.
- `apiGateway/routes/videoPresets.js`: `checkVideoToken`; em `POST` e em `PATCH` com `steps`, chama o `POST projects:/video/chain-structure` e só depois o serviço de utilizadores (ADR-018). `apiGateway/app.js` +2 (montado em `/users` antes do `usersRouter`); `apiGateway/routes/videos.js` +2 (rota `POST …/videos/operations`). O `apiGateway/routes/users.js` não muda.
- `wsGateway/video.js` +3: `error.phase` no `video-task-update` (V6).

## Worker

- `Tools/video/phase.py`: fase da entrega corrente (D-82).
- `Tools/video/ops/concat.py`: normalização (`scale … force_original_aspect_ratio=decrease:force_divisible_by=2`, `pad`, `fps`, `setsar`, `format=yuv420p`), silêncio (`anullsrc` + `atrim`), `aresample`/`aformat` (48 kHz, estéreo) e o filtro `concat`. Registado em `ops/__init__.py` (+2).
- `Tools/video/composition_task.py` (ADR-017): uma entrada `-i` por ocorrência, sub-grafo por clip, `concat` (`a=0` sem áudio), passos finais, corte de 1 px; saída H.264/AAC ou AVI com a cópia MP4 na mesma invocação; `visual_input.resolve` sobre uma lista achatada (índices das marcas sem colisões); reutiliza `executor.run`, FFprobe, imagens, envio e cancelamento; marca as suas fases.
- `Tools/video/task.py` +13: `import`, `phase.reset()`, fases `download`/`encode`/`upload` no caminho genérico, desvio para o `composition_task` a seguir ao da B007, e uma **linha nova no `_reply`** (entre a `videoMode` e o `taskId`) que acrescenta `error.phase` às respostas `failed` (V6, ADR-019). `Tools/video/convert_task.py` +2 (fase `upload`).

## Frontend

- `frontend/lib/video-chain.ts` (sem dependências de execução): operações elegíveis, contagem e custo, mover e remover, `withConcat` (D-78), regras e mensagens (D-79, D-80, D-85), fase (D-82), aviso de quota (DQ-025, D-74), nome de predefinição.
- `frontend/lib/video-chain-api.ts`: validação e submissão com e sem `videoId` (D-78) e CRUD das predefinições.
- `frontend/components/video/video-chain-step-list.tsx` (lista ordenável com o dnd-kit, setas e remover), `video-chain-step-form.tsx` (configuração das nove operações com os construtores das B004, B005 e B007, sem submeter, V10), `video-chain-editor.tsx` (cadeia, linha temporal, sub-cadeias, validação com *debounce*, custo, duração, `W×H` e fps, erros por endereço, aviso de quota, executar e acompanhar), `video-clip-picker.tsx`, `video-chain-presets.tsx`, `video-task-phase.tsx`, `video-chain-actions.tsx` ("Encadear operações" e "Juntar vídeos").
- Montagem: `video-player.tsx` +2 e `video-section.tsx` +2.

## Verificações feitas nesta etapa

- `git diff --numstat origin/main -- . ':!memory-bank' ':!docs'` (código desta etapa, antes do commit): 36 ficheiros, **+3370, 0 removidas**. Os 13 ficheiros existentes só têm linhas acrescentadas.
- CRLF: os 20 ficheiros de texto com CRLF do repositório continuam inteiramente CRLF e não foram tocados; nenhum ficheiro novo ou alterado tem `\r`.
- TypeScript (`tsc --noEmit`) e ESLint nos ficheiros novos e nas duas montagens: sem erros. Prettier: os ficheiros novos passam no `--check`; as linhas novas nos ficheiros existentes foram formatadas como o Prettier pede (as duas linhas longas antigas das B004/B005 em `tasks.js` ficam como estavam, regra 2.6).
- Testes unitários existentes do serviço de projetos (`node --test`, sem os E2E): **263/263**. O teste do registo da D-37 (`task-domain.test.js`) recebeu uma linha nova que isola a `concat`, como as B004, B005 e B007 fizeram para as suas operações.
- Sondagens isoladas (não substituem a etapa 5):
  - **Grafo da junção com o FFmpeg 9.0.2 do host:** três ocorrências de dois vídeos (320×240 a 25 fps com áudio mono a 44,1 kHz; 241×321 a 30 fps sem áudio e `yuv444p`), com recorte no clip 1, velocidade 2× no clip 2 e rotação final. Resultado: 4,52 s (1 + 1,5 + 2), 240×320 a 25 fps, AAC estéreo a 48 kHz.
  - **Cadeia `adjust` → `convert` AVI:** AVI MPEG-4/MP3 e cópia MP4 H.264/AAC na mesma invocação.
  - **Domínio com o registo real:**
    - estrutura: cada regra e o `CHAIN_TOO_LONG`;
    - validação da junção: custo 3, 65 s, 1280×720 a 30 fps a partir de 1281×721, AAC vindo do segundo clip, e 720×1280 depois da rotação final;
    - extras do plano: `plan.inputs` com 2 ficheiros e as ocorrências `[0, 1, 0]`;
    - erros: `INSUFFICIENT_INPUTS`, um erro de passo com `{index: 0, clipIndex: 1, stepIndex: 0}`, e `LIMIT_EXCEEDED {total: 480000, limit: 300000}` sem junção;
    - ordem das fases: uma cadeia sem junção com parâmetros inválidos que também excederia o limite passa à B003 (`null`).
- **Não executado nesta etapa:** testes do worker (o host não tem `pika`; correm no contentor com o FFmpeg 5.1 na etapa 5), integração pela pilha, serviço de utilizadores com MongoDB, navegador.

## Desvios face ao desenho (registados no preflight)

1. `totalSteps` da junção calculado por uma linha nova no `prepare` do `tasks.js` (V1).
2. Áudio e entradas distintas da junção corrigidos no `planExtrasComposition.js` (V3).
3. Router de composição montado depois do router da B005 e não antes, para as cadeias sem junção já terem o `_mark` (V13). A rota sem `:video` do gateway é uma linha nova no `apiGateway/routes/videos.js`, e não um ficheiro novo (V7).
4. Desvio do `composition_task` só para junções e cadeias de vários passos terminadas em AVI; as terminadas em MOV seguem o caminho genérico (V5, nota no ADR-017).
5. O formulário de passo é um componente novo com os construtores das bibliotecas, porque os painéis das B004 a B007 submetem diretamente (V10).
6. `Tools/video/compiler.py` não existe; o `bolt.md` cita-o por engano.

## Para a etapa 5

Testes persistentes:

- **Unitários (JS):** `chainStructure`, `concat`, `composition`, incluindo o teste pedido no checkpoint do Estágio 2, `planExtrasComposition`, predefinições e `lib/video-chain.ts`.
- **Worker no contentor (FFmpeg 5.1):** junções heterogéneas, clip repetido, nenhum clip com áudio, dimensão ímpar, sub-cadeias com marca de água em dois clips, cadeia terminada em MOV e em AVI, fase em falhas simuladas.
- **E2E pela pilha:**
  - a junção isolada e a composição da CHAIN-009;
  - as rejeições sem tarefa e sem quota;
  - o cancelamento e a falha com devolução de N créditos;
  - `source_video_ids` com repetições;
  - uma só invocação de codificação;
  - as predefinições;
  - a regressão das B001 a B007 e do fluxo de imagem.
- **Testes manuais no navegador.**
