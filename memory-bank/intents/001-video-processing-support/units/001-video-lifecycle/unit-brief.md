---
unit: 001-video-lifecycle
intent: 001-video-processing-support
phase: inception
status: complete
created: 2026-10-18T18:00:00.000Z
updated: 2026-10-23
default_bolt_type: ddd-construction-bolt
---

# Unit Brief: Ciclo de vida e acesso a vídeo

## Objetivo e âmbito

Ciclo de vida e acesso a vídeo no projeto PictuRAS, com preservação dos originais e resultados persistidos. **Casos:** UC-VID-000, UC-VID-005 e UC-VID-006.

## Requisitos e Stories

Esta Unit tem 70 requisitos funcionais exclusivos: UPLOAD, DOWNLOAD, INFO e requisitos comuns de autorização, quota, armazenamento, tarefas e erros. Os requisitos não funcionais são rastreados por responsabilidade na [matriz do intent](../../traceability.md), com resultados e limitações no Capítulo 10 do relatório.

- [ST-VID-000](stories/ST-VID-000-video-ingestion.md)
- [ST-VID-006](stories/ST-VID-006-video-download.md)
- [ST-VID-007](stories/ST-VID-007-video-information.md)
- [ST-VID-COM-001](stories/ST-VID-COM-001-video-task-quota-foundation.md)

## Contratos e dependências

A Unit 001 fornece autenticação/autorização, recursos de vídeo, armazenamento, tarefas, quota, mensagens e erros. A Unit 002 utiliza esses contratos e fornece operações elegíveis à Unit 003, que compõe junção, subcadeias por clip e passos finais. A cadeia é executada como uma tarefa e publica apenas o vídeo final; falha e cancelamento desencadeiam limpeza e compensação. Não há dependências circulares.

## Bolts e verificação

- [B001 — 001-video-lifecycle](../../../../bolts/001-video-lifecycle/bolt.md): concluído.
- [B002 — 002-video-access](../../../../bolts/002-video-access/bolt.md): concluído.
- [B003 — 003-video-task-foundation](../../../../bolts/003-video-task-foundation/bolt.md): concluído.

Os critérios normativos e a respetiva evidência são os da ERS e da matriz de verificação do relatório. «Construção concluída» não significa que todos os alvos tenham validação integral; os desvios e ensaios incompletos permanecem identificados.
