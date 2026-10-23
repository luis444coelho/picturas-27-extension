#import "../template.typ": *

= Alterações Arquiteturais

#orientacao[
  Partam do documento de solução arquitetural de base e descrevam apenas o *delta* introduzido pelo suporte a
  vídeo. O nível de detalhe é o de um MVP: o suficiente para que outra equipa perceba, mantenha e estenda a
  solução na Fase 2. Cada alteração deve estar ligada aos requisitos que a motivam.
]


== Visão geral das alterações

#orientacao[
  A vista de componentes é *opcional*: incluam-na se ajudar a perceber as alterações. A tabela de componentes
  novos e alterados é suficiente.
]


A extensão mantém a topologia de serviços da baseline: frontend Next.js, API Gateway, serviços de Projetos e Utilizadores, WS Gateway, MongoDB, RabbitMQ e armazenamento SeaweedFS/S3 atrás de Nginx. O novo serviço de execução é o worker de vídeo em `Tools/video/`. Nos serviços existentes acrescentam-se módulos e pontos de ligação, de modo a preservar o comportamento dos fluxos de imagem e reutilizar os contratos existentes que servem a extensão.

O serviço de Projetos concentra a autorização de projeto, os metadados, o planeamento, a admissão das tarefas e a publicação dos resultados. O worker executa o plano e devolve as chaves e os metadados reais; não escreve diretamente no MongoDB. O serviço de Utilizadores continua responsável pela identidade e pelos créditos. RabbitMQ transporta pedidos, respostas, progresso e cancelamento em contratos próprios de vídeo.

#figure(
  image("../images/arquitetura_componentes.png", width: 100%, height: 21cm, fit: "contain"),
  caption: [Arquitetura de componentes proposta: infraestrutura da baseline a cinzento e módulos de vídeo a azul],
)

No diagrama, as setas representam as dependências e os percursos de comunicação. O frontend acede por HTTPS a Nginx, que encaminha a API para o gateway, as ligações WebSocket para o WS Gateway e as transferências assinadas para S3. O API Gateway valida a identidade e encaminha os pedidos de vídeo para Projetos. Na gravação de predefinições, consulta primeiro a validação estrutural de Projetos e só depois encaminha a escrita a Utilizadores; a leitura e a eliminação não exigem essa validação dos passos.

Projetos consulta o perfil e os créditos em Utilizadores e mantém no seu MongoDB os vídeos, as tarefas e os locks. A figura agrega as bases MongoDB, mas cada serviço conserva a sua persistência. Projetos publica os planos em RabbitMQ; o worker consome-os e devolve resultados. Os eventos percorrem RabbitMQ e WS Gateway até ao frontend. O módulo imageStorageService emite URLs e gere objetos; os binários são transferidos diretamente entre worker e SeaweedFS/S3, por blocos, sem passarem pelo API Gateway. A cor azul assinala a lógica de vídeo acrescentada aos serviços e o worker novo; a cor cinzenta identifica a infraestrutura existente reutilizada.

