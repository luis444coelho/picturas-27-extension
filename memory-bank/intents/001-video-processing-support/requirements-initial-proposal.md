---
intent: 001-video-processing-support
phase: inception
status: archived
created: 2026-10-09T16:57:05Z
updated: 2026-10-09T16:57:05Z
---

# Requirements: Video Processing Support

> **Arquivo histórico — não usar como requisito atual.** Esta proposta de cinco operações foi substituída pela ERS v2.3 em `docs/requirements.md` e `docs/requirements/`, que cobre UC-VID-000, UC-VID-001, UC-VID-002, UC-VID-003, UC-VID-004, UC-VID-005, UC-VID-006, UC-VID-007, UC-VID-008, UC-VID-009, UC-VID-010, UC-VID-011, UC-VID-012, UC-VID-013.

## Intent Overview

Esta especificacao define a primeira versao dos requisitos candidatos para estender o PictuRAS v27.1, atualmente orientado para imagens, com quatro funcionalidades de video: recorte temporal, remocao de audio, alteracao de velocidade, marca de agua.

Esta e uma especificacao de trabalho para revisao iterativa. O documento original de casos de uso permanece inalterado e a secao 4 do documento academico nao e preenchida por este artefacto.

## Evidence Boundary

- **Confirmado no sistema**: JWT, perfis `anonymous`/`free`/`premium`, projetos e resultados MongoDB, armazenamento S3/SeaweedFS, filas RabbitMQ, processamento assincrono de imagens, WebSocket e cancelamento do processamento atual de projetos.
- **Parcialmente confirmado**: progresso e cancelamento existem para pipelines de imagens; nao ha contrato generico de tarefas de video nem cancelamento confirmado a meio de uma operacao de video.
- **Nao confirmado**: upload/validacao de video, deteccao de codecs, processamento de video, extraacao de fotogramas, quotas especificas de video e suporte a resultados de video.
- **Origem desta especificacao**: comportamento descrito nos UC-VID-001, UC-VID-002, UC-VID-003, UC-VID-004 e no bloco duplicado de extracao, normalizado como .

## Business Goals

| Goal | Success Metric | Priority |
|------|----------------|----------|
| Disponibilizar as cinco operacoes de video como capacidades especificadas e testaveis | Cada caso de uso tem requisitos e criterios de aceitacao rastreaveis | Must |
| Preservar os dados originais e integrar resultados nos projetos existentes | Nenhuma operacao bem ou mal sucedida altera o original; resultados validos ficam associados ao projeto | Must |
| Reutilizar os mecanismos existentes sem confundir suporte generico com suporte de video | Dependencias para API, storage, filas e WebSocket estao identificadas sem assumir implementacao existente | Should |

## Requirement Conventions

- Estado inicial de todos os requisitos: **Em revisão**.
- `Must`, `Should` e `Could` sao prioridades propostas, nao aprovacao da equipa.
- A normalizacao proposta dos IDs e: `UC-VID-001` trim, `UC-VID-002` audio, `UC-VID-003` velocidade, `UC-VID-004` marca de agua.

## Functional Requirements

### Common Video Processing

### FR-VID-COMMON-001: Selecionar um video elegivel
- **Description**: O sistema deve permitir iniciar uma operacao de video apenas para um video identificado e acessivel no contexto do projeto ou biblioteca aplicavel ao utilizador.
- **Justification**: Todos os casos de uso pressupõem um video selecionado; o codigo atual apenas confirma recursos de imagem.
- **Origin**: UC-VID-001 passo 1, UC-VID-002 passo 1, UC-VID-003 passo 1, UC-VID-004 passo 1,  pre-condicoes.
- **Priority**: Must
- **Acceptance Criteria**: Um pedido sem video identificavel e rejeitado; um video de outro projeto ou sem permissao e rejeitado; um video elegivel chega a validacao da operacao.
- **Dependencies**: FR-VID-AUTH-001, FR-VID-STORAGE-001
- **Assumptions/Pending**: A representacao de um video dentro de um projeto ainda nao esta decidida.
- **Status**: Em revisão

