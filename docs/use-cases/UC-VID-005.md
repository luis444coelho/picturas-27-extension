# Caso de Uso: UC-VID-005 — Extrair fotogramas de um vídeo para o projeto
### PictuRAS (v27.1) · Fase 1: Suporte a Vídeo Digital

---

## 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-005 |
| **Nome** | Extrair fotogramas de um vídeo para o projeto |
| **Versão** | v1.3 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador extrair um conjunto de fotogramas discretos de um vídeo do projeto segundo um intervalo temporal e passo regular, convertendo-os em imagens normais associadas ao projeto, sem alterar o vídeo original. |
| **Âmbito** | Módulo de processamento de vídeo e integração com a galeria de imagens do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende obter imagens estáticas com qualidade a partir do vídeo para aplicar as ferramentas de imagem já existentes na plataforma.<br>- **Sistema PictuRAS**: deve extrair os fotogramas com rigor temporal, convertê-los no formato pretendido (JPEG ou PNG) e adicioná-los de forma atómica ao projeto.<br>- **Administrador**: pretende garantir que a extração não sobrecarrega a base de dados nem excede as quotas de armazenamento. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br>- O utilizador tem quota diária disponível (se Registado).<br>- O número estimado de fotogramas a extrair não excede o limite do perfil (50 para Registado, 500 para Premium).<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação "Extrair Fotogramas". |

---

