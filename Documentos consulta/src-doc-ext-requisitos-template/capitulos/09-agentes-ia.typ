#import "../template.typ": *

= Implementação Assistida por Agentes de IA

O desenvolvimento do incremento de vídeo do PictuRAS foi apoiado por agentes de inteligência artificial, utilizando Claude Code e Codex na implementação, revisão e preparação de testes. O trabalho foi organizado com o SpecsMD, segundo o fluxo AI-DLC configurado no repositório. A assistência abrangeu a especificação, a modelação, a produção de código e a documentação, sob orientação e validação da equipa. Este capítulo identifica as ferramentas e os procedimentos utilizados, relaciona as tarefas com evidência verificável e analisa os limites observados.

== Ferramentas, modelos e configuração

O SpecsMD constituiu o enquadramento do desenvolvimento orientado por especificações. A instalação local identifica a versão 0.1.74 e o fluxo AI-DLC (_AI-Driven Development Life Cycle_) em `.specsmd/manifest.yaml`. A documentação em `.specsmd/aidlc/README.md` distingue as fases Inception, Construction e Operations. No projeto, Inception apoiou a organização dos requisitos e do trabalho; Construction orientou a implementação dos incrementos através de Bolts. A configuração de Operations encontra-se disponível, mas a sua presença não constitui, por si só, evidência de uma implantação autónoma em produção.

Claude Code e Codex são as ferramentas de assistência utilizadas; o SpecsMD fornece o processo, os papéis dos agentes e os procedimentos especializados, designados por _skills_. As configurações de integração encontram-se em `.claude/` e `.codex/`. O agente Master orienta a seleção da fase, Inception apoia a especificação e o planeamento e Construction conduz a execução do Bolt selecionado. O estado e os resultados são conservados em `memory-bank/`, permitindo retomar o trabalho com contexto persistente.

