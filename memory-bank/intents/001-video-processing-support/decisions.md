---
intent: 001-video-processing-support
phase: inception
status: superseded
created: 2026-10-09T16:57:05Z
updated: 2026-10-13T11:26:00Z
---

# Decisions: Video Processing Support

> **Decisões históricas da primeira proposta; supersedidas.** As regras e decisões atuais são DQ-001 a DQ-025 em `docs/requirements.md`, `docs/inception/artefactos-finais.md` e nos capítulos 3, 5 e 6 do relatório.

Todas as decisões abaixo foram **aprovadas** em 2026-10-13 para efeitos do MVP.

## D-VID-001: Perfis e política de quota — ✅ APROVADO

- **Perfis autorizados**: Registado e Premium para as cinco operações (resultados persistidos no projeto; anónimos excluídos).
- **Quota**: cada operação de vídeo consome 1 operação da quota diária do Registado (5 ops/dia). Premium sem quota diária. Cancelamento ou falha devolvem a operação. Pré-visualização de amostra não consome quota.
- **Requisitos afectados**: FR-VID-AUTH-001/002, FR-VID-QUOTA-001, FR-VID-VALIDATION-002, NFR-VID-001.

## D-VID-002: Formatos e codecs — ✅ APROVADO

- **Entrada**: MP4 com H.264 (vídeo) + AAC (áudio). Outros formatos rejeitados com erro informativo.
- **Saída de vídeo**: MP4/H.264/AAC.
- **Saída de fotogramas**: JPEG ou PNG (à escolha do utilizador; JPEG por omissão).
- **Requisitos afectados**: FR-VID-VALIDATION-001, NFR-VID-005, todos os grupos de funcionalidades.

## D-VID-003: Representação de vídeo no projeto — ✅ APROVADO

- Vídeos são recursos explícitos do projeto, separados de imagens (ID, nome, MIME, duração, tamanho, referência de armazenamento, timestamp).
- Resultados referenciam o ID do vídeo de origem. Fotogramas extraídos são imagens normais do projeto.
- **Requisitos afectados**: FR-VID-COMMON-001/003, FR-VID-STORAGE-001/002, FR-VID-FRAMES-002.

## D-VID-004: Contrato de tarefas assíncronas — ✅ APROVADO

- Todas as cinco operações são assíncronas. Estados: `queued → processing → completed | failed | cancelled`.
- Progresso via WebSocket: marca de água e extração comunicam 0–100%; recorte, áudio e velocidade reportam apenas estados terminais.
- Cancelamento disponível em `queued` e `processing` para todas as operações.
- **Requisitos afectados**: FR-VID-TASK-001/002/003, FR-VID-ERROR-002, NFR-VID-006.

## D-VID-005: Limites numéricos — ✅ APROVADO (configuráveis)

- **Registado**: vídeo ≤ 5 min e ≤ 200 MB; máximo 50 fotogramas/extração.
- **Premium**: vídeo ≤ 60 min e ≤ 2 GB; máximo 500 fotogramas/extração.
- **Tarefas activas**: máximo 1 por projeto em simultâneo.
- **Requisitos afectados**: FR-VID-VALIDATION-002, FR-VID-FRAMES-001, NFR-VID-003.

## D-VID-006: Semântica do intervalo de fotogramas — ✅ APROVADO

- Intervalo semi-aberto `[início, fim[`. Instantes: `início + k*N` para k=0,1,… onde instante < fim.
- Exemplo: [0 s, 60 s[ com N=5 s → 12 fotogramas (0, 5, 10, …, 55).
- **Requisitos afectados**: FR-VID-FRAMES-001/002.

## D-VID-007: Retenção de resultados — ✅ APROVADO

- Resultados associados automaticamente ao projeto após sucesso. Seguem políticas de retenção do projeto.
- Tarefas falhadas ou canceladas não produzem recurso de resultado.
- **Requisitos afectados**: FR-VID-COMMON-003, FR-VID-STORAGE-002, NFR-VID-002.

## D-VID-008: Identidade de quota em projetos partilhados — ✅ APROVADO

- Quota debitada ao utilizador autenticado que executa a operação.
- **Requisitos afectados**: FR-VID-AUTH-002, FR-VID-QUOTA-001.

## D-VID-009: Posição da marca de água — ✅ APROVADO

- Posição fixa ao longo de todo o vídeo no MVP. Posição, tamanho e opacidade definidos uma vez antes do processamento.
- **Requisitos afectados**: FR-VID-WATERMARK-002.

## D-VID-010: Metas quantitativas de NFR — ✅ APROVADO

- Nenhuma meta quantitativa de desempenho imposta no MVP (foco em validação funcional, não em produção).
- **Requisitos afectados**: NFR-VID-003, NFR-VID-006.

---

## Questões Genuinamente em Aberto

| ID | Questão | Impacto |
|----|---------|---------|
| Q-REM-01 | O áudio deve ser corrigido em pitch quando a velocidade é alterada, ou simplesmente acelerado/abrandado em raw? | FR-VID-SPEED-002 |
| Q-REM-02 | Quando a marca de água excede parcialmente os limites visíveis, o sistema recorta a marca ou rejeita a configuração? | FR-VID-WATERMARK-001 |
| Q-REM-03 | A notificação de conclusão deve ser enviada apenas via WebSocket ou também por email/push? | FR-VID-TASK-002 |
