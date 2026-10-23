---
stage: test
bolt: 005-video-visual-edits
created: 2026-10-22T21:17:46Z
status: complete
---

## Test Report: 002-video-transformations

O bolt continua `in-progress`, em `current_stage: test`. A D-67 foi respondida (a) e implementada (ADR-012), e a equipa aprovou os testes manuais (12/12). Falta a repetição do item do ajuste depois da correção e a aprovação explícita da etapa 3. Não foi executado `bolt-complete.cjs` nem feito merge.

**Execução final, depois da D-67 (2026-10-22T22:05:12Z).** As suites foram corridas de novo depois de implementar a D-67 (a). A tabela abaixo e as secções seguintes mostram os resultados finais.

### Summary

- **Tests:** 418 casos distintos executados (B005 e regressão). Destes, **417 passaram**. O caso restante é o teste da ferramenta de brilho de imagem da integração da B004, que não é regressão (ver "Issues Found"). Detalhe por suite:

| Suite | Resultado | Novos da B005 |
| --- | --- | --- |
| JS do serviço de projetos, com regressão unitária B001–B004 | **254/254** | 100 |
| Python do worker com FFmpeg/FFprobe **5.1.9** reais, com regressão B001–B004 | **69/69** | 13 |
| Funções do frontend, com regressão B001–B004 | **62/62** | 12 |
| Integração real B005 (`e2e-visual-edits.test.js`) | **16/16**, sem `todo` | 16 |
| Browser real (Chromium/Brave *headless* por CDP), D-66 | **2/2** (corrido antes da D-67; a D-67 não muda o frontend) | 2 |
| Integração real B004 (`e2e-basic-edits.test.js`, regressão) | **14/15**. A falha é o teste da ferramenta de brilho de imagem (126 vs 127 em ARM), código que a B005 não toca; não é regressão | — |
| Build de produção do frontend (Dockerfile, `bun run build`) | **Passou** (13 páginas) | — |
| TypeScript `tsc --noEmit --incremental false` e ESLint dos ficheiros novos | **Passaram** | — |
| `git diff --check` contra a `main` | **Passou** | — |

- **Coverage** (Node `--experimental-test-coverage`, todos os ficheiros do vídeo): **94,98% de linhas**, 89,85% de ramos e 90,91% de funções. Nos ficheiros da B005:
  - **100% de linhas:** `adjust`, `filter`, `orient`, `resize`, `watermark`, `visualSteps`, `watermarkGeometry`, `planExtrasVisual` e `frameCache`;
  - **99,2%:** `preview`;
  - **92,1%:** `rawBody`;
  - **88,8%:** `watermarks`;
  - **78,8%:** `watermarkCleanup`. As linhas que faltam são o arranque com o `setInterval` e o registo de falhas.
  - Os módulos `routes/videoVisual.js` e `visualStorage.js` são exercitados pela integração, que não mede cobertura.

Ambiente: macOS com Docker em **aarch64**, Python 3.11, FFmpeg e FFprobe 5.1.9-0+deb12u1, sharp 0.33.5 (libvips 8.15.3, pango), Node 22.16 no host e o Node da imagem do serviço de projetos. As reconstruções usaram `docker compose up -d --no-deps --build`. A `test_reencode` ficou desligada nos serviços.

### Test Files

- [x] `projects/test/video/visual-edits.test.js` - `validate` e `estimate` das cinco operações (ADJUST, FILTER, RESIZE, ORIENT e WATERMARK, incluindo as 16 combinações de orientação). Também:
  - geometria da marca e extras do plano (ADR-011);
  - aceitação sem tarefa nem quota nos erros, e o plano persistido e republicado;
  - cache LRU;
  - pré-visualização com o sharp (as 16 orientações com rotação antes do espelho, os filtros, o ajuste, o redimensionamento sem ampliar e os passos ignorados);
  - miniaturas e composição da marca com opacidade;
  - geração do texto em DejaVu (D-59), resolução e reutilização das marcas (ADR-010, D-65), validação das imagens (D-60), limpeza (D-60 com a alteração da equipa) e leitor do corpo.
