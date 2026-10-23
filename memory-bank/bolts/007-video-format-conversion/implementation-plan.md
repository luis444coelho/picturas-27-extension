---
stage: plan
bolt: 007-video-format-conversion
created: 2026-10-22T22:13:29Z
---

## Plano de implementação: 002-video-transformations / B007

### Objetivo e âmbito

Entregar a ST-VID-012 como operação isolada `convert` v1 com `{target: "mp4" | "mov" | "avi"}`: validar antes da tarefa, produzir um recurso novo com os codecs da matriz, copiar ou recodificar cada stream conforme o plano, disponibilizar cópia MP4 para reprodução quando aplicável e acrescentar o painel de conversão. O original mantém-se. A aceitação, quota, progresso, cancelamento e limpeza vêm da B003; as peças de frontend comuns vêm da D-47. A `test_reencode` da D-37 continua desligada.

**Fontes, por ordem de autoridade:**

1. `docs/add.md`, v1.1, secções 2.5, 2.6, T-01, T-02, T-05, T-06 e 4.7, Q-ADD-11/20/21/25, e a secção «Decisões do ADD v1.1» do `bolt.md`.
2. `docs/specsDuvidas.md`, D-01 a D-72, sobretudo D-19, D-39 e as respostas D-68 a D-72 aprovadas no checkpoint.
3. `memory-bank/standards/decision-index.md`, ADR-001 a ADR-012, sobretudo ADR-008/011 (extras do plano) e ADR-009 (cancelamento efetivo).
4. `docs/requirements/REQ-VID-CONVERT.md` e `REQ-VID-NFR.md`, NFR-011, NFR-022.
5. `docs/use-cases/UC-VID-011.md`.
6. `bolt.md` e `ST-VID-012-video-convert.md` no memory-bank.

`docs/merge.md` não é fonte deste bolt. Cadeias com vários passos, junção e validação estrutural CONVERT-009 são da B008.

### Entregas

1. **Serviço de projetos:** `projects/video/operations/convert.js` com `validate`, `estimate`, `copyable`, `cost` e `outputContainer`, a usar `formats.js` como única fonte da matriz. Uma linha nova em `projects/video/operations/index.js` regista a operação. `encoding.js` recebe apenas acréscimos para AVI segundo D-68; MP4/MOV conservam a D-39: `libx264 -preset veryfast -crf 23`, AAC 128 kb/s. Um módulo novo de extras no padrão do ADR-008/011, ligado por uma linha nova em `tasks.js`, transporta apenas os dados de conversão que `estimate`/`copyable` não exprimem. A resposta de validação só ganha modos de stream depois de V4 confirmar um ponto aditivo; não se muda o contrato das operações anteriores.
2. **Worker:** `Tools/video/ops/convert.py`, registado por linhas novas em `Tools/video/ops/__init__.py`. Um módulo novo e linhas novas de ligação no `task.py` adaptam o comando da conversão sem editar `executor.py`: AVI usa `mpeg4` e `libmp3lame` com os valores que a equipa escolher na D-68, sem `+faststart`; `-fps_mode passthrough` nas recodificações. T-06 exige uma só invocação FFmpeg com `split`/`asplit` para resultado AVI e pré-visualização MP4. Resultado MOV usa segunda invocação de *remux* a partir do MOV concluído. MP4 com perfil incompatível usa a política de cópia que a equipa decidir na D-69. FFprobe, miniatura, fotograma 0, upload, progresso, cancelamento e limpeza continuam no fluxo existente; o ADR-009 mantém a consulta de controlo.
3. **Frontend:** componentes novos para ação e painel de conversão, montados por uma linha nova em `frontend/components/video/video-player.tsx`, como os painéis da B004/B005. Mostram contentor e codecs atuais, destinos sem o atual, codecs fixos de saída e decisão do servidor entre cópia e recodificação (incluindo modo por stream, segundo D-72). Usam `useVideoEditValidation`, `useVideoEditSession`, `VideoEditStatus` e a submissão de tarefa existentes (D-47). A reprodução já prefere `preview_key`; confirmar em teste, sem alterar o leitor existente.
4. **Testes e evidência da etapa 3:** unitários JS da operação, plano e validação; Python/FFmpeg real para cada caminho da matriz, áudio ausente, cópia parcial, perfil H.264 incompatível, AVI com timestamps incompletos e dimensão ímpar; integração API → tarefa → worker → storage → novo recurso; regressão B001–B005 e imagem; testes frontend e checklist manual no navegador. FFprobe e descodificação verificam NFR-011; VLC e leitor integrado verificam NFR-022 por caminho, com disponibilidade dos demais leitores de referência explicitada no relatório.

