# Prompt para o Claude Code: alinhar a documentação com o ADD v1.1

> Copia tudo a partir da linha seguinte e cola numa sessão do Claude Code aberta na raiz do repositório `picturas-27-extension`.

---

És o responsável por pôr a documentação de requisitos e casos de uso do PictuRAS coerente com o **ADD v1.1** (`docs/add.md`). O ADD é o documento **mestre**: quando outro documento diverge dele, é o outro documento que muda. Responde e escreve sempre em **português de Portugal**, com o estilo, a terminologia e o formato de tabelas que os ficheiros já usam.

## Regras

1. **Não alteres** `docs/add.md` nem `docs/merge.md`.
2. Ficheiros a alterar: `docs/requirements.md`, `docs/requirements/*.md`, `docs/use-cases.md`, `docs/use-cases/*.md`, `docs/diagrams/modelo_dominio.puml` (e o `.png`) e `docs/inception/artefactos-finais.md`.
3. Antes de editar, lê o `docs/add.md` inteiro. Depois lê cada ficheiro antes de lhe mexer. Cada alteração tem de ser verificável contra uma secção do ADD (T-00 a T-10, 2.6, 4.1 a 4.10 ou Q-ADD-xx).
4. As questões Q-ADD em aberto são **dadas como aceites**, com a decisão que o próprio ADD propõe. Quando uma alteração vem de uma Q-ADD, acrescenta a referência ao ADD na coluna de origem ou de justificação (por exemplo `ADD v1.1, Q-ADD-21`).
5. Muda só o necessário. Mantém os IDs dos requisitos, das regras de negócio e dos fluxos, e não renumeres nada. Se acrescentares uma frase a um requisito, ajusta também o critério de aceitação quando ele deixar de bater certo.
6. Versões e datas (data: 2026-10-21):
   - ERS (`requirements.md`) passa a v2.4;
   - índice de casos de uso (`use-cases.md`) passa a v1.5;
   - cada UC alterado sobe a versão menor (v1.0 → v1.1, por exemplo);
   - cada vez que acrescentares uma linha de versão, regista que se trata do "alinhamento com o ADD v1.1".
   - **Não atualizes** as referências do ADD a "ERS v2.3" e "v1.4", porque o ADD não se altera.
7. No fim, corre as verificações da secção "Verificação final" e apresenta um resumo por ficheiro com o que mudou.
8. Trabalha num ramo novo e faz um commit por grupo de ficheiros (ERS, REQ, UC, diagramas e inception). Não faças push sem confirmação.

## Alterações a fazer

### 1. `docs/requirements.md`

**Tabela 4.2 (Impacto no Sistema Existente).** Reescreve-a segundo a regra 2.6 do ADD: **só acrescentar**. Nenhum elemento existente fica "Alterar". Usa "Estender (por acréscimo)" ou "Manter", e acrescenta uma frase antes da tabela que explique a regra.
- `apiGateway/routes/projects.js`: não muda. Router novo `apiGateway/routes/videos.js`, montado com uma linha `app.use` antes do existente. Rotas `/projects/:user/:project/videos/…`. *Middleware* novo `apiGateway/auth/videoAuth.js`: 401 sem JWT válido, 403 se o utilizador do token não for o `:user`. Retira as rotas antigas `POST /projects/:id/videos`, `/video/trim` e outras.
- Serviço de Projetos: router novo `projects/routes/videos.js` e módulos `projects/video/*` (registo de operações, `formats.js`, `filters.json`, `amqp.js`, `fileName.js`). Reutiliza `checkSharePermission`, `requireEditPermission` e `enforcePresenceLimit`, mas não `requireProjectVersion`.
- Modelos MongoDB: "Estender". Coleções novas `videos`, `VideoTask`, `VideoBatch` e `video_project_locks`. O modelo `Process` não muda. As predefinições de vídeo vão para `users/models/videoPreset.js`.
- Mensageria: módulo novo `projects/video/amqp.js`. Filas novas em `rabbitMQ/definitions.json`:
  - `video_operations_queue`: *quorum*, `x-delivery-limit: 1`, `x-consumer-timeout`, *dead-letter* para `video_project_queue`;
  - `video_project_queue`;
  - `video_ws_queue`;
  - exchange *fanout* `video_control`.

  O vídeo não usa `project_queue` nem `ws_queue`, e `projects/utils/project_msg.js` não muda.