- [x] `Tools/video/tests/test_visual_edits.py` - FFmpeg 5.1 real sobre fixtures de quadrantes de cor, com verificações em fotogramas do início, do meio e do fim. Cobre:
  - ajuste uniforme e brilho multiplicativo;
  - os seis filtros com as cores esperadas;
  - redimensionamento exato, SAR 1:1 e rotação 0 em vídeos com matriz de +90° e −90°;
  - as 16 combinações de orientação, que dão 8 resultados;
  - orientação a partir da apresentação e corte de 1 px;
  - marca de água fixa em todos os fotogramas, com opacidade e áudio (MP3 → AAC, AAC copiado);
  - etiquetas do grafo numa cadeia, recusa de caminho inseguro, plano sem mutação e valores do cliente ignorados;
  - uma única invocação com um `-filter_complex` (NFR-012).
- [x] `Tools/video/tests/generate_visual_edit_fixtures.py` e `tests/visual_filters.json` - fixtures da integração e cópia do catálogo como dados de teste.
- [x] `frontend/test/video-visual.test.mts` - par mais próximo (RESIZE-002: 1000 → 562), predefinições (D-64), avisos, dimensões orientadas e identidade, passos sem `_mark`, ficheiros até 1 MB e mensagens por campo.
- [x] `projects/test/video/e2e-visual-edits.test.js` - integração real:
  - as cinco operações (proveniência, `recipe`, metadados reais, fps, duração, áudio, original intacto, galeria);
  - equivalência sharp ↔ FFmpeg;
  - NFR-013;
  - rejeições, incluindo o `_mark` forjado pelo cliente (ADR-010) e o teto free/Premium;
  - imagens da marca (PNG, JPEG normalizado, galeria, GIF recusado, mais de 1 MB recusado pelo nginx com 413);
  - pré-visualização da marca comparada com o resultado;
  - referências da limpeza nas coleções reais;
  - cancelamento com devolução e recusa da D-66 pelo servidor;
  - regressão de imagem.
- [x] `projects/test/video/e2e-visual-ui.test.js` - browser real (D-66), com captura de ecrã.
- [x] `projects/test/video/README-b005.md` - comandos e notas de execução.
- [x] Regressão B003/B004, só com linhas acrescentadas: `projects/test/video/task-domain.test.js` (+2) e `Tools/video/tests/test_task.py` (+3) isolam também as operações da B005 na verificação da D-37, como a B004 fez. As asserções originais mantêm-se, e o teste Python passa a exigir que as cinco operações estejam registadas.

### Acceptance Criteria Validation

- ✅ **Ajuste (ADJUST-001 a 010):**
  - passo de 0.05 com tolerância, 1.0 inicial, "Repor", `INVALID_ADJUST_PARAMS` com o campo e `NO_CHANGES` (unitários);
  - saturação 0 dá cinzento no início, meio e fim (FFmpeg);
  - duração, resolução, fps e AAC preservados, e 1 px cortado em 321×241 (FFmpeg e integração).
  - ✅ **Pré-visualização = resultado** (ADJUST-005), depois da D-67 (a) e do ADR-012. A diferença média por canal é 0,42 (brilho 1.2), 0,45 (contraste 1.3), 1,39 (contraste 0.6), 1,32 (saturação 0.5) e 0,68 (combinação 1.2/1.3/0.5); antes ia até 45,78. Verificado com o FFmpeg real e o sharp por píxel: contraste 0.6 dá vermelho (204, 51, 51), e saturação 0.5 dá vermelho (166, 38, 38) e branco inalterado.
- ✅ **Filtro (FILTER-001 a 007):** seis filtros exatos, miniaturas de 160 px, seleção única, `INVALID_FILTER`, aplicação uniforme e propriedades preservadas.
- ✅ **Redimensionamento (RESIZE-001 a 009):**
  - 1000 → 562, predefinições, avisos, teto free 1920×1080 com `limit` e Premium 3840×2160, pares e ≥ 128;
  - `NO_CHANGES` também com rotação;
  - 854×480 e 180×240 exatos, com rotação 0 e o sentido da matriz respeitado.
