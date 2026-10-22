---
stage: test
bolt: 004-video-basic-edits
created: 2026-10-22T19:07:25Z
status: complete
---

# Relatório de testes — etapa 5 da B004

A equipa aprovou a etapa 4 (`6a72c67`) e autorizou esta etapa. O bolt continua `in-progress`, em `current_stage: test`; os testes manuais e a aprovação da equipa permanecem pendentes. Não foi executado `bolt-complete.cjs` nem feito merge.

## Resultados executados

| Suite/verificação | Resultado real |
| --- | --- |
| JS do serviço de projetos, incluindo regressão unitária B001–B003 | **154/154 passaram**, 32 novos |
| Python do worker, incluindo FFmpeg/FFprobe reais e regressão B001/B003 | **56/56 passaram**, 12 novos |
| Funções/estado do frontend, incluindo regressão B001–B003 | **50/50 passaram**, 27 novos |
| Integração real B004 e regressão de imagem | **15/15 passaram**, incluindo teardown; 77,82 s na execução final |
| Build de produção do frontend pelo Dockerfile (`bun run build`) | **Passou**, Next.js 15.1.3; geração das 13 rotas |
| TypeScript `tsc --noEmit --incremental false` | **Passou** |
| ESLint das fontes novas do frontend | **Passou**, sem erros/avisos nesses ficheiros |
| Auditoria `git diff --check` | **Passou** |
| Browser automatizado | **Não executado**: `playwright-core`, `@playwright/test` e Chromium não encontrados no ambiente verificado |
| Browser manual | **Passou** (equipa, 2026-10-22): recorte, recorte inválido, remover áudio, vídeo sem áudio, velocidade, cancelamento, regressão de vídeo e de imagem; ver [checklist](manual-test-checklist.md) |

As suites opt-in não foram contadas como aprovadas por estarem skipped. Os resultados históricos da B003 não são reutilizados como resultados desta etapa. Os comandos completos estão em [README-b004.md](../../../projects/test/video/README-b004.md) — a partir deste diretório, o caminho no repositório é `projects/test/video/README-b004.md`.

**Total: 275 casos distintos aprovados, zero falhas na execução final de cada suite.** As verificações de build, lint e tipos não são somadas a esse total.

Ambiente executado: Python 3.11, FFmpeg e FFprobe **5.1.9-0+deb12u1**, Pika **1.3.2**; Node **26.12.1** do serviço de projetos para JS e `.mts`; Next.js/Bun da imagem do frontend. Os rebuilds usaram `docker compose up -d --no-deps --build ...`, inicialmente projetos/worker/frontend e depois só os serviços cujo código mudou. Não foram alterados compose, configuração global do SeaweedFS nem a operação de teste dos serviços em execução. `VIDEO_TEST_OPERATIONS=1` existiu apenas nos subprocessos unitários; `test_reencode` permaneceu desligada no compose normal.

## Cobertura medida

Cobertura nativa do Node nos 154 testes: **95,16% das linhas, 87,26% dos ramos e 91,41% das funções** dos módulos carregados do serviço de projetos. `trim.js`, `remove_audio.js`, `speed.js`, `reencodedProps.js` e `planExtras.js`: **100% de linhas**; `planExtras.js`: **82,14% de ramos**. As funções `cost`/`copyable` de alguns módulos novos não têm todas as chamadas medidas (75% de funções nesses módulos); não se apresenta cobertura de linhas como cobertura total de funções.

Não se mediu cobertura Python, DOM/React ou cobertura global do repositório. A percentagem acima não se aplica a esses âmbitos.

## FFmpeg/FFprobe: testes persistentes e precisão

`Tools/video/tests/test_basic_edits.py` gera fixtures próprias com número visível de fotograma, GOP de 30, B-frames, áudio AAC/MP3, MP4/MOV/AVI, taxa 30 e 30000/1001, H.264/MPEG-4, vídeo 129×97 `yuv444p`, rotação de 90° e início temporal de +5 s. Usa `TemporaryDirectory` e exige a versão 5.1 das duas ferramentas.

