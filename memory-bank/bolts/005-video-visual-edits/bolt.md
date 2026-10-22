---
id: 005-video-visual-edits
unit: 002-video-transformations
intent: 001-video-processing-support
type: simple-construction-bolt
status: in-progress
stories: [ST-VID-004, ST-VID-008, ST-VID-009, ST-VID-010, ST-VID-011]
created: 2026-10-19T17:31:16Z
started: 2026-10-22T20:11:21Z
completed: null
current_stage: implement
stages_completed:
  - name: plan
    completed: 2026-10-22T20:22:31Z
    artifact: implementation-plan.md
requires_bolts: [003-video-task-foundation]
enables_bolts: [008-video-concat-chain, 009-video-batch]
requires_units: [001-video-lifecycle]
blocks: true
# avg_complexity: maior esforço do ADD no bolt (S=1, M=2, L=3); os outros campos são preenchidos no início do bolt na Construção (specsDuvidas D-01)
complexity: {avg_complexity: 2, avg_uncertainty: 3, max_dependencies: 2, testing_scope: 3}
---

# Bolt: 005-video-visual-edits

## Visão geral

Marca de água, ajustes, filtros, redimensionamento e orientação (UC-VID-004 e 008 a 011), com pré-visualizações estáticas em ≤ 1 s (ADD v1.1, 4.3 a 4.6 e T-07).

## Objetivo

Acrescentar ao registo de operações e ao worker as operações `watermark`, `adjust`, `filter`, `resize` e `orient`, o endpoint de pré-visualização com `sharp` (T-07) e os painéis de frontend correspondentes.

## Stories incluídas

- **ST-VID-004 — Aplicar marca de água**: [Aplicar marca de água](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-004-video-watermark.md) (must).
- **ST-VID-008 — Ajustar propriedades visuais**: [Ajustar propriedades visuais](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-008-video-adjust.md) (must).
- **ST-VID-009 — Aplicar filtro visual**: [Aplicar filtro visual](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-009-video-filter.md) (must).
- **ST-VID-010 — Redimensionar vídeo**: [Redimensionar vídeo](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-010-video-resize.md) (must).
- **ST-VID-011 — Rodar ou espelhar vídeo**: [Rodar ou espelhar vídeo](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-011-video-orientation.md) (must).

## Tipo de bolt

**Tipo**: Simple Construction Bolt
**Definição**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Etapas

- [x] **1. Plan**: Complete (D-58 a D-64 respondidas) → `implementation-plan.md`
- [ ] **2. Implement**: ⏳ Implementado, à espera do checkpoint → código + `implementation-walkthrough.md`, ADR-010, ADR-011
- [ ] **3. Test**: Pending → `test-walkthrough.md`

## Requisitos rastreados

REQ-VID-WATERMARK-001 a 011; REQ-VID-ADJUST-001 a 010; REQ-VID-FILTER-001 a 007; REQ-VID-RESIZE-001 a 009; REQ-VID-ORIENT-001 a 009; REQ-VID-NFR-015.

Os critérios de aceitação autoritativos são os dos ficheiros `docs/requirements/REQ-VID-*.md`; a propriedade de cada requisito está em `intents/001-video-processing-support/traceability.md`.

## Decisões do ADD v1.1

- **T-07:** `POST /projects/:user/:project/videos/:video/preview` com a autorização da aceitação (T-03, passos 1 a 3); `sharp` sobre o fotograma 0 com cache em memória (`Map`, por exemplo 100 fotogramas e 10 min); uma operação do `sharp` por passagem; resposta com os bytes da imagem, sem gravar no storage nem consumir quota; o `applyToolsPreview` existente não é chamado nem alterado.
- **4.3 (ajuste):** brilho com `colorchannelmixer=rr=f:gg=f:bb=f` e `linear(f, 0)` na pré-visualização; contraste com `eq=contrast` e `linear(c, 128·(1−c))` (pivô fixo, Q-ADD-18); saturação com `eq=saturation` e `modulate`; passo 0.05 com tolerância `1e-6` e normalização; `NO_CHANGES` com os três em 1.0 (Q-ADD-23).
- **4.4 (filtro):** catálogo `projects/video/filters.json` com entradas `{type: "matrix"}` ou `{type: "invert"}`, enviado no plano; `colorchannelmixer` / `lutrgb` no worker e `recomb` / `negate()` no `sharp`; miniaturas do catálogo por `GET …/videos/:id/filters/thumbnails` sobre o fotograma 0 reduzido. **Q-ADD-07 (pendente no ADD):** matrizes de Vintage, Frio e Quente.
- **4.5 (redimensionamento):** `width`/`height` em dimensões de apresentação; inteiros pares ≥ 128 dentro do teto do perfil, com erros `{field, code, limit}`; `NO_CHANGES` face a `display_width × display_height`; `scale=w:h,setsar=1`; resultado com rotação 0 (Q-ADD-13).
- **4.6 (orientação):** `{rotation: 0|90|180|270, flipH, flipV}`, rotação antes do espelho; `NO_CHANGES` sem transformação e na identidade 180° + dois espelhos (Q-ADD-24); duas passagens do `sharp` (`rotate` e depois `flop`/`flip`); `transpose`/`hflip`/`vflip` no worker.
- **Marca de água (Q-ADD-12):** implementação de raiz no worker de vídeo, com `overlay` (`format=rgba`, `colorchannelmixer=aa=…`) ou `drawtext` (T-02); a dependência de tipos de letra (`fonts-dejavu-core`) só entra se se usar `drawtext` (ADD 6).
- **Q-ADD-25:** corte de 1 px nas dimensões ímpares quando há recodificação (ADJUST-009, FILTER-007, ORIENT-008).

