---
unit: 003-video-composition
intent: 001-video-processing-support
phase: inception
status: ready
created: 2026-10-18T18:00:00Z
updated: 2026-10-19T17:31:16Z
default_bolt_type: ddd-construction-bolt
---

# Unit Brief: Composição e processamento em lote

## Objetivo e âmbito

Compor vídeos e operações já suportadas em junções, cadeias e lotes, preservando as semânticas específicas de atomicidade, sequência, quota, progresso e resultados independentes.

**Casos:** UC-VID-013, UC-VID-014, UC-VID-015. **Stories:** ST-VID-013 a ST-VID-015.

## Requisitos atribuídos

- **50 FR (propriedade exclusiva):** `REQ-VID-CONCAT-*` (13), `CHAIN-*` (18), `BATCH-*` (19).
- **NFR (5):** `REQ-VID-NFR-013`, `014`, `022`, `023`, `024`.
- Usa os contratos comuns da Unit 001 e as operações elegíveis da Unit 002; estes requisitos funcionais mantêm a propriedade das respetivas Units.

## Conceitos, interfaces e limites

- Conceitos: TrabalhoProcessamento agregador, cadeia, passo, junção, lote e subtarefa por vídeo.
- Junção: aplica o perfil e os limites de entradas da ERS. Cadeia: até 10 passos, com restrições de composição e um resultado final atómico. Lote: operação ou cadeia aplicável, execução sequencial, sem junção nem extração de fotogramas; cada vídeo produz resultado independente.
- Reserva/confirmação/estorno de quota seguem os requisitos da ERS; quota insuficiente para o custo total rejeita o lote antes de o admitir.
- Não duplica a implementação das ferramentas individuais, ingestão, consulta ou download.

## Dependências e critérios de sucesso

- Depende da Unit 001 para autorização, tarefa, quota, storage e erros, e da Unit 002 para as operações elegíveis.
- O UC-VID-013 implementa a junção como operação própria; B008 também prepara a composição elegível para cadeias. UC-VID-014 tem execução atómica. UC-VID-015 é sequencial e tolera falha por vídeo.
- Critérios: cumprir os limites e regras dos requisitos; não publicar resultados parciais de cadeia; preservar resultados de vídeos já concluídos num lote; estornar créditos de trabalho não concluído.

## Bolts

- B008 `008-video-concat-chain` (DDD): UC-VID-013/014; depende das operações elegíveis da Unit 002.
- B009 `009-video-batch` (DDD): UC-VID-015; depende de B008 e das operações elegíveis, além do download de resultados da Unit 001.
