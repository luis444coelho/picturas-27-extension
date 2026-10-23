---
bolt: 004-video-basic-edits
unit: 002-video-transformations
stage: implement
created: 2026-10-22T18:05:19Z
status: awaiting-review
---

# Implementação da etapa 4

Código produzido no ramo `bolt/004-video-basic-edits`, para revisão antes da etapa 5. A D-54 (a) foi respondida pela equipa e esclarecida no ADR-008, desenho técnico, índice de decisões e preflight antes da implementação. Não foram reabertas D-49 a D-53, renumerados ADR nem registadas decisões novas. As alterações locais encontradas na retoma foram preservadas e incluídas no trabalho desta etapa.

## Resultado

1. **Serviço de projetos:** operações `trim`, `remove_audio` e `speed` v1, com validação antes da tarefa/quota, estimativas, custo de um crédito e `copyable {video, audio}`. Helper novo de propriedades de recodificação. `planExtras.js` acrescenta o fps de entrada calculado pelo servidor e as duas alternativas de recorte. Usa `encoding.js` para a D-39, sem alterar `plan.js`.
2. **Preview (D-54):** quando necessário à alternativa de cópia e ausente, acrescenta o destino `video_preview/<taskId>.mp4` a partir do destino original, com o mesmo proprietário/projeto. Preserva `plan.preview`, `plan.output`, destinos existentes e assinatura. A chamada em `submit` precede a persistência do plano e a publicação. A republicação e a enumeração dos destinos para resultados tardios continuam a usar o plano persistido da B003. O worker não calcula destinos.
3. **Worker:** filtros `trim`/`atrim`, remoção do áudio pelo mapeamento já existente e `setpts`/`fps`/`atempo`. O adaptador em `_filters` copia localmente os parâmetros de `speed`, sobrescreve `_input` com `step.input` e falha explicitamente para fps ausente, não inteiro, booleano, zero ou negativo. A receita não é mutada.
4. **Keyframe:** FFprobe com PTS relativo ao primeiro fotograma e arredondamento ao ms seleciona uma alternativa já calculada; erro de sondagem recai para encode. O processo de sondagem atende heartbeats/cancelamento e é terminado/recolhido se houver interrupção. A alternativa de cópia remove os filtros de trim, aplica o áudio/preview/genpts recebidos e passa `-ss/-to` ao helper após `build_command`, antes do log/execução. `executor.run`, progresso, cancelamento e argumentos anteriores são preservados.
5. **Metadados:** o modo executado fica limitado à entrega atual. É reinicializado antes de cada entrega, inclusive reentrega e descarte por cancelamento, e limpo no final. `_reply` publica `metadata.videoMode` apenas em `completed` quando definido pela execução B004. A ingestão e os retornos/assinaturas existentes permanecem iguais.
6. **Frontend:** painéis de recorte (introdução ao ms, scrubbing e loop local), remoção de áudio com confirmação explícita e velocidade com predefinições/fator manual. Usam `useCanEditProject`, metadados da API, validação com debounce e rejeição de respostas antigas. A sessão nova usa a API e `useVideoTask` da B003; `VideoTaskProgress` é montado no painel e, ao fechar, junto das ações. O acompanhamento mantém-se montado enquanto o leitor existir, com recuperação da tarefa ao reabrir e invalidação da galeria pela B003. Não foram reconstruídas as peças comuns.

## Verificações realmente executadas

1. **Passou:** TypeScript de todo o frontend (`tsc --noEmit --incremental false`), numa cópia temporária com as dependências do contentor existente.
2. **Passou:** ESLint dos oito ficheiros TS/TSX novos e do `video-player.tsx` com o ponto de montagem. Prettier aplicado apenas aos treze ficheiros JS/TS/TSX novos; nenhum ficheiro existente foi reformatado.
3. **Passou:** sintaxe Python dos oito ficheiros novos/estendidos por AST, sem gerar bytecode no repositório; sintaxe Node e carregamento dos módulos novos.
4. **Passou:** 58 asserções isoladas JS, com as dependências do serviço de projetos: registo; validações; estimativas; fps fracionário; cópia AAC, recodificação MP3 e áudio ausente; AVI/genpts; dimensões ímpares; destino preview; preservação de decisões/destinos; forma Mongoose offline (o plano Mixed conserva `input`/destinos e a receita não ganha `input`). Sem ligação à base de dados.
5. **Passou:** verificações isoladas Python no worker: fps do servidor prevalece sobre `_input` do cliente; receita intacta; fps inválido falha; filtros `fps`/`atempo`; lista de argumentos preservada; cópia e recuo com sondagem de keyframe substituída; ciclo real `TaskRunner.run`/`_reply` com I/O substituído, incluindo entrega B004 seguida de entrega anterior e descarte cancelado sem fuga de `videoMode`. Sem FFmpeg nem publicação AMQP.
6. **Passou:** seis asserções dos utilitários do frontend (timecode, duração/fator e predefinições), executadas com TypeScript transpilado em memória, sem browser.
7. **Passou:** `git diff --check` e auditoria por comparação das linhas originais com a árvore local. Nos seis ficheiros de código existentes, cada linha anterior está preservada, na mesma ordem e com os mesmos fins de linha. Inspeção dos hunks confirma apenas imports, registos e chamadas/pontos de ligação novos. Os dezoito ficheiros de código novos foram incluídos na auditoria.