1. **Recorte:** início zero e em keyframe; fora do keyframe; fim em keyframe e dentro de grupo de B-frames; taxa fracionária; PTS iniciais não nulos; AVI H.264 sem PTS verificáveis e AVI MPEG-4. Na cópia segura, os hashes dos fotogramas descodificados coincidem exatamente com o segmento de origem. Na recodificação, confirma número de fotogramas e compara os limites visuais com os fotogramas de origem e os seus vizinhos. A numeração visível torna a comparação resistente à compressão com perdas. A tolerância das durações de streams é **um fotograma**; `format.duration`, serializado em ms, usa esse fotograma arredondado ao ms superior.
2. **B-frames e D-57:** o teste numerado revelou que copiar 35 pacotes podia trocar o fotograma 64 pelo 65 e dar 1,202 s para o intervalo de 1,136 s. A equipa aprovou D-57 (a). A análise dos PTS dos pacotes recusa esse prefixo e seleciona a recodificação já persistida. Um intervalo fracionário representável de 1001–2002 ms continua a copiar com hashes exatos. Não se alargou a tolerância.
3. **Origem temporal:** `-ss/-to` compensam `first_video_pts - format.start_time`, evitando o desfasamento de priming AAC. Na recodificação, normalizar PTS antes e depois do recorte corrigiu a perda de dois fotogramas do AVI cujo vídeo começava aos 66,667 ms. Se a sondagem não fornecer PTS verificáveis, aplica-se o recuo seguro já previsto.
4. **Remoção de áudio:** MP4, MOV e AVI H.264 copiam o vídeo; AVI MPEG-4 recodifica para H.264. FFprobe confirma zero streams de áudio, fps e resolução. As cópias preservam os hashes de todos os fotogramas. **D-55 (a), aprovada:** avaliar duração visual pelos fotogramas/fps nas fixtures CFR, aceitando remover a cauda sonora. O AVI original tem vídeo de 4,000 s e áudio/contentor de 4,080 s; o MP4 H.264 copiado pode reportar cerca de 4,034 s no contentor. Não se confunde esse padding do remux com a duração visual nem se fabricam fotogramas para conservar a cauda de áudio.
5. **Velocidade:** os sete fatores 0.25, 0.5, 0.75, 1.25, 1.5, 2 e 4 em MP4 e MOV fracionário; fps original, duração inversa ao fator, `atempo` encadeado abaixo de 0.5× e diferença entre durações de áudio/vídeo de até um fotograma. `atempo` terminava cerca de 41 ms cedo num caso fracionário; silêncio limitado por `apad=pad_dur=0.1` e `-t expectedDurationMs/1000` corrigiram o fim. A avaliação auditiva de pitch/sincronismo durante reprodução permanece manual. Não foi executado o produto cartesiano de todos os fatores com todos os contentores/perfis.
6. **Geometria/browser profile:** cópia de 129×97 preserva as dimensões; a preview real recodifica para H.264 `yuv420p` 128×96; a rotação na recodificação produz 96×128. A ingestão/regressão também verifica High 10, cover art, MOV/AVI, thumbnails e previews. Reproduzir a preview no browser continua pendente.

As sondagens temporárias da etapa 4 não contam para estes resultados. Os ficheiros de teste e o gerador de fixtures estão persistidos no repositório.

## Contratos de ligação e regressão unitária

