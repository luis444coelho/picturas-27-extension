# UC-VID-004 — Aplicar marca de água a um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-004 |
| *Nome* | Aplicar marca de água a um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador aplicar uma marca de água (texto ou imagem) com posição, tamanho e opacidade configuráveis sobre todos os fotogramas de um vídeo do projeto, gerando um novo vídeo protegido, sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende proteger os seus direitos de autor sobre o vídeo com identificação visual clara e não obstrutiva.<br> - *Sistema PictuRAS*: deve compor a marca de água fotograma a fotograma com estabilidade e desempenho previsível.<br> - *Administrador*: pretende garantir que o processamento intensivo respeita as quotas e os limites de infraestrutura. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br> - Se a marca for imagem, o ficheiro de imagem está acessível (formato PNG ou JPEG).<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação de aplicação de marca de água. |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Marca de Água". | O sistema apresenta o vídeo e a interface de configuração da marca de água. |
| 2 | O utilizador escolhe o tipo de marca: texto ou imagem. | O sistema apresenta os campos respetivos (campo de texto ou seletor/upload de imagem). |
| 3 | O utilizador introduz o texto da marca (ou seleciona a imagem) e configura a posição (predefinida ou coordenadas manuais X, Y), o tamanho e a opacidade. | O sistema valida os parâmetros e apresenta uma pré-visualização estática da marca sobreposta a um fotograma do vídeo. |
| 4 | O utilizador confirma a operação. | O sistema valida as dimensões e limites geométricos em relação ao quadro do vídeo, verifica a quota diária disponível (se Registado) e cria a tarefa assíncrona. |
| 5 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 6 | — | O worker inicia o processamento (estado processing), sobrepõe a marca fotograma a fotograma (filtro FFmpeg overlay sobre PNG; o texto é previamente renderizado em PNG por sharp/Pango, segundo D-59/ADR-009), mantendo a posição fixa, e emite eventos de progresso percentual (0–100%) via WebSocket. |
| 7 | — | O worker recompõe o vídeo no contentor MP4 com o codec H.264, remuxa a stream de áudio original sem recodificação quando esta é AAC (recodificando-a para AAC quando é MP3, em AVI) e armazena o ficheiro resultante. |
| 8 | — | O sistema associa o novo vídeo ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador via WebSocket. |
| 9 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo com marca de água na lista de recursos; o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Marca de água como imagem* | No passo 2, o utilizador escolhe imagem → O sistema permite selecionar uma imagem da galeria do projeto ou carregar um ficheiro PNG/JPEG local. O fluxo continua no passo 3. |
| *FA2 – Alteração de parâmetros após pré-visualização* | No passo 3, após ver a pré-visualização estática, o utilizador ajusta a posição, opacidade ou dimensão → O sistema re-renderiza a pré-visualização estática imediatamente. O fluxo continua no passo 4. |
| *FA3 – Cancelamento antes do início do processamento* | No passo 5, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a operação reservada à quota (se Registado), transita a tarefa para cancelled e notifica o utilizador. Nenhum novo vídeo é gerado. |
| *FA4 – Cancelamento durante o processamento* | No passo 6, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA5 – Utilizador com perfil Premium* | No passo 4, o utilizador tem perfil Premium → O sistema não debita nem verifica quota diária (quota ilimitada) e aplica os limites de duração alargados (até 60 min). |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Formato ou codec de vídeo não suportado.* | No passo 4, o sistema rejeita a operação se o vídeo não estiver num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Conteúdo da marca de água vazio ou inválido.* | No passo 3, se o texto estiver vazio ou a imagem for ilegível/corrompida → O sistema rejeita com erro (INVALID_WATERMARK_CONTENT). A tarefa não é criada e a quota não é afetada. |
| *Posição ou dimensão fora dos limites do vídeo.* | No passo 4, se a marca configurada ultrapassar as margens visíveis do quadro do vídeo → O sistema rejeita com erro (WATERMARK_OUT_OF_BOUNDS). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 4, o sistema rejeita a operação se os limites forem excedidos (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 4, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 6, se o worker falhar durante a renderização de fotogramas → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador com mensagem de erro. Nenhum recurso parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo ficheiro MP4 com a marca de água sobreposta em todos os fotogramas é persistido no armazenamento de objetos e registado na base de dados associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária do utilizador é consumida em 1 operação (apenas perfil Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, ficheiros temporários são purgados, a quota diária reservada é devolvida integralmente e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | No MVP, a marca de água tem posição, tamanho e opacidade fixos e constantes ao longo de toda a duração do vídeo. |
| *RN3* | A marca de água deve estar integralmente contida nos limites do quadro do vídeo (X + largura ≤ largura_vídeo e Y + altura ≤ altura_vídeo). |
| *RN4* | O vídeo de entrada pode estar em qualquer formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002); o vídeo de saída é gerado em MP4 com H.264 (vídeo) e AAC (áudio, se presente) (DQ-012). Se o vídeo contiver áudio AAC, este é remuxado sem recodificação; áudio MP3 é recodificado para AAC. |
| *RN5* | Limites por perfil: Registado — duração ≤ 5 minutos e tamanho ≤ 200 MB; Premium — duração ≤ 60 minutos e tamanho ≤ 2 GB. |
| *RN6* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN7* | Em caso de cancelamento ou falha técnica, o crédito de quota reservado é integralmente devolvido ao utilizador Registado. |
| *RN8* | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket à medida que os fotogramas são processados. |
| *RN9* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN10* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O utilizador tem acesso a um projeto com pelo menos um vídeo elegível (MP4, MOV ou AVI) carregado. |
| *A2* | O FFmpeg suporta a sobreposição de texto com fontes TrueType (drawtext) e de imagens com canal alfa (overlay). |
| *A3* | A quota diária é reposta diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Como é medido o progresso durante a marca de água? | O worker emite o progresso percentual (0–100%) com base no tempo de saída comunicado pelo FFmpeg e na duração esperada do plano, segundo a cadência de REQ-VID-NFR-008. |
| *Q2* | A marca de água pode mover-se ao longo do vídeo ou ter intervalo temporal de visibilidade restrito? | Não para o MVP. A posição é estática e contínua do primeiro ao último fotograma. Posições dinâmicas ficam para a Fase 2. |
