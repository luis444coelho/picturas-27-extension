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

#figure(kind: image,
  figura-pendente[vista de componentes/serviços atualizada, com componentes novos e alterados destacados (`images/arquitetura_componentes.png`)],
  caption: [Vista de componentes da solução com suporte a vídeo (opcional)],
)

#tab([Componentes novos e alterados],
  tabela(
    colunas: (3.2cm, 1.8cm, 1fr, 3cm),
    [Componente / serviço], [Estado], [Responsabilidade / alteração], [Requisitos],
    [#preencher[e.g., api_gateway]], [#preencher[Alterado]], [#preencher[…]], [#preencher[IDs]],
    [#preencher[e.g., novo microserviço de vídeo]], [#preencher[Novo]], [#preencher[…]], [#preencher[IDs]],
  ),
)

== Decisões arquiteturais

#orientacao[
  Registo leve de decisões (ao estilo ADR). Uma decisão só merece registo se havia alternativas reais
  (e.g., processamento síncrono vs. assíncrono via fila; um serviço por ferramenta vs. serviço de vídeo único;
  onde guardar ficheiros de entrada/saída; como reportar progresso ao _frontend_).
]

#tab([Decisões arquiteturais],
  tabela(
    colunas: (1.2cm, 2.6cm, 1fr, 3cm, 2.4cm),
    tamanho: 8.5pt,
    [ID], [Decisão], [Contexto e alternativas consideradas], [Consequências], [Requisitos / DQ],
    [DA-01], [#preencher[…]], [#preencher[…]], [#preencher[…]], [#preencher[IDs]],
  ),
)

== Fluxo de processamento de vídeo

#figure(kind: image,
  figura-pendente[diagrama de sequência entre componentes para o fluxo principal de processamento de um vídeo (`images/sequencia_processamento.png`)],
  caption: [Sequência de processamento de um vídeo entre componentes],
)

#preencher[Explicação do fluxo: pedido, encaminhamento, processamento, armazenamento, notificação de progresso/resultado, falhas.]

== Impacto na instalação e execução

#preencher[Novos serviços/contentores, dependências externas (e.g., binários de processamento de vídeo), volumes, variáveis de configuração. Instruções completas de execução no Anexo A.]
