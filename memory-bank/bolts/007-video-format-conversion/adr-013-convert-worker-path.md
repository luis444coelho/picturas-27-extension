---
bolt: 007-video-format-conversion
created: 2026-10-22T22:33:00Z
status: accepted
superseded_by: null
---

# ADR-013: Ramo aditivo para a conversão isolada no worker

## Contexto

O T-06 exige que a conversão para AVI produza AVI e cópia MP4 na mesma invocação FFmpeg, com `split`/`asplit`. O `executor.build_command` da B003 constrói exatamente uma saída e usa sempre `-preset`/`-crf` em vídeo recodificado. A regra 2.6 proíbe substituir essas linhas. A B007 suporta apenas a operação isolada `convert`; a B008 tratará cadeias.

## Decisão

Antes do bloco genérico de execução de `task._execute`, uma guarda acrescentada para um único passo `convert` chama `convert_task.execute`. O módulo novo lê exclusivamente as decisões do plano persistido: codec, modo de cada stream, qualidade AVI e indicador `previewInSameInvocation`. Ele constrói a saída AVI+MP4 num só comando quando o plano o pede; MP4/MOV produzem um resultado e a pré-visualização posterior usa `ingest.preview` se o plano a pedir. Reutiliza `executor.run`, `ingest.probe`, geração de imagens, `StorageClient.upload`, progresso e cancelamento do `TaskRunner` (ADR-009), e devolve o mesmo contrato de resultado da B003.

O serviço de projetos acrescenta `plan.convert.previewInSameInvocation` num módulo de extras chamado depois dos módulos ADR-008/011 e antes de persistir o `VideoTask` (ADR-004). O worker não contém uma segunda matriz T-05. Os comandos das operações B003–B005 continuam no bloco anterior e sem alterações.

## Alternativas

1. Alterar `executor.build_command` e `_execute` para múltiplas saídas: viola a regra 2.6.
2. Gerar AVI e depois recodificar a pré-visualização: viola a invocação única de T-06 e recodifica frames já codificados.
3. Passar o AVI pelo construtor genérico com campos `preset`/`crf` fictícios e reescrever o comando depois: guarda parâmetros sem sentido no plano e cria acoplamento à ordem dos argumentos do executor.

## Consequências e verificação

Há uma via de execução adicional exclusiva de `convert`, com alguma repetição da sequência de metadados e upload; isso evita alterar o fluxo anterior. O teste da etapa 3 tem de cobrir saída dupla, ausência de áudio, cópia parcial, timestamps, cancelamento e falha/limpeza. O resultado AVI e a cópia MP4 devem existir antes do primeiro upload; `previewMade` e `keys.preview` têm de concordar para `tasks.outputProblem`.

## Referências

ADD 2.6, T-01, T-02, T-05 e T-06; D-68 a D-71; ADR-004/008/009/011; preflight V2/V3/V5/V6.
