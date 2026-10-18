# Caso de Uso: UC-VID-009 — Aplicar um filtro visual a um vídeo
### PictuRAS (v27.1) · Fase 1: Suporte a Vídeo Digital

---

## 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-009 |
| **Nome** | Aplicar um filtro visual a um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador aplicar um filtro visual predefinido a um vídeo do projeto, obtendo um novo vídeo com o filtro aplicado a todos os fotogramas, sem alterar o original. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende dar um estilo visual ao vídeo com um clique, sem conhecer parâmetros técnicos.<br>- **Sistema PictuRAS**: deve disponibilizar um catálogo fechado de filtros com resultado previsível e reprodutível.<br>- **Administrador**: pretende garantir que o processamento respeita quotas e limites de infraestrutura. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação "Aplicar Filtro". |

---

## 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Aplicar Filtro". | O sistema apresenta o vídeo e o catálogo de filtros predefinidos (Preto e Branco, Sépia, Negativo, Vintage, Frio e Quente), cada um com uma miniatura de exemplo sobre o primeiro fotograma. |
| 2 | O utilizador seleciona um filtro do catálogo. | O sistema apresenta, em ≤ 1 s, uma pré-visualização estática do primeiro fotograma com o filtro aplicado. |
| 3 | O utilizador confirma a operação. | O sistema valida que foi selecionado exatamente um filtro existente no catálogo, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado `processing`), aplica o filtro de forma uniforme a todos os fotogramas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC), preservando a duração, a resolução, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo filtrado na lista de recursos; o vídeo original permanece inalterado. |

---

## 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Troca de filtro após pré-visualização** | No passo 2, o utilizador seleciona outro filtro → O sistema substitui a seleção anterior e atualiza a pré-visualização. |
| **FA2 – Cancelamento antes do início do processamento** | No passo 4, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA3 – Cancelamento durante o processamento** | No passo 5, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA4 – Utilizador com perfil Premium** | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| **FA5 – Utilização como passo de cadeia ou lote** | A operação é configurada como passo de uma cadeia (UC-VID-014) ou aplicada em lote (UC-VID-015) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |

---

## 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Nenhum filtro selecionado ou filtro inexistente no catálogo.** | No passo 3, o sistema rejeita a operação (`INVALID_FILTER`). A tarefa não é criada e a quota não é afetada. |
| **Formato ou codec de vídeo não suportado.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 3, o sistema rejeita a operação (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 5, se o worker falhar → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |

---

## 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um novo vídeo MP4 com o filtro selecionado aplicado a todos os fotogramas é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. O vídeo original permanece inalterado. |

---

## 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| **RN2** | O catálogo de filtros do MVP é fechado: Preto e Branco, Sépia, Negativo, Vintage, Frio e Quente (DQ-021). |
| **RN3** | Cada operação aplica exatamente um filtro, sem controlo de intensidade. |
| **RN4** | O filtro é aplicado de forma uniforme a todos os fotogramas do vídeo. |
| **RN5** | O resultado é gerado em MP4 (H.264/AAC), preservando a duração, a resolução, a taxa de fotogramas e o áudio do original (DQ-013). |
| **RN6** | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| **RN7** | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| **RN8** | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| **RN9** | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| **RN10** | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| **RN11** | A operação pode ser usada como passo de uma cadeia (UC-VID-014) e no processamento em lote (UC-VID-015). |

---

## 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | Cada filtro do catálogo é implementável com filtros FFmpeg standard (e.g. `hue`, `colorchannelmixer`, `negate`, `curves`). |
| **A2** | A quota diária é reposta diariamente às 00:00 UTC. |

---

## 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Deve existir controlo de intensidade do filtro? | Não no MVP (Q-ERS-008). A intensidade fica para a Fase 2. |
| **Q2** | Deve ser possível combinar vários filtros? | Sim, mas apenas através do encadeamento de operações (UC-VID-014), com um filtro por passo. |