### FR-VID-COMMON-002: Preservar o video original
- **Description**: O sistema deve produzir resultados sem substituir, alterar ou eliminar o video original.
- **Justification**: E uma garantia minima/sucesso repetida nos cinco casos de uso.
- **Origin**: UC-VID-001 RN3, UC-VID-002 RN2, UC-VID-003 RN4, UC-VID-004 RN4,  RN6.
- **Priority**: Must
- **Acceptance Criteria**: Antes e depois de uma operacao, o identificador, conteudo e metadados do original permanecem disponiveis e inalterados; uma falha nao remove o original.
- **Dependencies**: FR-VID-STORAGE-002, FR-VID-ERROR-002
- **Assumptions/Pending**: A definicao de igualdade de metadados e codec do resultado ainda depende dos formatos escolhidos.
- **Status**: Em revisão

### FR-VID-COMMON-003: Disponibilizar resultado valido
- **Description**: O sistema deve associar um resultado concluido com sucesso ao projeto ou biblioteca definida para a operacao e disponibiliza-lo para visualizacao e download quando aplicavel.
- **Justification**: Os casos de uso exigem um novo ficheiro ou imagens utilizaveis depois do processamento.
- **Origin**: UC-VID-001 passo 6-7, UC-VID-002 passo 5-6, UC-VID-003 passo 6-7, UC-VID-004 passos 8-9,  passo 7-8.
- **Priority**: Must
- **Acceptance Criteria**: Um resultado so aparece como disponivel depois de concluido; o resultado referencia a operacao e o original; resultados parciais nao aparecem na galeria final.
- **Dependencies**: FR-VID-STORAGE-002, FR-VID-ERROR-002
- **Assumptions/Pending**: E necessario decidir se resultados de video sao recursos novos ou extensoes do modelo de imagem.
- **Status**: Em revisão

### FR-VID-COMMON-004: Validar parametros antes de processar
- **Description**: O sistema deve validar os parametros especificos de cada operacao antes de criar ou iniciar o processamento.
- **Justification**: Os fluxos exigem bloqueio de pedidos invalidos antes de consumir recursos.
- **Origin**: UC-VID-001 passo 4, UC-VID-003 passo 4,  passo 3-4, UC-VID-004 RN2-RN3.
- **Priority**: Must
- **Acceptance Criteria**: Cada parametro invalido gera uma resposta identificavel; nenhum pedido invalido cria uma tarefa de processamento; parametros validos avancam para autorizacao.
- **Dependencies**: FR-VID-VALIDATION-001, FR-VID-ERROR-001
- **Assumptions/Pending**: Os limites concretos ainda sao decisoes pendentes.
- **Status**: Em revisão

### FR-VID-TRIM-001: Definir intervalo temporal
- **Description**: O sistema deve permitir ao utilizador definir um instante inicial e um instante final para conservar num video.
- **Justification**: E o comportamento nuclear do recorte temporal.
- **Origin**: UC-VID-001 passo 2-4, RN1-RN2.
- **Priority**: Must
- **Acceptance Criteria**: A interface ou API aceita ambos os instantes; rejeita inicio maior ou igual ao fim; rejeita instantes fora da duracao do video.
- **Dependencies**: FR-VID-COMMON-001, FR-VID-VALIDATION-002
- **Assumptions/Pending**: A unidade de precisao temporal e o comportamento nos limites de frames ainda precisam de decisao.
- **Status**: Em revisão

### FR-VID-TRIM-002: Produzir segmento recortado
- **Description**: O sistema deve produzir um novo video cujo conteudo temporal corresponde ao intervalo validado.
- **Justification**: Deriva da garantia de sucesso do UC-VID-001.
- **Origin**: UC-VID-001 objetivo, passo 6 e garantia de sucesso.
- **Priority**: Must
- **Acceptance Criteria**: O resultado inicia no limite inicial e termina no limite final segundo a precisao definida; o original permanece disponivel; uma falha nao publica um segmento incompleto.
- **Dependencies**: FR-VID-TRIM-001, FR-VID-COMMON-002, FR-VID-COMMON-003
- **Assumptions/Pending**: Preservacao de formato, resolucao, codec e streams ainda nao esta decidida.
- **Status**: Em revisão

