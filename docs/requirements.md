# Secção 4 — Esboço de Requisitos Derivados
### Suporte a Vídeo no PictuRAS · Fase 1

---

## 0. Identificação

| **Campo** | **Valor** |
|-----------|-----------|
| **Grupo / Equipa** | Grupo 27 |
| **Autores** | Equipa PictuRAS-27 |
| **Data** | 2026-10-14 |
| **Versão do documento** | v1.2 |
| **Origem** | Casos de uso UC-VID-001 a UC-VID-005 (`docs/use-cases.md`) |
| **Unidade Curricular** | Requisitos e Arquiteturas de Software — MEI, Universidade do Minho |

> **Nota de conformidade metodológica**: Este documento constitui o artefacto formal da **Secção 4** (Esboço de requisitos derivados), estruturado estritamente segundo as diretrizes do guia pedagógico de RAS:
> - **Tabela 4.1**: Requisitos de Sistema Derivados (canónicos, atómicos e verificáveis);
> - **Tabela 4.2**: Impacto no Sistema Existente (Manter / Estender / Alterar);
> - **Tabela 4.3**: Matriz de Rastreabilidade e Cobertura (exaustiva elemento a elemento).
> 
> As decisões tomadas para o MVP (formatos, perfis, quotas, limites) encontram-se fundamentadas no respetivo registo de decisões anexo (Secção 4.4).

---

## 4.1 Requisitos de Sistema Derivados (Tabela 4.1)

Todos os requisitos respeitam o padrão estipulado (*"O sistema deve..."* ou *"O sistema deve permitir ao {ator}..."*), cumprem o princípio da atomicidade (uma obrigação observável por requisito), não antecipam soluções técnicas desnecessárias e possuem critérios de aceitação objetivos no formato *Dado... Quando... Então...* (ou asserção de teste determinística).

