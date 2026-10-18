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
    colunas: (1.2fr, 2.1cm, 2.4cm, 1.8cm, 2.3cm, 2.6cm),
    [Funcionalidade], [Caso de uso], [Prefixo(s) REQ], [Perfis], [Dependências], [Estado de implementação],
    [Carregamento, ingestão e visualização de vídeo no projeto], [UC-VID-000], [REQ-VID-UPLOAD], [Reg., Prem.], [Nenhuma], [Especificada / Em desenvolvimento],
    [Recortar um intervalo temporal de um vídeo (_trim_)], [UC-VID-001], [REQ-VID-TRIM], [Reg., Prem.], [UC-VID-000], [Especificada / Em desenvolvimento],
    [Remover o áudio de um vídeo (_video-only_)], [UC-VID-002], [REQ-VID-AUDIO], [Reg., Prem.], [UC-VID-000], [Especificada / Em desenvolvimento],
    [Alterar a velocidade de reprodução de um vídeo], [UC-VID-003], [REQ-VID-SPEED], [Reg., Prem.], [UC-VID-000], [Especificada / Em desenvolvimento],
    [Aplicar marca de água a um vídeo (texto ou imagem)], [UC-VID-004], [REQ-VID-WATERMARK], [Reg., Prem.], [UC-VID-000], [Especificada / Em desenvolvimento],
    [Extrair fotogramas de um vídeo para o projeto], [UC-VID-005], [REQ-VID-FRAMES], [Reg., Prem.], [UC-VID-000], [Especificada / Em desenvolvimento],
  ),
)

*Justificação no contexto do MVP.* A seleção das seis funcionalidades foi estrategicamente delineada para assegurar uma cobertura holística e coerente do ciclo de vida multimédia, exercitando todos os subsistemas arquiteturais sem dispersão excessiva de escopo:

- *UC-VID-000 — Carregamento, ingestão e visualização de vídeo no projeto*: Constitui o alicerce fundacional obrigatório de todo o incremento. Uma vez que o PictuRAS apenas manipulava imagens estáticas, a receção em _streaming_, o armazenamento escalável de ficheiros de grande porte no SeaweedFS com UUIDs únicos, a inspeção de fluxos com FFprobe, a extração de metadados técnicos, a geração de miniaturas JPEG e a reprodução num leitor integrado com controlos HTML5 são pré-requisitos absolutos sem os quais nenhuma transformação seria viável.
- *UC-VID-001 — Recorte temporal de um vídeo (_trim_)*: Valida a manipulação da dimensão temporal contínua e a precisão ao fotograma (_frame-accurate_) na descodificação e recorte de segmentos sem degradação de sincronismo audiovisual, disponibilizando o mecanismo de edição mais elementar e procurado pelos utilizadores.
- *UC-VID-002 — Remoção do áudio de um vídeo*: Valida a manipulação estrutural das _streams_ do contentor MP4, exercitando a extração eficiente através de cópia direta de fluxo (_stream copy_) com processamento ultra-rápido sem necessidade de recodificação de vídeo.
- *UC-VID-003 — Alteração da velocidade de reprodução de um vídeo*: Valida a reamostragem temporal dinâmica de vídeo e o sincronismo com o algoritmo de cadência sonora (filtro `atempo`), testando o comportamento dos _workers_ perante compressão (_timelapse_) e dilatação (_slow motion_) de fotogramas.
- *UC-VID-004 — Aplicação de marca de água a um vídeo*: Valida a sobreposição gráfica contínua fotograma a fotograma (renderização estática de texto TrueType e imagens PNG com canal alfa), exercitando o processamento computacionalmente intensivo e a transmissão em tempo real de eventos de progresso numérico (0–100%) via WebSocket.
- *UC-VID-005 — Extração de fotogramas para o projeto*: Representa a ponte vital entre o domínio de vídeo e o domínio pré-existente de imagem estática do PictuRAS. Permite transformar um fluxo contínuo num conjunto de imagens discretas de alta resolução, integrando-as atomicamente na galeria do projeto e viabilizando o encadeamento (_tool chaining_) com todo o catálogo legado de ferramentas de processamento de imagem da plataforma.

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

*Decisões de Modelação do Diagrama de Casos de Uso:*
O diagrama de casos de uso foi atualizado para incorporar o novo subsistema de vídeo, estabelecendo uma distinção nítida face às funcionalidades legadas de imagem:
1. *Atores e Permissões*: Os utilizadores *Registado* e *Premium* são os únicos atores autorizados a executar os casos de uso de vídeo (`UC-VID-000` a `UC-VID-005`). O utilizador *Anónimo* não herda acesso a estas operações, uma vez que o processamento multimédia de vídeo requer alocação de quota transacional e persistência estruturada num projeto autenticado (`DQ-001`).
2. *Relações de Extensão e Dependência*: O caso de uso `UC-VID-000` (Carregar e visualizar vídeo) atua como o ponto de entrada e pré-condição operacional para todas as manipulações subsequentes (`UC-VID-001` a `005`), estabelecendo uma dependência funcional implícita: qualquer operação de recorte, remoção de áudio, velocidade, marca de água ou extração opera sobre um recurso de vídeo previamente integrado no projeto.
3. *Integração Transversal com Imagem*: O caso de uso `UC-VID-005` (Extrair fotogramas) interseta o subsistema de imagem, alimentando a coleção do projeto com novos recursos de imagem discretos sobre os quais os casos de uso legados de processamento de imagem voltam a aplicar-se normalmente.

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

