#import "../template.typ": *

= Introdução

#orientacao[
  Uma a duas páginas, no máximo. Devem responder a:
  - *Propósito do incremento*: que suporte a vídeo foi acrescentado ao PictuRAS e porquê (lógica de MVP).
  - *_Baseline_*: em que versão do sistema se basearam — documento de requisitos, documento de solução
    arquitetural e repositório base (indicar _commit_ de partida).
    Este relatório *estende* esses documentos; não os reescreve.
  - *Resumo do que foi feito*: funcionalidades especificadas e implementadas (remeter para a Tabela do Capítulo 3).
  - *Organização do documento*: Parte I (transversal), Parte II (especificação: casos de uso, ERS, impacto,
    rastreabilidade), Parte III (arquitetura, IA, testes).
]

== Propósito do incremento

O PictuRAS é uma plataforma de manipulação gráfica orientada ao ecossistema web, concebida originalmente em exclusivo para o processamento, transformação e gestão de imagens estáticas. O presente incremento — desenvolvido no âmbito da Fase 1 da unidade curricular de Requisitos e Arquiteturas de Software — tem por propósito estender a plataforma com capacidades nativas de suporte a vídeo digital, numa estrita lógica de *Produto Mínimo Viável (MVP)*.

O foco primordial desta fase reside na validação funcional das novas capacidades multimédia de vídeo: a ingestão estruturada e segura de ficheiros contínuos de grande porte, a reprodução integrada com controlos interativos, e a execução assíncrona de um conjunto representativo de transformações temporais e espaciais (recorte de intervalos, remoção de faixas sonoras, alteração de cadência de reprodução, sobreposição de marcas de água autorais e extração discreta de fotogramas). Numa ótica de MVP, o objetivo é aferir a viabilidade da arquitetura e das interfaces perante fluxos audiovisuais, sem impor prematuramente metas de alta disponibilidade, clusterização elástica ou garantias industriais de desempenho em escala de produção (aspetos diferidos para a Fase 2).

Crucialmente, a extensão a vídeo digital é desenhada segundo o princípio da *preservação não destrutiva*: os ficheiros de vídeo originais carregados para os projetos permanecem rigorosamente imutáveis, gerando-se novos recursos a cada transformação ou alimentando diretamente as ferramentas de imagem já existentes na plataforma através da extração de fotogramas discretos.

== _Baseline_ e repositório

O desenvolvimento deste incremento não reescreve a plataforma PictuRAS; antes assume a arquitetura de microserviços e o repositório base pré-existente como ponto de partida imutável da _baseline_, descrevendo e especificando com rigor as extensões e deltas introduzidos.

#tab([Artefactos da _baseline_ e referências de projeto],
  tabela(
    colunas: (5.2cm, 1fr),
    [Artefacto], [Versão / referência],
    [Documento de requisitos de base], [doc-ext-requisitos.pdf (PictuRAS v27.1)],
    [Documento de solução arquitetural de base], [doc-sol-arquitetural.pdf (PictuRAS v27.1)],
    [Repositório de partida], [Branch `main` do repositório `picturas-27-extension`],
    [Solução entregue], [solucao-ext-mvp.zip (entrega formal da Fase 1)],
  ),
)

== Resumo do que foi feito

No âmbito da Fase 1, a equipa executou o ciclo de engenharia completo — desde a elicitação e análise de requisitos até à modelação arquitetural, implementação assistida por agentes de IA e verificação formal por testes:

1. *Especificação Funcional*: Definição detalhada de 6 casos de uso (`UC-VID-000` a `UC-VID-005`), estabelecendo o fluxo fundacional de ingestão e reprodução e 5 ferramentas nucleares de manipulação de vídeo, sintetizadas na Tabela do Capítulo 3.
2. *Derivação Atómica da ERS*: Elaboração de 87 requisitos funcionais atómicos regidos pela formulação canónica _"O sistema deve..."_ e critérios de aceitação no formato _Dado... Quando... Então..._, acompanhados de 11 requisitos não funcionais classificados segundo a norma ISO/IEC 25010 (com distinção explícita entre Alvo MVP e Alvo Produção).
3. *Modelação Conceptual*: Revisão estrutural do Diagrama de Casos de Uso e do Modelo de Domínio para acomodar fluxos temporais contínuos, agregados mistos de projeto e tarefas assíncronas governadas por máquinas de estados.
4. *Desenho Arquitetural e Implementação*: Conceção de novos nós de processamento em Python baseados em FFmpeg desacoplados via contratos de mensagens AMQP (RabbitMQ), garantindo a continuidade operacional e a rastreabilidade ponta a ponta sem degradação das ferramentas de imagem legadas.

== Organização do documento

O presente relatório encontra-se estruturado em três partes complementares, espelhando a transição metodológica desde o enquadramento do problema até à evidência de validação:

- *Parte I — Enquadramento e visão transversal*: Apresenta o propósito do incremento, a revisão contextual de perfis e _stakeholders_ e a visão global da extensão de vídeo, incluindo o resumo das funcionalidades, o modelo conceptual atualizado e as regras de negócio transversais (Capítulos 1 a 3).
- *Parte II — Especificação das funcionalidades de vídeo*: Reúne os casos de uso detalhados, a Especificação de Requisitos do Sistema (ERS), a análise sistemática de impacto na solução existente e as matrizes completas de rastreabilidade e decisões de qualidade (Capítulos 4 a 7).
- *Parte III — Arquitetura, IA e validação*: Descreve o delta da solução arquitetural, a metodologia e evidências do desenvolvimento assistido por agentes de IA, a bateria de testes de validação do MVP, as tarefas de manutenção corretiva da _baseline_ e as conclusões e perspetivas de evolução para a Fase 2 (Capítulos 8 a 12), complementadas pelos anexos operacionais.
