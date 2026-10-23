#import "../template.typ": *

= Testes e Validação do MVP

#orientacao[
  Os critérios de aceitação da ERS (_Dado… Quando… Então…_) são a base dos testes. Cada requisito implementado
  deve ter pelo menos um teste (automático ou manual) com resultado registado. Para os requisitos não
  funcionais, registem o valor medido face ao *Alvo*, sempre que aplicável.
]

== Estratégia e ambiente de testes

#preencher[Tipos de teste (unitários, integração, ponta-a-ponta, manuais), ferramentas, ambiente (docker compose), ficheiros de vídeo de teste usados (formatos, durações, tamanhos).]

A validação do produto mínimo viável (MVP) é orientada pelos critérios de aceitação da Especificação de Requisitos do Sistema (ERS), formulados segundo a estrutura «Dado… Quando… Então…», e pelos fluxos principais, alternativos e de exceção dos casos de uso. Foram considerados os 180 requisitos funcionais e os 22 requisitos não funcionais do capítulo da ERS deste relatório. A numeração utilizada nas tabelas seguintes é a do relatório, incluindo os casos de uso UC-VID-000 a UC-VID-013; não foram reintroduzidos os casos de extração de fotogramas e de processamento em lote, retirados do âmbito.

A estratégia combina testes unitários, testes de integração, testes ponta-a-ponta e verificações manuais. Os testes unitários incidem na validação de parâmetros, no planeamento das operações, nos cálculos de duração e geometria, na gestão de estados e quotas e na formatação de metadados. Os testes de integração verificam a articulação entre os serviços de projetos, utilizadores, armazenamento e processamento, incluindo persistência, mensagens assíncronas, cancelamento e recuperação de falhas. Os testes ponta-a-ponta exercitam os percursos de utilização através da API ou de um navegador. A avaliação manual complementa os testes automáticos nos controlos do leitor, na configuração das ferramentas, na perceção do resultado visual e na avaliação auditiva do sincronismo.

O conjunto automático utiliza `node:test` e asserções em JavaScript para o serviço de projetos, testes de funções TypeScript no frontend e `unittest` no worker Python. Os testes de processamento recorrem a FFmpeg e FFprobe reais; verificam os contentores, codecs, dimensões, taxa de fotogramas, duração, presença de áudio e conteúdo dos resultados. Quando se prevê cópia direta, são também comparados hashes dos pacotes ou dos fotogramas. A análise técnica é complementada pela descodificação integral com FFmpeg e, na matriz de conversão, pela reprodução com VLC. Os testes de navegador utilizam Playwright com Chromium ou o protocolo Chrome DevTools. A compilação de produção, a verificação de tipos TypeScript e a análise estática com ESLint constituem verificações complementares, sem substituir os testes de aceitação.

O ambiente de integração consiste na execução local da aplicação através de Docker Compose. Inclui o proxy Nginx com HTTPS, o frontend Next.js/React, o API Gateway, os serviços de projetos e utilizadores, MongoDB, RabbitMQ, o serviço de armazenamento de imagens e vídeo, SeaweedFS 4.47 e o worker de vídeo. Os registos de execução identificam Python 3.11 e FFmpeg/FFprobe 5.1.9 num contentor Linux baseado em Debian 12. O ponto de entrada utilizado foi `https://localhost:8080`. Os resultados disponíveis foram obtidos em mais de uma máquina, incluindo macOS com arquitetura aarch64; por esse motivo, as medições são caracterizadas como locais e não como resultados de um único ambiente de referência.

Nos ensaios de integração, a operação auxiliar `test_reencode` foi ativada apenas nas suites da fundação que dela necessitam. Os testes com queda do worker requerem um ambiente isolado, uma vez que reiniciam o respetivo serviço. Os dados de teste devem ser identificados por execução e eliminados através dos seus próprios identificadores, preservando os recursos exteriores ao ensaio.


== Testes realizados

As tabelas apresentam os casos de aceitação já verificados e os casos previstos para completar a cobertura. Os identificadores TST foram atribuídos para a organização do relatório; a coluna «Requisito(s)» mantém os IDs da ERS deste documento. Cada requisito surge associado a pelo menos um caso de teste especificado. Essa rastreabilidade, por si só, não significa que todos os testes estejam implementados ou que todos os requisitos estejam satisfeitos.

As descrições dos ensaios realizados identificam as propriedades e os dados documentados nos respetivos registos. Os valores numéricos apresentados como exemplos na ERS não são todos assumidos como ficheiros efetivamente utilizados: quando o teste verifica a mesma propriedade com outro vídeo de referência, a descrição explicita o cenário aplicável, sem inventar uma execução do exemplo original. As tolerâncias temporais e as exceções aprovadas para dimensões ímpares e duração visual são preservadas na interpretação dos resultados.

O tipo «Automático» abrange testes unitários, integração ou ponta-a-ponta conforme o cenário; «Manual» corresponde às verificações de utilização registadas pela equipa; «Misto» combina evidência automática e manual ou prevê ambas. Nos critérios parcialmente verificados, a descrição identifica a condição que falta validar. Os resultados dos testes de junção e encadeamento são mantidos em branco, dado que o B008 ainda não está implementado. Os ensaios existentes da fundação de tarefas não são apresentados como aprovação da funcionalidade completa de composição.

=== Regras comuns, acesso, quota, armazenamento, tarefas e erros