## 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Extrair Fotogramas". | O sistema apresenta o vídeo e o configurador de extração com valores padrão (intervalo total, passo $N = 5\text{s}$, formato JPEG). O sistema apresenta também a quota disponível e o limite de fotogramas do perfil. |
| 2 | O utilizador define o intervalo temporal $[t_{\text{início}}, t_{\text{fim}}[$, o passo $N$ (em segundos inteiros) e o formato de saída (JPEG ou PNG). | O sistema calcula e apresenta em tempo real o número estimado de fotogramas a gerar, correspondente aos instantes $t_{\text{início}} + k \times N < t_{\text{fim}}$. |
| 3 | O utilizador confirma a extração. | O sistema valida os parâmetros, verifica que a estimativa respeita o limite do perfil (≤ 50 Registado, ≤ 500 Premium), verifica a quota disponível e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado `processing`), extrai para cada instante o fotograma codificado mais próximo, converte-o para o formato selecionado (JPEG/PNG) e emite progresso contínuo (0–100%) via WebSocket com base no número de fotogramas já extraídos. |
| 6 | — | O worker armazena os fotogramas no armazenamento de objetos e regista-os na base de dados como imagens normais associadas ao projeto (referenciando o vídeo de origem e o timestamp). |
| 7 | — | O sistema transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador via WebSocket. |
| 8 | O utilizador consulta o projeto. | O sistema apresenta os novos recursos de imagem na galeria do projeto, disponíveis para utilização com qualquer ferramenta de imagem existente; o vídeo original permanece inalterado. |

---

## 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Pré-visualização de amostra estática** | No passo 2, o utilizador clica em "Pré-visualizar Amostra" → O sistema extrai e apresenta 3 fotogramas representativos (início, meio, fim do intervalo) em baixa resolução. Esta ação não cria tarefa, não altera o projeto e não consome quota. O utilizador pode ajustar os parâmetros e continuar no passo 3. |
| **FA2 – Cancelamento durante o processamento** | No passo 5, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina todos os fotogramas já gerados (nenhum é adicionado ao projeto), devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA3 – Utilizador abandona a sessão durante o processamento** | No passo 5, o utilizador fecha o browser ou faz logout → O worker continua o processamento em background. Na próxima sessão, os fotogramas estarão disponíveis na galeria do projeto. |
| **FA4 – Utilizador com perfil Premium** | No passo 3, o utilizador tem perfil Premium → O sistema aplica o limite alargado de até 500 fotogramas por extração e não debita nem verifica quota diária de operações (quota ilimitada). |
| **FA5 – Ajuste de parâmetros sugerido pelo sistema** | No passo 2, se os parâmetros configurados excederem o limite de fotogramas do perfil, o sistema sugere um valor superior para o passo $N$ que traga a contagem para dentro do limite. O utilizador aceita a sugestão com um clique. |

---

## 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Parâmetros inválidos ($t_{\text{início}} \ge t_{\text{fim}}$, $t_{\text{fim}} > \text{duração}$, ou $N < 1\text{s}$).** | No passo 3, o sistema rejeita a operação com erro de validação (`INVALID_EXTRACTION_PARAMS`), indicando os campos incorretos. A tarefa não é criada e a quota não é afetada. |
| **Número de fotogramas excede o limite do perfil.** | No passo 3, se a estimativa exceder 50 (Registado) ou 500 (Premium), o sistema rejeita a operação (`FRAME_COUNT_EXCEEDED`), sugere o aumento do passo $N$ e, se Registado, sugere o upgrade para Premium. A tarefa não é criada. |
| **Formato ou codec de vídeo não suportado.** | No passo 3, o sistema rejeita a operação se o vídeo não estiver num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 3, o sistema rejeita a operação se os limites forem excedidos (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Ficheiro corrompido ou erro de descodificação.** | No passo 5, se o worker não conseguir ler fotogramas em determinados timestamps → O sistema transita a tarefa para `failed`, elimina fotogramas parciais gerados, estorna a quota reservada (se Registado) e notifica o utilizador com mensagem de erro. |
| **Falha de execução a meio do processamento.** | No passo 5, se o worker falhar (timeout, falta de disco, crash do processo) → O sistema descarta todos os fotogramas parciais gerados (política tudo-ou-nada), estorna a quota (se Registado), transita a tarefa para `failed` e notifica o utilizador. |
| **Armazenamento de projeto insuficiente.** | No passo 3, se o projeto tiver limite de armazenamento e o espaço estimado para os fotogramas for insuficiente → O sistema recusa a operação antes de iniciar (`STORAGE_LIMIT_EXCEEDED`). |

---

## 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Todos os fotogramas extraídos no formato selecionado (JPEG ou PNG) são guardados no armazenamento de objetos e registados na base de dados como imagens do projeto (com referência ao vídeo de origem e ao timestamp). Estão imediatamente disponíveis para aplicação das ferramentas de imagem existentes. O vídeo original permanece inalterado. A quota diária do utilizador é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro, cancelamento ou timeout, nenhum fotograma parcial é adicionado ao projeto (política atómica tudo-ou-nada), ficheiros temporários são purgados, a quota diária reservada é devolvida integralmente e a tarefa transita para `failed` ou `cancelled`. O vídeo original e o projeto permanecem inalterados. |

---

## 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium autenticados com permissão de edição no projeto podem executar a operação. |
| **RN2** | Limites por perfil: Registado — máx. 50 fotogramas por extração; Premium — máx. 500 fotogramas por extração. |
| **RN3** | O intervalo de amostragem é semiaberto: $[t_{\text{início}}, t_{\text{fim}}[$. Os fotogramas são gerados nos instantes $t_k = t_{\text{início}} + k \times N$, para $k = 0, 1, 2, \dots$ enquanto $t_k < t_{\text{fim}}$. |
| **RN4** | O passo $N$ deve ser um número inteiro de segundos com $N \ge 1$. O valor padrão sugerido pela interface é $N = 5\text{s}$. |
| **RN5** | O formato de saída dos fotogramas pode ser JPEG (padrão) ou PNG, selecionado pelo utilizador. |
| **RN6** | Cada operação de extração concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia), independentemente do número de fotogramas extraídos (respeitado o limite da RN2). Utilizadores Premium têm quota ilimitada. |
| **RN7** | A adição dos fotogramas ao projeto é atómica: ou todos os fotogramas solicitados são adicionados com sucesso, ou nenhum é adicionado (política tudo-ou-nada). Em caso de falha ou cancelamento, fotogramas parciais são descartados. |
| **RN8** | Em caso de cancelamento ou falha técnica, o crédito de quota reservado é integralmente devolvido ao utilizador Registado. |
| **RN9** | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket com base na razão $\text{fotogramas\_extraídos} / \text{total\_estimado}$. |
| **RN10** | A pré-visualização de amostra estática (FA1) não cria tarefa no sistema, não altera o projeto e não consome quota. |
| **RN11** | Os fotogramas extraídos tornam-se recursos de imagem normais do projeto e podem ser encadeados (*tool chaining*) com qualquer ferramenta de imagem existente do PictuRAS. |
| **RN12** | O vídeo original nunca é alterado nem eliminado pela operação de extração. |
| **RN13** | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |

---

## 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O utilizador tem acesso a um projeto com pelo menos um vídeo elegível (MP4, MOV ou AVI) carregado. |
| **A2** | Os fotogramas extraídos herdam a resolução espacial (largura × altura) do vídeo original. |
| **A3** | O armazenamento de objetos suporta a gravação eficiente de múltiplos ficheiros de imagem em lote. |
| **A4** | Quando o timestamp teórico $t_k$ não coincide exatamente com um fotograma codificado no vídeo, o FFmpeg seleciona o fotograma mais próximo sem interpolação. |
| **A5** | A quota diária é redefinida diariamente às 00:00 UTC. |
| **A6** | O processamento em lote de vários vídeos e o encadeamento de operações de vídeo são suportados no MVP (UC-VID-014 e UC-VID-015). A extração de fotogramas não é elegível como passo de cadeia nem como operação de lote de vídeos, por produzir imagens; os fotogramas extraídos, enquanto imagens normais do projeto, podem ser processados em lote com as ferramentas de imagem existentes. |

---

## 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Como é medido o progresso durante a extração? | O worker emite o progresso percentual (0–100%) baseado no rácio de fotogramas já gravados face à contagem total calculada no início da tarefa. |
| **Q2** | Os fotogramas devem ser agrupados numa galeria própria ou misturados com as imagens do projeto? | No MVP, são integrados como imagens normais na galeria do projeto com metadados de proveniência (`sourceVideoId` e `timestamp`). |

