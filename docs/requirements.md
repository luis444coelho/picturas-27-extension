# 📝 Exercício 2 — Especificação de Requisitos do Sistema (ERS)
### Fase 1: Suporte a Vídeo no PictuRAS · Dossiê de Requisitos e Arquitetura

---

## 0. Identificação e Metadados do Dossiê

| **Campo** | **Valor** |
|---|---|
| **Grupo / Equipa** | Grupo 27 |
| **Autores** | Equipa PictuRAS-27 |
| **Data** | 2026-10-14 |
| **Versão do Dossiê** | v2.0 (Evolução do Exercício 1 v1.2 para ERS do Exercício 2) |
| **Caso de Uso / Âmbito** | UC-VID-001 a UC-VID-005 — Extensão para Suporte a Vídeo Digital (Trim, Áudio, Velocidade, Marca de Água e Fotogramas) |
| **Baseline do Exercício 1** | `docs/requirements.md` (v1.2) e `docs/use-cases.md` (v1.1) — 44 requisitos derivados |
| **Norma de Referência de Qualidade** | ISO/IEC 25010:2011 / ISO/IEC 25010:2023 |
| **Unidade Curricular** | Requisitos e Arquiteturas de Software — MEI, Universidade do Minho |

---

## 4. Especificação de Requisitos do Sistema (ERS)

**Casos de Uso Abrangidos:**
- **UC-VID-001**: Recorte temporal de um vídeo (*trim*)
- **UC-VID-002**: Remoção do áudio de um vídeo
- **UC-VID-003**: Alteração da velocidade de reprodução de um vídeo
- **UC-VID-004**: Aplicação de marca de água a um vídeo
- **UC-VID-005**: Extração de fotogramas de um vídeo para o projeto

**Baseline do Exercício 1:**
- Requisitos derivados iniciais: `REQ-VID-COM-001` a `006`, `REQ-VID-TRIM-001` a `005`, `REQ-VID-AUDIO-001` a `003`, `REQ-VID-SPEED-001` a `005`, `REQ-VID-WATERMARK-001` a `006`, `REQ-VID-FRAMES-001` a `008`, `REQ-VID-AUTH-001` a `003`, `REQ-VID-QUOTA-001` a `006`, `REQ-VID-VALID-001` a `005`, `REQ-VID-STORAGE-001` a `003`, `REQ-VID-TASK-001` a `007`, `REQ-VID-ERROR-001` a `003`, `REQ-VID-NFR-001` a `004`.
- Decisões aprovadas de qualidade: `DQ-001` a `DQ-010` (correspondentes às decisões estruturais D-VID-001 a D-VID-010).

---

### 4.1 Requisitos da ERS

#### 4.1.1 Requisitos Funcionais (estruturados por Caso de Uso)

As tabelas seguintes especificam os requisitos funcionais do sistema segundo o template formal do Exercício 2, agrupadas pelo caso de uso respetivo e pelos serviços transversais que suportam o pipeline de vídeo.

##### 4.1.1.1 Requisitos Funcionais Comuns e Transversais (Pipeline Base de Vídeo)

