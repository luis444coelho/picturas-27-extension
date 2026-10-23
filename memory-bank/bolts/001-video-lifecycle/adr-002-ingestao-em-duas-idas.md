---
bolt: 001-video-lifecycle
created: 2026-10-21T23:44:49Z
status: accepted
superseded_by: null
---

# ADR-002: Ingestão em duas idas ao worker, com as regras de formato só no serviço de projetos

## Context

A ingestão de um vídeo precisa de validar os codecs contra a matriz de formatos e a duração contra o perfil, e de decidir se é preciso uma cópia de pré-visualização MP4 (remux ou recodificação, T-06, Q-ADD-20). O ADD faz do `projects/video/formats.js` a **única fonte** da matriz e diz que o worker não tem cópia dela: recebe o plano de execução já calculado (T-05, T-01). Mas, na ingestão, os codecs, o perfil H.264 e a duração só se conhecem depois de o worker correr o FFprobe sobre o ficheiro.

## Decision

A ingestão faz **duas idas ao worker** pela `video_operations_queue`, com as respostas em `video_project_queue` (D-13):

1. **`ingest.probe`:** o worker descarrega o original (URL GET interno), corre o FFprobe e uma contagem de pacotes, e responde com `meta` (contentor, codecs, dimensões, rotação, fps, duração, tamanho, bitrate) e `stream` (`pixFmt`, profundidade de bits, *chroma*, perfil). Um ficheiro ilegível ou truncado dá `CORRUPTED_FILE`.
2. **No serviço de projetos:**
   - o `formats.js` valida os codecs (`UNSUPPORTED_FORMAT`, `INVALID_CODEC`);
   - o `profiles.js` valida a duração (`LIMIT_EXCEEDED`);
   - o `display.js` calcula as dimensões de apresentação;
   - o `formats.js` calcula o plano: instante da miniatura e, para a cópia, `null` ou `{video: copy | libx264, audio: copy | aac | null, genpts}`.
3. **`ingest.derive`:** o worker gera a miniatura, o fotograma 0 e, se o plano o pedir, a cópia MP4. Pede os URLs PUT internos só no fim e responde com as chaves.

As mensagens seguem o formato de campos do `tool_msg.py` (`messageId`, `correlationId`, `timestamp`, `status`, `output`, `error`, `metadata`) e acrescentam `operation` e `videoId`. A associação resposta ↔ registo faz-se por `videoId` + `operation`, com escritas condicionais ao estado, para a reentrega ser idempotente. As duas confirmações (`ack`) são manuais: o worker confirma depois de publicar a resposta e o `amqp.js` depois de gravar no MongoDB.

## Rationale

A validação de codecs e de duração já tem de acontecer no serviço de projetos, porque é lá que estão a matriz e o perfil do executor. Separar a inspeção (factos) da geração (ações) mantém o worker sem regras de negócio, exatamente como o executor de cadeias do T-02 vai funcionar (plano calculado no orquestrador). O contrato `operation` + plano é o mesmo que a B003 vai estender para as operações.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Uma só ida, com a matriz e as regras de compatibilidade enviadas na mensagem | Uma descarga do original; menos latência | Segunda implementação das regras em Python (avaliar a matriz); risco de divergência; contraria o T-05 | Viola a "única fonte" da matriz |
| Uma só ida, com cópia de matriz no worker | Simples | Duas cópias da matriz (JS e Python) | Contraria o T-05 e a REQ-VID-COM-006 (uma única fonte de verdade) |
| FFprobe síncrono no serviço de projetos | Sem segunda mensagem | FFmpeg instalado no contentor do serviço de projetos (altera a sua imagem, regra 2.6); bloqueia o Node | Proibido pela regra 2.6 e pela NFR-009 |

## Consequences

### Positive

- Uma só fonte da matriz e das regras (`formats.js`, `profiles.js`); o worker só executa.
- Os vídeos rejeitados (codec ou duração) não chegam a gerar derivados.
- O contrato `ingest.*` serve de base ao contrato das operações da B003.

### Negative

- O original é descarregado duas vezes, porque o temporário de uma réplica não é partilhado. Para um original de 2 GB são 4 GB de tráfego interno.
- Duas passagens pela fila: se o worker estiver ocupado com uma tarefa longa (1 réplica, D-18), a segunda ida espera de novo.

### Risks

- **Ficheiros truncados com o índice no início** podem passar o FFprobe simples. Mitigação: contagem de pacotes (`-count_packets`) e testes com ficheiros de referência truncados no Estágio 5.
- **Reentrega a meio de uma ida.** Mitigação: escritas condicionais ao estado (`processing` sem `meta` na `probe`; sem `thumb_key` na `derive`) e limpeza de `/tmp/video/<videoId>/` no início de cada ida.
- **Mensagem que derruba o worker.** Mitigação: *quorum* com `x-delivery-limit: 1` e *dead-letter* para `video_project_queue` → `failed` e compensação (T-03, D-12).

## Related

- **Stories**: ST-VID-000 (B001); ST-VID-COM-001 (B003, estende o contrato e o `amqp.js` por acréscimo).
- **Standards**: candidato a `standards/system-architecture.md` ("o orquestrador decide, os workers executam um plano").
- **Fontes**: ADD T-01, T-02, T-03, T-05, T-06; specsDuvidas D-08, D-12, D-13, D-14, D-18, D-19, D-20.
- **Previous ADRs**: ADR-001 (o `upload/complete` inicia a primeira ida).