### FR-VID-AUDIO-001: Remover audio
- **Description**: O sistema deve produzir uma nova versao de um video que contenha componente de video e nao contenha streams de audio.
- **Justification**: E a finalidade do UC-VID-002.
- **Origin**: UC-VID-002 objetivo, passo 2-5 e RN1-RN3.
- **Priority**: Must
- **Acceptance Criteria**: Um video com audio produz um resultado sem streams de audio; um video sem audio e rejeitado ou reportado como sem operacao aplicavel; a componente visual permanece presente.
- **Dependencies**: FR-VID-COMMON-001, FR-VID-COMMON-002, FR-VID-VALIDATION-001
- **Assumptions/Pending**: A politica para videos sem audio e a preservacao de codec ainda estao pendentes.
- **Status**: Em revisão

### FR-VID-SPEED-001: Definir fator de velocidade
- **Description**: O sistema deve permitir selecionar um fator de velocidade superior a zero e dentro do intervalo aprovado.
- **Justification**: Deriva do UC-VID-003, que exige velocidade valida e duracao estimada.
- **Origin**: UC-VID-003 passo 2-4, RN1-RN3.
- **Priority**: Must
- **Acceptance Criteria**: Valores nulos, zero, negativos ou fora dos limites sao rejeitados; um valor valido e mostrado antes da confirmacao; a duracao estimada e recalculada de forma consistente.
- **Dependencies**: FR-VID-COMMON-001, FR-VID-VALIDATION-002
- **Assumptions/Pending**: Os limites minimo/maximo e a escolha livre versus valores predefinidos estao pendentes.
- **Status**: Em revisão

### FR-VID-SPEED-002: Produzir video com velocidade selecionada
- **Description**: O sistema deve produzir um novo video com o fator de velocidade confirmado, mantendo o video original.
- **Justification**: Deriva da garantia de sucesso do UC-VID-003.
- **Origin**: UC-VID-003 passo 5-7, RN3-RN4.
- **Priority**: Must
- **Acceptance Criteria**: Interpretando o fator como multiplicador da velocidade de reproducao, um fator superior a 1 produz uma duracao inferior a original e um fator entre 0 e 1 produz uma duracao superior; o resultado respeita o fator confirmado e o original nao e alterado.
- **Dependencies**: FR-VID-SPEED-001, FR-VID-COMMON-002, FR-VID-COMMON-003
- **Assumptions/Pending**: O tratamento da velocidade do audio e a convencao matematica do fator precisam de ser confirmados.
- **Status**: Em revisão

### FR-VID-WATERMARK-001: Configurar marca de agua
- **Description**: Para utilizadores autorizados, o sistema deve permitir configurar uma marca de agua de texto ou imagem, incluindo posicao, tamanho e transparencia dentro dos limites aprovados.
- **Justification**: Deriva dos passos 2-4 e RN2-RN3 do caso de marca de agua.
- **Origin**: UC-VID-004 passos 2-4, FA1-FA2, RN2-RN3.
- **Priority**: Must
- **Acceptance Criteria**: Texto e imagem sao distinguidos; uma imagem invalida e rejeitada; posicao fora da area visivel e rejeitada; tamanho e transparencia fora dos limites sao rejeitados; a configuracao validada e mostrada antes do processamento.
- **Dependencies**: FR-VID-AUTH-002, FR-VID-VALIDATION-001
- **Assumptions/Pending**: Fonte, formatos da imagem de marca e limites numericos ainda nao foram definidos.
- **Status**: Em revisão

### FR-VID-WATERMARK-002: Aplicar marca de agua consistentemente
- **Description**: O sistema deve aplicar a configuracao confirmada de forma consistente aos fotogramas do video durante toda a sua duracao.
- **Justification**: E a regra central de processamento do UC-VID-004.
- **Origin**: UC-VID-004 passo 6 e RN1.
- **Priority**: Must
- **Acceptance Criteria**: Uma amostra de fotogramas no inicio, meio e fim apresenta a marca conforme a mesma configuracao; a posicao nao varia sem uma funcionalidade explicitamente aprovada; uma falha nao publica video parcial.
- **Dependencies**: FR-VID-WATERMARK-001, FR-VID-COMMON-002, FR-VID-TASK-001
- **Assumptions/Pending**: O requisito assume posicao fixa ao longo do video, proposta ainda nao aprovada.
- **Status**: Em revisão