| **ID** | **Requisito** | **Prioridade** | **Evolução** | **Novo/Alt** | **Origem (UC / RN / decisão)** | **Justificação** | **Critério de aceitação / verificação** |
|---|---|---|---|---|---|---|---|
| **REQ-VID-COM-001** | O sistema deve permitir iniciar uma operação de vídeo apenas para um ficheiro de vídeo identificado e acessível no projeto do utilizador autenticado. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Pré-condições, Passo 1) | Porta de entrada de segurança e integridade de dados para todas as operações de vídeo. | Dado um utilizador autenticado, Quando submete uma operação para um vídeo inexistente ou de outro projeto, Então o pedido é rejeitado com erro HTTP 404 ou 403 sem criar tarefa. |
| **REQ-VID-COM-002** | O sistema deve disponibilizar o resultado de uma operação de vídeo apenas após a conclusão bem-sucedida da respetiva tarefa de processamento. | Deve ter | Refinado | ALT | UC-VID-001 a 005 (Pós-condição de Sucesso) | Evita a exposição de ficheiros corrompidos ou incompletos na galeria do utilizador. | Dado um processamento assíncrono em curso, Quando o utilizador consulta o projeto, Então nenhum artefacto temporário ou parcial é visível até à emissão do estado `completed`. |
| **REQ-VID-COM-003** | O sistema deve associar automaticamente o vídeo resultante ao projeto como novo recurso após a conclusão bem-sucedida do processamento. | Deve ter | Refinado | ALT | UC-VID-001 a 004 (Passo final, Pós-condição, DQ-007) | Garante a persistência não destrutiva do resultado mantendo o histórico de edições do projeto. | Dado o término com sucesso de uma operação de vídeo, Quando o processamento termina, Então o novo recurso surge listado no projeto com referência ao vídeo de origem (`sourceVideoId`). |
| **REQ-VID-COM-004** | O sistema deve validar todos os parâmetros de uma operação de vídeo antes de criar a tarefa de processamento na fila assíncrona. | Deve ter | Mantido | NOVO | UC-VID-001 a 005 (Passos de validação e confirmação) | Impede o consumo inútil de recursos computacionais nos workers com pedidos malformados. | Dado um conjunto de parâmetros introduzidos na interface, Quando o utilizador solicita a confirmação, Então os valores são verificados antes de ser gerada mensagem para a fila RabbitMQ. |
| **REQ-VID-COM-005** | O sistema deve rejeitar a criação da tarefa de processamento quando algum parâmetro for inválido, indicando o campo em falta ou incorreto. | Deve ter | Mantido | NOVO | UC-VID-001 a 005 (Exceções de parâmetros) | Facilita a usabilidade e a rápida correção por parte do utilizador sem custos de quota. | Dado um formulário com parâmetro fora dos limites suportados, Quando o utilizador confirma a operação, Então o sistema bloqueia a submissão e apresenta mensagem de erro contextualizada. |
| **REQ-VID-AUTH-001** | O sistema deve exigir um token JWT válido para permitir a submissão de qualquer uma das cinco operações de vídeo. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Pré-condições, RN1, DQ-001) | Protege as rotas da API contra abusos e assegura a identificação do utilizador responsável. | Dado um pedido HTTP sem cabeçalho Authorization ou com token expirado, Quando submetido a qualquer rota de vídeo, Então é devolvido o código HTTP 401 Unauthorized. |
| **REQ-VID-AUTH-002** | O sistema deve rejeitar qualquer tentativa de execução de operações de vídeo por utilizadores não autenticados (perfil anónimo). | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Pré-condições, RN1, DQ-001) | O processamento de vídeo exige persistência no projeto e controlo rigoroso de recursos. | Dado um utilizador anónimo, Quando tenta invocar uma operação de vídeo, Então o sistema impede o acesso e redireciona para o fluxo de autenticação/registo. |
| **REQ-VID-AUTH-003** | O sistema deve verificar que o utilizador autenticado possui permissão de proprietário ou de edição sobre o projeto antes de autorizar a submissão de uma operação de vídeo. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Pré-condições) | Preserva a integridade de projetos partilhados contra alterações não autorizadas. | Dado um utilizador com permissão apenas de leitura (read-only) num projeto partilhado, Quando tenta disparar uma operação de vídeo, Então recebe o código HTTP 403 Forbidden. |
| **REQ-VID-QUOTA-001** | O sistema deve verificar o saldo de quota diária do utilizador registado antes de autorizar a criação de qualquer tarefa de vídeo. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Passo 4, Exceção de quota, RN5, DQ-001) | Garante o cumprimento do modelo de negócio e evita a execução de tarefas sem crédito. | Dado um utilizador registado com 0 operações diárias disponíveis, Quando tenta confirmar qualquer operação de vídeo, Então a criação da tarefa é recusada com aviso de quota esgotada. |
| **REQ-VID-QUOTA-002** | O sistema deve reservar exatamente 1 operação da quota diária do utilizador registado no momento da aceitação da tarefa de vídeo. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Passo 4, RN5, DQ-001) | Evita condições de corrida e submissões concorrentes que violem o limite diário de 5 operações. | Dado um utilizador registado com saldo de 5 operações, Quando a tarefa entra no estado `queued`, Então o saldo transitório é decrementado para 4. |
| **REQ-VID-QUOTA-003** | O sistema deve confirmar o débito definitivo da operação de quota reservada apenas quando a tarefa atinge o estado de conclusão com sucesso (`completed`). | Deve ter | Refinado | ALT | UC-VID-001 a 005 (Passo final, Pós-condição, DQ-001) | Respeita a política de cobrança apenas por tarefas efetivamente entregues ao utilizador. | Dado um processamento com quota reservada, Quando a tarefa transita para `completed`, Então a operação reservada é consolidada sem novo decremento. |
| **REQ-VID-QUOTA-004** | O sistema deve devolver a operação de quota reservada ao saldo do utilizador registado em caso de cancelamento, rejeição ou falha de processamento. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (FA de cancelamento, Exceções, RN6, DQ-001) | Impede a penalização injusta da quota do utilizador em situações anómalas do sistema. | Dado um processamento que falha a meio, Quando a tarefa transita para `failed`, Então o saldo do utilizador registado é imediatamente reposto com a operação reservada. |
| **REQ-VID-QUOTA-005** | O sistema deve processar as operações de vídeo solicitadas por utilizadores Premium sem aplicar nem verificar qualquer limite de quota diária de operações. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (FA de Utilizador Premium, RN5, DQ-001) | Concretiza a proposta de valor do plano de subscrição Premium ilimitado. | Dado um utilizador autenticado com perfil Premium, Quando submete uma operação de vídeo, Então a operação inicia sem verificação nem consumo de quota diária. |
| **REQ-VID-QUOTA-006** | O sistema deve debitar a quota da operação de vídeo à conta do utilizador que executa a operação, mesmo quando este opere sobre um projeto partilhado pertencente a outro utilizador. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Pré-condições, DQ-008) | Evita a exaustão abusiva da quota do proprietário por terceiros com quem partilhou o projeto. | Dado um projeto partilhado pelo utilizador A com o utilizador B, Quando o utilizador B executa uma operação de vídeo, Então a quota consumida é a do utilizador B. |
| **REQ-VID-STORAGE-001** | O sistema deve armazenar os vídeos como recursos de projeto distintos de imagens, persistindo identificador único, nome de ficheiro, MIME type, duração, tamanho e data de carregamento. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Pré-condições, Pós-condições, DQ-003) | Modela adequadamente os atributos específicos de fluxos contínuos audiovisuais. | Dado um upload de vídeo bem-sucedido, Quando consultada a base de dados do projeto, Então existe um registo na coleção específica de recursos de vídeo com todos os metadados preenchidos. |
| **REQ-VID-STORAGE-002** | O sistema deve registar no recurso resultante da operação de vídeo a referência ao identificador do vídeo original de proveniência. | Deve ter | Mantido | ALT | UC-VID-001 a 004 (Pós-condição de Sucesso, DQ-003) | Permite rastrear a linhagem das transformações realizadas no projeto. | Dado um vídeo produzido por recorte, Quando inspecionados os seus metadados, Então o campo `sourceVideoId` corresponde exatamente ao identificador do vídeo recortado. |
| **REQ-VID-STORAGE-003** | O sistema deve aplicar aos recursos de vídeo as mesmas permissões e políticas de retenção e eliminação em vigor para os restantes recursos do projeto. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Pós-condições, RN de retenção, DQ-007) | Mantém a coerência da gestão do ciclo de vida dos dados em todo o ecossistema PictuRAS. | Dado um utilizador com permissão de eliminação de projeto, Quando elimina o projeto, Então todos os vídeos e resultados associados são purgados do armazenamento de objetos e da base de dados. |
| **REQ-VID-TASK-001** | O sistema deve executar as operações de vídeo através de tarefas assíncronas, devolvendo de imediato a resposta HTTP inicial com o identificador da tarefa e estado `queued`. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Passo de criação de tarefa, RN7, DQ-004) | Desacopla o tempo de resposta da API Gateway do tempo longo de processamento de ficheiros de vídeo. | Dado o envio de um pedido válido de processamento de vídeo, Quando a rota responde, Então o tempo de resposta HTTP é inferior a 1 s e o corpo inclui `taskId` e `status: "queued"`. |
| **REQ-VID-TASK-002** | O sistema deve gerir o ciclo de vida das tarefas de vídeo de acordo com os estados sucessivos `queued`, `processing`, `completed`, `failed` e `cancelled`. | Deve ter | Refinado | ALT | UC-VID-001 a 005 (Passos 5-6, Exceções e FA de cancelamento, DQ-004) | Define a máquina de estados canónica para orquestração distribuída via RabbitMQ e WebSockets. | Dado o registo de uma tarefa, Quando o ciclo de execução avança, Então a base de dados regista a sequência estrita de transições sem inversão temporal de estados. |
| **REQ-VID-TASK-003** | O sistema deve emitir as notificações de transição de estado da tarefa de vídeo para o cliente através do canal de WebSocket do projeto. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Passos 5-6, Notificação, DQ-004) | Permite ao frontend atualizar a interface reativamente sem recurso a polling contínuo. | Dado um cliente web com socket aberto no projeto, Quando o worker altera o estado da tarefa para `processing`, Então uma mensagem JSON é entregue ao cliente via socket em tempo real. |
| **REQ-VID-TASK-004** | O sistema deve permitir ao utilizador que submeteu a tarefa solicitar o seu cancelamento enquanto esta se encontrar no estado `queued` ou `processing`. | Deveria ter | Mantido | ALT | UC-VID-001 a 005 (FA de cancelamento, DQ-004) | Dá controlo ao utilizador para abortar operações longas submetidas por engano. | Dado um processamento de vídeo em curso, Quando o utilizador clica em Cancelar, Então o cliente envia pedido de cancelamento e o sistema regista a intenção de aborto. |
| **REQ-VID-TASK-005** | O sistema deve interromper a execução do worker de vídeo e eliminar artefactos temporários residuais quando o cancelamento da tarefa for confirmado. | Deveria ter | Mantido | ALT | UC-VID-001 a 005 (FA de cancelamento, Garantia Mínima, DQ-004) | Liberta imediatamente recursos de CPU/disco e impede a persistência de ficheiros orfãos. | Dado um cancelamento aceite pelo backend, Quando o worker recebe a instrução, Então suspende a codificação e purga do disco temporário os segmentos gerados. |
| **REQ-VID-ERROR-001** | O sistema deve emitir mensagens de erro com categoria estável e instrução corretiva perante qualquer falha de validação, limites, quota ou processamento. | Deve ter | Mantido | ALT | UC-VID-001 a 005 (Exceções de todos os casos) | Garante que o utilizador compreende a razão do insucesso e sabe que ação tomar para corrigir. | Dado um erro de formato de ficheiro, Quando a resposta é devolvida ao cliente, Então contém código semântico (e.g. `INVALID_CODEC`) e texto a sugerir a conversão para MP4/H.264. |

---

##### 4.1.1.2 Requisitos Funcionais do UC-VID-001 (Recorte Temporal — *Trim*)

