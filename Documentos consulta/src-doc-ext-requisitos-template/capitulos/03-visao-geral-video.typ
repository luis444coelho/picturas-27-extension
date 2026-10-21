#import "../template.typ": *

= Visão Geral da Extensão de Vídeo

== Objetivos e funcionalidades do MVP

A Fase 1 tem como objetivo alargar o espaço de trabalho do PictuRAS, originalmente orientado para imagens, para que um projeto possa integrar imagens e vídeos e suportar operações de vídeo com resultados persistidos no próprio projeto. A extensão cobre o ciclo que vai da entrada e consulta do vídeo à edição, composição, acompanhamento do processamento e obtenção do resultado. O diagrama de casos de uso representa os 14 objetivos funcionais identificados; os requisitos associados especificam as validações, limites, exceções e comportamento partilhado. No código analisado não foi identificada implementação destas funcionalidades; o estado do incremento é, portanto, especificado, com implementação por realizar.

Os casos de uso de consulta e descarregamento são distinguíveis das operações que submetem processamento: consultar informações e descarregar não consomem quota; o carregamento e a reprodução também não. A edição requer permissão de edição no projeto, enquanto a consulta e o descarregamento admitem permissão de leitura. Os perfis Registado e Premium podem executar os casos de uso de vídeo, sujeitos aos limites e à política de quota correspondentes. A tabela resume cada objetivo e as suas dependências funcionais; os prefixos indicam os requisitos específicos, complementados pelos requisitos transversais `COM`, `AUTH`, `TASK`, `QUOTA`, `STORAGE`, `ERROR` e `NFR` quando aplicáveis.

#tab([Objetivos funcionais de vídeo do MVP e respetivos casos de uso],
 tabela(
   colunas: (2fr, 0.8fr, 1fr, 1.5fr, 1.3fr),
   tamanho: 7.4pt,
   [Caso de uso e objetivo], [Prefixo principal], [Perfis], [Dependência funcional], [Estado na Fase 1],
   [UC-VID-000 — Carregar e visualizar um vídeo], [UPLOAD], [Registado, Premium, Convidado], [Projeto com permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-001 — Recortar um intervalo temporal], [TRIM], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-002 — Remover a faixa de áudio], [AUDIO], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-003 — Alterar a velocidade], [SPEED], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-004 — Aplicar marca de água], [WATERMARK], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-005 — Descarregar um vídeo], [DOWNLOAD], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de leitura], [Não implementado; especificado para construção],
   [UC-VID-006 — Consultar informações do vídeo], [INFO], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de leitura], [Não implementado; especificado para construção],
   [UC-VID-007 — Ajustar propriedades visuais], [ADJUST], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-008 — Aplicar um filtro visual], [FILTER], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-009 — Redimensionar um vídeo], [RESIZE], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-010 — Rodar ou espelhar um vídeo], [ORIENT], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-011 — Converter o formato], [CONVERT], [Registado, Premium, Convidado], [Vídeo no projeto; permissão de edição], [Não implementado; especificado para construção],
   [UC-VID-012 — Juntar vários vídeos], [CONCAT], [Registado, Premium, Convidado], [Dois ou mais vídeos compatíveis; edição], [Não implementado; especificado para construção],
   [UC-VID-013 — Encadear operações], [CHAIN], [Registado, Premium, Convidado], [Vídeo(s) no projeto; até 10 passos válidos], [Não implementado; especificado para construção],
 ),
)

*Nota sobre convidados.* Um utilizador autenticado que acede através de uma partilha: a permissão de leitura permite consultar ou descarregar; a permissão de edição permite carregar ou transformar. Os limites e a quota seguem o perfil da conta executora, e não o proprietário do projeto (REQ-VID-QUOTA-006).