- Workers: um worker único `Tools/video/`, com um módulo por operação e um único `-filter_complex` por cadeia. Recebe o plano de execução calculado no serviço de projetos. Brilho com `colorchannelmixer`, contraste e saturação com `eq`, filtros com `colorchannelmixer` ou `lutrgb`. Reutiliza `Tools/utils/rabbit_mq.py` e `env.py` sem os alterar, e não usa `tool_msg.py`.
- Armazenamento: módulo de vídeo novo no `imageStorageService` (`utils/videoStages.js`, `services/videoUrls.js`, `route/video.js`). URL pré-assinado de leitura (15 min, `ResponseContentDisposition`) e de escrita (PUT, só na rede interna). ZIP do lote gerado com `archiver` e `s3.upload()`. `stages.js` e `getPresignedUrl.js` não mudam.
- Utilizadores, subscrições e quotas: "Manter". Reutiliza `GET /:user/process/:n` e `POST /:user/process/refund/:n` tal como estão. Não há passo de `commit`: a reserva é o débito e a confirmação é não devolver. O Premium não chama a reserva. Retira `reserve`, `commit` e `rollback`. Em `users/` entram só ficheiros novos para as predefinições de vídeo.
- wsGateway: módulo novo `wsGateway/video.js`, que consome `video_ws_queue`. Eventos `video-task-update` e `video-batch-update` para a sala do utilizador e para `project:<id>`. Progresso em **todas** as operações.
- Linhas novas:
  - `nginx/nginx.conf`: `location /s3-video/` sem *buffering*, com `Range` e 206, e `log_format` sem a *query string`;
  - `docker-compose.yaml`: serviço do worker de vídeo e volume `video_tmp`;
  - `rabbitMQ/definitions.json`.

**Restantes secções:**
- **4.1.3**, linha "Estado, progresso…": o progresso 0–100% é emitido pelo menos uma vez por segundo em todas as operações, e não só na marca de água e na extração (ADD T-02).
- **4.1.2**: acrescenta as NFR-017 a 026 à lista. A concorrência de uma tarefa ativa passa a citar a NFR-021.
- **Referências a NFR anteriores à decomposição** (DQ-005, DQ-015, DQ-016 e matriz 4.3: UC-013 Passo 1, FA5, Exc. 2 e Exc. 3; UC-014 FA6 e Exc. 3; UC-015 Passo 1, FA5 e Exc. 1). Usa:
  - NFR-021 para a tarefa ativa;
  - NFR-022 para os clips por junção;
  - NFR-023 para os passos por cadeia;
  - NFR-024 para a duração da junção;
  - NFR-014 só para o lote;
  - NFR-020 para os fotogramas.

  Faz o mesmo na origem da BATCH-009, CHAIN-008, CONCAT-006 e CONCAT-007.
- **DQ-012**: a cópia de pré-visualização MP4 passa a cobrir também os originais e resultados MP4 com perfis H.264 que os navegadores não reproduzem (10 bits, 4:2:2, 4:4:4), recodificados para `yuv420p` (Q-ADD-20).
- **DQ-019**: a resolução e o fps passam a ser os do primeiro clip **à saída da sua sub-cadeia**, nas dimensões de apresentação. O silêncio só é acrescentado quando pelo menos um clip tem áudio; se nenhum tiver, o resultado fica sem áudio (ADD 4.8, Q-ADD-13).
- **DQ-020**, justificação: acrescenta que o contraste usa um pivô fixo (128), ao contrário do `ImageEnhance.Contrast`, que usa a média da imagem (Q-ADD-18).
- **DQ-021**, justificação: substitui "filtros FFmpeg standard" por "matrizes de cor 3×3 e inversão, aplicadas da mesma forma pelo sharp e pelo FFmpeg". As matrizes de Vintage, Frio e Quente ficam por definir (Q-ADD-07).
- **DQ-002**: se mencionar a cópia de streams na conversão, acrescenta que a cópia só acontece com o codec de origem **igual** ao codec de saída da matriz (Q-ADD-21).
- **4.5.1**: acrescenta uma nota a remeter para as Q-ADD-01 a 25 do ADD, que tratam as questões de arquitetura.
- **4.5.2**: corrige "15 requisitos funcionais nucleares" para o número real de REQ-VID-UPLOAD (20). Retira as ligações a `docs/novo.md`, que não existe (também na secção 0 e em `use-cases.md`, secção 3), ou substitui-as por uma descrição em texto.
- Revê a matriz 4.3 para continuar a bater certo com os UC depois das alterações abaixo, por exemplo na exceção 6 do UC-015.

### 2. `docs/requirements/REQ-VID-COM.md`

- **COM-006**: o contrato passa a `{operation, version, parameters}`. O `version` começa em 1 e versiona os parâmetros das receitas guardadas. A junção é um passo com os clips em `parameters.clips: [{videoId, steps}]`. Atualiza o critério (ADD T-01).
- **AUTH-002**: o critério passa a incluir que a API responde HTTP 403 a pedidos de utilizadores `anonymous`.
- **TASK-004**: no critério, só quem submeteu a tarefa a pode cancelar (os outros recebem 403), e só em `queued` ou `processing` (fora disso, 409). Uma subtarefa de lote não se cancela isoladamente: a resposta é 409 e cancela-se o lote (ADD T-03).
- **QUOTA-003**: o débito é feito na reserva e passa a definitivo quando a tarefa chega a `completed`, sem passo de confirmação separado. A confirmação corresponde a não devolver (Q-ADD-03).
- **STORAGE-005**: no critério, os vídeos e artefactos de um projeto eliminado são purgados pela rotina periódica de limpeza do serviço de projetos (ADD T-00, Q-ADD-14).
- **ERROR-001**: o critério passa a incluir o formato de erro `{error: {code, message, details}, correlationId}` (ADD T-10).

### 3. `docs/requirements/REQ-VID-NFR.md`

- **NFR-002**: no Alvo MVP, o `correlationId` é gerado no router de vídeo do API Gateway e vai no campo `correlationId` do corpo das mensagens de vídeo e das respostas de erro, não nas propriedades AMQP. Na origem, acrescenta os UC-VID-006 a 015.
- **NFR-007**: retira "sem retoma automática" do Alvo MVP. Passa a: reentrega da mensagem com recomeço do zero, no máximo duas entregas; depois, `failed` com devolução de créditos, sem recurso criado e com os temporários limpos. Corrige no mesmo sentido o critério "a base de dados purga o registo" (ADD T-03).
- **NFR-009**: Alvo MVP com progresso 0–100% pelo menos 1×/s em todas as operações. Na origem, acrescenta os UC-VID-001 a 003 e 008 a 015.
- **NFR-013**: no Alvo MVP, retira "ou intermédios sem perdas", porque a solução é um *filtergraph* único.

### 4. Restantes `docs/requirements/REQ-VID-*.md`

- **UPLOAD-008**: "contentor MP4" passa a "contentor MP4, MOV ou AVI".
- **UPLOAD-013 e 019**: os metadados passam a incluir a etiqueta de rotação e as dimensões de apresentação (Q-ADD-13).
- **UPLOAD-014**: acrescenta que, num vídeo com menos de 1 s, a miniatura é o fotograma 0 (Q-ADD-22). Acrescenta também que, além da miniatura, se guarda o fotograma 0 (rodado e reduzido a 1280 px) para as pré-visualizações (Q-ADD-06).
- **UPLOAD-016**: a cópia MP4 abrange também os MP4 com perfis H.264 que os navegadores não reproduzem (Q-ADD-20).
- **TRIM-010**: a stream de vídeo é recodificada para garantir a precisão ao milissegundo. Só é copiada quando o instante inicial coincide com um *keyframe*, e o áudio pode ser copiado (ADD T-02).
- **DOWNLOAD-002**: retira "associado ao utilizador" e, no critério, o caso "usado pelo utilizador B → 403". Os URLs pré-assinados são portadores e o controlo é a validade de 15 min (Q-ADD-05).
- **INFO-003**: a resolução apresentada é a de apresentação, já com a etiqueta de rotação aplicada (Q-ADD-13).
- **INFO-005**: explicita 1 MB = 1024² bytes e 1 GB = 1024³ bytes.
- **INFO-008**: acrescenta que uma origem que já não exista aparece como "Vídeo removido".
- **Dimensões ímpares** (ADJUST-009, FILTER-007, ORIENT-008, CONVERT-007, CONCAT-008): acrescenta a exceção. Quando um vídeo com uma dimensão ímpar é recodificado, corta-se 1 px para o par abaixo (Q-ADD-25). Atenção: a Q-ADD-25 cita a ORIENT-009, mas a resolução está na ORIENT-008.
- **RESIZE-001 e 007**: a largura e a altura referem-se às dimensões de apresentação. O `NO_CHANGES` compara com elas (Q-ADD-13).
- **RESIZE-008**: acrescenta que o resultado fica com rotação 0.
- **ORIENT-006**: o conjunto admitido passa a {0 (sem rotação), 90°, 180°, 270°}, para não rejeitar um pedido que tenha só espelho.
- **ORIENT-007**: o `NO_CHANGES` também se aplica a 180° com os dois espelhos, porque o resultado é igual ao original (Q-ADD-24).
- **CONVERT-006**: as streams só são copiadas quando o codec de origem é **igual** ao codec de saída da matriz. Exemplo: um MP4 H.264 convertido para AVI recodifica para MPEG-4 Part 2 (Q-ADD-21).
- **CONVERT-008**: a cópia MP4 abrange também os resultados MP4 com perfis que os navegadores não reproduzem (Q-ADD-20).
- **CONCAT-006 e 007**: cada ocorrência de um clip repetido conta para o número de clips e para a duração total.
- **CONCAT-008 e 012**: a resolução e o fps são os do primeiro clip à saída da sua sub-cadeia, em dimensões de apresentação.
- **CONCAT-009**: o silêncio só é acrescentado quando pelo menos um clip tem áudio.
- **CONCAT-010**: se nenhum clip tiver áudio, o resultado é um MP4 H.264 sem áudio.
- **CHAIN-012**: o passo corrente é aproximado, porque o grafo é único e não há fronteiras observáveis entre passos. Ajusta o critério, que hoje pede `step: 2` quando o segundo passo inicia (Q-ADD-16).
- **BATCH-012**: acrescenta "salvo se o lote for cancelado, caso em que transita para `cancelled` (BATCH-014)".
- **BATCH-015**:
  - na justificação, troca "reutiliza o mecanismo de ZIP existente" por "ZIP gerado em segundo plano com `archiver` (ZIP64)";
  - no critério, o pedido devolve 202; quando o ZIP está pronto há aviso e o URL assinado fica disponível;
  - o pedido só é aceite com o lote `completed`, ou `cancelled` com pelo menos um vídeo concluído.
- **BATCH-018**: "vídeos concluídos sobre o total" passa a "vídeos terminados (concluídos ou falhados) sobre o total". Ajusta o critério.
- **`quality-review.md`**: o mesmo parágrafo diz "240 requisitos" e "237 identificadores únicos". Conta os IDs reais e corrige.

### 5. `docs/use-cases.md` e `docs/use-cases/UC-VID-*.md`

**Em todos os UC-VID-001 a 015:**
- passo de conclusão: "confirma o consumo da quota" passa a "a reserva torna-se definitiva" (Q-ADD-03);
- FA de cancelamento em `queued`: "remove a tarefa da fila" passa a "marca a tarefa como `cancelled`; o worker descarta-a quando a consome".

**Por caso de uso:**
- **`use-cases.md`**: na lista de verificação, "v1.3" passa à versão nova.
- **UC-000**:
  - passo 6 e RN5: fotograma 0 em vídeos com menos de 1 s, e guarda do fotograma 0 para as pré-visualizações;
  - FA5 e RN8: cópia MP4 também para os MP4 incompatíveis;
  - passo 5: metadados com rotação e dimensões de apresentação;
  - A2: as ferramentas correm no worker de vídeo Python (`Tools/video/`).
- **UC-001**: passo 5 e A2 com recodificação do vídeo para precisão ao milissegundo e cópia só a partir de um *keyframe*. Retira "recodificação mínima nos limites de GOP". A Q1 passa a ter progresso percentual pelo menos 1×/s.
- **UC-002 e UC-003**: a Q1 passa a ter progresso percentual pelo menos 1×/s.
- **UC-003**, A2: o `atempo` só é encadeado abaixo de 0.5×, porque aceita 0.5 a 100 no FFmpeg 5.x.
- **UC-004**, Q1: o progresso passa a ser o tempo processado (`out_time_us`) sobre a duração.
- **UC-006**: no passo 2, na RN4 e na exceção 3, retira "associado ao utilizador" e o caso "usado por outro utilizador → 403". Mantém o sufixo do nome sugerido, que continua em aberto (Q-ADD-08), mas cita a Q-ADD-08.
- **UC-007**: passo 2 e RN4 com resolução de apresentação e unidades 1024² e 1024³. No FA1, uma origem removida aparece como "Vídeo removido".
- **UC-008**:
  - A1 é falsa para o brilho (o `eq=brightness` é aditivo); passa a "brilho com `colorchannelmixer`, contraste e saturação com `eq`" (Q-ADD-23);
  - RN2: nota sobre o pivô fixo do contraste (Q-ADD-18);
  - RN5: exceção de 1 px nas dimensões ímpares.
- **UC-009**:
  - A1: troca "`hue`, `colorchannelmixer`, `negate`, `curves`" por "matrizes 3×3 com `colorchannelmixer` e inversão com `lutrgb`";
  - RN5: exceção de 1 px;
  - acrescenta que as miniaturas do catálogo são aplicadas ao fotograma 0 reduzido.
- **UC-010**: passo 1, RN2 e exceção 2 com dimensões de apresentação. O resultado fica com rotação 0.
- **UC-011**:
  - RN4 e exceção 2: também a identidade (180° com os dois espelhos) dá `NO_CHANGES`;
  - RN2: o pedido pode ter rotação 0 quando tem só espelho;
  - RN5/RN6: exceção de 1 px.
- **UC-012**:
  - passo 5, FA1 e RN5: troca "admitidos" por "iguais aos codecs de saída da matriz";
  - RN7: cópia MP4 alargada;
  - RN6: exceção de 1 px;
  - Q1: os valores de qualidade por omissão ficam por definir (Q-ADD-11).
- **UC-013**:
  - passo 3 e RN5: o primeiro clip à saída da sua sub-cadeia, em dimensões de apresentação;
  - passo 6, RN6 e RN7: silêncio só com pelo menos um clip com áudio; sem nenhum, o resultado não tem áudio;
  - FA2: cada ocorrência conta para os limites.
- **UC-014**:
  - passo 6 e exceção 7: o passo corrente é aproximado, e o erro indica a fase (descarregamento, codificação ou *upload*) em vez do passo (Q-ADD-16);
  - A1: retira "(ou numa sequência com intermédios sem perdas)";
  - FA3: só cadeias sem junção podem ser guardadas, e as predefinições pertencem ao utilizador, sem partilha;
  - RN8: igual à regra geral da quota acima.
- **UC-015**:
  - FA1: o ZIP é gerado em segundo plano e o utilizador é avisado quando está pronto; só com o lote `completed`, ou `cancelled` com pelo menos um concluído;
  - A2: "o mecanismo ZIP existente pode ser estendido" passa a "ZIP novo com `archiver` em *streaming*, porque o `jszip` não suporta ZIP64";
  - exceção "Falha geral do worker": a mensagem é reentregue e, ao fim de duas entregas, só o item em curso falha (com devolução); o lote continua com os seguintes;
  - passo 6: "vídeos terminados / total";
  - passo 7: igual à regra geral da quota.

### 6. `docs/diagrams/`

- **`modelo_dominio.puml`**:
  - acrescenta a entidade **Lote**: `Projeto "1" --> "0..*" Lote : regista` e `Lote "1" --> "2..*" Trabalho de processamento : agrupa`;
  - acrescenta a entidade **Predefinição de vídeo**, separada do `Preset` de imagem: `Utilizador "1" --> "0..*" Predefinição de vídeo : cria` e `Predefinição de vídeo "0..*" --> "1..*" Ferramenta de vídeo : contém`;
  - muda "origina resultado" para `Video "1..*" --> "0..*" Video`, porque a junção tem várias origens;
  - mantém o estilo atual.
- Gera de novo `modelo_dominio.png` a partir do `.puml`. O Java está disponível; se faltar o `plantuml.jar`, tenta instalá-lo. Se não conseguires, diz-mo e não deixes um PNG desatualizado sem aviso.
- `diagrama_casos_uso.puml` e `.png`: não mudam.

### 7. `docs/inception/artefactos-finais.md`

- **§1**: descreve o Lote como entidade e a Predefinição de vídeo como separada do `Preset` de imagem, como no diagrama novo.
- **§5 (Bolts)**: no ADD, uma operação isolada é uma cadeia de um passo (T-01, T-02).
  - Passa para a B003 o registo de operações, o worker único e o executor de cadeias.
  - A B003 desbloqueia as B004 a B007, e a B008 fica com a junção e a validação de estrutura.
  - Refere a ordem de construção da Q-ADD-01: fundação T-00 e T-02 primeiro.
- **§5 (Riscos)**: "reserva, confirmação e estorno" passa a "reserva e estorno (a confirmação é não devolver)".

## Verificação final

1. Pesquisa e confirma que não ficaram restos das formulações antigas:
   - `commit`/`rollback` de quota;
   - `/video/trim`;
   - "admitidos no formato de saída";
   - "associado ao utilizador";
   - `eq` para o brilho;
   - "intermédios sem perdas";
   - "ZIP existente";
   - "Alterar" na tabela 4.2;
   - `docs/novo.md`.
2. Todas as referências REQ, DQ, NFR e UC citadas existem.
3. A matriz 4.3 continua a cobrir cada passo, FA, exceção e RN dos UC alterados.
4. As contagens (214 funcionais, 26 NFR e o total no `quality-review.md`) batem certo com os ficheiros.
5. Revê os ficheiros alterados uma segunda vez contra o ADD antes de terminar. O objetivo é que uma nova revisão não traga correções.
6. Apresenta o resumo por ficheiro e os commits feitos, e pergunta antes de fazer push.
