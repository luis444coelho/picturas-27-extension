---
intent: 001-video-processing-support
phase: inception
status: in-progress
created: 2026-10-19T17:31:16Z
updated: 2026-10-19T17:31:16Z
---

# Requisitos: Suporte a vídeo no PictuRAS

## Fonte canónica e âmbito

Este ficheiro é o índice de requisitos da intent SpecsMD. A ERS detalhada e autoritativa da Fase 1 é [`docs/requirements.md`](../../../docs/requirements.md), com texto atómico, prioridade, classificação ALT/NOVO, origem e critérios de aceitação em [`docs/requirements/`](../../../docs/requirements/). Não duplicar nem reinterpretar esses requisitos neste índice.

O âmbito atual é a extensão de vídeo descrita pelos 16 casos em [`docs/use-cases/`](../../../docs/use-cases/UC-VID-000.md): ingestão e visualização, operações de vídeo, exportação de fotogramas, acesso, junção, cadeias e lotes. O rascunho inicial de cinco operações foi preservado em [`requirements-initial-proposal.md`](requirements-initial-proposal.md) apenas como histórico; não é base para implementação.

## Inventário ERS v2.3

| Grupo de requisitos | Prefixo / ficheiro canónico | Quantidade |
|---|---|---:|
| Regras comuns, autorização, quota, storage, tarefas e erros | `REQ-VID-COM`, `AUTH`, `QUOTA`, `STORAGE`, `TASK`, `ERROR` — [`REQ-VID-COM.md`](../../../docs/requirements/REQ-VID-COM.md) | 33 FR |
| UC-VID-000 — carregamento | `REQ-VID-UPLOAD` — [`REQ-VID-UPLOAD.md`](../../../docs/requirements/REQ-VID-UPLOAD.md) | 20 FR |
| UC-VID-001 — recorte | `REQ-VID-TRIM` — [`REQ-VID-TRIM.md`](../../../docs/requirements/REQ-VID-TRIM.md) | 10 FR |
| UC-VID-002 — áudio | `REQ-VID-AUDIO` — [`REQ-VID-AUDIO.md`](../../../docs/requirements/REQ-VID-AUDIO.md) | 6 FR |
| UC-VID-003 — velocidade | `REQ-VID-SPEED` — [`REQ-VID-SPEED.md`](../../../docs/requirements/REQ-VID-SPEED.md) | 8 FR |
| UC-VID-004 — marca de água | `REQ-VID-WATERMARK` — [`REQ-VID-WATERMARK.md`](../../../docs/requirements/REQ-VID-WATERMARK.md) | 11 FR |
| UC-VID-005 — fotogramas | `REQ-VID-FRAMES` — [`REQ-VID-FRAMES.md`](../../../docs/requirements/REQ-VID-FRAMES.md) | 13 FR |
| UC-VID-006 — descarregamento | `REQ-VID-DOWNLOAD` — [`REQ-VID-DOWNLOAD.md`](../../../docs/requirements/REQ-VID-DOWNLOAD.md) | 9 FR |
| UC-VID-007 — informação | `REQ-VID-INFO` — [`REQ-VID-INFO.md`](../../../docs/requirements/REQ-VID-INFO.md) | 9 FR |
| UC-VID-008 — ajustes visuais | `REQ-VID-ADJUST` — [`REQ-VID-ADJUST.md`](../../../docs/requirements/REQ-VID-ADJUST.md) | 10 FR |
| UC-VID-009 — filtros | `REQ-VID-FILTER` — [`REQ-VID-FILTER.md`](../../../docs/requirements/REQ-VID-FILTER.md) | 7 FR |
| UC-VID-010 — redimensionamento | `REQ-VID-RESIZE` — [`REQ-VID-RESIZE.md`](../../../docs/requirements/REQ-VID-RESIZE.md) | 9 FR |
| UC-VID-011 — orientação | `REQ-VID-ORIENT` — [`REQ-VID-ORIENT.md`](../../../docs/requirements/REQ-VID-ORIENT.md) | 9 FR |
| UC-VID-012 — conversão | `REQ-VID-CONVERT` — [`REQ-VID-CONVERT.md`](../../../docs/requirements/REQ-VID-CONVERT.md) | 10 FR |
| UC-VID-013 — junção | `REQ-VID-CONCAT` — [`REQ-VID-CONCAT.md`](../../../docs/requirements/REQ-VID-CONCAT.md) | 13 FR |
| UC-VID-014 — cadeias | `REQ-VID-CHAIN` — [`REQ-VID-CHAIN.md`](../../../docs/requirements/REQ-VID-CHAIN.md) | 18 FR |
| UC-VID-015 — lotes | `REQ-VID-BATCH` — [`REQ-VID-BATCH.md`](../../../docs/requirements/REQ-VID-BATCH.md) | 19 FR |
| Requisitos não funcionais e de qualidade | `REQ-VID-NFR` — [`REQ-VID-NFR.md`](../../../docs/requirements/REQ-VID-NFR.md) | 26 NFR |
| **Total** | | **214 FR + 26 NFR = 240 requisitos** |

## Objetivos e verificação

- Preservar o original e associar resultados concluídos ao projeto, conforme os critérios da ERS.
- Impor autenticação, permissão de leitura ou edição conforme o caso de uso e contabilizar quota à identidade que submete processamento.
- Manter upload, reprodução, pré-visualização, consulta e download fora do débito de quota; aplicar os custos definidos para operações, cadeias e lotes.
- Executar processamento assíncrono com estados e limites de concorrência; respeitar atomicidade de cadeias e independência de resultados em lotes.
- Manter as ferramentas da baseline tipadas para imagem; fotogramas extraídos são recursos de imagem normais do projeto.

Cada requisito tem o seu critério de aceitação na ERS. A especificação encontra-se pronta para decomposição, mas implementação e execução dos critérios não são declaradas nesta fase. O estado operacional e a ligação requisito→Story→Unit→Bolt constam de [`traceability.md`](traceability.md).

## Restrições e decisões vigentes

Os valores normativos (formatos/codecs, limites por perfil, estados, quotas, limites de junção/cadeia/lote, outputs e política de falhas) são os documentados em `docs/requirements.md`, nos requisitos individuais e nas decisões `DQ-001` a `DQ-025`. As regras transversais estão resumidas em `docs/inception/artefactos-finais.md` e no capítulo 3 do relatório. Em conflito, aplicar a ERS v2.3 e os casos de uso atuais; não usar os valores da proposta histórica.

## Rastreabilidade de origem

Cada requisito canónico conserva o seu vínculo de origem a UC, passo, exceção, regra de negócio ou decisão no próprio ficheiro e no capítulo 7 do relatório. A matriz atual de planeamento associa os IDs exatos a Stories, Units e Bolts em [`traceability.md`](traceability.md).
