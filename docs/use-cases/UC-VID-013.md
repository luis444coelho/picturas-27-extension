# Caso de Uso: UC-VID-013 — Juntar vídeos

### PictuRAS (v27.1) · Fase 1: Suporte a Vídeo Digital

---

## 2.1 Cabeçalho

| **Secção**                    | **Detalhes**                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID do Caso de Uso**         | UC-VID-013                                                                                                                                                                                                                                                                                                                                                                                             |
| **Nome**                      | Juntar vídeos                                                                                                                                                                                                                                                                                                                                                                                          |
| **Versão**                    | v1.1 (Alinhamento com o ADD v1.1)                                                                                                                                                                                                                                                                                                                                                                      |
| **Autor**                     | Equipa PictuRAS-27                                                                                                                                                                                                                                                                                                                                                                                     |
| **Data**                      | 2026-10-21                                                                                                                                                                                                                                                                                                                                                                                             |
| **Objetivo**                  | Permitir ao utilizador juntar dois ou mais vídeos do projeto, concatenando-os pela ordem selecionada num único vídeo final, sem alterar os originais.                                                                                                                                                                                                                                                  |
| **Âmbito**                    | Módulo de processamento de vídeo e gestão de recursos do PictuRAS                                                                                                                                                                                                                                                                                                                                      |
| **Ator Principal**            | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto                                                                                                                                                                                                                                                                                                                        |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende compor um único vídeo a partir de vários clips, controlando a ordem.<br>- **Sistema PictuRAS**: deve produzir um resultado contínuo mesmo quando os clips têm resoluções, taxas de fotogramas ou presença de áudio diferentes.<br>- **Administrador**: pretende limitar o número de clips e a duração total para proteger os workers e o armazenamento. |
| **Pré-condições**             | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém pelo menos dois vídeos num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002).<br>- Não existe outra tarefa de vídeo ativa no projeto.                                                                                                                  |
| **Trigger**                   | O utilizador escolhe a operação "Juntar Vídeos" no projeto.                                                                                                                                                                                                                                                                                                                                            |

---

## 2.2 Fluxo Principal

| **Passo** | **Ação do Ator**                                                    | **Resposta do Sistema**                                                                                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | O utilizador acede ao projeto e escolhe a operação "Juntar Vídeos". | O sistema apresenta a lista de vídeos elegíveis do projeto (miniatura, nome e duração) e os limites do perfil (número máximo de vídeos e duração total).                                                                                                                                                                |
| 2         | O utilizador seleciona dois ou mais vídeos.                         | O sistema apresenta os vídeos numa linha temporal pela ordem de seleção, com a duração total estimada.                                                                                                                                                                                                                  |
| 3         | O utilizador reordena os vídeos (arrastando-os ou com setas).       | O sistema atualiza a ordem na linha temporal e indica a resolução e a taxa de fotogramas do resultado (as do primeiro clip à saída da sua sub-cadeia, em dimensões de apresentação; ADD v1.1, 4.8, Q-ADD-13).                                                                                                                                                                                           |
| 4         | O utilizador confirma a operação.                                   | O sistema valida o número de vídeos, a duração total face ao limite do perfil e os formatos, verifica a quota disponível (se Registado) e cria a tarefa assíncrona.                                                                                                                                                     |
| 5         | —                                                                   | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação.                                                                                                                                                                          |
| 6         | —                                                                   | O worker inicia o processamento (estado `processing`), normaliza cada clip para a resolução e taxa de fotogramas do primeiro (com barras pretas quando a proporção difere), acrescenta uma faixa de silêncio aos clips sem áudio quando pelo menos um clip tem áudio (se nenhum tiver, o resultado fica sem áudio), concatena-os pela ordem definida e emite progresso percentual (0–100%) via WebSocket. |
| 7         | —                                                                   | O worker gera o vídeo final em MP4 (H.264/AAC); o sistema associa-o ao projeto como novo recurso, registando a lista ordenada dos vídeos de origem (`sourceVideoIds`), transita a tarefa para `completed` (a reserva da quota torna-se definitiva, ADD v1.1, Q-ADD-03) e notifica o utilizador.                                                         |
| 8         | O utilizador consulta o projeto.                                    | O sistema apresenta o vídeo final na lista de recursos; os vídeos de origem permanecem inalterados.                                                                                                                                                                                                                     |

---

## 2.3 Fluxos Alternativos

| **Fluxo**                                               | **Descrição**                                                                                                                                                                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FA1 – Remoção de um vídeo da seleção**                | No passo 3, o utilizador remove um vídeo da linha temporal → O sistema atualiza a ordem e a duração total; se restar menos de dois vídeos, a confirmação fica bloqueada.                                                                                       |
| **FA2 – Repetição de um vídeo**                         | No passo 2, o utilizador adiciona o mesmo vídeo mais do que uma vez → O sistema aceita, tratando cada ocorrência como um clip distinto na linha temporal; cada ocorrência conta para o número de clips e para a duração total face aos limites do perfil (ADD v1.1, 4.8).                                                                                                      |
| **FA3 – Cancelamento antes do início do processamento** | No passo 5, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema marca a tarefa como `cancelled` (o worker descarta-a quando a consome, ADD v1.1, T-03), devolve a quota reservada (se Registado) e notifica o utilizador.                                   |
| **FA4 – Cancelamento durante o processamento**          | No passo 6, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA5 – Utilizador com perfil Premium**                 | No passo 4, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados (até 50 vídeos e 60 minutos de duração total).                                                                                      |
| **FA6 – Junção como passo de uma cadeia**               | A junção é configurada como passo de uma cadeia (UC-VID-014), com operações por clip antes da junção e operações sobre o resultado depois dela → A execução segue o UC-VID-014.                                                                                |