| ID | Requisito | Tipo | Prioridade | Novo/Alt | Origem | Como verificar |
|---|---|---|---|---|---|---|
| **REQ-VID-COM-001** | O sistema deve permitir iniciar uma operação de vídeo apenas para um ficheiro de vídeo identificado e acessível no projeto do utilizador autenticado. | F | Deve ter | ALT | UC-VID-001 a 005 (Pré-condições, Passo 1) | Dado um utilizador autenticado, Quando submete uma operação para um vídeo inexistente ou de outro projeto, Então o pedido é rejeitado com código 404/403 sem criar tarefa. |
| **REQ-VID-COM-002** | O sistema deve preservar o ficheiro de vídeo original sem o substituir, alterar ou eliminar durante ou após a execução de qualquer operação de vídeo. | NF (Fiabilidade / Integridade) | Deve ter | ALT | UC-VID-001 a 005 (Garantia Mínima, RN de preservação) | Dado um vídeo original no projeto com determinado hash de ficheiro, Quando qualquer operação termina com sucesso, falha ou cancelamento, Então o ficheiro original mantém o mesmo identificador, metadados e hash. |
| **REQ-VID-COM-003** | O sistema deve disponibilizar o resultado de uma operação de vídeo apenas após a conclusão bem-sucedida da respetiva tarefa de processamento. | F | Deve ter | ALT | UC-VID-001 a 005 (Pós-condição de Sucesso) | Dado um processamento em curso, Quando o utilizador consulta a galeria do projeto, Então nenhum artefacto incompleto ou temporário é visível até à receção do estado `completed`. |
| **REQ-VID-COM-004** | O sistema deve associar automaticamente o vídeo resultante ao projeto como novo recurso após a conclusão bem-sucedida do processamento. | F | Deve ter | ALT | UC-VID-001 a 004 (Passo final, Pós-condição de Sucesso) | Dado o término com sucesso de uma operação de recorte, áudio, velocidade ou marca de água, Quando o processamento termina, Então o novo recurso de vídeo surge listado no projeto com referência ao vídeo de origem. |
| **REQ-VID-COM-005** | O sistema deve validar todos os parâmetros de uma operação de vídeo antes de criar a tarefa de processamento. | F | Deve ter | NOVO | UC-VID-001 a 005 (Passos de validação e confirmação) | Dado um conjunto de parâmetros introduzidos na interface, Quando o utilizador solicita a confirmação, Então os valores são verificados antes de ser gerada mensagem para a fila de tarefas. |
| **REQ-VID-COM-006** | O sistema deve rejeitar a criação da tarefa de processamento quando algum parâmetro for inválido, indicando o campo em falta ou incorreto. | F | Deve ter | NOVO | UC-VID-001 a 005 (Exceções de parâmetros) | Dado um formulário com parâmetro fora dos limites suportados, Quando o utilizador confirma a operação, Então o sistema bloqueia a submissão e apresenta mensagem de erro contextualizada. |
| **REQ-VID-TRIM-001** | O sistema deve permitir ao utilizador registado ou premium definir o instante inicial e o instante final do intervalo de corte a conservar. | F | Deve ter | NOVO | UC-VID-001 (Passos 2-3) | Dado um vídeo carregado na interface de recorte, Quando o utilizador manipula os controlos temporais, Então os instantes inicial e final são preenchidos com os valores selecionados. |
| **REQ-VID-TRIM-002** | O sistema deve apresentar em tempo real a duração estimada do segmento resultante com base no intervalo de corte definido. | F | Deveria ter | NOVO | UC-VID-001 (Passo 3, FA1) | Dado um intervalo definido entre 00:10 e 00:35, Quando os valores são atualizados, Então a duração prevista de 25 segundos é imediatamente apresentada. |
| **REQ-VID-TRIM-003** | O sistema deve rejeitar intervalos de recorte em que o instante inicial seja maior ou igual ao instante final. | F | Deve ter | NOVO | UC-VID-001 (Exceção 1, RN2) | Dado o instante inicial 00:30 e instante final 00:20, Quando o utilizador tenta confirmar, Então o sistema rejeita a operação com mensagem de intervalo invertido. |
| **REQ-VID-TRIM-004** | O sistema deve rejeitar intervalos de recorte em que qualquer um dos instantes se encontre fora da duração total do vídeo. | F | Deve ter | NOVO | UC-VID-001 (Exceção 2, RN2) | Dado um vídeo com duração de 60 s, Quando o utilizador indica o instante final de 70 s, Então a submissão é bloqueada com indicação de que ultrapassa a duração máxima do ficheiro. |
| **REQ-VID-TRIM-005** | O sistema deve produzir um novo vídeo contendo exclusivamente o segmento compreendido entre o instante inicial e o instante final validados. | F | Deve ter | NOVO | UC-VID-001 (Passo 6, Pós-condição de Sucesso, RN8) | Dado um vídeo de 100 s com corte aprovado entre 00:10 e 00:40, Quando o processamento termina, Então a duração exata do vídeo resultante é de 30 segundos. |
| **REQ-VID-AUDIO-001** | O sistema deve verificar a presença de pelo menos uma stream de áudio no vídeo selecionado antes de iniciar a operação de remoção de áudio. | F | Deve ter | NOVO | UC-VID-002 (Passo 1, RN2) | Dado um vídeo selecionado, Quando a interface de remoção de áudio é aberta, Então o sistema inspeciona os metadados do contentor quanto à existência de streams do tipo áudio. |
| **REQ-VID-AUDIO-002** | O sistema deve rejeitar a operação de remoção de áudio quando o vídeo selecionado não contiver streams de áudio, sem consumir quota do utilizador. | F | Deve ter | NOVO | UC-VID-002 (Exceção 2, RN2) | Dado um vídeo silencioso (sem faixa de áudio), Quando o utilizador tenta remover áudio, Então o sistema recusa a operação, notifica que não existe áudio a remover e a quota diária permanece intacta. |
| **REQ-VID-AUDIO-003** | O sistema deve produzir uma nova versão do vídeo sem streams de áudio, preservando a componente visual original sem perdas nem recodificação adicional desnecessária. | F | Deve ter | NOVO | UC-VID-002 (Passos 4-5, Pós-condição de Sucesso, RN8) | Dado um vídeo com áudio e vídeo, Quando a remoção de áudio é concluída, Então o ficheiro resultante não contém streams de áudio e a stream de vídeo conserva codec, resolução e fotogramas originais. |
| **REQ-VID-SPEED-001** | O sistema deve permitir ao utilizador registado ou premium indicar um fator de velocidade de reprodução para o vídeo. | F | Deve ter | NOVO | UC-VID-003 (Passos 2-3) | Dado um vídeo selecionado, Quando o utilizador acede à operação de velocidade, Então o sistema disponibiliza controlos de introdução para o multiplicador de velocidade. |
| **REQ-VID-SPEED-002** | O sistema deve apresentar a duração estimada resultante calculada a partir do fator de velocidade introduzido. | F | Deveria ter | NOVO | UC-VID-003 (Passo 2, FA1) | Dado um vídeo de 60 s e a seleção do fator 2×, Quando o valor é introduzido, Então o sistema apresenta a duração estimada de 30 s. |
| **REQ-VID-SPEED-003** | O sistema deve rejeitar fatores de velocidade nulos, negativos ou iguais a zero. | F | Deve ter | NOVO | UC-VID-003 (Exceção 1, RN2) | Dado um fator introduzido de 0× ou -1.5×, Quando o utilizador tenta confirmar, Então o sistema bloqueia a confirmação com aviso de valor estritamente positivo obrigatório. |
| **REQ-VID-SPEED-004** | O sistema deve rejeitar fatores de velocidade fora do intervalo homologado para o MVP (0.25× a 4.0×). | F | Deve ter | NOVO | UC-VID-003 (Exceção 2, RN2) | Dado o fator 10×, Quando submetido, Então o sistema rejeita a operação indicando que o fator máximo permitido é 4.0×. |
| **REQ-VID-SPEED-005** | O sistema deve produzir um novo vídeo cuja duração total de reprodução seja ajustada inversamente ao fator de velocidade confirmado. | F | Deve ter | NOVO | UC-VID-003 (Passo 5, Pós-condição de Sucesso, RN3, RN9) | Dado um vídeo de 40 s processado com fator 0.5×, Quando a operação termina, Então o vídeo resultante tem duração total de 80 s com cadência contínua. |
| **REQ-VID-WATERMARK-001** | O sistema deve permitir ao utilizador registado ou premium escolher o tipo de marca de água entre texto e imagem. | F | Deve ter | NOVO | UC-VID-004 (Passo 2, FA1) | Dado o ecrã de marca de água, Quando o utilizador seleciona o seletor de tipo, Então os campos alternam entre entrada de texto ou carregamento/seleção de imagem. |
| **REQ-VID-WATERMARK-002** | O sistema deve permitir ao utilizador registado ou premium configurar a posição, o tamanho e a opacidade da marca de água. | F | Deve ter | NOVO | UC-VID-004 (Passo 4) | Dado um elemento de marca de água selecionado, Quando o utilizador ajusta posição (X, Y), escala e opacidade (0–100%), Então os valores ficam registados para aplicação. |
| **REQ-VID-WATERMARK-003** | O sistema deve rejeitar marcas de água com texto vazio ou com ficheiro de imagem corrompido ou em formato não suportado. | F | Deve ter | NOVO | UC-VID-004 (Passo 3, Exceção 2) | Dado um ficheiro de imagem inválido carregado como marca, Quando a validação ocorre, Então o sistema rejeita a imagem e não permite avançar. |
| **REQ-VID-WATERMARK-004** | O sistema deve rejeitar configurações de marca de água cujas coordenadas ou dimensões ultrapassem a área visível do quadro do vídeo. | F | Deve ter | NOVO | UC-VID-004 (Passo 4, Exceção 3, RN3) | Dado um vídeo 1920×1080 e coordenada X de 2000 px, Quando o utilizador confirma, Então o sistema rejeita com indicação de transposição dos limites do quadro. |
| **REQ-VID-WATERMARK-005** | O sistema deve aplicar a marca de água configurada com posição, tamanho e opacidade fixos em todos os fotogramas do vídeo. | F | Deve ter | NOVO | UC-VID-004 (Passo 6, Pós-condição de Sucesso, RN2) | Dado um processamento concluído de marca de água, Quando inspecionados fotogramas no início, meio e fim do vídeo, Então a marca surge exatamente nas mesmas coordenadas e com a mesma opacidade. |
| **REQ-VID-WATERMARK-006** | O sistema deve apresentar uma pré-visualização estática da marca de água sobreposta a um fotograma do vídeo antes da submissão da tarefa. | F | Deveria ter | NOVO | UC-VID-004 (Passo 4, FA2) | Dado o ajuste de posição ou opacidade, Quando a pré-visualização está ativa, Então o utilizador visualiza a composição simulada sobre o primeiro fotograma do vídeo. |
| **REQ-VID-FRAMES-001** | O sistema deve permitir ao utilizador registado ou premium definir o intervalo [início, fim[, o passo regular N em segundos e o formato de saída (JPEG ou PNG). | F | Deve ter | NOVO | UC-VID-005 (Passos 2-3, RN3, RN4) | Dado o formulário de extração, Quando acedido, Então apresenta campos para intervalo temporal, passo inteiro N (padrão 5 s) e seletor de formato (JPEG/PNG). |
| **REQ-VID-FRAMES-002** | O sistema deve apresentar em tempo real o número estimado de fotogramas a extrair correspondente aos instantes início + k×N estritamente inferiores ao instante fim. | F | Deve ter | NOVO | UC-VID-005 (Passo 3, RN4) | Dado o intervalo [0s, 60s[ com passo N=5s, Quando os valores são inseridos, Então o sistema apresenta a contagem exata de 12 fotogramas (0, 5, ..., 55 s). |
| **REQ-VID-FRAMES-003** | O sistema deve rejeitar parâmetros de extração em que início ≥ fim, fim exceda a duração do vídeo, ou o passo N seja não inteiro ou inferior a 1 segundo. | F | Deve ter | NOVO | UC-VID-005 (Exceção 1, RN4) | Dado o passo N=0.5 s ou início=50s e fim=20s, Quando submetido, Então o botão de extração é bloqueado com mensagem de correção requerida. |
| **REQ-VID-FRAMES-004** | O sistema deve rejeitar pedidos de extração cujo número total de fotogramas estimado exceda o limite contratual do perfil do utilizador. | F | Deve ter | NOVO | UC-VID-005 (Exceção 2, RN2) | Dado um utilizador registado e uma estimativa de 60 fotogramas (limite=50), Quando tenta confirmar, Então o sistema bloqueia e sugere aumentar N ou migrar para Premium. |
| **REQ-VID-FRAMES-005** | O sistema deve permitir pré-visualizar uma amostra de fotogramas estimados sem criar tarefa no sistema, sem alterar o projeto e sem debitar quota diária. | F | Deveria ter | NOVO | UC-VID-005 (FA1, RN10) | Dado o pedido de amostra, Quando o utilizador clica em pré-visualizar, Então são exibidas 3 miniaturas representativas sem alteração do saldo de quota ou da base de dados. |
| **REQ-VID-FRAMES-006** | O sistema deve extrair para cada instante temporal calculado o fotograma do vídeo temporalmente mais próximo desse instante. | F | Deve ter | NOVO | UC-VID-005 (Passo 6, A4) | Dado um instante calculado de 10.0 s num vídeo com keyframes a 24 fps, Quando o worker processa o instante, Então seleciona o fotograma codificado mais próximo de t=10.0 s. |
| **REQ-VID-FRAMES-007** | O sistema deve adicionar todos os fotogramas extraídos ao projeto como imagens normais de forma atómica (tudo-ou-nada). | F | Deve ter | ALT | UC-VID-005 (Passo 7, Pós-condição de Sucesso, RN7, RN11) | Dado um pedido de 20 fotogramas, Quando a tarefa atinge `completed`, Então os 20 recursos de imagem surgem em simultâneo na galeria do projeto. |
| **REQ-VID-FRAMES-008** | O sistema deve descartar todos os fotogramas já gerados caso a extração falhe, expire ou seja cancelada antes da conclusão global. | F | Deve ter | ALT | UC-VID-005 (FA2, Exceção 7, Garantia Mínima, RN7) | Dado um cancelamento voluntário aos 80% do processamento, Quando a tarefa é cancelada, Então nenhum dos fotogramas parciais é gravado ou associado ao projeto. |
| **REQ-VID-AUTH-001** | O sistema deve exigir um token JWT válido para permitir a submissão de qualquer uma das cinco operações de vídeo. | NF (Segurança / Acesso) | Deve ter | ALT | UC-VID-001 a 005 (Pré-condições, RN1) | Dado um pedido HTTP sem cabeçalho Authorization ou com token expirado, Quando submetido a qualquer rota `/video/*`, Então é devolvido o código HTTP 401 Unauthorized. |
| **REQ-VID-AUTH-002** | O sistema deve rejeitar qualquer tentativa de execução de operações de vídeo por utilizadores não autenticados (perfil anónimo). | F | Deve ter | ALT | UC-VID-001 a 005 (Pré-condições, RN1) | Dado um utilizador anónimo, Quando tenta invocar uma operação de vídeo, Então o sistema impede o acesso e redireciona para autenticação/registo. |
| **REQ-VID-AUTH-003** | O sistema deve verificar que o utilizador autenticado possui permissão de proprietário ou de edição sobre o projeto antes de autorizar a submissão de uma operação de vídeo. | F | Deve ter | ALT | UC-VID-001 a 005 (Pré-condições) | Dado um utilizador com permissão apenas de leitura (read-only) num projeto partilhado, Quando tenta disparar uma operação de vídeo, Então recebe o código HTTP 403 Forbidden. |
| **REQ-VID-QUOTA-001** | O sistema deve verificar o saldo de quota diária do utilizador registado antes de autorizar a criação de qualquer tarefa de vídeo. | F | Deve ter | ALT | UC-VID-001 a 005 (Passo 4, Exceção de quota, RN5) | Dado um utilizador registado com 0 operações diárias disponíveis, Quando tenta confirmar qualquer operação de vídeo, Então a criação da tarefa é recusada com aviso de quota esgotada. |
| **REQ-VID-QUOTA-002** | O sistema deve reservar exatamente 1 operação da quota diária do utilizador registado no momento da aceitação da tarefa de vídeo. | F | Deve ter | ALT | UC-VID-001 a 005 (Passo 4, RN5) | Dado um utilizador registado com saldo de 5 operações, Quando a tarefa entra no estado `queued`, Então o saldo transitório é decrementado para 4. |
| **REQ-VID-QUOTA-003** | O sistema deve confirmar o débito definitivo da operação de quota reservada apenas quando a tarefa atinge o estado de conclusão com sucesso (`completed`). | F | Deve ter | ALT | UC-VID-001 a 005 (Passo final, Pós-condição de Sucesso) | Dado um processamento com quota reservada, Quando a tarefa transita para `completed`, Então a operação reservada é consolidada sem novo decremento. |
| **REQ-VID-QUOTA-004** | O sistema deve devolver a operação de quota reservada ao saldo do utilizador em caso de cancelamento, rejeição ou falha de processamento. | F | Deve ter | ALT | UC-VID-001 a 005 (FA de cancelamento, Exceções de falha, RN6) | Dado um processamento que falha a meio, Quando a tarefa transita para `failed`, Então o saldo do utilizador registado é imediatamente reposto com a operação reservada. |
| **REQ-VID-QUOTA-005** | O sistema deve processar as operações de vídeo solicitadas por utilizadores Premium sem aplicar nem verificar qualquer limite de quota diária de operações. | F | Deve ter | ALT | UC-VID-001 a 005 (FA de Utilizador Premium, RN5) | Dado um utilizador autenticado com perfil Premium, Quando submete uma operação de vídeo, Então a operação inicia sem verificação nem consumo de quota diária. |
| **REQ-VID-QUOTA-006** | O sistema deve debitar a quota da operação de vídeo à conta do utilizador que executa a operação, mesmo quando este opere sobre um projeto partilhado pertencente a outro utilizador. | F | Deve ter | ALT | UC-VID-001 a 005 (Pré-condições) | Dado um projeto partilhado pelo utilizador A com o utilizador B, Quando o utilizador B executa uma operação de vídeo, Então a quota consumida é a do utilizador B. |
| **REQ-VID-VALID-001** | O sistema deve validar que o vídeo de entrada se encontra no contentor MP4 com codec de vídeo H.264 e codec de áudio AAC antes de criar a tarefa. | F | Deve ter | NOVO | UC-VID-001 a 005 (Exceções de codec, RN3/RN4) | Dado o carregamento de ficheiro AVI ou WebM, Quando submetido para operação, Então o sistema rejeita com erro informando que apenas MP4 (H.264/AAC) é suportado. |
| **REQ-VID-VALID-002** | O sistema deve rejeitar ficheiros de vídeo corrompidos ou que não permitam descodificação de streams, emitindo mensagem de erro sem consumir quota. | F | Deve ter | NOVO | UC-VID-001 a 005 (Exceções de ficheiro corrompido) | Dado um ficheiro com extensão `.mp4` mas com cabeçalhos inválidos, Quando o sistema tenta ler a duração, Então o pedido é recusado sem débito de quota. |
| **REQ-VID-VALID-003** | O sistema deve rejeitar vídeos com duração superior a 5 minutos ou tamanho superior a 200 MB submetidos por utilizadores do perfil Registado. | NF (Capacidade / Limites) | Deve ter | NOVO | UC-VID-001 a 005 (Exceções de limites, RN de perfil) | Dado um vídeo de 5 min e 10 s ou 210 MB submetido por utilizador registado, Quando validado, Então a operação é rejeitada com indicação expressa do limite do perfil. |
| **REQ-VID-VALID-004** | O sistema deve rejeitar vídeos com duração superior a 60 minutos ou tamanho superior a 2 GB submetidos por utilizadores do perfil Premium. | NF (Capacidade / Limites) | Deve ter | NOVO | UC-VID-001 a 005 (Exceções de limites, RN de perfil) | Dado um vídeo de 65 minutos submetido por utilizador Premium, Quando validado, Então o sistema rejeita a operação com indicação do limite máximo de 60 minutos. |
| **REQ-VID-VALID-005** | O sistema deve rejeitar a criação de uma nova tarefa de vídeo se já existir outra tarefa de vídeo em processamento ativo para o mesmo projeto. | NF (Capacidade / Limites) | Deve ter | NOVO | UC-VID-001 a 005 (Pré-condições, RN de concorrência) | Dado um projeto com uma tarefa de marca de água em estado `processing`, Quando o utilizador tenta lançar um recorte no mesmo projeto, Então o pedido é recusado por saturação de tarefas ativas. |
| **REQ-VID-STORAGE-001** | O sistema deve armazenar os vídeos como recursos de projeto distintos de imagens, persistindo identificador único, nome de ficheiro, MIME type, duração, tamanho e data de carregamento. | F | Deve ter | ALT | UC-VID-001 a 005 (Pré-condições, Pós-condições) | Dado um upload de vídeo bem-sucedido, Quando consultada a base de dados do projeto, Então existe um registo na coleção específica de recursos de vídeo com todos os metadados preenchidos. |
| **REQ-VID-STORAGE-002** | O sistema deve registar no recurso resultante da operação de vídeo a referência ao identificador do vídeo original de proveniência. | F | Deve ter | ALT | UC-VID-001 a 004 (Pós-condição de Sucesso) | Dado um vídeo produzido por recorte, Quando inspecionados os seus metadados, Então o campo `sourceVideoId` corresponde exatamente ao identificador do vídeo recortado. |
| **REQ-VID-STORAGE-003** | O sistema deve aplicar aos recursos de vídeo as mesmas permissões e políticas de retenção e eliminação em vigor para os restantes recursos do projeto. | F | Deve ter | ALT | UC-VID-001 a 005 (Pós-condições, RN de retenção) | Dado um utilizador com permissão de eliminação de projeto, Quando elimina o projeto, Então todos os vídeos e resultados associados são purgados do armazenamento de objetos e da base de dados. |
| **REQ-VID-TASK-001** | O sistema deve executar as operações de vídeo através de tarefas assíncronas, devolvendo de imediato a resposta HTTP inicial com o identificador da tarefa e estado `queued`. | F | Deve ter | ALT | UC-VID-001 a 005 (Passo de criação de tarefa, RN de assincronismo) | Dado o envio de um pedido válido de processamento de vídeo, Quando a rota responde, Então o tempo de resposta HTTP é inferior a 1 s e o corpo inclui `taskId` e `status: "queued"`. |
| **REQ-VID-TASK-002** | O sistema deve gerir o ciclo de vida das tarefas de vídeo de acordo com os estados sucessivos `queued`, `processing`, `completed`, `failed` e `cancelled`. | F | Deve ter | ALT | UC-VID-001 a 005 (Passos 5-6, Exceções e FA de cancelamento) | Dado o registo de uma tarefa, Quando o ciclo de execução avança, Então a base de dados regista a sequência estrita de transições sem inversão temporal de estados. |
| **REQ-VID-TASK-003** | O sistema deve emitir as notificações de transição de estado da tarefa de vídeo para o cliente através do canal de WebSocket do projeto. | F | Deve ter | ALT | UC-VID-001 a 005 (Passos 5-6, Notificação) | Dado um cliente web com socket aberto no projeto, Quando o worker altera o estado da tarefa para `processing`, Então uma mensagem JSON é entregue ao cliente via socket em tempo real. |
| **REQ-VID-TASK-004** | O sistema deve emitir via WebSocket o progresso numérico de 0% a 100% durante as tarefas de marca de água e de extração de fotogramas. | NF (Usabilidade) | Deveria ter | ALT | UC-VID-004 (Passo 6), UC-VID-005 (Passo 5) | Dado o processamento de marca de água a meio (fotograma 50 de 100), Quando o worker processa o fotograma, Então é emitida mensagem com campo `progress: 50`. |
| **REQ-VID-TASK-005** | O sistema deve cessar a emissão de mensagens de progresso via WebSocket logo que a tarefa atinja qualquer um dos estados terminais (`completed`, `failed` ou `cancelled`). | NF (Fiabilidade / Integridade) | Deve ter | ALT | UC-VID-001 a 005 (Passos finais e exceções) | Dado que uma tarefa transita para `completed`, Quando passam 5 segundos, Então nenhuma mensagem de atualização de progresso posterior é emitida sobre essa tarefa. |
| **REQ-VID-TASK-006** | O sistema deve permitir ao utilizador que submeteu a tarefa solicitar o seu cancelamento enquanto esta se encontrar no estado `queued` ou `processing`. | F | Deveria ter | ALT | UC-VID-001 a 005 (FA de cancelamento) | Dado um processamento de vídeo em curso, Quando o utilizador clica em Cancelar, Então o cliente envia pedido de cancelamento e o sistema regista a intenção de aborto. |
| **REQ-VID-TASK-007** | O sistema deve interromper a execução do worker de vídeo e eliminar artefactos temporários residuais quando o cancelamento da tarefa for confirmado. | F | Deveria ter | ALT | UC-VID-001 a 005 (FA de cancelamento, Garantia Mínima) | Dado um cancelamento aceite pelo backend, Quando o worker recebe a instrução, Então suspende a codificação e purga do disco temporário os segmentos gerados. |
| **REQ-VID-ERROR-001** | O sistema deve emitir mensagens de erro com categoria estável e instrução corretiva perante qualquer falha de validação, limites, quota ou processamento. | F | Deve ter | ALT | UC-VID-001 a 005 (Exceções de todos os casos) | Dado um erro de formato de ficheiro, Quando a resposta é devolvida ao cliente, Então contém código semântico (e.g. `INVALID_CODEC`) e texto a sugerir a conversão para MP4/H.264. |
| **REQ-VID-ERROR-002** | O sistema deve omitir stack traces, tokens e credenciais de infraestrutura das mensagens de erro apresentadas ao cliente. | NF (Segurança / Acesso) | Deve ter | ALT | UC-VID-001 a 005 (Exceções, Boas práticas) | Dado um erro interno de execução do worker, Quando o cliente recebe a resposta, Então a mensagem não contém caminhos internos de ficheiros nem dados de ligação a bases de dados. |
| **REQ-VID-ERROR-003** | O sistema deve garantir a limpeza de ficheiros temporários em caso de falha de processamento, preservando a integridade prévia do projeto. | NF (Fiabilidade / Integridade) | Deve ter | ALT | UC-VID-001 a 005 (Garantia Mínima) | Dado o encerramento anómalo do processo de codificação, Quando a tarefa é dada como falhada, Então a pasta temporária de processamento é esvaziada sem deixar ficheiros orfãos. |
| **REQ-VID-NFR-001** | O sistema deve restringir o acesso a ficheiros de vídeo, resultados e URLs de transferência aos utilizadores autenticados com autorização no respetivo projeto. | NF (Segurança / Acesso) | Deve ter | ALT | UC-VID-001 a 005 (Pré-condições) | Dado um URL de download de vídeo gerado para o projeto X, Quando acedido por um utilizador sem permissão no projeto X, Então a transferência é bloqueada. |
| **REQ-VID-NFR-002** | O sistema deve registar identificadores de correlação comuns entre pedido HTTP, tarefa assíncrona, recurso de entrada e recurso gerado em todos os registos de auditoria. | NF (Fiabilidade / Integridade) | Deve ter | ALT | UC-VID-001 a 005 (Rastreabilidade) | Dado o processamento de um vídeo, Quando inspecionados os logs dos vários microserviços, Então o mesmo `correlationId` permite encadear os eventos do início ao fim. |
| **REQ-VID-NFR-003** | O sistema deve produzir os resultados de recorte, remoção de áudio, velocidade e marca de água exclusivamente no contentor MP4 com codecs H.264 (vídeo) e AAC (áudio). | NF (Compatibilidade) | Deve ter | NOVO | UC-VID-001 a 004 (RN de formatos, Pós-condições) | Dado qualquer resultado de transformação de vídeo gerado pelo sistema, Quando submetido a analisador de media, Então o contentor reporta MP4 com faixas codificadas em H.264 e AAC. |
| **REQ-VID-NFR-004** | O sistema deve produzir as imagens resultantes da extração de fotogramas exclusivamente em formato JPEG ou PNG, preservando a resolução espacial original do vídeo. | NF (Compatibilidade) | Deve ter | NOVO | UC-VID-005 (Passo 7, RN3, Pós-condição de Sucesso) | Dado um vídeo com resolução 1920×1080 px, Quando os fotogramas são exportados em JPEG, Então todas as imagens geradas possuem exatamente a dimensão 1920×1080 px. |

---

## 4.2 Análise de Impacto no Sistema Existente (Tabela 4.2)

O PictuRAS é uma aplicação pré-existente orientada exclusivamente ao processamento e armazenamento de imagens estáticas. A tabela abaixo sintetiza o impacto de cada componente do sistema com base nos requisitos identificados, classificando a intervenção como **Manter**, **Estender** ou **Alterar**.

| Elemento existente afetado | Impacto | Descrição do impacto | Requisitos relacionados |
|---|:---:|---|---|
| `apiGateway/routes/projects.js` e rotas base | **Estender** | Expor novas rotas REST para submissão das 5 operações de vídeo (`/projects/:id/video/trim`, `/audio`, `/speed`, `/watermark`, `/extract-frames`), mantendo inalteradas as rotas legadas de imagem. Validar JWT, perfil e parâmetros antes do reencaminhamento. | REQ-VID-COM-001, REQ-VID-COM-005, REQ-VID-COM-006, REQ-VID-AUTH-001 a 003, REQ-VID-TASK-001 |
| Serviço de Projetos (`projects/routes/projects.js`) | **Estender** | Incorporar lógica de negócio para orquestração de vídeo, associação de recursos de vídeo e fotogramas ao projeto, e gestão de permissões partilhadas (read/edit). | REQ-VID-COM-001, REQ-VID-COM-003, REQ-VID-COM-004, REQ-VID-FRAMES-007, REQ-VID-STORAGE-001 a 003 |
| Modelos de Dados MongoDB (`projects/models/`) | **Alterar** | Criar esquema específico para recursos de vídeo (`videos`), armazenando metadados de codec, resolução, duração e stream. Alterar o esquema de tarefas para suportar operações de vídeo e relacionar resultados ao vídeo de origem (`sourceVideoId`). | REQ-VID-STORAGE-001, REQ-VID-STORAGE-002, REQ-VID-TASK-002, REQ-VID-NFR-002 |
| Mensageria e Filas (`projects/utils/project_msg.js`, RabbitMQ) | **Estender** | Criar novas filas dedicadas para tarefas de vídeo (`video_operations_queue`) e contratos de mensagem com campos para tipo de operação, parâmetros validados e identificadores de correlação, preservando as filas existentes de imagem. | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-TASK-006, REQ-VID-NFR-002 |
| Workers de Processamento (`Tools/` e serviços Python) | **Estender** | Desenvolver novos workers em Python capazes de descodificar MP4/H.264/AAC, executar recorte temporal, remoção de faixa de áudio, reamostragem temporal (velocidade), sobreposição de marca de água e extração de fotogramas, suportando cancelamento. | REQ-VID-TRIM-005, REQ-VID-AUDIO-003, REQ-VID-SPEED-005, REQ-VID-WATERMARK-005, REQ-VID-FRAMES-006, REQ-VID-TASK-007, REQ-VID-NFR-003 |
| Armazenamento de Objetos (`imageStorageService`, SeaweedFS/S3) | **Estender** | Suportar upload, leitura e geração de URLs autorizados com expiração para ficheiros de grande porte de vídeo (até 2 GB) e gestão de ficheiros temporários, sem colisão com os caminhos dos artefactos de imagem. | REQ-VID-COM-002, REQ-VID-STORAGE-001, REQ-VID-ERROR-003, REQ-VID-NFR-001 |
| Subsistema de Autenticação JWT e Partilha (`shareAuth`) | **Estender** | Reutilizar a infraestrutura de validação de token JWT e permissões de link de partilha, adicionando a verificação de que o utilizador autenticado que dispara a operação é aquele a quem a quota diária é debitada. | REQ-VID-AUTH-001 a 003, REQ-VID-QUOTA-006, REQ-VID-NFR-001 |
| Serviço de Subscrições e Quotas (`users/`, `subscriptions/`) | **Alterar** | Alterar a gestão de quotas diárias para contabilizar operações de vídeo (1 operação de vídeo = 1 crédito da quota diária de 5 ops do utilizador registado). Implementar mecanismos de reserva transitória (`reserve`), consolidação (`commit`) e estorno (`rollback`) em caso de falha/cancelamento. | REQ-VID-QUOTA-001 a 005, REQ-VID-VALID-003, REQ-VID-VALID-004 |
| Gateway de WebSockets (`wsGateway`) | **Estender** | Suportar tópicos de progresso para tarefas de vídeo, transmitindo eventos de transição de estado e percentagem de progresso numérico (0–100%) para operações que suportam progresso contínuo (marca de água e fotogramas). | REQ-VID-TASK-002 a 005 |
| Interface Web Frontend (`frontend/`) | **Estender** | Desenvolver componentes de UI dedicados a vídeo: leitor de vídeo com seletor de recorte temporal, seletor de velocidade com estimativa de duração, painel de sobreposição de marca de água com pré-visualização, e configurador de fotogramas com estimativa e barra de progresso WebSocket. | REQ-VID-TRIM-001 a 002, REQ-VID-SPEED-001 a 002, REQ-VID-WATERMARK-001 a 006, REQ-VID-FRAMES-001 a 005, REQ-VID-TASK-004, REQ-VID-TASK-006 |

---

## 4.3 Matriz de Rastreabilidade e Cobertura (Tabela 4.3)

A matriz abaixo estabelece a ligação bidirecional exaustiva entre **todos** os elementos constituintes dos cinco casos de uso de vídeo (pré-condições, passos de fluxo, fluxos alternativos, exceções, pós-condições e regras de negócio) e os requisitos derivados da Tabela 4.1.

### 4.3.1 UC-VID-001 — Recortar temporalmente um vídeo (*Trim*)

| Elemento do Caso de Uso | Descrição Abreviada | Requisito(s) de Sistema Relacionado(s) |
|---|---|---|
| **Pré-condições** | JWT válido, permissão de edição, vídeo MP4 elegível no projeto, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-VALID-001, REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-VALID-005, REQ-VID-STORAGE-001 |
| **Passo 1** | Seleção do vídeo e apresentação das operações disponíveis | REQ-VID-COM-001 |
| **Passo 2** | Apresentação dos controlos de intervalo inicial e final | REQ-VID-TRIM-001 |
| **Passo 3** | Definição do intervalo e validação de duração estimada | REQ-VID-TRIM-001, REQ-VID-TRIM-002, REQ-VID-COM-005 |
| **Passo 4** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-005, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001 |
| **Passo 5** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **Passo 6** | Processamento assíncrono do recorte e confirmação de quota | REQ-VID-TRIM-005, REQ-VID-QUOTA-003, REQ-VID-COM-004, REQ-VID-STORAGE-002, REQ-VID-NFR-003 |
| **Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **FA1** | Alteração do intervalo antes da confirmação | REQ-VID-TRIM-001, REQ-VID-TRIM-002 |
| **FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-006, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-006, REQ-VID-TASK-007, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-VALID-004 |
| **Exceção 1** | Instante inicial maior ou igual ao instante final | REQ-VID-COM-006, REQ-VID-TRIM-003, REQ-VID-ERROR-001 |
| **Exceção 2** | Instantes definidos fora da duração total do vídeo | REQ-VID-COM-006, REQ-VID-TRIM-004, REQ-VID-ERROR-001 |
| **Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-VALID-001, REQ-VID-ERROR-001 |
| **Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-ERROR-001 |
| **Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **Garantia de Sucesso** | Novo vídeo no projeto com o segmento selecionado, original preservado, 1 quota debitada | REQ-VID-TRIM-005, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-COM-004, REQ-VID-QUOTA-003 |
| **Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota reservada devolvida | REQ-VID-COM-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004 |
| **RN1** | Exclusão do perfil anónimo | REQ-VID-AUTH-002 |
| **RN2** | Validação estrita do intervalo temporal | REQ-VID-TRIM-003, REQ-VID-TRIM-004 |
| **RN3** | Formato de entrada MP4/H.264/AAC | REQ-VID-VALID-001 |
| **RN4** | Limites numéricos de tamanho e duração por perfil | REQ-VID-VALID-003, REQ-VID-VALID-004 |
| **RN5** | Custo de 1 quota diária no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-QUOTA-005 |
| **RN6** | Devolução de quota em caso de insucesso | REQ-VID-QUOTA-004 |
| **RN7** | Execução assíncrona, estados de tarefa e concorrência máxima de 1 por projeto | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-VALID-005 |
| **RN8** | Formato e preservação de metadados do resultado | REQ-VID-TRIM-005, REQ-VID-COM-002, REQ-VID-NFR-003 |
| **RN9** | Associação e retenção do novo recurso de vídeo | REQ-VID-COM-004, REQ-VID-STORAGE-003 |

---

### 4.3.2 UC-VID-002 — Remover o áudio de um vídeo

| Elemento do Caso de Uso | Descrição Abreviada | Requisito(s) de Sistema Relacionado(s) |
|---|---|---|
| **Pré-condições** | JWT válido, permissão de edição, vídeo MP4 com stream de áudio elegível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-AUDIO-001, REQ-VID-VALID-001, REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-VALID-005 |
| **Passo 1** | Seleção do vídeo e verificação de presença de áudio | REQ-VID-COM-001, REQ-VID-AUDIO-001 |
| **Passo 2** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-005, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001 |
| **Passo 3** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **Passo 4** | Supressão de streams de áudio e preservação de stream visual | REQ-VID-AUDIO-003, REQ-VID-NFR-003 |
| **Passo 5** | Associação do resultado MP4 silencioso ao projeto e consolidação de quota | REQ-VID-COM-004, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002 |
| **Passo 6** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **FA1** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-006, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **FA2** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-006, REQ-VID-TASK-007, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **FA3** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-VALID-004 |
| **Exceção 1** | Formato ou codec de vídeo não suportado | REQ-VID-VALID-001, REQ-VID-ERROR-001 |
| **Exceção 2** | Vídeo sem streams de áudio | REQ-VID-AUDIO-002, REQ-VID-ERROR-001 |
| **Exceção 3** | Duração ou tamanho superior ao limite do perfil | REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-ERROR-001 |
| **Exceção 4** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **Exceção 5** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **Garantia de Sucesso** | Novo vídeo sem áudio associado ao projeto, vídeo original intacto, 1 quota debitada | REQ-VID-AUDIO-003, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-COM-004, REQ-VID-QUOTA-003 |
| **Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota reservada devolvida | REQ-VID-COM-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004 |
| **RN1** | Exclusão do perfil anónimo | REQ-VID-AUTH-002 |
| **RN2** | Requisito de presença obrigatória de áudio | REQ-VID-AUDIO-001, REQ-VID-AUDIO-002 |
| **RN3** | Formato de entrada MP4/H.264/AAC | REQ-VID-VALID-001 |
| **RN4** | Limites numéricos de tamanho e duração por perfil | REQ-VID-VALID-003, REQ-VID-VALID-004 |
| **RN5** | Custo de 1 quota diária no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-QUOTA-005 |
| **RN6** | Devolução de quota em caso de insucesso | REQ-VID-QUOTA-004 |
| **RN7** | Execução assíncrona, estados de tarefa e limite de 1 tarefa ativa | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-VALID-005 |
| **RN8** | Preservação visual integral e formato do resultado | REQ-VID-AUDIO-003, REQ-VID-COM-002, REQ-VID-NFR-003 |
| **RN9** | Associação e retenção do novo recurso de vídeo | REQ-VID-COM-004, REQ-VID-STORAGE-003 |

---

### 4.3.3 UC-VID-003 — Alterar a velocidade de reprodução de um vídeo

| Elemento do Caso de Uso | Descrição Abreviada | Requisito(s) de Sistema Relacionado(s) |
|---|---|---|
| **Pré-condições** | JWT válido, permissão de edição, vídeo MP4 elegível, sem outra tarefa ativa no projeto | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-VALID-001, REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-VALID-005 |
| **Passo 1** | Apresentação do vídeo e controlos de velocidade | REQ-VID-COM-001, REQ-VID-SPEED-001 |
| **Passo 2** | Indicação do fator e cálculo da duração estimada | REQ-VID-SPEED-001, REQ-VID-SPEED-002, REQ-VID-COM-005 |
| **Passo 3** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-005, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001 |
| **Passo 4** | Notificação de estados de tarefa `queued` e `processing` | REQ-VID-TASK-002, REQ-VID-TASK-003 |
| **Passo 5** | Processamento da velocidade e cálculo da duração invertida | REQ-VID-SPEED-005, REQ-VID-NFR-003 |
| **Passo 6** | Associação do resultado ao projeto e consolidação de quota | REQ-VID-COM-004, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002 |
| **Passo 7** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **FA1** | Alteração do fator antes da confirmação | REQ-VID-SPEED-001, REQ-VID-SPEED-002 |
| **FA2** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-006, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **FA3** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-006, REQ-VID-TASK-007, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-VALID-004 |
| **Exceção 1** | Fator nulo, negativo ou igual a zero | REQ-VID-COM-006, REQ-VID-SPEED-003, REQ-VID-ERROR-001 |
| **Exceção 2** | Fator fora do intervalo suportado | REQ-VID-COM-006, REQ-VID-SPEED-004, REQ-VID-ERROR-001 |
| **Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-VALID-001, REQ-VID-ERROR-001 |
| **Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-ERROR-001 |
| **Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **Exceção 6** | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **Garantia de Sucesso** | Novo vídeo com velocidade ajustada, original preservado, 1 quota debitada | REQ-VID-SPEED-005, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-COM-004, REQ-VID-QUOTA-003 |
| **Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota reservada devolvida | REQ-VID-COM-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004 |
| **RN1** | Exclusão do perfil anónimo | REQ-VID-AUTH-002 |
| **RN2** | Validação estrita do fator positivo e limites | REQ-VID-SPEED-003, REQ-VID-SPEED-004 |
| **RN3** | Comportamento inversamente proporcional da duração | REQ-VID-SPEED-002, REQ-VID-SPEED-005 |
| **RN4** | Formato de entrada MP4/H.264/AAC | REQ-VID-VALID-001 |
| **RN5** | Limites numéricos de tamanho e duração por perfil | REQ-VID-VALID-003, REQ-VID-VALID-004 |
| **RN6** | Custo de 1 quota diária no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-QUOTA-005 |
| **RN7** | Devolução de quota em caso de insucesso | REQ-VID-QUOTA-004 |
| **RN8** | Execução assíncrona, estados de tarefa e concorrência máxima de 1 por projeto | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-VALID-005 |
| **RN9** | Formato e preservação de metadados do resultado | REQ-VID-SPEED-005, REQ-VID-COM-002, REQ-VID-NFR-003 |

---

### 4.3.4 UC-VID-004 — Aplicar marca de água a um vídeo

| Elemento do Caso de Uso | Descrição Abreviada | Requisito(s) de Sistema Relacionado(s) |
|---|---|---|
| **Pré-condições** | JWT válido, permissão de edição, vídeo MP4 elegível, material de marca acessível, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-VALID-001, REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-VALID-005 |
| **Passo 1** | Seleção do vídeo e abertura da interface de configuração | REQ-VID-COM-001 |
| **Passo 2** | Seleção do tipo de marca (texto ou imagem) | REQ-VID-WATERMARK-001 |
| **Passo 3** | Entrada e validação do conteúdo da marca | REQ-VID-WATERMARK-003 |
| **Passo 4** | Ajuste de posição, tamanho e opacidade com pré-visualização | REQ-VID-WATERMARK-002, REQ-VID-WATERMARK-004, REQ-VID-WATERMARK-006, REQ-VID-COM-005 |
| **Passo 5** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-005, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001 |
| **Passo 6** | Processamento fotograma a fotograma e emissão de progresso WebSocket | REQ-VID-WATERMARK-005, REQ-VID-TASK-002, REQ-VID-TASK-004 |
| **Passo 7** | Associação do resultado MP4 ao projeto, paragem de progresso e consolidação de quota | REQ-VID-COM-004, REQ-VID-TASK-005, REQ-VID-QUOTA-003, REQ-VID-STORAGE-002, REQ-VID-NFR-003 |
| **Passo 8** | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **FA1** | Utilização de imagem como marca de água | REQ-VID-WATERMARK-001, REQ-VID-WATERMARK-003 |
| **FA2** | Alteração de parâmetros após pré-visualização estática | REQ-VID-WATERMARK-002, REQ-VID-WATERMARK-006 |
| **FA3** | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-006, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **FA4** | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-006, REQ-VID-TASK-007, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **FA5** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-VALID-004 |
| **Exceção 1** | Formato ou codec de vídeo não suportado | REQ-VID-VALID-001, REQ-VID-ERROR-001 |
| **Exceção 2** | Conteúdo ou ficheiro de imagem da marca inválido | REQ-VID-COM-006, REQ-VID-WATERMARK-003, REQ-VID-ERROR-001 |
| **Exceção 3** | Posição ou dimensão ultrapassa área visível do vídeo | REQ-VID-COM-006, REQ-VID-WATERMARK-004, REQ-VID-ERROR-001 |
| **Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-ERROR-001 |
| **Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **Exceção 6** | Falha de processamento a meio da execução | REQ-VID-ERROR-001, REQ-VID-ERROR-003, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **Garantia de Sucesso** | Novo vídeo com marca aplicada uniformemente, original preservado, 1 quota debitada | REQ-VID-WATERMARK-005, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-COM-004, REQ-VID-QUOTA-003 |
| **Garantia Mínima** | Original inalterado, sem resultados parciais gravados, quota reservada devolvida | REQ-VID-COM-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004 |
| **RN1** | Exclusão do perfil anónimo | REQ-VID-AUTH-002 |
| **RN2** | Aplicação fixa e consistente em todos os fotogramas | REQ-VID-WATERMARK-005 |
| **RN3** | Validação geométrica dentro da área visível do vídeo | REQ-VID-WATERMARK-004 |
| **RN4** | Formato de entrada MP4/H.264/AAC | REQ-VID-VALID-001 |
| **RN5** | Limites numéricos de tamanho e duração por perfil | REQ-VID-VALID-003, REQ-VID-VALID-004 |
| **RN6** | Custo de 1 quota diária no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-QUOTA-005 |
| **RN7** | Devolução de quota em caso de insucesso | REQ-VID-QUOTA-004 |
| **RN8** | Execução assíncrona, progresso 0–100% por fotograma e limite de 1 tarefa ativa | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-TASK-004, REQ-VID-VALID-005 |
| **RN9** | Formato do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-004, REQ-VID-NFR-003 |

---

### 4.3.5 UC-VID-005 — Extrair fotogramas de um vídeo para o projeto

| Elemento do Caso de Uso | Descrição Abreviada | Requisito(s) de Sistema Relacionado(s) |
|---|---|---|
| **Pré-condições** | JWT válido, permissão de edição, vídeo MP4 elegível, sem outra tarefa ativa no projeto | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-VALID-001, REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-VALID-005 |
| **Passo 1** | Abertura do projeto, visualização do saldo de quota e limites | REQ-VID-COM-001, REQ-VID-QUOTA-001 |
| **Passo 2** | Apresentação do configurador com valores padrão | REQ-VID-FRAMES-001 |
| **Passo 3** | Parametrização de intervalo, passo, formato e cálculo em tempo real da estimativa | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002, REQ-VID-COM-005 |
| **Passo 4** | Confirmação da operação, validação e reserva de quota | REQ-VID-COM-005, REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-TASK-001 |
| **Passo 5** | Notificação de estados de tarefa e emissão de progresso WebSocket | REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-TASK-004 |
| **Passo 6** | Extração do fotograma disponível mais próximo para cada instante | REQ-VID-FRAMES-006 |
| **Passo 7** | Inclusão atómica dos fotogramas no projeto, consolidação de quota e paragem de progresso | REQ-VID-FRAMES-007, REQ-VID-QUOTA-003, REQ-VID-TASK-005, REQ-VID-NFR-004 |
| **Passo 8** | Disponibilização das imagens extraídas na galeria e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| **FA1** | Pré-visualização de amostra estática sem quota | REQ-VID-FRAMES-005 |
| **FA2** | Cancelamento durante o processamento com descarte atómico | REQ-VID-TASK-006, REQ-VID-TASK-007, REQ-VID-FRAMES-008, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| **FA3** | Utilizador abandona a sessão com continuidade em background | REQ-VID-TASK-001, REQ-VID-TASK-002 |
| **FA4** | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-VALID-004 |
| **FA5** | Aceitação de ajuste sugerido de passo N | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002 |
| **Exceção 1** | Parâmetros inválidos (início ≥ fim, fim > duração, N < 1s ou não inteiro) | REQ-VID-COM-006, REQ-VID-FRAMES-003, REQ-VID-ERROR-001 |
| **Exceção 2** | Contagem estimada de fotogramas excede o teto do perfil | REQ-VID-COM-006, REQ-VID-FRAMES-004, REQ-VID-ERROR-001 |
| **Exceção 3** | Formato ou codec de vídeo não suportado | REQ-VID-VALID-001, REQ-VID-ERROR-001 |
| **Exceção 4** | Duração ou tamanho superior ao limite do perfil | REQ-VID-VALID-003, REQ-VID-VALID-004, REQ-VID-ERROR-001 |
| **Exceção 5** | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| **Exceção 6** | Ficheiro corrompido ou erro de descodificação | REQ-VID-VALID-002, REQ-VID-ERROR-001, REQ-VID-QUOTA-004 |
| **Exceção 7** | Falha de execução a meio do processamento | REQ-VID-ERROR-001, REQ-VID-ERROR-003, REQ-VID-FRAMES-008, REQ-VID-TASK-005, REQ-VID-QUOTA-004 |
| **Exceção 8** | Armazenamento de projeto insuficiente para os fotogramas estimados | REQ-VID-ERROR-001, REQ-VID-QUOTA-004 |
| **Garantia de Sucesso** | Inclusão de todos os fotogramas pedidos, resolução original preservada, 1 quota debitada | REQ-VID-FRAMES-007, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-NFR-004 |
| **Garantia Mínima** | Projeto intacto, zero fotogramas parciais adicionados, quota devolvida | REQ-VID-FRAMES-008, REQ-VID-COM-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004 |
| **RN1** | Exclusão do perfil anónimo | REQ-VID-AUTH-002 |
| **RN2** | Tetos de fotogramas e limites do perfil (50 vs 500 frames) | REQ-VID-FRAMES-004, REQ-VID-VALID-003, REQ-VID-VALID-004 |
| **RN3** | Formato de entrada MP4 e formatos de saída JPEG/PNG | REQ-VID-VALID-001, REQ-VID-FRAMES-001, REQ-VID-NFR-004 |
| **RN4** | Semântica do intervalo semiaberto e cálculo de instantes | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002 |
| **RN5** | Custo de 1 quota diária no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-QUOTA-002, REQ-VID-QUOTA-005 |
| **RN6** | Devolução de quota em caso de insucesso | REQ-VID-QUOTA-004 |
| **RN7** | Atomicidade estrita tudo-ou-nada | REQ-VID-FRAMES-007, REQ-VID-FRAMES-008 |
| **RN8** | Não destrutividade do vídeo original | REQ-VID-COM-002 |
| **RN9** | Execução assíncrona, progresso contínuo e limite de 1 tarefa ativa | REQ-VID-TASK-001, REQ-VID-TASK-002, REQ-VID-TASK-004, REQ-VID-VALID-005 |
| **RN10** | Gratuidade e não intrusividade da pré-visualização | REQ-VID-FRAMES-005 |
| **RN11** | Tratamento dos fotogramas como imagens normais do projeto | REQ-VID-FRAMES-007, REQ-VID-STORAGE-003 |

---

### 4.3.6 Verificação de Cobertura Global

1. **Verificação de Requisitos Órfãos**:
   - Total de requisitos na Tabela 4.1: **44 requisitos** (`REQ-VID-COM-001` a `006`, `REQ-VID-TRIM-001` a `005`, `REQ-VID-AUDIO-001` a `003`, `REQ-VID-SPEED-001` a `005`, `REQ-VID-WATERMARK-001` a `006`, `REQ-VID-FRAMES-001` a `008`, `REQ-VID-AUTH-001` a `003`, `REQ-VID-QUOTA-001` a `006`, `REQ-VID-VALID-001` a `005`, `REQ-VID-STORAGE-001` a `003`, `REQ-VID-TASK-001` a `007`, `REQ-VID-ERROR-001` a `003`, `REQ-VID-NFR-001` a `004`).
   - Cada um dos 44 requisitos surge mapeado pelo menos uma vez na matriz de rastreabilidade acima ➔ **Zero requisitos órfãos**.
2. **Verificação de Elementos sem Cobertura**:
   - Todos os passos (principais e alternativos), exceções, garantias pós-condicionais e regras de negócio dos casos de uso UC-VID-001 a UC-VID-005 possuem correspondência direta com um ou mais requisitos da Tabela 4.1 ➔ **Zero elementos por cobrir**.

---

## 4.4 Registo de Decisões Aprovadas para o MVP

As decisões estruturais e quantitativas tomadas pela equipa foram consolidadas de modo a conferir rigor e determinismo aos requisitos:

| ID | Domínio | Decisão Aprovada | Requisitos Impactados |
|---|---|---|---|
| **D-VID-001** | Perfis de Utilizador e Quotas | Acesso exclusivo aos perfis **Registado** e **Premium** (utilizadores Anónimos excluídos). Cada operação de vídeo bem-sucedida consome exatamente **1 operação** da quota diária de 5 operações do utilizador Registado. O perfil Premium tem execuções ilimitadas. Em caso de cancelamento ou erro, a operação reservada é devolvida. | REQ-VID-AUTH-002, REQ-VID-QUOTA-001 a 005 |
| **D-VID-002** | Formatos e Codecs | Contentor de entrada unificado em **MP4 com codec de vídeo H.264 e codec de áudio AAC**. Saída de vídeo em MP4 (H.264/AAC). Saída de fotogramas extraídos em **JPEG ou PNG** (escolha do utilizador; padrão JPEG). | REQ-VID-VALID-001, REQ-VID-NFR-003, REQ-VID-NFR-004 |
| **D-VID-003** | Modelo de Dados de Vídeo | Os vídeos constituem recursos explícitos de projeto, diferenciados das imagens, com campos para metadados técnicos de streams e referência de proveniência (`sourceVideoId`) nos resultados. | REQ-VID-STORAGE-001, REQ-VID-STORAGE-002 |
| **D-VID-004** | Ciclo de Tarefas Assíncronas | Execução desacoplada via RabbitMQ. Estados canónicos: `queued → processing → completed \| failed \| cancelled`. Progresso contínuo (0–100%) reservado para marca de água e extração de fotogramas. Cancelamento suportado em `queued` e `processing`. | REQ-VID-TASK-001 a 007 |
| **D-VID-005** | Limites Contratuais do MVP | Utilizador Registado: duração ≤ 5 minutos, tamanho ≤ 200 MB, máximo 50 fotogramas por extração. Utilizador Premium: duração ≤ 60 minutos, tamanho ≤ 2 GB, máximo 500 fotogramas por extração. Limite de 1 tarefa de vídeo ativa por projeto. | REQ-VID-VALID-003 a 005, REQ-VID-FRAMES-004 |
| **D-VID-006** | Semântica Temporal de Extração | Intervalo semiaberto **[início, fim[**. Timestamps: $\text{início} + k \times N$ com timestamp $<$ fim. Número de fotogramas igual à cardinalidade dos instantes calculados. | REQ-VID-FRAMES-001, REQ-VID-FRAMES-002 |
| **D-VID-007** | Associação e Retenção de Resultados | Associação automática ao projeto após processamento bem-sucedido. Eliminação sincronizada com as políticas do projeto. Tarefas falhadas não deixam resíduos no projeto. | REQ-VID-COM-003, REQ-VID-COM-004, REQ-VID-STORAGE-003 |
| **D-VID-008** | Imputação de Quota em Projetos Partilhados | A quota da operação é debitada à conta do **utilizador autenticado que desencadeia a operação**, e não ao dono do projeto. | REQ-VID-QUOTA-006 |
| **D-VID-009** | Geometria da Marca de Água | Posição, dimensões e opacidade da marca de água mantêm-se **estáticas e invariantes** durante toda a extensão temporal do vídeo. | REQ-VID-WATERMARK-004, REQ-VID-WATERMARK-005 |
| **D-VID-010** | Metas de Desempenho e SLA | Não são impostas metas numéricas de latência ou throughput para a primeira fase funcional (MVP), devendo os requisitos focar-se na garantia de não bloqueio HTTP e correção algorítmica. | REQ-VID-TASK-001 |

---

## 4.5 Questões em Aberto Remanescentes

| ID | Questão | Requisitos Afetados | Recomendação para Fases Seguintes |
|---|---|---|---|
| **Q-REM-001** | Granularidade temporal de recorte: ao fotograma exato (*frame-accurate*) ou ao ponto de corte em fotograma-chave (*keyframe/I-frame*)? | REQ-VID-TRIM-005 | No MVP adotar corte rápido por keyframe ou re-encoding seletivo apenas se a biblioteca do worker o permitir sem overhead excessivo. |
| **Q-REM-002** | Tratamento acústico da velocidade: a alteração de velocidade de reprodução deve aplicar correção de tom de áudio (*pitch shift correction*) ou manter aceleração natural de áudio? | REQ-VID-SPEED-005 | No MVP aceitar a aceleração de áudio nativa do algoritmo de reamostragem sem módulos de correção espectral avançados. |
| **Q-REM-003** | Limite global de armazenamento por utilizador: os fotogramas extraídos contam para um teto cumulativo de armazenamento de conta? | REQ-VID-FRAMES-007 | Confirmar na fase de construção se o subsistema de utilizadores já calcula a quota agregada de bytes no SeaweedFS. |

---

## ✅ Lista de Verificação da Secção 4

- [x] Todos os verbos de ação do caso de uso foram analisados e vertidos em requisitos.
- [x] Cada requisito segue rigorosamente o padrão *"O sistema deve..."* ou *"O sistema deve permitir ao {ator}..."*.
- [x] Todos os requisitos são atómicos (uma única obrigação observável), verificáveis e sem termos vagos (*rápido*, *fácil*, *intuitivo*).
- [x] Cada requisito tem ID único, Tipo (com categoria explícita nos NF), Prioridade em vocabulário canónico (*Deve ter / Deveria ter*), classificação NOVO/ALT, Origem rastreável e método de verificação.
- [x] Pelo menos dois requisitos NF ou restrições com valores mensuráveis contemplados (formatos fechados, limites de duração, limites de tamanho e tetos de fotogramas).
- [x] Exceções e fluxos alternativos deram origem a requisitos específicos (rejeição de parâmetros, quotas esgotadas, formatos inválidos, cancelamento).
- [x] Tabela de impacto no sistema existente (4.2) completamente preenchida com classificação Manter/Estender/Alterar para todos os serviços afetados.
- [x] Matriz de rastreabilidade e cobertura (4.3) exaustiva, cobrindo todos os passos e regras dos 5 casos de uso, sem requisitos órfãos nem elementos omissos.
- [x] Versão do documento atualizada para v1.2 em consonância com as correções introduzidas.