Os scripts de diagnóstico foram temporários, fora do repositório, e não constituem a suite de testes da etapa 5. As dependências e a aplicação em execução não foram alteradas; as cópias e os scripts temporários nos três contentores foram removidos no fim das verificações. Não foi ativada `test_reencode` no compose, nem feito rebuild/restart do stack.

## Pendente para a etapa 5

**Não executados nesta etapa:** integração API/MongoDB/AMQP/storage, FFmpeg/FFprobe 5.1 real, matriz MP4/MOV/AVI/perfis incompatíveis, duração e sincronismo dos ficheiros, uploads e limpeza tardia reais, devolução de quota/falha/cancelamento de ponta a ponta, regressão completa B001–B003 e fluxo de imagem, build de produção, testes automatizados de browser e validação manual dos três painéis. A sondagem de keyframe e os efeitos de infraestrutura foram substituídos nas verificações isoladas e não provam estes resultados.

Na etapa 5, executar a lista do desenho incluindo fps até ao filtro, publicação de modo, inserção das opções e preview na alternativa de cópia. Rebuilds com `--no-deps`; `test_reencode` continua desligada no compose normal. Apresentar a lista de testes manuais e aguardar execução/aprovação da equipa; não presumir testes manuais concluídos.

## Checkpoint

`current_stage: implement` mantido, com revisão pendente; não foi acrescentado `test` nem declarada a conclusão do bolt. Commit/push desta etapa no mesmo ramo; sem merge para main. Aguardar revisão antes de iniciar a etapa 5.

## Auditoria dos diffs

Inclui ficheiros novos; resultados dos comandos e estado do Git acrescentados após colocar todos os ficheiros desta etapa no índice.

Snapshot antes do commit desta etapa, com todos os ficheiros novos no índice:

```bash
git diff --numstat origin/main...HEAD -- . ':!memory-bank' ':!docs'
```

Saída vazia (o HEAD ainda é `91aaad1`, antes do commit da implementação).

```bash
git diff HEAD --numstat -- . ':!memory-bank' ':!docs'
```

```text
2	0	Tools/video/executor.py
76	0	Tools/video/keyframe.py
4	0	Tools/video/ops/__init__.py
10	0	Tools/video/ops/remove_audio.py
15	0	Tools/video/ops/speed.py
12	0	Tools/video/ops/trim.py
15	0	Tools/video/step_input.py
15	0	Tools/video/task.py
111	0	frontend/components/video/use-video-edit.ts
137	0	frontend/components/video/video-edit-actions.tsx
26	0	frontend/components/video/video-edit-status.tsx
36	0	frontend/components/video/video-edit-validation.tsx
2	0	frontend/components/video/video-player.tsx
67	0	frontend/components/video/video-remove-audio-panel.tsx
83	0	frontend/components/video/video-speed-panel.tsx
217	0	frontend/components/video/video-trim-panel.tsx
64	0	frontend/lib/video-edit.ts
3	0	projects/video/operations/index.js
17	0	projects/video/operations/reencodedProps.js
19	0	projects/video/operations/remove_audio.js
29	0	projects/video/operations/speed.js
34	0	projects/video/operations/trim.js
74	0	projects/video/planExtras.js
2	0	projects/video/tasks.js
```

```bash
git status --short
```

```text
M  Tools/video/executor.py
A  Tools/video/keyframe.py
M  Tools/video/ops/__init__.py
A  Tools/video/ops/remove_audio.py
A  Tools/video/ops/speed.py
A  Tools/video/ops/trim.py
A  Tools/video/step_input.py
M  Tools/video/task.py
M  docs/specsDuvidas.md
A  frontend/components/video/use-video-edit.ts
A  frontend/components/video/video-edit-actions.tsx
A  frontend/components/video/video-edit-status.tsx
A  frontend/components/video/video-edit-validation.tsx
M  frontend/components/video/video-player.tsx
A  frontend/components/video/video-remove-audio-panel.tsx
A  frontend/components/video/video-speed-panel.tsx
A  frontend/components/video/video-trim-panel.tsx
A  frontend/lib/video-edit.ts
M  memory-bank/bolts/004-video-basic-edits/adr-008-plan-extras.md
M  memory-bank/bolts/004-video-basic-edits/bolt.md
M  memory-bank/bolts/004-video-basic-edits/ddd-02-technical-design.md
A  memory-bank/bolts/004-video-basic-edits/implementation-preflight.md
A  memory-bank/bolts/004-video-basic-edits/implementation-report.md
M  memory-bank/intents/001-video-processing-support/units/002-video-transformations/construction-log.md
M  memory-bank/standards/decision-index.md
M  projects/video/operations/index.js
A  projects/video/operations/reencodedProps.js
A  projects/video/operations/remove_audio.js
A  projects/video/operations/speed.js
A  projects/video/operations/trim.js
A  projects/video/planExtras.js
M  projects/video/tasks.js
```

Total de código: **1070 linhas acrescentadas, zero removidas, 24 ficheiros** (18 novos e seis pontos de extensão em ficheiros existentes). Após o commit, a comparação `origin/main...HEAD` passa a conter estas alterações, e `git diff HEAD --numstat`/`git status --short` devem ficar vazios. A verificação final é apresentada no checkpoint. `plan.js`, `rabbitMQ/definitions.json`, `docker-compose.yaml` e os fins de linha do código anterior permanecem intactos.