#tab([Testes e resultados — Regras comuns, acesso, quota, armazenamento, tarefas e erros],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-COM-001")], [#text("Automático")], [#text("Dado um utilizador autenticado, Quando submete um pedido de operação para um ID de vídeo inexistente ou pertencente a outro projeto, Então o pedido é rejeitado com código HTTP 404 ou 403 sem criar tarefa.")], [#text("REQ-VID-COM-001")], [#text("Passa")],
    [#text("TST-COM-002")], [#text("Automático")], [#text("Dado um processamento assíncrono em curso, Quando o utilizador consulta a galeria do projeto, Então nenhum artefacto temporário ou parcial é visível até à receção do estado completed.")], [#text("REQ-VID-COM-002")], [#text("Passa")],
    [#text("TST-COM-003")], [#text("Automático")], [#text("Dado o término com sucesso de uma operação de vídeo, Quando o processamento atinge completed, Então o novo recurso surge listado no projeto com metadados preenchidos e vínculo ao vídeo de origem.")], [#text("REQ-VID-COM-003")], [#text("Passa")],
    [#text("TST-COM-004")], [#text("Automático")], [#text("Dado um conjunto de parâmetros introduzidos na interface, Quando o utilizador confirma a operação, Então a API valida tipos e limites antes de publicar mensagem no broker RabbitMQ.")], [#text("REQ-VID-COM-004")], [#text("Passa")],
    [#text("TST-COM-005")], [#text("Automático")], [#text("Dado um formulário com parâmetro fora dos limites suportados, Quando o utilizador submete a operação, Então a API responde com código HTTP 422 indicando o atributo causador da violação.")], [#text("REQ-VID-COM-005")], [#text("Passa")],
    [#text("TST-COM-006")], [#text("Automático")], [#text("Dado um filtro descrito por {operation, version: 1, parameters}, Quando validado isoladamente ou numa cadeia, Então são aplicadas as mesmas regras; a receita persistida conserva a versão dos parâmetros.")], [#text("REQ-VID-COM-006")], [#text("Passa")],
    [#text("TST-AUTH-001")], [#text("Automático")], [#text("Dado um pedido HTTP sem cabeçalho Authorization ou com token expirado, Quando submetido a qualquer rota de vídeo, Então o sistema devolve imediatamente o código HTTP 401 Unauthorized. A rejeição de pedidos sem token ou com token inválido está registada; falta o caso explícito de token corretamente assinado mas expirado.")], [#text("REQ-VID-AUTH-001")], [#text("Parcial")],
    [#text("TST-AUTH-002")], [#text("Automático")], [#text("Dado um visitante anónimo na plataforma, Quando tenta aceder às funcionalidades de vídeo, Então o sistema redireciona-o para a interface de autenticação/registo sem processar o pedido.")], [#text("REQ-VID-AUTH-002")], [#text("Passa")],
    [#text("TST-AUTH-003")], [#text("Automático")], [#text("Dado um utilizador autenticado com permissão apenas de leitura, Quando consulta informações ou descarrega um vídeo concluído, Então o pedido é autorizado; quando tenta carregar ou transformar um vídeo, Então a API responde HTTP 403 Forbidden.")], [#text("REQ-VID-AUTH-003")], [#text("Passa")],
    [#text("TST-QUOTA-001")], [#text("Automático")], [#text("Dado um utilizador registado com 0 créditos na quota diária, Quando tenta submeter uma operação de vídeo, Então a ação é bloqueada com notificação de quota esgotada.")], [#text("REQ-VID-QUOTA-001")], [#text("Passa")],
    [#text("TST-QUOTA-002")], [#text("Automático")], [#text("Dado um Registado com 5 créditos, Quando uma operação isolada é aceite, Então o saldo passa a 4; quando é aceite uma cadeia de 3 passos, Então passa de 5 a 2.")], [#text("REQ-VID-QUOTA-002")], [#text("Passa")],
    [#text("TST-QUOTA-003")], [#text("Automático")], [#text("Dado um custo já reservado, Quando a tarefa conclui com sucesso, Então o saldo não sofre nova alteração e não existe chamada de commit ou confirmação.")], [#text("REQ-VID-QUOTA-003")], [#text("Passa")],
    [#text("TST-QUOTA-004")], [#text("Automático")], [#text("Dada uma cadeia de 3 passos com 3 créditos reservados, Quando termina em failed ou cancelled, Então são devolvidos os 3 créditos, sem publicação de resultado; dado um pedido rejeitado antes da reserva, Então o saldo permanece igual.")], [#text("REQ-VID-QUOTA-004")], [#text("Passa")],
    [#text("TST-QUOTA-005")], [#text("Automático")], [#text("Dado um utilizador autenticado com perfil Premium, Quando submete uma operação de vídeo, Então a tarefa é admitida sem verificação de quota e sem debitar contadores.")], [#text("REQ-VID-QUOTA-005")], [#text("Passa")],
    [#text("TST-QUOTA-006")], [#text("Automático")], [#text("Dado um projeto partilhado pelo utilizador A com o utilizador B, Quando o utilizador B submete uma operação de vídeo, Então a quota debitada é exclusivamente a do utilizador B.")], [#text("REQ-VID-QUOTA-006")], [#text("Passa")],
    [#text("TST-QUOTA-007")], [#text("Automático")], [#text("Dado um utilizador registado com 3 créditos, Quando submete uma cadeia de 4 passos, Então o pedido é rejeitado com QUOTA_EXCEEDED e nenhum crédito é reservado; com 5 créditos, o saldo transitório passa a 1.")], [#text("REQ-VID-QUOTA-007")], [#text("Passa")],
    [#text("TST-QUOTA-008")], [#text("Automático")], [#text("Dada uma cadeia de 3 passos concluída, Quando a tarefa termina, Então são consumidos 3 créditos; dado um descarregamento ou uma consulta de informações, Então são consumidos 0 créditos.")], [#text("REQ-VID-QUOTA-008")], [#text("Passa")],
    [#text("TST-STORAGE-001")], [#text("Automático")], [#text("Dado um vídeo ingerido com sucesso, Quando se consulta a base de dados, Então existe um documento de vídeo com identificador, nome, MIME, duração, resolução, streams e data. A duração é persistida em milissegundos segundo o contrato técnico adotado.")], [#text("REQ-VID-STORAGE-001")], [#text("Passa")],
    [#text("TST-STORAGE-002")], [#text("Automático")], [#text("Dado um vídeo produzido por alteração de velocidade, Quando inspecionados os seus metadados, Então o campo sourceVideoId coincide com o identificador do vídeo de origem; dado um vídeo resultante da junção de V1 e V2, Então o campo sourceVideoIds contém [V1, V2] por essa ordem. A proveniência de uma operação isolada está testada; a junção depende do B008.")], [#text("REQ-VID-STORAGE-002")], [#text("Parcial")],
    [#text("TST-STORAGE-003")], [#text("Automático")], [#text("Dado um utilizador sem permissão de leitura sobre o projeto, Quando tenta aceder a um vídeo desse projeto, Então o acesso é rejeitado segundo a política existente.")], [#text("REQ-VID-STORAGE-003")], [#text("Passa")],
    [#text("TST-STORAGE-005")], [#text("Automático")], [#text("Dado um utilizador que elimina um projeto, Quando a eliminação é confirmada, Então os vídeos, miniaturas e artefactos associados são purgados do storage e da base de dados.")], [#text("REQ-VID-STORAGE-005")], [#text("Passa")],
    [#text("TST-STORAGE-004")], [#text("Automático")], [#text("Dado o vídeo final de uma composição (V1 + filtro) + (V2 + remover áudio) → junção → marca de água, Quando inspecionados os metadados, Então constam as sub-cadeias com os seus parâmetros, a junção com a ordem (V1, V2) e a marca de água.")], [#text("REQ-VID-STORAGE-004")], [],
    [#text("TST-TASK-001")], [#text("Automático")], [#text("Dado um pedido válido e admitido, Quando a API responde, Então devolve HTTP 202 com taskId e status queued; a execução e o resultado final são acompanhados separadamente.")], [#text("REQ-VID-TASK-001")], [#text("Passa")],
    [#text("TST-TASK-002")], [#text("Automático")], [#text("Dada uma tarefa queued ou processing, Quando ocorre cancelamento autorizado, Então passa a cancelled; dado completed, failed ou cancelled, Quando chega uma mensagem tardia, Então o estado final não é reativado. Uma reentrega pode reiniciar a execução mantendo processing.")], [#text("REQ-VID-TASK-002")], [#text("Passa")],
    [#text("TST-TASK-003")], [#text("Automático")], [#text("Dado um cliente com WebSocket conectado ao projeto, Quando a tarefa transita de queued para processing, Então é entregue de imediato uma mensagem JSON com o novo estado.")], [#text("REQ-VID-TASK-003")], [#text("Passa")],
    [#text("TST-TASK-004")], [#text("Automático")], [#text("Dado um processamento de vídeo em execução, Quando o utilizador clica em Cancelar, Então o cliente despacha pedido de cancelamento e o sistema regista a ordem de interrupção.")], [#text("REQ-VID-TASK-004")], [#text("Passa")],
    [#text("TST-TASK-005")], [#text("Automático")], [#text("Dado um cancelamento validado pelo sistema, Quando o worker recebe a instrução, Então suspende a instância FFmpeg e purga os fragmentos gerados no diretório de trabalho.")], [#text("REQ-VID-TASK-005")], [#text("Passa")],
    [#text("TST-TASK-006")], [#text("Automático")], [#text("Dada uma cadeia de operações em execução, Quando consultado o estado da tarefa, Então é devolvido um único estado agregado da máquina canónica.")], [#text("REQ-VID-TASK-006")], [#text("Passa")],
    [#text("TST-TASK-007")], [#text("Automático")], [#text("Dada uma cadeia de 4 passos em execução no terceiro passo, Quando consultado o detalhe da tarefa, Então indica step: 3 e totalSteps: 4.")], [#text("REQ-VID-TASK-007")], [#text("Passa")],
    [#text("TST-ERROR-001")], [#text("Automático")], [#text("Dado o envio de um ficheiro com formato incompatível, Quando a resposta é devolvida ao utilizador, Então contém código semântico estável e mensagem explicativa clara.")], [#text("REQ-VID-ERROR-001")], [#text("Passa")],
    [#text("TST-ERROR-002")], [#text("Automático")], [#text("Dado um erro interno no worker FFmpeg, Quando analisados os logs centrais, Então o erro surge catalogado com o respetivo correlationId enquanto o utilizador recebe mensagem amigável.")], [#text("REQ-VID-ERROR-002")], [#text("Passa")],
    [#text("TST-ERROR-003")], [#text("Automático")], [#text("Dado um encerramento inesperado do processo de encoding, Quando a rotina de recuperação atua, Então qualquer ficheiro temporário gerado é eliminado do volume de storage.")], [#text("REQ-VID-ERROR-003")], [#text("Passa")],
  ),
)

=== Carregamento e visualização de vídeo — UC-VID-000

#tab([Testes e resultados — Carregamento e visualização de vídeo — UC-VID-000],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-UPLOAD-001")], [#text("Automático")], [#text("Dado um utilizador no ecrã do projeto, Quando clica em \"Carregar Vídeo\" e seleciona um ficheiro local, Então o ficheiro é colocado na fila de carregamento da interface.")], [#text("REQ-VID-UPLOAD-001")], [#text("Passa")],
    [#text("TST-UPLOAD-002")], [#text("Automático")], [#text("Dado um ficheiro de vídeo arrastado sobre a janela do navegador, Quando largado na área do projeto, Então o sistema deteta o evento e inicia a validação preliminar.")], [#text("REQ-VID-UPLOAD-002")], [],
    [#text("TST-UPLOAD-003")], [#text("Automático")], [#text("Dada a seleção de um ficheiro com extensão.mkv ou.webm, Quando analisado no cliente, Então o sistema bloqueia o início do upload; ficheiros.mp4,.mov e.avi são aceites. Existe rejeição de MKV no navegador; a matriz completa de extensão e MIME no cliente carece de registo individualizado.")], [#text("REQ-VID-UPLOAD-003")], [#text("Parcial")],
    [#text("TST-UPLOAD-020")], [#text("Automático")], [#text("Dado um ficheiro com tipo MIME não suportado, Quando analisado no cliente, Então o início do upload é bloqueado; os tipos video/mp4, video/quicktime e video/x-msvideo são aceites. As validações do servidor têm testes; falta completar o ensaio específico dos tipos MIME no navegador.")], [#text("REQ-VID-UPLOAD-020")], [#text("Parcial")],
    [#text("TST-UPLOAD-004")], [#text("Automático")], [#text("Dado um utilizador registado com ficheiro de 250 MB, Quando tenta carregar o vídeo, Então a transferência é imediatamente impedida informando o limite de 200 MB.")], [#text("REQ-VID-UPLOAD-004")], [#text("Passa")],
    [#text("TST-UPLOAD-005")], [#text("Automático")], [#text("Dado um carregamento válido, Quando o ficheiro é enviado, Então os dados são transferidos em streaming contínuo.")], [#text("REQ-VID-UPLOAD-005")], [#text("Passa")],
    [#text("TST-UPLOAD-018")], [#text("Automático")], [#text("Dado um carregamento em curso, Quando os dados são transmitidos, Então a interface atualiza monotonicamente o progresso percentual até 100%. Há observação de percentagem e callbacks de teste; falta registar a sequência real até 100%.")], [#text("REQ-VID-UPLOAD-018")], [#text("Parcial")],
    [#text("TST-UPLOAD-006")], [#text("Automático")], [#text("Dado um upload ativo aos 50%, Quando o utilizador clica em Cancelar, Então a ligação HTTP é cortada e os blocos temporários no storage são eliminados de imediato.")], [#text("REQ-VID-UPLOAD-006")], [#text("Passa")],
    [#text("TST-UPLOAD-007")], [#text("Automático")], [#text("Dado o término da transferência de rede, Quando o ficheiro é consolidado no storage, Então fica acessível sob um identificador de objeto único não colidente.")], [#text("REQ-VID-UPLOAD-007")], [#text("Passa")],
    [#text("TST-UPLOAD-008")], [#text("Automático")], [#text("Dado um MP4, MOV ou AVI recebido, Quando inspecionado com FFprobe, Então os codecs das streams são confrontados com a matriz correspondente ao contentor.")], [#text("REQ-VID-UPLOAD-008")], [#text("Passa")],
    [#text("TST-UPLOAD-009")], [#text("Automático")], [#text("Dado um MP4 ou MOV com stream de vídeo HEVC/H.265 ou VP9, ou um AVI com stream MJPEG, Quando analisado na ingestão, Então o sistema rejeita o vídeo com código INVALID_CODEC.")], [#text("REQ-VID-UPLOAD-009")], [#text("Passa")],
    [#text("TST-UPLOAD-010")], [#text("Automático")], [#text("Dado um MP4 sem faixa de áudio, um MOV com áudio AAC ou um AVI com áudio MP3, Quando inspecionado, Então o sistema valida a conformidade dos fluxos sonoros com sucesso.")], [#text("REQ-VID-UPLOAD-010")], [#text("Passa")],
    [#text("TST-UPLOAD-011")], [#text("Automático")], [#text("Dado um utilizador registado com vídeo de 05:15, Quando a duração é extraída, Então o vídeo é descartado com aviso de duração máxima excedida (máx. 5 minutos).")], [#text("REQ-VID-UPLOAD-011")], [#text("Passa")],
    [#text("TST-UPLOAD-012")], [#text("Automático")], [#text("Dado um ficheiro com assinatura MP4 mas corpo de dados truncado, Quando a inspeção falha, Então o ficheiro é removido do storage e é emitida notificação de ficheiro corrompido.")], [#text("REQ-VID-UPLOAD-012")], [#text("Passa")],
    [#text("TST-UPLOAD-013")], [#text("Automático")], [#text("Dado um vídeo válido de 1920×1080 a 30 fps com 60 s, Quando concluída a análise, Então são extraídos estes metadados técnicos.")], [#text("REQ-VID-UPLOAD-013")], [#text("Passa")],
    [#text("TST-UPLOAD-019")], [#text("Automático")], [#text("Dado um vídeo analisado, Quando os metadados são persistidos, Então o documento MongoDB contém duração, resolução espacial, frame rate, bitrate e codecs.")], [#text("REQ-VID-UPLOAD-019")], [#text("Passa")],
    [#text("TST-UPLOAD-014")], [#text("Automático")], [#text("Dado um vídeo de pelo menos 1 s, Quando gerada a miniatura, Então esta corresponde ao instante 1 s; dado um vídeo de 0,5 s, Então corresponde ao fotograma inicial e a ingestão não falha por falta do instante 1 s.")], [#text("REQ-VID-UPLOAD-014")], [#text("Passa")],
    [#text("TST-UPLOAD-015")], [#text("Misto")], [#text("Dado o clique num vídeo da galeria, Quando o leitor abre, Então o utilizador consegue controlar a reprodução, pausar e navegar pela linha temporal com fluidez. A abertura e o carregamento do leitor estão registados; não foi localizada a verificação completa de todos os controlos.")], [#text("REQ-VID-UPLOAD-015")], [#text("Parcial")],
    [#text("TST-UPLOAD-016")], [#text("Automático")], [#text("Dado o carregamento de um AVI válido, Quando a ingestão conclui, Então existe no storage uma cópia MP4 de pré-visualização associada ao recurso.")], [#text("REQ-VID-UPLOAD-016")], [#text("Passa")],
    [#text("TST-UPLOAD-017")], [#text("Automático")], [#text("Dado um MOV com cópia de pré-visualização, Quando o utilizador o reproduz, descarrega e recorta, Então o leitor usa a cópia MP4, enquanto o descarregamento e o recorte usam o MOV original.")], [#text("REQ-VID-UPLOAD-017")], [#text("Passa")],
  ),
)

=== Recorte temporal — UC-VID-001

#tab([Testes e resultados — Recorte temporal — UC-VID-001],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-TRIM-001")], [#text("Manual")], [#text("Dado o painel de recorte e um vídeo com duração suficiente, Quando se introduz 00:00:01.137 como início, Então o campo conserva o instante ao milissegundo.")], [#text("REQ-VID-TRIM-001")], [#text("Passa")],
    [#text("TST-TRIM-002")], [#text("Manual")], [#text("Dado o painel de recorte, Quando se introduz 00:00:03.137 como fim de um intervalo válido, Então o campo conserva o instante ao milissegundo.")], [#text("REQ-VID-TRIM-002")], [#text("Passa")],
    [#text("TST-TRIM-003")], [#text("Manual")], [#text("Dado o leitor pausado num instante conhecido, Quando se utiliza Definir início ou Definir fim, Então o campo respetivo recebe a posição temporal atual.")], [#text("REQ-VID-TRIM-003")], [#text("Passa")],
    [#text("TST-TRIM-004")], [#text("Manual")], [#text("Dado o intervalo entre 00:00:01.137 e 00:00:03.137, Quando os limites são definidos, Então a duração prevista apresentada é de 2 s.")], [#text("REQ-VID-TRIM-004")], [#text("Passa")],
    [#text("TST-TRIM-005")], [#text("Manual")], [#text("Dado o início em 00:30 e o fim em 00:20, Quando o utilizador tenta confirmar, Então o botão de confirmação é bloqueado indicando intervalo invertido.")], [#text("REQ-VID-TRIM-005")], [#text("Passa")],
    [#text("TST-TRIM-006")], [#text("Manual")], [#text("Dado um vídeo com duração de 60 segundos, Quando o utilizador indica o instante final de 65 segundos, Então o sistema bloqueia a submissão com aviso de limite excedido.")], [#text("REQ-VID-TRIM-006")], [#text("Passa")],
    [#text("TST-TRIM-007")], [#text("Manual")], [#text("Dado um intervalo selecionado, Quando o utilizador clica em \"Pré-visualizar Corte\", Então o leitor integrado reproduz apenas esse trecho sem disparar tarefa.")], [#text("REQ-VID-TRIM-007")], [#text("Passa")],
    [#text("TST-TRIM-008")], [#text("Automático")], [#text("Dado um vídeo de ensaio com fotogramas numerados e um intervalo válido, Quando o recorte termina, Então o novo vídeo contém o segmento escolhido e a duração corresponde ao intervalo, com a tolerância temporal documentada.")], [#text("REQ-VID-TRIM-008")], [#text("Passa")],
    [#text("TST-TRIM-009")], [#text("Automático")], [#text("Dado um vídeo com resolução e taxa de fotogramas conhecidas, Quando termina um recorte sem transformação espacial, Então o resultado conserva essas propriedades, respeitando a exceção aprovada para dimensões ímpares recodificadas.")], [#text("REQ-VID-TRIM-009")], [#text("Passa")],
    [#text("TST-TRIM-010")], [#text("Automático")], [#text("Dado um MP4/H.264 com corte inicial fora de um keyframe, Quando recortado, Então o vídeo é recodificado; dado um corte alinhado e compatível com cópia, Então pode ser copiado; um AVI com MPEG-4 Part 2 produz MP4/H.264.")], [#text("REQ-VID-TRIM-010")], [#text("Passa")],
  ),
)

=== Remoção de áudio — UC-VID-002

#tab([Testes e resultados — Remoção de áudio — UC-VID-002],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-AUDIO-001")], [#text("Manual")], [#text("Dado um vídeo selecionado, Quando a interface da ferramenta é aberta, Então o sistema verifica nos metadados se a contagem de faixas sonoras é ≥ 1.")], [#text("REQ-VID-AUDIO-001")], [#text("Passa")],
    [#text("TST-AUDIO-002")], [#text("Manual")], [#text("Dado um vídeo comprovadamente silencioso, Quando o utilizador tenta aceder à ferramenta de remoção de áudio, Então a ação é bloqueada com notificação explicativa.")], [#text("REQ-VID-AUDIO-002")], [#text("Passa")],
    [#text("TST-AUDIO-003")], [#text("Automático")], [#text("Dado um utilizador registado que tenta remover áudio de um vídeo mudo, Quando a rejeição ocorre, Então o saldo da quota diária mantém-se rigorosamente idêntico.")], [#text("REQ-VID-AUDIO-003")], [#text("Passa")],
    [#text("TST-AUDIO-004")], [#text("Manual")], [#text("Dado o ecrã de remoção de áudio, Quando o utilizador clica em prosseguir, Então surge uma janela de confirmação alertando para a supressão permanente do áudio.")], [#text("REQ-VID-AUDIO-004")], [#text("Passa")],
    [#text("TST-AUDIO-005")], [#text("Automático")], [#text("Dado um MP4 ou MOV com vídeo H.264 e áudio, Quando a tarefa é executada no worker, Então a stream H.264 é copiada sem re-encoding e o contentor final tem zero faixas de áudio; dado um AVI com vídeo MPEG-4 Part 2, Então o resultado é um MP4 H.264 sem faixas de áudio.")], [#text("REQ-VID-AUDIO-005")], [#text("Passa")],
    [#text("TST-AUDIO-006")], [#text("Automático")], [#text("Dado um vídeo com duração visual e resolução conhecidas, Quando se remove o áudio, Então o resultado conserva a duração visual e a resolução. A comparação distingue a duração das imagens do preenchimento temporal do contentor, conforme a D-55.")], [#text("REQ-VID-AUDIO-006")], [#text("Passa")],
  ),
)

=== Alteração da velocidade — UC-VID-003

#tab([Testes e resultados — Alteração da velocidade — UC-VID-003],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-SPEED-001")], [#text("Manual")], [#text("Dado o painel de velocidade, Quando aberto, Então apresenta botões de seleção rápida para os fatores predefinidos mais comuns.")], [#text("REQ-VID-SPEED-001")], [#text("Passa")],
    [#text("TST-SPEED-002")], [#text("Manual")], [#text("Dado um utilizador no configurador, Quando digita o valor 1.75 no campo numérico, Então o fator 1.75× fica registado como valor ativo.")], [#text("REQ-VID-SPEED-002")], [#text("Passa")],
    [#text("TST-SPEED-003")], [#text("Manual")], [#text("Dado um vídeo com duração conhecida, Quando se altera o fator de velocidade, Então a duração prevista é recalculada dividindo a duração de origem pelo fator selecionado.")], [#text("REQ-VID-SPEED-003")], [#text("Passa")],
    [#text("TST-SPEED-004")], [#text("Manual")], [#text("Dado o valor 0 ou -2.0, Quando o utilizador tenta confirmar, Então o sistema bloqueia a ação alertando que o fator tem de ser estritamente positivo.")], [#text("REQ-VID-SPEED-004")], [#text("Passa")],
    [#text("TST-SPEED-005")], [#text("Manual")], [#text("Dado o fator 5.0×, Quando submetido, Então o sistema bloqueia o pedido indicando que o intervalo homologado é de 0.25× a 4.0×.")], [#text("REQ-VID-SPEED-005")], [#text("Passa")],
    [#text("TST-SPEED-006")], [#text("Automático")], [#text("Dado um vídeo de ensaio e um fator entre 0,25× e 4×, Quando a tarefa termina, Então a duração do resultado varia inversamente ao fator e é avaliada face à tolerância da frequência de fotogramas.")], [#text("REQ-VID-SPEED-006")], [#text("Passa")],
    [#text("TST-SPEED-007")], [#text("Manual")], [#text("Dado um vídeo com áudio acelerado a 2.0×, Quando reproduzido o resultado, Então a faixa de som acompanha perfeitamente o ritmo acelerado das imagens.")], [#text("REQ-VID-SPEED-007")], [#text("Passa")],
    [#text("TST-SPEED-008")], [#text("Automático")], [#text("Dado um vídeo MP4 ou MOV com resolução conhecida, Quando termina a alteração de velocidade, Então o resultado é MP4 H.264/AAC e conserva a resolução, com a exceção aprovada das dimensões ímpares recodificadas.")], [#text("REQ-VID-SPEED-008")], [#text("Passa")],
  ),
)

=== Marca de água — UC-VID-004

#tab([Testes e resultados — Marca de água — UC-VID-004],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-WATERMARK-001")], [#text("Manual")], [#text("Dado o configurador de marca de água, Quando o utilizador acede à opção, Então pode alternar livremente entre as abas \"Texto\" e \"Imagem\".")], [#text("REQ-VID-WATERMARK-001")], [#text("Passa")],
    [#text("TST-WATERMARK-002")], [#text("Manual")], [#text("Dada a modalidade de texto selecionada, Quando o utilizador escreve \"© PictuRAS 2026\", Então o texto é registado para aplicação no quadro.")], [#text("REQ-VID-WATERMARK-002")], [#text("Passa")],
    [#text("TST-WATERMARK-003")], [#text("Manual")], [#text("Dada a modalidade de imagem selecionada, Quando o utilizador escolhe um ficheiro PNG com canal alfa, Então a imagem é carregada para configuração da sobreposição.")], [#text("REQ-VID-WATERMARK-003")], [#text("Passa")],
    [#text("TST-WATERMARK-004")], [#text("Manual")], [#text("Dado o configurador de sobreposição, Quando o utilizador clica na opção \"Canto Inferior Direito\", Então as coordenadas X e Y são ajustadas automaticamente para essa área.")], [#text("REQ-VID-WATERMARK-004")], [#text("Passa")],
    [#text("TST-WATERMARK-005")], [#text("Manual")], [#text("Dado um seletor deslizante de escala, Quando o utilizador ajusta para 20%, Então a marca de água passa a ocupar exatamente 20% da largura do quadro.")], [#text("REQ-VID-WATERMARK-005")], [#text("Passa")],
    [#text("TST-WATERMARK-006")], [#text("Manual")], [#text("Dado o controlo de opacidade, Quando o utilizador seleciona 40%, Então a sobreposição adquire 40% de opacidade (60% de transparência).")], [#text("REQ-VID-WATERMARK-006")], [#text("Passa")],
    [#text("TST-WATERMARK-007")], [#text("Manual")], [#text("Dado o campo de texto preenchido apenas com espaços em branco, Quando o utilizador tenta confirmar, Então o sistema bloqueia e emite aviso de texto obrigatório.")], [#text("REQ-VID-WATERMARK-007")], [#text("Passa")],
    [#text("TST-WATERMARK-008")], [#text("Automático")], [#text("Dado um vídeo 1280×720 px e coordenada X de 1300 px, Quando o utilizador valida os dados, Então o sistema recusa a geometria por transpor os limites visíveis.")], [#text("REQ-VID-WATERMARK-008")], [#text("Passa")],
    [#text("TST-WATERMARK-009")], [#text("Manual")], [#text("Dado o ajuste interativo de posição ou opacidade, Quando o utilizador altera os controlos, Então a visualização sobreposta do fotograma inicial é imediatamente renderizada.")], [#text("REQ-VID-WATERMARK-009")], [#text("Passa")],
    [#text("TST-WATERMARK-010")], [#text("Automático")], [#text("Dado o processamento concluído de uma marca de água, Quando inspecionados fotogramas ao longo de toda a linha temporal, Então a marca surge sempre na mesma posição e opacidade.")], [#text("REQ-VID-WATERMARK-010")], [#text("Passa")],
    [#text("TST-WATERMARK-011")], [#text("Automático")], [#text("Dado um vídeo de origem com áudio AAC, Quando o novo ficheiro é emitido, Então a faixa de áudio original encontra-se preservada e alinhada com as imagens marcadas; dado um AVI com áudio MP3, Então o resultado contém uma faixa AAC alinhada com as imagens.")], [#text("REQ-VID-WATERMARK-011")], [#text("Passa")],
  ),
)

=== Descarregamento — UC-VID-005

#tab([Testes e resultados — Descarregamento — UC-VID-005],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-DOWNLOAD-001")], [#text("Automático")], [#text("Dado um utilizador com permissão de leitura num projeto partilhado, Quando escolhe \"Descarregar\" num vídeo concluído, Então o sistema inicia o descarregamento do ficheiro.")], [#text("REQ-VID-DOWNLOAD-001")], [#text("Passa")],
    [#text("TST-DOWNLOAD-002")], [#text("Automático")], [#text("Dado um URL de descarregamento gerado para o utilizador A, Quando é usado pelo utilizador B ou após 16 minutos, Então o armazenamento responde HTTP 403 Forbidden.")], [#text("REQ-VID-DOWNLOAD-002")], [#text("Passa")],
    [#text("TST-DOWNLOAD-003")], [#text("Automático")], [#text("Dado um vídeo resultante no estado processing, Quando o utilizador abre o menu do recurso, Então a opção \"Descarregar\" está desativada com indicação RESOURCE_NOT_READY.")], [#text("REQ-VID-DOWNLOAD-003")], [],
    [#text("TST-DOWNLOAD-004")], [#text("Automático")], [#text("Dado um utilizador registado com 3 créditos, Quando descarrega dois vídeos, Então o saldo da quota diária mantém-se em 3 créditos.")], [#text("REQ-VID-DOWNLOAD-004")], [#text("Passa")],
    [#text("TST-DOWNLOAD-005")], [#text("Automático")], [#text("Dado o resultado do recorte de ferias.mp4, Quando é descarregado, Então o nome sugerido é ferias_trim.mp4.")], [#text("REQ-VID-DOWNLOAD-005")], [#text("Passa")],
    [#text("TST-DOWNLOAD-006")], [#text("Automático")], [#text("Dado um original carregado em AVI, Quando é descarregado, Então o ficheiro recebido tem extensão.avi e é idêntico (hash) ao ficheiro carregado.")], [#text("REQ-VID-DOWNLOAD-006")], [#text("Passa")],
    [#text("TST-DOWNLOAD-007")], [#text("Automático")], [#text("Dado um descarregamento interrompido aos 60%, Quando o navegador repete o pedido com cabeçalho Range, Então o armazenamento responde HTTP 206 com os bytes em falta. Está verificada a resposta 206 com os bytes corretos; falta documentar a retoma após interrupção real.")], [#text("REQ-VID-DOWNLOAD-007")], [#text("Parcial")],
    [#text("TST-DOWNLOAD-008")], [#text("Automático")], [#text("Dado um URL expirado, Quando o utilizador volta a escolher \"Descarregar\", Então é gerado um URL novo e válido por 15 minutos.")], [#text("REQ-VID-DOWNLOAD-008")], [#text("Passa")],
    [#text("TST-DOWNLOAD-009")], [#text("Automático")], [#text("Dado um descarregamento concluído, Quando consultados os logs centrais, Então existe um evento com correlationId, identificador do utilizador e do recurso.")], [#text("REQ-VID-DOWNLOAD-009")], [#text("Passa")],
  ),
)

=== Informações técnicas — UC-VID-006

#tab([Testes e resultados — Informações técnicas — UC-VID-006],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-INFO-001")], [#text("Automático")], [#text("Dado um vídeo na galeria, Quando o utilizador escolhe \"Informações\", Então é apresentado o painel de informações técnicas do vídeo.")], [#text("REQ-VID-INFO-001")], [#text("Passa")],
    [#text("TST-INFO-002")], [#text("Automático")], [#text("Dado um vídeo de 45,2 s, Quando o painel é aberto, Então a duração apresentada é 00:00:45.200.")], [#text("REQ-VID-INFO-002")], [#text("Passa")],
    [#text("TST-INFO-003")], [#text("Automático")], [#text("Dados metadados com dimensões de apresentação conhecidas, incluindo um vídeo com rotação de 90°, Quando são formatados e apresentados, Então a resolução corresponde à orientação de apresentação.")], [#text("REQ-VID-INFO-003")], [#text("Passa")],
    [#text("TST-INFO-004")], [#text("Automático")], [#text("Dado um MOV com H.264 e AAC, Quando o painel é aberto, Então o formato apresentado é MOV (H.264 / AAC).")], [#text("REQ-VID-INFO-004")], [#text("Passa")],
    [#text("TST-INFO-005")], [#text("Automático")], [#text("Dado um ficheiro de 157 286 400 bytes, Quando o painel é aberto, Então o tamanho apresentado é 150.00 MB.")], [#text("REQ-VID-INFO-005")], [#text("Passa")],
    [#text("TST-INFO-006")], [#text("Automático")], [#text("Dado um vídeo a 30000/1001 fps, Quando o painel é aberto, Então a taxa apresentada é 29.97 fps.")], [#text("REQ-VID-INFO-006")], [#text("Passa")],
    [#text("TST-INFO-007")], [#text("Automático")], [#text("Dado um utilizador registado com 2 créditos, Quando consulta as informações de três vídeos, Então nenhuma tarefa é criada e o saldo mantém-se em 2 créditos.")], [#text("REQ-VID-INFO-007")], [#text("Passa")],
    [#text("TST-INFO-008")], [#text("Automático")], [#text("Dado um vídeo resultante de uma cadeia \"recorte → filtro\", Quando o painel é aberto, Então é apresentado o vídeo de origem e os dois passos aplicados pela ordem.")], [#text("REQ-VID-INFO-008")], [#text("Passa")],
    [#text("TST-INFO-009")], [#text("Automático")], [#text("Dado um vídeo sem taxa de fotogramas persistida, Quando o painel é aberto, Então o campo indica \"Indisponível\" e o aviso é registado com o correlationId.")], [#text("REQ-VID-INFO-009")], [#text("Passa")],
  ),
)

=== Ajustes visuais — UC-VID-007

#tab([Testes e resultados — Ajustes visuais — UC-VID-007],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-ADJUST-001")], [#text("Manual")], [#text("Dado o painel de ajuste, Quando o utilizador move o controlo de brilho para 1.30, Então o fator de brilho fica registado como 1.30.")], [#text("REQ-VID-ADJUST-001")], [#text("Passa")],
    [#text("TST-ADJUST-002")], [#text("Manual")], [#text("Dado o painel de ajuste, Quando o utilizador move o controlo de contraste para 0.80, Então o fator de contraste fica registado como 0.80.")], [#text("REQ-VID-ADJUST-002")], [#text("Passa")],
    [#text("TST-ADJUST-003")], [#text("Manual")], [#text("Dado o painel de ajuste, Quando o utilizador move o controlo de saturação para 0.00, Então o fator de saturação fica registado como 0.00 (tons de cinzento).")], [#text("REQ-VID-ADJUST-003")], [#text("Passa")],
    [#text("TST-ADJUST-004")], [#text("Manual")], [#text("Dado o painel de ajuste aberto pela primeira vez, Quando os controlos são apresentados, Então brilho, contraste e saturação estão em 1.0.")], [#text("REQ-VID-ADJUST-004")], [#text("Passa")],
    [#text("TST-ADJUST-010")], [#text("Manual")], [#text("Dado um painel com valores de ajuste diferentes de 1.0, Quando o utilizador seleciona Repor, Então os três controlos passam a 1.0.")], [#text("REQ-VID-ADJUST-010")], [#text("Passa")],
    [#text("TST-ADJUST-005")], [#text("Manual")], [#text("Dado o painel de ajuste, Quando o utilizador altera o contraste, Então a pré-visualização é atualizada em ≤ 1 s. A pré-visualização foi aprovada manualmente e medida na API; falta medir o intervalo completo até à apresentação no navegador.")], [#text("REQ-VID-ADJUST-005")], [#text("Parcial")],
    [#text("TST-ADJUST-006")], [#text("Automático")], [#text("Dado um pedido via API com brilho 2.5, Quando submetido, Então a API responde HTTP 422 com INVALID_ADJUST_PARAMS indicando o campo brightness.")], [#text("REQ-VID-ADJUST-006")], [#text("Passa")],
    [#text("TST-ADJUST-007")], [#text("Manual")], [#text("Dado o painel com os três controlos em 1.0, Quando o utilizador tenta confirmar, Então a confirmação é bloqueada com a indicação NO_CHANGES.")], [#text("REQ-VID-ADJUST-007")], [#text("Passa")],
    [#text("TST-ADJUST-008")], [#text("Automático")], [#text("Dado um ajuste de saturação 0.0, Quando inspecionados fotogramas no início, meio e fim do resultado, Então todos estão em tons de cinzento.")], [#text("REQ-VID-ADJUST-008")], [#text("Passa")],
    [#text("TST-ADJUST-009")], [#text("Automático")], [#text("Dado um vídeo de ensaio com duração, resolução, fps e áudio conhecidos, Quando termina o ajuste, Então essas propriedades são preservadas; quando há dimensões ímpares, a recodificação corta um píxel para o par inferior.")], [#text("REQ-VID-ADJUST-009")], [#text("Passa")],
  ),
)

=== Filtros — UC-VID-008

#tab([Testes e resultados — Filtros — UC-VID-008],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-FILTER-001")], [#text("Manual")], [#text("Dado o painel de filtros, Quando aberto, Então apresenta exatamente os seis filtros do catálogo do MVP.")], [#text("REQ-VID-FILTER-001")], [#text("Passa")],
    [#text("TST-FILTER-002")], [#text("Manual")], [#text("Dado o painel de filtros, Quando aberto, Então cada filtro mostra uma miniatura com o primeiro fotograma do vídeo filtrado.")], [#text("REQ-VID-FILTER-002")], [#text("Passa")],
    [#text("TST-FILTER-003")], [#text("Manual")], [#text("Dado o filtro Sépia selecionado, Quando o utilizador escolhe Vintage, Então apenas Vintage fica selecionado.")], [#text("REQ-VID-FILTER-003")], [#text("Passa")],
    [#text("TST-FILTER-004")], [#text("Manual")], [#text("Dado o filtro Negativo selecionado, Quando a seleção ocorre, Então a pré-visualização com as cores invertidas é apresentada em ≤ 1 s. A transformação e a latência da API foram verificadas; falta a medição completa no navegador.")], [#text("REQ-VID-FILTER-004")], [#text("Parcial")],
    [#text("TST-FILTER-005")], [#text("Automático")], [#text("Dado um pedido via API com filtro cartoon, Quando submetido, Então a API responde HTTP 422 com INVALID_FILTER.")], [#text("REQ-VID-FILTER-005")], [#text("Passa")],
    [#text("TST-FILTER-006")], [#text("Automático")], [#text("Dado o filtro Preto e Branco, Quando inspecionados fotogramas no início, meio e fim do resultado, Então todos têm saturação nula.")], [#text("REQ-VID-FILTER-006")], [#text("Passa")],
    [#text("TST-FILTER-007")], [#text("Automático")], [#text("Dado um vídeo com duração, resolução, fps e áudio conhecidos, Quando termina a aplicação do filtro, Então essas propriedades são preservadas, com o corte aprovado de um píxel nas dimensões ímpares recodificadas.")], [#text("REQ-VID-FILTER-007")], [#text("Passa")],
  ),
)

=== Redimensionamento — UC-VID-009

#tab([Testes e resultados — Redimensionamento — UC-VID-009],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-RESIZE-001")], [#text("Manual")], [#text("Dado o painel de redimensionamento, Quando o utilizador introduz largura 1280 com a proporção desbloqueada e altura 720, Então as dimensões de saída ficam registadas como 1280×720.")], [#text("REQ-VID-RESIZE-001")], [#text("Passa")],
    [#text("TST-RESIZE-002")], [#text("Manual")], [#text("Dado um vídeo 1920×1080 com proporção bloqueada, Quando o utilizador introduz largura 1000, Então a altura é calculada como 562 px.")], [#text("REQ-VID-RESIZE-002")], [#text("Passa")],
    [#text("TST-RESIZE-003")], [#text("Manual")], [#text("Dado um vídeo 1920×1080, Quando o utilizador escolhe \"720p\", Então as dimensões de saída passam a 1280×720.")], [#text("REQ-VID-RESIZE-003")], [#text("Passa")],
    [#text("TST-RESIZE-004")], [#text("Manual")], [#text("Dado o bloqueio de proporção desativado, Quando a relação largura/altura difere da original, Então é apresentado o aviso de distorção.")], [#text("REQ-VID-RESIZE-004")], [#text("Passa")],
    [#text("TST-RESIZE-005")], [#text("Manual")], [#text("Dado um vídeo 1280×720, Quando o utilizador escolhe \"1080p\", Então é apresentado o aviso de ampliação e a confirmação continua disponível.")], [#text("REQ-VID-RESIZE-005")], [#text("Passa")],
    [#text("TST-RESIZE-006")], [#text("Automático")], [#text("Dado um utilizador registado, Quando submete 2560×1440, Então a API responde HTTP 422 com INVALID_RESIZE_PARAMS indicando o teto de 1920×1080.")], [#text("REQ-VID-RESIZE-006")], [#text("Passa")],
    [#text("TST-RESIZE-007")], [#text("Manual")], [#text("Dado um vídeo 1280×720, Quando o utilizador confirma 1280×720, Então a confirmação é bloqueada com a indicação NO_CHANGES.")], [#text("REQ-VID-RESIZE-007")], [#text("Passa")],
    [#text("TST-RESIZE-008")], [#text("Automático")], [#text("Dado um redimensionamento confirmado para 854×480, Quando a tarefa conclui, Então o FFprobe reporta o resultado com 854×480 px.")], [#text("REQ-VID-RESIZE-008")], [#text("Passa")],
    [#text("TST-RESIZE-009")], [#text("Automático")], [#text("Dado um vídeo com duração e taxa de fotogramas conhecidas e com áudio, Quando termina o redimensionamento, Então a duração e o fps são preservados e o resultado contém áudio AAC.")], [#text("REQ-VID-RESIZE-009")], [#text("Passa")],
  ),
)

=== Rotação e espelho — UC-VID-010

#tab([Testes e resultados — Rotação e espelho — UC-VID-010],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-ORIENT-001")], [#text("Manual")], [#text("Dado o painel de orientação, Quando o utilizador escolhe 90°, Então a rotação de 90° no sentido horário fica registada.")], [#text("REQ-VID-ORIENT-001")], [#text("Passa")],
    [#text("TST-ORIENT-002")], [#text("Manual")], [#text("Dado o painel de orientação, Quando o utilizador ativa \"Espelho horizontal\", Então o espelho horizontal fica registado.")], [#text("REQ-VID-ORIENT-002")], [#text("Passa")],
    [#text("TST-ORIENT-003")], [#text("Manual")], [#text("Dado o painel de orientação, Quando o utilizador ativa \"Espelho vertical\", Então o espelho vertical fica registado.")], [#text("REQ-VID-ORIENT-003")], [#text("Passa")],
    [#text("TST-ORIENT-004")], [#text("Automático")], [#text("Dado rotação 90° e espelho horizontal, Quando a operação conclui, Então o resultado corresponde a rodar 90° e depois espelhar na horizontal.")], [#text("REQ-VID-ORIENT-004")], [#text("Passa")],
    [#text("TST-ORIENT-005")], [#text("Manual")], [#text("Dado um vídeo 1920×1080 e rotação 270°, Quando a seleção ocorre, Então a pré-visualização rodada é apresentada em ≤ 1 s com a indicação 1080×1920. A geometria e a pré-visualização foram verificadas; falta a medição completa no navegador.")], [#text("REQ-VID-ORIENT-005")], [#text("Parcial")],
    [#text("TST-ORIENT-006")], [#text("Automático")], [#text("Dado um pedido via API com ângulo 45°, Quando submetido, Então a API responde HTTP 422 com INVALID_ORIENT_PARAMS.")], [#text("REQ-VID-ORIENT-006")], [#text("Passa")],
    [#text("TST-ORIENT-007")], [#text("Manual")], [#text("Dado o painel sem rotação nem espelho ativos, Quando o utilizador tenta confirmar, Então a confirmação é bloqueada com a indicação NO_CHANGES.")], [#text("REQ-VID-ORIENT-007")], [#text("Passa")],
    [#text("TST-ORIENT-008")], [#text("Automático")], [#text("Dado um vídeo 1280×720 rodado 90°, Quando a tarefa conclui, Então o resultado tem 720×1280 px sem barras pretas.")], [#text("REQ-VID-ORIENT-008")], [#text("Passa")],
    [#text("TST-ORIENT-009")], [#text("Automático")], [#text("Dado um vídeo com duração e taxa de fotogramas conhecidas e com áudio, Quando termina a orientação, Então essas propriedades são preservadas e o resultado contém áudio AAC.")], [#text("REQ-VID-ORIENT-009")], [#text("Passa")],
  ),
)

=== Conversão de formato — UC-VID-011

#tab([Testes e resultados — Conversão de formato — UC-VID-011],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-CONVERT-001")], [#text("Manual")], [#text("Dado um vídeo MOV com H.264/AAC, Quando o utilizador abre a ferramenta de conversão, Então o formato atual apresentado é MOV (H.264/AAC).")], [#text("REQ-VID-CONVERT-001")], [],
    [#text("TST-CONVERT-010")], [#text("Manual")], [#text("Dado um vídeo MOV, Quando o utilizador abre a ferramenta de conversão, Então as opções apresentadas incluem MP4 e AVI e excluem MOV.")], [#text("REQ-VID-CONVERT-010")], [],
    [#text("TST-CONVERT-002")], [#text("Manual")], [#text("Dado um vídeo AVI, Quando o utilizador escolhe MP4, Então MP4 fica registado como formato de saída.")], [#text("REQ-VID-CONVERT-002")], [],
    [#text("TST-CONVERT-003")], [#text("Manual")], [#text("Dado um MP4 H.264/AAC e saída MOV, Quando o formato é escolhido, Então é indicado \"Cópia direta (sem perda de qualidade)\".")], [#text("REQ-VID-CONVERT-003")], [],
    [#text("TST-CONVERT-004")], [#text("Automático")], [#text("Dado um vídeo MP4, Quando é submetida conversão para MP4 ou para WebM, Então a API responde HTTP 422 com SAME_FORMAT ou UNSUPPORTED_TARGET_FORMAT, respetivamente.")], [#text("REQ-VID-CONVERT-004")], [#text("Passa")],
    [#text("TST-CONVERT-005")], [#text("Automático")], [#text("Dado um MP4 convertido para AVI, Quando o FFprobe inspeciona o resultado, Então o contentor é AVI, o vídeo é MPEG-4 Part 2 e o áudio é MP3.")], [#text("REQ-VID-CONVERT-005")], [#text("Passa")],
    [#text("TST-CONVERT-006")], [#text("Automático")], [#text("Dado um MP4 H.264/AAC convertido para MOV, Quando a tarefa conclui, Então as streams do resultado são bit a bit idênticas às da origem.")], [#text("REQ-VID-CONVERT-006")], [#text("Passa")],
    [#text("TST-CONVERT-007")], [#text("Automático")], [#text("Dado um AVI de 60 s em 640×480 a 25 fps, Quando convertido para MP4, Então o resultado tem 60 s, 640×480 e 25 fps. Foram testadas propriedades de resultados com outras durações; a tolerância temporal do teste do worker necessita de justificação.")], [#text("REQ-VID-CONVERT-007")], [#text("Parcial")],
    [#text("TST-CONVERT-008")], [#text("Misto")], [#text("Dado um vídeo convertido para AVI, Quando o utilizador o abre no leitor, Então é reproduzida a cópia de pré-visualização MP4 associada. A associação e utilização da cópia MP4 na API estão testadas; a reprodução integral de todos os percursos no leitor ainda não está registada.")], [#text("REQ-VID-CONVERT-008")], [#text("Parcial")],
    [#text("TST-CONVERT-009")], [#text("Automático")], [#text("Dada uma cadeia \"converter para MOV → filtro Sépia\", Quando o utilizador confirma, Então a cadeia é rejeitada com INVALID_CHAIN.")], [#text("REQ-VID-CONVERT-009")], [],
  ),
)

=== Junção de vídeos — UC-VID-012 — B008

#tab([Testes e resultados — Junção de vídeos — UC-VID-012 — B008],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-CONCAT-001")], [#text("Misto")], [#text("Dado um projeto com os vídeos V1, V2 e V3, Quando o utilizador seleciona V1, V3 e V1, Então os três clips surgem na linha temporal por essa ordem.")], [#text("REQ-VID-CONCAT-001")], [],
    [#text("TST-CONCAT-002")], [#text("Misto")], [#text("Dado que o utilizador seleciona V1, V2 e V3, Quando a linha temporal é apresentada, Então os clips surgem pela ordem V1, V2, V3.")], [#text("REQ-VID-CONCAT-002")], [],
    [#text("TST-CONCAT-013")], [#text("Misto")], [#text("Dada uma linha temporal V1, V2, V3, Quando o utilizador move V3 para a primeira posição, Então a ordem passa a V3, V1, V2.")], [#text("REQ-VID-CONCAT-013")], [],
    [#text("TST-CONCAT-003")], [#text("Misto")], [#text("Dada a linha temporal V1, V2, V3, Quando o utilizador remove V2, Então a linha temporal passa a V1, V3 e a duração total é recalculada.")], [#text("REQ-VID-CONCAT-003")], [],
    [#text("TST-CONCAT-004")], [#text("Misto")], [#text("Dados clips com durações de 20 s, 35 s e 10 s, Quando selecionados, Então a interface indica uma duração estimada de 65 s.")], [#text("REQ-VID-CONCAT-004")], [],
    [#text("TST-CONCAT-012")], [#text("Misto")], [#text("Dados clips em que o primeiro tem 1280×720 a 30 fps, Quando a seleção é feita, Então a interface indica 1280×720 a 30 fps como propriedades estimadas do resultado.")], [#text("REQ-VID-CONCAT-012")], [],
    [#text("TST-CONCAT-005")], [#text("Automático")], [#text("Dado um pedido via API com um único clip, Quando submetido, Então a API responde HTTP 422 com INSUFFICIENT_INPUTS.")], [#text("REQ-VID-CONCAT-005")], [],
    [#text("TST-CONCAT-006")], [#text("Automático")], [#text("Dado um utilizador registado, Quando submete uma junção com 11 clips, Então a API responde HTTP 422 com TOO_MANY_INPUTS indicando o limite de 10.")], [#text("REQ-VID-CONCAT-006")], [],
    [#text("TST-CONCAT-007")], [#text("Automático")], [#text("Dado um utilizador registado com clips de 3 min e 2 min 30 s, Quando submete a junção, Então a API responde HTTP 422 com LIMIT_EXCEEDED (5 min 30 s > 5 min).")], [#text("REQ-VID-CONCAT-007")], [],
    [#text("TST-CONCAT-008")], [#text("Automático")], [#text("Dado um primeiro clip 1920×1080 a 30 fps e um segundo 1080×1920 a 25 fps, Quando a junção conclui, Então todo o resultado está em 1920×1080 a 30 fps e o segundo clip surge centrado com barras laterais.")], [#text("REQ-VID-CONCAT-008")], [],
    [#text("TST-CONCAT-009")], [#text("Automático")], [#text("Dado um clip silencioso de 10 s entre dois clips com áudio, Quando a junção conclui, Então o resultado tem uma única stream de áudio contínua com 10 s de silêncio nessa posição.")], [#text("REQ-VID-CONCAT-009")], [],
    [#text("TST-CONCAT-010")], [#text("Automático")], [#text("Dados os clips de 20 s, 35 s e 10 s, Quando a junção conclui, Então o resultado tem 65 s e os conteúdos surgem pela ordem definida.")], [#text("REQ-VID-CONCAT-010")], [],
    [#text("TST-CONCAT-011")], [#text("Automático")], [#text("Dada uma falha no processamento do terceiro de quatro clips, Quando a tarefa transita para failed, Então nenhum vídeo novo surge no projeto.")], [#text("REQ-VID-CONCAT-011")], [],
  ),
)

=== Encadeamento de operações — UC-VID-013 — B008

#tab([Testes e resultados — Encadeamento de operações — UC-VID-013 — B008],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-CHAIN-001")], [#text("Misto")], [#text("Dado o editor de cadeia, Quando o utilizador adiciona \"recorte\", \"ajuste\" e \"remover áudio\", Então a cadeia apresenta os três passos por essa ordem.")], [#text("REQ-VID-CHAIN-001")], [],
    [#text("TST-CHAIN-002")], [#text("Misto")], [#text("Dado o editor de cadeia, Quando aberto, Então a lista de operações elegíveis contém as dez operações.")], [#text("REQ-VID-CHAIN-002")], [],
    [#text("TST-CHAIN-003")], [#text("Automático")], [#text("Dado um vídeo de 60 s com o passo \"velocidade 2.0×\" seguido de \"recorte de 00:40 a 00:50\", Quando o recorte é adicionado, Então é rejeitado com INVALID_STEP_PARAMS (duração estimada de 30 s).")], [#text("REQ-VID-CHAIN-003")], [],
    [#text("TST-CHAIN-004")], [#text("Misto")], [#text("Dada uma cadeia de três passos, Quando o utilizador reordena os passos, Então a nova ordem é apresentada e os passos afetados são revalidados.")], [#text("REQ-VID-CHAIN-004")], [],
    [#text("TST-CHAIN-015")], [#text("Misto")], [#text("Dada uma cadeia de três passos, Quando o utilizador remove o segundo, Então o custo passa de 3 para 2 créditos e os passos seguintes são revalidados.")], [#text("REQ-VID-CHAIN-015")], [],
    [#text("TST-CHAIN-005")], [#text("Misto")], [#text("Dado V1, V2 e V3, Quando o utilizador define (V1 + filtro de cor), (V2 + remover áudio) e (V3 + acelerar) seguidos de junção, Então a cadeia apresenta as três sub-cadeias ligadas ao passo de junção.")], [#text("REQ-VID-CHAIN-005")], [],
    [#text("TST-CHAIN-006")], [#text("Automático")], [#text("Dada a composição do exemplo seguida de \"marca de água\", Quando a cadeia conclui, Então o vídeo final contém os três clips editados e a marca de água em todos os fotogramas.")], [#text("REQ-VID-CHAIN-006")], [],
    [#text("TST-CHAIN-007")], [#text("Automático")], [#text("Dada uma cadeia sem passos, Quando o utilizador confirma, Então o pedido é rejeitado com INVALID_CHAIN.")], [#text("REQ-VID-CHAIN-007")], [],
    [#text("TST-CHAIN-016")], [#text("Automático")], [#text("Dada uma cadeia em que a conversão não é o último passo, Quando confirmada, Então é rejeitada com INVALID_CHAIN.")], [#text("REQ-VID-CHAIN-016")], [],
    [#text("TST-CHAIN-017")], [#text("Automático")], [#text("Dada uma cadeia com duas junções, Quando confirmada, Então é rejeitada com INVALID_CHAIN.")], [#text("REQ-VID-CHAIN-017")], [],
    [#text("TST-CHAIN-008")], [#text("Automático")], [#text("Dada uma cadeia com 10 passos, Quando o utilizador tenta adicionar o 11.º, Então a ação é bloqueada com CHAIN_TOO_LONG.")], [#text("REQ-VID-CHAIN-008")], [],
    [#text("TST-CHAIN-009")], [#text("Misto")], [#text("Dados três clips, cada um com um passo na sua subcadeia, Quando se acrescentam a junção e uma marca de água final, Então o custo total apresentado é de cinco créditos.")], [#text("REQ-VID-CHAIN-009")], [],
    [#text("TST-CHAIN-010")], [#text("Automático")], [#text("Dada uma cadeia de 4 passos confirmada, Quando a API responde, Então é devolvido um único taskId e o projeto tem uma única tarefa ativa.")], [#text("REQ-VID-CHAIN-010")], [],
    [#text("TST-CHAIN-011")], [#text("Automático")], [#text("Dada uma cadeia de 3 passos concluída, Quando consultada a galeria e o armazenamento, Então existe apenas um novo vídeo e nenhum ficheiro intermédio.")], [#text("REQ-VID-CHAIN-011")], [],
    [#text("TST-CHAIN-012")], [#text("Automático")], [#text("Dada uma cadeia de 4 passos em execução, Quando o segundo passo inicia, Então o cliente recebe um evento com step: 2, totalSteps: 4 e a percentagem global.")], [#text("REQ-VID-CHAIN-012")], [],
    [#text("TST-CHAIN-013")], [#text("Automático")], [#text("Dada uma cadeia de 3 passos que falha no terceiro, Quando a tarefa transita para failed, Então nenhum vídeo novo surge no projeto e os 3 créditos são devolvidos.")], [#text("REQ-VID-CHAIN-013")], [],
    [#text("TST-CHAIN-014")], [#text("Misto")], [#text("Dada uma cadeia \"720p + marca de água\" guardada, Quando o utilizador cria uma nova cadeia, Então pode carregar a predefinição com todos os parâmetros preenchidos.")], [#text("REQ-VID-CHAIN-014")], [],
  ),
)

=== Requisitos não funcionais

#tab([Testes e resultados — Requisitos não funcionais],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-NFR-001")], [#text("Automático")], [#text("Dado um pedido de emissão de URL sem JWT válido, Quando recebido pela API, Então é rejeitado; dado um URL assinado válido, Quando usado diretamente no storage, Então o objeto é servido sem exigir um segundo JWT.")], [#text("REQ-VID-NFR-001")], [],
    [#text("TST-NFR-015")], [#text("Automático")], [#text("Dado um utilizador sem permissão de leitura no projeto, Quando tenta aceder ao vídeo ou URL de transferência, Então o acesso é rejeitado.")], [#text("REQ-VID-NFR-015")], [#text("Passa")],
    [#text("TST-NFR-002")], [#text("Automático")], [#text("Dado o disparo de uma operação de vídeo, Quando inspecionados os logs do Gateway, Projects e Worker Python, Então todos contêm o mesmo correlationId.")], [#text("REQ-VID-NFR-002")], [#text("Passa")],
    [#text("TST-NFR-003")], [#text("Automático")], [#text("Dado um ficheiro cujo contentor e codecs constam da matriz aprovada, Quando validado, Então é aceite; um ficheiro fora da matriz é rejeitado com motivo.")], [#text("REQ-VID-NFR-003")], [#text("Passa")],
    [#text("TST-NFR-016")], [#text("Automático")], [#text("Dada uma transformação sem conversão, Quando inspecionado o resultado, Então é MP4/H.264, com AAC se existir áudio; dada remoção de áudio, Então a contagem de streams de áudio é zero.")], [#text("REQ-VID-NFR-016")], [#text("Passa")],
    [#text("TST-NFR-004")], [#text("Automático")], [#text("Dado um pedido completo válido com vídeo já persistido, Quando aceite, Então a resposta com taskId e queued é recebida em ≤ 1000 ms no intervalo definido; o ensaio regista a carga e o ambiente.")], [#text("REQ-VID-NFR-004")], [#text("Passa")],
    [#text("TST-NFR-005")], [#text("Automático")], [#text("Dada uma transformação ainda em processing, Quando o utilizador abre a página de outro projeto, Então o pedido de navegação recebe resposta sem esperar pelo fim da transformação, cuja tarefa continua ativa.")], [#text("REQ-VID-NFR-005")], [],
    [#text("TST-NFR-006")], [#text("Automático")], [#text("Dado um worker terminado durante a primeira execução, Quando ocorre reentrega, Então a tarefa recomeça do zero; se a segunda entrega também falhar, Então fica failed, sem recurso novo, com créditos devolvidos e temporários limpos.")], [#text("REQ-VID-NFR-006")], [#text("Passa")],
    [#text("TST-NFR-007")], [#text("Automático")], [#text("Dado um vídeo que excede o limite de duração ou tamanho do perfil, Quando validado, Então é rejeitado antes do processamento.")], [#text("REQ-VID-NFR-007")], [#text("Passa")],
    [#text("TST-NFR-017")], [#text("Automático")], [#text("Dado um projeto que já atingiu o limite de tarefas ativas, Quando é submetida outra tarefa, Então o pedido é rejeitado antes do processamento.")], [#text("REQ-VID-NFR-017")], [#text("Passa")],
    [#text("TST-NFR-008")], [#text("Automático")], [#text("Dado um processamento de recorte ou de outra operação de vídeo, Quando inspecionado o tráfego WebSocket, Então são recebidos eventos de progresso pelo menos uma vez por segundo, com percentagem monotonicamente crescente até 100%. O intervalo máximo registado foi de 645 ms no cenário da fundação; não existe medição equivalente para todas as operações reais.")], [#text("REQ-VID-NFR-008")], [#text("Parcial")],
    [#text("TST-NFR-009")], [#text("Automático")], [#text("Dado um novo servidor com Docker instalado, Quando se executa docker compose up, Então os workers de vídeo arrancam sem configuração manual de binários.")], [#text("REQ-VID-NFR-009")], [#text("Passa")],
    [#text("TST-NFR-010")], [#text("Automático")], [#text("Dado o código das ferramentas existentes de imagem em Tools/, Quando os novos workers de vídeo são iniciados, Então nenhuma linha de código das ferramentas de imagem é alterada.")], [#text("REQ-VID-NFR-010")], [#text("Passa")],
    [#text("TST-NFR-011")], [#text("Automático")], [#text("Dado um vídeo produzido por uma operação, Quando analisado com FFprobe, Então não são reportados erros de descodificação.")], [#text("REQ-VID-NFR-011")], [#text("Passa")],
    [#text("TST-NFR-022")], [#text("Automático")], [#text("Dado um conjunto de vídeos produzidos, Quando abertos nos leitores de referência, Então cada vídeo reproduz do início ao fim. Há reprodução integral em VLC e aprovação manual de alguns percursos; a matriz completa do leitor integrado permanece por validar.")], [#text("REQ-VID-NFR-022")], [#text("Parcial")],
    [#text("TST-NFR-012")], [#text("Automático")], [#text("Dada uma cadeia de 4 passos, Quando inspecionados o plano e os logs do worker, Então existe no máximo uma codificação da stream de vídeo para o resultado final; uma cadeia elegível para cópia pode ter zero.")], [#text("REQ-VID-NFR-012")], [],
    [#text("TST-NFR-018")], [#text("Automático")], [#text("Dado um utilizador registado que submete uma junção acima do limite, Quando validada, Então o pedido é rejeitado antes da criação da tarefa.")], [#text("REQ-VID-NFR-018")], [],
    [#text("TST-NFR-019")], [#text("Automático")], [#text("Dada uma cadeia acima do número máximo de passos, Quando validada, Então o pedido é rejeitado antes da criação da tarefa.")], [#text("REQ-VID-NFR-019")], [],
    [#text("TST-NFR-020")], [#text("Automático")], [#text("Dada uma junção cuja duração total excede o limite do perfil, Quando validada, Então o pedido é rejeitado antes da criação da tarefa.")], [#text("REQ-VID-NFR-020")], [],
    [#text("TST-NFR-013")], [#text("Automático")], [#text("Dado o painel de filtros aberto, Quando o utilizador seleciona um filtro, Então a pré-visualização é apresentada em ≤ 1 s em 95% dos pedidos.")], [#text("REQ-VID-NFR-013")], [],
    [#text("TST-NFR-014")], [#text("Automático")], [#text("Dado um pedido de descarregamento, Quando o ficheiro é transferido, Então os dados são servidos pelo armazenamento de objetos e não atravessam o API Gateway. O percurso direto dos bytes está comprovado; falta validar um ficheiro de vídeo no limite de 2 GB.")], [#text("REQ-VID-NFR-014")], [#text("Parcial")],
    [#text("TST-NFR-021")], [#text("Automático")], [#text("Dado um descarregamento interrompido, Quando retomado com um pedido HTTP Range, Então o armazenamento responde com HTTP 206 e envia o intervalo solicitado. A resposta HTTP Range está testada; falta o ensaio completo de interrupção, reconstrução e capacidade no limite de 2 GB.")], [#text("REQ-VID-NFR-021")], [#text("Parcial")],
  ),
)


=== Medições dos requisitos não funcionais

As medições são confrontadas com os alvos MVP da ERS do relatório. Os valores de produção não constituem o critério de aceitação desta fase. As medições de latência disponíveis resultam de execuções locais sem ensaio sistemático de carga; as amostras e condições conhecidas são indicadas, evitando extrapolações para produção. Para os requisitos de natureza estrutural ou funcional, regista-se a observação relevante em vez de uma medida temporal artificial.

#tab([Medições e observações face aos alvos MVP],
  tabela(
    colunas: (2.6cm, 3.7cm, 1fr, 2.7cm), tamanho: 8pt,
    [Requisito], [Alvo MVP], [Valor medido ou observação registada], [Apreciação],
    [#text("REQ-VID-NFR-001")], [#text("Validação síncrona de JWT com expiração de 1 hora.")], [#text("O helper de emissão foi inspecionado e sondado: exp−iat = 604800 s (sete dias), face ao alvo de 3600 s. A rejeição de token ausente ou inválido já tem testes.")], [#text("Desvio identificado; teste completo por concluir.")],
    [#text("REQ-VID-NFR-002")], [#text("UUID gerado no router de vídeo, propagado em X-Correlation-Id no HTTP e no campo correlationId do corpo das mensagens de vídeo e dos erros, sem usar propriedades AMQP.")], [#text("O teste de integração da B003 verificou o mesmo UUID nos registos do gateway, do serviço de projetos e do worker, bem como a propagação no corpo das mensagens.")], [#text("Verificação funcional favorável registada.")],
    [#text("REQ-VID-NFR-003")], [#text("Entrada: MP4 e MOV (H.264/AAC) e AVI (H.264 ou MPEG-4 Part 2 / AAC ou MP3); rejeição determinística de qualquer outro formato/codec.")], [#text("A matriz de contentores e codecs foi verificada por testes de domínio, análise FFprobe e ingestão positiva e negativa.")], [#text("Verificação funcional favorável registada.")],
    [#text("REQ-VID-NFR-004")], [#text("Tempo de resposta HTTP ≤ 1000 ms para aceitação e enfileiramento da tarefa em fila RabbitMQ.")], [#text("B003: 20–27 ms; B004: 31,6–81,1 ms; B005: p95 de 34 ms e máximo de 154 ms nas aceitações observadas. Medição externa pela API, com ficheiro já persistido.")], [#text("Abaixo de 1000 ms nos ensaios locais.")],
    [#text("REQ-VID-NFR-005")], [#text("Execução assíncrona via RabbitMQ; cliente HTTP livre imediatamente após submissão.")], [#text("A resposta assíncrona e a execução por RabbitMQ estão testadas. Não foi localizado um resultado individualizado do percurso de navegação para outro projeto durante processing.")], [#text("Ensaio de navegação por registar.")],
    [#text("REQ-VID-NFR-006")], [#text("Limpeza após falha e reexecução do zero, no máximo em duas entregas; esgotadas as entregas, failed sem recurso novo e com devolução de créditos.")], [#text("Os testes da B003 induziram quedas do worker: recomeço por reentrega e, após duas entregas falhadas, failed, devolução de quota, ausência de resultado e limpeza.")], [#text("Verificação funcional favorável registada.")],
    [#text("REQ-VID-NFR-007")], [#text("Registado: duração ≤ 5 min e ficheiro ≤ 200 MB; Premium: duração ≤ 60 min e ficheiro ≤ 2 GB.")], [#text("Existem testes de fronteira e rejeições por tamanho e duração para os dois perfis. A emissão de um pedido de upload com tamanho permitido não comprova a transferência física de um vídeo de 2 GB.")], [#text("Regras verificadas; capacidade máxima não demonstrada integralmente.")],
    [#text("REQ-VID-NFR-008")], [#text("Progresso numérico (0–100%) emitido pelo menos 1×/s em todas as operações.")], [#text("Na B003 foi registado intervalo máximo de 645 ms entre eventos no cenário ensaiado. As suites posteriores verificam progresso positivo, sem uma série equivalente para cada operação.")], [#text("Evidência temporal parcial.")],
    [#text("REQ-VID-NFR-009")], [#text("Workers encapsulados em imagens Docker com FFmpeg e Python pré-instalados em ambiente Linux.")], [#text("Os relatórios registam execução do worker em Docker/Linux com Python 3.11 e FFmpeg/FFprobe 5.1.9.")], [#text("Verificação de ambiente favorável registada.")],
    [#text("REQ-VID-NFR-010")], [#text("Nova fila RabbitMQ independente (video_operations_queue) que não interfere com as filas de imagem legadas.")], [#text("Foram auditados os pontos de extensão, as filas AMQP e a preservação das ferramentas de imagem; existe regressão funcional pela stack.")], [#text("Verificação estrutural favorável; falha auxiliar de fixture discriminada.")],
    [#text("REQ-VID-NFR-011")], [#text("Validação com FFprobe sem erros de descodificação.")], [#text("Na B007, os dez resultados e as oito cópias MP4 passaram na inspeção com FFprobe e na descodificação integral com FFmpeg e opção -xerror.")], [#text("18/18 ficheiros verificados na matriz de conversão.")],
    [#text("REQ-VID-NFR-012")], [#text("Composição dos passos num único filtergraph FFmpeg, com no máximo 1 recodificação de vídeo por cadeia e cópia direta quando elegível.")], [#text("A fundação da B003 verifica a composição num único grafo e a ausência de recodificações adicionais nos cenários ensaiados. A aceitação da composição completa depende do B008.")], [#text("Validação integral do B008 por realizar.")],
    [#text("REQ-VID-NFR-013")], [#text("Pré-visualização no servidor de um fotograma transformado em ≤ 1 s em pelo menos 95% dos pedidos.")], [#text("Na API da B005, em 40 pedidos, p95 = 22,5 ms e máximo = 24,6 ms. Miniaturas: 20,1 ms. Não foi medida a série completa desde a ação no controlo até ao fotograma apresentado.")], [#text("A API cumpre o limiar; alvo completo do navegador por medir.")],
    [#text("REQ-VID-NFR-014")], [#text("Os dados do ficheiro são servidos diretamente por URL assinado SeaweedFS/S3 (15 min), para ficheiros até 2 GB.")], [#text("Os URLs e os registos de tráfego confirmam o percurso por Nginx/storage, sem atravessar o gateway. O ensaio volumoso documentado usa 150 MiB de dados aleatórios em upload.")], [#text("Percurso comprovado; vídeo válido no limite por ensaiar.")],
    [#text("REQ-VID-NFR-015")], [#text("Verificação da autorização do projeto e URLs temporários de storage assinados por 15 min.")], [#text("Foram verificadas permissões de leitura/edição, recusa de acesso indevido e assinatura de 900 s; a expiração efetiva foi ensaiada com validade reduzida de dois segundos.")], [#text("Verificação funcional favorável; método abreviado documentado.")],
    [#text("REQ-VID-NFR-016")], [#text("MP4/H.264 com AAC quando exista áudio; remoção de áudio sem faixa sonora; conversão para MP4 ou MOV (H.264/AAC) ou AVI (MPEG-4 Part 2/MP3).")], [#text("Os metadados reais dos resultados das operações e das conversões foram inspecionados com FFprobe; os casos sem áudio são tratados separadamente.")], [#text("Matriz de saída verificada nos cenários executados.")],
    [#text("REQ-VID-NFR-017")], [#text("Máximo de 1 tarefa de vídeo ativa por projeto.")], [#text("Os testes da API verificam a recusa de uma segunda tarefa; os dois casos de navegador da D-66 registam o bloqueio na interface e a recusa pelo servidor.")], [#text("Máximo de uma tarefa verificado.")],
    [#text("REQ-VID-NFR-018")], [#text("Junção: 2–10 vídeos (Registado) e 2–50 (Premium).")], [#text("Não existe resultado de teste de aceitação da junção: o B008 permanece por implementar.")], [#text("Por validar no B008.")],
    [#text("REQ-VID-NFR-019")], [#text("Máximo de 10 passos por cadeia.")], [#text("Não existe resultado de aceitação do limite estrutural da cadeia completa, incluindo subcadeias e junção.")], [#text("Por validar no B008.")],
    [#text("REQ-VID-NFR-020")], [#text("Duração total da junção não superior ao limite de duração do perfil.")], [#text("Não existe resultado de aceitação da duração total da junção por perfil.")], [#text("Por validar no B008.")],
    [#text("REQ-VID-NFR-021")], [#text("Retoma por pedidos HTTP Range para ficheiros até 2 GB.")], [#text("A resposta HTTP 206 e a igualdade dos bytes do intervalo solicitado estão verificadas. Falta o registo de interrupção e reconstrução de um vídeo próximo do limite de 2 GB.")], [#text("Retoma e capacidade integral parcialmente verificadas.")],
    [#text("REQ-VID-NFR-022")], [#text("Reprodução completa em VLC e no leitor integrado; cópia de pré-visualização MP4 para resultados MOV/AVI.")], [#text("Os 18 ficheiros da matriz B007 foram reproduzidos integralmente em VLC sem interface gráfica. Alguns percursos do leitor integrado foram aprovados manualmente; não a totalidade da matriz.")], [#text("Reprodução no leitor integrado parcialmente verificada.")],
  ),
)

== Limitações e defeitos conhecidos

Os relatórios dos Bolts registam 418 casos distintos na validação visual: 417 passaram. O único caso restante é uma expectativa da ferramenta de brilho de imagem da baseline em aarch64 (126 em vez de 127), não tocada pelo incremento de vídeo. Na suite visual de vídeo, os 16 testes E2E passaram e os 12 itens do checklist manual foram aprovados. A cobertura Node registada para o conjunto do vídeo foi de 94,98% de linhas, 89,85% de ramos e 90,91% de funções.

Não foram executados testes de carga nem as suites históricas E2E que exigem ambientes e fixtures próprios. A medição de desempenho é válida apenas para os ambientes descritos nos walkthroughs e não constitui garantia de produção. O suporte a lotes `UC-VID-015` permanece fora do incremento coberto por esta versão.