### Authentication, Authorization and Quotas

### FR-VID-AUTH-001: Autenticar operacoes protegidas
- **Description**: O sistema deve exigir um JWT valido nas operacoes que requerem sessao ou acesso a projeto privado.
- **Justification**: A arquitetura confirma JWT para rotas protegidas; os casos de marca de agua e extracao exigem sessao.
- **Origin**: UC-VID-004 pre-condicoes,  pre-condicoes, arquitetura existente.
- **Priority**: Must
- **Acceptance Criteria**: Sem JWT ou com JWT invalido a operacao e rejeitada; um JWT valido identifica o utilizador; o utilizador nao pode operar num projeto privado de outro utilizador sem permissao explicita.
- **Dependencies**: Sistema de autenticacao JWT existente.
- **Assumptions/Pending**: O acesso anonimo a trim/audio/velocidade continua pendente porque o armazenamento de resultados nao esta definido.
- **Status**: Em revisão

### FR-VID-AUTH-002: Verificar permissao de edicao
- **Description**: O sistema deve verificar que o utilizador e proprietario ou possui permissao de edicao no projeto antes de criar, alterar ou guardar um resultado de video.
- **Justification**: O sistema existente ja distingue dono e links de partilha read/edit; o caso de extracao exige permissao de editar.
- **Origin**: UC-VID-004 pre-condicoes,  pre-condicoes, middleware de partilha existente.
- **Priority**: Must
- **Acceptance Criteria**: Um utilizador com permissao read nao inicia a operacao; dono ou permissao edit podem iniciar se todas as outras validacoes passarem; a decisao e registada no pedido.
- **Dependencies**: FR-VID-AUTH-001
- **Assumptions/Pending**: A identidade usada para quota em projetos partilhados esta pendente.
- **Status**: Em revisão

### FR-VID-QUOTA-001: Aplicar politica de quota aprovada
- **Description**: Quando a politica aprovada definir quota para uma operacao de video, o sistema deve verificar, reservar e confirmar ou devolver a unidade de quota antes de iniciar processamento que a consuma.
- **Justification**: UC-VID-002 e  referem quota; o codigo atual so confirma quota para ferramentas avancadas de imagem.
- **Origin**: UC-VID-002 excecao de quota,  passo 4, RN4, FA2/FA4.
- **Priority**: Must
- **Acceptance Criteria**: Uma operacao sem quota nao inicia; uma reserva aparece como consumida apenas segundo a politica aprovada; falha/cancelamento devolve a reserva quando a politica o determinar; Premium segue a regra aprovada.
- **Dependencies**: FR-VID-AUTH-001, decisao D-VID-001.
- **Assumptions/Pending**: Nao se assume que a quota atual de advanced tools serve diretamente para video.
- **Status**: Em revisão

### Validation, Storage and Errors

### FR-VID-VALIDATION-001: Validar ficheiro e streams
- **Description**: O sistema deve validar que o ficheiro e descodificavel e que contem as streams necessarias para a operacao antes de processar.
- **Justification**: Todos os casos referem formato/codec; audio requer stream de audio; video requer stream de video.
- **Origin**: UC-VID-001, UC-VID-002, UC-VID-003 excecoes, UC-VID-004 EX1/EX4,  excecao de descodificacao.
- **Priority**: Must
- **Acceptance Criteria**: Ficheiro inexistente, corrompido ou nao descodificavel e rejeitado com erro identificavel; ausencia de audio e detetada antes de remove audio; metadata de duracao e streams fica disponivel para validacao.
- **Dependencies**: FR-VID-STORAGE-001
- **Assumptions/Pending**: Formatos e codecs suportados serao decididos em D-VID-002.
- **Status**: Em revisão

