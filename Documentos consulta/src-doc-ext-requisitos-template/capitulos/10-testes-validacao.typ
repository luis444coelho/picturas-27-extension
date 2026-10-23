#import "../template.typ": *

= Testes e Validação do MVP

#orientacao[
  Os critérios de aceitação da ERS (_Dado… Quando… Então…_) são a base dos testes. Cada requisito implementado
  deve ter pelo menos um teste (automático ou manual) com resultado registado. Para os requisitos não
  funcionais, registem o valor medido face ao *Alvo*, sempre que aplicável.
]

== Estratégia e ambiente de testes

#preencher[Tipos de teste (unitários, integração, ponta-a-ponta, manuais), ferramentas, ambiente (docker compose), ficheiros de vídeo de teste usados (formatos, durações, tamanhos).]

A validação do produto mínimo viável (MVP) é orientada pelos critérios de aceitação da Especificação de Requisitos do Sistema (ERS), formulados segundo a estrutura «Dado… Quando… Então…», e pelos fluxos principais, alternativos e de exceção dos casos de uso. Foram considerados os 180 requisitos funcionais e os 22 requisitos não funcionais do capítulo da ERS deste relatório. 

A estratégia combina testes unitários, testes de integração, testes ponta-a-ponta e verificações manuais. Os testes unitários incidem na validação de parâmetros, no planeamento das operações, nos cálculos de duração e geometria, na gestão de estados e quotas e na formatação de metadados. Os testes de integração verificam a articulação entre os serviços de projetos, utilizadores, armazenamento e processamento, incluindo persistência, mensagens assíncronas, cancelamento e recuperação de falhas. Os testes ponta-a-ponta exercitam os percursos de utilização através da API ou de um navegador. A avaliação manual complementa os testes automáticos nos controlos do leitor, na configuração das ferramentas, na perceção do resultado visual e na avaliação auditiva do sincronismo.

O conjunto automático utiliza `node:test` e asserções em JavaScript para o serviço de projetos, testes de funções TypeScript no frontend e `unittest` no worker Python. Os testes de processamento recorrem a FFmpeg e FFprobe reais; verificam os contentores, codecs, dimensões, taxa de fotogramas, duração, presença de áudio e conteúdo dos resultados. Quando se prevê cópia direta, são também comparados hashes dos pacotes ou dos fotogramas. A análise técnica é complementada pela descodificação integral com FFmpeg e, na matriz de conversão, pela reprodução com VLC. Os testes de navegador utilizam Playwright com Chromium ou o protocolo Chrome DevTools. A compilação de produção, a verificação de tipos TypeScript e a análise estática com ESLint constituem verificações complementares, sem substituir os testes de aceitação.

O ambiente de integração consiste na execução local da aplicação através de Docker Compose. Inclui o proxy Nginx com HTTPS, o frontend Next.js/React, o API Gateway, os serviços de projetos e utilizadores, MongoDB, RabbitMQ, o serviço de armazenamento de imagens e vídeo, SeaweedFS 4.47 e o worker de vídeo. Os registos de execução identificam Python 3.11 e FFmpeg/FFprobe 5.1.9 num contentor Linux baseado em Debian 12. O ponto de entrada utilizado foi `https://localhost:8080`. Os resultados disponíveis foram obtidos em mais de uma máquina, incluindo macOS com arquitetura aarch64; por esse motivo, as medições são caracterizadas como locais e não como resultados de um único ambiente de referência.

== Testes realizados

As tabelas apresentam os casos de aceitação já verificados e os casos previstos para completar a cobertura. Os identificadores TST foram atribuídos para a organização do relatório; a coluna «Requisito(s)» mantém os IDs da ERS deste documento. Cada requisito surge associado a pelo menos um caso de teste especificado.


