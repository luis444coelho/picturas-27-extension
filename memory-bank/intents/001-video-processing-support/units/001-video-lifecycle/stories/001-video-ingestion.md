---
id: ST-VID-000
unit: 001-video-lifecycle
intent: 001-video-processing-support
status: ready
priority: must
created: 2026-10-19T17:31:16Z
assigned_bolt: 001-video-lifecycle
implemented: false
---

# Story: ST-VID-000 — Carregar e visualizar vídeo

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** carregar, validar e visualizar um vídeo no projeto
**So that** poder gerir os seus recursos sem alterar a quota ao carregar ou reproduzir

## Acceptance Criteria

- [ ] Com JWT válido e permissão de edição, quando carrego um MP4, MOV ou AVI dentro dos limites do perfil e da matriz de codecs, então o sistema valida-o, guarda-o na coleção `videos` e no estágio `video_src`, e regista os metadados técnicos, incluindo a etiqueta de rotação e as dimensões de apresentação.
- [ ] Na ingestão, o sistema gera a miniatura a 00:00:01 (ou no fotograma 0, se o vídeo tiver menos de 1 s) e guarda o fotograma 0, rodado e reduzido a no máximo 1280 px de largura, para as pré-visualizações.
- [ ] Para um original MOV ou AVI, ou um MP4 com um perfil H.264 que os navegadores não reproduzem (10 bits, 4:2:2, 4:4:4), o sistema gera uma cópia de pré-visualização MP4 (`yuv420p`), usada só pelo leitor integrado.
- [ ] Quando o ficheiro excede os limites, tem formato ou codec fora da matriz, está corrompido, ou a transferência falha ou é cancelada, então o carregamento é rejeitado e não fica objeto no storage nem registo em `videos`.
- [ ] Sem JWT válido, qualquer rota de vídeo responde 401; o utilizador `anonymous` recebe 403; a autorização distingue leitura (consultar e descarregar) de edição ou propriedade (carregar e transformar), com o `videoAuth` nos routers de vídeo.
- [ ] Quando abro um vídeo concluído, posso reproduzi-lo no leitor integrado; o carregamento e a reprodução não debitam quota.

## Traceability

- **Use case:** UC-VID-000.
- **Requirements:** `REQ-VID-AUTH-001` a `003` (specsDuvidas D-02); `REQ-VID-UPLOAD-001` a `020`; `REQ-VID-STORAGE-001` a `005`; `REQ-VID-NFR-001`, `003`, `008`, `010` (specsDuvidas D-03), `011` (specsDuvidas D-09), `017`. Consome `REQ-VID-COM-*`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** T-00 (coleção `videos`, ingestão, estágios), T-06 e Q-ADD-20 (cópia MP4), T-07 e Q-ADD-06 (fotograma 0), T-08 (estágios de vídeo, `location` de carregamento), Q-ADD-13 (dimensões de apresentação), Q-ADD-22 (miniatura de vídeos curtos), Q-ADD-04 (estratégia de carregamento, pendente no ADD); T-00 e T-02 na parte de que a ingestão precisa: `formats.js`, routers com o `videoAuth`, filas, `wsGateway/video.js`, URLs de escrita e worker com a ingestão (specsDuvidas D-02); `amqp.js`, URLs internos de leitura com o `route/video.js` e o `videoUrls.js`, volume `video_tmp` e declaração completa da `video_operations_queue` (specsDuvidas D-08). Sem `video_zip` nem `batch_id` (specsDuvidas D-06).

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
