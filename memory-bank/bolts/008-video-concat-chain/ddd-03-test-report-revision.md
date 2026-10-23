---
stage: test
bolt: 008-video-concat-chain
created: 2026-10-23T15:16:41Z
status: checkpoint
---

# Relatório de testes — etapa 5 da revisão da B008

A equipa aprovou a etapa 4 da revisão (`d6ec7bc`). Este relatório junta-se ao da primeira etapa 5 (`ddd-03-test-report.md`), que a equipa não aprovou, e cobre o que a revisão mudou: as três ações independentes, os componentes de configuração da edição simples (D-87), a ausência de limites fixos (D-86) e as medições da D-88. O bolt continua `in-progress`, em `current_stage: test`. Os testes manuais e a aprovação da equipa ficam pendentes; não houve `bolt-complete.cjs` nem merge.

Imagens em uso: as reconstruídas na etapa 4 da revisão (`projects`, `api_gateway`, `frontend`) e as da etapa 5 anterior (`users`, `ws_gateway`, `video_worker`, FFmpeg 5.1.9).

## Resultados executados

| Suite/verificação | Resultado real |
| --- | --- |
| JS do serviço de projetos (`node --test`, sem E2E), com a regressão B001–B007 | **282/282** |
| Worker com FFmpeg 5.1.9 real, com a regressão B001–B007 | **80/80** |
| Frontend (Node 26) | **68/68**; com o Bun, `video-convert` (B007) e `video-chain` **8/8**; `tsc` ok |
| **Edição simples igual (D-87): `e2e-panels-ui.test.js`, browser real (Brave *headless* por CDP)** | **9/9** painéis com o mesmo DOM normalizado da `origin/main`, antes e depois de uma interação, e **1/1** para as três ações da B008. No *baseline*, a mesma comparação deu 9/9 (o teste é estável) |
| Integração B008 (`e2e-composition.test.js`, nginx → gateway → projetos e utilizadores → RabbitMQ → worker → storage) | **15/15**, com a medição da D-88 |
| Integração B007 / B005 / B004 (B005 e B004 incluem o fluxo de imagem) | **3/3** / **16/16** / **14/15** (a falha é a conhecida do Brilho de imagem em ARM: espera 127, recebe 126) |
| Invocações de codificação por tarefa | Uma por tarefa nos testes do worker; nas tarefas da integração, uma resposta `completed` por tarefa (NFR-012, verificada como na etapa 5 anterior) |

## Cobertura do pedido da equipa

| Pedido | Onde e resultado |
| --- | --- |
| Edição simples igual em cada um dos nove painéis | **Automático:** `e2e-panels-ui.test.js` grava, com o frontend construído a partir da `origin/main`, o DOM normalizado de cada painel antes e depois de uma interação, e compara-o com o do frontend atual. Normalizar quer dizer manter as tags, classes, papéis, estados, valores, textos e `disabled`, e retirar os ids gerados, as fontes de imagem e vídeo e os estilos *inline*. As interações:<br>- recorte: início `00:00:00.500`;<br>- remoção de áudio: a janela de confirmação;<br>- velocidade: 0.5×;<br>- marca: texto "B008";<br>- ajuste: → no brilho;<br>- filtro: Sépia;<br>- redimensionar: 480p;<br>- rodar: 90°;<br>- converter: AVI.<br>Os nove são iguais. **Manual:** um item por painel na checklist |
| "Aplicar várias operações" com 12 ou mais passos num Premium | E2E: 12 passos (recorte, ajuste, filtro, rotação, redimensionamento, marca, velocidade, ajuste, espelho, filtro, remoção de áudio, conversão para MOV).<br>- `…/chain/validate`: custo 12 e as entradas de cada passo (3000 → 2500 ms, 1250 ms depois da velocidade, 180×320 à entrada da marca).<br>- Resultado: MOV H.264 sem áudio, 180×320, 1,25 s.<br>- Tarefa: `kind: chain`, `total_steps` 12, sem débito no Premium.<br>- Descarregamento com os 12 sufixos |
| "Juntar vídeos" com 12 ou mais vídeos num Premium, com repetições e sem operações | E2E: 13 clips de 4 vídeos, com custo 1, `source_video_ids` pela ordem e com repetições, `plan.inputs` com os 4 ficheiros distintos, sub-cadeias vazias no `recipe`, 29 s e 320×240 |
| Movie Maker com 3 vídeos com cadeias diferentes (uma vazia) e 2 ou mais operações depois da junção | E2E: (`wide` + recorte + sépia) + (`tall` vazio) + (`phone` + velocidade 2× + ajuste), seguidos de rotação + marca + ajuste.<br>- Custo e `total_steps` 8.<br>- `inputs`: clips com 2/0/2 passos, saídas dos clips de 2000/2000/1000 ms, e entrada da primeira operação final em 640×360.<br>- Resultado em 360×640 e 5 s, com uma só tarefa.<br>- Descarregamento `wide_concat_orient_watermark_adjust.mp4` |
| Quota insuficiente num Registado bloqueada antes da tarefa | E2E: 11 passos (validação 200, válida, custo 11) e uma junção com 10 passos num clip (custo 11) dão 429 `QUOTA_EXCEEDED` com `{cost: 11}`, sem tarefa e sem débito. Uma junção de 11 vídeos é válida para o Registado, com custo 1 |
| Anónimo recusado | E2E: `…/chain/validate` (com e sem junção) e a aceitação (com e sem `:video`) dão 403 `FORBIDDEN`, sem tarefa |
| Falha a meio sem resultado e com créditos devolvidos | E2E (Registado): o original é corrompido no storage e a cadeia de 3 passos falha com `PROCESSING_ERROR` / `encode`. Os 3 créditos voltam (`refund.state: done`), não fica vídeo de resultado e os destinos do plano dão 404. A falha no descarregamento e o cancelamento com devolução continuam cobertos pelos testes da etapa 5 anterior |
| Medições da D-88 (junção de 100 clips curtos e cadeia longa num Premium) | Ver a secção seguinte. As duas completaram |
| Regressão B001–B007 e de imagem | Suites unitárias completas; integrações B004/B005/B007 como acima |

