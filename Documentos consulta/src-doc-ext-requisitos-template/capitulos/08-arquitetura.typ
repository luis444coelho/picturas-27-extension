#import "../template.typ": *

= Alterações Arquiteturais

#orientacao[
  Partam do documento de solução arquitetural de base e descrevam apenas o *delta* introduzido pelo suporte a
  vídeo. O nível de detalhe é o de um MVP: o suficiente para que outra equipa perceba, mantenha e estenda a
  solução na Fase 2. Cada alteração deve estar ligada aos requisitos que a motivam.
]

Este capítulo apresenta a arquitetura proposta para construir o suporte a vídeo no PictuRAS.  Os diagramas descrevem o comportamento pretendido e não uma solução já executada ou validada.



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

Os componentes azuis identificam o worker novo e a lógica de vídeo acrescentada aos serviços indicados; não propõem um serviço independente para cada ferramenta. A dependência de MongoDB agrega as instâncias existentes, mantendo bases próprias por serviço e acrescentando as coleções necessárias. O navegador obtém o vídeo por URL de leitura através de Nginx/S3, e o worker transfere os objetos diretamente com URLs internos.

#tab([Componentes novos e alterados],
  tabela(
    colunas: (3.2cm, 1.8cm, 1fr, 3cm),
    tamanho: 7.5pt,
    [#text("Componente / serviço")], [#text("Estado")], [#text("Responsabilidade / alteração")], [#text("Requisitos")],
    [#text("Frontend")], [#text("Alterado")], [#text("Componentes de vídeo novos. Carregamento, leitor, consulta, ferramentas, predefinições, linha temporal de junção e editor de cadeias; custo, progresso e cancelamento.")], [#text("REQ-VID-UPLOAD-001/002/015; REQ-VID-DOWNLOAD-001; REQ-VID-INFO-001; REQ-VID-CHAIN-001/009/012.")],
    [#text("API Gateway")], [#text("Alterado")], [#text("Router e middleware novos, montados por acréscimo. Validar JWT e identidade; encaminhar rotas de vídeo; propagar X-Caller-Id e X-Correlation-Id sem modificar as rotas de imagem.")], [#text("REQ-VID-AUTH-001 a REQ-VID-AUTH-003; REQ-VID-NFR-001/002/015.")],
    [#text("Projetos e MongoDB de Projetos")], [#text("Alterado")], [#text("Módulos e coleções novos. Criar as coleções videos, VideoTask e video_project_locks. Orquestrar tarefas, recuperar falhas, conservar originais e registar proveniência. Reutilizar permissões e projeto sem acrescentar o bloqueio ao documento do projeto.")], [#text("REQ-VID-STORAGE-001 a REQ-VID-STORAGE-005; REQ-VID-TASK-001 a REQ-VID-TASK-007; REQ-VID-NFR-006/017.")],
    [#text("Registo de operações em Projetos")], [#text("Novo")], [#text("Módulo novo. Contrato versionado {operation, version, parameters}; validate, estimate, cost e copyable. Construir o plano com base nos metadados persistidos, sem confiar em propriedades enviadas pelo cliente.")], [#text("REQ-VID-COM-004/005/006; REQ-VID-CHAIN-003; REQ-VID-QUOTA-008.")],
    [#text("Utilizadores e MongoDB de Utilizadores")], [#text("Alterado")], [#text("Quota existente reutilizada; predefinições em módulo e coleção novos. Consultar perfil; reservar/devolver créditos do executor. Guardar configurações de vídeo separadas dos presets de imagem, sem partilha e sem junção.")], [#text("REQ-VID-QUOTA-001 a REQ-VID-QUOTA-008; REQ-VID-CHAIN-014.")],
    [#text("RabbitMQ")], [#text("Alterado")], [#text("Filas, bindings e exchange novos. Criar as filas video_operations_queue, video_project_queue e video_ws_queue e o exchange video_control. Pedidos duráveis com confirmação manual e reentrega limitada.")], [#text("REQ-VID-TASK-001/003/004/005; REQ-VID-NFR-005/006/010.")],
    [#text("Worker Tools/video/")], [#text("Novo")], [#text("Serviço Docker novo; utilitários existentes reutilizados. Ingestão com FFprobe/FFmpeg; execução de operações e cadeias; geração de pré-visualização e miniaturas; temporários próprios e interrupção do processo.")], [#text("REQ-VID-UPLOAD-008/013/014/016/017; REQ-VID-NFR-009/011/012/016/022.")],
    [#text("imageStorageService e SeaweedFS/S3")], [#text("Alterado")], [#text("Módulo de vídeo e estágios novos; storage existente reutilizado. Gerar URLs GET/PUT, gerir objetos nos estágios video_src, video_out, video_preview e video_thumb. Servir os binários e manter originais e derivados distintos.")], [#text("REQ-VID-UPLOAD-007; REQ-VID-DOWNLOAD-002/006/007; REQ-VID-STORAGE-001/002.")],
    [#text("WS Gateway")], [#text("Alterado")], [#text("Módulo wsGateway/video.js novo. Consumir video_ws_queue e emitir video-task-update para as salas existentes, com estado, passo e progresso. Recuperação de estado pela API ao reabrir a página.")], [#text("REQ-VID-TASK-002/003/007; REQ-VID-CHAIN-012; REQ-VID-NFR-008.")],
    [#text("Nginx")], [#text("Alterado")], [#text("Locations e log_format novos. Encaminhar leitura assinada em /s3-video/ com Range e sem buffering. Configurar a rota de upload depois da decisão respetiva; não registar assinaturas nas query strings dos logs.")], [#text("REQ-VID-NFR-014/021; REQ-VID-DOWNLOAD-007/009.")],
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
    [#text("DA-01")], [#text("Evolução por acréscimo")], [#text("Estender os serviços por novos módulos em vez de reescrever os fluxos de imagem.")], [#text("Reutilizar autenticação, permissões, contas e infraestrutura. Pontos de montagem novos não devem alterar pedidos existentes.")], [#text("REQ-VID-NFR-010; ADD 2.6; D-02 e D-08.")],
    [#text("DA-02")], [#text("Coleções específicas")], [#text("Guardar vídeos e tarefas em coleções próprias em vez de project.imgs ou Process.")], [#text("Evitar reescrever o documento do projeto e interferir com o seu controlo de versão. Locks por project_id têm índice único e ficam fora desse documento.")], [#text("REQ-VID-STORAGE-001/002/004; REQ-VID-NFR-017; ADD T-00, T-03.")],
    [#text("DA-03")], [#text("Worker único e plano comum")], [#text("Um módulo por operação no worker, em vez de um contentor por ferramenta. Operação isolada é uma cadeia de um passo.")], [#text("Compor a cadeia num filtergraph e recodificar vídeo no máximo uma vez; aplicar cópia de stream quando o plano e o codec de saída o permitem.")], [#text("REQ-VID-COM-006; REQ-VID-NFR-012/016; ADD T-01, T-02, T-05.")],
    [#text("DA-04")], [#text("Execução assíncrona")], [#text("Responder à admissão em vez de manter o pedido HTTP aberto até ao resultado.")], [#text("Devolver taskId e queued; continuar a navegar; comunicar progresso por WebSocket. GET da tarefa recupera estado após reconexão.")], [#text("REQ-VID-TASK-001/002/003/007; REQ-VID-NFR-004/005/008; ADD T-03.")],
    [#text("DA-05")], [#text("Reserva como débito")], [#text("Reutilizar os endpoints de crédito em vez de criar reserva, commit e rollback independentes.")], [#text("Reservar o custo total do executor; no sucesso não há chamada de confirmação nem novo débito. Falha/cancelamento devolvem a reserva. Premium não reserva quota.")], [#text("REQ-VID-QUOTA-003/004/005/006/007/008; ADD T-04, Q-ADD-03.")],
    [#text("DA-06")], [#text("Mensagens de vídeo isoladas")], [#text("Filas próprias e ACK manual em vez das filas e consumidores de imagem.")], [#text("O worker confirma o pedido após publicar a resposta; Projetos confirma a resposta após persistir o efeito. Reentrega e respostas duplicadas exigem tratamento idempotente.")], [#text("REQ-VID-NFR-006/010; ADD T-03; D-08 e D-09.")],
    [#text("DA-07")], [#text("Binários no storage")], [#text("Transferência direta por S3 em vez de transportar vídeos de saída pelo API Gateway ou carregá-los integralmente em memória.")], [#text("URLs internos pedidos quando necessários; GET/PUT por blocos. No descarregamento, autorização antes da emissão e URL portador de 15 min, com Range via Nginx.")], [#text("REQ-VID-DOWNLOAD-002/006/007; REQ-VID-NFR-014/021; ADD T-08, 4.1.")],
    [#text("DA-08")], [#text("Metadados reais e cópia de reprodução")], [#text("Separar estimate da validação dos metadados medidos no resultado; preservar os originais.")], [#text("FFprobe fornece os metadados persistidos. MOV/AVI e MP4 não reproduzíveis usam cópia MP4 no leitor; operações e descarregamento usam o ficheiro original/resultante.")], [#text("REQ-VID-INFO-007; REQ-VID-UPLOAD-016/017; REQ-VID-STORAGE-002; ADD T-00, T-06.")],
    [#text("DA-09")], [#text("Predefinições próprias de vídeo")], [#text("Guardar cadeias reutilizáveis numa coleção própria em vez de as misturar com presets de imagem.")], [#text("Configurações pertencem ao utilizador; sem partilha e sem junção. Os painéis de imagem mantêm o seu contrato.")], [#text("REQ-VID-CHAIN-014; ADD 4.9; D-06.")],
    [#text("DA-10")], [#text("Cancelamento e publicação atómica")], [#text("Separar a transição lógica da tarefa da interrupção física do worker.")], [#text("Marcar cancelled, difundir taskId e terminar FFmpeg; eliminar saídas tardias. Uma cadeia só publica o vídeo final; falha devolve os créditos e limpa os temporários.")], [#text("REQ-VID-TASK-004/005; REQ-VID-CHAIN-011/013; REQ-VID-NFR-006; ADD T-03.")],
  ),
)

== Máquina de estados do processamento

A máquina representa `VideoTask` e aplica-se a transformações, junções e cadeias. Os pedidos rejeitados por autenticação, permissão, parâmetros, limite de concorrência ou saldo ficam fora da máquina: não chegam a ser admitidos como tarefas.


#figure(
  image("../images/maquina_estados_video.png", width: 100%, height: 14.5cm, fit: "contain"),
  caption: [Máquina de estados proposta para as tarefas de processamento de vídeo],
)


A admissão adquire o lugar do projeto, reserva os créditos quando aplicável, persiste a tarefa e publica o pedido. O estado passa a `processing` quando o worker comunica o início. O sucesso exige um resultado válido e a publicação do novo recurso, com proveniência. Progresso percentual e passo corrente são informação da execução, sem criar estados adicionais.

O desenho da arquitetura prevê confirmação manual, uma fila de pedidos de tipo quorum e um máximo de duas entregas. Se o worker cair, a tarefa pode recomeçar do zero; não se propõe retoma a partir de checkpoints. Ao esgotar as entregas, a mensagem é encaminhada para tratamento de falha, com devolução de créditos, limpeza e libertação do lugar. O estado da tarefa permanece a fonte de verdade para ignorar mensagens tardias ou repetidas.

O cancelamento exige permissão de edição e a identidade de quem submeteu a tarefa. O orquestrador marca `cancelled` e publica em `video_control`; o worker interrompe FFmpeg e limpa os temporários. A transição lógica pode anteceder a conclusão dessa limpeza. Se um `completed` chegar depois, o recurso não é publicado e o objeto enviado é eliminado.


== Fluxo de processamento de vídeo
#preencher[Explicação do fluxo: pedido, encaminhamento, processamento, armazenamento, notificação de progresso/resultado, falhas.]

O diagrama de sequência apresenta o caminho de sucesso de uma operação ou cadeia em três partes, mantendo os participantes e a numeração das mensagens: admissão, execução e publicação do resultado. Nginx é o ponto de entrada externo; a lifeline do API Gateway representa esse encaminhamento HTTP. A lifeline de armazenamento agrega o módulo de vídeo que emite os URLs e o S3 que transfere os binários. Não representa encaminhamento do ficheiro pelo gateway.


#figure(
  image("../images/sequencia_processamento.png", width: 100%, height: 14.5cm, fit: "contain"),
  caption: [Sequência de processamento — parte 1: admissão, reserva e resposta assíncrona],
)



#figure(
  image("../images/sequencia_processamento_001.png", width: 100%, height: 14.5cm, fit: "contain"),
  caption: [Sequência de processamento — parte 2: execução e progresso do worker],
)



#figure(
  image("../images/sequencia_processamento_002.png", width: 100%, height: 14.5cm, fit: "contain"),
  caption: [Sequência de processamento — parte 3: persistência e publicação do resultado],
)


O gateway valida a identidade e transmite o executor e o identificador de correlação. Projetos verifica a permissão, o perfil e os vídeos de entrada, lê os seus metadados e valida cada passo antes de calcular o plano e o custo. Uma cadeia inclui as sub-cadeias dos clips e, quando aplicável, a junção. Um lock exclusivo impede uma segunda tarefa de vídeo no mesmo projeto. A resposta de quota insuficiente liberta o lugar e rejeita a admissão; falhas posteriores à reserva exigem compensação. A operação só responde com `202` após criar a tarefa e publicar o pedido.

O worker descarrega as entradas por blocos, executa o plano num diretório da tarefa e publica progresso em `video_ws_queue`, sem escrever no MongoDB a cada atualização. A réplica do WS Gateway emite os eventos para as salas existentes. O resultado é inspecionado por FFprobe; os ficheiros de saída, a miniatura e a cópia de reprodução, quando necessária, são enviados para o storage. Projetos recebe a resposta, verifica se a tarefa ainda está ativa, cria o novo vídeo e persiste o estado terminal antes de confirmar a mensagem. No sucesso, o débito já reservado é mantido.

Os casos de erro e cancelamento seguem a máquina de estados: preservar os originais, não publicar resultados parciais, devolver os créditos de trabalho não entregue, limpar temporários e libertar o lugar. Os eventos transportam identificadores, estado e progresso, sem nomes de ficheiros nem URLs.

== Impacto na instalação e execução

#preencher[Novos serviços/contentores, dependências externas (e.g., binários de processamento de vídeo), volumes, variáveis de configuração. Instruções completas de execução no Anexo A.]