### FR-VID-VALIDATION-002: Validar limites de tamanho e duracao
- **Description**: O sistema deve comparar o tamanho e a duracao do video com os limites aprovados para o perfil e a operacao antes de iniciar o processamento.
- **Justification**: Os casos de uso exigem bloqueio de videos que excedam limites, embora os valores sejam propostas.
- **Origin**: UC-VID-001, UC-VID-002, UC-VID-003 excecoes, UC-VID-004 EX2,  RN1 e excecoes.
- **Priority**: Must
- **Acceptance Criteria**: Um video acima de qualquer limite aprovado e rejeitado; a resposta identifica o limite excedido; nenhum recurso de processamento e reservado antes da validacao passar.
- **Dependencies**: FR-VID-AUTH-001, decisao D-VID-001.
- **Assumptions/Pending**: Os valores concretos nao sao requisitos aprovados.
- **Status**: Em revisão

### FR-VID-STORAGE-001: Armazenar e recuperar videos
- **Description**: O sistema deve armazenar e recuperar videos de forma identificavel e autorizada, mantendo a separacao entre original, temporarios e resultados.
- **Justification**: As cinco funcionalidades requerem um input persistente ou acessivel e os casos 004/005 exigem biblioteca/projeto.
- **Origin**: Pre-condicoes dos cinco casos, UC-VID-004 passos 8-9,  RN9.
- **Priority**: Must
- **Acceptance Criteria**: Um video carregado recebe identificador e metadata; apenas utilizadores autorizados obtem URL/resultado; os objetos original e resultado nao colidem; falha de upload nao cria referencia valida.
- **Dependencies**: Storage S3/SeaweedFS existente, FR-VID-AUTH-002.
- **Assumptions/Pending**: O modelo de recursos de video e uma alteracao futura, nao uma capacidade confirmada.
- **Status**: Em revisão

### FR-VID-STORAGE-002: Gerir ciclo de vida dos resultados
- **Description**: O sistema deve criar, manter, consultar e eliminar resultados de video e imagens extraidas segundo a politica aprovada para recursos do projeto.
- **Justification**: E necessario para resultados, falhas, rejeicao e preservacao do original.
- **Origin**: UC-VID-001, UC-VID-002, UC-VID-003 garantias, UC-VID-004 RN6,  RN9.
- **Priority**: Must
- **Acceptance Criteria**: Resultado concluido e consultavel; resultado cancelado/falhado e removido ou marcado como nao utilizavel; a eliminacao respeita a autorizacao; a referencia persistida nao aponta para objeto inexistente.
- **Dependencies**: FR-VID-STORAGE-001, FR-VID-COMMON-003.
- **Assumptions/Pending**: Politica de retencao e se resultados sao aceites/rejeitados explicitamente continuam pendentes.
- **Status**: Em revisão

### FR-VID-TASK-001: Executar operacoes demoradas de forma assincrona
- **Description**: O sistema deve criar uma tarefa identificavel para operacoes de video que possam bloquear a aplicacao e deve devolver o estado inicial ao cliente sem esperar pela conclusao.
- **Justification**: E explicito para marca de agua e extracao e assumido para o processamento de video.
- **Origin**: UC-VID-004 passo 5 e A2,  passo 4-6 e RN7.
- **Priority**: Must
- **Acceptance Criteria**: A confirmacao devolve um identificador e estado; a tarefa pode ser consultada; a conclusao ou falha atualiza o estado sem exigir que o pedido HTTP original permaneça aberto.
- **Dependencies**: RabbitMQ existente, FR-VID-STORAGE-001.
- **Assumptions/Pending**: O contrato de fila e worker de video ainda nao existe.
- **Status**: Em revisão

