---
bolt: 005-video-visual-edits
created: 2026-10-22T22:04:24Z
status: accepted
superseded_by: null
---

# ADR-012: Contraste e saturação do ajuste em RGB nos dois motores (`lutrgb` e matriz de luma BT.601)

## Context

O ADD 4.3 e a tabela do T-07 fixam o ajuste assim:
- brilho com `colorchannelmixer` no FFmpeg e `linear(f, 0)` no sharp;
- contraste com `eq=contrast` no FFmpeg e `linear(c, 128·(1−c))` no sharp;
- saturação com `eq=saturation` no FFmpeg e `modulate` no sharp.

O `eq` do FFmpeg trabalha em YUV: o contraste atua só sobre a luma e a saturação só sobre o croma. O sharp trabalha em RGB (`linear`) e em LCh (`modulate`). Na etapa 3 da B005, a diferença média entre a pré-visualização e o resultado foi:
- brilho: 0,42 (coincide);
- contraste: 4,87 com 1.3 e 27,46 com 0.6;
- saturação: 37,26 com 0.5;
- combinação: 45,78.

Os filtros ficaram em 0,35 a 1,36 (D-67).

## Decision

D-67 (a), aprovada pela equipa. O brilho não muda.

- **Contraste:** `lutrgb=r=val*c+128·(1−c):g=…:b=…` no worker, uma reta pelo pivô fixo 128 (Q-ADD-18) aplicada a cada canal RGB, e `linear(c, 128·(1−c))` no sharp, como estava.
- **Saturação:** a matriz `M = s·I + (1−s)·[0.299 0.587 0.114]` (cada linha mistura com a luma BT.601), com `colorchannelmixer` no worker e `recomb(M)` no sharp.
- **Ordem:** brilho, contraste e saturação, numa passagem do sharp por operação (T-07) e na mesma cadeia do grafo único do worker (NFR-013).

## Rationale

- O ADD 4.3 quer a pré-visualização igual ao resultado ("pivô fixo, igual ao da pré-visualização sharp") e aceita o risco só "com fotogramas de referência". A medição mostrou que o `eq` não serve esse objetivo.
- A DQ-020 pede a semântica das ferramentas de imagem. O `ImageEnhance.Contrast` é uma mistura linear em RGB com um pivô (aqui o 128 da Q-ADD-18). O `ImageEnhance.Color` é exatamente a mistura com o `convert("L")` BT.601.
- Na integração real, depois da mudança, a diferença ficou em 0,45 (contraste 1.3), 1,39 (0.6), 1,32 (saturação 0.5) e 0,68 (combinação).

### Alternatives Considered

- **Manter o `eq` e aceitar a diferença (D-67 b):** a pré-visualização ficaria só indicativa, ao contrário da intenção do ADD 4.3.
- **Imitar o YUV no sharp (D-67 c):** exigia conversão própria por píxel no serviço de projetos.

## Consequences

### Positive

- A pré-visualização e o resultado coincidem no ajuste, como nos filtros e na orientação.
- Não há dependências novas; as alterações ficam em ficheiros novos da B005 (`Tools/video/ops/adjust.py` e `projects/video/preview.js`).

### Negative

- Diverge da letra do ADD 4.3, do T-07 e da A1 do UC-VID-008 (`eq`), o que fica para acertar na próxima revisão do ADD.
- O `colorchannelmixer` e o `lutrgb` trabalham em RGB, o que acrescenta conversões no grafo (o ADD 4.3 já o previa para o brilho). A saída continua `yuv420p`.

### Risks

- O `lutrgb` satura os valores fora de 0–255, tal como o sharp. Coberto pelos testes de quadrantes de cor.

## Related

- D-67, Q-ADD-18, Q-ADD-23, DQ-020; ADR-011 (grafo único).