- O fps do servidor prevalece sobre `_input` do cliente, inclusive fracionário. Ausência, tipos inválidos, booleanos, zero ou valores negativos falham explicitamente; plano e receita não são mutados.
- `videoMode` é reiniciado por entrega e limpo ao terminar. A suite executa os ciclos reais de `TaskRunner.run/_reply` para B004, tarefa anterior, descarte cancelado e falha: só `completed` da entrega B004 leva o modo.
- O helper insere `-ss/-to` antes do `-i`, após `build_command()`, e conserva argumentos anteriores, mapas, `+genpts`, progresso e destino. Os limites adicionais são locais à execução; as assinaturas e `executor.run()` permanecem.
- `remove_audio` usa a decisão `audio: none` existente; `plan.js` não foi alterado. A D-54 preserva `plan.output`, `plan.preview`, assinatura e destinos anteriores; o destino adicional é determinístico e tem o mesmo dono/projeto.
- Os 122 testes JS anteriores e os 44 Python anteriores passaram, assim como os 23 testes anteriores do frontend. Os testes de registo da B003 receberam apenas linhas adicionais para separar as três operações sempre ativas da operação `test_reencode`; mantêm os asserts originais da D-37. O fake de canal recebeu `basic_get` para suportar a porta acrescentada na D-56.

## Integração real e segurança

`projects/test/video/e2e-basic-edits.test.js` passa por nginx, gateway, API de projetos/utilizadores, MongoDB, RabbitMQ, storage S3 e worker. Usa um proprietário premium e editores free do mesmo projeto próprio, evitando criar buckets adicionais para cada cenário.

- Dez percursos de operações: trim MP4 copiado, trim AVI H.264 com recuo, trim AVI MPEG-4, trim MOV fracionário recodificado, remoção AVI MPEG-4 recodificada, remoção AVI H.264 copiada, velocidade MOV 0.25× com `_input` falso do cliente, velocidade AVI 4×, velocidade com rotação e trim ímpar com preview. Verifica modo real capturado na resposta AMQP, codecs/metadados reais, fps exato do servidor, armazenamento, receita, `source_video_ids`, API de informação e presença na galeria.
- Download original byte a byte, HTTP Range 206 e 32 bytes, metadados/receita da origem e recusa sem autenticação (401). Outros cenários de autorização/share têm regressão unitária; não se declara uma auditoria de segurança completa.
- Validação/submissão inválidas e remoção sem áudio: 422 com detalhes, sem tarefa nova e sem débito. Aceitação e validação são cronometradas e exigem ≤ 1000 ms; valores finais registados abaixo. Não foi feito teste de carga/stress.
- Cancelamento só após progresso positivo do FFmpeg: API devolve `cancelled`, crédito restituído, worker responde `cancelled`, sem `completed`/resultado. A falha por original ausente produz `RESOURCE_UNAVAILABLE` e devolve quota; idempotência da devolução e corridas tardias têm também testes unitários persistentes.
- D-56 (a): a integração revelou o bloqueio do dispatch reentrante do Pika. A fila exclusiva adicional consulta controlo por `basic_get` no canal/ligação existentes, reutilizando o cancelamento anterior. A integração real e o teste sem callbacks de consumidor passaram. Documentado no ADR-009.
- Republicação pela rotina real: uma tarefa própria fica persistida com plano completo e sem `published_at`; a manutenção publica-a, o worker conclui e o plano permanece igual. Não se reiniciou o broker nem a base de dados para simular este cenário.
- Resultado tardio: tarefa própria cancelada com `targets.preview` persistido e objeto real no storage recebe resposta sintética `completed` sem chaves de preview; o serviço elimina o objeto pelo plano e não cria vídeo.
- Fluxo de imagem: upload real, brightness 0.5, commit pelo pipeline AMQP e download do PNG resultante; resolução 64×48 e pixel azul processado `[0,0,127]` confirmados. Os controlos de imagem no browser permanecem no checklist manual.

Na execução final, as dez aceitações demoraram **31,6–81,1 ms** e as quatro validações cronometradas **23,5–76,4 ms**. A tarefa preparada para republicação concluiu através da rotina real em cerca de 56,4 s. Estes números são medições locais e não um teste de carga.

## Falhas investigadas e correções

Os resultados vermelhos intermédios não foram ocultados nem registados como aprovação: recorte copiava fotogramas extra; priming/PTS deslocavam o recorte; AVI perdia dois fotogramas; `atempo` encurtava áudio; Pika impedia cancelamento efetivo; D-57 revelou o fim não representável por cópia. As correções estão descritas acima e dentro das decisões aprovadas D-55/56/57.