| **ID** | **Requisito** | **Prioridade** | **Evolução** | **Novo/Alt** | **Origem (UC / RN / decisão)** | **Justificação** | **Critério de aceitação / verificação** |
|---|---|---|---|---|---|---|---|
| **REQ-VID-TRIM-001** | O sistema deve permitir ao utilizador registado ou premium definir o instante inicial e o instante final do intervalo de corte a conservar. | Deve ter | Mantido | NOVO | UC-VID-001 (Passos 2-3) | Mecanismo nuclear de seleção temporal para edição básica de vídeo. | Dado um vídeo carregado na interface de recorte, Quando o utilizador manipula os controlos temporais, Então os instantes inicial e final são preenchidos com os valores selecionados. |
| **REQ-VID-TRIM-002** | O sistema deve apresentar em tempo real a duração estimada do segmento resultante com base no intervalo de corte definido. | Deveria ter | Mantido | NOVO | UC-VID-001 (Passo 3, FA1) | Fornece feedback imediato ao utilizador sobre o tamanho do segmento que irá obter. | Dado um intervalo definido entre 00:10 e 00:35, Quando os valores são atualizados, Então a duração prevista de 25 segundos é imediatamente apresentada. |
| **REQ-VID-TRIM-003** | O sistema deve rejeitar intervalos de recorte em que o instante inicial seja maior ou igual ao instante final. | Deve ter | Mantido | NOVO | UC-VID-001 (Exceção 1, RN2) | Impede a geração de ficheiros de vídeo degenerados com duração nula ou negativa. | Dado o instante inicial 00:30 e instante final 00:20, Quando o utilizador tenta confirmar, Então o sistema rejeita a operação com mensagem de intervalo invertido. |
| **REQ-VID-TRIM-004** | O sistema deve rejeitar intervalos de recorte em que qualquer um dos instantes se encontre fora da duração total do vídeo. | Deve ter | Mantido | NOVO | UC-VID-001 (Exceção 2, RN2) | Garante a consistência dos limites face aos fotogramas existentes no ficheiro de origem. | Dado um vídeo com duração de 60 s, Quando o utilizador indica o instante final de 70 s, Então a submissão é bloqueada com indicação de que ultrapassa a duração máxima do ficheiro. |
| **REQ-VID-TRIM-005** | O sistema deve produzir um novo vídeo contendo exclusivamente o segmento compreendido entre o instante inicial e o instante final validados. | Deve ter | Refinado | NOVO | UC-VID-001 (Passo 6, Pós-condição de Sucesso, RN8) | Cumpre o objetivo principal do caso de uso produzindo o artefacto final recortado. | Dado um vídeo de 100 s com corte aprovado entre 00:10 e 00:40, Quando o processamento termina, Então a duração exata do vídeo resultante é de 30 segundos. |

---

##### 4.1.1.3 Requisitos Funcionais do UC-VID-002 (Remoção do Áudio)

| **ID** | **Requisito** | **Prioridade** | **Evolução** | **Novo/Alt** | **Origem (UC / RN / decisão)** | **Justificação** | **Critério de aceitação / verificação** |
|---|---|---|---|---|---|---|---|
| **REQ-VID-AUDIO-001** | O sistema deve verificar a presença de pelo menos uma stream de áudio no vídeo selecionado antes de iniciar a operação de remoção de áudio. | Deve ter | Mantido | NOVO | UC-VID-002 (Passo 1, RN2) | Valida a elegibilidade funcional da operação face ao conteúdo multimédia do ficheiro. | Dado um vídeo selecionado, Quando a interface de remoção de áudio é aberta, Então o sistema inspeciona os metadados do contentor quanto à existência de streams do tipo áudio. |
| **REQ-VID-AUDIO-002** | O sistema deve rejeitar a operação de remoção de áudio quando o vídeo selecionado não contiver streams de áudio, sem consumir quota do utilizador. | Deve ter | Mantido | NOVO | UC-VID-002 (Exceção 2, RN2) | Evita processamento redundante sobre ficheiros que já se encontram sem som e protege a quota. | Dado um vídeo silencioso (sem faixa de áudio), Quando o utilizador tenta remover áudio, Então o sistema recusa a operação, notifica que não existe áudio a remover e a quota diária permanece intacta. |
| **REQ-VID-AUDIO-003** | O sistema deve produzir uma nova versão do vídeo sem streams de áudio, preservando a componente visual original sem perdas nem recodificação adicional desnecessária. | Deve ter | Refinado | NOVO | UC-VID-002 (Passos 4-5, Pós-condição de Sucesso, RN8) | Remove os canais de áudio com eficiência computacional mantendo a integridade visual intacta. | Dado um vídeo com áudio e vídeo, Quando a remoção de áudio é concluída, Então o ficheiro resultante não contém streams de áudio e a stream de vídeo conserva codec, resolução e fotogramas originais. |

---

##### 4.1.1.4 Requisitos Funcionais do UC-VID-003 (Alteração da Velocidade de Reprodução)

| **ID** | **Requisito** | **Prioridade** | **Evolução** | **Novo/Alt** | **Origem (UC / RN / decisão)** | **Justificação** | **Critério de aceitação / verificação** |
|---|---|---|---|---|---|---|---|
| **REQ-VID-SPEED-001** | O sistema deve permitir ao utilizador registado ou premium indicar um fator de velocidade de reprodução para o vídeo. | Deve ter | Mantido | NOVO | UC-VID-003 (Passos 2-3) | Permite ao utilizador acelerar (*timelapse*) ou desacelerar (*câmara lenta*) conteúdos de vídeo. | Dado um vídeo selecionado, Quando o utilizador acede à operação de velocidade, Então o sistema disponibiliza controlos de introdução para o multiplicador de velocidade. |
| **REQ-VID-SPEED-002** | O sistema deve apresentar a duração estimada resultante calculada a partir do fator de velocidade introduzido. | Deveria ter | Mantido | NOVO | UC-VID-003 (Passo 2, FA1) | Informa o utilizador da consequência temporal da alteração de ritmo antes da confirmação. | Dado um vídeo de 60 s e a seleção do fator 2×, Quando o valor é introduzido, Então o sistema apresenta a duração estimada de 30 s. |
| **REQ-VID-SPEED-003** | O sistema deve rejeitar fatores de velocidade nulos, negativos ou iguais a zero. | Deve ter | Mantido | NOVO | UC-VID-003 (Exceção 1, RN2) | Fatores matematicamente inválidos impediriam a geração física de fotogramas e duração finita. | Dado um fator introduzido de 0× ou -1.5×, Quando o utilizador tenta confirmar, Então o sistema bloqueia a confirmação com aviso de valor estritamente positivo obrigatório. |
| **REQ-VID-SPEED-004** | O sistema deve rejeitar fatores de velocidade fora do intervalo homologado para o MVP (0.25× a 4.0×). | Deve ter | Mantido | NOVO | UC-VID-003 (Exceção 2, RN2, DQ-005) | Limita os extremos de estiramento ou compressão para assegurar estabilidade algorítmica no MVP. | Dado o fator 10×, Quando submetido, Então o sistema rejeita a operação indicando que o fator máximo permitido é 4.0×. |
| **REQ-VID-SPEED-005** | O sistema deve produzir um novo vídeo cuja duração total de reprodução seja ajustada inversamente ao fator de velocidade confirmado. | Deve ter | Refinado | NOVO | UC-VID-003 (Passo 5, Pós-condição de Sucesso, RN3, RN9) | Concretiza a alteração temporal do vídeo com sincronismo audiovisual contínuo. | Dado um vídeo de 40 s processado com fator 0.5×, Quando a operação termina, Então o vídeo resultante tem duração total de 80 s com cadência contínua. |

---

##### 4.1.1.5 Requisitos Funcionais do UC-VID-004 (Marca de Água em Vídeo)

| **ID** | **Requisito** | **Prioridade** | **Evolução** | **Novo/Alt** | **Origem (UC / RN / decisão)** | **Justificação** | **Critério de aceitação / verificação** |
|---|---|---|---|---|---|---|---|
| **REQ-VID-WATERMARK-001** | O sistema deve permitir ao utilizador registado ou premium escolher o tipo de marca de água entre texto e imagem. | Deve ter | Mantido | NOVO | UC-VID-004 (Passo 2, FA1) | Disponibiliza flexibilidade para proteção autoral textual ou via logótipo gráfico. | Dado o ecrã de marca de água, Quando o utilizador seleciona o seletor de tipo, Então os campos alternam entre entrada de texto ou carregamento/seleção de imagem. |
| **REQ-VID-WATERMARK-002** | O sistema deve permitir ao utilizador registado ou premium configurar a posição, o tamanho e a opacidade da marca de água. | Deve ter | Mantido | NOVO | UC-VID-004 (Passo 4) | Permite o enquadramento estético e funcional adequado da marca sobre a imagem do vídeo. | Dado um elemento de marca de água selecionado, Quando o utilizador ajusta posição (X, Y), escala e opacidade (0–100%), Então os valores ficam registados para aplicação. |
| **REQ-VID-WATERMARK-003** | O sistema deve rejeitar marcas de água com texto vazio ou com ficheiro de imagem corrompido ou em formato não suportado. | Deve ter | Mantido | NOVO | UC-VID-004 (Passo 3, Exceção 2) | Evita a tentativa de sobreposição de elementos inválidos que causariam falha no worker. | Dado um ficheiro de imagem inválido carregado como marca, Quando a validação ocorre, Então o sistema rejeita a imagem e não permite avançar. |
| **REQ-VID-WATERMARK-004** | O sistema deve rejeitar configurações de marca de água cujas coordenadas ou dimensões ultrapassem a área visível do quadro do vídeo. | Deve ter | Mantido | NOVO | UC-VID-004 (Passo 4, Exceção 3, RN3, DQ-009) | Assegura que o elemento de proteção visual fica efetivamente contido dentro dos limites do vídeo. | Dado um vídeo 1920×1080 e coordenada X de 2000 px, Quando o utilizador confirma, Então o sistema rejeita com indicação de transposição dos limites do quadro. |
| **REQ-VID-WATERMARK-005** | O sistema deve aplicar a marca de água configurada com posição, tamanho e opacidade fixos em todos os fotogramas do vídeo. | Deve ter | Refinado | NOVO | UC-VID-004 (Passo 6, Pós-condição de Sucesso, RN2, DQ-009) | Garante consistência visual ao longo de toda a reprodução do vídeo sem oscilações espaciais. | Dado um processamento concluído de marca de água, Quando inspecionados fotogramas no início, meio e fim do vídeo, Então a marca surge exatamente nas mesmas coordenadas e com a mesma opacidade. |
| **REQ-VID-WATERMARK-006** | O sistema deve apresentar uma pré-visualização estática da marca de água sobreposta a um fotograma do vídeo antes da submissão da tarefa. | Deveria ter | Mantido | NOVO | UC-VID-004 (Passo 4, FA2) | Reduz o erro humano permitindo inspecionar o resultado estético antes de gastar tempo e quota. | Dado o ajuste de posição ou opacidade, Quando a pré-visualização está ativa, Então o utilizador visualiza a composição simulada sobre o primeiro fotograma do vídeo. |

