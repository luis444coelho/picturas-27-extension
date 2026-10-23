#import "../template.typ": *

= Introdução

#orientacao[
  Uma a duas páginas, no máximo. Devem responder a:
  - *Propósito do incremento*: que suporte a vídeo foi acrescentado ao PictuRAS e porquê (lógica de MVP).
  - *_Baseline_*: em que versão do sistema se basearam — documento de requisitos, documento de solução
    arquitetural e repositório base (indicar _commit_ de partida).
    Este relatório *estende* esses documentos; não os reescreve.
  - *Resumo do que foi feito*: funcionalidades especificadas e respetivo estado de implementação (remeter para a Tabela do Capítulo 3).
  - *Organização do documento*: Parte I (transversal), Parte II (especificação: casos de uso, ERS, impacto,
    rastreabilidade), Parte III (arquitetura, IA, testes).
]

== Propósito do incremento

O PictuRAS é uma plataforma de manipulação gráfica orientada ao ecossistema web, concebida originalmente em exclusivo para o processamento, transformação e gestão de imagens estáticas. O presente incremento — desenvolvido no âmbito da Fase 1 da unidade curricular de Requisitos e Arquiteturas de Software — tem por propósito estender a plataforma com capacidades nativas de suporte a vídeo digital, numa estrita lógica de *Produto Mínimo Viável (MVP)*.

O incremento especifica o ciclo de vida do vídeo no projeto — carregamento, validação, consulta, reprodução e descarregamento — e as operações de edição, junção e encadeamento. O âmbito funcional está organizado em 14 casos de uso (`UC-VID-000` a `UC-VID-013`), com requisitos transversais de autorização, tarefas assíncronas, quotas, armazenamento e tratamento de erros. A Fase 1 fixa o comportamento esperado e os critérios de aceitação do MVP; não é apresentada como implementação validada.

A extensão a vídeo digital segue o princípio da *preservação não destrutiva*: os ficheiros originais carregados para os projetos permanecem imutáveis e cada transformação concluída produz um novo vídeo, associado ao projeto e aos recursos de origem.


== _Baseline_ e repositório

O incremento parte do repositório PictuRAS entregue para a unidade curricular e dos artefactos de requisitos e solução arquitetural da baseline v27.1.

#tabela(
  colunas: (5.2cm, 1fr),
  [Artefacto], [Versão / Referência],
  [Documento de requisitos de base], [doc-ext-requisitos.pdf (especificação de requisitos da versão anterior)],
  [Documento de solução arquitetural de base], [doc-sol-arquitetural.pdf (descrição da arquitetura existente)],
  [Repositório de partida], [#link("https://github.com/picturas-um/picturas-27")[github.com/picturas-um/picturas-27] \ (commit 781a63ebc453b45aed2fcf2afac6adc6380c7c7d)],
  [Repositório da solução desenvolvida], [#link("https://github.com/luis444coelho/picturas-27-extension")[github.com/luis444coelho/picturas-27-extension] \ (Entrega: solucao-ext-mvp.zip)],
  [Documento de extensão de requisitos], [doc-ext-requisitos.pdf (compilado a partir das fontes Typst em src-doc-ext-requisitos.zip)],
  caption: [Artefactos de referência e identificação da solução desenvolvida.],
)

== Resumo do que foi feito

A Fase 1 produziu a especificação consolidada das 14 funcionalidades de vídeo, a ERS com 180 requisitos funcionais e 22 requisitos não funcionais, os diagramas atualizados, regras de negócio transversais, a análise de impacto e as matrizes de rastreabilidade. Os requisitos mantêm critérios de aceitação verificáveis e as decisões de qualidade remetem para os limites e políticas definidos na documentação. 

== Organização do documento

O presente relatório encontra-se estruturado em três partes complementares, espelhando a transição metodológica desde o enquadramento do problema até à evidência de validação:

- *Parte I — Enquadramento e visão transversal*: Apresenta o propósito do incremento, a revisão contextual de perfis e _stakeholders_ e a visão global da extensão de vídeo, incluindo o resumo das funcionalidades, o modelo conceptual atualizado e as regras de negócio transversais (Capítulos 1 a 3).
- *Parte II — Especificação das funcionalidades de vídeo*: Reúne os casos de uso detalhados, a Especificação de Requisitos do Sistema (ERS), a análise sistemática de impacto na solução existente e as matrizes completas de rastreabilidade e decisões de qualidade (Capítulos 4 a 7).
- *Parte III — Arquitetura, IA e validação*: Descreve o delta da solução arquitetural, a metodologia e evidências do desenvolvimento assistido por agentes de IA, a bateria de testes de validação do MVP, as tarefas de manutenção corretiva da _baseline_ e as conclusões e perspetivas de evolução para a Fase 2 (Capítulos 8 a 12), complementadas pelos anexos operacionais.
