---
intent: 001-video-processing-support
phase: inception
status: superseded
created: 2026-10-09T16:57:05Z
updated: 2026-10-21T11:10:16Z
---

# Decisions: Video Processing Support

> **Decisões históricas da primeira proposta; supersedidas.** As decisões atuais são as do ADD v1.1 (`docs/add.md`: regra 2.6, T-00 a T-10, secções 4.1 a 4.10 e Q-ADD-01 a 25, dadas como aceites) e as DQ-001 a DQ-025 da ERS v2.4 (`docs/requirements.md`), resumidas em `docs/inception/artefactos-finais.md`. As decisões da equipa sobre o planeamento da Construção (D-01 a D-06) estão resumidas abaixo e registadas em `docs/specsDuvidas.md`, com as dúvidas ainda por resolver.
>
> Diferenças mais visíveis face às decisões abaixo: a entrada aceita MP4, MOV e AVI (DQ-002), e não só MP4 (D-VID-002); o progresso é emitido pelo menos 1×/s em todas as operações (REQ-VID-NFR-009, ADD T-02), e não só na marca de água e na extração (D-VID-004); a quota é reservada na aceitação e a reserva torna-se definitiva na conclusão, sem passo de confirmação (ADD T-04, Q-ADD-03); o cancelamento em `queued` marca a tarefa como `cancelled` e o worker descarta-a quando a consome (ADD T-03); cadeias, junção e lotes fazem parte do MVP (DQ-014 a DQ-019); a Q-REM-01 está resolvida pelo `atempo` (UC-VID-003 Q2), a Q-REM-02 pela rejeição da configuração (REQ-VID-WATERMARK-008), e quanto à Q-REM-03 a ERS só prevê notificações por WebSocket (REQ-VID-TASK-003; eventos de vídeo no ADD T-03).

## Decisões da equipa sobre o planeamento da Construção (2026-10-21)

Respostas às dúvidas da revisão dos artefactos specsmd. Estas decisões são atuais e aplicam-se aos bolts, stories e rastreabilidade deste intent.

| ID | Decisão |
|---|---|
| D-01 | `avg_complexity` de cada bolt = maior esforço do ADD nos seus UC (S=1, M=2, L=3): B001 = 3, B002 = 1, B005 = 2, B007 = 2, B008 = 3, B009 = 3; B003, B004 e B006 = `null` (sem esforço no ADD). `avg_uncertainty`, `max_dependencies` e `testing_scope` ficam `null` e são preenchidos no início de cada bolt na Construção (specsDuvidas D-01). |
| D-02 | A tabela de Bolts não muda. A B001 constrói a parte do T-00 de que a ingestão precisa (coleção `videos`, `videoStages.js` e URLs de escrita, `formats.js`, routers com o `videoAuth`, filas `video_operations_queue`, `video_project_queue` e `video_ws_queue`, `wsGateway/video.js` e o worker `Tools/video/` com a ingestão); a B003 fica com o `VideoTask`, o `video_project_locks`, a exchange `video_control`, a quota, o cancelamento e o progresso, o registo de operações e o executor de cadeias. Os `REQ-VID-AUTH-*` passam para a B001 (specsDuvidas D-02). |
| D-03 | Cada requisito vai para o bolt que constrói o componente: NFR-010 na B001; NFR-013 e NFR-018 na ST-VID-COM-001 e na B003. A B004 e a B008 verificam os três nos critérios de aceitação, sem serem donas (specsDuvidas D-03). |
| D-04 | A B003 cria a rotina periódica da Q-ADD-14 para as tarefas paradas, os lugares de tarefa ativa sem dono e a remoção dos recursos de vídeo de projetos apagados; a parte dos lotes e dos ZIP fica fora desta construção (specsDuvidas D-04). |
| D-05 | Não se aplica nesta construção. Se a B006 for retomada, a equipa escreve antes um complemento ao ADD sobre onde corre a extração e onde ficam as imagens (specsDuvidas D-05). |
| D-06 | A B006 (UC-VID-005) e a B009 (UC-VID-015) ficam fora desta construção: bolts e stories com `status: blocked` e o motivo; a B001 e a B003 não constroem as peças só usadas pelos lotes nem a extração; `REQ-VID-FRAMES-*`, `REQ-VID-BATCH-*`, `REQ-VID-TASK-007` e a parte de lotes da `REQ-VID-QUOTA-007` ficam não cobertos; a predefinição de cadeia só deixa de poder ser carregada num lote (specsDuvidas D-06). |

## Decisões históricas da primeira proposta

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
