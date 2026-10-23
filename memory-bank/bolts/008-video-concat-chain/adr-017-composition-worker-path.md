---
bolt: 008-video-concat-chain
created: 2026-10-23T00:47:57Z
status: accepted
superseded_by: null
---

# ADR-017: Ramo `composition_task.py` no worker para junções e cadeias terminadas em `convert`

## Context

O `executor.build_command` da B003 monta uma só entrada (`[0:V:0]…[v];[0:a:0]…[a]`) e uma só saída H.264/AAC. A junção precisa de uma entrada `-i` por ocorrência de clip, de um sub-grafo por clip com a normalização (`scale`, `pad`, `fps`, `setsar`, `format`, `aresample`/`aformat` ou `anullsrc`) e do filtro `concat` (ADD 4.8, T-02). Uma cadeia de vários passos que termina em `convert` para AVI precisa da saída MPEG-4/MP3 e da cópia MP4 na mesma invocação (T-06). O ramo do ADR-013 só trata a conversão isolada. A regra 2.6 proíbe mudar o construtor genérico e o ramo da B007.

## Decision

1. Um módulo novo, `Tools/video/composition_task.py`, executa os planos com `plan.composition` (junção) e as cadeias com mais de um passo cujo último é `convert`.
2. Uma linha nova no `task.py`, depois do desvio da B007 e antes do bloco genérico, desvia esses planos para ele. O `convert` isolado continua no `convert_task.py` e as restantes cadeias no construtor da B003.
3. O módulo monta um único `-filter_complex` (sub-grafos dos clips → `concat` → passos finais → corte de 1 px), com os filtros dos `ops/<op>.py` existentes e a ponte `visual_input.py` (ADR-011), e escolhe os argumentos de saída a partir do plano, incluindo a saída dupla AVI + MP4 com `split`/`asplit` quando `previewInSameInvocation` está no plano.
4. Reutiliza `executor.run`, a leitura do progresso, o cancelamento (ADR-009), o FFprobe, a miniatura, o fotograma 0, o `StorageClient.upload` e o contrato de resposta da B003, sem os alterar (V5).
5. Um ficheiro distinto é descarregado uma só vez e passado como várias entradas `-i`, sem `split` (4.8).

## Rationale

Repete a decisão do ADR-013 (um ramo aditivo que partilha os serviços de execução e publicação) para os dois casos que o construtor genérico não exprime, e mantém a NFR-013: uma só invocação de codificação por tarefa.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Alterar o `executor.build_command` para várias entradas e saídas | Um só construtor | Muda linhas da B003 | Regra 2.6 |
| Alargar o `convert_task.py` às cadeias | Reutiliza a saída dupla | Muda linhas da B007 e mistura duas responsabilidades | Regra 2.6 |
| Normalizar cada clip para um intermédio e concatenar por cópia | Memória constante | Duas codificações | Viola a NFR-013 (ADD 4.8) |
| Ramo novo só para junções; cadeias com `convert` no construtor genérico | Menos código novo | O genérico não gera AVI nem a saída dupla | Não cumpre o T-06 |

## Consequences

### Positive

- Junções e composições numa só invocação FFmpeg; a cadeia terminada em `convert` para AVI tem a cópia MP4 como a conversão isolada.
- O caminho das operações isoladas e das cadeias sem junção da B003 a B007 não muda.

### Negative

- Há três caminhos de execução no worker (genérico, conversão isolada, composição), com alguma repetição na sequência de metadados e envio.
- Todas as entradas ficam abertas ao mesmo tempo (um descodificador por clip); a memória cresce com o número de clips (até 50 no Premium, ADD 4.8).

### Risks

- O silêncio de um clip sem áudio é cortado à duração estimada; uma diferença de um fotograma entre o vídeo e o `atrim` é absorvida pelo `concat`. Testado com FFmpeg 5.1 real no Estágio 5.
- A V5 pode mostrar que o `convert_task.py` não expõe os argumentos de saída AVI de forma reutilizável; nesse caso o `composition_task` monta-os a partir do plano e do `encoding.js` (D-68), como o `convert_task` faz.

## Related

- **Stories**: ST-VID-013, ST-VID-014
- **Standards**: regra 2.6; T-02, T-05, T-06, 4.8, 4.9; NFR-013
- **Previous ADRs**: ADR-009, ADR-011, ADR-013
- **Dúvidas**: D-39, D-68; verificações V3, V4, V5
