---
id: 009-video-batch
unit: 003-video-composition
intent: 001-video-processing-support
type: ddd-construction-bolt
status: blocked
# motivo: Fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06)
stories: [ST-VID-015]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [002-video-access, 004-video-basic-edits, 005-video-visual-edits, 008-video-concat-chain]
enables_bolts: []
requires_units: [001-video-lifecycle, 002-video-transformations]
blocks: true
# avg_complexity: maior esforço do ADD no bolt (S=1, M=2, L=3); os outros campos são preenchidos no início do bolt na Construção (specsDuvidas D-01)
complexity: {avg_complexity: 3, avg_uncertainty: null, max_dependencies: null, testing_scope: null}
---

# Bolt: 009-video-batch

> 🚫 **Bloqueado.** Fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06). O bolt fica no memory-bank para não se perder a rastreabilidade; os requisitos `REQ-VID-BATCH-*`, a `REQ-VID-TASK-007` e a parte de lotes da `REQ-VID-QUOTA-007` ficam marcados como não cobertos nesta construção.

## Visão geral

Processamento em lote (UC-VID-015): a mesma operação ou cadeia aplicada a vários vídeos, item a item, com descarregamento em ZIP (ADD v1.1, 4.10 e T-09).

## Objetivo

Implementar o modelo `VideoBatch`, a pré-validação, a orquestração sequencial dos itens com o executor da B003, o cancelamento, os eventos agregados e o ZIP em segundo plano com `archiver`.

## Stories incluídas

- **ST-VID-015 — Processar vídeos em lote**: [Processar vídeos em lote](../../intents/001-video-processing-support/units/003-video-composition/stories/003-video-batch.md) (must).

## Tipo de bolt

**Tipo**: DDD Construction Bolt
**Definição**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

## Etapas

- [ ] **1. Domain Model**: Pending → `ddd-01-domain-model.md`
- [ ] **2. Technical Design**: Pending → `ddd-02-technical-design.md`
- [ ] **3. ADR Analysis** (opcional): Pending → `adr-{n}-{slug}.md`
- [ ] **4. Implement**: Pending → código nos componentes indicados em "Saídas esperadas"
- [ ] **5. Test**: Pending → `ddd-03-test-report.md`

## Requisitos rastreados

REQ-VID-BATCH-001 a 019; parte de lotes da REQ-VID-NFR-014.

Os `REQ-VID-BATCH-*` não são cobertos nesta construção (specsDuvidas D-06). A NFR-014 fica não coberta só na parte de lotes (UC-VID-015 RN2) e continua coberta na parte da junção e da cadeia (UC-VID-013 RN2-RN3, UC-VID-014 RN5) (specsDuvidas D-07). A NFR-014 passou a pertencer à ST-VID-013 e à B008, que constroem a parte da junção e da cadeia; a parte de lotes fica neste bolt, "parcialmente não coberta (D-06)" (specsDuvidas D-10).

Os critérios de aceitação autoritativos são os dos ficheiros `docs/requirements/REQ-VID-*.md`; a propriedade de cada requisito está em `intents/001-video-processing-support/traceability.md`.

## Decisões do ADD v1.1

- **T-09:** modelo `projects/models/videoBatch.js` (`steps`, `status`, `items[]`, `cost_per_item`, `reserved_credits`, `refunded_credits`, `zip`); aceitação pela ordem do T-03 com `holder_kind: "batch"` e reserva de `custo × elegíveis`; publica só o primeiro item; no máximo um item em `processing`; devolução por item falhado; estado final `cancelled`, `completed` (≥ 1 concluído) ou `failed`; o lugar de tarefa ativa só é libertado no fim.
- **T-09 (eventos):** `video-batch-update` com o estado de cada item, o progresso `(terminados + progresso do item em curso) / total` e o resumo final; `batchId`, `itemIndex` e `itemCount` nas mensagens dos itens.
- **4.10 (rotas):** `POST …/batch/validate` (pré-validação com `validate`/`estimate`, `INVALID_BATCH_OPERATION`, `INSUFFICIENT_INPUTS`, `TOO_MANY_INPUTS`, `NO_ELIGIBLE_INPUTS`), `POST …/batch`, `GET …/batch/:id`, `DELETE …/batch/:id` (403 para quem não submeteu, 409 fora de `queued`/`processing`), `POST` e `GET …/batch/:id/zip`.
- **4.10 (ZIP):** geração em segundo plano numa rota interna nova do módulo de vídeo do `imageStorageService`, com `archiver` (ZIP64) e `s3.upload()` multipart no estágio `video_zip`; `POST` devolve 202 e só é aceite com o lote `completed`, ou `cancelled` com ≥ 1 concluído (409 nos outros casos); chave própria por geração; nomes com o `downloadFileName` da 4.1 e sufixo numérico; `GET` devolve o URL assinado de 15 min ou 409. **Q-ADD-09 (pendente no ADD):** limite, retenção e remoção dos ZIP.
- **ADD 6:** `archiver` é a única dependência npm nova (o `jszip` não suporta ZIP64).
- **Q-ADD-14:** recuperação de lotes parados e de ZIP sem progresso; fica fora desta construção, porque a B009 não é implementada; a B003 só constrói a parte que não depende de lotes (specsDuvidas D-04).

