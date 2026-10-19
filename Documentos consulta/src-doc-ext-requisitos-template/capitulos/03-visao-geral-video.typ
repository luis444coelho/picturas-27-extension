#import "../template.typ": *

= Visão Geral da Extensão de Vídeo

== Objetivos e funcionalidades do MVP

A Fase 1 tem como objetivo alargar o espaço de trabalho do PictuRAS, originalmente orientado para imagens, para que um projeto possa integrar imagens e vídeos e suportar operações de vídeo com resultados persistidos no próprio projeto. A extensão cobre o ciclo que vai da entrada e consulta do vídeo à edição, composição, acompanhamento do processamento e obtenção do resultado. Inclui ainda a passagem entre os domínios de vídeo e imagem através da extração de fotogramas. O diagrama de casos de uso representa os 16 objetivos funcionais identificados; os requisitos associados especificam as validações, limites, exceções e comportamento partilhado. No código analisado não foi identificada implementação destas funcionalidades; o estado do incremento é, portanto, especificado, com implementação por realizar.

Os casos de uso de consulta e descarregamento são distinguíveis das operações que submetem processamento: consultar informações e descarregar não consomem quota; o carregamento e a reprodução também não. A edição requer permissão de edição no projeto, enquanto a consulta e o descarregamento admitem permissão de leitura. Os perfis Registado e Premium podem executar os casos de uso de vídeo, sujeitos aos limites e à política de quota correspondentes. A tabela resume cada objetivo e as suas dependências funcionais; os prefixos indicam os requisitos específicos, complementados pelos requisitos transversais `COM`, `AUTH`, `TASK`, `QUOTA`, `STORAGE`, `ERROR` e `NFR` quando aplicáveis.

#tab([Objetivos funcionais de vídeo do MVP e respetivos casos de uso],
  tabela(
      colunas: (2fr, 1fr, 1.1fr, 1.6fr),
      tamanho: 8.5pt,
      [Caso de uso e objetivo], [Prefixo principal], [Perfis], [Dependência funcional],
      [UC-VID-000 — Carregar e visualizar um vídeo], [UPLOAD], [Registado, Premium], [Projeto com permissão de edição],
      [UC-VID-001 — Recortar um intervalo temporal], [TRIM], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-002 — Remover a faixa de áudio], [AUDIO], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-003 — Alterar a velocidade], [SPEED], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-004 — Aplicar marca de água], [WATERMARK], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-005 — Extrair fotogramas como imagens], [FRAMES], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-006 — Descarregar um vídeo], [DOWNLOAD], [Registado, Premium], [Vídeo no projeto; permissão de leitura],
      [UC-VID-007 — Consultar informações do vídeo], [INFO], [Registado, Premium], [Vídeo no projeto; permissão de leitura],
      [UC-VID-008 — Ajustar propriedades visuais], [ADJUST], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-009 — Aplicar um filtro visual], [FILTER], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-010 — Redimensionar um vídeo], [RESIZE], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-011 — Rodar ou espelhar um vídeo], [ORIENT], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-012 — Converter o formato], [CONVERT], [Registado, Premium], [Vídeo no projeto; permissão de edição],
      [UC-VID-013 — Juntar vários vídeos], [CONCAT], [Registado, Premium], [Dois ou mais vídeos compatíveis; edição],
      [UC-VID-014 — Encadear operações], [CHAIN], [Registado, Premium], [Vídeo(s) no projeto; até 10 passos válidos],
      [UC-VID-015 — Processar vídeos em lote], [BATCH], [Registado, Premium], [Lote dentro dos limites do perfil],
  ),
)

*Justificação dos objetivos no contexto do MVP.* Os objetivos formam um percurso coerente de utilização e exercitam capacidades com complexidade própria, em vez de se limitarem a operações triviais. `UC-VID-000` estabelece a entrada do recurso e a sua consulta no projeto. `UC-VID-001` a `UC-VID-004` abrangem edição temporal, áudio e composição visual; `UC-VID-005` transforma fotogramas em recursos de imagem do projeto, ligando o novo fluxo ao domínio já existente. `UC-VID-006` e `UC-VID-007` permitem obter o ficheiro e os seus dados sem iniciar uma transformação. `UC-VID-008` a `UC-VID-012` cobrem ajustes, filtros, dimensões, orientação e conversão de formato. Por fim, `UC-VID-013` trata a composição de vários vídeos, `UC-VID-014` organiza operações numa cadeia validada e `UC-VID-015` aplica operações a um conjunto de vídeos. As tarefas assíncronas, estados, validação de parâmetros, quota e tratamento de falhas são preocupações transversais especificadas uma vez nos requisitos comuns, embora sejam acionadas por vários destes casos.

== Diagrama de casos de uso

#figure(
  image("../images/diagrama_casos_uso.png", width: 100%),
  caption: [Diagrama consolidado de casos de uso: funcionalidades da baseline e extensão de vídeo],
)