Houve também defeitos do harness: reescrita de URLs conservava indevidamente a porta pública; comparação do Mongo ignorava a normalização pública de `parameters: {}`; fechar canal e ligação AMQP em paralelo deixava uma Promise por resolver, corrigido por fecho sequencial em `finally` e timeout de suite. Os cenários funcionais dessa execução tinham passado, mas a suite interrompida não foi contada como concluída. Uma repetição encontrou uma leitura demasiado cedo do vídeo resultante: a B003 transita a tarefa antes de inserir o vídeo e só notifica depois dessa inserção; o teste passou a esperar a persistência. A execução final terminou com 15/15 e teardown aprovado.

O SeaweedFS atingiu o limite de volumes com buckets de teste vazios. Limparam-se apenas os buckets criados nesta sessão e passou-se a usar o mesmo projeto com editores free. Não se aumentou a capacidade nem se apagaram dados preexistentes. O build emitiu avisos anteriores de hooks/`img`; a suite Python anterior emitiu um `ResourceWarning` de ficheiro de teste não fechado, sem falhas. Não se apresentam esses avisos como correções desta B004.

## Limpeza e limites

O teardown enumera apenas IDs criados pela execução: vídeos/tarefas/locks/resultados/processos/projeto/utilizadores, objetos/targets (incluindo preview), marcadores e bucket próprios; valida prefixos antes da eliminação. As ligações e a fila exclusiva de observação são fechadas. A consulta posterior confirmou zero documentos dos utilizadores/projetos próprios do harness. Os diretórios locais de imagem dos 11 proprietários de teste explicitamente identificados foram removidos; a mesma limpeza por ID foi acrescentada ao teardown persistente e verificada no filesystem. Essa adição de limpeza foi verificada separadamente após a execução funcional final. Diretórios/cópias temporárias próprios no host e nos três contentores foram removidos; o gerador persistente permite reproduzir os vídeos. A inspeção dos serviços reais confirmou `test_reencode` ausente e a variável de ativação não definida nos dois registos.

**Não executado nesta etapa:** suites E2E históricas completas de B001–B003 com fixtures próprias/ficheiros grandes, reinícios/crash/dead-letter do worker e limpeza de projeto apagado de 10 minutos; testes de carga/stress; browser automatizado/manual; avaliação auditiva humana. A regressão executada cobre as suites unitárias anteriores e os percursos reais acima. Não se afirma que toda a regressão histórica ou todos os critérios de UI estejam concluídos.

## Auditoria dos diffs e checkpoint

Auditoria final, incluindo ficheiros novos: **33 ficheiros, 2661 linhas acrescentadas e zero removidas** fora de `docs`/`memory-bank` (inclui o README da suite). Os oito ficheiros já existentes na main foram verificados também por subsequência de linhas em bytes: todas as linhas anteriores, incluindo os fins de linha, continuam presentes na mesma ordem. `projects/video/plan.js` tem diff vazio face a `origin/main`.

Os oito ficheiros existentes receberam apenas pontos de ligação/import/registo ou adaptação dos testes: `executor.py`, `ops/__init__.py`, `task.py`, `tests/test_task.py`, `video-player.tsx`, `task-domain.test.js`, `operations/index.js` e `tasks.js`. O canal consultado pela D-56 é o já existente; a fila nova é exclusiva. Nenhum hunk substitui a aceitação/quota/executor ou altera o fluxo de imagem. As remoções visíveis contra a etapa 4 em `keyframe.py`/`ops` pertencem a ficheiros novos da B004, ausentes da main; não removem linhas das B001–B003.