- ✅ **Orientação (ORIENT-001 a 009):** as 16 combinações dão os 8 resultados, com rotação antes do espelho, tanto no FFmpeg como no sharp. 45° dá `INVALID_ORIENT_PARAMS`, a identidade dá `NO_CHANGES`, as dimensões trocam sem barras e 1281×721 dá 720×1280.
- ✅ **Marca de água (WATERMARK-001 a 011):**
  - texto e imagem (local, JPEG normalizado, galeria);
  - posições predefinidas e X/Y, escala igual à fração da largura (256 px a 20% de 1280), opacidade;
  - conteúdo vazio, imagem inválida ou acima de 1 MB e geometria fora do quadro recusados antes da tarefa;
  - pré-visualização (diferença de 0,67/255 para o resultado);
  - posição fixa em todos os fotogramas, MP3 → AAC e AAC copiado.
- ✅ **NFR-013:** p95 de 22,5 ms e máximo de 24,6 ms em 40 pedidos através do nginx (execução final; na anterior, 21,6 e 27). Miniaturas em 20,1 ms, validação em 10 ms, pré-visualização da marca em 15,3 ms.
- ✅ **Equivalência sharp ↔ FFmpeg** (critério de passagem do bolt): diferença média por canal de **0,50 a 0,55** nas 7 orientações não identidade (a identidade é verificada contra o fotograma) e **0,35 a 1,36** nos 6 filtros. O limite do teste é 12.
- ✅ **Antes da tarefa e da quota:** onze rejeições, com 422 na aceitação e a mesma resposta na validação, sem tarefa e com a quota intacta. Aceitação com p95 de 34 ms e máximo de 154 ms (24 aceitações).
- ✅ **Progresso, cancelamento e resultado parcial:** cancelamento depois de progresso positivo (observado em `video_ws_queue`), `cancelled`, sem resultado, crédito devolvido e o worker responde `cancelled`.
- ✅ **Novo recurso:** `source_video_ids`, `recipe` (com `_mark.watermarkId` na marca), informação e galeria; o original não muda.
- ✅ **D-66:** com o WebSocket, a interface desativa o botão da B005 enquanto há uma tarefa da B004. Sem eventos, o servidor responde 409 `TASK_ALREADY_ACTIVE` e a interface mostra "Este projeto já tem uma tarefa de vídeo em curso. Espera que termine ou cancela-a. Código de suporte: <uuid>" (captura de ecrã guardada fora do repositório).
- ✅ **Regra 2.6:** ver a auditoria abaixo.
- ✅ **Testes manuais:** os 12 itens foram aprovados pela equipa ([checklist](manual-test-checklist.md)). ⏳ A comparação da pré-visualização com o resultado no contraste e na saturação vai ser repetida depois da D-67 e confirmada no próximo checkpoint.

### Issues Found

1. **Ajuste: as fórmulas do ADD 4.3 não davam uma pré-visualização equivalente (D-67), resolvido.** Antes: o brilho coincidia (0,42), mas o contraste ficava em 4,87 (c=1.3) e 27,46 (c=0.6), a saturação em 37,26 (s=0.5) e a combinação em 45,78. A D-67 foi respondida (a): contraste com `lutrgb` e pivô 128, e saturação com a matriz de luma BT.601 (`colorchannelmixer` e `recomb`), registado no ADR-012. Depois da mudança, a diferença ficou entre 0,42 e 1,39, e os 5 casos deixaram de ser `todo` e passam.
2. **A falha 14/15 da integração da B004 é o teste da ferramenta de brilho de imagem (126 vs 127 em ARM), código que a B005 não toca, e por isso não é regressão.** A fixture `color=c=blue` dá azul 253 em aarch64 (conversão YUV → RGB do swscale), e o `ImageEnhance.Brightness(0.5)` dá então 126, enquanto o teste da B004 fixa 127. O PIL da imagem dá 127 para 255 e 254, e 126 para 253. O código da B005 não toca no fluxo de imagem (os routers novos só respondem a caminhos `/:user/:project/videos…`). O teste da B004 não foi alterado (regra 2.6). O teste da B005 calcula o valor esperado a partir da fixture e passa (253 → 126).
3. **D-66: o risco é menor do que o previsto.** O `useVideoTask` da B003 aplica os eventos de todas as tarefas do projeto, por isso as duas sessões ficam ocupadas. O erro do servidor só chega à interface quando os eventos não chegam.
4. **Correções feitas durante a etapa, nos testes e nas fixtures, não no código de produção:**
   - expectativas erradas minhas (o sentido da etiqueta `rotate` do FFmpeg 5.1, a fórmula dos quadrantes, uma conta de geometria, dimensões abaixo de 128 px nos testes);
   - o *fake* `create` sem `_id`;
   - a fixture longa passou de 20 s para 60 s, porque o ajuste terminava antes do cancelamento;
   - o progresso passou a ser observado em `video_ws_queue`, porque o MongoDB é atualizado com pouca frequência.