### FR-VID-TASK-002: Comunicar progresso
- **Description**: Durante uma operacao assincrona, o sistema deve comunicar os estados da tarefa e, quando a operacao tiver uma unidade de trabalho mensuravel, o progresso correspondente.
- **Justification**: Os casos de marca de agua e extracao exigem progresso; WebSocket existe para imagens.
- **Origin**: UC-VID-004 passo 7,  passo 5-6 e RN7.
- **Priority**: Should
- **Acceptance Criteria**: O cliente recebe estados equivalentes a queued, processing e um estado terminal completed, failed ou cancelled; quando existir uma unidade de trabalho mensuravel, recebe progresso monotonicamente crescente entre 0 e 100; uma tarefa em estado terminal nao emite novos eventos de progresso.
- **Dependencies**: FR-VID-TASK-001, WebSocket existente.
- **Assumptions/Pending**: A granularidade frame/percentagem e pendente.
- **Status**: Em revisão

### FR-VID-TASK-003: Cancelar tarefa de video
- **Description**: O sistema deve permitir solicitar o cancelamento de uma tarefa de video em processamento e deve impedir a publicacao de resultados parciais.
- **Justification**: UC-VID-001, UC-VID-003 permitem cancelar antes do processamento e  permite cancelar durante processamento; marca de agua cobre cancelamento antes da execucao efetiva.
- **Origin**: UC-VID-001 FA4.2, UC-VID-003 FA4.2, UC-VID-004 FA3,  FA2/RN7.
- **Priority**: Should
- **Acceptance Criteria**: Um pedido autorizado de cancelamento altera o estado para cancelling/cancelled; nenhum resultado parcial e publicado; a tarefa terminada nao pode ser cancelada como se estivesse ativa; a politica de quota e aplicada.
- **Dependencies**: FR-VID-TASK-001, FR-VID-ERROR-002, FR-VID-QUOTA-001.
- **Assumptions/Pending**: O mecanismo de cancelamento de imagens nao prova este requisito para video.
- **Status**: Em revisão

### FR-VID-ERROR-001: Comunicar erros acionaveis
- **Description**: O sistema deve comunicar ao utilizador a causa funcional de uma rejeicao ou falha de video sem expor segredos ou detalhes internos desnecessarios.
- **Justification**: Todos os casos exigem mensagens para parametros, formatos, limites, quota e falhas.
- **Origin**: Excecoes dos UC-VID-001, UC-VID-002, UC-VID-003, UC-VID-004.
- **Priority**: Must
- **Acceptance Criteria**: Cada classe de erro tem codigo ou categoria estavel; a mensagem identifica a correcao esperada quando aplicavel; respostas de producao nao incluem stack traces, tokens ou credenciais.
- **Dependencies**: FR-VID-VALIDATION-001, FR-VID-VALIDATION-002.
- **Assumptions/Pending**: O formato comum de erros de video ainda nao esta definido.
- **Status**: Em revisão

### FR-VID-ERROR-002: Recuperar de falha sem contaminar o projeto
- **Description**: Se uma operacao falhar, expirar ou for cancelada, o sistema deve deixar o projeto e o original no ultimo estado consistente e limpar ou invalidar artefactos parciais.
- **Justification**: Garantias minimas e excecoes dos cinco casos exigem ausencia de resultados incompletos.
- **Origin**: Garantias minimas dos UC-VID-001, UC-VID-002, UC-VID-003, UC-VID-004;  RN5.
- **Priority**: Must
- **Acceptance Criteria**: Apos falha, nao existe resultado utilizavel parcial; o original e consultavel; referencias temporarias sao limpas ou marcadas invalidas; a operacao reservada e tratada segundo D-VID-001.
- **Dependencies**: FR-VID-STORAGE-002, FR-VID-TASK-003, FR-VID-QUOTA-001.
- **Assumptions/Pending**: A garantia transacional entre storage e base de dados e uma lacuna arquitetural.
- **Status**: Em revisão

## Non-Functional Requirements

### NFR-VID-001: Seguranca no acesso a recursos
- **Description**: Operacoes e URLs de videos/resultados devem respeitar autenticacao, autorizacao de projeto e expiracao/controlo de acesso aplicavel ao storage.
- **Origin/Justification**: JWT, projetos privados, partilha read/edit e storage assinado existentes; UC-VID-004.
- **Priority**: Must
- **Acceptance Criteria**: Pedidos sem permissao falham; URL interna nao e exposta como URL publica; utilizador read nao consegue criar resultado; logs nao contem JWT ou credenciais.
- **Dependencies**: FR-VID-AUTH-001/002, FR-VID-STORAGE-001.
- **Assumptions/Pending**: A politica RGPD/retencao deve ser confirmada pela equipa.
- **Status**: Em revisão