Os **sete ficheiros novos fora de docs/memory-bank nesta etapa** foram inspecionados integralmente: `control_poll.py`, `test_basic_edits.py`, `generate_basic_edit_fixtures.py`, `video-edit.test.mts`, `basic-edits.test.js`, `e2e-basic-edits.test.js` e `README-b004.md`. Cobrem receção de controlo, fixtures isoladas, asserções de resultados reais e limpeza limitada aos IDs próprios. Foram também revistos os novos ADR-009, relatório e checklist manual. Não há scripts temporários, fixtures binárias, credenciais novas ou alterações a compose no commit. A etapa prepara 24 ficheiros, dez deles novos, preservando as alterações locais anteriores.

Comandos da auditoria do checkpoint (a comparação com `origin/main` foi verificada com todos os novos ficheiros no índice e confirmada no commit):

```text
$ git diff --numstat origin/main...HEAD -- . ':!memory-bank' ':!docs'
25  0  Tools/video/control_poll.py
2   0  Tools/video/executor.py
131 0  Tools/video/keyframe.py
4   0  Tools/video/ops/__init__.py
10  0  Tools/video/ops/remove_audio.py
15  0  Tools/video/ops/speed.py
14  0  Tools/video/ops/trim.py
15  0  Tools/video/step_input.py
18  0  Tools/video/task.py
33  0  Tools/video/tests/generate_basic_edit_fixtures.py
345 0  Tools/video/tests/test_basic_edits.py
8   0  Tools/video/tests/test_task.py
111 0  frontend/components/video/use-video-edit.ts
137 0  frontend/components/video/video-edit-actions.tsx
26  0  frontend/components/video/video-edit-status.tsx
36  0  frontend/components/video/video-edit-validation.tsx
2   0  frontend/components/video/video-player.tsx
67  0  frontend/components/video/video-remove-audio-panel.tsx
83  0  frontend/components/video/video-speed-panel.tsx
217 0  frontend/components/video/video-trim-panel.tsx
64  0  frontend/lib/video-edit.ts
70  0  frontend/test/video-edit.test.mts
83  0  projects/test/video/README-b004.md
256 0  projects/test/video/basic-edits.test.js
701 0  projects/test/video/e2e-basic-edits.test.js
4   0  projects/test/video/task-domain.test.js
3   0  projects/video/operations/index.js
17  0  projects/video/operations/reencodedProps.js
19  0  projects/video/operations/remove_audio.js
29  0  projects/video/operations/speed.js
34  0  projects/video/operations/trim.js
80  0  projects/video/planExtras.js
2   0  projects/video/tasks.js

$ git diff HEAD --numstat -- . ':!memory-bank' ':!docs'
(sem saída após o commit)

$ git status --short
(sem saída após o commit)
```

`git diff --check` e `git diff --cached --check` passaram. Commit/push no ramo `bolt/004-video-basic-edits`; sem merge. O commit é de checkpoint e não declara a etapa/bolt aprovados.

O checkpoint permanece pendente dos [testes manuais](manual-test-checklist.md) e da revisão/aprovação explícita da equipa. Não se acrescenta a etapa `test` a `stages_completed` nem se fecha o bolt antes disso.

## Checkpoint final (2026-10-22T20:01:58Z)

A equipa executou os testes manuais no browser, noutra máquina, e comunicou que passaram todos: recorte, recorte inválido, remover áudio, vídeo sem áudio, velocidade, cancelamento e regressão de vídeo e de imagem. Sem falhas reportadas. Os itens do [checklist](manual-test-checklist.md) não reportados individualmente (três painéis, scrubbing, loop preview, progresso e continuidade, galeria e informação, compatibilidade e geometria) ficam registados como tal.

A etapa 5 não foi repetida: os resultados automáticos acima (commit `a5d60d2`) são os desta etapa.

### Decisões tomadas no checkpoint

- Etapa 5 aprovada explicitamente pela equipa; fecho do bolt com `bolt-complete.cjs` (com `NODE_PATH` para as dependências do specsmd), como nas B001 a B003.
- Commit "B004 fecho" e push no ramo `bolt/004-video-basic-edits`, sem merge para a `main`. Nota: a `main` já contém um merge da B004 (`f343e27`), feito pela equipa antes deste fecho; o fecho não o altera.