## Medições da D-88 (D-88 a: nenhum limite novo)

Worker: contentor `video_worker` com 12 núcleos e 8 GB na VM do Docker. O pico de memória é o do processo FFmpeg (`ru_maxrss` dos filhos), medido no contentor com o mesmo comando do `composition_task.build_command`. Os tempos vêm da pilha (respostas `started` → `completed`).

| Caso | Pedido | Tempo no worker | Pico de memória do FFmpeg | Resultado |
| --- | --- | --- | --- | --- |
| Junção de 100 clips de 0,5 s (320×240, 25 fps, áudio), Premium, pela pilha | 5,1 kB | 2,8 s | ≈ 2,0 GB (medido à parte, mesmo comando) | Concluída; 52,0 s, com vídeo e áudio de 52,0 s (cada clip tem 13 fotogramas, 0,52 s, sem desvio de sincronismo) |
| Junção de 100 ocorrências de um vídeo 640×360 de 3 s (só no worker) | — | 7,2 s | ≈ 2,9 GB | Concluída; 300,8 s |
| Cadeia de 60 passos (ajuste, filtro, espelho) sobre 90 s 360p, Premium, pela pilha | 5,3 kB | 21,9 s | 146 MB (medido à parte, mesmo comando) | Concluída; 90 s |
| Corpo de 3000 passos (sondagem da etapa 4) | > 100 kB | — | — | 422 `INVALID_REQUEST {field: "steps", reason: "too_large"}` |

**Leitura:**

- Nenhuma medição falhou, por isso, como combinado, não fica dúvida nova.
- A cadeia longa é barata: a memória quase não cresce com o número de passos.
- A junção abre um descodificador por entrada. A memória cresce com o número de clips e com a resolução: cerca de 20 MB por clip a 320×240 e cerca de 29 MB a 640×360, com os *threads* de descodificação por omissão.
- Por extrapolação (não medida), 100 clips em 1080p ultrapassariam os 8 GB do worker. O limite efetivo dessas junções fica a ser a memória do worker, e uma falha por falta de memória acaba em `PROCESSING_ERROR` com devolução (T-03, *dead-letter*).
- Se a equipa quiser proteger isto, a opção (b) da D-88 (um teto configurável) ou limitar os *threads* de descodificação por entrada são os caminhos possíveis; fica para decisão da equipa.

## Ficheiros de teste desta etapa

- [x] `projects/test/video/e2e-panels-ui.test.js` (novo): regressão automática da edição simples (D-87) e presença das três ações, com o procedimento do *baseline* no `README-b008.md`.
- [x] `projects/test/video/e2e-composition.test.js`:
  - os testes dos limites passam a provar a sua ausência (D-86) e a quota antes da tarefa;
  - testes novos: 12 passos, 13 vídeos, Movie Maker, anónimo, falha com devolução e a medição da D-88 (`VIDEO_E2E_D88=1`).
- [x] `projects/test/video/composition.test.js` e `frontend/test/video-chain.test.mts`: sem limites (feito na etapa 4 da revisão).
- [x] `Tools/video/tests/generate_composition_fixtures.py`: `short.mp4` para a D-88.
- [x] `projects/test/video/README-b008.md`: procedimento da revisão.

## Limpeza dos dados de teste

- O bucket vazio da sondagem da etapa 4 (`user-6adb6c8272095e6e659ec443`) foi apagado.
- As execuções do teste de browser deixaram 12 buckets e 4 documentos `videos` de projetos apagados. Foram apagados, com os objetos.
- Não ficam utilizadores de teste nem predefinições de vídeo.
- Os ficheiros temporários nos contentores foram apagados, e o *worktree* e a imagem do *baseline* foram removidos.
- **Não apagados**, por não serem desta sessão: 6 buckets vazios de 22/10, de utilizadores já apagados (testes de bolts anteriores), e os vídeos e tarefas de hoje que pertencem a projetos que ainda existem.

## Auditoria de alterações (`origin/main...HEAD`)

A `origin/main` avançou durante esta etapa com commits da equipa em `Documentos consulta/` (`4cbbad0`, `dc9bc92`). O diff de três pontos usa a base comum (`41f41da`), por isso esses commits não entram.

1. **Ficheiros abrangidos pela D-87:** 9 ficheiros, +559, −213. São os mesmos números da etapa 4, porque esta etapa não mudou esses ficheiros; as linhas estão listadas no anexo de `implementation-report-revision.md`.
2. **Resto do código** (`-- . ':!memory-bank' ':!docs'`, sem os nove ficheiros): 53 ficheiros, +7170, **0 removidas**.

Os 20 ficheiros de texto com CRLF do repositório não foram tocados.