### NFR-VID-002: Integridade e nao destrutividade
- **Description**: O processamento deve preservar o original e publicar resultados apenas apos validacao de completude e integridade.
- **Origin/Justification**: Garantias minimas e RN3/RN4/RN5/RN6 dos casos.
- **Priority**: Must
- **Acceptance Criteria**: Testes de falha em diferentes fases nao deixam resultado final incompleto; hashes ou metadata suficientes permitem detetar referencias invalidas; original permanece recuperavel.
- **Dependencies**: FR-VID-COMMON-002, FR-VID-ERROR-002.
- **Assumptions/Pending**: Metodo concreto de verificacao de integridade e pendente.
- **Status**: Em revisão

### NFR-VID-003: Gestao de recursos
- **Description**: O processamento deve impor os limites aprovados de entrada, tarefas ativas e armazenamento temporario, rejeitando pedidos que excedam capacidade conhecida.
- **Origin/Justification**: Limites propostos nos casos e necessidade DevOps descrita em .
- **Priority**: Should
- **Acceptance Criteria**: Um pedido acima do limite aprovado e rejeitado antes de consumir processamento; tarefas temporarias sao removidas ou expiradas; o sistema comunica falta de capacidade de forma controlada.
- **Dependencies**: FR-VID-VALIDATION-002, FR-VID-ERROR-002.
- **Assumptions/Pending**: Nao ha valores de capacidade aprovados.
- **Status**: Em revisão

### NFR-VID-004: Testabilidade e rastreabilidade
- **Description**: Cada operacao de video deve manter identificadores correlacionaveis que permitam relacionar pedido, tarefa, input, output, utilizador, projeto e estado final, sem depender de um framework de testes especifico.
- **Origin/Justification**: Processos existentes usam `msg_id`, `token` e resultados; a nova funcionalidade exige rastreabilidade verificavel.
- **Priority**: Must
- **Acceptance Criteria**: Um consumidor autorizado consegue localizar uma tarefa pelo seu identificador; cada resultado referencia o input e a operacao; transicoes de estado e erros ficam auditaveis sem dados sensiveis.
- **Dependencies**: FR-VID-TASK-001, FR-VID-STORAGE-002.
- **Assumptions/Pending**: O formato de auditoria e retencao de logs ainda nao foi decidido.
- **Status**: Em revisão

### NFR-VID-005: Compatibilidade interoperavel
- **Description**: O sistema deve aceitar e produzir apenas os formatos e codecs explicitamente aprovados para o MVP, documentando incompatibilidades de forma deterministica.
- **Origin/Justification**: Todos os casos perguntam por formatos/codecs; nao ha evidencia de suporte atual.
- **Priority**: Must
- **Acceptance Criteria**: Um ficheiro dentro da matriz aprovada e aceite; um ficheiro fora dela e rejeitado com motivo; o resultado tem formato declarado e e descodificavel pelos validadores escolhidos.
- **Dependencies**: FR-VID-VALIDATION-001, decisao D-VID-002.
- **Assumptions/Pending**: MP4 H.264/AAC e WebM sao apenas proposta dos casos, nao decisao.
- **Status**: Em revisão

### NFR-VID-006: Feedback sem objetivo quantitativo inventado
- **Description**: O feedback de uma operacao assincrona deve representar de forma consistente os estados de espera, processamento, sucesso, cancelamento e falha, sem anunciar um estado terminal antes de a tarefa o atingir.
- **Origin/Justification**: UC-VID-004 e ausencia de metricas existentes para video.
- **Priority**: Should
- **Acceptance Criteria**: Cada estado terminal e distinguivel no cliente; uma tarefa que falha ou e cancelada apresenta o respetivo resultado; nenhum evento ou resposta afirma conclusao antes do estado terminal.
- **Dependencies**: FR-VID-TASK-002, FR-VID-ERROR-001.
- **Assumptions/Pending**: Metricas quantitativas de latencia, throughput e capacidade nao fazem parte deste requisito e devem ser decididas separadamente em D-VID-010.
- **Status**: Em revisão

