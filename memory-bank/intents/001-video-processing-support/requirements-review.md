---
intent: 001-video-processing-support
phase: inception
status: superseded
created: 2026-10-09T16:57:05Z
updated: 2026-10-09T16:57:05Z
---

# Requirements Review: Video Processing Support

> **Revisão histórica da proposta inicial (5 operações).** A revisão atual é `docs/requirements/quality-review.md`; a ERS v2.3 e o relatório dos capítulos 1–7 são as referências vigentes.

## Review Criteria

Cada requisito foi revisto quanto a obrigacao concreta, clareza, verificabilidade, cobertura dos criterios, duplicacao, dependencias, prioridade, origem e dependencia de decisoes.

## Individual Review

| Requirement | Result | Finding or action |
|-------------|--------|-------------------|
| FR-VID-COMMON-001 | Keep with pending decision | Obrigacao necessaria; depende do modelo de recurso de video e de autorizacao. |
| FR-VID-COMMON-002 | Keep | Nao destrutividade e obrigacao central; criterios cobrem sucesso e falha. |
| FR-VID-COMMON-003 | Keep with pending decision | Necessario para todos os resultados; modelo de recurso e politica de download continuam pendentes. |
| FR-VID-COMMON-004 | Keep | Validacao anterior a tarefas e quota e verificavel. |
| FR-VID-TRIM-001 | Keep with clarification pending | Precisa de decisao sobre precisao temporal e limites de frames. |
| FR-VID-TRIM-002 | Keep with clarification pending | Cobertura adequada; codec e preservacao de streams dependem de D-VID-002. |
| FR-VID-AUDIO-001 | Keep with policy pending | Representa resultado e caso sem audio; a politica de rejeicao/report deve ser decidida. |
| FR-VID-SPEED-001 | Keep with pending decision | Fator e limites sao claros como estrutura, mas valores ainda nao aprovados. |
| FR-VID-SPEED-002 | Revised | O criterio de duracao foi tornado verificavel para o fator interpretado como multiplicador; a convencao continua identificada como pendente. |
| FR-VID-WATERMARK-001 | Keep with pending decision | Configuracao concreta e necessaria; limites numericos, fontes e formatos continuam pendentes. |
| FR-VID-WATERMARK-002 | Keep with pending decision | Cobre consistencia temporal; posicao fixa e uma proposta explicitamente marcada. |
| FR-VID-FRAMES-001 | Keep with pending decision | Cobre parametros e estimativa; formula do intervalo continua em D-VID-006. |
| FR-VID-FRAMES-002 | Revised | Terminologia corrigida para “de forma atomica”; a estrategia de compensacao/transacao continua pendente. |
| FR-VID-FRAMES-003 | Keep as Should | E um fluxo alternativo relevante, mas nao bloqueia a extracao basica. |
| FR-VID-AUTH-001 | Keep with pending decision | Necessario para recursos privados; o acesso anonimo as tres primeiras operacoes continua por decidir. |
| FR-VID-AUTH-002 | Keep | A permissao read versus edit e verificavel e alinhada com o middleware existente. |
| FR-VID-QUOTA-001 | Revised | A aplicacao fica explicitamente condicionada a operacoes para as quais a politica aprovada defina quota; nao generaliza a quota de imagem. |
| FR-VID-VALIDATION-001 | Keep | Ficheiro, streams e metadata sao pre-condicoes verificaveis; codecs dependem de D-VID-002. |
| FR-VID-VALIDATION-002 | Keep with pending decision | Obrigacao necessaria; os limites concretos continuam fora do requisito aprovado. |
| FR-VID-STORAGE-001 | Keep with pending decision | Necessario para input e output; o modelo de recurso e a politica de upload precisam de decisao. |
| FR-VID-STORAGE-002 | Keep with pending decision | Cobre o ciclo de vida; retencao e rejeicao explicita ainda nao decididas. |
| FR-VID-TASK-001 | Keep with clarification pending | Necessario para operacoes longas; e preciso definir quais operacoes/limiares sao assincronos. |
| FR-VID-TASK-002 | Revised | Estados terminais sao obrigatorios; progresso numerico passa a ser exigido apenas quando existir unidade de trabalho mensuravel. |
| FR-VID-TASK-003 | Keep with pending decision | Cobre cancelamento e ausencia de resultados parciais; mecanismo tecnico nao esta confirmado. |
| FR-VID-ERROR-001 | Keep | Classes de erro e ausencia de segredos sao verificaveis. |
| FR-VID-ERROR-002 | Keep with pending decision | Obrigacao necessaria; atomidade/compensacao depende de D-VID-003 e D-VID-007. |
| NFR-VID-001 | Keep | Propriedade de seguranca concreta e verificavel por testes de autorizacao e inspeccao de URLs/logs. |
| NFR-VID-002 | Keep with pending decision | Propriedade de integridade central; metodo de verificacao ainda deve ser escolhido. |
| NFR-VID-003 | Keep with metric gap | Necessario para proteger recursos, mas precisa de limites configurados antes da aprovacao final. |
| NFR-VID-004 | Revised | Reformulado para exigir identificadores correlacionaveis e estados auditaveis, evitando depender da existencia de um framework de testes especifico. |
| NFR-VID-005 | Keep with pending decision | Compatibilidade e verificavel contra uma matriz aprovada; a matriz ainda nao existe. |
| NFR-VID-006 | Revised | Mantido como propriedade de consistencia do feedback assincrono, sem duplicar metas de latencia ou throughput. |

