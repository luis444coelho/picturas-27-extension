---
bolt: 004-video-basic-edits
created: 2026-10-22T18:15:00Z
status: accepted
superseded_by: null
---

# ADR-007: O worker escolhe entre duas alternativas do plano calculadas no serviço de projetos (cópia no *keyframe* do recorte)

## Context

O T-01 do ADD v1.1 estabelece que "o worker não volta a tomar esta decisão": o serviço de projetos calcula o plano completo e o worker executa-o sem precisar de re-avaliar as regras de negócio. Esta separação tem sido cumprida pela B001 (ingestão) e pela B003 (tarefas).

A operação `trim` (UC-VID-001) introduz um requisito novo: REQ-VID-TRIM-010 permite que o vídeo e o áudio sejam copiados sem recodificação quando o instante de início coincide com um *keyframe*. O serviço de projetos pode decidir se a cópia é estruturalmente permitida (codec compatível, sem dimensões ímpares, sem mudança de fps, etc.), mas não sabe se o instante de início é realmente um *keyframe* — essa informação só existe no ficheiro de vídeo, acessível ao worker através do FFprobe.

Há, portanto, dois pontos de decisão com donos diferentes:
1. **Serviço de projetos**: decide as condições estruturais da cópia (pode a operação, em abstrato, ser copiada?). Expõe o resultado como `keyframeCopy: { atMs: number }` no plano do passo — uma alternativa ao modo recodificado.
2. **Worker**: verifica se `atMs` coincide com um *keyframe* real usando FFprobe (`-skip_frame nokey -read_intervals "atMs%+#1"`). Se sim, executa a cópia; se não, executa a recodificação com os filtros já calculados no plano.

Esta divisão obriga o worker a tomar uma decisão de execução (cópia vs. recodificação) que o T-01 reservava ao serviço de projetos. É a primeira vez que o contrato plano → worker contém duas alternativas para o mesmo passo.

A decisão D-49 (checkpoint do Estágio 1) definiu que o serviço de projetos calcula o campo `keyframeCopy` e o worker verifica o *keyframe*, com o áudio a seguir o vídeo (a REQ-VID-TRIM-010 diz "pode", não "tem de").

## Decision

O plano de um passo `trim` pode conter um campo opcional `keyframeCopy: { atMs: number }` calculado pelo serviço de projetos no módulo `planExtras.js` (ADR-008). O worker, em `Tools/video/keyframe.py`, interroga o FFprobe antes de montar o comando e:

- Se `keyframeCopy` estiver ausente ou o FFprobe confirmar que `atMs` não é *keyframe*: executa os filtros de recodificação (`trim`/`atrim`/`setpts`/`asetpts`) calculados pelo serviço de projetos.
- Se o FFprobe confirmar que `atMs` é *keyframe*: substitui os filtros por `-ss <atMs/1000> -to <endMs/1000>` nas opções de entrada e copia as streams com `-c copy`, acrescentando `-avoid_negative_ts make_zero` e `-movflags +faststart`.
- Se o FFprobe falhar (timeout ou erro): recai para a recodificação, registando o motivo no log. A tarefa continua.

O `videoMode` do `metadata` do `completed` reflete o caminho escolhido (`copy` ou `reencode`).

O serviço de projetos continua a ser o único dono das regras de negócio. O worker toma uma decisão de *execução* (qual das duas alternativas já calculadas usar), não uma decisão de *domínio* (se a cópia é permitida).

## Rationale

A alternativa de trazer a informação de *keyframe* para o serviço de projetos implicaria uma ida extra ao worker antes da aceitação (semelhante à ingestão da B001), com um ciclo adicional de mensagens AMQP, estado intermédio na tarefa e tratamento de falhas. O ganho seria respeitar a letra do T-01; o custo seria um protocolo mais complexo, mais latência e mais superfície de erro, para uma decisão que não tem consequências de domínio (o resultado é o mesmo vídeo recortado, com ou sem cópia).

A solução escolhida mantém o plano como a "verdade" do serviço de projetos (as condições estruturais da cópia) e delega ao worker apenas a verificação técnica local (o *keyframe* real), em linha com a B001, onde o FFprobe no worker também transforma o plano antes da execução.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Verificar o *keyframe* antes da aceitação (ida extra ao worker, como a B001) | Respeita a letra do T-01 | Ciclo AMQP extra, latência, estado intermédio, mais superfície de erro | Custo desproporcionado para uma decisão sem consequências de domínio |
| Sempre recodificar (ignorar a TRIM-010) | Sem decisão no worker | Viola REQ-VID-TRIM-010; pior desempenho e qualidade | Não cumpre o requisito |
| Sempre copiar (confiar que o cliente enviou um instante de *keyframe*) | Sem FFprobe extra | O FFmpeg com `-c copy` num não-*keyframe* gera artefactos ou falha silenciosamente | Incorreto sem verificação |

## Consequences

### Positive

- Cumpre REQ-VID-TRIM-010 sem un ciclo AMQP extra.
- O plano permanece a fonte de verdade das regras: o worker nunca interpreta os parâmetros originais do utilizador.
- O recuo para recodificação torna o caminho robusto a falhas de FFprobe.
- O `videoMode` no `metadata` dá rastreabilidade do caminho seguido.

### Negative

- O worker toma uma decisão de execução que o T-01 não previa; futuras operações com cópia condicionada devem seguir o mesmo padrão, documentado aqui.
- Se o FFprobe for lento (ficheiros grandes em rede), a verificação atrasa o início da execução.

### Risks

- A interpretação de "coincidir com um *keyframe*" depende da granularidade do FFprobe (`-read_intervals "%+#1"` no instante relativo ao primeiro fotograma, arredondado ao milissegundo). Ficheiros com *keyframes* irregulares podem ser recodificados mais vezes do que o necessário — risco aceite, pois o resultado é sempre correto.

## Related

- **Stories**: ST-VID-001 (AC2)
- **Requirements**: REQ-VID-TRIM-010
- **ADD**: T-01, T-02, T-05
- **Decisões**: D-49
- **ADRs**: ADR-002 (precedente de duas idas ao worker), ADR-008 (`planExtras.js`)
- **Bolts afetados**: B008 (cadeias que começam por um `trim` com `keyframeCopy`)
