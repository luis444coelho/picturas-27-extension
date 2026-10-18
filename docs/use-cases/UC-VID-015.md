# Caso de Uso: UC-VID-015 — Processar vários vídeos em lote
### PictuRAS (v27.1) · Fase 1: Suporte a Vídeo Digital

---

## 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-015 |
| **Nome** | Processar vários vídeos em lote |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador aplicar a mesma operação ou o mesmo conjunto de operações (cadeia) a vários vídeos do projeto, sem configurar cada vídeo individualmente, obtendo um novo vídeo por cada vídeo processado, sem alterar os originais. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende uniformizar vários vídeos (e.g. aplicar a mesma marca de água e redimensionar para 720p) com uma única configuração.<br>- **Sistema PictuRAS**: deve validar a configuração face a cada vídeo antes de aceitar o lote e isolar as falhas de cada vídeo.<br>- **Administrador**: pretende que o custo em quota reflita o número de vídeos processados e que o lote não monopolize os workers. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém pelo menos dois vídeos num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), dentro dos limites do perfil.<br>- O utilizador Registado tem quota diária disponível para o custo total do lote.<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona vários vídeos do projeto e escolhe a operação "Processar em Lote". |

---

## 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona dois ou mais vídeos do projeto e escolhe a operação "Processar em Lote". | O sistema apresenta a lista dos vídeos selecionados e os limites do perfil (máx. 10 vídeos Registado, 50 Premium). |
| 2 | O utilizador define uma operação ou uma cadeia de operações (sem junção) e configura os respetivos parâmetros. | O sistema valida os parâmetros com as mesmas regras da operação ou cadeia isolada. |
| 3 | — | O sistema pré-valida a configuração face a cada vídeo (e.g. instante final de recorte superior à duração, remoção de áudio num vídeo sem áudio), assinala os vídeos incompatíveis com o motivo e apresenta o custo total em créditos (custo da operação ou cadeia × número de vídeos elegíveis). |
| 4 | O utilizador confirma o lote. | O sistema verifica que a quota disponível cobre o custo total (se Registado), cria um lote com identificador próprio (`batchId`) e uma subtarefa por vídeo elegível, e aceita-o como 1 tarefa ativa do projeto. |
| 5 | — | O sistema reserva a totalidade dos créditos do lote (se Registado), coloca o lote na fila com estado `queued` e notifica o utilizador da aceitação. |
| 6 | — | O worker processa os vídeos sequencialmente (estado do lote `processing`), emitindo via WebSocket o estado de cada vídeo e o progresso agregado (vídeos concluídos / total e percentagem global). |
| 7 | — | Por cada vídeo concluído, o sistema associa o novo vídeo ao projeto (referenciando o vídeo de origem) e confirma os créditos desse vídeo; por cada vídeo falhado, devolve os respetivos créditos e regista o motivo, prosseguindo com os restantes. |
| 8 | — | No fim, o sistema transita o lote para `completed` (se pelo menos um vídeo foi concluído) ou `failed` (se todos falharam) e notifica o utilizador com o resumo (concluídos, falhados e créditos debitados). |
| 9 | O utilizador consulta o projeto. | O sistema apresenta os novos vídeos na lista de recursos; os vídeos de origem permanecem inalterados. |

---

## 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Descarregar os resultados do lote em ZIP** | No passo 9, o utilizador escolhe "Descarregar Lote" → O sistema gera um arquivo ZIP com os vídeos concluídos do lote, disponível por URL assinado temporário (UC-VID-006), sem consumo de quota. |
| **FA2 – Exclusão dos vídeos incompatíveis** | No passo 3, o utilizador retira do lote os vídeos assinalados como incompatíveis → O sistema recalcula o custo total; se restar menos de dois vídeos, a confirmação fica bloqueada. |
| **FA3 – Carregar uma cadeia predefinida** | No passo 2, o utilizador carrega uma cadeia guardada como predefinição (UC-VID-014, FA3) → O sistema preenche a configuração e o fluxo continua no passo 3. |
| **FA4 – Cancelamento do lote** | No passo 5 ou 6, o utilizador cancela o lote → O sistema interrompe o vídeo em curso e os pendentes, purga os temporários, devolve os créditos dos vídeos não concluídos (se Registado), mantém os vídeos já concluídos e transita o lote para `cancelled`. |
| **FA5 – Utilizador com perfil Premium** | No passo 4, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica o limite alargado de 50 vídeos. |
| **FA6 – Utilizador abandona a sessão durante o processamento** | No passo 6, o utilizador fecha o browser → O worker continua o processamento em background e os resultados ficam disponíveis na próxima sessão. |

