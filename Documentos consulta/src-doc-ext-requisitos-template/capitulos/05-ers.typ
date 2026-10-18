#import "../template.typ": *

// 5.1 e 5.2 em páginas na horizontal (tabelas largas). Para voltar ao vertical, retirar o #paisagem[ ].
#paisagem[
= Especificação de Requisitos do Sistema (ERS)

#orientacao[
  Catálogo único dos requisitos de todas as funcionalidades de vídeo, ordenado por ID. A coluna *Origem* indica o
  caso de uso e o elemento de onde vem cada requisito (e.g., `UC-VID-001, passo 3`, `UC-VID-001/RN1`); um requisito comum a vários casos de uso (e.g.,
  `REQ-VID-SUBMIT-001`) aparece uma só vez, com todas as origens.
  Padrão: _O sistema deve [ação] [objeto] [condição/limite]_. Cada requisito é atómico, verificável,
  inequívoco, sem solução técnica e rastreável. Prioridade segundo MoSCoW (_Must_ / _Should_ / _Could_ / _Won't_).
  *Justificação*: porque é que o requisito é necessário. *Novo/Alt*: NOVO = não existia no PictuRAS;
  ALT = altera algo existente — nesse caso indiquem o elemento de base afetado (e.g., RF13, RNF48, UC04).
]

== Requisitos Funcionais

#tab([Requisitos funcionais],
  tabela(
    colunas: (3.4cm, 1fr, 1.7cm, 1.5cm, 3cm, 4cm, 4.4cm),
    tamanho: 9pt,
    [ID], [Requisito], [Prioridade], [Novo/ Alt], [Origem], [Justificação], [Critério de aceitação],
    [REQ-VID-#preencher[SUBMIT]-001], [O sistema deve #preencher[…].], [#must], [NOVO], [#preencher[UC-VID-001, passo 2; UC-VID-002, passo 2]], [#preencher[…]], [#preencher[Dado… Quando… Então…]],
    [REQ-VID-#preencher[FUNC]-001], [O sistema deve #preencher[…].], [#must], [NOVO], [#preencher[UC-VID-001, passo 3]], [#preencher[…]], [#preencher[Dado… Quando… Então…]],
    [REQ-VID-#preencher[FUNC]-002], [O sistema deve #preencher[…].], [#should], [ALT (#preencher[RFnn])], [#preencher[UC-VID-001/RN1]], [#preencher[…]], [#preencher[Dado… Quando… Então…]],
    [#preencher[…]], [#preencher[…]], [#preencher[…]], [#preencher[…]], [#preencher[UC-VID-002, …]], [#preencher[…]], [#preencher[…]],
  ),
)

== Requisitos Não Funcionais e de Qualidade

#orientacao[
  Classifiquem segundo a ISO/IEC 25010 (Adequação Funcional, Eficiência de Desempenho, Compatibilidade,
  Usabilidade, Fiabilidade, Segurança, Manutenibilidade, Portabilidade). Indiquem o *Alvo*: o valor mensurável
  exigido a uma solução em produção. Prioridade segundo MoSCoW.
]

#tab([Requisitos não funcionais],
  tabela(
    colunas: (3.4cm, 1fr, 3cm, 2.4cm, 1.7cm, 2.4cm, 4.4cm),
    tamanho: 9pt,
    [ID], [Requisito], [ISO/IEC 25010], [Alvo], [Prioridade], [Origem], [Critério de aceitação],
    [REQ-VID-#preencher[FUNC]-010], [O sistema deve #preencher[… com condição mensurável].], [#preencher[Eficiência de Desempenho]], [#preencher[e.g., ≤ 2 s]], [#should], [#preencher[DQ-001]], [#preencher[Dado… Quando… Então…]],
    [#preencher[…]], [#preencher[…]], [#preencher[…]], [#preencher[…]], [#preencher[…]], [#preencher[UC-VID-002, …]], [#preencher[…]],
  ),
)
]

== Verificação da completude e dos limites do âmbito

#orientacao[
  Para cada caso de uso, avaliem os tópicos abaixo. "Não aplicável" ou "fora do âmbito" é aceitável quando
  justificado; isso não obriga a introduzir funcionalidades alheias ao caso de uso.
]

#tab([Verificação da completude],
  tabela(
    colunas: (4.2cm, 2cm, 1.5cm, 1fr, 2.6cm),
    tamanho: 8.5pt,
    [Tópico a verificar], [Caso de uso], [Aplicável?], [Decisão / justificação], [Requisito(s)],
    [Formato, _codec_, duração e dimensão do vídeo], [UC-VID-001], [#preencher[Sim/Não]], [#preencher[…]], [#preencher[IDs / N/A]],
    [], [UC-VID-002], [#preencher[…]], [#preencher[…]], [#preencher[…]],
    [Estado, progresso, cancelamento e resultado], [UC-VID-001], [#preencher[…]], [#preencher[…]], [#preencher[…]],
    [], [UC-VID-002], [#preencher[…]], [#preencher[…]], [#preencher[…]],
    [Falhas durante o processamento], [UC-VID-001], [#preencher[…]], [#preencher[…]], [#preencher[…]],
    [Persistência e expiração dos ficheiros], [UC-VID-001], [#preencher[…]], [#preencher[…]], [#preencher[…]],
    [Perfis e contagem de operações], [UC-VID-001], [#preencher[…]], [#preencher[…]], [#preencher[…]],
    [Encadeamento de ferramentas e processamento em lote], [UC-VID-001], [#preencher[…]], [#preencher[…]], [#preencher[…]],
  ),
)
