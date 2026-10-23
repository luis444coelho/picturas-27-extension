---
bolt: 008-video-concat-chain
created: 2026-10-23T14:03:00Z
status: accepted
superseded_by: null
---

# ADR-020: Extração dos componentes de configuração dos painéis de vídeo das B004, B005 e B007 (exceção D-87 à regra 2.6)

## Context

A equipa reviu a B008 no browser e pediu que as três composições ("Aplicar várias operações", "Juntar vídeos" e "Movie Maker") configurem cada operação com os mesmos controlos da edição simples: os mesmos componentes, sliders, campos, valores por omissão, intervalos, unidades e validações. O editor da etapa 4 tinha uma segunda implementação visual (`video-chain-step-form.tsx`), que fica de fora. Os painéis das B004, B005 e B007 juntam, no mesmo componente, a configuração e a submissão da operação (`useVideoEditSession.submit`), por isso não se podem reutilizar sem mudar o seu código (preflight V10). A regra 2.6 do ADD proíbe alterar linhas existentes.

## Decision

Exceção à regra 2.6 decidida pela equipa (D-87), com este âmbito:

1. **Pode mudar:** só o código de frontend de vídeo criado pelos bolts desta construção nas B004, B005 e B007: `frontend/components/video/*` (os painéis de recorte, remoção de áudio, velocidade, marca de água, ajuste, filtro, redimensionamento, orientação e o painel de conversão) e, se for preciso, `frontend/lib/video-*.ts` dessas bolts.
2. **Só para:** extrair de cada painel um componente de configuração sem submissão, com o contrato comum `OperationConfigProps` (`ddd-02-technical-design.md`, "Revisão da etapa 2"), e fazer o painel simples usá-lo.
   - Os componentes são `TrimConfig`, `RemoveAudioConfig`, `SpeedConfig`, `WatermarkConfig`, `AdjustConfig`, `FilterConfig`, `ResizeConfig`, `OrientConfig` e `ConvertConfig`.
   - A submissão, a confirmação da remoção de áudio (AUDIO-004), o progresso e o acompanhamento ficam no painel simples.
3. **Não pode mudar:** o comportamento e o aspeto da edição simples (JSX visível, textos, valores por omissão, intervalos, passos, validações e mensagens). Também não muda o código original do PictuRAS (fluxo de imagem e serviços), nem o backend das B001 a B007, que continuam só por acréscimo.
4. **Recorte e pré-visualizações (D-89):**
   - Com `isSource: false`, o `TrimConfig` desativa o leitor, o *scrubbing* e o *loop preview* e mostra a indicação de que o recorte se aplica ao resultado do passo anterior.
   - As pré-visualizações estáticas recebem os `previewSteps` anteriores da mesma cadeia.
   - Na edição simples, `isSource` é sempre `true` e `previewSteps` está vazio, por isso nada muda.
5. **Auditoria:** o relatório da etapa 4 separa o `git diff --numstat origin/main...HEAD` em dois:
   - os ficheiros abrangidos pela D-87, com cada linha alterada ou removida listada;
   - o resto do código, que continua com 0 linhas removidas.

## Rationale

Uma única implementação dos controlos de cada operação garante que a edição simples e as composições nunca divergem: o pedido da equipa e o espírito do T-01 (uma fonte das regras), agora também para a interface. A exceção fica limitada a código de vídeo desta construção, que ainda não tem utilizadores fora dela, e deixa intacto tudo o que a regra 2.6 protege no PictuRAS original.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Formulário próprio das composições (`video-chain-step-form.tsx` da etapa 4) | Sem mexer nos painéis | Segunda implementação visual, diferente da edição simples | Recusado pela equipa na revisão |
| Montar o painel simples inteiro dentro das composições, escondendo o botão | Sem extrair | Submeteria a operação isolada; o estado e o progresso da tarefa misturam-se com os da composição | Comportamento errado |
| Copiar os painéis para componentes novos | Respeita a regra 2.6 | Duas cópias a manter, que divergem com o tempo | Mesmo problema da primeira alternativa |

## Consequences

### Positive

- Os mesmos controlos em todo o lado; uma mudança num controlo vale para a edição simples e para as composições.
- As composições herdam as validações no cliente e as mensagens dos painéis.

### Negative

- Linhas alteradas em ficheiros das B004, B005 e B007, que deixam de cumprir a regra 2.6 à letra; ficam listadas no relatório.
- Os painéis simples passam a depender de um contrato comum (`OperationConfigProps`).

### Risks

- **Regressão visual ou de comportamento na edição simples:** mitigada com os testes existentes das B004, B005 e B007, que têm de passar sem mudanças, e com a checklist visual de cada painel na etapa 5.
- **Um painel que não se separe sem mudar o JSX visível (V15):** regista-se uma dúvida nova e para-se.

## Related

- **Stories**: ST-VID-013, ST-VID-014; regressão de ST-VID-001 a 004, 008 a 012
- **Standards**: regra 2.6 do ADD (exceção D-87); T-01, T-07
- **Previous ADRs**: ADR-010, ADR-011, ADR-014, ADR-016
- **Dúvidas**: D-86, D-87, D-89; verificações V15 a V18, V22 e V24