## Saídas esperadas

- `projects/models/videoBatch.js` e orquestração dos itens no serviço de projetos (T-09).
- Rotas de lote no router de vídeo do gateway e do serviço de projetos (4.10).
- Rota interna do ZIP no módulo de vídeo do `imageStorageService` e `archiver` no `imageStorageService/package.json`.
- Evento `video-batch-update` no `wsGateway/video.js`.
- Frontend: seleção múltipla, configuração única (painéis ou predefinição), lista de pré-validação com exclusão, resumo de custo, progresso agregado e "Descarregar Lote".
- Testes ligados aos critérios de `REQ-VID-BATCH-*` e da parte de lotes da NFR-014.

## Critérios de passagem

- [ ] Stories incluídas implementadas e respetivos critérios de aceitação cumpridos.
- [ ] Critérios de aceitação dos requisitos rastreados (ficheiros `docs/requirements/REQ-VID-*.md`) verificados por testes.
- [ ] Nenhuma linha de código existente alterada (regra 2.6 do ADD); o fluxo de imagem continua a funcionar como antes.
- [ ] Testes automatizados e relatório do bolt registados; nenhum resultado de teste é presumido nesta fase.
- [ ] Código revisto.
- [ ] Num lote com um item falhado, os restantes concluem, o item falhado é devolvido de imediato e o resumo indica concluídos, falhados e créditos debitados.
- [ ] O cancelamento devolve numa única chamada os créditos dos itens pendentes e do item em curso e mantém os vídeos já concluídos.

## Dependências

### Requer

- **Bolts:** 002-video-access (URL assinado e `downloadFileName`), 004-video-basic-edits, 005-video-visual-edits, 008-video-concat-chain (cadeias e predefinições).
- **Units:** 001-video-lifecycle, 002-video-transformations.

### Desbloqueia

- Nenhum (último bolt).

## Limites

- **Regra 2.6 do ADD ("só acrescentar"):** o código existente não é alterado. Só se acrescentam ficheiros novos e pontos de ligação novos (uma linha `app.use` ou `require`, uma fila, exchange ou *binding* em `rabbitMQ/definitions.json`, um serviço ou volume no `docker-compose.yaml`, um `location` ou `log_format` no `nginx/nginx.conf`, componentes novos no frontend), sem tocar nas linhas existentes nem mudar o comportamento do fluxo de imagem.
- O worker não muda: cada item é uma cadeia normal executada pelo executor da B003.
- O serviço de utilizadores não muda (reutiliza a reserva e o `refund`, T-04); o ZIP de imagens com `jszip` não é usado nem alterado.

## Notas

- Peças do ADD só usadas pelos lotes que a B001 e a B003 não constroem (specsDuvidas D-06): o modelo `VideoBatch`, o estágio `video_zip`, o campo `batch_id` em `videos`, o endpoint `POST …/videos/batch`, os itens `kind: "batch_item"`, a devolução por item, a rotina de lotes e ZIP da Q-ADD-14 e a dependência `archiver`.
- Esforço no ADD: UC-VID-015 = L. `avg_complexity` = 3 (maior esforço do ADD no bolt, com S=1, M=2, L=3); `avg_uncertainty`, `max_dependencies` e `testing_scope` são preenchidos no início do bolt na Construção (specsDuvidas D-01).