## Saídas esperadas

- `projects/video/operations/` para `watermark`, `adjust`, `filter`, `resize` e `orient`; `projects/video/filters.json`.
- `Tools/video/ops/` para as mesmas operações.
- Endpoint de pré-visualização (T-07) e endpoint das miniaturas dos filtros (4.4), no router de vídeo.
- Frontend: painéis novos de marca de água, ajuste (três `Slider` com passo 0.05 e "Repor"), filtros (grelha de 6 miniaturas), redimensionamento (cadeado de proporção, predefinições, avisos) e orientação; os componentes da toolbar de imagem não mudam.
- Testes de equivalência `sharp` ↔ FFmpeg com fotogramas de referência e testes ligados aos critérios dos requisitos rastreados.

## Critérios de passagem

- [ ] Stories incluídas implementadas e respetivos critérios de aceitação cumpridos.
- [ ] Critérios de aceitação dos requisitos rastreados (ficheiros `docs/requirements/REQ-VID-*.md`) verificados por testes.
- [ ] Nenhuma linha de código existente alterada (regra 2.6 do ADD); o fluxo de imagem continua a funcionar como antes.
- [ ] Testes automatizados e relatório do bolt registados; nenhum resultado de teste é presumido nesta fase.
- [ ] Código revisto.
- [ ] A pré-visualização responde em ≤ 1 s em 95% dos pedidos (NFR-015) e corresponde ao resultado do FFmpeg nas oito combinações de rotação e espelho e nos filtros do catálogo.

## Dependências

### Requer

- **Bolts:** 003-video-task-foundation (registo de operações, worker, executor, tarefas e quota).
- **Units:** 001-video-lifecycle (fotograma 0 guardado na ingestão).

### Desbloqueia

- 008-video-concat-chain, 009-video-batch. A B009 está `blocked` (specsDuvidas D-06).

## Limites

- **Regra 2.6 do ADD ("só acrescentar"):** o código existente não é alterado. Só se acrescentam ficheiros novos e pontos de ligação novos (uma linha `app.use` ou `require`, uma fila, exchange ou *binding* em `rabbitMQ/definitions.json`, um serviço ou volume no `docker-compose.yaml`, um `location` ou `log_format` no `nginx/nginx.conf`, componentes novos no frontend), sem tocar nas linhas existentes nem mudar o comportamento do fluxo de imagem.
- Os componentes `brightness-tool.tsx`, `contrast-tool.tsx`, `saturation-tool.tsx`, `resize-tool.tsx`, `rotate-tool.tsx` e o `applyToolsPreview` servem só de referência e não são alterados.
- A pré-visualização usa sempre o fotograma 0 do vídeo de origem (limitação aceite no T-07).

## Notas

- Esforço no ADD: UC-VID-008 = M, 009 = M, 010 = S, 011 = S; o UC-VID-004 não tem secção própria no ADD. `avg_complexity` = 2 (maior esforço do ADD no bolt, com S=1, M=2, L=3); `avg_uncertainty`, `max_dependencies` e `testing_scope` são preenchidos no início do bolt na Construção (specsDuvidas D-01).
- 2026-10-22T20:11:21Z: B005 iniciada no ramo `bolt/005-video-visual-edits`, criado a partir da `main` com a B004. Complexidade preenchida no início do bolt (D-01): `avg_uncertainty` 3 (Q-ADD-07 e Q-ADD-12 em aberto, marca de água sem secção no ADD, D-58 a D-64), `max_dependencies` 2 (B003 e Unit 001; o código da B004 é reutilizado), `testing_scope` 3 (FFmpeg real, equivalência sharp ↔ FFmpeg, integração pela pilha e painéis no navegador).
