---
bolt: 004-video-basic-edits
created: 2026-10-22T18:15:00Z
status: accepted
superseded_by: null
---

# ADR-007: O worker escolhe entre duas alternativas do plano calculadas pelo serviço de projetos (cópia no *keyframe* do recorte)

## Context

O T-01 do ADD v1.1 estabelece que "o worker não volta a tomar esta decisão": o serviço de projetos calcula o plano completo e o worker executa-o sem re-avaliar as regras de negócio. Esta separação tem sido cumprida pela B001 (o worker devolve o resultado do FFprobe e o serviço de projetos calcula o plano, ADR-002) e pela B003.

A operação `trim` (UC-VID-001) introduz um requisito novo: REQ-VID-TRIM-010 permite que o vídeo e o áudio sejam copiados sem recodificação quando o instante de início coincide com um *keyframe*. O serviço de projetos pode calcular as condições estruturais da cópia, mas não sabe se `startMs` é realmente um *keyframe* — essa informação só existe no ficheiro de vídeo, acessível ao worker através do FFprobe.

Há dois pontos de decisão com donos diferentes:

1. **Serviço de projetos** (`planExtras.js`, ADR-008): decide se a cópia é estruturalmente permitida e calcula **ambas** as alternativas do plano: a cópia (campo `plan.keyframeCopy`) e a recodificação (restante estrutura do plano).
2. **Worker** (`keyframe.py`): verifica se `startMs` coincide com um *keyframe* real usando FFprobe e escolhe entre as duas alternativas já calculadas — sem interpretar os parâmetros originais do utilizador.

Esta divisão obriga o worker a tomar uma **decisão de execução** (qual das duas alternativas usar) que o T-01 reservava ao serviço de projetos. É a primeira vez que o contrato plano → worker contém duas alternativas para o mesmo passo.

A decisão D-49 (checkpoint do Estágio 1) definiu que o serviço de projetos calcula `keyframeCopy` e o worker verifica o *keyframe*; o áudio segue o vídeo (REQ-VID-TRIM-010 diz "pode", não "tem de").

## Decision

### Condições de elegibilidade para `keyframeCopy` (calculadas pelo `planExtras.js`)

A cópia no *keyframe* é calculada pelo serviço de projetos quando se verificam todas as seguintes condições:

- Há exatamente um passo `trim` na cadeia.
- O codec de vídeo de entrada é o codec de saída do contentor MP4 segundo `formats.js` (V8) — tipicamente H.264.
- Todos os outros passos têm `copyable.video = true`.

O corte de 1 px (T-02, Q-ADD-25) não é uma condição de exclusão: aplica-se apenas quando há recodificação; com a cópia, as dimensões originais são mantidas.

### Estrutura de `plan.keyframeCopy`

Quando as condições acima se verificam, o `planExtras.js` acrescenta ao plano global:

```text
plan.keyframeCopy = {
  atMs: startMs,
  endMs: endMs,
  video: { mode: "copy", genpts: <true se entrada AVI, false caso contrário> },
  audio: {
    mode: "copy"   // se a entrada é AAC e nenhum outro passo altera o áudio
         | "encode" // se o áudio existe mas é MP3 ou outro codec não AAC
         | "none"  // se não há áudio (audioCodec: null) ou o passo remove o áudio
  },
  preview: <plano da cópia de pré-visualização para o vídeo copiado,
            mesma forma do plan.preview da B003 (T-06, Q-ADD-20)>,
  dropStep: <índice do passo trim>  // o -ss/-to substitui os filtros do trim
}
```

O campo `plan.keyframeCopy` é a alternativa de cópia; o restante plano (`video: encode`, `audio: encode` com `atrim`) é a alternativa de recodificação. As duas alternativas são calculadas pelo serviço de projetos; o worker só escolhe entre elas.

### Procedimento do worker (`keyframe.py`)

Corre depois do descarregamento do original e antes do executor, apenas se o plano tiver `keyframeCopy`:

