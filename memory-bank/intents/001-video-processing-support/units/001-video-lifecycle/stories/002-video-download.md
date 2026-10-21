---
id: ST-VID-006
unit: 001-video-lifecycle
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 002-video-access
implemented: false
---

# Story: ST-VID-006 — Descarregar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de leitura, edição ou propriedade
**I want** descarregar um vídeo concluído do projeto
**So that** obter uma cópia do recurso autorizado no formato armazenado

## Acceptance Criteria

- [ ] Com permissão de leitura, edição ou de proprietário sobre um vídeo concluído, quando confirmo o descarregamento, então recebo `{url, fileName, expiresAt}` com um URL assinado de 15 minutos e o nome sugerido; o ficheiro é entregue no formato armazenado, nunca a cópia de pré-visualização.
- [ ] Quando não tenho acesso ao projeto, sou utilizador anónimo, o vídeo não está `completed` ou o objeto não existe, então o pedido é recusado (403, 409 `RESOURCE_NOT_READY` ou 404 `RESOURCE_UNAVAILABLE`) e não é emitido URL.
- [ ] O URL é portador: depois de expirar, o storage responde 403; repetir o pedido gera um URL novo.
- [ ] Quando retomo uma transferência interrompida com `Range`, o storage responde 206; os dados não passam pelo API Gateway e não há débito de quota.
- [ ] Cada emissão de URL fica registada nos logs com `correlationId`, utilizador e recurso, sem a assinatura do URL.

## Traceability

- **Use case:** UC-VID-006.
- **Requirements:** `REQ-VID-DOWNLOAD-001` a `009`; `REQ-VID-NFR-016`, `025`. Consome `REQ-VID-AUTH-*`, `REQ-VID-QUOTA-008`, `REQ-VID-NFR-001`, `017`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.1, T-08 (`videoUrls`, `/s3-video/`), T-10 (registo e `log_format` sem *query string*), Q-ADD-05 (URL portador), Q-ADD-08 (sufixo do nome, pendente no ADD).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