## Functional Coverage

- **UC-VID-001**: selecao, parametros, recorte, original, resultado e falhas cobertos. Precisao temporal, formato e politica de quota pendentes.
- **UC-VID-002**: deteccao de audio, resultado sem audio, original, erros e quota cobertos. Politica para video sem audio e comportamento do audio associado pendentes.
- **UC-VID-003**: fator, duracao, resultado, original e erros cobertos. Limites e semantica do audio pendentes.
- **UC-VID-004**: configuracao, aplicacao consistente, tarefa, progresso, resultado e falhas cobertos. Contrato assincrono, limites e posicao fixa pendentes.
- **UC-VID-005**: parametros, estimativa, quota, tarefa, progresso, cancelamento, atomicidade e integracao no projeto cobertos. Formula, limites e modelo de recurso pendentes.

## Findings That Do Not Require Requirement Changes

- Nao foram encontrados IDs de requisitos duplicados.
- Nao ha requisitos marcados como aprovados.
- Os requisitos transversais nao sao duplicacoes indevidas: derivam de pre-condicoes, excecoes e garantias repetidas.
- A inexistencia de suporte de video no codigo nao invalida os requisitos; esta registada como restricao/risco, nao como capacidade existente.

## Residual Ambiguities

- Perfis e quotas por operacao.
- Matriz de formatos/codecs.
- Modelo de video no projeto.
- Semantica temporal e contagem de frames.
- Estados, limiares e unidade de progresso.
- Retencao e transacao/compensacao de resultados.
- Metas quantitativas de capacidade e desempenho.

## Review of the Academic Template Work Product

- Foi criado um artefacto separado em `use-cases-academic.md` para refletir a refinacao dos cinco casos de uso sem alterar o documento original `docs/casos-de-uso-video.md`.
- A estrutura adoptada respeita a organização das secções 0 a 3 do template academico e evita qualquer preenchimento da secção 4, conforme a instrução do enunciado.
- A origem documental foi mantida, as incertezas foram explicitadas como questões em aberto e as decisões ainda pendentes continuam identificadas nos artefactos de trabalho do intent.
- A integridade da fonte original foi preservada: o ficheiro de origem continua inalterado e a secção 4 do template académico continua vazia.
