---
id: 006-video-frame-export
unit: 002-video-transformations
intent: 001-video-processing-support
type: ddd-construction-bolt
status: blocked
# motivo: Fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06)
stories: [ST-VID-005]
created: 2026-10-19T17:31:16Z
started: null
completed: null
current_stage: null
stages_completed: []
requires_bolts: [003-video-task-foundation]
enables_bolts: []
requires_units: [001-video-lifecycle]
blocks: true
# avg_complexity: maior esforço do ADD no bolt (S=1, M=2, L=3); os outros campos são preenchidos no início do bolt na Construção (specsDuvidas D-01)
complexity: {avg_complexity: null, avg_uncertainty: null, max_dependencies: null, testing_scope: null}
---

# Bolt: 006-video-frame-export

> 🚫 **Bloqueado.** Fora do âmbito desta construção por decisão da equipa (specsDuvidas D-06). O bolt fica no memory-bank para não se perder a rastreabilidade; os requisitos `REQ-VID-FRAMES-*` ficam marcados como não cobertos nesta construção.

## Visão geral

Extração de fotogramas de um vídeo para imagens normais do projeto (UC-VID-005), de forma atómica e com proveniência.

## Objetivo

Implementar o UC-VID-005 sobre os contratos de tarefa, quota e cancelamento da B003, integrando as imagens extraídas no modelo e no pipeline de imagem existentes. O desenho concreto da extração não está no ADD e fica por fazer: se a B006 for retomada, a equipa escreve antes um complemento ao ADD, porque o ADD v1.1 não decide onde a extração corre nem onde ficam as imagens (specsDuvidas D-05).

## Stories incluídas

- **ST-VID-005 — Extrair fotogramas**: [Extrair fotogramas](../../intents/001-video-processing-support/units/002-video-transformations/stories/ST-VID-005-video-frame-export.md) (must).

## Tipo de bolt

**Tipo**: DDD Construction Bolt
**Definição**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

## Etapas

- [ ] **1. Domain Model**: Pending → `ddd-01-domain-model.md`
- [ ] **2. Technical Design**: Pending → `ddd-02-technical-design.md`
- [ ] **3. ADR Analysis** (opcional): Pending → `adr-{n}-{slug}.md`
- [ ] **4. Implement**: Pending → código nos componentes indicados em "Saídas esperadas"
- [ ] **5. Test**: Pending → `ddd-03-test-report.md`

## Requisitos rastreados

REQ-VID-FRAMES-001 a 013; REQ-VID-NFR-004, 019, 020.

Os `REQ-VID-FRAMES-*` não são cobertos nesta construção (specsDuvidas D-06). A NFR-004, a NFR-019 e a NFR-020 só servem a extração e também não são cobertas (specsDuvidas D-07).

Os critérios de aceitação autoritativos são os dos ficheiros `docs/requirements/REQ-VID-*.md`; a propriedade de cada requisito está em `intents/001-video-processing-support/traceability.md`.

## Decisões do ADD v1.1

- **Âmbito do ADD:** o ADD v1.1 desenha os UC-VID-006 a 015 (1.2); para a extração diz apenas que tem de ser construída sobre a fundação (2.5, T-00).
- **4.9 e 4.10:** a extração não é elegível como passo de cadeia (`INVALID_CHAIN`) nem em lote (`INVALID_BATCH_OPERATION`).
- **T-03 / T-04:** a aceitação, a reserva de 1 crédito, o cancelamento e a devolução seguem os contratos comuns da B003.
- Componente que executa a extração e estágio onde as imagens ficam: por decidir num complemento ao ADD, antes de a B006 ser retomada (specsDuvidas D-05). A B001 e a B003 não põem a extração no worker (specsDuvidas D-06).

## Saídas esperadas

- Operação de extração, configurador de frontend (intervalo `[início, fim[`, passo, formato JPEG/PNG, estimativa e amostra de 3 fotogramas) e integração atómica das imagens no projeto com instante e proveniência.
- Testes ligados aos critérios de `REQ-VID-FRAMES-*`, NFR-004, NFR-019 e NFR-020.

## Critérios de passagem

- [ ] Stories incluídas implementadas e respetivos critérios de aceitação cumpridos.
- [ ] Critérios de aceitação dos requisitos rastreados (ficheiros `docs/requirements/REQ-VID-*.md`) verificados por testes.
- [ ] Nenhuma linha de código existente alterada (regra 2.6 do ADD); o fluxo de imagem continua a funcionar como antes.
- [ ] Testes automatizados e relatório do bolt registados; nenhum resultado de teste é presumido nesta fase.
- [ ] Código revisto.
- [ ] A extração acrescenta ao projeto todos os fotogramas pedidos ou nenhum; as imagens são utilizáveis pelas ferramentas de imagem existentes.

## Dependências

### Requer

- **Bolts:** 003-video-task-foundation (tarefas, quota e cancelamento).
- **Units:** 001-video-lifecycle; baseline de imagens (modelo, serviço e pipeline existentes).

### Desbloqueia

- Nenhum.

## Limites

- **Regra 2.6 do ADD ("só acrescentar"):** o código existente não é alterado. Só se acrescentam ficheiros novos e pontos de ligação novos (uma linha `app.use` ou `require`, uma fila, exchange ou *binding* em `rabbitMQ/definitions.json`, um serviço ou volume no `docker-compose.yaml`, um `location` ou `log_format` no `nginx/nginx.conf`, componentes novos no frontend), sem tocar nas linhas existentes nem mudar o comportamento do fluxo de imagem.
- As ferramentas de imagem existentes não são alteradas para processar vídeo; os fotogramas entram como imagens normais do projeto.

## Notas

- O ADD não dá esforço para o UC-VID-005. Sem esforço no ADD para este bolt, por isso `avg_complexity` fica `null`; `avg_uncertainty`, `max_dependencies` e `testing_scope` são preenchidos no início do bolt na Construção (specsDuvidas D-01).