*Decisões de Modelação do Modelo de Domínio Atualizado:*
Em resposta direta aos desafios concetuais colocados pelo suporte a vídeo, o modelo de domínio do PictuRAS evoluiu nas seguintes dimensões estruturais:

1. *Relação entre Vídeo e Imagem (`RecursoMultimédia`)*:
   Em vez de manter `Vídeo` e `Imagem` como entidades isoladas, o modelo introduz o conceito generalizado de *`RecursoMultimédia`* (ou _Media Asset_). Ambos os tipos partilham atributos essenciais como identificador único, nome de ficheiro original, tamanho em bytes, data de carregamento e referência de armazenamento de objetos (`storageRef`).
   - A *`Imagem`* especializa este conceito com propriedades bidimensionais estáticas (largura, altura, formato gráfico JPEG/PNG).
   - O *`Vídeo`* especializa o conceito com propriedades espácio-temporais contínuas: duração total em segundos, resolução espacial nativa (largura $times$ altura), taxa de fotogramas por segundo (_framerate_), _bitrate_ global, codec de vídeo (H.264), codec de áudio (AAC, quando presente) e referência à miniatura de representação visual gerada no primeiro segundo (`thumbnailRef`).
2. *Projetos Mistos com Agregação Polimórfica*:
   O conceito de *`Projeto`* passa a conter uma coleção mista e polimórfica de `RecursoMultimédia`. Deste modo, um mesmo projeto pode alojar em simultâneo vídeos carregados, vídeos derivados de operações de edição e imagens estáticas (incluindo fotogramas extraídos), mantendo a coesão do espaço de trabalho do utilizador.
3. *Trabalho de Processamento Assíncrono (`TrabalhoProcessamento`)*:
   Dada a natureza não instantânea da descodificação e codificação de vídeo, modela-se explicitamente a entidade *`TrabalhoProcessamento`* (ou _VideoTask_). Cada trabalho é instanciado no âmbito de um `Projeto` por um `Utilizador` executor, associado aos parâmetros específicos validados da operação e governado por uma máquina de estados finitos canónica:
   $ "queued" thin arrow.r thin "processing" thin arrow.r thin brace.l "completed", "failed", "cancelled" $
   O trabalho mantém ainda a percentagem de progresso em tempo real (0% a 100%) e, quando atinge o estado terminal `completed`, referencia o novo `RecursoMultimédia` gerado no projeto.
4. *Ferramentas de Vídeo vs. Ferramentas de Imagem e Encadeamento*:
   O catálogo de capacidades divide-se entre *`FerramentaVídeo`* (recorte, áudio, velocidade, marca de água e extração) e *`FerramentaImagem`* (filtros, rotação, ajustes de cor pré-existentes). A extração de fotogramas produz diretamente entidades do tipo `Imagem` devidamente anotadas com a proveniência (`sourceVideoId` e `timestamp`), permitindo o encadeamento direto (_tool chaining_) com todo o ecossistema de ferramentas de imagem legadas.
5. *Quotas e Limites por Perfil*:
   A *`ContaUtilizador`* governa o *`SaldoQuotaDiária`* (5 operações diárias para utilizadores Registados e ilimitado para Premium). O débito efetivo de quota incide exclusivamente sobre a execução bem-sucedida de instâncias de `TrabalhoProcessamento` de manipulação, ficando o carregamento de vídeo e a pré-visualização de amostras explicitamente isentos de débito (`DQ-011`).

== Regras de negócio transversais

#orientacao[
  Regras que se aplicam a *várias* funcionalidades ficam aqui, com ID global `RNG-nn`
  (e.g., formatos aceites, como o vídeo conta para a quota diária, tempo de retenção de ficheiros).
  As regras específicas de uma funcionalidade ficam no respetivo caso de uso (RN1, RN2, …) e, nas tabelas
  partilhadas por todas as funcionalidades (ERS, impacto, rastreabilidade), escrevem-se qualificadas
  (`UC-VID-001/RN2`). As decisões de qualidade (`DQ-nnn`) estão reunidas no capítulo de Rastreabilidade.
]