O diagrama mantém em cinzento os casos de uso da baseline e identifica a azul os casos de uso novos `UC-VID-000` a `UC-VID-015`. A herança entre `Utilizador Convidado`, `Premium` e `Utilizador` representa os perfis já existentes. Os quatro símbolos com a designação “Utilizador autenticado (Registado ou Premium)” são repetições gráficas do mesmo ator, agrupadas para reduzir cruzamentos: respetivamente, representam ciclo de vida e acesso (`UC-VID-000`, `006`, `007`), edição temporal e extração (`001`–`005`), edição visual e formato (`008`–`012`) e composição/processamento (`013`–`015`).

Esta distribuição é coerente com a tabela e com as permissões descritas nos casos de uso: ambos os perfis autenticados podem iniciar os casos de vídeo, mas cada operação continua sujeita à autorização do projeto. O carregamento e a reprodução não debitam quota; a consulta e o descarregamento são operações de leitura sem custo; as transformações, cadeias e lotes seguem os custos definidos nas regras transversais e nos casos correspondentes. A extração de fotogramas cria imagens no projeto. O diagrama representa o acesso dos atores aos casos de uso; os pormenores de autorização, sequência e custo são especificados nos requisitos e nos casos de uso, não através de relações UML implícitas entre elipses.

== Modelo de domínio

#figure(
  image("../images/modelo_dominio.png", width: 100%),
  caption: [Modelo de domínio da baseline atualizado com os conceitos da extensão de vídeo],
)

O modelo preserva as entidades e relações da baseline e acrescenta apenas os conceitos necessários à extensão: `Recurso multimédia`, `Vídeo`, `Trabalho de processamento` e `Ferramenta de vídeo`. É um diagrama conceptual de entidades e relações. Não apresenta atributos, métodos, estados internos nem componentes tecnológicos; estes detalhes, quando necessários, são definidos nos requisitos e casos de uso.

*Relação entre Vídeo e Imagem.* `Recurso multimédia` generaliza `Imagem` e `Vídeo`, que são especializações do recurso integrado num projeto. Assim, partilham o contexto de carregamento e pertença ao projeto sem se confundirem: uma imagem é um recurso estático e um vídeo é um recurso audiovisual contínuo. A relação `Vídeo origina fotogramas Imagem` representa a extração prevista em `UC-VID-005`. Os dados técnicos, como duração, resolução, formato, codecs e taxa de fotogramas, são relevantes para validação e consulta, mas não são desenhados como atributos neste modelo.

*Projetos mistos.* `Projeto` contém `Recurso multimédia`; por consequência, pode conter imagens e vídeos no mesmo espaço de trabalho, incluindo imagens originadas por extração e vídeos produzidos por operações. A associação `Projeto usa Ferramenta` mantém a relação da baseline, e `Ferramenta de vídeo` especializa `Ferramenta` para identificar as operações aplicáveis ao vídeo. A relação entre ferramenta e vídeo não elimina as ferramentas de imagem: a extração cria entidades `Imagem`, sobre as quais se aplicam as ferramentas existentes.

*Trabalho assíncrono e resultado.* `Trabalho de processamento` é registado num projeto, submetido por um utilizador, processa um ou mais vídeos, executa uma ou mais ferramentas de vídeo e pode produzir recursos multimédia. Esta estrutura cobre operações isoladas, encadeamento e processamento em lote, bem como resultados de vídeo e imagens extraídas. O diagrama não desenha estados do trabalho nem o ciclo de vida temporal. Os estados `queued`, `processing`, `completed`, `failed` e `cancelled`, o progresso, o cancelamento e as condições de persistência são especificados nos requisitos transversais de tarefas e nos casos de uso.

*Ferramentas e quotas.* A especialização `Ferramenta de vídeo` torna explícito o catálogo de operações de vídeo; as ferramentas da baseline continuam associadas à edição de imagens. Cadeias e lotes são formas de composição/submissão de trabalhos descritas nos casos `UC-VID-014` e `UC-VID-015`, não entidades adicionais no diagrama atual. Também não existe neste modelo uma entidade de quota ou conta: os limites por perfil, a reserva e confirmação de créditos e as regras de custo são políticas transversais documentadas abaixo e nos requisitos de quota. Esta distinção evita atribuir ao desenho conceitos que ele não representa.

== Regras de negócio transversais

As regras seguintes reúnem políticas aplicáveis a mais do que um caso de uso. As validações particulares de parâmetros e fluxos alternativos permanecem nos respetivos casos. Os limites por perfil e os formatos são resumidos aqui; os requisitos `REQ-VID-*` e as decisões `DQ-*` constituem a referência detalhada para os critérios e exceções.