---

## 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Menos de dois vídeos ou mais do que o limite do perfil.** | No passo 4, o sistema rejeita o lote (`INSUFFICIENT_INPUTS` ou `TOO_MANY_INPUTS`). A tarefa não é criada. |
| **Configuração com passo de junção ou extração de fotogramas.** | No passo 2, o sistema rejeita a configuração (`INVALID_BATCH_OPERATION`). |
| **Nenhum vídeo compatível com a configuração.** | No passo 3, o sistema bloqueia a confirmação (`NO_ELIGIBLE_INPUTS`). |
| **Quota disponível inferior ao custo total do lote (utilizador Registado).** | No passo 4, o sistema informa o custo total e o saldo disponível (`QUOTA_EXCEEDED`). O lote não é criado e nenhum crédito é reservado. |
| **Falha no processamento de um vídeo.** | No passo 7, o sistema marca a subtarefa como `failed`, elimina os respetivos temporários, devolve os créditos desse vídeo (se Registado) e prossegue com os restantes. |
| **Falha geral do worker.** | No passo 6, os vídeos já concluídos mantêm-se; os restantes são marcados como `failed`, os seus créditos são devolvidos e o utilizador é notificado. |

---

## 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Cada vídeo concluído do lote origina um novo vídeo associado ao projeto (com referência ao respetivo vídeo de origem). Os vídeos de origem permanecem inalterados. A quota diária é consumida apenas pelos vídeos concluídos (custo da operação ou cadeia × vídeos concluídos; apenas Registado). O lote transita para `completed`. |
| **Garantia Mínima** | Os vídeos falhados ou cancelados não deixam resultados parciais nem temporários, os seus créditos são devolvidos e os vídeos já concluídos permanecem válidos no projeto. Os vídeos de origem permanecem inalterados. |

---

## 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| **RN2** | Número de vídeos por lote: mínimo 2; máximo 10 (Registado) ou 50 (Premium) (DQ-015). |
| **RN3** | O lote aplica uma operação ou uma cadeia (UC-VID-014) sem junção; a junção e a extração de fotogramas não são elegíveis (DQ-017). |
| **RN4** | O custo do lote é o custo da operação ou cadeia multiplicado pelo número de vídeos concluídos (DQ-014). O custo total para os vídeos elegíveis é verificado e reservado antes da aceitação. |
| **RN5** | O lote conta como 1 tarefa ativa no projeto; os vídeos são processados sequencialmente (DQ-016). |
| **RN6** | Os resultados são independentes: a falha de um vídeo não invalida os restantes (DQ-018); cada vídeo, isoladamente, segue a política tudo-ou-nada. |
| **RN7** | Os créditos dos vídeos falhados ou cancelados são devolvidos ao utilizador Registado. |
| **RN8** | Cada resultado é gerado segundo as regras da operação ou cadeia aplicada (DQ-013). |
| **RN9** | Os vídeos de origem nunca são alterados nem eliminados. |

---

## 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | A pré-validação por vídeo usa apenas os metadados persistidos, sem processar os ficheiros. |
| **A2** | O mecanismo de descarregamento em ZIP existente para imagens pode ser estendido a vídeos. |
| **A3** | A quota diária é reposta diariamente às 00:00 UTC. |

---

## 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Se a quota não cobrir o lote inteiro, deve o sistema aceitar apenas os vídeos que a quota cobre? | Não no MVP (Q-ERS-007). O lote é rejeitado e o utilizador pode reduzir a seleção. |
| **Q2** | Devem os vídeos do lote ser processados em paralelo? | Não no MVP. O processamento é sequencial para respeitar o limite de 1 tarefa ativa por projeto. |