5. **Uma alteração de código nesta etapa:** separei `frontend/lib/video-visual.ts` (regras puras, testáveis em Node) de `video-visual-api.ts` (chamadas axios). O comportamento não muda; `tsc`, ESLint e o build voltaram a passar.

### Auditoria da regra 2.6 (código, contra a `main`)

```text
$ git diff --numstat main -- . ':!memory-bank' ':!docs'   (resumo)
54 ficheiros, +4983, -0
Ficheiros existentes (só acréscimos):
6  0  Tools/video/ops/__init__.py
4  0  Tools/video/task.py
3  0  Tools/video/tests/test_task.py
2  0  apiGateway/app.js
2  0  frontend/components/video/video-player.tsx
3  0  projects/app.js
2  0  projects/test/video/task-domain.test.js
5  0  projects/video/operations/index.js
2  0  projects/video/tasks.js
```

**0 linhas removidas** em todos os ficheiros de código. Os outros 45 são ficheiros novos da B005 (a contagem de 53 da execução anterior foi feita antes de criar o `README-b005.md`). Na correção da D-67 só mudaram ficheiros novos da B005 (`adjust.py`, `preview.js` e os testes da B005). Nenhum ficheiro tocado usa CRLF. O `applyToolsPreview`, o `plan.js`, o `planExtras.js`, o `executor.py`, o `video-edit-actions.tsx`, os componentes da toolbar de imagem e o `Tools/video/Dockerfile` não mudaram.

### Notes

- **Limpeza:**
  - **Integração:** o `after` apagou só os IDs criados em cada execução (também nas execuções que falharam).
  - **Teste de browser:** apagou o utilizador e o projeto pela API (204); os vídeos do projeto apagado ficam para a rotina de manutenção da B003.
  - **Contentores:** os diretórios temporários (`/tmp/b005-*` e `/tmp/b004-e2e-fixtures-b005run`) foram removidos. As fixtures e as capturas ficaram no *scratchpad* da sessão, fora do repositório.
- **Não executado:** as suites históricas `e2e-*.test.js` das B001 a B003, pelas razões do README da B004 (ambientes próprios, `test_reencode`, reinícios), e testes de carga. A regressão de vídeo fica coberta pelas suites unitárias e pela integração da B004.
- **O checkpoint fica à espera de:** a repetição, pela equipa, da comparação do ajuste depois da D-67, e a aprovação explícita da etapa 3. Não se acrescenta `test` a `stages_completed` antes disso.

## Checkpoint final (2026-10-22T22:08:52Z)

A equipa repetiu a comparação do ajuste depois da D-67 (saturação 0, contraste 0.6 e contraste 1.3) e confirmou que a pré-visualização coincide com o resultado. A equipa aprovou explicitamente a etapa 3.

### Decisões tomadas no checkpoint

- Etapa 3 aprovada; fecho do bolt com `bolt-complete.cjs` (com `NODE_PATH` para as dependências do specsmd).
- Commit e push do fecho no ramo `bolt/005-video-visual-edits`, sem merge para a `main`.
