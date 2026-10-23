---
stage: implement
bolt: 007-video-format-conversion
created: 2026-10-22T22:34:00Z
---

## Implementation Walkthrough: 002-video-transformations / B007

### Summary

A conversão isolada entre MP4, MOV e AVI está ligada ao registo do serviço de projetos, ao worker e ao painel de vídeo. O serviço de projetos continua a ser a fonte da matriz, das decisões por stream e do destino de pré-visualização; o worker executa o plano recebido e publica os resultados pelo contrato de tarefas da B003.

### Structure Overview

O módulo de operação valida e estima a conversão. Um módulo de extras transporta a instrução de saída dupla e os modos da validação. No worker, um ramo exclusivo da conversão usa as rotinas existentes de execução, metadados, imagens, storage, progresso e cancelamento; os painéis B004/B005 e os respetivos fluxos continuam nos caminhos anteriores. O frontend apresenta opções de contentor e a decisão de cópia ou recodificação recebida da validação.

### Completed Work

- [x] `projects/video/operations/convert.js` — operação e validações de formato.
- [x] `projects/video/operations/index.js` — linha de registo da operação.
- [x] `projects/video/encoding.js` — parâmetros AVI da D-68, acrescentados à tabela existente.
- [x] `projects/video/convertPlanExtras.js` — extras da execução e campos de validação exclusivos da conversão.
- [x] `projects/video/tasks.js` — linhas de ligação para extras, modos e erros específicos.
- [x] `Tools/video/ops/convert.py` — operação no registo do worker.
- [x] `Tools/video/ops/__init__.py` — linhas de registo no worker.
- [x] `Tools/video/convert_task.py` — execução isolada da conversão e saída dupla AVI/MP4.
- [x] `Tools/video/task.py` — linha de desvio exclusiva de `convert` para o módulo novo.
- [x] `frontend/lib/video-convert.ts` — destinos, passo e apresentação dos dados devolvidos pela validação.
- [x] `frontend/components/video/video-convert-actions.tsx` — ação e painel de conversão.
- [x] `frontend/components/video/video-player.tsx` — montagem da ação no leitor.
- [x] `memory-bank/bolts/007-video-format-conversion/implementation-preflight.md` — evidência V1–V8 antes de escrever código.
- [x] `memory-bank/bolts/007-video-format-conversion/adr-013-convert-worker-path.md` — decisão proposta sobre o ramo do worker.
- [x] `memory-bank/bolts/007-video-format-conversion/adr-014-convert-validation-modes.md` — decisão proposta sobre a resposta de validação.
- [x] `memory-bank/standards/decision-index.md` — índice dos ADR-013/014 aceites no checkpoint da etapa 2.

### Key Decisions

- **D-68 (c):** AVI usa a qualidade e o bitrate aprovados pela equipa; MP4/MOV conservam a D-39.
- **D-69/70/71 (a):** cópia MP4 para perfis incompatíveis, cópia de stream apenas por igualdade de codec e corte de dimensão ímpar apenas ao recodificar.
- **D-72 (a):** os modos são acrescentados apenas à validação da conversão; os caminhos B004/B005 não recebem os novos campos.
- **ADR-013 aceite:** o comando genérico da B003 permanece intacto; a conversão isolada usa um ramo novo que partilha os serviços de execução e publicação.
- **ADR-014 aceite:** a validação transmite os modos do plano ao painel sem duplicar a matriz no frontend.

### Deviations from Plan

O plano previa adaptar o comando no ponto de chamada do worker. A verificação V5 mostrou que o construtor genérico aceita uma saída e exige parâmetros H.264. A implementação usa um ramo aditivo para `convert`, documentado no ADR-013, mantendo as linhas e os comandos anteriores intactos.

### Dependencies Added

Nenhuma.

### Developer Notes

Esta etapa passou nas verificações de sintaxe, TypeScript, ESLint e Prettier dos módulos novos. O `tasks.js` existente continua a produzir um aviso Prettier nas duas chamadas longas de `applyPlanExtras`/`applyVisualPlanExtras` herdadas da B004/B005; a regra 2.6 impede reformatá-las, e todas as linhas acrescentadas estão formatadas. Um ensaio isolado de FFmpeg gerou AVI MPEG-4/MP3 e cópia MP4 H.264/AAC na mesma invocação; a matriz completa, integração, regressões e reprodução manual pertencem à etapa 3. CONVERT-009 e as cadeias com vários passos pertencem à B008. Os ADR-013/014 foram aceites no checkpoint desta etapa.
