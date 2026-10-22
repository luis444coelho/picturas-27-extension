---
bolt: 007-video-format-conversion
created: 2026-10-22T22:33:00Z
status: proposed
superseded_by: null
---

# ADR-014: Modos de stream na validação apenas de `convert`

## Contexto

O ADD 4.7 e CONVERT-003 exigem que o painel mostre cópia direta ou recodificação a partir do endpoint de validação. `plan.decide` já calcula os modos por stream, mas `tasks.validate` devolve só as propriedades estimadas em `output`. O contrato dos painéis B004/B005 não pode mudar (regra 2.6, D-72).

## Decisão proposta

Uma linha nova após `plans.decide` chama um módulo da B007 que acrescenta `videoMode` e `audioMode` a `decided.output` somente se a lista tiver um único passo `convert`. `tasks.validate` devolve esse objeto pela linha existente. O painel lê os dois modos do servidor; diz «Cópia direta» apenas se todas as streams presentes forem copiadas. A resposta de todas as outras operações conserva as mesmas chaves. Em `submit`, um helper novo transforma apenas `SAME_FORMAT` e `UNSUPPORTED_TARGET_FORMAT` da conversão nos respetivos códigos HTTP 422 antes do tratamento genérico de parâmetros; as outras operações continuam a usar `INVALID_STEP_PARAMS`.

## Alternativas

1. Decidir os modos no navegador: duplica a matriz T-05 e pode divergir do plano real.
2. Criar um endpoint novo: acrescenta uma segunda chamada e validação redundante no painel.
3. Alterar o objeto de resposta de todas as operações: afeta B004/B005 e viola a D-72.

## Consequências e verificação

O `output` de `convert` tem dois campos adicionais. Os testes da etapa 3 devem comparar as respostas da B004/B005 antes e depois, confirmar cópia parcial e exigir códigos 422 específicos sem criar tarefa nem reservar quota.

## Referências

ADD 2.6, T-01 e 4.7; CONVERT-003/004; D-72; preflight V4.
