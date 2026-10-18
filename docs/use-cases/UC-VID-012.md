# Caso de Uso: UC-VID-012 — Converter o formato de um vídeo
### PictuRAS (v27.1) · Fase 1: Suporte a Vídeo Digital

---

## 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-012 |
| **Nome** | Converter o formato de um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador converter um vídeo do projeto entre os formatos suportados (MP4, MOV e AVI), selecionando o formato de saída pretendido, e obter um novo vídeo nesse formato sem alterar o original. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende obter o vídeo num formato compatível com outra aplicação ou dispositivo (e.g. converter um AVI antigo para MP4).<br>- **Sistema PictuRAS**: deve produzir ficheiros conformes à matriz de formatos e codecs aprovada, evitando recodificações desnecessárias.<br>- **Administrador**: pretende garantir que o processamento respeita quotas e limites de infraestrutura. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação "Converter Formato". |

---

## 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Converter Formato". | O sistema apresenta o formato atual (contentor e codecs) e a lista de formatos de saída suportados (MP4, MOV, AVI), excluindo o formato atual. |
| 2 | O utilizador seleciona o formato de saída. | O sistema apresenta os codecs que serão utilizados no formato escolhido e indica se a conversão será feita por cópia direta de streams (*remux*) ou por recodificação. |
| 3 | O utilizador confirma a operação. | O sistema valida que o formato de saída pertence à matriz suportada e é diferente do atual, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado `processing`) e gera o novo contentor, copiando as streams sem recodificação quando os codecs de origem são admitidos no formato de saída, ou recodificando-as para os codecs da matriz caso contrário; emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O sistema armazena o novo vídeo, preservando a duração, a resolução e a taxa de fotogramas; se o formato de saída for MOV ou AVI, gera a cópia de pré-visualização MP4; associa o resultado ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo convertido na lista de recursos, disponível para reprodução e descarregamento (UC-VID-006); o vídeo original permanece inalterado. |

---

## 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Conversão por cópia direta de streams** | No passo 5, se os codecs de origem forem admitidos no formato de saída (e.g. MP4 H.264/AAC → MOV) → O worker reacondiciona as streams no novo contentor sem recodificação, sem perda de qualidade. |
| **FA2 – Cancelamento antes do início do processamento** | No passo 4, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA3 – Cancelamento durante o processamento** | No passo 5, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA4 – Utilizador com perfil Premium** | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| **FA5 – Utilização como passo de cadeia ou lote** | A conversão é configurada como último passo de uma cadeia (UC-VID-014) ou aplicada em lote (UC-VID-015) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |

---

## 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Formato de saída igual ao formato atual.** | No passo 3, o sistema bloqueia a confirmação (`SAME_FORMAT`). |
| **Formato de saída fora da matriz suportada.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_TARGET_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Formato ou codec do vídeo de origem não suportado.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 3, o sistema rejeita a operação (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 5, se o worker falhar → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |

---

## 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um novo vídeo no formato de saída escolhido, conforme à matriz de codecs, é persistido e associado ao projeto (com referência ao vídeo de origem e, se MOV/AVI, com cópia de pré-visualização MP4). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. O vídeo original permanece inalterado. |

---

## 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| **RN2** | Os formatos de origem e de saída admitidos são MP4, MOV e AVI (DQ-002). |
| **RN3** | Codecs de saída por formato: MP4 e MOV — H.264 (vídeo) e AAC (áudio); AVI — MPEG-4 Part 2 (vídeo) e MP3 (áudio). |
| **RN4** | O formato de saída tem de ser diferente do formato de origem. |
| **RN5** | Quando os codecs de origem são admitidos no formato de saída, as streams são copiadas sem recodificação; caso contrário, são recodificadas para os codecs da RN3. |
| **RN6** | A conversão preserva a duração, a resolução e a taxa de fotogramas do original. |
| **RN7** | Os resultados em MOV ou AVI recebem uma cópia de pré-visualização MP4 para reprodução no leitor integrado (DQ-012). |
| **RN8** | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| **RN9** | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| **RN10** | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| **RN11** | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| **RN12** | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| **RN13** | A conversão pode ser usada no processamento em lote (UC-VID-015) e numa cadeia (UC-VID-014), mas apenas como último passo (DQ-017). |

---

## 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O FFmpeg suporta a escrita dos contentores MP4, MOV e AVI com os codecs da RN3. |
| **A2** | A quota diária é reposta diariamente às 00:00 UTC. |

---

## 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Deve o utilizador poder escolher o codec ou a qualidade (bitrate) de saída? | Não no MVP. Os codecs são fixos por formato (RN3) e a qualidade usa os valores por omissão da equipa. |
| **Q2** | Devem ser suportados outros formatos de saída (WebM, MKV, GIF)? | Não no MVP; ficam para o Alvo de Produção da REQ-VID-NFR-003. |