#tab([Componentes novos e alterados],
  tabela(
    colunas: (3.2cm, 1.8cm, 1fr, 3cm),
    tamanho: 7.5pt,
    [#text("Componente / serviço")], [#text("Estado")], [#text("Responsabilidade / alteração")], [#text("Requisitos")],
    [#text("Frontend")], [#text("Alterado")], [#text("Componentes de carregamento, galeria, leitor, informações e edição de vídeo. Aplicar várias operações, Juntar vídeos e Movie Maker, com ordenação, subcadeias por clip, estimativas, custo, predefinições, progresso e cancelamento. Os nove painéis partilham componentes de configuração, preservando a utilização da edição simples.")], [#text("REQ-VID-UPLOAD-001/002/015; REQ-VID-DOWNLOAD-001; REQ-VID-INFO-001; REQ-VID-CONCAT-001/002/012/013; REQ-VID-CHAIN-001/004/005/006/009/012/014.")],
    [#text("API Gateway")], [#text("Alterado")], [#text("Routers e middleware próprios de vídeo. Validar JWT, propagar a identidade do executor e o identificador de correlação e encaminhar os pedidos. Na criação ou alteração dos passos de uma predefinição, pedir a validação estrutural a Projetos antes de encaminhar a escrita a Utilizadores. Traduzir o excesso de corpo HTTP para o contrato de erro de vídeo.")], [#text("REQ-VID-AUTH-001 a REQ-VID-AUTH-003; REQ-VID-COM-004/005/006; REQ-VID-NFR-001/002/015; REQ-VID-CHAIN-014.")],
    [#text("Projetos e MongoDB de Projetos")], [#text("Alterado")], [#text("Módulos de ingestão, acesso, transformação e composição; coleções videos, videotasks, video_project_locks e video_watermarks. Autorizar o projeto, validar e admitir tarefas, recuperar falhas e publicar resultados com proveniência e receita. Os locks têm persistência própria, sem alterar a representação de imagens no projeto.")], [#text("REQ-VID-STORAGE-001 a REQ-VID-STORAGE-005; REQ-VID-TASK-001 a REQ-VID-TASK-007; REQ-VID-CONCAT-001 a REQ-VID-CONCAT-013; REQ-VID-NFR-006/017.")],
    [#text("Registo de operações em Projetos")], [#text("Novo")], [#text("Contrato versionado {operation, version, parameters}, com validate, estimate, cost e copyable. O módulo de composição aplica estrutura, parâmetros e limites por esta ordem, estima as propriedades após cada passo e constrói o plano. Os metadados e os campos internos do plano são resolvidos pelo servidor, sem confiar nos valores enviados pelo cliente.")], [#text("REQ-VID-COM-004/005/006; REQ-VID-CHAIN-003/007/016/017; REQ-VID-QUOTA-008.")],
    [#text("Utilizadores e MongoDB de Utilizadores")], [#text("Alterado")], [#text("Reutilizar identidade, perfil e reserva/devolução de créditos do executor. Acrescentar modelo, coleção videopresets e rotas de predefinições de vídeo, separadas das de imagem. Listar, criar, alterar por PATCH e eliminar configurações privadas sem junção, com nome único por utilizador.")], [#text("REQ-VID-QUOTA-001 a REQ-VID-QUOTA-008; REQ-VID-CHAIN-014; REQ-VID-AUTH-001/002.")],
    [#text("RabbitMQ")], [#text("Alterado")], [#text("Filas video_operations_queue, video_project_queue e video_ws_queue e exchange video_control. Transportar pedidos, respostas, progresso e cancelamento com contratos próprios; pedidos duráveis, ACK manual, reentrega limitada e encaminhamento de mensagens que esgotam as entregas.")], [#text("REQ-VID-TASK-001/003/004/005; REQ-VID-NFR-002/005/006/010.")],
    [#text("Worker Tools/video/")], [#text("Novo")], [#text("Serviço Docker com FFmpeg/FFprobe. Executar ingestão, operações isoladas, cadeias e junções; reutilizar execução, transferências, cancelamento e inspeção do resultado. Caminhos genérico, convert_task.py e composition_task.py; subgrafos por clip, um grafo de composição, miniaturas e cópias de reprodução. phase.py qualifica falhas de download, encode e upload.")], [#text("REQ-VID-UPLOAD-008/013/014/016/017; REQ-VID-NFR-009/011/012/016/022; REQ-VID-CONCAT-008 a REQ-VID-CONCAT-011; REQ-VID-CHAIN-010/011/013.")],
    [#text("imageStorageService e SeaweedFS/S3")], [#text("Alterado")], [#text("Módulos de vídeo e estágios video_src, video_out, video_preview e video_thumb, além dos artefactos auxiliares. Emitir URLs assinados GET/PUT e gerir objetos distintos para originais, resultados, miniaturas e cópias MP4. O worker transfere os objetos por blocos; o descarregamento entrega o formato armazenado.")], [#text("REQ-VID-UPLOAD-007/014/016/017; REQ-VID-DOWNLOAD-002/006/007; REQ-VID-STORAGE-001/002; REQ-VID-NFR-014/015/021.")],
    [#text("WS Gateway")], [#text("Alterado")], [#text("Consumir os eventos de video_ws_queue e emitir video-task-update e eventos de ingestão para as salas correspondentes. Comunicar estado, progresso, passo estimado e, na falha, código e fase quando disponíveis. A consulta da tarefa pela API permite recuperar o estado após reconexão.")], [#text("REQ-VID-TASK-002/003/007; REQ-VID-CHAIN-012; REQ-VID-ERROR-001/002; REQ-VID-NFR-008.")],
    [#text("Nginx")], [#text("Alterado")], [#text("Encaminhar HTTPS para API Gateway e WS Gateway e os acessos assinados ao S3 por /s3-video/. Suportar Range, transferência por blocos, limite de upload de 2 GB e desativação de buffering no percurso de vídeo. O formato de log específico omite os parâmetros de assinatura do URL.")], [#text("REQ-VID-UPLOAD-005/007; REQ-VID-NFR-014/015/021; REQ-VID-DOWNLOAD-007/009.")],
  ),
)

== Decisões arquiteturais

#orientacao[
  Registo leve de decisões (ao estilo ADR). Uma decisão só merece registo se havia alternativas reais
  (e.g., processamento síncrono vs. assíncrono via fila; um serviço por ferramenta vs. serviço de vídeo único;
  onde guardar ficheiros de entrada/saída; como reportar progresso ao _frontend_).
]


#tab([Decisões arquiteturais do incremento de vídeo],
  tabela(
    colunas: (1.2cm, 2.6cm, 1fr, 3cm, 2.4cm),
    tamanho: 8.5pt,
    [#text("ID")], [#text("Decisão")], [#text("Contexto e alternativas consideradas")], [#text("Consequências")], [#text("Requisitos / DQ")],
    [#text("DA-01")], [#text("Evolução por acréscimo")], [#text("Acrescentar módulos e pontos de ligação aos serviços existentes, preservando os contratos e os fluxos de imagem. A alternativa seria reescrever os componentes da baseline.")], [#text("A D-87/ADR-020 permite extrair a configuração dos nove painéis de vídeo para reutilização nas composições, mantendo o comportamento da edição simples. É uma exceção delimitada à regra de acréscimo, não uma alteração autorizada do fluxo de imagem.")], [#text("REQ-VID-NFR-010; ADD 2.6; D-02/D-08/D-87; ADR-020.")],
    [#text("DA-02")], [#text("Coleções específicas")], [#text("Persistir vídeos, tarefas e locks em coleções próprias, em vez de acrescentar esses dados a project.imgs ou ao modelo de processamento de imagem.")], [#text("Separar metadados, proveniência e receitas; usar índice único por projeto no lock. O ID do vídeo resultante é igual ao taskId, permitindo repetir a criação sem duplicar o recurso.")], [#text("REQ-VID-STORAGE-001/002/004; REQ-VID-NFR-017; ADD T-00/T-03; ADR-005.")],
    [#text("DA-03")], [#text("Worker único e plano comum")], [#text("Um serviço de vídeo com módulos por operação, em vez de um contentor por ferramenta. Reutilizar o plano e introduzir um caminho próprio para múltiplas entradas e saídas.")], [#text("Compor subcadeias, junção e passos finais num filtergraph. Codificar a stream final no máximo uma vez; AVI pode gerar a cópia MP4 em paralelo. Cada objeto distinto é descarregado uma vez, mas há uma entrada por ocorrência. A memória cresce com os clips abertos, risco aceite na D-90.")], [#text("REQ-VID-COM-006; REQ-VID-NFR-012/016; REQ-VID-CONCAT-008/009; ADR-017; D-90.")],
    [#text("DA-04")], [#text("Execução assíncrona")], [#text("Responder após a admissão persistida em vez de manter o pedido HTTP aberto até ao fim do processamento. Separar validação, admissão e execução.")], [#text("Devolver taskId e queued após persistir e tentar publicar o pedido. Se a publicação falhar, published_at nulo permite republicação. O passo k de N é estimado a partir do progresso global, não o início físico de um filtro.")], [#text("REQ-VID-TASK-001/002/003/007; REQ-VID-NFR-004/005/008; D-40/D-41.")],
    [#text("DA-05")], [#text("Reserva como débito")], [#text("Reutilizar os mecanismos de créditos, em vez de acrescentar um segundo débito ou uma chamada de commit na conclusão.")], [#text("Reservar o custo N do executor antes da aceitação; junção simples custa 1. Sucesso mantém a reserva; falha/cancelamento desencadeiam devolução integral. Premium não reserva créditos. A revisão D-86 retira tetos de quantidade, mantendo a quota do Registado.")], [#text("REQ-VID-QUOTA-003 a 008; ADD T-04; D-86.")],
    [#text("DA-06")], [#text("Mensagens de vídeo isoladas")], [#text("Usar filas próprias e confirmação manual, evitando misturar contratos de vídeo com consumidores de imagem.")], [#text("O worker confirma o pedido depois de publicar a resposta; Projetos confirma a resposta depois de tratar o efeito. Até duas entregas totais, recomeço do zero e tratamento idempotente. A fase de falha não acrescenta estados à tarefa.")], [#text("REQ-VID-NFR-002/006/010; REQ-VID-ERROR-002; ADD T-03; ADR-019.")],
    [#text("DA-07")], [#text("Binários no storage")], [#text("Transferir objetos diretamente por S3, em vez de transportar as saídas pelo API Gateway ou carregar os vídeos integralmente em memória.")], [#text("Pedir URLs internos quando necessários; GET/PUT por blocos. Autorizar antes da emissão de URL de leitura, cuja assinatura portadora é válida por 15 min. Range é servido através de Nginx/S3, sem exigir um segundo JWT no GET assinado.")], [#text("REQ-VID-DOWNLOAD-002 a 007; REQ-VID-NFR-014/015/021; ADD T-08.")],
    [#text("DA-08")], [#text("Metadados reais e cópia de reprodução")], [#text("Distinguir as propriedades estimadas do plano dos metadados efetivamente medidos por FFprobe no resultado. Conservar o formato original ou o formato de saída escolhido.")], [#text("Persistir metadados reais e gerar cópia MP4 para MOV/AVI e perfis MP4 incompatíveis com o navegador. O leitor usa essa cópia; processamento e descarregamento usam o recurso armazenado. Os novos resultados apresentam a extensão real do contentor.")], [#text("REQ-VID-INFO-007; REQ-VID-UPLOAD-016/017; REQ-VID-STORAGE-002; D-69/D-75.")],
    [#text("DA-09")], [#text("Predefinições próprias de vídeo")], [#text("Guardar configurações privadas numa coleção distinta das predefinições de imagem. Delegar a validação estrutural em Projetos, evitando duplicar o catálogo de operações em Utilizadores.")], [#text("O gateway valida a estrutura antes de criar ou alterar os passos; a persistência trata dono, nome único e CRUD. Sem junção nem campos internos do plano. A aplicação a outro vídeo revalida os parâmetros e recursos; marcas de outro projeto são recusadas.")], [#text("REQ-VID-CHAIN-003/014; ADD 4.9; ADR-018; D-83/D-84.")],
    [#text("DA-10")], [#text("Cancelamento e publicação atómica")], [#text("Distinguir a transição lógica da tarefa da interrupção física e da limpeza. Publicar só o vídeo final, em vez de expor resultados intermédios.")], [#text("Persistir cancelled e difundir taskId em video_control; interromper FFmpeg e eliminar saídas tardias. Erros incluem fase quando conhecida. A compensação usa refund persistido; a atomicidade funcional não é uma transação única entre MongoDB, RabbitMQ, quota e S3.")], [#text("REQ-VID-TASK-004/005; REQ-VID-CHAIN-011/013; REQ-VID-NFR-006; ADR-019.")],
  ),
)

== Máquina de estados do processamento

A máquina representa `VideoTask` e é comum às operações isoladas, junções e cadeias. Não representa a ingestão do vídeo, que tem um ciclo próprio. Pedidos rejeitados antes da admissão por autenticação, permissão, estrutura, parâmetros, concorrência ou quota não criam uma tarefa nesta máquina.


#figure(
  image("../images/maquina_estados_video.png", width: 100%, height: 14.5cm, fit: "contain"),
  caption: [Máquina de estados das tarefas de vídeo: transições e efeitos de sucesso, falha e cancelamento],
)


O estado inicial é `queued`: o lugar exclusivo do projeto foi adquirido, o custo foi reservado quando aplicável e a tarefa e o plano foram persistidos. A transição de `queued` para si próprio representa a recuperação de uma publicação falhada: a tarefa continua aceite e a rotina de manutenção volta a tentar publicá-la. O campo `published_at` nulo permite identificar essa condição. A receção de `started` conduz a `processing`.

Durante `processing`, o worker comunica o progresso percentual global e o passo estimado k de N. Como os filtros se compõem num único grafo, esse índice deriva do progresso e não identifica o instante físico de início de cada operação. As designações `download`, `encode` e `upload` qualificam a fase técnica de uma falha e não são estados adicionais da máquina.

Um resultado válido conduz a `completed`, mantendo o débito reservado e publicando apenas o vídeo final, com proveniência e receita. Uma falha não recuperável ou o esgotamento das entregas conduz a `failed`, com registo do erro, limpeza, devolução dos créditos reservados e libertação do lugar. A fila de pedidos é de tipo quorum e usa confirmação manual, com até duas entregas totais. A queda do worker permite reinício do zero por reentrega, sem retoma a partir de checkpoints; esse reinício mantém o estado `processing`.

O cancelamento autorizado é possível em `queued` ou `processing` e exige a identidade de quem submeteu a tarefa e permissão de edição. Projetos persiste `cancelled` e publica a instrução em `video_control`; o worker interrompe FFmpeg e limpa os temporários. A transição lógica pode anteceder a conclusão da limpeza. Um resultado tardio é descartado e não reativa a tarefa. Os três estados finais não originam uma nova execução. A devolução de créditos é acompanhada por `refund` persistido para permitir recuperação; não constitui uma transação distribuída única entre os serviços.

== Fluxo de processamento de vídeo
#preencher[Explicação do fluxo: pedido, encaminhamento, processamento, armazenamento, notificação de progresso/resultado, falhas.]

O diagrama de sequência decompõe o processamento em três partes, conservando os participantes e a numeração das mensagens: admissão, execução e tratamento terminal. Nginx é o ponto de entrada externo; a linha de vida do API Gateway inclui esse encaminhamento HTTP. «Storage» agrega a emissão dos URLs internos e as transferências S3. Esta agregação não significa que os binários atravessem o API Gateway.


#figure(
  image("../images/sequencia_processamento.png", width: 100%, height: 14.5cm, fit: "contain"),
  caption: [Sequência de processamento — parte 1: admissão, reserva e aceitação persistida],
)

Na primeira parte, o frontend submete os passos e o gateway valida o JWT e transmite a identidade do executor e o identificador de correlação. Projetos obtém o perfil, autoriza o acesso ao projeto e aos vídeos e aplica a validação na ordem estrutura → parâmetros dos passos → limites do perfil. Cada passo usa as propriedades estimadas à saída do anterior. A junção, quando existe, é única e ocupa a primeira posição da lista principal; as operações anteriores pertencem às subcadeias dos clips. A conversão só é admitida no fim da lista principal, não dentro dos clips.

Projetos calcula o plano e o custo N, adquire o lugar exclusivo do projeto e reserva os créditos do Registado. N conta os passos principais e os das subcadeias; a junção conta um passo, pelo que uma junção simples custa um crédito. Premium não reserva créditos. A quota insuficiente impede a admissão e liberta o lugar; falhas posteriores à reserva exigem compensação. Após persistir a tarefa em `queued`, Projetos tenta publicar o plano e devolve HTTP `202` com `taskId`. Se RabbitMQ estiver indisponível, a tarefa continua persistida para republicação: `queued` não garante que a mensagem já esteja no broker nessa situação.


#figure(
  image("../images/sequencia_processamento_001.png", width: 100%, height: 14.5cm, fit: "contain"),
  caption: [Sequência de processamento — parte 2: execução do plano, progresso e envio do resultado],
)

Na segunda parte, RabbitMQ entrega o pedido ao worker, que comunica `started`; Projetos persiste `processing` e o estado chega ao frontend por RabbitMQ e WS Gateway. O worker pede URLs internos quando necessários e descarrega cada objeto distinto uma vez. Na junção, cada ocorrência de clip corresponde, contudo, a uma entrada FFmpeg, permitindo repetir o mesmo vídeo em posições ou subcadeias diferentes.

O plano compõe as subcadeias, a normalização dos clips, o filtro `concat` e as operações finais num único `filtergraph`. A resolução de apresentação e a taxa de fotogramas do primeiro clip, depois da sua subcadeia, determinam a normalização; são usadas dimensões pares e barras quando a proporção difere. Se algum clip tiver áudio, os silenciosos recebem silêncio; se todos forem silenciosos, a saída não tem faixa sonora. Durante a execução, o worker publica progresso em `video_ws_queue`, sem atualizar o MongoDB a cada percentagem, e o WS Gateway emite `video-task-update`.

As junções e as cadeias de vários passos terminadas em AVI usam `composition_task.py`; as restantes cadeias mantêm o caminho genérico, e a conversão isolada usa `convert_task.py`. A stream do vídeo final é codificada no máximo uma vez. AVI pode gerar a cópia MP4 em paralelo na mesma invocação, por `split`/`asplit`; a cópia de MOV pode ser obtida posteriormente por remux, sem nova codificação da stream final. FFprobe mede os metadados efetivos; são gerados a miniatura, o fotograma inicial e a cópia de reprodução quando necessária. Depois do envio das saídas ao storage, o worker publica `completed` com metadados e chaves e confirma o pedido.



#figure(
  image("../images/sequencia_processamento_002.png", width: 100%, height: 14.5cm, fit: "contain"),
  caption: [Sequência de processamento — parte 3: publicação do resultado, falha e cancelamento],
)


A terceira parte apresenta três alternativas. No sucesso, Projetos trata a resposta terminal, persiste `completed`, cria o vídeo com ID igual ao `taskId` e regista `recipe` e `source_video_ids`, conservando a ordem e as repetições das origens. A criação com identidade determinística evita duplicar o recurso numa reentrega. O lugar é libertado e o evento de conclusão identifica o vídeo final. A implementação persiste o estado antes de criar o documento do vídeo, pelo que pode existir um intervalo entre ambos; a notificação ocorre depois do tratamento do recurso. A ausência de resultados parciais representa atomicidade funcional, não uma transação única entre MongoDB, RabbitMQ, S3 e quota.

Na alternativa de falha, o worker comunica o código e a fase conhecida. Projetos regista `failed` e a compensação pendente, remove os destinos parciais, pede a devolução dos créditos reservados e comunica o erro pelo WS Gateway. No cancelamento, a identidade e o estado são validados antes de persistir `cancelled` e difundir a instrução em `video_control`; a interrupção física e a limpeza podem terminar depois da resposta lógica. Em ambos os casos, os originais permanecem inalterados e não se publica um vídeo parcial. No sucesso não há novo débito, pois a reserva já o efetuou. Os URLs assinados não são persistidos no plano nem enviados nas notificações de tarefa.

== Impacto na instalação e execução

O ficheiro `docker-compose.yaml` acrescenta `video_worker`, construído com contexto `Tools` e Dockerfile `video/Dockerfile`. A imagem inclui Python, FFmpeg e FFprobe; o anfitrião necessita de Docker Compose, sem instalar esses binários para executar a aplicação. O worker usa o volume `video_tmp` em `/tmp/video`, a rede `elk` e as variáveis `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` e `VIDEO_STORAGE_URL`. `VIDEO_TMP_ROOT` permite ajustar o diretório de trabalho. A composição reutiliza este serviço, sem acrescentar um contentor por operação.

SeaweedFS 4.47, MongoDB e RabbitMQ mantêm volumes persistentes. O limite configurado de 1024 MiB por volume SeaweedFS não equivale ao tamanho máximo de um objeto nem à capacidade total disponível. A capacidade depende também do disco e dos volumes atribuíveis. No worker, a junção mantém entradas simultaneamente abertas e a memória cresce com a quantidade e resolução dos clips.

Persistem duas diferenças relevantes para a configuração e manutenção. A validade JWT emitida continua em sete dias, perante o alvo de uma hora da ERS. A validação estrutural admite predefinições longas, mas `users/routes/videoPresets.js` conserva `STEPS_MAX = 10` na gravação; a política sem teto de execução de cadeias não demonstra ausência desse limite na persistência. Estes desvios e a respetiva evidência estão discriminados no Capítulo 10.
