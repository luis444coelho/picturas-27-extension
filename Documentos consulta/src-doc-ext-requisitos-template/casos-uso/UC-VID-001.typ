#import "../template.typ": *

// =============================================================================
//  CASO DE USO — um ficheiro por caso de uso (UC-VID-001.typ, UC-VID-002.typ, …).
//  Copiar este ficheiro e acrescentar o #include em capitulos/04-casos-de-uso.typ.
//  Os requisitos derivados deste caso de uso vão para as tabelas partilhadas dos
//  capítulos seguintes (ERS, impacto, rastreabilidade).
// =============================================================================

== UC-VID-001 — #preencher[nome]

=== Cabeçalho

#tab([Caso de uso UC-VID-001 — #preencher[nome]],
  tabela-campos(
    [ID do Caso de Uso], [UC-VID-001],
    [Nome], [#preencher[…]],
    [Versão], [#preencher[v1.2]],
    [Autor], [#preencher[…]],
    [Data], [#preencher[AAAA-MM-DD]],
    [Objetivo], [#preencher[o que o ator consegue alcançar]],
    [Âmbito], [#preencher[módulo/componente do PictuRAS afetado]],
    [Ator Principal], [#preencher[ator + perfil de utilização]],
    [_Stakeholders_ e Interesses], [
      - *#preencher[stakeholder]*: #preencher[interesse]
      - *#preencher[stakeholder]*: #preencher[interesse]
    ],
    [Pré-condições], [
      - #preencher[…]
    ],
    [_Trigger_], [#preencher[o que dá início ao caso de uso]],
  ),
)

=== Fluxo Principal

#tab([UC-VID-001 — Fluxo principal],
  tabela(
    colunas: (1.2cm, 1fr, 1fr),
    [Passo], [Ação do Ator], [Resposta do Sistema],
    [1], [#preencher[…]], [#preencher[…]],
    [2], [#preencher[…]], [—],
    [3], [—], [#preencher[…]],
  ),
)

=== Fluxos Alternativos

#tab([UC-VID-001 — Fluxos alternativos],
  tabela(
    colunas: (4cm, 1fr),
    [Fluxo], [Descrição (passo de origem: condição → comportamento → retorno)],
    [FA1 – #preencher[nome]], [#preencher[…]],
  ),
)

=== Exceções

#orientacao[Incluam pelo menos uma exceção específica de vídeo (formato/_codec_ não suportado, duração ou tamanho excedidos, falha a meio do processamento, quota esgotada, …).]

#tab([UC-VID-001 — Exceções],
  tabela(
    colunas: (1fr, 1fr),
    [Condição], [Comportamento do Sistema],
    [#preencher[…]], [#preencher[…]],
  ),
)

=== Pós-condições

#tabela(
  colunas: (4cm, 1fr),
  [Tipo], [Resultado],
  [Garantia de Sucesso], [#preencher[estado do sistema quando tudo corre bem]],
  [Garantia Mínima], [#preencher[estado do sistema quando falha]],
)

=== Regras de Negócio e Restrições

#tabela(
  colunas: (1.4cm, 1fr),
  [ID], [Regra],
  [RN1], [#preencher[e.g., utilizador registado limitado a vídeos de duração ≤ X s]],
)

=== Assunções

#tabela(
  colunas: (1.4cm, 1fr),
  [ID], [Assunção],
  [A1], [#preencher[…]],
)

=== Questões em Aberto

#orientacao[Na entrega, cada questão deve estar resolvida (indicar a decisão e onde ficou registada: RN, assunção, DQ, requisito) ou justificadamente adiada.]

#tabela(
  colunas: (1.4cm, 1fr, 5cm),
  [ID], [Questão], [Resolução],
  [Q1], [#preencher[…]], [#preencher[decidida → RN3 / adiada para Fase 3 / …]],
)
