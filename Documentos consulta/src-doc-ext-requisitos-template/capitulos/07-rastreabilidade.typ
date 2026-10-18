#import "../template.typ": *

= Rastreabilidade

== Casos de uso → requisitos

#orientacao[
  Cada elemento relevante de cada caso de uso (passos, FA, exceções, RN, pós-condições) tem pelo menos um
  requisito, ou justificação para não ter; nenhum requisito da ERS fica órfão. Requisitos de qualidade podem
  apontar para uma decisão de qualidade (DQ). Indiquem sempre o caso de uso no elemento de origem.
]

#tab([Matriz de rastreabilidade: casos de uso → requisitos],
  tabela(
    colunas: (4cm, 1fr, 4.5cm),
    [Elemento de origem], [Descrição abreviada], [Requisito(s)],
    [UC-VID-001, passo 3], [#preencher[…]], [REQ-VID-#preencher[FUNC]-001],
    [UC-VID-001/RN1], [#preencher[…]], [#preencher[…]],
    [UC-VID-001, pós-condição de sucesso], [#preencher[…]], [#preencher[…]],
    [UC-VID-002, #preencher[…]], [#preencher[…]], [#preencher[…]],
  ),
)

== Decisões de qualidade

#tab([Decisões de qualidade],
  tabela(
    colunas: (1.6cm, 1fr, 4cm, 2.8cm),
    [ID], [Decisão de qualidade], [Justificação], [Requisitos],
    [DQ-001], [#preencher[e.g., O processamento de vídeo é assíncrono]], [#preencher[…]], [#preencher[IDs]],
  ),
)

== Realização e verificação dos requisitos

#orientacao[
  Fecha o ciclo *requisito → componente → teste → estado*. Uma linha por requisito da ERS (podem agrupar
  requisitos com o mesmo destino). Deve ser possível responder a: "que requisitos estão implementados e
  verificados?" e "que componentes foram tocados por cada funcionalidade?". Requisitos não implementados não se
  apagam: ficam com estado "Não implementado" e justificação. Os detalhes estão nos capítulos de Arquitetura e de Testes.
]

#tab([Realização e verificação dos requisitos],
  tabela(
    colunas: (2.6cm, 3.2cm, 2.4cm, 2.2cm, 1fr),
    tamanho: 8.5pt,
    [Requisito], [Componente(s)], [Estado], [Teste(s)], [Resultado / observações],
    [REQ-VID-#preencher[FUNC]-001], [#preencher[e.g., serviço de recorte, frontend]], [#preencher[Implementado / Parcial / Não impl.]], [TST-#preencher[FUNC]-01], [#preencher[Passa / Falha; …]],
    [REQ-VID-#preencher[FUNC]-010], [#preencher[…]], [#preencher[…]], [#preencher[…]], [#preencher[…]],
  ),
)
