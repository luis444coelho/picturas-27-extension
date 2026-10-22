---
id: 007-video-format-conversion
unit: 002-video-transformations
intent: 001-video-processing-support
type: simple-construction-bolt
status: in-progress
stories: [ST-VID-012]
created: 2026-10-19T17:31:16Z
started: 2026-10-22T22:13:29Z
completed: null
current_stage: implement
stages_completed:
  - name: plan
    completed: 2026-10-22T22:28:37Z
    artifact: implementation-plan.md
requires_bolts: [003-video-task-foundation]
enables_bolts: [008-video-concat-chain]
requires_units: [001-video-lifecycle]
blocks: true
# avg_complexity: maior esforço do ADD no bolt (S=1, M=2, L=3); os outros campos são preenchidos no início do bolt na Construção (specsDuvidas D-01)
complexity: {avg_complexity: 2, avg_uncertainty: 2, max_dependencies: 2, testing_scope: 3}
---

# Bolt: 007-video-format-conversion

## Visão geral

Conversão entre MP4, MOV e AVI (UC-VID-012) definida pela matriz do T-05, com cópia de pré-visualização MP4 (T-06) (ADD v1.1, 4.7).

## Objetivo

Acrescentar a operação `convert` `{target: "mp4"|"mov"|"avi"}` ao registo de operações e ao worker, com o plano de cópia ou recodificação por stream da matriz e a cópia de pré-visualização dos resultados, e o painel de conversão no frontend.

## Stories incluídas

- **ST-VID-012 — Converter formato**: [Converter formato](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-012-video-convert.md) (must).

## Tipo de bolt

**Tipo**: Simple Construction Bolt
**Definição**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Etapas

- ✅ **1. Plan**: aprovado → `implementation-plan.md`
- ⏳ **2. Implement**: em curso → código + `implementation-walkthrough.md`
- [ ] **3. Test**: Pending → `test-walkthrough.md`

## Respostas do checkpoint da etapa 1

- **D-68 (c):** AVI com `mpeg4 -q:v 3 -pix_fmt yuv420p` e `libmp3lame -b:a 192k` em taxa constante; verificar reprodução na etapa 3.
- **D-69 (a):** cópia MP4 também para originais e resultados MP4 com H.264 incompatível.
- **D-70 (a):** cópia por stream apenas se o codec de origem for igual ao de saída da matriz.
- **D-71 (a):** corte de 1 px nas dimensões ímpares quando há recodificação.
- **D-72 (a), condicional:** `videoMode`/`audioMode` apenas na validação da conversão, se V4 confirmar ligação só por acréscimo e respostas B004/B005 intactas.

As opções e respostas completas estão em `docs/specsDuvidas.md`. A B007 trata só a conversão isolada; a validação estrutural de cadeias (CONVERT-009) é da B008. Antes de escrever código na etapa 2, confirmar V1–V8; uma falha que impeça a extensão só por acréscimo origina dúvida nova a partir da D-73 e paragem.

## Requisitos rastreados

REQ-VID-CONVERT-001 a 010; REQ-VID-NFR-012, 026.

Os critérios de aceitação autoritativos são os dos ficheiros `docs/requirements/REQ-VID-*.md`; a propriedade de cada requisito está em `intents/001-video-processing-support/traceability.md`.

## Decisões do ADD v1.1

- **4.7:** `validate` dá `SAME_FORMAT` ou `UNSUPPORTED_TARGET_FORMAT`; `estimate` muda o contentor e os codecs; o painel mostra "Cópia direta" ou "Recodificação" a partir do endpoint de validação (CONVERT-003); como passo de cadeia, só no fim (CONVERT-009, verificado na validação de estrutura da 4.9).
- **T-05 / Q-ADD-21:** cópia de uma stream só quando o codec de origem é igual ao de saída da matriz (um MP4 H.264/AAC para AVI recodifica para MPEG-4 Part 2/MP3); saída AVI com `mpeg4` + `libmp3lame` em taxa constante; `-fps_mode passthrough` na recodificação; `+genpts` para AVI com vídeo copiado.
- **T-06 / Q-ADD-20:** resultado MOV com *remux* para a cópia MP4 numa segunda invocação; resultado AVI com `split`/`asplit` na mesma invocação; cópia também para resultados MP4 com perfis H.264 que os navegadores não reproduzem; guardada em `storage.preview_key`.
- **Q-ADD-11 (pendente no ADD):** bitrate do MP3 e restantes parâmetros de qualidade.
- **Q-ADD-25:** corte de 1 px nas dimensões ímpares quando há recodificação (CONVERT-007).

## Saídas esperadas

- `projects/video/operations/convert.js` (usa o `formats.js` da B003).
- `Tools/video/ops/convert.py` com saída dupla (T-06).
- Frontend: painel de conversão (formato atual, destinos sem o atual, indicação de cópia ou recodificação); o leitor usa `preview_key` para resultados MOV e AVI.
- Testes de descodificação com FFprobe (NFR-012) e de reprodução em VLC e no leitor integrado (NFR-026) para cada caminho da matriz.

## Critérios de passagem

- [ ] Stories incluídas implementadas e respetivos critérios de aceitação cumpridos.
- [ ] Critérios de aceitação dos requisitos rastreados (ficheiros `docs/requirements/REQ-VID-*.md`) verificados por testes.
- [ ] Nenhuma linha de código existente alterada (regra 2.6 do ADD); o fluxo de imagem continua a funcionar como antes.
- [ ] Testes automatizados e relatório do bolt registados; nenhum resultado de teste é presumido nesta fase.
- [ ] Código revisto.
- [ ] Cada caminho da matriz produz o contentor e os codecs da CONVERT-005, com cópia só nos casos da CONVERT-006, e o resultado é descodificável e reproduzível.

## Dependências

### Requer

- **Bolts:** 003-video-task-foundation (registo de operações, `formats.js`, worker e executor).
- **Units:** 001-video-lifecycle.

### Desbloqueia

- 008-video-concat-chain.

## Limites

- **Regra 2.6 do ADD ("só acrescentar"):** o código existente não é alterado. Só se acrescentam ficheiros novos e pontos de ligação novos (uma linha `app.use` ou `require`, uma fila, exchange ou *binding* em `rabbitMQ/definitions.json`, um serviço ou volume no `docker-compose.yaml`, um `location` ou `log_format` no `nginx/nginx.conf`, componentes novos no frontend), sem tocar nas linhas existentes nem mudar o comportamento do fluxo de imagem.
- O utilizador não escolhe codec nem qualidade (UC-VID-012 Q1).

## Notas

- Esforço no ADD: UC-VID-012 = M. `avg_complexity` = 2 (maior esforço do ADD no bolt, com S=1, M=2, L=3); `avg_uncertainty`, `max_dependencies` e `testing_scope` são preenchidos no início do bolt na Construção (specsDuvidas D-01).
