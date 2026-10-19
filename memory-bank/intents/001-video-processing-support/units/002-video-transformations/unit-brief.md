---
unit: 002-video-transformations
intent: 001-video-processing-support
phase: inception
status: ready
created: 2026-10-18T18:00:00Z
updated: 2026-10-19T17:31:16Z
default_bolt_type: ddd-construction-bolt
---

# Unit Brief: Transformações de vídeo

## Objetivo e âmbito

Implementar operações isoladas não destrutivas de vídeo, incluindo a exportação de fotogramas como recursos de imagem do projeto. Cada operação integra a interface, validação, submissão assíncrona, worker e persistência do resultado, conforme os contratos da Unit 001.

**Casos:** UC-VID-001 a UC-VID-005 e UC-VID-008 a UC-VID-012. **Stories:** ST-VID-001 a ST-VID-005 e ST-VID-008 a ST-VID-012.

## Requisitos atribuídos

- **93 FR (propriedade exclusiva):** `REQ-VID-TRIM-*` (10), `AUDIO-*` (6), `SPEED-*` (8), `WATERMARK-*` (11), `FRAMES-*` (13), `ADJUST-*` (10), `FILTER-*` (7), `RESIZE-*` (9), `ORIENT-*` (9), `CONVERT-*` (10).
- **NFR (8):** `REQ-VID-NFR-004`, `010`, `012`, `015`, `018`, `019`, `020`, `026`.
- Usa sem assumir propriedade dos contratos comuns de autorização, tarefa, quota e storage da Unit 001.

## Conceitos, interfaces e limites

- Conceitos: Vídeo, Imagem, FerramentaVídeo, FerramentaImagem, TrabalhoProcessamento.
- Responsabilidades: validação específica de parâmetros; configuração e pré-visualização quando requeridas; submissão de operação isolada; armazenamento de novo resultado após sucesso; extração de imagens com resolução, timestamp e proveniência.
- Entradas/saídas: vídeo elegível e parâmetros aprovados → tarefa assíncrona → novo vídeo ou imagens normais do projeto. Os originais nunca são modificados.
- A ferramenta de imagem continua a aceitar imagens; não processa vídeos. Fotogramas extraídos podem seguir o fluxo normal de imagem.
- Não implementa ingestão/acesso, junção, cadeias ou lotes.

## Dependências e critérios de sucesso

- Depende da Unit 001 para autorização, seleção de recursos, contratos de tarefas, quota, erros e storage.
- UC-VID-005 depende adicionalmente do modelo, serviço e pipeline de imagens existente na baseline.
- Critérios: os 11 casos atribuídos cumprem os AC dos requisitos; nenhum resultado é publicado antes de concluído; falha/cancelamento não altera o original nem deixa artefactos parciais; as saídas respeitam a matriz da ERS.

## Bolts

- B004 `004-video-basic-edits` (DDD): UC-VID-001/002/003.
- B005 `005-video-visual-edits` (Simple): UC-VID-004/008/009/010/011.
- B006 `006-video-frame-export` (DDD): UC-VID-005; requer integração com a baseline de imagens.
- B007 `007-video-format-conversion` (Simple): UC-VID-012.
