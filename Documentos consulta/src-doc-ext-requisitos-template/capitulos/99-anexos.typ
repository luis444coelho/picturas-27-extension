#import "../template.typ": *

#set heading(numbering: "A.1.")
#counter(heading).update(0)

= Instruções de execução

== Pré-requisitos

Docker Engine 24 ou superior, Docker Compose v2, Python 3.10 ou superior e um navegador atualizado. Reservar, como referência, 8 GB de RAM e 15 GB de disco livre. A primeira construção requer acesso à Internet. Os comandos seguintes são executados num terminal Bash, na pasta que contém `docker-compose.yaml`.

#show raw.where(block: true): set text(size: 8pt)

== Lançar a solução

```bash
unzip solucao-ext-mvp.zip -d solucao-ext-mvp
cd solucao-ext-mvp
python3 scripts/mvp.py up
python3 scripts/mvp.py prepare
```

Se o arquivo contiver outra pasta de topo, ajustar o comando `cd`. O comando `up` constrói e inicia os serviços necessários ao vídeo; `prepare` cria as contas e gera os vídeos de teste. Para iniciar também todas as ferramentas de imagem, utilizar `docker compose up -d --build`.

Abrir `https://localhost:8080` e aceitar o certificado autoassinado.

== Credenciais e vídeos de exemplo

- *Contas:* são gerados os perfis Registado (`free`) e Premium. Consultar os endereços, palavras-passe e JWT em `artifacts/mvp/environment/accounts.json`. As contas válidas são reutilizadas. O JWT permite testar a API; o login conserva a limitação descrita no Capítulo 11.
- *Vídeos:* disponíveis em `artifacts/mvp/environment/fixtures/<identificador>/`, nos conjuntos `b004`, `b005`, `b007` e `b008`. Incluem MP4, MOV e AVI. Para testes manuais, podem usar-se `b008/wide.mp4` (3 s, com áudio), `b008/tall.mp4` (2 s, sem áudio) e `b008/short.mp4` (cerca de 0,5 s). Os tamanhos efetivos constam de `.generated.json` em cada conjunto.

== Executar os testes automáticos

Com a solução iniciada, executar os testes unitários, de frontend e de integração:

```bash
python3 scripts/mvp.py test \
  --only unit --only frontend --only integration
```

Para repetir apenas um grupo, utilizar, por exemplo, `python3 scripts/mvp.py test --only unit`. O comando `python3 scripts/mvp.py all` reúne arranque, preparação e execução dos quatro grupos, incluindo o de navegador.

Os testes de navegador exigem Node.js 22 ou superior, Chromium e, para comparar os painéis, uma referência anterior. Os testes históricos com preparação própria ficam identificados como não executados. As opções adicionais estão em `docs/executar-testes-mvp.md`.

== Consultar resultados e terminar

O terminal apresenta o progresso e o estado de cada suite. Os registos e os resumos `summary.md` e `summary.json` ficam em `artifacts/mvp/runs/<execução>/`. O código de saída é `0` para sucesso, `1` para falha ou erro e `2` para execução parcial. Testes omitidos não são considerados aprovados; falhas de armazenamento são indicadas no diagnóstico.

Para parar os serviços, preservando os dados, executar `docker compose down`.

= Glossário