### Dependências e restrições

- B001/Unit 001: metadados de ingestão, `formats.js`, storage, `preview_key` e leitor.
- B003: `chain.js`, `plan.js`, `encoding.js`, `tasks.js`, registos, executor e worker. B004/B005: padrão de montagem e extensões ADR-008/011. Nenhuma dependência de pacote nova está prevista.
- Só são permitidos ficheiros novos e linhas de ligação ou de extensão acrescentadas ao código da `main`, incluindo B001–B005. Preservar CRLF onde exista; não alterar `docker-compose.yaml`, o fluxo de imagem, as linhas anteriores nem a configuração global. O SeaweedFS é servido na porta 9091 do host pelo `docker-compose.override.yml` local fora do Git. Rebuilds, quando necessários, usam `docker compose up -d --build --no-deps <serviço>`.
- Após cada etapa: commit `B007 etapa N: ...` e `git push -u origin bolt/007-video-format-conversion`; sem merge para a `main`. No relatório final, mostrar `git diff --numstat origin/main...HEAD -- . ':!memory-bank' ':!docs'` e confirmar zero linhas removidas nos ficheiros de código.

### Abordagem técnica condicionada às dúvidas

- **D-68 (c) / Q-ADD-11:** `mpeg4 -q:v 3 -pix_fmt yuv420p` e `libmp3lame -b:a 192k` em taxa constante; MP4/MOV conservam a D-39. Verificar reprodução na etapa 3.
- **D-69 (a) / Q-ADD-20:** cópia MP4 também para originais e resultados MP4 com H.264 incompatível, em consonância com CONVERT-008.
- **D-70 (a) / Q-ADD-21:** cópia apenas quando o codec de origem é igual ao de saída da matriz; MP4 H.264/AAC → AVI recodifica para MPEG-4 Part 2/MP3.
- **D-71 (a) / Q-ADD-25:** cortar 1 px por dimensão ímpar só na recodificação, conforme CONVERT-007.
- **D-72 (a) / CONVERT-003:** expor `videoMode`/`audioMode` na validação de `convert` apenas se V4 confirmar acréscimo de linhas e respostas B004/B005 intactas.
- `SAME_FORMAT` e `UNSUPPORTED_TARGET_FORMAT` são recusados antes de criar tarefa ou reservar quota. No envio da operação, o erro é HTTP 422; a validação prévia usa o contrato atual `{valid, errors}`. O planeamento por stream continua no serviço de projetos, nunca é recalculado a partir da matriz no worker. A ausência de áudio mantém-se na saída.
- A B007 não acrescenta uma guarda estrutural de cadeias. A regra «`convert` só no fim» (CONVERT-009) é testada na B008, responsável por cadeias com vários passos.

### Verificações antes de escrever código na etapa 2