#tab([Regras de negócio transversais da extensão de vídeo],
  tabela(
      colunas: (1.35cm, 1.45fr, 1fr, 1.25fr),
      tamanho: 8pt,
      [ID], [Regra], [Fundamento], [Requisitos relacionados],
      [RNG-01], [A entrada aceita MP4 e MOV com vídeo H.264 e áudio AAC; AVI admite H.264 ou MPEG-4 Part 2 e áudio AAC ou MP3, de acordo com a matriz definida. As operações produzem MP4 (H.264/AAC); a conversão pode produzir os formatos de saída admitidos pela matriz. A extração produz imagens JPEG ou PNG.], [Compatibilidade dos ficheiros e interoperabilidade com o reprodutor; ver DQ-002 e DQ-013.], [REQ-VID-NFR-003, REQ-VID-NFR-004, prefixo REQ-VID-CONVERT],
      [RNG-02], [Os limites de entrada dependem do perfil: Registado, até 5 minutos e 200 MB; Premium, até 60 minutos e 2 GB. A extração está limitada a 50 fotogramas para Registado e 500 para Premium.], [Controlo de capacidade e coerência entre perfil, carregamento e extração.], [Prefixos REQ-VID-UPLOAD e REQ-VID-FRAMES; REQ-VID-NFR-008],
      [RNG-03], [A quota aplica-se ao utilizador que submete o trabalho, mesmo num projeto partilhado. Registado dispõe de 5 créditos diários; Premium não tem quota diária. Reserva-se o custo total na aceitação e confirma-se apenas o custo correspondente a trabalho concluído; falhas e cancelamentos devolvem os créditos não consumidos.], [Cobrança previsível e associada ao executor; ver DQ-001, DQ-008 e DQ-014.], [REQ-VID-QUOTA-001 a 008],
      [RNG-04], [Carregamento, reprodução, consulta de informações e descarregamento não consomem quota. Uma operação isolada ou junção custa 1 crédito; uma cadeia custa um crédito por passo; num lote, o custo é multiplicado pelo número de vídeos concluídos.], [Diferenciação entre acesso ao recurso e processamento; custo transparente antes da submissão.], [Prefixos REQ-VID-UPLOAD, REQ-VID-DOWNLOAD e REQ-VID-INFO; REQ-VID-QUOTA-008],
      [RNG-05], [As transformações decorrem como tarefas assíncronas com estados `queued`, `processing`, `completed`, `failed` ou `cancelled`. O projeto admite no máximo uma tarefa ativa de vídeo. Cadeias e lotes mantêm um estado agregado e disponibilizam o progresso adequado à sua composição.], [Manter a interação disponível durante trabalhos demorados e limitar concorrência.], [REQ-VID-TASK-001 a 007, REQ-VID-NFR-005 a 009],
      [RNG-06], [A edição é não destrutiva: o recurso de origem mantém-se e o resultado bem-sucedido é registado como novo recurso no projeto com a sua proveniência. Uma cadeia só publica o resultado final; falha ou cancelamento não publica resultados parciais, e os artefactos temporários são removidos.], [Integridade do projeto, rastreabilidade e recuperação perante falhas.], [REQ-VID-COM-002 a 003, REQ-VID-STORAGE-002 a 004, REQ-VID-TASK-005, REQ-VID-CHAIN-011 a 013, REQ-VID-NFR-007],
  ),
)

== Convenções de identificação

#tabela(
  colunas: (4.2cm, 1fr),
  [Identificador], [Utilização],
  [UC-VID-nnn], [Caso de uso de vídeo, de `UC-VID-000` a `UC-VID-015`],
  [REQ-VID-{FUNC}-nnn], [Requisito funcional ou não funcional; `{FUNC}` identifica a área, incluindo `COM`, `AUTH`, `QUOTA`, `STORAGE`, `TASK`, `ERROR`, `UPLOAD`, `TRIM`, `AUDIO`, `SPEED`, `WATERMARK`, `FRAMES`, `DOWNLOAD`, `INFO`, `ADJUST`, `FILTER`, `RESIZE`, `ORIENT`, `CONVERT`, `CONCAT`, `CHAIN`, `BATCH` e `NFR`],
  [RNn, An, Qn, FAn], [Regra, assunção, questão ou fluxo alternativo local de um caso de uso; em artefactos transversais, referenciar com o caso, por exemplo `UC-VID-001/RN2`],
  [RNG-nn], [Regra de negócio transversal à extensão de vídeo (`RNG-01` a `RNG-06`)],
  [DQ-nnn], [Decisão de qualidade ou arquitetura registada para a Fase 1],
  [DA-nn], [Decisão arquitetural formal, documentada no capítulo de Arquitetura],
  [TST-{FUNC}-nn], [Caso de teste com critério verificável, documentado no capítulo de Testes],
  [T-nn], [Tarefa de manutenção corretiva da solução de base],
  [UCnn, RFnn, RNFnn], [Elementos da baseline do PictuRAS v27.1 referenciados quando são alterados],
)