#tabela(
  colunas: (4cm, 1fr),
  [Termo], [Definição],
  [ACK], [Confirmação explícita do tratamento de uma mensagem em RabbitMQ. A confirmação manual permite a reentrega quando o consumidor termina antes de concluir o tratamento.],
  [ADR], [Registo de decisão arquitetural, que identifica o contexto, a opção adotada, a justificação e as consequências da decisão.],
  [API Gateway], [Ponto de entrada da API que verifica a autenticação e encaminha os pedidos para os serviços responsáveis. No percurso de vídeo, não transporta os bytes dos ficheiros.],
  [Baseline], [Solução de base fornecida antes do incremento de vídeo, incluindo funcionalidades de imagem e serviços partilhados. Constitui a referência para avaliar compatibilidade e regressões.],
  [Bolt], [Unidade de construção utilizada no processo SpecsMD/AI-DLC, que organiza um incremento por etapas de modelação, desenho, implementação e teste, com pontos de revisão.],
  [Cadeia de operações], [Sequência ordenada de operações validada como um todo e executada numa única tarefa, com publicação apenas do resultado final.],
  [Clip], [Ocorrência de um vídeo numa junção. O mesmo recurso pode ocupar várias posições, com subcadeias diferentes em cada ocorrência.],
  [Codec], [Método de codificação e descodificação de uma faixa audiovisual, como H.264 para vídeo ou AAC para áudio. Distingue-se do contentor do ficheiro.],
  [Compensação], [Ações que repõem condições de consistência após uma falha ou cancelamento, como devolver créditos, remover saídas parciais e libertar o lugar de execução do projeto.],
  [Contentor audiovisual], [Formato que agrega faixas de vídeo, áudio e metadados, como MP4, MOV ou AVI. O contentor não determina, por si só, os codecs presentes.],
  [Contentor Docker], [Instância de execução isolada criada a partir de uma imagem Docker. É utilizado para executar os serviços e as dependências da solução.],
  [Cópia de reprodução], [Ficheiro MP4 associado ao recurso para reprodução compatível no navegador. Não substitui o original nem altera o formato disponibilizado para descarregamento.],
  [Crédito e quota], [Unidade de custo e disponibilidade diária de processamento. Uma operação isolada ou junção custa um crédito; a cadeia inclui os passos principais e os das subcadeias. A reserva já constitui o débito.],
  [ERS], [Especificação de Requisitos do Sistema, que identifica requisitos funcionais e não funcionais e os respetivos critérios de aceitação. Neste relatório, contém 180 requisitos funcionais e 22 não funcionais.],
  [Executor], [Identidade do utilizador que submete uma tarefa. O seu perfil, permissões e créditos condicionam a admissão, mesmo num projeto pertencente a outro utilizador.],
  [FFmpeg / FFprobe], [Ferramentas utilizadas, respetivamente, para transformar conteúdo audiovisual e inspecionar os ficheiros. O worker utiliza a série 5.1, de acordo com a decisão de compatibilidade do projeto.],
  [Filtergraph], [Grafo de filtros FFmpeg que representa as transformações, a normalização e a junção dos fluxos. Permite compor as operações sem recodificações sucessivas da faixa do resultado final.],
  [Fixture], [Ficheiro ou configuração de entrada preparado para um teste reproduzível. Os geradores do projeto produzem vídeos sintéticos com propriedades controladas.],
  [Fotograma-chave], [Fotograma que permite iniciar a descodificação sem depender de fotogramas anteriores. O alinhamento com estes pontos condiciona a possibilidade de recorte por cópia direta.],
  [Idempotência], [Propriedade de um tratamento que evita repetir o mesmo efeito observável quando recebe novamente uma mensagem ou resposta já processada.],
  [Identificador de correlação], [Valor que relaciona um pedido, as mensagens e os registos produzidos pelos serviços, permitindo acompanhar o seu percurso e diagnosticar falhas.],
  [Ingestão], [Processo posterior à transferência que inspeciona o ficheiro, valida formato, codecs e limites e produz metadados, miniaturas e, quando necessária, uma cópia de reprodução.],
  [JWT], [Token assinado que transporta a identidade autenticada e um prazo de validade. É utilizado na autorização dos pedidos e na ligação de eventos da aplicação.],
  [Movie Maker], [Percurso de composição que combina a ordenação de clips, subcadeias por clip e operações sobre o resultado da junção, com submissão de uma tarefa única.],
  [MVP], [Produto mínimo viável correspondente ao âmbito aprovado para a Fase 1. A conclusão da construção não equivale à demonstração exaustiva de todos os critérios de qualidade.],
  [Pré-visualização], [Apresentação antecipada do efeito de uma configuração. Nos ajustes e filtros visuais, pode utilizar uma imagem derivada do fotograma inicial; distingue-se da cópia MP4 de reprodução do recurso.],
  [Perfil de utilizador], [Classificação da conta como anónima, Registado ou Premium. Determina o acesso ao vídeo, os limites de entrada e a quota, sem substituir a verificação das permissões do projeto.],
  [Predefinição], [Configuração privada e reutilizável de uma cadeia sem junção, identificada por um nome. A sua aplicação exige validar os parâmetros face ao vídeo selecionado.],
  [Proveniência e receita], [Informação persistida que identifica os vídeos de origem, a ordem das ocorrências e as operações e parâmetros utilizados para produzir um resultado.],
  [RabbitMQ], [Intermediário de mensagens que desacopla a admissão, a execução e a comunicação de eventos. Os contratos de vídeo utilizam filas próprias.],
  [Reentrega], [Nova entrega de uma mensagem não confirmada. Na política de tarefas de vídeo, admite-se um máximo de duas entregas totais, com reinício do processamento e sem retoma a partir de um ponto intermédio.],
  [S3 / SeaweedFS], [Interface de armazenamento de objetos e serviço compatível utilizado no projeto. Conserva originais, resultados e artefactos auxiliares em objetos com chaves próprias.],
  [Subcadeia], [Sequência de operações aplicada a uma ocorrência de clip antes da junção. As operações posteriores à junção pertencem à cadeia principal.],
  [Trabalho de processamento], [Tarefa assíncrona de transformação identificada por taskId. Os estados canónicos são queued, processing, completed, failed e cancelled; a ingestão possui um ciclo próprio.],
  [URL assinado], [Endereço que concede acesso temporário a um objeto, segundo uma assinatura e um prazo de validade. A emissão é autorizada pela aplicação; o pedido ao objeto utiliza a assinatura.],
  [Utilizador convidado], [Utilizador autenticado que acede a um projeto por partilha, com permissão de leitura ou edição. Distingue-se do utilizador anónimo e conserva os limites e a quota do seu próprio perfil.],
  [WebSocket / Socket.IO], [Canal e biblioteca de comunicação de eventos entre o navegador e o WS Gateway, utilizados para acompanhar progresso e alterações de estado sem recarregar a página.],
  [Worker de vídeo], [Serviço que consome planos, obtém os objetos necessários, executa FFmpeg/FFprobe e publica respostas e progresso. A persistência dos metadados e a publicação do recurso pertencem a Projetos.],
)