O tipo «Automático» abrange testes unitários, integração ou ponta-a-ponta conforme o cenário; «Manual» corresponde às verificações de utilização registadas pela equipa; «Misto» combina evidência automática e manual ou prevê ambas. Nos critérios parcialmente verificados, a descrição identifica a condição que falta validar.

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
    [#text("TST-AUTH-002")], [#text("Misto")], [#text("Dado um utilizador anónimo, Quando tenta validar ou submeter uma composição, Então a API responde 403 FORBIDDEN e não cria tarefa; os três botões não são apresentados. A recusa sem identidade válida é verificada separadamente em AUTH-001.")], [#text("REQ-VID-AUTH-002")], [#text("Passa")],
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
    [#text("TST-STORAGE-002")], [#text("Automático")], [#text("Dada uma junção com cinco ocorrências e quatro ficheiros distintos, Quando o resultado é publicado, Então source_video_ids conserva a ordem e as repetições; o plano descarrega cada objeto distinto apenas uma vez. Evidência B008, integração e worker.")], [#text("REQ-VID-STORAGE-002")], [#text("Passa")],
    [#text("TST-STORAGE-003")], [#text("Automático")], [#text("Dado um utilizador sem permissão de leitura sobre o projeto, Quando tenta aceder a um vídeo desse projeto, Então o acesso é rejeitado segundo a política existente.")], [#text("REQ-VID-STORAGE-003")], [#text("Passa")],
    [#text("TST-STORAGE-005")], [#text("Automático")], [#text("Dado um utilizador que elimina um projeto, Quando a eliminação é confirmada, Então os vídeos, miniaturas e artefactos associados são purgados do storage e da base de dados.")], [#text("REQ-VID-STORAGE-005")], [#text("Passa")],
    [#text("TST-STORAGE-004")], [#text("Automático")], [#text("Dada uma composição com subcadeias por clip e passos finais, Quando se inspeciona o vídeo produzido, Então recipe conserva as operações, os parâmetros e a ordem dos clips. Evidência: integrações B008 de subcadeias e Movie Maker.")], [#text("REQ-VID-STORAGE-004")], [#text("Passa")],
    [#text("TST-TASK-001")], [#text("Automático")], [#text("Dado um pedido válido e admitido, Quando a API responde, Então devolve HTTP 202 com taskId e status queued; a execução e o resultado final são acompanhados separadamente.")], [#text("REQ-VID-TASK-001")], [#text("Passa")],
    [#text("TST-TASK-002")], [#text("Automático")], [#text("Dada uma tarefa queued ou processing, Quando ocorre cancelamento autorizado, Então passa a cancelled; dado completed, failed ou cancelled, Quando chega uma mensagem tardia, Então o estado final não é reativado. Uma reentrega pode reiniciar a execução mantendo processing.")], [#text("REQ-VID-TASK-002")], [#text("Passa")],
    [#text("TST-TASK-003")], [#text("Automático")], [#text("Dado um cliente com WebSocket conectado ao projeto, Quando a tarefa transita de queued para processing, Então é entregue de imediato uma mensagem JSON com o novo estado.")], [#text("REQ-VID-TASK-003")], [#text("Passa")],
    [#text("TST-TASK-004")], [#text("Automático")], [#text("Dado um processamento de vídeo em execução, Quando o utilizador clica em Cancelar, Então o cliente despacha pedido de cancelamento e o sistema regista a ordem de interrupção.")], [#text("REQ-VID-TASK-004")], [#text("Passa")],
    [#text("TST-TASK-005")], [#text("Automático")], [#text("Dado um cancelamento validado pelo sistema, Quando o worker recebe a instrução, Então termina a instância FFmpeg e purga os fragmentos gerados no diretório de trabalho.")], [#text("REQ-VID-TASK-005")], [#text("Passa")],
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
    [#text("TST-UPLOAD-002")], [#text("Automático")], [#text("Dado um ficheiro de vídeo arrastado sobre a janela do navegador, Quando largado na área do projeto, Então o sistema deteta o evento e inicia a validação preliminar.")], [#text("REQ-VID-UPLOAD-002")], [Passa],
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
    [#text("TST-DOWNLOAD-003")], [#text("Automático")], [#text("Dado um vídeo resultante no estado processing, Quando o utilizador abre o menu do recurso, Então a opção \"Descarregar\" está desativada com indicação RESOURCE_NOT_READY.")], [#text("REQ-VID-DOWNLOAD-003")], [Passa],
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
    [#text("TST-CONVERT-001")], [#text("Misto")], [#text("Dado um vídeo MOV com H.264/AAC, Quando o utilizador abre a ferramenta de conversão, Então o formato atual apresentado é MOV (H.264/AAC). Verificação do painel aprovada na checklist final B008; comparação DOM do painel favorável.")], [#text("REQ-VID-CONVERT-001")], [#text("Passa")],
    [#text("TST-CONVERT-010")], [#text("Misto")], [#text("Dado um vídeo MOV, Quando o utilizador abre a ferramenta de conversão, Então as opções apresentadas incluem MP4 e AVI e excluem MOV. Verificação do painel aprovada na checklist final B008; comparação DOM do painel favorável.")], [#text("REQ-VID-CONVERT-010")], [#text("Passa")],
    [#text("TST-CONVERT-002")], [#text("Misto")], [#text("Dado um vídeo AVI, Quando o utilizador escolhe MP4, Então MP4 fica registado como formato de saída. Verificação do painel aprovada na checklist final B008; comparação DOM do painel favorável.")], [#text("REQ-VID-CONVERT-002")], [#text("Passa")],
    [#text("TST-CONVERT-003")], [#text("Misto")], [#text("Dado um MP4 H.264/AAC e saída MOV, Quando o formato é escolhido, Então é indicado \"Cópia direta (sem perda de qualidade)\". Verificação do painel aprovada na checklist final B008; comparação DOM do painel favorável.")], [#text("REQ-VID-CONVERT-003")], [#text("Passa")],
    [#text("TST-CONVERT-004")], [#text("Automático")], [#text("Dado um vídeo MP4, Quando é submetida conversão para MP4 ou para WebM, Então a API responde HTTP 422 com SAME_FORMAT ou UNSUPPORTED_TARGET_FORMAT, respetivamente.")], [#text("REQ-VID-CONVERT-004")], [#text("Passa")],
    [#text("TST-CONVERT-005")], [#text("Automático")], [#text("Dado um MP4 convertido para AVI, Quando o FFprobe inspeciona o resultado, Então o contentor é AVI, o vídeo é MPEG-4 Part 2 e o áudio é MP3.")], [#text("REQ-VID-CONVERT-005")], [#text("Passa")],
    [#text("TST-CONVERT-006")], [#text("Automático")], [#text("Dado um MP4 H.264/AAC convertido para MOV, Quando a tarefa conclui, Então as streams do resultado são bit a bit idênticas às da origem.")], [#text("REQ-VID-CONVERT-006")], [#text("Passa")],
    [#text("TST-CONVERT-007")], [#text("Automático")], [#text("Dado um AVI de 60 s em 640×480 a 25 fps, Quando convertido para MP4, Então o resultado tem 60 s, 640×480 e 25 fps. Foram testadas propriedades de resultados com outras durações; a tolerância temporal do teste do worker necessita de justificação.")], [#text("REQ-VID-CONVERT-007")], [#text("Parcial")],
    [#text("TST-CONVERT-008")], [#text("Misto")], [#text("Dado um vídeo convertido para AVI, Quando o utilizador o abre no leitor, Então é reproduzida a cópia de pré-visualização MP4 associada. A associação e utilização da cópia MP4 na API estão testadas; a reprodução integral de todos os percursos no leitor ainda não está registada.")], [#text("REQ-VID-CONVERT-008")], [#text("Parcial")],
    [#text("TST-CONVERT-009")], [#text("Automático")], [#text("Dada uma cadeia com conversão seguida de filtro, ou conversão dentro de um clip, Quando validada e submetida, Então é recusada com INVALID_CHAIN e regra convert_not_last, sem tarefa nem débito. Evidência: composition.test.js e e2e-composition.test.js.")], [#text("REQ-VID-CONVERT-009")], [#text("Passa")],
  ),
)

=== Junção de vídeos — UC-VID-012

#tab([Testes e resultados — Junção de vídeos — UC-VID-012 ],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-CONCAT-001")], [#text("Misto")], [#text("Dado um projeto com quatro vídeos elegíveis, Quando são selecionadas treze ocorrências, incluindo repetições, Então a junção aceita conserva todas as ocorrências por ordem. API verificada; seleção e arrasto aprovados manualmente.")], [#text("REQ-VID-CONCAT-001")], [#text("Passa")],
    [#text("TST-CONCAT-002")], [#text("Misto")], [#text("Dados clips escolhidos para junção, Quando a linha temporal é apresentada, Então respeita a ordem de seleção.")], [#text("REQ-VID-CONCAT-002")], [#text("Passa")],
    [#text("TST-CONCAT-013")], [#text("Manual")], [#text("Dada uma lista de clips, Quando reordenada por arrasto ou setas antes da confirmação, Então a linha temporal e o primeiro clip de referência mudam. Verificação manual B008 aprovada.")], [#text("REQ-VID-CONCAT-013")], [#text("Passa")],
    [#text("TST-CONCAT-003")], [#text("Manual")], [#text("Dada a linha temporal de junção, Quando se remove um clip antes da execução, Então a lista e a duração estimada são atualizadas.")], [#text("REQ-VID-CONCAT-003")], [#text("Passa")],
    [#text("TST-CONCAT-004")], [#text("Misto")], [#text("Dada uma junção de treze ocorrências, Quando o pedido é validado, Então a soma estimada é de 29 s; a interface mostra a duração e atualiza-a ao alterar a sequência.")], [#text("REQ-VID-CONCAT-004")], [#text("Passa")],
    [#text("TST-CONCAT-012")], [#text("Misto")], [#text("Dada uma composição, Quando validada, Então o resumo apresenta as dimensões de apresentação e a taxa de fotogramas do primeiro clip depois das operações próprias; rotação e redimensionamento são considerados.")], [#text("REQ-VID-CONCAT-012")], [#text("Passa")],
    [#text("TST-CONCAT-005")], [#text("Misto")], [#text("Dado um pedido com menos de dois clips, Quando submetido, Então é recusado com INSUFFICIENT_INPUTS, sem tarefa; o botão Executar fica desativado na interface.")], [#text("REQ-VID-CONCAT-005")], [#text("Passa")],
    [#text("TST-CONCAT-006")], [#text("Automático")], [#text("Dada a revisão D-86, Quando se validam onze clips num Registado ou treze num Premium, Então não se aplica o antigo teto dez/cinquenta nem TOO_MANY_INPUTS; a junção simples mantém custo 1. Cenário revisto, não aprovação do critério antigo.")], [#text("REQ-VID-CONCAT-006")], [#text("Passa")],
    [#text("TST-CONCAT-007")], [#text("Automático")], [#text("Dada uma junção cuja soma, contando repetições, excede 300000 ms num Registado, Quando validada, Então é recusada com LIMIT_EXCEEDED antes da admissão e do débito.")], [#text("REQ-VID-CONCAT-007")], [#text("Passa")],
    [#text("TST-CONCAT-008")], [#text("Automático")], [#text("Dados clips 16:9, 9:16 e rodados, a 25 e 30 fps, Quando a junção termina, Então o resultado usa dimensões pares e fps do primeiro clip após a sua subcadeia; as outras proporções têm barras pretas. Worker e integração B008 favoráveis.")], [#text("REQ-VID-CONCAT-008")], [#text("Passa")],
    [#text("TST-CONCAT-009")], [#text("Automático")], [#text("Dados clips com e sem áudio, Quando se juntam, Então os silenciosos recebem silêncio e o áudio é contínuo; se nenhum clip tem áudio, o resultado não tem faixa sonora (precisão D-78). Silêncio inferior a −80 dB verificado no cenário misto.")], [#text("REQ-VID-CONCAT-009")], [#text("Passa")],
    [#text("TST-CONCAT-010")], [#text("Misto")], [#text("Dada uma junção heterogénea com repetição, Quando concluída, Então há um único vídeo MP4/H.264, AAC quando aplicável, com ordem correta e cortes secos. Conteúdo, metadados e reprodução foram verificados.")], [#text("REQ-VID-CONCAT-010")], [#text("Passa")],
    [#text("TST-CONCAT-011")], [#text("Automático")], [#text("Dada uma junção de três passos numa conta Registada, Quando cancelada após progresso positivo, Então não se publica vídeo, os destinos do plano ficam ausentes e os três créditos são devolvidos. Falhas de download e encode também não publicam resultado.")], [#text("REQ-VID-CONCAT-011")], [#text("Passa")],
  ),
)

=== Encadeamento de operações — UC-VID-013

#tab([Testes e resultados — Encadeamento de operações — UC-VID-013],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-CHAIN-001")], [#text("Misto")], [#text("Dado o leitor de um projeto editável, Quando se abre Aplicar várias operações, Então se pode criar uma lista ordenada e configurar doze passos numa conta Premium. A checklist final aprova o percurso.")], [#text("REQ-VID-CHAIN-001")], [#text("Passa")],
    [#text("TST-CHAIN-002")], [#text("Misto")], [#text("Dados os três percursos de composição, Quando se configura a edição, Então as nove operações isoladas usam as configurações próprias e a junção é disponibilizada pela linha temporal/Movie Maker. A conversão só pode terminar a lista principal.")], [#text("REQ-VID-CHAIN-002")], [#text("Passa")],
    [#text("TST-CHAIN-003")], [#text("Automático")], [#text("Dada uma cadeia com alteração de velocidade seguida de recorte, Quando validada, Então os limites do recorte usam a duração estimada à saída do passo anterior; o erro identifica o índice e, se aplicável, clipIndex/stepIndex.")], [#text("REQ-VID-CHAIN-003")], [#text("Passa")],
    [#text("TST-CHAIN-004")], [#text("Misto")], [#text("Dada uma cadeia configurada, Quando se reordenam passos por arrasto ou setas, Então a nova ordem é validada contra as entradas estimadas e o resumo é atualizado.")], [#text("REQ-VID-CHAIN-004")], [#text("Passa")],
    [#text("TST-CHAIN-015")], [#text("Misto")], [#text("Dada uma cadeia, Quando se remove um passo no editor, Então os passos seguintes são revalidados e o custo é recalculado. Verificação manual B008 aprovada.")], [#text("REQ-VID-CHAIN-015")], [#text("Passa")],
    [#text("TST-CHAIN-005")], [#text("Misto")], [#text("Dados três vídeos no Movie Maker, Quando se configuram duas subcadeias diferentes e se deixa a terceira vazia, Então a validação conserva 2/0/2 passos nos clips e a execução produz uma única composição.")], [#text("REQ-VID-CHAIN-005")], [#text("Passa")],
    [#text("TST-CHAIN-006")], [#text("Automático")], [#text("Dada a composição anterior, Quando se acrescentam rotação, marca de água e ajuste após a junção, Então essas três operações incidem sobre o resultado completo; a saída observada é 360×640 e 5 s.")], [#text("REQ-VID-CHAIN-006")], [#text("Passa")],
    [#text("TST-CHAIN-007")], [#text("Automático")], [#text("Dada uma cadeia vazia, Quando validada ou submetida, incluindo a rota com vídeo explícito, Então é recusada com INVALID_CHAIN e regra empty_chain, sem tarefa nem débito.")], [#text("REQ-VID-CHAIN-007")], [#text("Passa")],
    [#text("TST-CHAIN-016")], [#text("Automático")], [#text("Dada uma conversão que não ocupa a última posição da lista principal, Quando validada ou submetida, Então a cadeia é recusada com INVALID_CHAIN/convert_not_last antes da criação da tarefa.")], [#text("REQ-VID-CHAIN-016")], [#text("Passa")],
    [#text("TST-CHAIN-017")], [#text("Automático")], [#text("Dadas duas junções, uma junção aninhada ou uma junção fora da primeira posição principal, Quando validada a cadeia, Então é recusada com INVALID_CHAIN e multiple_concat ou concat_not_first, conforme a regra violada.")], [#text("REQ-VID-CHAIN-017")], [#text("Passa")],
    [#text("TST-CHAIN-008")], [#text("Automático")], [#text("Dada a revisão D-86, Quando um Premium executa doze ou sessenta passos, Então a cadeia não é rejeitada pelo antigo teto de dez nem por CHAIN_TOO_LONG; mantêm-se parâmetros, duração e tamanho do pedido. Cenário revisto.")], [#text("REQ-VID-CHAIN-008")], [#text("Passa")],
    [#text("TST-CHAIN-009")], [#text("Misto")], [#text("Dado o Movie Maker com quatro operações nos clips, uma junção e três operações finais, Quando validado, Então custo e totalSteps são 8; a interface apresenta esse custo antes da execução.")], [#text("REQ-VID-CHAIN-009")], [#text("Passa")],
    [#text("TST-CHAIN-010")], [#text("Automático")], [#text("Dada uma cadeia de doze passos admitida, Quando acompanhada até à conclusão, Então existe um único taskId, kind chain e total_steps 12, respeitando uma tarefa ativa por projeto.")], [#text("REQ-VID-CHAIN-010")], [#text("Passa")],
    [#text("TST-CHAIN-011")], [#text("Automático")], [#text("Dada uma composição concluída, Quando se consulta a galeria e os destinos do plano, Então há um só vídeo final; os clips originais permanecem inalterados e não se publicam vídeos intermédios.")], [#text("REQ-VID-CHAIN-011")], [#text("Passa")],
    [#text("TST-CHAIN-012")], [#text("Automático")], [#text("Dada uma cadeia de três passos, Quando se acompanham os eventos, Então totalSteps é 3 e step varia entre 1 e 3 com o progresso global. O índice é estimado, pois os filtros executam no mesmo grafo.")], [#text("REQ-VID-CHAIN-012")], [#text("Passa")],
    [#text("TST-CHAIN-013")], [#text("Automático")], [#text("Dada uma cadeia de três passos de um Registado cuja origem foi corrompida no ensaio, Quando falha, Então fica failed com PROCESSING_ERROR/encode, sem vídeo nem objetos de saída; os três créditos são devolvidos.")], [#text("REQ-VID-CHAIN-013")], [#text("Passa")],
    [#text("TST-CHAIN-014")], [#text("Misto")], [#text("Dada uma cadeia sem junção, Quando guardada, listada, carregada e renomeada, Então conserva operações e parâmetros; nomes repetidos são recusados e as predefinições de imagem permanecem separadas. API e checklist aprovadas. Gravação acima de dez passos não está coberta por este caso.")], [#text("REQ-VID-CHAIN-014")], [#text("Passa")],
  ),
)

=== Requisitos não funcionais

#tab([Testes e resultados — Requisitos não funcionais],
  tabela(
    colunas: (2.2cm, 1.6cm, 1fr, 2.8cm, 1.6cm),
    tamanho: 8.5pt,
    [ID], [Tipo], [Descrição (Dado… Quando… Então…)], [Requisito(s)], [Resultado],
    [#text("TST-NFR-001")], [#text("Automático")], [#text("Dado um pedido de emissão de URL sem JWT válido, Quando recebido pela API, Então é rejeitado; dado um URL assinado válido, Quando usado diretamente no storage, Então o objeto é servido sem exigir um segundo JWT.")], [#text("REQ-VID-NFR-001")], [Passa],
    [#text("TST-NFR-015")], [#text("Automático")], [#text("Dado um utilizador sem permissão de leitura no projeto, Quando tenta aceder ao vídeo ou URL de transferência, Então o acesso é rejeitado.")], [#text("REQ-VID-NFR-015")], [#text("Passa")],
    [#text("TST-NFR-002")], [#text("Automático")], [#text("Dado o disparo de uma operação de vídeo, Quando inspecionados os logs do Gateway, Projects e Worker Python, Então todos contêm o mesmo correlationId.")], [#text("REQ-VID-NFR-002")], [#text("Passa")],
    [#text("TST-NFR-003")], [#text("Automático")], [#text("Dado um ficheiro cujo contentor e codecs constam da matriz aprovada, Quando validado, Então é aceite; um ficheiro fora da matriz é rejeitado com motivo.")], [#text("REQ-VID-NFR-003")], [#text("Passa")],
    [#text("TST-NFR-016")], [#text("Automático")], [#text("Dada uma transformação sem conversão, Quando inspecionado o resultado, Então é MP4/H.264, com AAC se existir áudio; dada remoção de áudio, Então a contagem de streams de áudio é zero.")], [#text("REQ-VID-NFR-016")], [#text("Passa")],
    [#text("TST-NFR-004")], [#text("Automático")], [#text("Dado um pedido completo válido com vídeo já persistido, Quando aceite, Então a resposta com taskId e queued é recebida em ≤ 1000 ms no intervalo definido; o ensaio regista a carga e o ambiente.")], [#text("REQ-VID-NFR-004")], [#text("Passa")],
    [#text("TST-NFR-005")], [#text("Automático")], [#text("Dada uma transformação ainda em processing, Quando o utilizador abre a página de outro projeto, Então o pedido de navegação recebe resposta sem esperar pelo fim da transformação, cuja tarefa continua ativa.")], [#text("REQ-VID-NFR-005")], [Passa],
    [#text("TST-NFR-006")], [#text("Automático")], [#text("Dado um worker terminado durante a primeira execução, Quando ocorre reentrega, Então a tarefa recomeça do zero; se a segunda entrega também falhar, Então fica failed, sem recurso novo, com créditos devolvidos e temporários limpos.")], [#text("REQ-VID-NFR-006")], [#text("Passa")],
    [#text("TST-NFR-007")], [#text("Automático")], [#text("Dado um vídeo que excede o limite de duração ou tamanho do perfil, Quando validado, Então é rejeitado antes do processamento.")], [#text("REQ-VID-NFR-007")], [#text("Passa")],
    [#text("TST-NFR-017")], [#text("Automático")], [#text("Dado um projeto que já atingiu o limite de tarefas ativas, Quando é submetida outra tarefa, Então o pedido é rejeitado antes do processamento.")], [#text("REQ-VID-NFR-017")], [#text("Passa")],
    [#text("TST-NFR-008")], [#text("Automático")], [#text("Dado um processamento de recorte ou de outra operação de vídeo, Quando inspecionado o tráfego WebSocket, Então são recebidos eventos de progresso pelo menos uma vez por segundo, com percentagem monotonicamente crescente até 100%. O intervalo máximo registado foi de 645 ms no cenário da fundação; não existe medição equivalente para todas as operações reais.")], [#text("REQ-VID-NFR-008")], [#text("Parcial")],
    [#text("TST-NFR-009")], [#text("Automático")], [#text("Dado um novo servidor com Docker instalado, Quando se executa docker compose up, Então os workers de vídeo arrancam sem configuração manual de binários.")], [#text("REQ-VID-NFR-009")], [#text("Passa")],
    [#text("TST-NFR-010")], [#text("Automático")], [#text("Dado o código das ferramentas existentes de imagem em Tools/, Quando os novos workers de vídeo são iniciados, Então nenhuma linha de código das ferramentas de imagem é alterada.")], [#text("REQ-VID-NFR-010")], [#text("Passa")],
    [#text("TST-NFR-011")], [#text("Automático")], [#text("Dado um vídeo produzido por uma operação, Quando inspecionado com FFprobe e descodificado integralmente com FFmpeg -xerror, Então não são reportados erros de descodificação.")], [#text("REQ-VID-NFR-011")], [#text("Passa")],
    [#text("TST-NFR-022")], [#text("Automático")], [#text("Dado um conjunto de vídeos produzidos, Quando abertos nos leitores de referência, Então cada vídeo reproduz do início ao fim. Há reprodução integral em VLC e aprovação manual de alguns percursos; a matriz completa do leitor integrado permanece por validar.")], [#text("REQ-VID-NFR-022")], [#text("Parcial")],
    [#text("TST-NFR-012")], [#text("Automático")], [#text("Dadas junções, subcadeias e cadeias terminadas em MOV/AVI, Quando inspecionados o grafo e os comandos, Então a stream do vídeo final não é recodificada sucessivamente. Os testes do worker verificam uma invocação de codificação; a cópia MP4 AVI é uma saída paralela.")], [#text("REQ-VID-NFR-012")], [#text("Passa")],
    [#text("TST-NFR-018")], [#text("Automático")], [#text("Dada a revisão D-86, Quando uma junção ultrapassa os antigos tetos de quantidade, Então não é rejeitada apenas pelo número de clips. Integração: treze clips num Premium e onze num Registado; ensaio D-88: cem clips curtos.")], [#text("REQ-VID-NFR-018")], [#text("Passa")],
    [#text("TST-NFR-019")], [#text("Automático")], [#text("Dada a revisão D-86, Quando uma cadeia tem mais de dez passos, Então não é rejeitada apenas pela quantidade. Foram executados doze e sessenta passos num Premium; a quota do Registado e o tamanho HTTP continuam a aplicar-se.")], [#text("REQ-VID-NFR-019")], [#text("Passa")],
    [#text("TST-NFR-020")], [#text("Automático")], [#text("Dada uma junção ou composição com duração estimada acima do limite do perfil, Quando validada, Então é recusada com LIMIT_EXCEEDED, incluindo repetições e os passos finais, sem tarefa nem débito.")], [#text("REQ-VID-NFR-020")], [#text("Passa")],
    [#text("TST-NFR-013")], [#text("Automático")], [#text("Dado o painel de filtros aberto, Quando o utilizador seleciona um filtro, Então a pré-visualização é apresentada em ≤ 1 s em 95% dos pedidos.")], [#text("REQ-VID-NFR-013")], [],
    [#text("TST-NFR-014")], [#text("Automático")], [#text("Dado um pedido de descarregamento, Quando o ficheiro é transferido, Então os dados são servidos pelo armazenamento de objetos e não atravessam o API Gateway. O percurso direto dos bytes está comprovado; falta validar um ficheiro de vídeo no limite de 2 GB.")], [#text("REQ-VID-NFR-014")], [#text("Parcial")],
    [#text("TST-NFR-021")], [#text("Automático")], [#text("Dado um descarregamento interrompido, Quando retomado com um pedido HTTP Range, Então o armazenamento responde com HTTP 206 e envia o intervalo solicitado. A resposta HTTP Range está testada; falta o ensaio completo de interrupção, reconstrução e capacidade no limite de 2 GB.")], [#text("REQ-VID-NFR-021")], [#text("Parcial")],
  ),
)



=== Síntese das execuções automáticas e manuais

#tab([Resultados registados na revisão final do Bolt 008], tabela(
  colunas: (4cm, 3.4cm, 1fr), tamanho: 7.8pt,
    [#text("Suite / verificação")], [#text("Resultado")], [#text("Interpretação")],
    [#text("JavaScript de Projetos")], [#text("282/282")], [#text("Inclui 19 testes de composição e regressão unitária B001–B007.")],
    [#text("Worker Python/FFmpeg")], [#text("80/80")], [#text("Oito testes de composição; execução com FFmpeg 5.1.9.")],
    [#text("Funções do frontend")], [#text("68/68 em Node; 8/8 em Bun")], [#text("Há sobreposição entre execuções; não somar como casos independentes.")],
    [#text("Comparação de painéis no navegador")], [#text("9/9; três ações 1/1")], [#text("DOM normalizado em Brave headless/CDP; interação por painel.")],
    [#text("Integração B008")], [#text("15/15")], [#text("Inclui revisão D-86 e ensaios D-88 ativados. A execução histórica anterior tinha 9/9.")],
    [#text("Integrações B007/B005/B004")], [#text("3/3; 16/16; 14/15")], [#text("Mantém-se a falha conhecida do píxel de Brilho de imagem em ARM, 126 em vez de 127.")],
    [#text("Matriz de ficheiros B008 histórica")], [#text("10/10")], [#text("Sete resultados e três cópias MP4: FFprobe, descodificação integral e VLC. Não é uma matriz exaustiva de todos os pedidos posteriores.")],
    [#text("Checklist manual B008")], [#text("Todos os itens aprovados")], [#text("Aprovação final de 23-10-2026; navegador/versão não indicados.")],
))

As contagens referem-se às suites e versões avaliadas, com regressões repetidas. Não constituem uma soma de requisitos validados. A aprovação manual do painel de conversão permite individualizar formato atual, destinos e modo de cópia/recodificação; a reprodução completa de todos os percursos no leitor integrado permanece uma verificação distinta.

=== Medições e observações dos requisitos não funcionais

Os valores de produção não são critérios de aceitação desta fase. Tempos locais sem estudo de carga não permitem garantir desempenho geral. Os IDs seguintes são os do relatório; nos registos de construção, NFR-012 corresponde a NFR-013, NFR-018/019 a NFR-022/023 e NFR-022 a NFR-026.

#tab([Medições face aos alvos MVP e às decisões revistas], tabela(
  colunas: (2.8cm, 3.2cm, 1fr, 2.7cm), tamanho: 7.6pt,
    [#text("Requisito(s)")], [#text("Alvo / condição")], [#text("Valor medido ou observação")], [#text("Apreciação")],
    [#text("REQ-VID-NFR-001")], [#text("JWT de uma hora; rejeição de token inválido/expirado.")], [#text("users/auth/auth.js mantém expiresIn 7d; a sondagem histórica mediu exp−iat = 604800 s, face a 3600 s. Falta individualizar o token corretamente assinado e expirado.")], [#text("Desvio; validação incompleta.")],
    [#text("REQ-VID-NFR-002")], [#text("Mesmo correlationId no percurso.")], [#text("Verificado nos logs de gateway, Projetos e worker e no corpo das mensagens. B008 preserva os contratos.")], [#text("Favorável nos ensaios.")],
    [#text("REQ-VID-NFR-003/016")], [#text("Matriz de entrada e saída; áudio opcional.")], [#text("Ingestão e conversão testadas; B008 produz MP4 e cadeias finais MOV/AVI, incluindo saída silenciosa e cópias de reprodução.")], [#text("Matriz ensaiada.")],
    [#text("REQ-VID-NFR-004")], [#text("Aceitação persistida em ≤1000 ms.")], [#text("B003 20–27 ms; B004 31,6–81,1 ms; B005 p95 34 ms, máximo 154 ms. B008 não regista série equivalente; o tempo started→completed não mede aceitação.")], [#text("Favorável nas amostras anteriores.")],
    [#text("REQ-VID-NFR-005")], [#text("Navegação sem esperar pelo processamento.")], [#text("API e execução desacopladas; falta resultado individualizado de navegação para outro projeto durante processing.")], [#text("Cenário completo pendente.")],
    [#text("REQ-VID-NFR-006")], [#text("Até duas entregas, recuperação e compensação.")], [#text("Quedas induzidas B003; B008 confirma falhas sem resultado e devolução de N créditos, com error.phase. Falha de upload apenas simulada no worker.")], [#text("Ensaios favoráveis, alcance delimitado.")],
    [#text("REQ-VID-NFR-007/017")], [#text("5/60 min, 200 MB/2 GB; uma tarefa ativa/projeto.")], [#text("Validadores e concorrência ensaiados; B008 verifica soma, repetições e duração final. Capacidade física com vídeo de 2 GB não demonstrada.")], [#text("Regras verificadas; capacidade parcial.")],
    [#text("REQ-VID-NFR-008")], [#text("Progresso 0–100%, pelo menos uma vez por segundo.")], [#text("Máximo de 645 ms na fundação B003; B008 confirma totalSteps, avanço estimado e progresso, sem série temporal por todas as operações.")], [#text("Parcial.")],
    [#text("REQ-VID-NFR-009/010")], [#text("Worker Docker e separação dos fluxos de imagem.")], [#text("Build e execução em contentor; regressão de imagem e comparação dos nove painéis. D-87 permite alterações nos painéis de vídeo, não nas ferramentas de imagem originais.")], [#text("Verificação estrutural e regressão delimitadas.")],
    [#text("REQ-VID-NFR-011/022")], [#text("Descodificação sem erros; reprodução completa.")], [#text("18/18 ficheiros B007 e 10/10 B008 históricos em FFprobe/FFmpeg/VLC. Checklist B008 aprova os percursos de utilização; falta matriz integral do leitor com navegador identificado.")], [#text("Técnica favorável; leitor parcialmente validado.")],
    [#text("REQ-VID-NFR-012")], [#text("No máximo uma codificação da stream final por cadeia.")], [#text("Worker B008 verifica um grafo/uma invocação; cadeia AVI gera a cópia MP4 em paralelo. A amostra histórica tem uma invocação em cada uma de sete tarefas concluídas.")], [#text("Favorável nos cenários executados.")],
    [#text("REQ-VID-NFR-013")], [#text("Apresentação da pré-visualização em ≤1 s no p95.")], [#text("API B005: 40 pedidos, p95 22,5 ms, máximo 24,6 ms; miniaturas 20,1 ms. Falta medir alteração do controlo → imagem apresentada, incluindo espera e renderização.")], [#text("Medição completa pendente.")],
    [#text("REQ-VID-NFR-014/015/021")], [#text("S3 direto; URL 900 s; retoma Range até 2 GB.")], [#text("Permissões, assinatura e HTTP 206 com bytes corretos verificados; expiração ensaiada com TTL reduzido. Falta interrupção, reconstrução e integridade de vídeo válido no limite.")], [#text("Percurso/assinatura favoráveis; capacidade parcial.")],
    [#text("REQ-VID-NFR-018/019")], [#text("Sem teto fixo de clips/passos (D-86).")], [#text("Integração: 13 clips e 12 passos; D-88: 100 clips curtos e 60 passos. Não significa capacidade ilimitada nem elimina a quota do Registado.")], [#text("Revisão funcional verificada; risco D-90.")],
    [#text("REQ-VID-NFR-020")], [#text("Duração total limitada pelo perfil.")], [#text("Soma com repetições e duração final verificadas; Registado acima de 300000 ms recusado com LIMIT_EXCEEDED.")], [#text("Favorável nos cenários de fronteira.")],
))

== Limitações e defeitos conhecidos

A conclusão da construção não equivale a demonstração exaustiva dos 202 requisitos. Mantêm-se o desvio de expiração JWT, a falha histórica da imagem de ensaio em ARM e a divergência entre a estrutura de predefinições sem teto e a persistência limitada a dez passos.

A memória das junções cresce com as entradas abertas; os ensaios não são um teste de carga sistemático nem provam capacidade arbitrária. O limite físico de 2 GB e a retoma integral de vídeo válido permanecem por demonstrar. As tolerâncias temporais devem distinguir vídeo, áudio e contentor: a tolerância inferior a 0,12 s usada numa fixture curta de conversão não demonstra igualdade exata de duração.

As validações aqui registadas sustentam os cenários executados e identificam o trabalho remanescente, sem alterar os resultados históricos nem atribuir aprovação a testes por realizar.
