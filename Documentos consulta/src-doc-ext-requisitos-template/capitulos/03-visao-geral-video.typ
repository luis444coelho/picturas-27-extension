#import "../template.typ": *

= Visão Geral da Extensão de Vídeo

== Funcionalidades de vídeo do MVP

#orientacao[
  Listem *todas* as funcionalidades de vídeo tratadas no relatório, cada uma com o respetivo caso de uso.
  A especificação detalhada está na Parte II, organizada por artefacto (casos de uso, ERS, impacto, …).
  Não há um número mínimo: valoriza-se a *profundidade, coerência e complexidade adequada* de cada funcionalidade.
  Operações triviais (e.g., gerar uma miniatura a partir de um único fotograma) não são suficientes.
  Requisitos partilhados por várias funcionalidades (e.g., submeter vídeo, acompanhar o estado do processamento)
  devem ser especificados *uma só vez* (e.g., `REQ-VID-SUBMIT-001`, com origem em vários casos de uso).
]

#tab([Funcionalidades de vídeo do MVP],
  tabela(
    colunas: (1fr, 2.1cm, 2.3cm, 2cm, 2.4cm, 2.4cm),
    [Funcionalidade], [Caso de uso], [Prefixo(s) REQ], [Perfis], [Dependências], [Estado de implementação],
    [#preencher[e.g., Recortar um intervalo temporal]], [UC-VID-001], [#preencher[REQ-VID-TRIM]], [#preencher[Reg., Prem.]], [#preencher[REQ-VID-SUBMIT]], [#preencher[Implementada / Parcial / Só especificada]],
    [#preencher[…]], [UC-VID-002], [#preencher[…]], [#preencher[…]], [#preencher[…]], [#preencher[…]],
  ),
)

*Justificação no contexto do MVP.* Para cada funcionalidade: porque é que é das primeiras a valer a pena construir,
que valor entrega e que parte do suporte a vídeo ficaria por validar sem ela.

- *UC-VID-001 — #preencher[nome]*: #preencher[…]
- *UC-VID-002 — #preencher[nome]*: #preencher[…]

== Diagrama de casos de uso (atualizado)

#orientacao[
  *Ponto crítico a atualizar.* O diagrama de base (Figura abaixo) só contém casos de uso de imagem.
  O diagrama atualizado deve:
  - incluir todos os casos de uso UC-VID-nnn (e distinguir visualmente os novos — por exemplo, cor diferente);
  - indicar que perfil (ator) acede a cada um — coerente com as regras de negócio e com a tabela de perfis.
  Podem manter os casos de uso de imagem a cinzento, para dar contexto.
]

#figure(
  image("../images/baseline/diagrama_casos_uso_base.png", width: 85%),
  caption: [Diagrama de casos de uso da solução de base — *a substituir*],
)

#figure(kind: image,
  figura-pendente[diagrama de casos de uso atualizado com as funcionalidades de vídeo (`images/diagrama_casos_uso.png`)],
  caption: [Diagrama de casos de uso atualizado (Fase 1 — vídeo)],
)

#preencher[Texto que explique o diagrama: novos casos de uso, relações e decisões de modelação.]

== Modelo de domínio (atualizado)

#orientacao[
  *Ponto crítico a atualizar.* O modelo de base é centrado em `Imagem`. Com vídeo, pensem (pelo menos) em:
  - Como se relaciona `Vídeo` com `Imagem`? Especialização de um conceito comum (e.g., ficheiro de média),
    ou conceito independente? Que atributos de domínio são relevantes (duração, resolução, formato, …)?
  - Um `Projeto` passa a conter vídeos? Imagens e vídeos misturados?
  - O processamento de vídeo é demorado: há um conceito de *trabalho/pedido de processamento* com estado
    (em fila, em processamento, concluído, falhado, cancelado)? Qual o seu resultado?
  - Que `Ferramenta`s se aplicam a vídeo? As ferramentas de imagem aplicam-se a fotogramas?
  - Como se representam quotas/limites por perfil?
  O modelo de domínio descreve *conceitos do problema*, não classes, tabelas nem microserviços.
  Usem os mesmos termos que nos casos de uso e requisitos (se é "biblioteca", não passa a "galeria").
]

#figure(
  image("../images/baseline/modelo_dominio_base.png", width: 100%),
  caption: [Modelo de domínio da solução de base — *a substituir*],
)

#figure(kind: image,
  figura-pendente[modelo de domínio atualizado (`images/modelo_dominio.png`)],
  caption: [Modelo de domínio atualizado (Fase 1 — vídeo)],
)

#preencher[Texto que explique as alterações ao modelo de domínio e a sua justificação.]

== Regras de negócio transversais

#orientacao[
  Regras que se aplicam a *várias* funcionalidades ficam aqui, com ID global `RNG-nn`
  (e.g., formatos aceites, como o vídeo conta para a quota diária, tempo de retenção de ficheiros).
  As regras específicas de uma funcionalidade ficam no respetivo caso de uso (RN1, RN2, …) e, nas tabelas
  partilhadas por todas as funcionalidades (ERS, impacto, rastreabilidade), escrevem-se qualificadas
  (`UC-VID-001/RN2`). As decisões de qualidade (`DQ-nnn`) estão reunidas no capítulo de Rastreabilidade.
]

#tab([Regras de negócio transversais],
  tabela(
    colunas: (1.6cm, 1fr, 3cm, 3cm),
    [ID], [Regra], [Origem / justificação], [Requisitos],
    [RNG-01], [#preencher[e.g., São aceites vídeos MP4 (H.264) e MOV]], [#preencher[…]], [#preencher[IDs]],
  ),
)

== Convenções de identificação

#tabela(
  colunas: (4.2cm, 1fr),
  [Identificador], [Utilização],
  [UC-VID-nnn], [Caso de uso de vídeo (numeração única no relatório, a partir de UC-VID-001)],
  [REQ-VID-{FUNC}-nnn], [Requisito (funcional ou não funcional); {FUNC} identifica a funcionalidade ou a área do serviço (e.g., TRIM, SUBMIT, STATUS); IDs nunca se reutilizam],
  [RN#emph[k], A#emph[k], Q#emph[k], FA#emph[k]], [Regra, assunção, questão em aberto e fluxo alternativo de um caso de uso (locais ao caso de uso; qualificados, e.g. `UC-VID-001/RN2`, nas tabelas partilhadas)],
  [RNG-nn / DQ-nnn], [Regra de negócio transversal / decisão de qualidade (globais)],
  [DA-nn], [Decisão arquitetural (Capítulo de Arquitetura)],
  [TST-{FUNC}-nn], [Teste (automático ou manual)],
  [T-nn], [Tarefa de manutenção corretiva da solução de base],
  [UCnn, RFnn, RNFnn], [Elementos do documento de requisitos de base (referidos quando são alterados — ALT)],
)
