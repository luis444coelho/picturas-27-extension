---
stage: test
bolt: 007-video-format-conversion
created: 2026-10-23T00:34:11+01:00
---

# Test Report: conversão de formatos de vídeo

## Resumo

- **B007:** 4/4 testes JS do plano, 3/3 testes do worker, 2/2 testes do painel, 3/3 testes de integração (dez conversões dentro do primeiro teste).
- **Regressão:** 258/258 testes JS B001–B005+B007, 72/72 no worker, 62/62 no frontend, 16/16 na integração B005. A integração B004 fez 14/15; a única falha é a conhecida em ARM no teste de Brilho de imagem, que espera 127 e recebe 126. A integração B005 confirma o fluxo de imagem e o mesmo pixel 126.
- **Matriz publicada:** 18/18 ficheiros — dez resultados e oito cópias MP4 — inspecionados com FFprobe, descodificados integralmente com FFmpeg `-xerror` e reproduzidos do início ao fim com VLC em modo sem janela.
- **Cobertura percentual:** não medida; os critérios funcionais da B007 foram exercitados por testes unitários e pela pilha real. A reprodução no leitor integrado e em outros navegadores continua na checklist manual.

## Ficheiros de teste

- [x] `projects/test/video/convert.test.js` — matriz T-05, modos de stream, qualidade AVI, erros específicos, dimensões ímpares e isolamento D-72.
- [x] `Tools/video/tests/test_convert.py` — FFmpeg/FFprobe 5.1 real, seis caminhos da matriz, identidade SHA-256 dos pacotes copiados, vídeo sem áudio, 321×241, H.264 4:4:4 e previews.
- [x] `frontend/test/video-convert.test.mts` — destinos, texto «Cópia direta»/«Recodificação» a partir de `videoMode`/`audioMode` e erros.
- [x] `projects/test/video/e2e-convert.test.js` — API, quota, MongoDB, RabbitMQ, worker, storage, dez conversões, saída dupla, `previewMade`/`keys.preview`, erros e cancelamento.
- [x] `Tools/video/tests/generate_convert_fixtures.py` — fixtures da integração.
- [x] `Tools/video/tests/verify_convert_outputs.py` — FFprobe, descodificação completa e reprodução VLC dos ficheiros publicados.
- [x] `projects/test/video/task-domain.test.js` e `Tools/video/tests/test_task.py` — filtros aditivos que mantêm as asserções D-37 após o registo de `convert`.

## Matriz e critérios de aceitação

| Origem → destino | `videoMode`/`audioMode` | Saída FFprobe | Preview | Verificação |
|---|---|---|---|---|
| MP4 H.264/AAC → MOV | copy/copy | MOV H.264/AAC | sim | pacotes de ambas as streams idênticos; VLC |
| MP4 H.264/AAC → AVI | encode/encode | AVI MPEG-4/MP3 | sim, mesma invocação | `-q:v 3`, MP3 192k; VLC |
| MOV H.264/AAC → MP4 | copy/copy | MP4 H.264/AAC | não | pacotes idênticos; VLC |
| MOV H.264/AAC → AVI | encode/encode | AVI MPEG-4/MP3 | sim, mesma invocação | VLC |
| AVI H.264/MP3 → MP4 | copy/encode | MP4 H.264/AAC | não | `+genpts`, vídeo copiado; VLC |
| AVI H.264/MP3 → MOV | copy/encode | MOV H.264/AAC | sim | `+genpts`, VLC |
| MP4 sem áudio → AVI | encode/none | AVI MPEG-4 sem áudio | sim, sem áudio | VLC |
| MP4 129×97 → AVI | encode/none | AVI 128×96 | sim | corte só na recodificação; VLC |
| MP4 129×97 → MOV | copy/none | MOV 129×97 | sim | cópia preserva dimensões; VLC |
| AVI H.264 4:4:4 → MP4 | copy/encode | MP4 H.264/AAC 4:4:4 | sim, H.264 4:2:0 | D-69; VLC |

As saídas AVI e as cópias MP4 foram criadas num só comando FFmpeg (`split`/`asplit`). A resposta real do worker teve `previewMade` coerente com `keys.preview` e com `storage.preview_key` nos dez casos. O cancelamento da conversão para AVI ocorreu após progresso positivo: tarefa cancelada, quota devolvida, nenhum vídeo resultado nem objeto nos destinos do plano. `SAME_FORMAT` e `UNSUPPORTED_TARGET_FORMAT` devolveram HTTP 422 sem tarefa nem reserva.

## Execução e regressão

Pilha reconstruída com `docker compose up -d --build --no-deps projects video_worker frontend`; `test_reencode` permaneceu desligada nos serviços. O frontend compilou em produção e `tsc --noEmit` passou. O teste da B007 no frontend correu com Bun; a suite anterior, com Node 26 no contentor de projetos. Os resultados da matriz foram publicados pela integração, descarregados do storage para uma pasta temporária e usados pelo verificador; FFmpeg/FFprobe do worker são 5.1.9. O verificador do host executou FFprobe, FFmpeg `-xerror` e VLC em cada um dos 18 ficheiros.

A regressão de integração B004 passou 14/15: o teste histórico de Brilho espera `[0,0,127]` para azul, mas a fixture ARM dá 253 antes da operação e 126 depois. Esse desvio consta da B004/B005 e não deriva da B007. A regressão B005 passou 16/16, incluindo o Brilho de imagem com valor esperado a partir do pixel real. Os testes B001/B002 de imutabilidade, download e HTTP Range passaram na suite B004; B003 está coberta pelas suites JS, worker e integração B004/B005.

## Checklist manual e limites

`manual-test-checklist.md` descreve os dez percursos no leitor integrado, as indicações do painel, erros, quota, cancelamento e regressão de imagem. A equipa aprovou manualmente MP4→MOV, MP4→AVI com imagem e som no VLC, AVI H.264/MP3→MP4, MOV→AVI, vídeo sem áudio→AVI, galeria/informação e as regressões B004 (recorte), B005 (filtro) e imagem (Brilho). O ensaio automatizado VLC usou saída de vídeo/áudio `dummy` para reproduzir e descodificar integralmente sem abrir uma janela. Os restantes percursos no leitor integrado, QuickTime e Windows Media Player não foram testados manualmente; a NFR-026 fica com esta limitação documentada.

## Riscos residuais aceites no fecho

- **D-73:** `original_name` do resultado conserva a extensão da origem no projeto; `fileName.js` usa a extensão correta no download.
- **D-74:** a quota free é debitada no servidor, mas o contador da sessão do frontend não é atualizado por `use-video-task.ts`. Em diagnóstico real, `users.getUserType` devolveu `free`, `remaining_operations` fez 5→4 na aceitação e ficou 4 na conclusão, `user.operations` passou de vazio para `processed: 1`, e o VideoTask permaneceu com `reserved_credits: 1` e `refund.state: none`. Os logs `video.task.accepted` (`cost: 1`, `reserved: 1`), `video.task.started` e `video.task.completed` confirmaram a trajetória. A conta temporária foi limpa pela suite.

## Auditoria de alterações

O comando obrigatório `git diff --numstat origin/main...HEAD -- . ':!memory-bank' ':!docs'` é executado após o commit desta etapa e apresentado no checkpoint. Todas as linhas de código acrescentadas desde `origin/main` têm zero linhas removidas. A regra 2.6 foi mantida também nas correções das asserções históricas dos registos de operações.
