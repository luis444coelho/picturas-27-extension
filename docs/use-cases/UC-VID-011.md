# Caso de Uso: UC-VID-011 — Rodar e espelhar um vídeo
### PictuRAS (v27.1) · Fase 1: Suporte a Vídeo Digital

---

## 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-011 |
| **Nome** | Rodar e espelhar um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador rodar um vídeo do projeto num ângulo de 90°, 180° ou 270° e/ou espelhá-lo na horizontal ou na vertical, de modo a corrigir ou alterar a orientação, obtendo um novo vídeo sem alterar o original. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende corrigir vídeos gravados na orientação errada (e.g. telemóvel na vertical) ou criar efeitos de espelho.<br>- **Sistema PictuRAS**: deve aplicar transformações geométricas exatas e sem perda de área visível.<br>- **Administrador**: pretende garantir que o processamento respeita quotas e limites de infraestrutura. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação "Rodar / Espelhar". |

---

## 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Rodar / Espelhar". | O sistema apresenta o vídeo, os botões de rotação no sentido horário (90°, 180°, 270°) e as opções de espelho horizontal e vertical, todos desativados. |
| 2 | O utilizador escolhe um ângulo de rotação e/ou uma ou ambas as opções de espelho. | O sistema apresenta, em ≤ 1 s, uma pré-visualização estática do primeiro fotograma com a transformação combinada (rotação aplicada primeiro, espelho depois) e as dimensões resultantes. |
| 3 | O utilizador confirma a operação. | O sistema valida que o ângulo pertence ao conjunto permitido e que foi definida pelo menos uma transformação, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado `processing`), aplica a transformação a todos os fotogramas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC), com largura e altura trocadas nas rotações de 90° e 270°, preservando a duração, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo transformado na lista de recursos; o vídeo original permanece inalterado. |

---

## 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Alteração da transformação após pré-visualização** | No passo 2, o utilizador altera o ângulo ou as opções de espelho → O sistema atualiza a pré-visualização e as dimensões resultantes. |
| **FA2 – Cancelamento antes do início do processamento** | No passo 4, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA3 – Cancelamento durante o processamento** | No passo 5, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA4 – Utilizador com perfil Premium** | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| **FA5 – Utilização como passo de cadeia ou lote** | A operação é configurada como passo de uma cadeia (UC-VID-014) ou aplicada em lote (UC-VID-015) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |

---

## 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Ângulo de rotação fora do conjunto {90°, 180°, 270°}.** | No passo 3, o sistema rejeita a operação (`INVALID_ORIENT_PARAMS`). A tarefa não é criada e a quota não é afetada. |
| **Nenhuma transformação definida (sem rotação e sem espelho).** | No passo 3, o sistema bloqueia a confirmação (`NO_CHANGES`). |
| **Formato ou codec de vídeo não suportado.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 3, o sistema rejeita a operação (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 5, se o worker falhar → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |

---

## 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um novo vídeo MP4 com a orientação pretendida é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. O vídeo original permanece inalterado. |

---

## 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| **RN2** | A rotação é feita no sentido horário e apenas nos ângulos 90°, 180° e 270°. |
| **RN3** | O espelho pode ser horizontal, vertical ou ambos, e pode ser combinado com a rotação numa única operação; a rotação é aplicada antes do espelho. |
| **RN4** | Pelo menos uma transformação (rotação ou espelho) deve estar definida. |
| **RN5** | Nas rotações de 90° e 270°, a largura e a altura do vídeo resultante são trocadas, sem recorte nem barras. |
| **RN6** | O resultado é gerado em MP4 (H.264/AAC), preservando a duração, a taxa de fotogramas e o áudio do original (DQ-013). |
| **RN7** | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| **RN8** | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| **RN9** | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| **RN10** | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| **RN11** | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| **RN12** | A operação pode ser usada como passo de uma cadeia (UC-VID-014) e no processamento em lote (UC-VID-015). |

---

## 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O FFmpeg (filtros `transpose`, `hflip` e `vflip`) aplica as transformações sem perda de área visível. |
| **A2** | A quota diária é reposta diariamente às 00:00 UTC. |

---

## 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Deve ser suportada a rotação por ângulos arbitrários (e.g. 15°)? | Não no MVP. Apenas múltiplos de 90°, que não exigem recorte nem preenchimento. |
| **Q2** | Deve ser respeitada a etiqueta de rotação dos metadados (e.g. vídeos de telemóvel)? | Sim. A pré-visualização e o processamento partem da orientação de apresentação indicada pelos metadados do original. |