---

## 2.4 Exceções

| **Condição**                                       | **Comportamento do Sistema**                                                                                                                                                                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Menos de dois vídeos selecionados.**             | No passo 4, o sistema bloqueia a confirmação (`INSUFFICIENT_INPUTS`).                                                                                                                                                                        |
| **Número de vídeos acima do limite do perfil.**    | No passo 4, o sistema rejeita a operação (`TOO_MANY_INPUTS`), indicando o máximo do perfil (10 Registado, 50 Premium). A tarefa não é criada.                                                                                                |
| **Duração total acima do limite do perfil.**       | No passo 4, o sistema rejeita a operação (`LIMIT_EXCEEDED`), indicando a duração total e o limite (5 min Registado, 60 min Premium). A tarefa não é criada.                                                                                  |
| **Formato ou codec de algum vídeo não suportado.** | No passo 4, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`), identificando o vídeo. A tarefa não é criada e a quota não é afetada.                                                                                                       |
| **Quota diária esgotada (utilizador Registado).**  | No passo 4, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada.                                                                                                                     |
| **Falha de processamento durante a execução.**     | No passo 6, se o worker falhar em qualquer clip → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum resultado parcial é gravado no projeto. |

---

## 2.5 Pós-condições

| **Tipo**                | **Resultado**                                                                                                                                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Garantia de Sucesso** | Um único vídeo MP4 com todos os clips pela ordem definida é persistido e associado ao projeto, com a lista ordenada dos vídeos de origem. Os vídeos de origem permanecem inalterados. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima**     | Em caso de erro ou cancelamento, nenhum resultado (nem parcial) é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. Os vídeos de origem permanecem inalterados.                             |

---

## 2.6 Regras de Negócio e Restrições

| **ID**   | **Regra**                                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RN1**  | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação.                                                             |
| **RN2**  | Número de vídeos por junção: mínimo 2; máximo 10 (Registado) ou 50 (Premium) (DQ-015).                                                                                               |
| **RN3**  | A duração total do resultado não pode exceder o limite de duração do perfil (5 min Registado, 60 min Premium).                                                                       |
| **RN4**  | Os clips são concatenados pela ordem definida pelo utilizador, com corte seco entre eles (sem transições).                                                                           |
| **RN5**  | O resultado adota a resolução e a taxa de fotogramas do primeiro clip à saída da sua sub-cadeia, em dimensões de apresentação; os restantes são normalizados, com barras pretas (_letterbox_) quando a proporção difere (DQ-019; ADD v1.1, 4.8, Q-ADD-13). Se a resolução do primeiro clip tiver uma dimensão ímpar, corta-se 1 px para o par abaixo (ADD v1.1, Q-ADD-25). |
| **RN6**  | Quando pelo menos um clip tem áudio, os clips sem áudio recebem uma faixa de silêncio com a sua duração, para manter a sincronização (ADD v1.1, 4.8). |
| **RN7**  | O resultado é gerado em MP4 (H.264/AAC) (DQ-013); se nenhum clip tiver áudio, o resultado é um MP4 H.264 sem áudio (ADD v1.1, 4.8). |
| **RN8**  | Cada junção concluída consome exatamente 1 crédito da quota diária do utilizador Registado, independentemente do número de clips (DQ-014). Utilizadores Premium têm quota ilimitada. |
| **RN9**  | A junção é atómica: em caso de falha ou cancelamento, nenhum resultado é gravado e o crédito reservado é devolvido (DQ-018).                                                         |
| **RN10** | O resultado regista a lista ordenada dos identificadores dos vídeos de origem (`sourceVideoIds`).                                                                                    |
| **RN11** | Os vídeos de origem nunca são alterados nem eliminados.                                                                                                                              |
| **RN12** | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto.                                                                                              |
| **RN13** | A junção pode ser usada como passo de uma cadeia (UC-VID-014), no máximo uma vez por cadeia; não é elegível para o processamento em lote.                                            |

---

## 2.7 Assunções

| **ID** | **Assunção**                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------- |
| **A1** | O FFmpeg (filtros `scale`, `pad`, `fps`, `anullsrc` e `concat`) permite normalizar e concatenar clips heterogéneos. |
| **A2** | Os limites de número de vídeos são valores de MVP, configuráveis e a validar pela equipa.                           |

---

## 2.8 Questões em Aberto

| **ID** | **Questão**                                                                               | **Resolução / Decisão**                                                         |
| ------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Q1** | Devem ser suportadas transições entre clips (por exemplo _fade_)?                         | Não no MVP (Q-ERS-006). A junção usa corte seco.                                |
| **Q2** | Pode o utilizador escolher a resolução do resultado, em vez de herdar a do primeiro clip? | Não diretamente. Pode encadear um redimensionamento após a junção (UC-VID-014). |