---

##### 4.1.1.6 Requisitos Funcionais do UC-VID-005 (Extração de Fotogramas para o Projeto)

| **ID** | **Requisito** | **Prioridade** | **Evolução** | **Novo/Alt** | **Origem (UC / RN / decisão)** | **Justificação** | **Critério de aceitação / verificação** |
|---|---|---|---|---|---|---|---|
| **REQ-VID-FRAMES-001** | O sistema deve permitir ao utilizador registado ou premium definir o intervalo [início, fim[, o passo regular N em segundos e o formato de saída (JPEG ou PNG). | Deve ter | Mantido | NOVO | UC-VID-005 (Passos 2-3, RN3, RN4, DQ-006) | Estabelece os parâmetros de amostragem temporal para transformar vídeo em imagens discretas. | Dado o formulário de extração, Quando acedido, Então apresenta campos para intervalo temporal, passo inteiro N (padrão 5 s) e seletor de formato (JPEG/PNG). |
| **REQ-VID-FRAMES-002** | O sistema deve apresentar em tempo real o número estimado de fotogramas a extrair correspondente aos instantes início + k×N estritamente inferiores ao instante fim. | Deve ter | Refinado | NOVO | UC-VID-005 (Passo 3, RN4, DQ-006) | Garante previsibilidade matemática para o utilizador quanto ao volume de imagens geradas. | Dado o intervalo [0s, 60s[ com passo N=5s, Quando os valores são inseridos, Então o sistema apresenta a contagem exata de 12 fotogramas (0, 5, ..., 55 s). |
| **REQ-VID-FRAMES-003** | O sistema deve rejeitar parâmetros de extração em que início ≥ fim, fim exceda a duração do vídeo, ou o passo N seja não inteiro ou inferior a 1 segundo. | Deve ter | Mantido | NOVO | UC-VID-005 (Exceção 1, RN4, DQ-006) | Evita amostragem excessivamente densa que saturaria o armazenamento e a rede no MVP. | Dado o passo N=0.5 s ou início=50s e fim=20s, Quando submetido, Então o botão de extração é bloqueado com mensagem de correção requerida. |
| **REQ-VID-FRAMES-004** | O sistema deve rejeitar pedidos de extração cujo número total de fotogramas estimado exceda o limite contratual do perfil do utilizador. | Deve ter | Mantido | NOVO | UC-VID-005 (Exceção 2, RN2, DQ-005) | Protege os recursos de armazenamento e base de dados do projeto contra sobrecargas massivas. | Dado um utilizador registado e uma estimativa de 60 fotogramas (limite=50), Quando tenta confirmar, Então o sistema bloqueia e sugere aumentar N ou migrar para Premium. |
| **REQ-VID-FRAMES-005** | O sistema deve permitir pré-visualizar uma amostra de fotogramas estimados sem criar tarefa no sistema, sem alterar o projeto e sem debitar quota diária. | Deveria ter | Mantido | NOVO | UC-VID-005 (FA1, RN10) | Permite validar a cadência visual da amostragem sem custos operacionais para a conta. | Dado o pedido de amostra, Quando o utilizador clica em pré-visualizar, Então são exibidas 3 miniaturas representativas sem alteração do saldo de quota ou da base de dados. |
| **REQ-VID-FRAMES-006** | O sistema deve extrair para cada instante temporal calculado o fotograma do vídeo temporalmente mais próximo desse instante. | Deve ter | Mantido | NOVO | UC-VID-005 (Passo 6, A4) | Assegura precisão determinística na seleção do quadro independentemente do frame rate do vídeo. | Dado um instante calculado de 10.0 s num vídeo com keyframes a 24 fps, Quando o worker processa o instante, Então seleciona o fotograma codificado mais próximo de t=10.0 s. |
| **REQ-VID-FRAMES-007** | O sistema deve adicionar todos os fotogramas extraídos ao projeto como imagens normais de forma atómica (tudo-ou-nada). | Deve ter | Refinado | ALT | UC-VID-005 (Passo 7, Pós-condição de Sucesso, RN7, RN11) | Permite reutilizar diretamente todo o catálogo de ferramentas de imagem sobre os fotogramas gerados. | Dado um pedido de 20 fotogramas, Quando a tarefa atinge `completed`, Então os 20 recursos de imagem surgem em simultâneo na galeria do projeto. |
| **REQ-VID-FRAMES-008** | O sistema deve descartar todos os fotogramas já gerados caso a extração falhe, expire ou seja cancelada antes da conclusão global. | Deve ter | Mantido | ALT | UC-VID-005 (FA2, Exceção 7, Garantia Mínima, RN7) | Evita a poluição do projeto com lotes incompletos que violariam o contrato transacional. | Dado um cancelamento voluntário aos 80% do processamento, Quando a tarefa é cancelada, Então nenhum dos fotogramas parciais é gravado ou associado ao projeto. |

---

#### 4.1.2 Requisitos Não Funcionais e de Qualidade (ISO/IEC 25010)

Esta secção formaliza os requisitos de qualidade do sistema classificados segundo a norma **ISO/IEC 25010**, distinguindo com rigor o **Alvo MVP** (obrigatório para validação funcional na Fase 1) do **Alvo de Produção** (solução madura para a Fase 2).

| **ID** | **Requisito com condição mensurável** | **Característica ISO/IEC 25010** | **Alvo MVP** | **Alvo produção** | **Evolução** | **Origem (UC / DQ)** | **Critério de aceitação / verificação** |
|---|---|---|---|---|---|---|---|
| **REQ-VID-NFR-001** | O sistema deve autenticar e validar as permissões de acesso ao projeto e aos URLs de transferência de vídeo através de tokens JWT com tempo de expiração estrito. | **Segurança** (Confidencialidade e Autenticidade) | Validação síncrona de JWT com expiração de 1 hora; URLs de storage com assinatura temporária (15 min). | Autenticação multifator (MFA), gestão granular de permissões ACL e URLs pré-assinados com expiração curta de 60 segundos com rotação de chaves. | Mantido | UC-VID-001 a 005 (Pré-condições, DQ-001) | Dado um URL de download de vídeo gerado para o utilizador A, Quando acedido após 16 minutos ou por outro utilizador, Então o pedido é recusado com HTTP 403 Forbidden. |
| **REQ-VID-NFR-002** | O sistema deve associar e propagar um identificador de correlação (`correlationId`) único em todos os eventos de log dos microserviços e mensagens RabbitMQ. | **Fiabilidade** (Rastreabilidade e Auditabilidade) | Geração de UUID no API Gateway propagado aos headers HTTP e propriedades da mensagem AMQP. | Rastreio distribuído distribuído com OpenTelemetry, exportação em tempo real para Jaeger/Elastic e métricas APM de latência por nó. | Refinado | UC-VID-001 a 005 (Rastreabilidade operacional) | Dado o disparo de uma operação de vídeo, Quando inspecionados os logs do Gateway, Projects e Worker Python, Então todos contêm o mesmo `correlationId`. |
| **REQ-VID-NFR-003** | O sistema deve aceitar na entrada e gerar nos resultados de vídeo exclusivamente o contentor MP4 com streams codificadas em H.264 (vídeo) e AAC (áudio). | **Compatibilidade** (Interoperabilidade de Formatos) | Suporte exclusivo a MP4 (H.264/AAC); rejeição determinística de qualquer outro formato/codec. | Suporte a matriz alargada de contentores (MP4, WebM, MOV, MKV) e codecs (H.264, H.265/HEVC, VP9, AV1, ProRes) com transcodificação automática. | Mantido | UC-VID-001 a 004 (RN de formatos, DQ-002) | Dado o envio de ficheiro WebM ou AVI, Quando analisado na API, Então é rejeitado com código `UNSUPPORTED_FORMAT`; ficheiro MP4/H.264 é aceite. |
| **REQ-VID-NFR-004** | O sistema deve gerar as imagens resultantes da extração de fotogramas estritamente em formato JPEG ou PNG, conservando sem distorção a resolução original do vídeo. | **Compatibilidade** (Coerência de Dados) | Exportação em JPEG e PNG com resolução idêntica à stream de vídeo de entrada. | Exportação em JPEG, PNG, WebP e AVIF com opções configuráveis de compressão e redimensionamento espacial. | Mantido | UC-VID-005 (Passo 7, RN3, DQ-002) | Dado um vídeo 1920×1080 px, Quando os fotogramas são exportados em JPEG, Então todas as imagens geradas possuem exatamente a dimensão 1920×1080 px. |
| **REQ-VID-NFR-005** | O sistema deve responder à submissão de qualquer operação de vídeo na API REST confirmando a aceitação da tarefa em fila em menos de 1 segundo. | **Eficiência de Desempenho** (Comportamento Temporal) | Tempo de resposta HTTP $\leq 1000$ ms para aceitação e enfileiramento da tarefa em fila RabbitMQ. | Tempo de resposta HTTP $\leq 200$ ms (percentil 95) com processamento de confirmação edge. | Novo | UC-VID-001 a 005 (Passo de criação de tarefa, DQ-004) | Dado o envio de um pedido válido com ficheiro de 200 MB, Quando a API responde, Então o tempo decorrido até receber o `taskId` e status `queued` é $\leq 1$ s. |
| **REQ-VID-NFR-006** | O sistema deve processar tarefas de vídeo de forma 100% assíncrona desacoplada através de workers especializados em fila RabbitMQ, sem bloquear a navegação do utilizador. | **Eficiência de Desempenho** (Utilização de Recursos) | Execução assíncrona via RabbitMQ; cliente HTTP livre imediatamente após submissão. | Fila prioritária com alocação elástica de workers em Kubernetes baseada na carga da fila (HPA). | Novo | UC-VID-001 a 005 (Passos 5-6, DQ-004) | Dado o início do processamento de um vídeo longo, Quando o utilizador navega noutros ecrãs da aplicação, Então a navegação decorre com total fluidez. |
| **REQ-VID-NFR-007** | O sistema deve assegurar a não contaminação e integridade da base de dados perante falhas a meio da execução, não deixando ficheiros parciais nem registos órfãos. | **Fiabilidade** (Tolerância a Falhas e Recuperabilidade) | Limpeza reativa de temporários na receção de sinal de erro/falha; sem retoma automática. | Recuperação transacional com saga pattern distribuído, checkpoints periódicos a cada 10% do vídeo e retoma automática do último checkpoint. | Refinado | UC-VID-001 a 005 (Garantia Mínima, DQ-007) | Dado um worker terminado abruptamente com `kill -9` a meio de uma extração, Quando o sistema deteta a falha, Então a base de dados purga o registo e o disco temporário é limpo. |
| **REQ-VID-NFR-008** | O sistema deve impor limites contratuais estritos de duração, tamanho de ficheiro e concorrência máxima de tarefas ativas por projeto. | **Capacidade** (Limites Operacionais) | Registado: $\leq 5$ min / 200 MB / 50 frames; Premium: $\leq 60$ min / 2 GB / 500 frames; Máx. 1 tarefa ativa por projeto. | Quotas dinâmicas baseadas em subscrição com bursting temporário pago e escalonamento de concorrência até 5 tarefas simultâneas. | Mantido | UC-VID-001 a 005 (Exceções de limites, DQ-005) | Dado um vídeo de 5 min e 10 s submetido por utilizador registado, Quando validado, Então é bloqueado antes da criação da tarefa. |
| **REQ-VID-NFR-009** | O sistema deve transmitir atualizações contínuas de progresso numérico de 0% a 100% via WebSocket com cadência mínima de 1 atualização por segundo ou por fotograma. | **Usabilidade** (Transparência Operacional) | Progresso numérico (0–100%) emitido por fotograma para marca de água e extração; trim/áudio/velocidade apenas com `queued` e conclusão. | Progresso contínuo em todas as operações com cálculo dinâmico de tempo restante estimado (ETA) e débito de processamento (fps). | Refinado | UC-VID-004 (Passo 6), UC-VID-005 (Passo 5, DQ-004) | Dado um processamento de extração de fotogramas, Quando inspecionado o tráfego WebSocket, Então chegam eventos sequenciais monotonicamente crescentes até 100%. |
| **REQ-VID-NFR-010** | O processamento e descodificação de vídeo devem ser executados em contentores Docker isolados sem dependência de instalação local de binários no host do utilizador. | **Portabilidade** (Instalação e Ambiente) | Workers encapsulados em imagens Docker com FFmpeg e Python pré-instalados em ambiente Linux. | Arquitetura de micro-serviços agnóstica de SO compatível com ambientes Kubernetes, ECS e implantação serverless. | Novo | DQ-002, Requisitos de Arquitetura | Dado um novo servidor com Docker instalado, Quando se executa `docker compose up`, Então os workers de vídeo arrancam sem configuração manual de binários. |
| **REQ-VID-NFR-011** | O módulo de processamento de vídeo deve ser desacoplado via contratos de mensagens AMQP, permitindo adicionar novas operações sem modificar as ferramentas de imagem existentes. | **Manutenibilidade** (Modularidade e Extensibilidade) | Nova fila RabbitMQ independente (`video_operations_queue`) que não interfere com as filas de imagem legadas. | Arquitetura de plugins com registo dinâmico de workers e auto-descoberta de capacidades através de service registry. | Novo | Tabela de Impacto 4.2 | Dado o código das ferramentas existentes de imagem em `Tools/`, Quando os novos workers de vídeo são iniciados, Então nenhuma linha de código das ferramentas de imagem é alterada. |

---

#### 4.1.3 Verificação da Completude e dos Limites do Âmbito

A tabela seguinte avalia sistematicamente a cobertura dos tópicos nucleares estipulados no enunciado da ERS para as 5 operações de vídeo do PictuRAS:

| **Tópico a verificar** | **Aplicável?** | **Decisão / justificação** | **Requisito(s) relacionado(s)** |
|---|:---:|---|---|
| **Formato, codec, duração e dimensão do vídeo** | **Sim** | O sistema suporta exclusivamente o contentor MP4 com codecs H.264 e AAC para todas as operações de entrada e saída de vídeo, e JPEG/PNG para fotogramas extraídos. Impõe limites de duração e tamanho diferenciados por perfil (Registado: $\leq 5$ min e $\leq 200$ MB; Premium: $\leq 60$ min e $\leq 2$ GB). | REQ-VID-VALID-001, REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-NFR-003, REQ-VID-NFR-004, REQ-VID-NFR-008 |
| **Estado, progresso, cancelamento e resultado** | **Sim** | Implementado ciclo de vida assíncrono completo com estados `queued → processing → completed \| failed \| cancelled`. Progresso contínuo 0–100% via WebSocket nas operações que processam fotograma a fotograma (marca de água e extração). Cancelamento suportado com interrupção do worker e limpeza de temporários. | REQ-VID-TASK-001 a 005, REQ-VID-NFR-005, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **Falhas durante o processamento** | **Sim** | Política estrita de integridade: em caso de falha durante a descodificação, recorte ou codificação, o vídeo original é preservado, nenhum resultado parcial é gravado no projeto, os temporários são purgados e a operação de quota reservada é estornada ao utilizador registado. | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-FRAMES-008, REQ-VID-ERROR-001 a 003, REQ-VID-NFR-007 |
| **Persistência e expiração dos ficheiros** | **Sim** | Os vídeos e resultados de transformações são armazenados como recursos de projeto permanentes no SeaweedFS/S3, com metadados persistidos no MongoDB e referência ao vídeo de origem (`sourceVideoId`). Seguem o ciclo de vida e permissões do projeto onde residem. | REQ-VID-COM-003, REQ-VID-COM-004, REQ-VID-STORAGE-001 a 003, REQ-VID-NFR-001 |
| **Perfis e contagem de operações** | **Sim** | Acesso reservado a utilizadores Registados e Premium (Anónimos excluídos). Cada operação consome exatamente 1 crédito da quota diária de 5 operações do utilizador Registado. O perfil Premium tem acesso ilimitado. Em projetos partilhados, a quota é imputada ao utilizador executor da operação. | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-001 a 006, REQ-VID-NFR-008 |
| **Encadeamento de ferramentas e processamento em lote** | **Sim (com exclusão explícita)** | **Decisão de Âmbito para o MVP:** O encadeamento de ferramentas (*tool chaining*) e o processamento em lote (*batch processing*) aplicam-se **exclusivamente aos fotogramas extraídos** após a sua conversão em imagens normais do projeto. O encadeamento de operações de vídeo entre si (e.g., recortar e logo a seguir aplicar marca sem passar pelo projeto) e o processamento em lote de múltiplos vídeos em simultâneo ficam **explicitamente excluídos do âmbito do MVP da Fase 1**. | REQ-VID-FRAMES-007, REQ-VID-STORAGE-001 (Justificado no UC-VID-005 RN11 e A6) |

---

### 4.2 Impacto no Sistema Existente

A tabela seguinte documenta a análise de impacto no sistema existente do PictuRAS provocada pela introdução da ERS de vídeo:

| **Elemento existente afetado** | **Impacto (Manter / Estender / Alterar)** | **Descrição do impacto** | **Requisito(s) relacionado(s)** |
|---|:---:|---|---|
| `apiGateway/routes/projects.js` | **Estender** | Expor rotas dedicadas para submissão das cinco operações de vídeo (`/video/trim`, `/audio`, `/speed`, `/watermark`, `/extract-frames`). Validar token JWT, permissão de projeto e parâmetros sintáticos antes de despachar a mensagem. | REQ-VID-COM-001, REQ-VID-COM-004, REQ-VID-COM-005, REQ-VID-AUTH-001 a 003, REQ-VID-NFR-005 |
| Serviço de Projetos (`projects/routes/projects.js`) | **Estender** | Incorporar lógica de negócio para orquestração de vídeo, associação de recursos de vídeo e fotogramas ao projeto, e gestão de permissões partilhadas (read/edit). | REQ-VID-COM-001, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-FRAMES-007, REQ-VID-STORAGE-001 a 003 |
| Modelos de Dados MongoDB (`projects/models/`) | **Alterar** | Criar esquema específico para recursos de vídeo (`videos`), armazenando metadados de codec, resolução, duração e stream. Alterar o esquema de tarefas para suportar operações de vídeo e relacionar resultados ao vídeo de origem (`sourceVideoId`). | REQ-VID-STORAGE-001, REQ-VID-STORAGE-002, REQ-VID-TASK-002, REQ-VID-NFR-002 |
| Mensageria e Filas (`projects/utils/project_msg.js`, RabbitMQ) | **Estender** | Criar nova fila dedicada (`video_operations_queue`) e contratos de mensagem com campos para tipo de operação, parâmetros validados e identificadores de correlação, preservando as filas existentes de imagem. | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-TASK-004, REQ-VID-NFR-002, REQ-VID-NFR-011 |
| Workers de Processamento (`Tools/` e serviços Python) | **Estender** | Desenvolver novos workers em Python com FFmpeg para recorte temporal, remoção de áudio, alteração de velocidade, marca de água e extração de fotogramas, suportando cancelamento e emissão de progresso. | REQ-VID-TRIM-005, REQ-VID-AUDIO-003, REQ-VID-SPEED-005, REQ-VID-WATERMARK-005, REQ-VID-FRAMES-006, REQ-VID-TASK-005, REQ-VID-NFR-003, REQ-VID-NFR-010 |
| Armazenamento de Objetos (`imageStorageService`, SeaweedFS/S3) | **Estender** | Suportar upload, leitura e geração de URLs assinados temporários para ficheiros de grande porte de vídeo (até 2 GB) e gestão de ficheiros temporários, sem colisão com os caminhos dos artefactos de imagem. | REQ-VID-COM-002, REQ-VID-STORAGE-001, REQ-VID-ERROR-003, REQ-VID-NFR-001 |
| Subsistema de Autenticação JWT e Partilha (`shareAuth`) | **Estender** | Reutilizar a infraestrutura de validação de token JWT e permissões de link de partilha, adicionando a verificação de que o utilizador autenticado que dispara a operação é aquele a quem a quota diária é debitada. | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-006, REQ-VID-NFR-001 |
| Serviço de Subscrições e Quotas (`users/`, `subscriptions/`) | **Alterar** | Alterar a gestão de quotas diárias para contabilizar operações de vídeo (1 operação de vídeo = 1 crédito da quota diária de 5 ops do utilizador registado). Implementar mecanismos de reserva transitória (`reserve`), consolidação (`commit`) e estorno (`rollback`) em caso de falha/cancelamento. | REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-008 |
| Gateway de WebSockets (`wsGateway`) | **Estender** | Suportar tópicos de progresso para tarefas de vídeo, transmitindo eventos de transição de estado e percentagem de progresso numérico (0–100%) para operações que suportam progresso contínuo (marca de água e fotogramas). | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-009 |
| Interface Web Frontend (`frontend/`) | **Estender** | Desenvolver componentes de UI dedicados a vídeo: leitor de vídeo com seletor de recorte temporal, seletor de velocidade com estimativa de duração, painel de sobreposição de marca de água com pré-visualização, e configurador de fotogramas com estimativa e barra de progresso WebSocket. | REQ-VID-TRIM-001 a 002, REQ-VID-SPEED-001 a 002, REQ-VID-WATERMARK-001 a 006, REQ-VID-FRAMES-001 a 005, REQ-VID-TASK-004, REQ-VID-NFR-009 |

---

### 4.3 Matriz de Rastreabilidade Atualizada

A matriz seguinte rastreia cada requisito até aos elementos concretos dos casos de uso e às decisões de qualidade tomadas pela equipa.

#### 4.3.1 Matriz de Rastreabilidade Estruturada por Caso de Uso

##### Rastreabilidade — UC-VID-001 (Recorte Temporal de Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-001 Pré-condições** | JWT válido, permissão no projeto, vídeo MP4 elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-001 Passo 1** | Seleção do vídeo e apresentação das operações disponíveis | REQ-VID-COM-001 |
| **UC-VID-001 Passo 2** | Apresentação dos controlos de intervalo temporal | REQ-VID-TRIM-001 |
| **UC-VID-001 Passo 3** | Definição do intervalo e validação de duração estimada | REQ-VID-TRIM-001, REQ-VID-TRIM-002, REQ-VID-COM-004 |
| **UC-VID-001 Passo 4** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-001 Passo 5** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006 |
| **UC-VID-001 Passo 6** | Processamento assíncrono do recorte e consolidação de quota | REQ-VID-TRIM-005, REQ-VID-QUOTA-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-NFR-003 |
| **UC-VID-001 Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-001 FA1** | Alteração do intervalo antes da confirmação | REQ-VID-TRIM-001, REQ-VID-TRIM-002 |
| **UC-VID-001 FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-001 FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-001 FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-001 Exceção 1** | Instante inicial maior ou igual ao instante final | REQ-VID-COM-005, REQ-VID-TRIM-003, REQ-VID-ERROR-001 |
| **UC-VID-001 Exceção 2** | Instantes definidos fora da duração total do vídeo | REQ-VID-COM-005, REQ-VID-TRIM-004, REQ-VID-ERROR-001 |
| **UC-VID-001 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-001 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-001 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-001 Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-001 Garantia Sucesso** | Novo vídeo MP4 no projeto com intervalo válido, original preservado, 1 quota debitada | REQ-VID-TRIM-005, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| **UC-VID-001 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| **UC-VID-001 RN1 a RN9** | Regras de perfis, formato MP4, assincronismo, limites e quotas de trim | REQ-VID-AUTH-002, REQ-VID-TRIM-003 a 005, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-002 (Remoção de Áudio)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-002 Pré-condições** | JWT válido, permissão no projeto, vídeo com áudio elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-AUDIO-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-008 |
| **UC-VID-002 Passo 1** | Seleção do vídeo e verificação de presença de áudio | REQ-VID-COM-001, REQ-VID-AUDIO-001 |
| **UC-VID-002 Passo 2** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-002 Passo 3** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006 |
| **UC-VID-002 Passo 4** | Supressão de streams de áudio e preservação de stream visual | REQ-VID-AUDIO-003, REQ-VID-NFR-003 |
| **UC-VID-002 Passo 5** | Associação do resultado ao projeto e consolidação de quota | REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002 |
| **UC-VID-002 Passo 6** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-002 FA1** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-002 FA2** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-002 FA3** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-002 Exceção 1** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-002 Exceção 2** | Vídeo sem streams de áudio a remover | REQ-VID-AUDIO-002, REQ-VID-ERROR-001 |
| **UC-VID-002 Exceção 3** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-002 Exceção 4** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-002 Exceção 5** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-002 Garantia Sucesso** | Novo vídeo silencioso associado ao projeto, visual intacto, 1 quota debitada | REQ-VID-AUDIO-003, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| **UC-VID-002 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| **UC-VID-002 RN1 a RN9** | Regras de áudio obrigatório, formato MP4, assincronismo e quotas | REQ-VID-AUTH-002, REQ-VID-AUDIO-001 a 003, REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-003 (Alteração da Velocidade de Reprodução)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-003 Pré-condições** | JWT válido, permissão no projeto, vídeo MP4 elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-003 Passo 1** | Apresentação do vídeo e controlos de velocidade | REQ-VID-COM-001, REQ-VID-SPEED-001 |
| **UC-VID-003 Passo 2** | Indicação do fator e cálculo da duração estimada | REQ-VID-SPEED-001, REQ-VID-SPEED-002, REQ-VID-COM-004 |
| **UC-VID-003 Passo 3** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-003 Passo 4** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006 |
| **UC-VID-003 Passo 5** | Processamento assíncrono e cálculo da duração invertida | REQ-VID-SPEED-005, REQ-VID-NFR-003 |
| **UC-VID-003 Passo 6** | Associação do resultado ao projeto e consolidação de quota | REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002 |
| **UC-VID-003 Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-003 FA1** | Alteração do fator antes da confirmação | REQ-VID-SPEED-001, REQ-VID-SPEED-002 |
| **UC-VID-003 FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-003 FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-003 FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-003 Exceção 1** | Fator nulo, negativo ou igual a zero | REQ-VID-COM-005, REQ-VID-SPEED-003, REQ-VID-ERROR-001 |
| **UC-VID-003 Exceção 2** | Fator fora do intervalo homologado (0.25× a 4.0×) | REQ-VID-COM-005, REQ-VID-SPEED-004, REQ-VID-ERROR-001 |
| **UC-VID-003 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-003 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-003 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-003 Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-003 Garantia Sucesso** | Novo vídeo com velocidade ajustada, original preservado, 1 quota debitada | REQ-VID-SPEED-005, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| **UC-VID-003 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| **UC-VID-003 RN1 a RN9** | Regras de fator positivo, limites, assincronismo e quotas de velocidade | REQ-VID-AUTH-002, REQ-VID-SPEED-002 a 005, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |

---

##### Rastreabilidade — UC-VID-004 (Marca de Água em Vídeo)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-004 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível, elemento de marca acessível | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-004 Passo 1** | Seleção do vídeo e abertura da interface de configuração | REQ-VID-COM-001 |
| **UC-VID-004 Passo 2** | Seleção do tipo de marca (texto ou imagem) | REQ-VID-WATERMARK-001 |
| **UC-VID-004 Passo 3** | Entrada e validação do conteúdo da marca | REQ-VID-WATERMARK-003 |
| **UC-VID-004 Passo 4** | Ajuste de posição, tamanho e opacidade com pré-visualização | REQ-VID-WATERMARK-002, REQ-VID-WATERMARK-004, REQ-VID-WATERMARK-006, REQ-VID-COM-004 |
| **UC-VID-004 Passo 5** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-004 Passo 6** | Processamento fotograma a fotograma e emissão de progresso WebSocket | REQ-VID-WATERMARK-005, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-004 Passo 7** | Recomposição em MP4, associação ao projeto e consolidação de quota | REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002, REQ-VID-NFR-003 |
| **UC-VID-004 Passo 8** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **UC-VID-004 FA1** | Utilização de imagem como marca de água | REQ-VID-WATERMARK-001, REQ-VID-WATERMARK-003 |
| **UC-VID-004 FA2** | Alteração de parâmetros após pré-visualização estática | REQ-VID-WATERMARK-002, REQ-VID-WATERMARK-006 |
| **UC-VID-004 FA3** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-004 FA4** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-004 FA5** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-004 Exceção 1** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-004 Exceção 2** | Conteúdo ou ficheiro de imagem da marca inválido | REQ-VID-COM-005, REQ-VID-WATERMARK-003, REQ-VID-ERROR-001 |
| **UC-VID-004 Exceção 3** | Posição ou dimensão ultrapassa área visível do vídeo | REQ-VID-COM-005, REQ-VID-WATERMARK-004, REQ-VID-ERROR-001 |
| **UC-VID-004 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-004 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-004 Exceção 6** | Falha de processamento a meio da execução | REQ-VID-ERROR-001, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| **UC-VID-004 Garantia Sucesso** | Novo vídeo com marca aplicada uniformemente, original preservado, 1 quota debitada | REQ-VID-WATERMARK-005, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| **UC-VID-004 Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| **UC-VID-004 RN1 a RN9** | Regras de posição fixa estática, geometria visível, formato MP4, progresso WebSocket | REQ-VID-AUTH-002, REQ-VID-WATERMARK-004 a 005, REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-009 |

---

##### Rastreabilidade — UC-VID-005 (Extração de Fotogramas para o Projeto)

| **Elemento de Origem** | **Descrição Abreviada** | **Requisito(s) Relacionado(s)** |
|---|---|---|
| **UC-VID-005 Pré-condições** | JWT válido, permissão no projeto, vídeo elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| **UC-VID-005 Passo 1** | Abertura do projeto, visualização do saldo de quota e limites | REQ-VID-COM-001, REQ-VID-QUOTA-001 |
| **UC-VID-005 Passo 2** | Apresentação do configurador com valores padrão | REQ-VID-FRAMES-001 |
| **UC-VID-005 Passo 3** | Parametrização de intervalo, passo, formato e cálculo em tempo real da estimativa | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002, REQ-VID-COM-004 |
| **UC-VID-005 Passo 4** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| **UC-VID-005 Passo 5** | Notificação de estados de tarefa e emissão de progresso WebSocket | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **UC-VID-005 Passo 6** | Extração do fotograma disponível mais próximo para cada instante | REQ-VID-FRAMES-006 |
| **UC-VID-005 Passo 7** | Inclusão atómica dos fotogramas no projeto e consolidação de quota | REQ-VID-FRAMES-007, REQ-VID-QUOTA-003, REQ-VID-NFR-004 |
| **UC-VID-005 Passo 8** | Disponibilização das imagens extraídas na galeria e preservação do original | REQ-VID-COM-002, REQ-VID-STORAGE-003 |
| **UC-VID-005 FA1** | Pré-visualização de amostra estática sem quota | REQ-VID-FRAMES-005 |
| **UC-VID-005 FA2** | Cancelamento durante o processamento com descarte atómico | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-FRAMES-008, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **UC-VID-005 FA3** | Utilizador abandona a sessão com continuidade em background | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-NFR-006 |
| **UC-VID-005 FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| **UC-VID-005 FA5** | Aceitação de ajuste sugerido de passo N | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002 |
| **UC-VID-005 Exceção 1** | Parâmetros inválidos (início ≥ fim, fim > duração, N < 1s ou não inteiro) | REQ-VID-COM-005, REQ-VID-FRAMES-003, REQ-VID-ERROR-001 |
| **UC-VID-005 Exceção 2** | Contagem estimada de fotogramas excede o teto do perfil | REQ-VID-COM-005, REQ-VID-FRAMES-004, REQ-VID-ERROR-001 |
| **UC-VID-005 Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| **UC-VID-005 Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| **UC-VID-005 Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **UC-VID-005 Exceção 6** | Ficheiro corrompido ou erro de descodificação | REQ-VID-ERROR-001, REQ-VID-QUOTA-004 |
| **UC-VID-005 Exceção 7** | Falha de execução a meio do processamento | REQ-VID-ERROR-001, REQ-VID-FRAMES-008, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| **UC-VID-005 Exceção 8** | Armazenamento de projeto insuficiente para os fotogramas estimados | REQ-VID-ERROR-001, REQ-VID-QUOTA-004 |
| **UC-VID-005 Garantia Sucesso** | Inclusão de todos os fotogramas pedidos, resolução original preservada, 1 quota debitada | REQ-VID-FRAMES-007, REQ-VID-COM-002, REQ-VID-QUOTA-003, REQ-VID-NFR-004 |
| **UC-VID-005 Garantia Mínima** | Projeto intacto, zero fotogramas parciais adicionados, quota devolvida | REQ-VID-FRAMES-008, REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| **UC-VID-005 RN1 a RN11** | Regras de semiaberto [início, fim[, tetos 50/500, atomicidade tudo-ou-nada e integração | REQ-VID-AUTH-002, REQ-VID-FRAMES-001 a 008, REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-004, REQ-VID-NFR-008 |

---

#### 4.3.2 Decisões de Qualidade Introduzidas na ERS

| **ID** | **Decisão de Qualidade** | **Justificação** | **Requisito(s) Relacionado(s)** |
|---|---|---|---|
| **DQ-001** | Acesso restrito a utilizadores autenticados Registados e Premium com quota diária (5 ops/dia no plano Registado e ilimitado no Premium); exclusão de perfis anónimos. | Protege a capacidade de computação contra ataques de negação de serviço e sustenta o modelo de negócio da plataforma através de controlo transacional de créditos de processamento. | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-001 a 005, REQ-VID-NFR-001, REQ-VID-NFR-008 |
| **DQ-002** | Contentor MP4 de entrada e saída com codecs H.264 (vídeo) e AAC (áudio); exportação de fotogramas em JPEG/PNG. | Garante 100% de interoperabilidade nos navegadores web modernos sem necessidade de transcodificação em tempo real durante o MVP da Fase 1. | REQ-VID-NFR-003, REQ-VID-NFR-004, REQ-VID-TRIM-005, REQ-VID-AUDIO-003, REQ-VID-SPEED-005, REQ-VID-WATERMARK-005, REQ-VID-FRAMES-001 |
| **DQ-003** | Modelação explícita de recursos de vídeo na base de dados (MongoDB) e referência de proveniência (`sourceVideoId`). | Separa a semântica de streams multimédia contínuos dos artefactos de imagem estática, permitindo rastrear o histórico de transformações do projeto. | REQ-VID-STORAGE-001, REQ-VID-STORAGE-002, REQ-VID-COM-003 |
| **DQ-004** | Orquestração assíncrona orientada a eventos via RabbitMQ e WebSockets com máquina de estados canónica (`queued → processing → completed \| failed \| cancelled`). | Desacopla o gateway HTTP da carga computacional pesada, assegurando que o utilizador recebe resposta imediata e navega livremente enquanto o trabalho decorre. | REQ-VID-TASK-001 a 005, REQ-VID-NFR-005, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| **DQ-005** | Limites contratuais rígidos de duração e volume no MVP (Registado: $\leq 5$ min / 200 MB / 50 frames; Premium: $\leq 60$ min / 2 GB / 500 frames; máx. 1 tarefa ativa/projeto). | Evita o esgotamento do armazenamento e saturação dos workers por pedidos anómalos ou maliciosos durante a fase de validação funcional do produto. | REQ-VID-SPEED-004, REQ-VID-FRAMES-004, REQ-VID-NFR-008 |
| **DQ-006** | Semântica matemática de intervalo semiaberto `[início, fim[` para amostragem temporal com cardinalidade calculada por timestamps discretos $\text{início} + k \times N < \text{fim}$. | Elimina ambiguidades na contagem de fotogramas e garante que a estimativa apresentada na interface coincide exatamente com o número de ficheiros entregues no projeto. | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002, REQ-VID-FRAMES-003 |
| **DQ-007** | Garantia de não publicação parcial e estorno automático de quota perante cancelamento voluntário ou falha técnica. | Preserva a integridade e consistência transacional do projeto do utilizador, assegurando que este nunca fica com lotes parciais inúteis nem perde quota por anomalias do sistema. | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-004, REQ-VID-FRAMES-008, REQ-VID-NFR-007 |
| **DQ-008** | Imputação do consumo de quota à conta do utilizador executor da operação em projetos partilhados. | Impede que utilizadores convidados com permissão de edição esgotem a quota do dono do projeto, alinhando a responsabilidade de débito com o agente ativo. | REQ-VID-QUOTA-006 |
| **DQ-009** | Geometria estática invariante da marca de água ao longo de toda a duração temporal do vídeo. | Simplifica a validação e o algoritmo do worker na Fase 1 do MVP, garantindo consistência visual estável sem sobrecarga de interpolação espacial de keyframes. | REQ-VID-WATERMARK-004, REQ-VID-WATERMARK-005 |
| **DQ-010** | Distinção formal entre Alvo MVP e Alvo de Produção segundo a ISO/IEC 25010 para sustentação da Fase 2 de melhoria por refactoring. | Permite validar funcionalmente a extensão na Fase 1 sem impor prematuramente metas de alta disponibilidade, clusterização elástica ou SLA de produção industrial. | REQ-VID-NFR-001 a REQ-VID-NFR-011 |

---

#### 4.3.3 Verificações de Cobertura

- [x] **Cada requisito funcional e não funcional aparece na matriz**: Todos os 33 requisitos funcionais e 11 requisitos não funcionais da ERS estão mapeados na secção 4.3.
- [x] **Cada requisito tem origem identificada**: Todas as linhas possuem ligação direta a um passo do fluxo, exceção, regra de negócio ou decisão de qualidade documentada.
- [x] **Todos os elementos relevantes do caso de uso têm requisito associado**: Pré-condições, passos de 1 a 7/8, fluxos alternativos, exceções, garantias pós-condicionais e regras de negócio de todos os cinco casos de uso estão integralmente cobertos.
- [x] **Os tópicos excluídos na secção 4.1.3 estão justificados**: O encadeamento de ferramentas entre vídeos e o lote de múltiplos vídeos foram formalmente excluídos do MVP na secção 4.1.3 com fundamentação de escopo.
- [x] **O impacto no sistema existente está atualizado e ligado aos requisitos relevantes**: A secção 4.2 abrange todos os serviços afetados com indicação dos IDs de requisitos correspondentes.

---

## ✅ Lista de Verificação antes de Entregar

- [x] As secções 0 a 3 do dossiê foram preservadas em `docs/use-cases.md`; as assunções, questões em aberto e utilização de IA encontram-se alinhadas.
- [x] A funcionalidade, os casos de uso (UC-VID-001 a 005) e os perfis (Registado/Premium) do Exercício 1 foram rigorosamente mantidos.
- [x] Requisitos funcionais estão completos para o âmbito das 5 operações e possuem critérios verificáveis no formato *Dado... Quando... Então...*.
- [x] Requisitos de qualidade estão classificados segundo a norma **ISO/IEC 25010** e distinguem expressamente o **Alvo MVP** do **Alvo de Produção**.
- [x] Os IDs derivados do Exercício 1 foram preservados para manter a rastreabilidade histórica.
- [x] A análise de completude não alargou o âmbito arbitrariamente, fundamentando as decisões de contorno.
- [x] A matriz de rastreabilidade não tem requisitos órfãos nem elementos relevantes do caso de uso por cobrir.
- [x] As decisões de qualidade (`DQ-001` a `DQ-010`) e os respetivos requisitos encontram-se catalogados e justificados.
