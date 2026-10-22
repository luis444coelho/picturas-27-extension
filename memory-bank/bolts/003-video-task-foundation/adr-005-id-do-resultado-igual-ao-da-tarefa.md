---
bolt: 003-video-task-foundation
created: 2026-10-22T15:39:16Z
status: accepted
superseded_by: null
---

# ADR-005: O vídeo de resultado tem o mesmo `_id` que a tarefa

## Context

Quando uma tarefa chega a `completed`, o serviço de projetos cria um recurso novo na coleção `videos` (REQ-VID-COM-003). O ADD exige três propriedades a este passo:

- **Idempotência (T-03):** uma resposta `completed` pode ser reentregue depois de uma queda do serviço de projetos, porque só é confirmada depois de gravada; não pode criar dois vídeos.
- **Mesmas chaves no reprocessamento (T-03):** numa reentrega ao worker, a tarefa recomeça do zero e o resultado "é escrito na mesma chave". As chaves têm por isso de ser conhecidas antes de o worker começar e de não depender de nada gerado no fim.
- **Convenção de chaves da B001:** `<projectId>/<estágio>/<videoId>.<ext>`, com o `videoId` como UUID (ADD 2.1, `ddd-02-technical-design.md` da B001).

O ADD define `result_video_id` no `VideoTask`, mas não diz como se gera o id do vídeo de resultado.

## Decision

O vídeo de resultado é criado com **`_id` igual ao `_id` da tarefa** (que é, por sua vez, o `holder_id` do lugar de tarefa ativa, T-03). O plano de execução leva desde a aceitação as chaves `video_out/<taskId>.mp4`, `video_thumb/<taskId>.thumb.jpg`, `video_thumb/<taskId>.frame0.jpg` e, se for preciso, `video_preview/<taskId>.mp4`, no bucket `user-<ownerId>`. Ao tratar `completed`, o serviço de projetos:

1. passa a tarefa a `completed` com `result_video_id = _id`;
2. insere o vídeo com esse `_id`. Um erro de chave duplicada (`E11000`) significa que o vídeo já foi criado numa entrega anterior e é tratado como sucesso.

Uma tarefa produz no máximo um vídeo. A junção (B008) também.

## Rationale

O `_id` da tarefa já existe antes da publicação, é único e segue a forma de um ObjectId, como os `videoId` da B001. Reutilizá-lo dá as três propriedades sem estado extra: as chaves ficam fixas desde a aceitação, o reprocessamento escreve por cima dos mesmos objetos, e a unicidade do `_id` em `videos` torna a criação idempotente sem uma leitura prévia nem um índice novo.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| `_id` novo gerado no fim, com chaves derivadas do `taskId` | Ids de vídeo e de tarefa independentes | As chaves do resultado deixam de seguir a convenção `<videoId>`; idempotência só com um índice único em `task_id` (campo existente da B001, cujo esquema não muda) ou uma leitura antes de inserir | Quebra a convenção e exige mais mecanismos |
| `result_video_id` gerado na aceitação e guardado na tarefa | Ids independentes e chaves fixas | Mais um campo; o `result_video_id` passaria a existir antes de haver vídeo, contra a TASK-002/COM-002 ("no fim") | Sem ganho sobre reutilizar o `_id` |
| Chaves com o `messageId` da entrega | Simples | Cada reentrega escreveria noutras chaves e deixaria objetos órfãos | Contraria o T-03 |

## Consequences

### Positive

- A criação do resultado é idempotente sem código extra além de tratar o `E11000`.
- As chaves seguem a convenção da B001, e a rotina e o tratamento de resultados tardios sabem que objetos apagar a partir só do `taskId`.

### Negative

- O mesmo valor de ObjectId aparece em duas coleções (`videotasks` e `videos`). Os dois documentos são entidades diferentes, mas quem leia os dados tem de saber que a igualdade é intencional.
- Uma operação futura que produza vários vídeos a partir de uma tarefa precisaria de outro esquema; nenhuma operação da ERS o faz (a extração de fotogramas, que produz imagens, está fora desta construção, D-06).

### Risks

- Entre o passo 1 e o passo 2 há uma janela de milissegundos em que a tarefa está `completed` e o vídeo ainda não existe. Uma queda nesse intervalo é recuperada pela reentrega da resposta, que encontra a tarefa `completed` e cria o vídeo. Um `GET` da tarefa nessa janela devolve um `resultVideoId` que ainda dá 404.

## Related

- **Stories**: ST-VID-COM-001 (AC2, AC7)
- **Requirements**: REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-NFR-007
- **ADD**: T-00 (coleção `videos`), T-03 (idempotência e mesmas chaves), T-08
- **Decisões**: D-35 (nome do resultado), D-06
- **Previous ADRs**: ADR-002 (associação das respostas e escritas condicionais), ADR-004
