# Caso de Uso: UC-VID-002 — Remover o áudio de um vídeo
### PictuRAS (v27.1) · Fase 1: Suporte a Vídeo Digital

---

## 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-002 |
| **Nome** | Remover o áudio de um vídeo |
| **Versão** | v1.3 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador remover todas as faixas de áudio de um vídeo do projeto, obtendo um novo vídeo silencioso (*video-only*), preservando o original. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende suprimir o som de um vídeo de forma simples e rápida sem perda de qualidade visual.<br>- **Sistema PictuRAS**: deve extrair/descartar as streams de áudio de forma eficiente sem recodificar a imagem.<br>- **Administrador**: pretende garantir a integridade dos ficheiros e o respeito pelas quotas. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) com pelo menos uma stream de áudio, com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação de remoção de áudio. |

---

## 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Remover Áudio". | O sistema verifica que o vídeo contém áudio e apresenta um resumo da operação (remoção de todas as faixas de áudio, preservação do vídeo original). |
| 2 | O utilizador confirma a operação. | O sistema valida a quota disponível do utilizador (se Registado) e cria a tarefa de processamento assíncrono. |
| 3 | — | O sistema reserva 1 operação da quota diária do utilizador (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 4 | — | O worker inicia o processamento (estado `processing`), remove as streams de áudio, copia a stream de vídeo sem recodificação quando esta é H.264 (*stream copy*), recodificando-a para H.264 apenas quando a origem é MPEG-4 Part 2 (AVI), e produz um novo ficheiro MP4 sem som. |
| 5 | — | O sistema armazena o novo vídeo, associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador via WebSocket. |
| 6 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo silencioso na lista de recursos; o vídeo original com áudio permanece inalterado. |

---

## 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Cancelamento antes do início do processamento** | No passo 3, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a operação reservada à quota (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. Nenhum novo vídeo é gerado. |
| **FA2 – Cancelamento durante o processamento** | No passo 4, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA3 – Utilizador com perfil Premium** | No passo 2, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária (quota ilimitada) e aplica os limites de duração alargados (até 60 min). |

---

## 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Formato ou codec de vídeo não suportado.** | No passo 2, o sistema rejeita a operação se o vídeo não estiver num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Vídeo sem faixas de áudio.** | No passo 1, o sistema deteta que o vídeo não contém streams de áudio (`NO_AUDIO_STREAM`), informa o utilizador de que o vídeo já é silencioso e recusa a operação. A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 2, o sistema rejeita a operação se os limites forem excedidos (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 2, o sistema informa que o limite de 5 operações diárias foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 4, se o worker falhar → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador com mensagem de erro. Nenhum recurso parcial é criado. |

---

## 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um novo ficheiro MP4 sem qualquer stream de áudio é guardado no armazenamento de objetos e registado na base de dados associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária do utilizador é consumida em 1 operação (apenas perfil Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, ficheiros temporários são purgados, a quota diária reservada é devolvida integralmente e a tarefa transita para `failed` ou `cancelled`. O vídeo original permanece inalterado. |

---

## 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium autenticados podem executar a operação. Utilizadores Anónimos não têm acesso. |
| **RN2** | O vídeo de entrada deve conter pelo menos uma stream de áudio detetável via metadados. Vídeos sem áudio são rejeitados sem consumo de quota. |
| **RN3** | O vídeo de entrada pode estar em qualquer formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) e o vídeo de saída é gerado em MP4 (DQ-013). Uma stream de vídeo H.264 é preservada sem recodificação (*stream copy* com `-c:v copy -an`); uma stream MPEG-4 Part 2 (AVI) é recodificada para H.264. |
| **RN4** | Limites por perfil: Registado — duração ≤ 5 minutos e tamanho ≤ 200 MB; Premium — duração ≤ 60 minutos e tamanho ≤ 2 GB. |
| **RN5** | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| **RN6** | Em caso de cancelamento ou falha técnica, o crédito de quota reservado é integralmente devolvido ao utilizador Registado. |
| **RN7** | A operação é assíncrona; o utilizador pode abandonar a página após submissão sem interromper o processamento. |
| **RN8** | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| **RN9** | Apenas pode existir 1 tarefa de vídeo ativa em simultâneo por projeto. |

---

## 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O utilizador tem acesso a um projeto com pelo menos um vídeo elegível (MP4, MOV ou AVI) que contém áudio. |
| **A2** | O comando FFmpeg com `-an` e `-c:v copy` executa muito rapidamente por não necessitar de recodificação de vídeo. |
| **A3** | A quota diária é reposta diariamente às 00:00 UTC. |

---

## 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Como é medido o progresso durante a remoção de áudio? | No MVP, dada a rapidez da cópia de streams, reportam-se os estados `queued`, `processing` e `completed` sem percentagem intermédia contínua. |
| **Q2** | Em vídeos com múltiplas faixas de áudio, é possível escolher qual remover? | No MVP, a operação remove todas as faixas de áudio globalmente. A seleção granular de faixas fica como melhoria pós-MVP. |