*Justificação dos objetivos no contexto do MVP.* `UC-VID-000` estabelece a entrada e reprodução do vídeo no projeto. `UC-VID-001` a `UC-VID-004` abrangem recorte temporal, áudio, velocidade e marca de água. `UC-VID-005` e `UC-VID-006` permitem obter o ficheiro e consultar os seus dados. `UC-VID-007` a `UC-VID-011` cobrem ajustes, filtros, dimensões, orientação e conversão de formato. `UC-VID-012` combina clips num vídeo e `UC-VID-013` organiza operações numa cadeia validada, incluindo sub-cadeias por clip e operações sobre o resultado da junção. As tarefas assíncronas, validação, quota e tratamento de falhas são preocupações transversais especificadas uma vez nos requisitos comuns.

== Diagrama de casos de uso

#figure(
 image("../images/diagrama_casos_uso.png", width: 100%),
 caption: [Diagrama consolidado de casos de uso: funcionalidades da baseline e extensão de vídeo],
)

O diagrama mantém em cinzento os casos de uso da baseline e identifica a azul os novos casos de uso `UC-VID-000` a `UC-VID-013`. `Utilizador Convidado` e `Premium` especializam o ator `Utilizador` e herdam as associações representadas. O ator base corresponde ao utilizador autenticado Registado. Um convidado autenticado herda as associações, mas só pode consultar ou descarregar com permissão de leitura e carregar ou transformar com permissão de edição. O perfil da conta define limites e quota, debitada à identidade que executa a operação. O diagrama mostra uma única associação do ator base a cada caso de uso de vídeo.

As associações do diagrama indicam os perfis que podem iniciar os casos de uso, sujeitas à autorização do projeto. O carregamento exige permissão de edição; consulta de informações e descarregamento exigem permissão de leitura; as restantes operações alteram ou acrescentam recursos e exigem permissão de edição. O carregamento e a reprodução não debitam quota; consulta e descarregamento são operações de leitura sem custo; transformações e cadeias seguem os custos definidos nas regras transversais e nos casos correspondentes. O diagrama representa o acesso dos atores aos casos de uso; os pormenores de autorização, sequência e custo são especificados nos requisitos e nos casos de uso, não através de relações UML implícitas entre elipses.

== Modelo de domínio

#figure(
 image("../images/modelo_dominio.png", width: 100%),
 caption: [Modelo de domínio da baseline atualizado com os conceitos da extensão de vídeo],
)

O modelo de domínio alarga a baseline, centrada na edição de imagens, para integrar recursos e operações de vídeo. Mantém as entidades existentes, incluindo os perfis de utilizador, `Projeto`, `Imagem`, `Preset`, a hierarquia de ferramentas e os conceitos de assistência por IA. Acrescenta cinco conceitos: `Recurso multimédia`, `Vídeo`, `Ferramenta de vídeo`, `Trabalho de processamento` e `Predefinição de vídeo`. A extensão generaliza as associações de carregamento e pertença ao projeto e introduz relações para representar a execução das operações, a proveniência dos resultados e a reutilização de configurações. O diagrama é conceptual, apresenta entidades e relações, enquanto atributos, estados e regras de execução são especificados nos requisitos e casos de uso.

*Recursos multimédia e projetos mistos*

Na baseline, o utilizador carregava a `Imagem` e o `Projeto` continha imagens. Estas associações passam a incidir sobre `Recurso multimédia`, uma entidade abstrata especializada em `Imagem` e `Vídeo`. A generalização permite que ambos partilhem o contexto de carregamento e pertença ao projeto, preservando as suas características próprias. A introdução de `Vídeo` representa o recurso temporal sobre o qual incidem as novas operações. Assim, um projeto pode reunir imagens, vídeos carregados e vídeos resultantes de processamento. Duração, resolução, formato, codecs e taxa de fotogramas são dados relevantes para validação e consulta, mas não são apresentados como atributos no diagrama.

*Ferramentas de vídeo e coexistência com a edição de imagens*

