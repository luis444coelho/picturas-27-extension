---
bolt: 003-video-task-foundation
created: 2026-10-22T16:30:00Z
status: accepted
superseded_by: null
---

# ADR-006: Pastas temporárias órfãs depois de um *dead-letter*: ficheiro de bloqueio por tarefa e limpeza no arranque do worker

## Context

O worker de vídeo processa cada tarefa em `/tmp/video/<taskId>/`, no volume `video_tmp` (ADD T-02). Quando termina, falha ou é cancelado, apaga a pasta, e numa reentrega recomeça do zero, limpando-a (T-03). A REQ-VID-NFR-007 pede que, depois da segunda entrega falhada, a tarefa passe a `failed` "e o disco temporário é limpo".

Nesse caso, porém, nenhum worker volta a receber a mensagem: ao fim de duas entregas, o RabbitMQ envia-a por *dead-letter* para o serviço de projetos (`x-delivery-limit: 1`). O processo que tinha a pasta morreu com o contentor e deixou-a no volume. O serviço de projetos publica um cancelamento em `video_control` ao tratar o *dead-letter* (ADR-003), mas a exchange é *fanout* e só entrega a filas ligadas. Nos testes do Estágio 5, o cancelamento chegou enquanto o worker reiniciado ainda não tinha ligado a sua fila exclusiva, e foi descartado. A pasta (com o original descarregado, até 2 GB) ficou no volume.

Apagar tudo em `/tmp/video` no arranque só seria seguro com uma réplica (D-18) e apagaria também as pastas da ingestão da B001 e o trabalho de outras réplicas, se o número subir (Q-ADD-10).

## Decision

1. Cada tarefa em execução abre `/tmp/video/<taskId>/.task.lock` e mantém um `flock` exclusivo enquanto corre. O *lock* é libertado pelo sistema operativo quando o processo termina, mesmo que morra.
2. No arranque, o worker percorre `/tmp/video` e apaga cada pasta que tem `.task.lock` e cujo *lock* consegue tomar sem bloquear: não tem dono vivo, por isso é o resto de uma entrega morta.
3. Ao receber em `video_control` o cancelamento de uma tarefa que não está a correr nessa réplica, o worker faz o mesmo à pasta dessa tarefa. Isto cobre os fechos pelo *dead-letter*, pela rotina e pelo cancelamento quando o worker já está ligado.
4. As pastas sem `.task.lock` (as da ingestão da B001) nunca são tocadas.

Implementado em `Tools/video/task.py` (`hold_lock`, `remove_if_unowned`, `sweep_leftovers`) e em `Tools/video/control.py` (`on_cancel`).

## Rationale

O `flock` diz, sem estado partilhado nem mensagens, se ainda existe um processo dono da pasta, e funciona entre contentores que partilham o volume no mesmo *host*. A limpeza fica independente da ordem entre o *dead-letter* e a ligação do worker, e continua correta com várias réplicas.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Apagar todo o `/tmp/video` no arranque | Simples | Apaga o trabalho de outras réplicas e as pastas da ingestão em curso; só serve com uma réplica | Frágil quando a Q-ADD-10 subir as réplicas |
| Fila durável de controlo por réplica, para não perder o cancelamento | O cancelamento chega sempre | As réplicas não têm identidade estável; filas órfãs; muda o *fanout* do T-03 | Desajustado ao T-03 |
| A rotina republica os cancelamentos das tarefas fechadas nos últimos minutos | Sem código novo no worker | Mensagens repetidas a cada minuto; depende de o worker estar ligado dentro dessa janela | Indireto e com janela |
| Limpar por idade (pastas sem alterações há mais de N horas) | Sem *locks* | Uma codificação longa sem escritas pode parecer abandonada; o espaço só é recuperado horas depois | Risco de apagar trabalho vivo |

## Consequences

### Positive

- O disco temporário fica limpo depois de um *dead-letter*, verificado no E2E com dois reinícios reais do worker (NFR-007, AC7 da ST-VID-COM-001).
- Funciona com qualquer número de réplicas que partilhem o `video_tmp`.

### Negative

- Um ficheiro e um descritor a mais por tarefa.
- A limpeza das pastas da ingestão da B001 depois de uma queda continua a não existir; não faz parte deste bolt.

### Risks

- O `flock` não atravessa *hosts*: se o `video_tmp` passar a ser um volume de rede partilhado entre máquinas, este mecanismo tem de ser revisto.

## Related

- **Stories**: ST-VID-COM-001 (AC7)
- **Requirements**: REQ-VID-NFR-007, REQ-VID-ERROR-003
- **ADD**: T-02 (temporários em `/tmp/video/<taskId>/`), T-03 (reentrega, *dead-letter*, `video_control`), Q-ADD-10
- **Decisões**: D-18
- **Previous ADRs**: ADR-003 (reenvio do cancelamento)