1. **V1 — Registos e CRLF:** confirmar os pontos de acréscimo em `projects/video/operations/index.js` e `Tools/video/ops/__init__.py`, e verificar os finais de linha de todos os ficheiros existentes a tocar.
2. **V2 — Matriz e encoding:** confirmar `formats.js`, `plan.js` e `encoding.js`: codecs de saída, cópia por igualdade, corte de dimensões, `+genpts`, destino de preview e os campos exigidos pelo `executor.py`; demonstrar como acrescentar AVI sem modificar linhas H.264/AAC.
3. **V3 — Extras do plano:** confirmar a ordem de `buildPlan`, `applyPlanExtras` e `applyVisualPlanExtras` em `tasks.js`, o plano persistido e a limpeza dos destinos; localizar uma linha nova para o módulo B007 segundo ADR-008/011, sem alterar os módulos anteriores.
4. **V4 — Validação e UI:** confirmar o corpo atual de `tasks.validate`, `projects/routes/videos.js`, `frontend/lib/video-tasks.ts` e `use-video-edit.ts`; provar que o contrato aprovado na D-72 pode ser acrescentado sem mudar linhas existentes e que o painel usa a decisão do servidor.
5. **V5 — Comando e saída dupla:** confirmar em `Tools/video/executor.py` e `task.py` onde um adaptador novo pode acrescentar os parâmetros AVI, gerar AVI e MP4 na mesma invocação, passar os dois ficheiros à fase de upload e evitar a segunda geração de preview para AVI, sem substituir linhas existentes nem perder FFprobe/progresso/cancelamento (ADR-009). Se a prova falhar, registar nova dúvida e parar antes de implementar.
6. **V6 — Reprodução e storage:** confirmar em `Tools/video/ingest.py`, `projects/video/tasks.js`, `projects/routes/videos.js` e `video-player.tsx` que MOV/AVI/MP4 incompatível recebem `preview_key` quando gerado, e que download e operações usam `original_key`.
7. **V7 — Âmbito e montagem:** confirmar que `video-player.tsx` admite uma linha nova para a ação B007 e que a submissão de um passo reutiliza aceitação, quota, cancelamento e progresso da B003. Não acrescentar suporte geral a cadeias, junção ou fotogramas.
8. **V8 — Auditoria de acréscimo:** antes de escrever, registar os ficheiros existentes previstos e a forma exata de cada linha nova. Depois, comparar com `origin/main`, preservar CRLF e parar com dúvida nova se qualquer extensão exigir alteração ou remoção de uma linha existente.

### Critérios de aceitação da B007

- [ ] CONVERT-001/002/010: mostrar formato/codecs atuais, destinos suportados sem o atual e submissão de `convert` v1.
- [ ] CONVERT-003/004: apresentar codecs de saída e modos vindos da validação; recusar formato igual/desconhecido antes de tarefa e quota, com códigos corretos.
- [ ] CONVERT-005/006: produzir H.264/AAC em MP4/MOV ou MPEG-4 Part 2/MP3 em AVI, com stream de áudio ausente preservada; verificar cópia por igualdade de codec segundo D-70.
- [ ] CONVERT-007: preservar duração, fps e dimensões de apresentação dentro da tolerância medida; aplicar a decisão D-71 às dimensões ímpares; `+genpts` em AVI com vídeo copiado.
- [ ] CONVERT-008: gerar e usar a cópia MP4 para resultados MOV/AVI e, segundo D-69, MP4 incompatível; original permanece como ficheiro de download e de novas operações.
- [ ] NFR-011, NFR-022: FFprobe e descodificação sem erros em cada caminho; reprodução integral verificada nos leitores de referência disponíveis e registada na checklist manual.
- [ ] B003: novo recurso apenas após sucesso; cancelamento/falha sem publicação parcial, com devolução de quota e limpeza; progresso visível. Regressões de vídeo e imagem sem nova falha.
- [ ] Regra 2.6: zero linhas removidas ou alteradas no código face a `origin/main`; verificação de CRLF, lint/typecheck, revisão de código e relatório de testes.

CONVERT-009 fica rastreado para a B008, que valida a estrutura das cadeias. O checkpoint da etapa 1 foi aprovado em 2026-10-22T22:28:37Z. A etapa 2 começa pelas verificações V1–V8, antes de escrever código.