#tab([Regras de negócio transversais da extensão de vídeo],
  tabela(
    colunas: (1.8cm, 1fr, 3.4cm, 3.2cm),
    [ID], [Regra], [Origem / justificação], [Requisitos],
    [RNG-01], [O sistema aceita na entrada e produz nos resultados exclusivamente ficheiros de vídeo no contentor MP4 codificados em H.264 (vídeo) e AAC (áudio), admitindo vídeos sem faixa sonora. Outros formatos são rejeitados na camada de API.], [Interoperabilidade nativa com navegadores web modernos via HTML5 sem transcodificação no MVP (DQ-002).], [REQ-VID-UPLOAD-003, REQ-VID-UPLOAD-009, REQ-VID-UPLOAD-010, REQ-VID-NFR-003],
    [RNG-02], [São aplicados limites contratuais rígidos de duração e dimensão por perfil: Registado limitado a vídeos de duração $<= 5$ min e tamanho $<= 200$ MB (máx. 50 fotogramas na extração); Premium limitado a duração $<= 60$ min e tamanho $<= 2$ GB (máx. 500 fotogramas).], [Proteção contra esgotamento de storage de objetos e saturação dos workers em instâncias de desenvolvimento locais (DQ-005).], [REQ-VID-UPLOAD-004, REQ-VID-UPLOAD-011, REQ-VID-FRAMES-006, REQ-VID-NFR-008],
    [RNG-03], [Cada tarefa de manipulação de vídeo concluída consome exatamente 1 crédito da quota diária de 5 operações do utilizador Registado. A quota é reservada transitòriamente na admissão (queued), confirmada no término com sucesso (completed) e devolvida integralmente em caso de falha ou cancelamento.], [Modelo de negócio freemium da plataforma e cobrança justa apenas por tarefas entregues (DQ-001, DQ-007).], [REQ-VID-QUOTA-001..004, REQ-VID-COM-002],
    [RNG-04], [O carregamento de vídeo e a reprodução no leitor integrado não consomem créditos da quota diária de operações, incidindo a contabilização exclusivamente sobre transformações de vídeo.], [Incentivar a adoção do produto e permitir a criação de mediatecas de trabalho nos projetos sem atrito de utilização (DQ-011).], [REQ-VID-UPLOAD-014, REQ-VID-QUOTA-001],
    [RNG-05], [Todas as operações de transformação de vídeo são executadas de forma 100% assíncrona desacoplada via RabbitMQ, com máquina de estados (queued, processing, completed, failed, cancelled) e concorrência máxima de 1 tarefa ativa por projeto.], [Preservação da responsividade do gateway HTTP e prevenção de condições de corrida em projetos partilhados (DQ-004, DQ-005).], [REQ-VID-TASK-001..005, REQ-VID-NFR-005, REQ-VID-NFR-006, REQ-VID-NFR-008],
    [RNG-06], [O ficheiro de vídeo original permanece sempre inalterado; qualquer transformação bem-sucedida gera um novo recurso associado ao projeto com referência de proveniência (`sourceVideoId`). Em caso de falha ou cancelamento, nenhum recurso parcial é persistido (tudo-ou-nada).], [Garantia de edição não destrutiva e preservação da integridade transacional dos projetos (DQ-003, DQ-007).], [REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-FRAMES-011, REQ-VID-FRAMES-013, REQ-VID-NFR-007],
  ),
)

== Convenções de identificação

#tabela(
  colunas: (4.2cm, 1fr),
  [Identificador], [Utilização],
  [UC-VID-nnn], [Caso de uso de vídeo (numeração única no relatório: UC-VID-000 a UC-VID-005)],
  [REQ-VID-{FUNC}-nnn], [Requisito funcional ou não funcional atómico; {FUNC} identifica a funcionalidade ou área (COM, AUTH, QUOTA, STORAGE, TASK, ERROR, UPLOAD, TRIM, AUDIO, SPEED, WATERMARK, FRAMES, NFR); IDs nunca se reutilizam],
  [RN#emph[k], A#emph[k], Q#emph[k], FA#emph[k]], [Regra de negócio local, assunção, questão em aberto e fluxo alternativo específicos de um caso de uso (referenciados nas tabelas partilhadas com qualificação, e.g. `UC-VID-001/RN2`)],
  [RNG-nn], [Regra de negócio transversal à extensão de vídeo (RNG-01 a RNG-06)],
  [DQ-nnn], [Decisão de qualidade e arquitetura global da Fase 1 (DQ-001 a DQ-011)],
  [DA-nn], [Decisão arquitetural formal (Capítulo 8 — Arquitetura)],
  [TST-{FUNC}-nn], [Caso de teste automatizado ou manual com critério Dado... Quando... Então... (Capítulo 10 — Testes)],
  [T-nn], [Tarefa de manutenção corretiva da solução de base (Capítulo 11)],
  [UCnn, RFnn, RNFnn], [Elementos da baseline do PictuRAS v27.1 referenciados quando sofreram alteração (ALT)],
)
