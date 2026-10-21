#import "../template.typ": *

= Implementação Assistida por Agentes de IA

#orientacao[
  Obrigatório (enunciado): documentar as ferramentas e _skills_ utilizadas, enumerar as tarefas apoiadas e
  comprovar a validação realizada — tanto na especificação como no código
  e nos testes. A equipa é responsável por todo o conteúdo entregue, incluindo o gerado por IA.
  Valoriza-se evidência concreta (_commits_, _pull requests_, ficheiros de configuração dos agentes) e
  reflexão crítica (onde a IA errou e como isso foi detetado).
]

A utilização de agentes de inteligência artificial no incremento de vídeo do PictuRAS integra um processo de desenvolvimento orientado por especificações. Os agentes apoiam a análise dos documentos, a organização dos requisitos, a modelação e a preparação das unidades de trabalho, enquanto a equipa define o âmbito, aprecia as propostas e assume a responsabilidade pelo conteúdo entregue. Este capítulo caracteriza as ferramentas e a configuração utilizadas, relaciona as tarefas apoiadas com a evidência disponível e analisa os limites observados durante a revisão.

== Ferramentas, modelos e configuração

O Codex foi utilizado como assistente com acesso ao repositório, permitindo consultar os artefactos de referência, propor alterações e editar os ficheiros do relatório. O comportamento especializado é definido pelas _skills_ do SpecsMD e pelas instruções associadas ao fluxo AI-DLC. A distinção entre ferramenta, modelo e _skill_ é relevante: o Codex constitui o ambiente de assistência, o modelo produz as respostas e a _skill_ fornece instruções e procedimentos para uma determinada tarefa. A versão exata do modelo e os parâmetros de inferência das diferentes sessões não constam dos artefactos versionados consultados; por esse motivo, a identificação histórica assenta nas ferramentas, nas configurações e nas alterações preservadas em Git.

