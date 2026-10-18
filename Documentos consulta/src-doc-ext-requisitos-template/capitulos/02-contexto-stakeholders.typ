#import "../template.typ": *

= Contexto, Perfis e _Stakeholders_ (revisão)

#orientacao[
  Capítulo de *revisão*: só registam o que muda com o vídeo. Não copiem o documento de base.
  - Os *perfis de utilização* (anónimo, registado, premium) continuam válidos? Que limites passam a
    existir para vídeo (duração, tamanho, resolução, nº de operações)? Um vídeo conta como uma operação?
  - Surgem *novos _stakeholders_* ou *interesses novos* nos existentes (e.g., custo de processamento e armazenamento
    para o proprietário do sistema; equipa de operações)?
  - Os _stakeholders_ aqui listados devem ser os mesmos que aparecem na secção "_Stakeholders_ e Interesses"
    de cada caso de uso — usem os mesmos nomes.
]

== Perfis de utilização e vídeo

#tab([Perfis de utilização e respetivo acesso a vídeo],
  tabela(
    colunas: (2.6cm, 4.2cm, 1fr, 2.6cm),
    [Perfil], [Situação na _baseline_], [Alteração introduzida para vídeo], [Regras / requisitos],
    [Anónimo], [Operações limitadas, imagens pequenas], [#preencher[…]], [#preencher[IDs]],
    [Registado], [Gratuito, até 5 operações/dia], [#preencher[…]], [#preencher[IDs]],
    [Premium], [Pago, uso ilimitado], [#preencher[…]], [#preencher[IDs]],
  ),
)

== _Stakeholders_ e interesses

#tab([_Stakeholders_ e interesses (novos ou revistos)],
  tabela(
    colunas: (3cm, 2cm, 1fr, 2cm, 2.6cm),
    [_Stakeholder_], [Estado], [Interesse(s) relativamente ao vídeo], [Influência], [UC / requisitos],
    [#preencher[e.g., Utilizador Registado]], [Revisto], [#preencher[…]], [#preencher[Alta]], [#preencher[UC-VID-001]],
    [#preencher[e.g., Proprietário do sistema]], [#preencher[Novo]], [#preencher[custo de processamento/armazenamento]], [#preencher[…]], [#preencher[…]],
  ),
)

== Elicitação de requisitos

#orientacao[
  Um parágrafo: como chegaram às funcionalidades, regras e valores-alvo (e.g., análise da solução existente,
  _benchmarking_, entrevistas, assunções registadas), com quem, e que resultados concretos produziu (IDs).
  Os valores numéricos dos requisitos (limites, tempos) devem ter origem identificável.
]

#preencher[…]
