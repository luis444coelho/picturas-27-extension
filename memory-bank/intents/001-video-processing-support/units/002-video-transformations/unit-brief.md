---
unit: 002-video-transformations
intent: 001-video-processing-support
phase: inception
status: ready
created: 2026-10-18T18:00:00Z
updated: 2026-10-21T11:19:15Z
default_bolt_type: ddd-construction-bolt
---

# Unit Brief: Transformações de vídeo

## Objetivo e âmbito

Implementar operações isoladas não destrutivas de vídeo, incluindo a exportação de fotogramas como recursos de imagem do projeto. Cada operação integra a interface, validação, submissão assíncrona, worker e persistência do resultado, conforme os contratos da Unit 001.

**Casos:** UC-VID-001 a UC-VID-005 e UC-VID-008 a UC-VID-012. **Stories:** ST-VID-001 a ST-VID-005 e ST-VID-008 a ST-VID-012.

## Requisitos atribuídos

- **93 FR (propriedade exclusiva):** `REQ-VID-TRIM-*` (10), `AUDIO-*` (6), `SPEED-*` (8), `WATERMARK-*` (11), `FRAMES-*` (13), `ADJUST-*` (10), `FILTER-*` (7), `RESIZE-*` (9), `ORIENT-*` (9), `CONVERT-*` (10).
- **NFR (6):** `REQ-VID-NFR-004`, `012`, `015`, `019`, `020`, `026`. A NFR-010 e a NFR-018 passaram para a Unit 001 (B001 e B003); a B004 continua a verificá-las nos critérios de aceitação (specsDuvidas D-03).
- **Fora desta construção (specsDuvidas D-06):** a extração de fotogramas (UC-VID-005, ST-VID-005, B006); os `REQ-VID-FRAMES-*` (13) ficam não cobertos. A NFR-004, a NFR-019 e a NFR-020, que só servem a extração, também ficam não cobertas (specsDuvidas D-07).
- Usa sem assumir propriedade dos contratos comuns de autorização, tarefa, quota e storage da Unit 001.

## Conceitos, interfaces e limites

- Conceitos: Vídeo, Imagem, FerramentaVídeo, FerramentaImagem, TrabalhoProcessamento.
- Responsabilidades: um módulo por operação no registo de operações (`projects/video/operations/`) e no worker (`Tools/video/ops/`), executado como cadeia de um passo pelo executor da B003 (T-01, T-02); pré-visualizações estáticas com `sharp` sobre o fotograma 0 (T-07); decisões por operação do ADD 4.3 a 4.7 (incluindo Q-ADD-12, 18, 21, 23, 24 e 25; Q-ADD-07 e Q-ADD-11 pendentes no ADD); extração de imagens com resolução, timestamp e proveniência, fora desta construção; o desenho fica para um complemento ao ADD, se a B006 for retomada (specsDuvidas D-05, D-06).
- Entradas/saídas: vídeo elegível e parâmetros aprovados → tarefa assíncrona → novo vídeo ou imagens normais do projeto. Os originais nunca são modificados.
- A ferramenta de imagem continua a aceitar imagens; não processa vídeos. Fotogramas extraídos podem seguir o fluxo normal de imagem.
- Não implementa ingestão/acesso, junção, cadeias ou lotes.

## Dependências e critérios de sucesso

- Depende da Unit 001 para autorização, seleção de recursos, contratos de tarefas, quota, erros e storage.
- UC-VID-005 depende adicionalmente do modelo, serviço e pipeline de imagens existente na baseline.
- Critérios: os 11 casos atribuídos cumprem os AC dos requisitos; nenhum resultado é publicado antes de concluído; falha/cancelamento não altera o original nem deixa artefactos parciais; as saídas respeitam a matriz da ERS; as ferramentas e componentes de imagem existentes não são alterados (regra 2.6).

## Bolts

- B004 `004-video-basic-edits` (DDD): UC-VID-001/002/003 (T-02); depende de B003.
- B005 `005-video-visual-edits` (Simple): UC-VID-004/008/009/010/011 (ADD 4.3 a 4.6, T-07); depende de B003.
- B006 `006-video-frame-export` (DDD): UC-VID-005; depende de B003 e requer integração com a baseline de imagens. **`blocked`:** fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06).
- B007 `007-video-format-conversion` (Simple): UC-VID-012 (ADD 4.7, T-05, T-06); depende de B003.