A `Ferramenta de vídeo` especializa `Ferramenta` e associa-se a `Vídeo`, integrando o novo catálogo de operações na estrutura existente. Mantêm-se a associação `Projeto usa Ferramenta` e a relação `Ferramenta altera Imagem`. As ferramentas de imagem continuam a operar sobre imagens e as novas ferramentas atuam sobre vídeos, coexistindo no mesmo projeto.

*Proveniência dos vídeos resultantes.*

A nova relação `Vídeo origina resultado Vídeo` distingue os vídeos de entrada dos vídeos produzidos pelas operações. Cada vídeo resultante pode ter uma ou mais origens: uma edição simples parte de um vídeo, enquanto a junção pode combinar vários. Um vídeo de origem pode, por sua vez, dar origem a vários resultados. Esta relação permite conservar a proveniência das novas versões, em coerência com a regra de preservação dos originais.

*Trabalho de processamento e cadeias.*

O `Trabalho de processamento` é introduzido para representar a execução assíncrona de um pedido, distinguindo-a dos recursos utilizados e das ferramentas executadas. Cada trabalho é registado num projeto, submetido por um utilizador, processa um ou mais vídeos, executa uma ou mais ferramentas de vídeo e pode produzir novos vídeos. Estas relações abrangem operações isoladas, junções e cadeias. Em `UC-VID-013`, uma cadeia corresponde a um único trabalho atómico que aplica uma sequência de operações e publica apenas o resultado final; não constitui uma entidade autónoma no diagrama. Os estados `queued`, `processing`, `completed`, `failed` e `cancelled`, o progresso e o cancelamento são definidos nos requisitos transversais de tarefas.

*Predefinições de vídeo.*

A `Predefinição de vídeo` é criada por um utilizador e contém uma ou mais ferramentas de vídeo. Representa uma configuração reutilizável, permitindo guardar uma cadeia com os respetivos parâmetros e aplicá-la posteriormente em novas cadeias. A entidade é separada do `Preset` da baseline para distinguir as configurações de vídeo das predefinições de imagem e impedir a sua aplicação no contexto errado. Estas predefinições pertencem ao utilizador, não são partilhadas e só podem guardar cadeias sem junção.

*Limites e quotas.*

O modelo mantém os perfis da baseline, mas não acrescenta entidades de conta ou quota. Os limites por perfil, o custo das operações e as regras de reserva, consumo e devolução de créditos são políticas transversais descritas nos requisitos `REQ-VID-QUOTA-*` e nas regras de negócio seguintes. Estas políticas condicionam a submissão e execução dos trabalhos sem serem representadas como entidades adicionais no diagrama.

== Regras de negócio transversais

As regras seguintes reúnem políticas aplicáveis a mais do que um caso de uso. As validações particulares de parâmetros e fluxos alternativos permanecem nos respetivos casos. Os limites por perfil e os formatos são resumidos aqui; os requisitos `REQ-VID-*` e as decisões `DQ-*` constituem a referência detalhada para os critérios e exceções.