1. FFprobe à primeira stream de vídeo: o instante do primeiro fotograma (`first_pts`) e os *keyframes* à volta de `atMs` com a opção `-select_streams V:0 -skip_frame nokey -show_entries frame=pts_time -read_intervals <atMs−1 s>%<atMs+1 s>`; para `atMs = 0`, o primeiro *keyframe*.
2. Coincide se existir um *keyframe* com `round((pts − first_pts) × 1000) == atMs`.
3. **Coincide** → plano normal com `video: copy` e `genpts` de `keyframeCopy.video`, `audio` de `keyframeCopy.audio`, `preview` de `keyframeCopy.preview`, sem o passo `dropStep`, e as opções de entrada `-ss <atMs/1000> -to <endMs/1000>` antes do `-i`; `video_mode = "copy"`.
4. **Não coincide, ou o FFprobe falha** → plano recebido sem `keyframeCopy`; `video_mode = "encode"`. A falha do FFprobe não falha a tarefa: a recodificação é sempre correta e é usada como recuo.

### Tratamento do áudio na cópia

O modo de áudio em `keyframeCopy.audio` segue as regras do T-05 e D-49:

- `mode: "copy"` — áudio AAC na entrada e nenhum outro passo altera o áudio.
- `mode: "encode"` — áudio existe mas é MP3 ou outro codec não AAC; recodificado para AAC (D-39: libx264 veryfast, CRF 23, AAC 128 kb/s através do `encoding.js` da B003).
- `mode: "none"` — sem streams de áudio (`audioCodec: null`) ou o passo remove o áudio.

### Rastreabilidade

A resposta `completed` leva `metadata.videoMode` com o valor `"copy"` ou `"encode"`. O log `video.task.keyframe` regista `{taskId, atMs, keyframeMs, videoMode}`. O serviço de projetos ignora o campo (o resultado é criado da mesma forma nos dois casos).

## Rationale

A alternativa de trazer a informação de *keyframe* para o serviço de projetos implicaria uma ida extra ao worker antes da aceitação — semelhante à ingestão da B001, mas com a diferença que na B001 o worker devolve o resultado do FFprobe e o serviço de projetos calcula o plano (ADR-002). Para o *keyframe*, a sequência seria: pedido ao worker → worker executa FFprobe → devolve resultado → serviço de projetos calcula plano. Isso exigiria um ciclo AMQP adicional, estado intermédio na tarefa e tratamento de falhas para uma decisão que não tem consequências de domínio: o resultado é o mesmo vídeo recortado, com ou sem cópia.

A solução escolhida mantém o serviço de projetos como o único dono das regras (ele calcula as duas alternativas completas) e delega ao worker apenas a verificação técnica local (o *keyframe* real), que é um facto de infraestrutura, não uma regra de negócio.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Verificar o *keyframe* antes da aceitação (ciclo AMQP extra, análogo à B001) | Preserva a letra do T-01 | Ciclo AMQP extra, latência, estado intermédio, mais superfície de erro | Custo desproporcionado para uma decisão sem consequências de domínio |
| Sempre recodificar (ignorar REQ-VID-TRIM-010) | Sem decisão no worker | Viola REQ-VID-TRIM-010; pior desempenho e qualidade | Não cumpre o requisito |
| Sempre copiar (confiar que o cliente enviou um instante de *keyframe*) | Sem FFprobe extra | O FFmpeg com `-c copy` num não-*keyframe* gera artefactos ou falha silenciosamente | Incorreto sem verificação |

## Consequences

### Positive

- Cumpre REQ-VID-TRIM-010 sem um ciclo AMQP extra.
- O plano permanece a fonte de verdade das regras: o worker nunca interpreta os parâmetros originais do utilizador.
- O recuo para recodificação em caso de falha do FFprobe mantém a tarefa robusta.
- O `videoMode` no `metadata` dá rastreabilidade do caminho seguido.
- Futuras operações com cópia condicionada têm um padrão explícito documentado.

### Negative

- O worker toma uma decisão de execução que vai além da letra do T-01; este ADR documenta a extensão do padrão para futuros contribuidores.
- Se o FFprobe for lento (ficheiros grandes em rede), a verificação pode atrasar ligeiramente o início da execução.

### Risks

- A correspondência de *keyframe* usa `round((pts − first_pts) × 1000) == atMs`. Ficheiros com *keyframes* a instantes irregulares podem ser recodificados em vez de copiados — resultado sempre correto, mas sem a otimização da cópia.

## Related

- **Stories**: ST-VID-001 (AC2)
- **Requirements**: REQ-VID-TRIM-010
- **ADD**: T-01, T-02, T-05, T-06, Q-ADD-25
- **Decisões**: D-49
- **ADRs**: ADR-002 (B001: worker devolve FFprobe, serviço de projetos calcula o plano), ADR-008 (`planExtras.js`)
- **Bolts afetados**: B008 (cadeias que começam por um `trim` com `keyframeCopy`)
