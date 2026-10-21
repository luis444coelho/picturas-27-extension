---
unit: 003-video-composition
intent: 001-video-processing-support
phase: inception
status: ready
created: 2026-10-18T18:00:00Z
updated: 2026-10-21T11:23:25Z
default_bolt_type: ddd-construction-bolt
---

# Unit Brief: Composição e processamento em lote

## Objetivo e âmbito

Compor vídeos e operações já suportadas em junções, cadeias e lotes, preservando as semânticas específicas de atomicidade, sequência, quota, progresso e resultados independentes.

**Casos:** UC-VID-013, UC-VID-014, UC-VID-015. **Stories:** ST-VID-013 a ST-VID-015.

## Requisitos atribuídos

- **50 FR (propriedade exclusiva):** `REQ-VID-CONCAT-*` (13), `CHAIN-*` (18), `BATCH-*` (19).
- **NFR (4):** `REQ-VID-NFR-014` (dona: ST-VID-013, B008, na parte da junção e da cadeia; specsDuvidas D-10), `022`, `023`, `024`. A NFR-013 passou para a Unit 001 (B003); a B008 continua a verificá-la nos critérios de aceitação, com a NFR-010 e a NFR-018 (specsDuvidas D-03).
- **Fora desta construção (specsDuvidas D-06):** o processamento em lote (UC-VID-015, ST-VID-015, B009); os `REQ-VID-BATCH-*` (19) ficam não cobertos. A NFR-014 fica não coberta só na parte de lotes (UC-VID-015 RN2) e continua coberta na parte da junção e da cadeia (UC-VID-013 RN2-RN3, UC-VID-014 RN5) (specsDuvidas D-07); a parte coberta pertence à ST-VID-013 e à B008, e a ST-VID-014 verifica-a (specsDuvidas D-10). A predefinição de cadeia continua a poder ser guardada e usada numa nova cadeia (UC-VID-014 FA3); só deixa de poder ser carregada num lote.
- Usa os contratos comuns da Unit 001 e as operações elegíveis da Unit 002; estes requisitos funcionais mantêm a propriedade das respetivas Units.

## Conceitos, interfaces e limites

- Conceitos: TrabalhoProcessamento agregador, cadeia, passo, junção, lote e subtarefa por vídeo.
- Junção: aplica o perfil e os limites de entradas da ERS. Cadeia: até 10 passos, com restrições de composição e um resultado final atómico. Lote: operação ou cadeia aplicável, execução sequencial, sem junção nem extração de fotogramas; cada vídeo produz resultado independente.
- A quota é reservada (debitada) na aceitação e a reserva torna-se definitiva na conclusão, sem passo de confirmação; falha ou cancelamento devolve os créditos (T-04, Q-ADD-03). Quota insuficiente para o custo total rejeita a cadeia ou o lote antes de o admitir.
- Decisões do ADD: junção como cadeia de um passo `concat` (4.8, Q-ADD-13, Q-ADD-25); validação em três fases, passo corrente aproximado e predefinições de vídeo numa coleção nova do serviço de utilizadores, sem partilha (4.9, Q-ADD-16); `VideoBatch`, itens sequenciais e ZIP em segundo plano com `archiver` (4.10, T-09; Q-ADD-09 pendente no ADD).
- Não duplica a implementação das ferramentas individuais, ingestão, consulta ou download.

## Dependências e critérios de sucesso

- Depende da Unit 001 para autorização, tarefa, quota, storage e erros, e da Unit 002 para as operações elegíveis.
- O executor de cadeias com um único `-filter_complex` vem da B003 (`artefactos-finais.md` §5); a B008 acrescenta a operação `concat` e a validação de estrutura. UC-VID-014 tem execução atómica. UC-VID-015 é sequencial e tolera falha por vídeo. O código existente não é alterado (regra 2.6).
- Critérios: cumprir os limites e regras dos requisitos; não publicar resultados parciais de cadeia; preservar resultados de vídeos já concluídos num lote; estornar créditos de trabalho não concluído.

## Bolts

- B008 `008-video-concat-chain` (DDD): UC-VID-013/014 (junção e validação de estrutura); dona da NFR-014 na parte da junção e da cadeia (specsDuvidas D-10); depende de B004, B005 e B007.
- B009 `009-video-batch` (DDD): UC-VID-015; depende de B002, B004, B005 e B008. **`blocked`:** fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06).