## Constraints

### Technical Constraints

- A implementacao futura deve integrar-se com os limites reais de API Gateway, projetos, users, image storage, RabbitMQ e WebSocket identificados na analise.
- Nao se pode assumir que os modelos `imgs` e `results` suportam videos sem extensao ou novo tipo de recurso.
- A secao 4 de `docs/casos-de-uso-video.md` nao e alterada por esta especificacao.
- Esta etapa nao inclui codigo, instalacao de dependencias ou desenho detalhado de implementacao.

### Business Constraints

- Os valores de limites, quotas e perfis continuam sujeitos a aprovacao da equipa.
- Nenhum requisito deste documento esta aprovado sem confirmacao explicita.
- O MVP deve manter o video original e evitar publicar resultados incompletos.

## Assumptions

| Assumption | Risk if Invalid | Mitigation |
|------------|-----------------|------------|
| A normalizacao  sera aceite | Rastreabilidade fica ambigua no documento original | Manter tabela de correspondencia em `case-review.md` |
| Videos poderao ser associados a projetos | Os cinco casos nao podem partilhar o mesmo fluxo de recursos | Decidir modelo de recurso antes do desenho tecnico |
| Operacoes longas serao assincronas | Pedidos HTTP bloqueiam e a UX nao corresponde aos casos | Reaproveitar RabbitMQ/WebSocket apenas como pontos de integracao, nao como suporte ja existente |
| Limites quantitativos sao propostas configuraveis | Requisitos de validacao podem mudar | Manter limites fora do texto normativo ate aprovacao |

## Open Questions

| ID | Question | Affected Requirements | Recommendation for MVP | Status |
|----|----------|-----------------------|------------------------|--------|
| D-VID-001 | Que perfis podem executar cada operacao e como se aplica quota a video? | FR-VID-AUTH-001/002, FR-VID-QUOTA-001, FR-VID-VALIDATION-002, NFR-VID-001 | Registado/Premium para operacoes que guardam no projeto; decidir anonimo separadamente | Pending |
| D-VID-002 | Quais formatos e codecs de entrada/saida sao suportados? | FR-VID-VALIDATION-001, NFR-VID-005, trim/audio/speed/watermark | Comecar com uma matriz pequena e explicitamente testavel | Pending |
| D-VID-003 | Como representar videos e resultados nos projetos? | FR-VID-COMMON-001/003, FR-VID-STORAGE-001/002,  | Recurso de video explicito, sem forcar video no schema de imagens | Pending |
| D-VID-004 | O cancelamento e progresso aplicam-se a todas as operacoes? | FR-VID-TASK-001, TASK-002, TASK-003, FR-VID-ERROR-002, NFR-VID-006 | Aplicar a todas as tarefas demoradas, com granularidade definida por operacao | Pending |
| D-VID-005 | Quais limites de tamanho, duracao sao aprovados? | FR-VID-VALIDATION-002, NFR-VID-003 | Manter os limites do documento como configuracao proposta, nao requisito aprovado | Pending |
| D-VID-007 | Resultados de video sao guardados automaticamente e por quanto tempo? | FR-VID-COMMON-003, FR-VID-STORAGE-002, NFR-VID-002 | Guardar como novo recurso e aplicar politica de projeto existente, se confirmada | Pending |
| D-VID-008 | Em partilha edit, a quota pertence ao dono ou ao executor? | FR-VID-AUTH-002, FR-VID-QUOTA-001 | Usar identidade que executa a operacao, salvo regra de negocio contraria | Pending |
| D-VID-009 | A marca de agua fica fixa ou pode variar no tempo? | FR-VID-WATERMARK-002 | Fixa no MVP por ser verificavel e coerente com o caso atual | Pending |
| D-VID-010 | Que metas quantitativas de desempenho, capacidade e retencao sao necessarias? | NFR-VID-003, NFR-VID-006 | Adiar numeros ate existirem amostras e capacidade medida | Pending |