#tab([Regras de negócio transversais da extensão de vídeo],
 tabela(
   colunas: (1.35cm, 1.45fr, 1fr, 1.25fr),
   tamanho: 8pt,
   [ID], [Regra], [Fundamento], [Requisitos relacionados],
   [RNG-01], [A entrada aceita MP4 e MOV com vídeo H.264 e áudio AAC; AVI admite H.264 ou MPEG-4 Part 2 e áudio AAC ou MP3, de acordo com a matriz definida. As operações produzem MP4 (H.264/AAC); a conversão pode produzir os formatos de saída admitidos pela matriz.], [Compatibilidade dos ficheiros e interoperabilidade com o reprodutor; ver DQ-002 e DQ-012.], [REQ-VID-NFR-003, prefixo REQ-VID-CONVERT],
   [RNG-02], [Os limites de entrada dependem do perfil: Registado, até 5 minutos e 200 MB; Premium, até 60 minutos e 2 GB.], [Controlo de capacidade e coerência entre perfil e carregamento.], [Prefixos REQ-VID-UPLOAD e REQ-VID-NFR-007],
   [RNG-03], [A quota aplica-se ao utilizador que submete o trabalho, mesmo num projeto partilhado. Registado dispõe de 5 créditos diários; Premium não tem quota diária. Reserva-se o custo total na aceitação e confirma-se apenas o custo correspondente a trabalho concluído; falhas e cancelamentos devolvem os créditos não consumidos.], [Cobrança previsível e associada ao executor; ver DQ-001, DQ-007 e DQ-013.], [REQ-VID-QUOTA-001 a REQ-VID-QUOTA-008],
   [RNG-04], [Carregamento, reprodução, consulta de informações e descarregamento não consomem quota. Uma operação isolada ou junção custa 1 crédito; uma cadeia custa um crédito por passo.], [Diferenciação entre acesso ao recurso e processamento; custo transparente antes da submissão.], [Prefixos REQ-VID-UPLOAD, REQ-VID-DOWNLOAD e REQ-VID-INFO; REQ-VID-QUOTA-008],
   [RNG-05], [As transformações decorrem como tarefas assíncronas com estados `queued`, `processing`, `completed`, `failed` ou `cancelled`. O projeto admite no máximo uma tarefa ativa de vídeo. Uma cadeia tem um único estado agregado e comunica o passo corrente e o progresso global.], [Manter a interação disponível durante trabalhos demorados e limitar concorrência.], [REQ-VID-TASK-001 a REQ-VID-TASK-006, REQ-VID-NFR-004 a REQ-VID-NFR-008],
   [RNG-06], [A edição é não destrutiva: o recurso de origem mantém-se e o resultado bem-sucedido é registado como novo recurso no projeto com a sua proveniência. Uma cadeia só publica o resultado final; falha ou cancelamento não publica resultados parciais, e os artefactos temporários são removidos.], [Integridade do projeto, rastreabilidade e recuperação perante falhas.], [REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-002 a REQ-VID-STORAGE-004, REQ-VID-TASK-005, REQ-VID-CHAIN-011 a REQ-VID-CHAIN-013, REQ-VID-NFR-006],
 ),
)

== Convenções de identificação

#tabela(
 colunas: (4.2cm, 1fr),
 [Identificador], [Utilização],
 [UC-VID-nnn], [Caso de uso de vídeo, de `UC-VID-000` a `UC-VID-013`],
 [REQ-VID-{FUNC}-nnn], [Requisito funcional ou não funcional; `{FUNC}` identifica a área, incluindo `COM`, `AUTH`, `QUOTA`, `STORAGE`, `TASK`, `ERROR`, `UPLOAD`, `TRIM`, `AUDIO`, `SPEED`, `WATERMARK`, `DOWNLOAD`, `INFO`, `ADJUST`, `FILTER`, `RESIZE`, `ORIENT`, `CONVERT`, `CONCAT`, `CHAIN` e `NFR`],
 [RNn, An, Qn, FAn], [Regra, assunção, questão ou fluxo alternativo local de um caso de uso; em artefactos transversais, referenciar com o caso, por exemplo `UC-VID-001/RN2`],
 [RNG-nn], [Regra de negócio transversal à extensão de vídeo (`RNG-01` a `RNG-06`)],
 [DQ-nnn], [Decisão de qualidade ou arquitetura registada para a Fase 1],
 [DA-nn], [Decisão arquitetural formal, documentada no capítulo de Arquitetura],
 [TST-{FUNC}-nn], [Caso de teste com critério verificável, documentado no capítulo de Testes],
 [T-nn], [Tarefa de manutenção corretiva da solução de base],
 [UCnn, RFnn, RNFnn], [Elementos da baseline do PictuRAS v27.1 referenciados quando são alterados],
)