#tab([Ferramentas e configuração da assistência por IA],
  tabela(
    colunas: (3.5cm, 1fr),
    tamanho: 8pt,
    [#text("Ferramenta / modelo")], [#text("Configuração e utilização (skills, instruções de projeto, MCP, …)")],
    [#text("Codex e skill specsmd-inception-agent")], [#text("Assistência à análise e redação, ativada por .codex/skills/specsmd-inception-agent/SKILL.md. A definição efetiva do agente está em .specsmd/aidlc/agents/inception-agent.md; os procedimentos de requisitos, contexto, Units, Stories e Bolts estão em .specsmd/aidlc/skills/inception/.")],
    [#text("SpecsMD / fluxo AI-DLC")], [#text("A versão 0.1.74 está identificada em .specsmd/manifest.yaml. O esquema .specsmd/aidlc/memory-bank.yaml define a organização e a propriedade dos artefactos; context-config.yaml identifica os documentos de contexto. O diretório memory-bank/ mantém requisitos indexados, decisões, Stories e planeamento.")],
    [#text("Configuração dos restantes agentes")], [#text("As skills de Master, Construction e Operations encontram-se em .codex/skills/. A configuração de Construction remete para os padrões de tecnologia e de código em memory-bank/standards/. A presença destas configurações documenta o método disponível; a atribuição de uma tarefa concreta exige o respetivo registo de execução.")],
    [#text("Integrações e ferramentas auxiliares")], [#text("O manifesto enumera adaptações para Claude, Copilot, Antigravity e Codex. Essa enumeração identifica integrações instaladas, sem atribuir intervenções a modelos ou ferramentas específicos. Na revisão aqui descrita, a evidência provém de ficheiros locais e Git; Python apoia verificações estruturais, PlantUML representa os diagramas e Typst estrutura o relatório.")],
  ),
)

O contexto fornecido ao agente compreende os casos de uso, a ERS, o ADD e as decisões registadas pela equipa. A consulta conjunta destes documentos reduz a possibilidade de uma proposta se basear apenas numa descrição parcial do problema. Na adaptação ao relatório, os identificadores seguem a numeração dos Capítulos 4 a 7; os artefactos de origem podem conservar identificadores anteriores. As alterações devem, por isso, ser verificadas pelo significado e pela origem de cada requisito, para além da correspondência numérica.

== Tarefas apoiadas e validação

A tabela seguinte distingue a contribuição do agente da verificação que sustenta a sua utilização. As verificações automáticas de estrutura complementam a apreciação humana das regras e dos objetivos do sistema. A expressão “validação” designa, em cada linha, a atividade explicitamente descrita: coerência documental, inspeção de contratos, controlo de referências ou revisão das representações UML. Uma destas verificações não substitui as restantes.

#tab([Tarefas apoiadas por agentes de IA e validação],
  tabela(
    colunas: (2.6cm, 2cm, 1fr, 1fr, 2.4cm),
    tamanho: 8pt,
    [#text("Ferramenta / skill")], [#text("Caso de uso")], [#text("Tarefa apoiada")], [#text("Validação realizada pela equipa")], [#text("Evidência")],
    [#text("Codex / Inception")], [#text("UC-VID-000 a UC-VID-013")], [#text("Revisão de fluxos, exceções, regras de negócio e critérios de aceitação.")], [#text("Confronto entre casos de uso e requisitos; manutenção das origens e das fronteiras de leitura e edição.")], [#text("E-01; E-02")],
    [#text("Codex / Inception")], [#text("Transversal")], [#text("Refinamento da ERS e organização das tabelas de requisitos.")], [#text("Registo original/refinado de 18 requisitos; controlo dos 202 IDs e das referências; correção da duplicação de classificação identificada na revisão humana.")], [#text("E-03")],
    [#text("Codex / Inception")], [#text("UC-VID-001, UC-VID-002 e UC-VID-013")], [#text("Clarificação do recorte, da remoção de áudio e do custo de cadeias.")], [#text("Comparação com o ADD: cópia condicionada por keyframes, ausência de áudio no resultado e reserva/devolução do custo total, sem segundo débito.")], [#text("E-02; E-03")],
    [#text("Codex / Inception")], [#text("Transversal")], [#text("Organização de Units, Stories, dependências e responsabilidades dos Bolts.")], [#text("Questões D-01 a D-10 respondidas e aplicadas aos artefactos; inspeção das responsabilidades atribuídas à fundação e ao executor.")], [#text("E-04")],
    [#text("Codex / Inception")], [#text("UC-VID-000 a UC-VID-013")], [#text("Revisão de perfis, stakeholders, técnicas de elicitação e assunções.")], [#text("Separação entre decisões documentais e dados empíricos; indicação das fontes e das atividades de validação adequadas a cada assunção.")], [#text("E-05")],
    [#text("Codex / Inception; PlantUML")], [#text("UC-VID-001 a UC-VID-004; UC-VID-007 a UC-VID-013")], [#text("Redação da arquitetura e dos diagramas de componentes, estados e sequência.")], [#text("Confronto com o ADD e os contratos de tarefas; verificação da separação entre orquestração, execução, persistência e publicação; geração dos PNG a partir dos PUML.")], [#text("E-06")],
    [#text("Codex / Inception; análise de código")], [#text("UC-VID-000, UC-VID-005 e UC-VID-013")], [#text("Identificação do impacto nos serviços de projetos, utilizadores, autenticação, filas e storage.")], [#text("Inspeção documental dos mecanismos existentes e das referências ao código no ADD; registo dos conflitos e decisões de compatibilidade no Capítulo 6.")], [#text("E-02; E-03")],
    [#text("Codex / Inception; verificações estruturais")], [#text("Transversal")], [#text("Preparação de critérios de teste e condições de verificação dos requisitos de qualidade.")], [#text("Verificação da ligação entre requisito, alvo e condição; distinção entre aceitação HTTP, processamento e pré-visualização. Os critérios fundamentam a estratégia do Capítulo 10.")], [#text("E-03")],
  ),
)

As evidências são identificadas abaixo para permitir a consulta das alterações e do respetivo contexto. Os _commits_ documentam o conteúdo alterado; por si só, não demonstram qual o modelo utilizado nem a aceitação de cada proposta. Essa interpretação exige o confronto com as configurações, os registos de decisões e os artefactos resultantes.

#tab([Identificação das evidências],
  tabela(
    colunas: (1.2cm, 1fr),
    tamanho: 8pt,
    [#text("ID")], [#text("Artefacto / alteração verificável")],
    [#text("E-01")], [#text("Configuração dos agentes: .codex/skills/specsmd-inception-agent/SKILL.md; .specsmd/aidlc/agents/inception-agent.md; .specsmd/aidlc/memory-bank.yaml e context-config.yaml.")],
    [#text("E-02")], [#text("Fontes de especificação: docs/use-cases/, docs/requirements/, docs/requirements/quality-review.md e docs/add.md. A versão do relatório é consultável nos Capítulos 4 a 7.")],
    [#text("E-03")], [#text("Commit f9c316a — alterações aos capítulos da ERS, impacto, rastreabilidade e histórico. Capítulo 5: registo dos 18 requisitos refinados, alvos e condições de verificação. A correção posterior da coluna de classificação está documentada no próprio catálogo.")],
    [#text("E-04")], [#text("Commits d3ab0e2, c386114 e 1a701cc — aplicação das respostas de docs/specsDuvidas.md. Registos em memory-bank/intents/001-video-processing-support/inception-log.md, traceability.md e ficheiros de Bolt.")],
    [#text("E-05")], [#text("Commit 8fa814f — revisão do Capítulo 2: perfis, stakeholders, técnicas de elicitação, assunções e ações de validação.")],
    [#text("E-06")], [#text("Commit 815599a — Capítulo 8 e ficheiros arquitetura_componentes.puml, maquina_estados_video.puml e sequencia_processamento.puml, com os PNG correspondentes, em images/ do relatório.")],
  ),
)

A análise de código usada na especificação incide sobre contratos e mecanismos existentes, como autenticação, reserva de créditos, permissões e transferência de objetos. Para apreciar alterações de código, o critério metodológico é relacionar o _diff_ com o requisito e o caso de uso que o justificam, inspecionar os efeitos nas interfaces partilhadas e associar o resultado dos testes à mesma revisão. O registo de um teste deve identificar o cenário, os dados de entrada, o ambiente, o resultado esperado, o resultado observado e a versão avaliada. A verificação de tabelas, referências e ficheiros não constitui evidência de comportamento funcional ou de desempenho; essa evidência pertence ao registo de testes do Capítulo 10.

== Análise crítica

A principal contribuição dos agentes foi apoiar a sistematização de informação distribuída por vários documentos e manter uma ligação explícita entre necessidades, regras, requisitos e decisões arquiteturais. A estrutura das _skills_ favoreceu a organização do trabalho em artefactos verificáveis, enquanto o histórico Git permitiu localizar alterações e comparar versões. Este apoio foi particularmente útil em aspetos transversais, como autorização em projetos partilhados, imputação de quota, proveniência dos recursos e acompanhamento de tarefas assíncronas.

A revisão revelou, contudo, que uma formulação plausível pode conservar incoerências relevantes. Na quota, a referência genérica à confirmação do débito podia ser interpretada como uma segunda operação, embora o contrato existente já debite os créditos na reserva. Na recuperação de falhas, a expressão “sem retoma automática” não distinguia o reinício por reentrega da retoma por checkpoint. O confronto com o ADD permitiu precisar ambos os comportamentos e registar a justificação no Capítulo 5. A mesma revisão identificou que exigir áudio AAC em todos os resultados contradizia a remoção de áudio e que a cópia incondicional da stream no recorte não assegurava o início selecionado fora de um keyframe.

Os erros também ocorreram na apresentação documental. A introdução simultânea de “Evolução” e “Novo/Alt” na tabela funcional repetiu a indicação de novidade em várias linhas. A observação da equipa conduziu à manutenção de uma única coluna de classificação relativamente à baseline, preservando o estado de refinamento. Este episódio mostra que a conformidade formal com um template deve ser apreciada em função da clareza do documento e da intenção da equipa, em vez de resultar na reprodução automática de campos redundantes.

Outro limite prende-se com a atribuição de valor probatório aos números e aos diagramas. Uma duração máxima, um tempo de resposta ou uma cadência de progresso pode ser uma decisão de projeto sem resultar de medição. Por esse motivo, a revisão distingue alvos, assunções e condições de verificação. De igual modo, a geração de um diagrama confirma a possibilidade de representar uma estrutura, mas a sua adequação depende da coerência com os requisitos e com os contratos dos serviços. A inspeção das mensagens, dos estados e dos participantes é, portanto, parte da revisão técnica.

A prática adotada assenta na consulta das fontes, na apreciação das propostas e na preservação da justificação das alterações. As decisões que afetam âmbito, regras de negócio e compatibilidade são confrontadas com os artefactos do projeto; as verificações automáticas apoiam o controlo de estrutura e de referências. A responsabilidade da equipa inclui compreender cada alteração, corrigir interpretações inadequadas e exigir evidência compatível com a conclusão apresentada. O conteúdo produzido com assistência de IA é, assim, tratado como uma contribuição sujeita a revisão e fundamentação académica.
