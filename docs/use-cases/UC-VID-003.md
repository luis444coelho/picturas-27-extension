# UC-VID-003 — Alterar a velocidade de reprodução de um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-003 |
| *Nome* | Alterar a velocidade de reprodução de um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador acelerar (*speed up*) ou desacelerar (*slow down*) a reprodução de um vídeo do projeto segundo um fator multiplicador definido, produzindo um novo vídeo com duração ajustada e sincronismo preservado, sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende criar efeitos de *timelapse* ou *slow motion* mantendo o sincronismo do áudio (se presente) sem degradar o vídeo de origem.<br> - *Sistema PictuRAS*: deve reamostrar fotogramas e ajustar a cadência sonora de forma proporcional e estável.<br> - *Administrador*: pretende garantir o cumprimento das quotas e a estabilidade computacional dos nós de processamento. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium), elegível para processamento.<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação de alteração de velocidade. |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Alterar Velocidade". | O sistema apresenta o vídeo selecionado e os controlos de velocidade (fatores predefinidos e campo de valor customizado). |
| 2 | O utilizador indica o fator de velocidade pretendido (e.g. 0.5×, 2.0×). | O sistema valida preliminarmente o valor e apresenta a duração estimada do vídeo resultante (duração_original / fator). |
| 3 | O utilizador confirma a alteração da velocidade. | O sistema valida que o fator se encontra no intervalo permitido (0.25× a 4.0×), verifica a quota diária disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado processing), ajusta os fotogramas de vídeo (filtro setpts) e, caso exista áudio, aplica o filtro de cadência sonora (atempo), gerando um novo MP4 (H.264/AAC) com duração ajustada (DQ-012). |
| 6 | — | O sistema armazena o novo vídeo, associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador via WebSocket. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo com a velocidade alterada na lista de recursos; o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Alteração do fator antes de confirmar* | No passo 2, o utilizador experimenta diferentes fatores → O sistema atualiza dinamicamente a duração prevista a cada alteração. O fluxo continua no passo 3. |
| *FA2 – Cancelamento antes do início do processamento* | No passo 4, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a operação reservada à quota (se Registado), transita a tarefa para cancelled e notifica o utilizador. Nenhum novo vídeo é gerado. |
| *FA3 – Cancelamento durante o processamento* | No passo 5, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA4 – Utilizador com perfil Premium* | No passo 3, o utilizador tem perfil Premium → O sistema não debita nem verifica quota diária (quota ilimitada) e aplica os limites de duração alargados (até 60 min). |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Fator de velocidade nulo, negativo ou igual a zero.* | No passo 3, o sistema rejeita a operação com erro de validação (INVALID_SPEED_FACTOR), informando que o fator deve ser estritamente positivo. A tarefa não é criada e a quota não é afetada. |
| *Fator de velocidade fora do intervalo homologado (0.25× a 4.0×).* | No passo 3, o sistema rejeita a operação com erro de limites (SPEED_FACTOR_OUT_OF_RANGE), indicando o intervalo homologado no MVP. A tarefa não é criada e a quota não é afetada. |
| *Formato ou codec de vídeo não suportado.* | No passo 3, o sistema rejeita a operação se o vídeo não estiver num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 3, o sistema rejeita a operação se os limites forem excedidos (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 5, se o worker falhar durante a recodificação → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo ficheiro MP4 com a velocidade de reprodução ajustada e duração recalculada é persistido no armazenamento de objetos e registado na base de dados associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária do utilizador é consumida em 1 operação (apenas perfil Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, ficheiros temporários são purgados, a quota diária reservada é devolvida integralmente e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | O fator de velocidade v deve ser um número real positivo no intervalo 0.25 ≤ v ≤ 4.0. Fatores fora deste intervalo são rejeitados. |
| *RN3* | A duração teórica do vídeo resultante é duração_nova = duração_orig / v. A resolução espacial nativa é integralmente conservada. |
| *RN4* | O vídeo de entrada pode estar em qualquer formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002); o vídeo de saída é gerado em MP4 com H.264 (vídeo) e AAC (áudio, se presente) (DQ-012). |
| *RN5* | Limites por perfil: Registado — duração original ≤ 5 minutos e tamanho ≤ 200 MB; Premium — duração ≤ 60 minutos e tamanho ≤ 2 GB. |
| *RN6* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN7* | Em caso de cancelamento ou falha técnica, o crédito de quota reservado é integralmente devolvido ao utilizador Registado. |
| *RN8* | A operação é assíncrona; o utilizador pode navegar noutras páginas após a submissão sem interromper o processamento. |
| *RN9* | Se o vídeo contiver áudio, este deve ser ajustado proporcionalmente para manter o sincronismo com o vídeo sem distorção excessiva de pitch. Se o vídeo não contiver áudio, apenas a stream de vídeo é ajustada. |
| *RN10* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN11* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O utilizador tem acesso a um projeto com pelo menos um vídeo elegível (MP4, MOV ou AVI) carregado. |
| *A2* | O FFmpeg suporta a alteração de velocidade de vídeo via filtro setpts e de áudio via filtro atempo (encadeado se v > 2.0 ou v < 0.5). |
| *A3* | A quota diária é redefinida diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Como é medido o progresso durante a alteração de velocidade? | No MVP, dada a simplicidade do pipeline, reportam-se os estados queued, processing e completed. O cancelamento é suportado em queued e processing. |
| *Q2* | Deve ser aplicado algoritmo de preservação de timbre no áudio (*pitch correction*)? | No MVP, utiliza-se o filtro padrão atempo do FFmpeg que preserva o timbre de forma aceitável no intervalo 0.25× a 4.0×. Ajustes avançados ficam para a Fase 2. |
