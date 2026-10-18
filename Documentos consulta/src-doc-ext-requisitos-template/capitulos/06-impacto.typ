#import "../template.typ": *

= Impacto no Sistema Existente

#orientacao[
  Que elementos do PictuRAS existente (perfis, quotas, armazenamento, biblioteca, encadeamento, lote,
  exportação, …) e do documento de requisitos de base (UCnn, RFnn, RNFnn) são afetados pelas funcionalidades
  de vídeo. Para cada elemento: *Manter* (fica igual), *Estender* (passa a fazer mais) ou *Alterar* (muda o
  comportamento atual). Incluam todos os requisitos ALT e os NOVO que interagem com mecanismos existentes.
  Se duas funcionalidades afetam o mesmo elemento de forma diferente, há uma inconsistência a resolver aqui.
]

#tab([Impacto no sistema existente],
  tabela(
    colunas: (3.4cm, 1.9cm, 1fr, 2.1cm, 2.8cm),
    tamanho: 8.5pt,
    [Elemento existente afetado], [Impacto], [Descrição do impacto], [Caso(s) de uso], [Requisitos],
    [#preencher[e.g., Limite diário de operações (RNF48)]], [#preencher[Manter / Estender / Alterar]], [#preencher[…]], [#preencher[UC-VID-001, UC-VID-002]], [#preencher[IDs]],
    [#preencher[e.g., Encadeamento de ferramentas (UCnn)]], [#preencher[…]], [#preencher[…]], [#preencher[…]], [#preencher[…]],
  ),
)