#tab([Ferramentas e configuração da assistência por IA],
  tabela(
    colunas: (3.5cm, 1fr),
    tamanho: 8pt,
    [#text("Ferramenta / modelo")], [#text("Configuração e utilização (skills, instruções de projeto, MCP, …)")],
    [#text("Claude Code")], [#text("Utilizado no apoio à implementação, revisão e testes. As integrações SpecsMD estão em .claude/commands/ e .claude/agents/, com os agentes Master, Inception, Construction e Operations.")],
    [#text("Codex")], [#text("Utilizado na implementação, análise de código, revisão documental e automatização da execução dos testes. As skills SpecsMD encontram-se em .codex/skills/specsmd-*-agent/. A identificação exata dos modelos e dos parâmetros das sessões não foi registada de forma sistemática.")],
    [#text("SpecsMD / AI-DLC")], [#text("Versão 0.1.74. As definições efetivas dos agentes, skills e tipos de Bolt estão em .specsmd/aidlc/. memory-bank.yaml define a organização dos artefactos; context-config.yaml identifica os padrões a carregar. O contexto de construção inclui memory-bank/standards/tech-stack.md e coding-standards.md.")],
    [#text("Ferramentas de apoio à verificação")], [#text("Git permite inspecionar alterações e revisões; Docker Compose reproduz a pilha local. node:test, unittest, FFmpeg/FFprobe, testes de navegador e TypeScript apoiam a validação. PlantUML e Typst suportam os diagramas e a compilação do relatório. A utilização concreta é sustentada pelos ficheiros e registos de execução.")],
  ),
)


O contexto de trabalho compreendeu os casos de uso, a ERS, o ADD, os padrões do projeto e as decisões em `docs/specsDuvidas.md`. Para este relatório, a referência de âmbito e numeração é a ERS dos Capítulos 4 a 7, com 180 requisitos funcionais e 22 não funcionais. Os documentos de construção conservam alguns identificadores anteriores; a correspondência deve ser verificada pelo conteúdo do requisito, evitando incluir os casos de uso retirados do âmbito.

Os tipos de Bolt determinam as etapas de execução. Nos Bolts DDD, o modelo local estabelece modelo de domínio, desenho técnico, análise de decisões arquiteturais, implementação e testes; a análise de ADR é opcional quando não existem decisões que a justifiquem. Nos Bolts simples, como B002, B005 e B007, as etapas são planeamento, implementação e testes. Ambos os tipos preveem pontos de validação humana. Assim, a passagem de etapa depende da apreciação dos artefactos e das decisões pela equipa, não apenas de uma indicação de conclusão produzida pelo agente.

== Tarefas apoiadas e validação

A assistência concretizou-se nos Bolts 001 a 005, 007 e 008, que se encontram concluídos. A tabela seguinte relaciona o apoio prestado com a validação registada na especificação, no código e nos testes. A indicação conjunta das ferramentas não pretende atribuir autoria exclusiva de cada alteração.

#tab([Tarefas apoiadas por agentes de IA e validação],
  tabela(
    colunas: (2.6cm, 2cm, 1fr, 1fr, 2.4cm),
    tamanho: 8pt,
    [#text("Ferramenta / skill")], [#text("Caso de uso")], [#text("Tarefa apoiada")], [#text("Validação realizada pela equipa")], [#text("Evidência")],
    [#text("Codex / Inception")], [#text("UC-VID-000 a UC-VID-013")], [#text("Refinamento dos requisitos, fluxos, critérios de aceitação, rastreabilidade e planeamento dos Bolts.")], [#text("Confronto com os casos de uso e o ADD; revisão dos 202 IDs do relatório, das permissões e das regras de quota; resolução de dúvidas pela equipa.")], [#text("E-01; E-02")],
    [#text("Claude Code e Codex / SpecsMD")], [#text("Transversal")], [#text("Modelação do domínio, desenho dos contratos e documentação da arquitetura e dos diagramas.")], [#text("Apreciação das responsabilidades, mensagens e transições; decisões registadas em ADR; confronto das representações com a implementação.")], [#text("E-01; E-03")],
    [#text("Claude Code e Codex / Construction")], [#text("UC-VID-000, UC-VID-005 e UC-VID-006")], [#text("Ingestão, metadados, miniaturas, cópias de reprodução, informações e descarregamento.")], [#text("Testes de formatos e limites, autorização, URLs assinados e Range; inspeção dos objetos e metadados produzidos pela pilha real.")], [#text("E-04")],
    [#text("Claude Code e Codex / Construction")], [#text("Transversal")], [#text("Executor assíncrono, estados, progresso, cancelamento, quota e recuperação.")], [#text("Testes de concorrência, reentrega, compensação, limpeza e correlação; revisão dos efeitos em MongoDB, RabbitMQ e armazenamento.")], [#text("E-04")],
    [#text("Claude Code e Codex / Construction")], [#text("UC-VID-001 a UC-VID-004; UC-VID-007 a UC-VID-010")], [#text("Operações de edição e painéis; pré-visualizações; revisão da equivalência dos ajustes.")], [#text("Processamento real com FFmpeg, comparação de fotogramas, regressão de imagem e verificações manuais. A D-67 conduziu à correção das fórmulas de contraste e saturação.")], [#text("E-05")],
    [#text("Claude Code e Codex / Construction")], [#text("UC-VID-011")], [#text("Conversão MP4/MOV/AVI, escolha entre cópia e recodificação e nomes dos resultados.")], [#text("Inspeção com FFprobe, descodificação integral e reprodução em VLC; revisão dos percursos manuais e da extensão apresentada segundo a D-75.")], [#text("E-06")],
    [#text("Claude Code e Codex / Construction")], [#text("UC-VID-012 e UC-VID-013")], [#text("Junção, cadeias, subcadeias, predefinições e revisão dos três percursos de composição.")], [#text("Integração revista, comparação dos nove painéis, medições D-88 e checklist manual aprovada. A equipa rejeitou a primeira interface e aprovou a revisão posterior.")], [#text("E-07")],
    [#text("Codex / automatização")], [#text("Transversal")], [#text("Script de preparação de contas e vídeos, execução das suites e recolha dos resultados.")], [#text("Testes do próprio script e execução em contentores; verificação da reutilização dos dados e da distinção entre sucesso, falha e teste não executado.")], [#text("E-08")],
  ),
)

A validação da especificação incidiu na coerência entre necessidades, regras, requisitos e critérios de aceitação. A validação do código confrontou as alterações com os contratos aprovados e com os limites de intervenção na solução de base. Os testes complementaram essa inspeção com execução real, sem a substituir. No Bolt 008, por exemplo, a revisão registou quinze testes de integração favoráveis, a comparação dos nove painéis e a aprovação da checklist manual. Estes resultados sustentam os cenários executados; a cobertura e as limitações dos requisitos são discriminadas no Capítulo 10.

#tab([Identificação das evidências],
  tabela(
    colunas: (1.2cm, 1fr),
    tamanho: 8pt,
    [#text("ID")], [#text("Artefacto / alteração verificável")],
    [#text("E-01")], [#text(".specsmd/manifest.yaml; .specsmd/aidlc/README.md, memory-bank.yaml e context-config.yaml; definições em agents/ e templates/construction/bolt-types/; integrações em .claude/ e .codex/skills/.")],
    [#text("E-02")], [#text("Casos de uso e ERS dos Capítulos 4 a 7; docs/add.md e docs/specsDuvidas.md; memory-bank/intents/001-video-processing-support/inception-log.md e traceability.md. O commit f9c316a documenta a revisão da ERS, impacto e rastreabilidade.")],
    [#text("E-03")], [#text("Modelos de domínio, desenhos técnicos e ADR em memory-bank/bolts/; índice em memory-bank/standards/decision-index.md. Os diagramas PlantUML e PNG encontram-se em images/ do relatório; os commits 815599a e 1e87396 documentam alterações à arquitetura e ao relatório.")],
    [#text("E-04")], [#text("memory-bank/bolts/001-video-lifecycle/ddd-03-test-report.md; 002-video-access/test-walkthrough.md; 003-video-task-foundation/ddd-03-test-report.md. O commit 29e4d08 reúne os testes e as correções da fundação de tarefas.")],
    [#text("E-05")], [#text("memory-bank/bolts/004-video-basic-edits/ddd-03-test-report.md e 005-video-visual-edits/test-walkthrough.md, com as checklists manuais. A D-67 consta do ADR-012 e do commit 0699d04; o fecho B005 está em 8d0728f.")],
    [#text("E-06")], [#text("memory-bank/bolts/007-video-format-conversion/test-walkthrough.md e manual-test-checklist.md; memory-bank/standards/adr-015-video-result-name.md. O commit 86bbe4c documenta a correção D-75.")],
    [#text("E-07")], [#text("memory-bank/bolts/008-video-concat-chain/: bolt.md, implementation-report-revision.md, ddd-03-test-report-revision.md e manual-test-checklist.md. Commits d6ec7bc (implementação revista), 57a153d (testes), a5e1407 (aprovação final) e aa388c7 (integração).")],
    [#text("E-08")], [#text("scripts/mvp.py, scripts/test_mvp.py e docs/executar-testes-mvp.md, introduzidos no commit 2c1e513. O script conserva os resultados por execução; os testes verificam, entre outros aspetos, falhas, omissões e reutilização das contas de teste.")],
  ),
)


== Análise crítica

O contributo dos agentes consistiu em apoiar a implementação e a organização de informação distribuída por requisitos, contratos, código e testes. O SpecsMD tornou explícitos os resultados esperados de cada etapa e conservou o contexto entre sessões. Esta estrutura facilitou a revisão e a localização das decisões, mas não permite concluir, sem medições próprias, que houve uma determinada redução de esforço ou aumento de produtividade.

O caso D-67 evidencia a necessidade de verificação empírica. A correspondência aparente entre parâmetros de contraste e saturação em sharp e FFmpeg não assegurou resultados visuais equivalentes, porque os motores aplicavam transformações em espaços de cor diferentes.

O Bolt 008 demonstrou também que testes funcionais favoráveis não bastam para validar a interação. A primeira etapa de testes não foi aprovada após a apreciação da interface pela equipa. O trabalho regressou ao desenho técnico para separar «Aplicar várias operações», «Juntar vídeos» e «Movie Maker», reutilizar os componentes de configuração e rever os limites de quantidade. As decisões D-86 a D-89 e os novos ensaios documentam essa revisão. A comparação do DOM normalizado dos nove painéis foi complementada por verificação manual, pois não constitui uma prova completa do aspeto e da utilização da interface.

Persistem limites que impedem equiparar a conclusão dos Bolts à conformidade integral. A revisão transversal identificou, por exemplo, a validação de cadeias sem teto fixo de passos e o limite residual de dez passos na persistência de predefinições. O teste de uma camada não demonstra o comportamento das restantes. A falha histórica do teste de Brilho em ARM foi igualmente mantida explícita, em vez de alterar o algoritmo apenas para satisfazer uma expectativa dependente da imagem de ensaio. Os desvios e as verificações incompletas permanecem identificados nos Capítulos 10 e 11.

A equipa mantém a responsabilidade pela especificação, pelo código e pelo relatório, incluindo o conteúdo produzido com assistência de IA. Essa responsabilidade implica compreender as alterações, apreciar os seus efeitos nas interfaces partilhadas e exigir evidência compatível com cada conclusão. Claude Code e Codex apoiaram a execução; o processo SpecsMD estruturou o trabalho; a aceitação das decisões e dos resultados permaneceu uma responsabilidade humana.
