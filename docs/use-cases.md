# Exercício 1 — Casos de Uso
### Fase 1: Suporte a Vídeo no PictuRAS

---

## 0. Identificação

| **Campo** | **Valor** |
|-----------|-----------|
| **Grupo / Equipa** | Grupo 27 |
| **Autores** | Equipa PictuRAS-27 |
| **Data** | 2026-10-13 |
| **Versão do documento** | v1.1 |
| **Unidade Curricular** | Requisitos e Arquiteturas de Software — MEI, Universidade do Minho |

---

## 1. Funcionalidades de vídeo escolhidas

| **ID** | **Funcionalidade** | **Perfil(s) abrangido(s)** |
|--------|--------------------|---------------------------|
| UC-VID-001 | Recorte temporal de um vídeo (*trim*) | Registado, Premium |
| UC-VID-002 | Remoção do áudio de um vídeo | Registado, Premium |
| UC-VID-003 | Alteração da velocidade de reprodução de um vídeo | Registado, Premium |
| UC-VID-004 | Aplicação de marca de água a um vídeo | Registado, Premium |
| UC-VID-005 | Extração de fotogramas de um vídeo para o projeto | Registado, Premium |

**Justificação no contexto do MVP**

As cinco operações foram escolhidas por cobrirem o conjunto mínimo necessário para validar a extensão do PictuRAS do domínio da imagem para o domínio do vídeo: recorte, remoção de áudio e alteração de velocidade validam a manipulação temporal e estrutural de ficheiros de vídeo; a marca de água reutiliza uma capacidade já existente para imagens, extendendo-a ao processamento fotograma a fotograma; e a extração de fotogramas é a ponte entre os dois domínios, permitindo que o resultado de um vídeo passe a ser tratado como imagem normal no PictuRAS. Em conjunto, as cinco operações exercitam os mecanismos transversais mais críticos — carregamento e validação de vídeo, processamento assíncrono com progresso e cancelamento, quotas por perfil e armazenamento de resultados — sem exigir uma linha de edição temporal avançada. O acesso é restrito a utilizadores Registados e Premium porque os resultados são persistidos em projetos, o que exige autenticação; utilizadores Anónimos não têm projeto onde guardar resultados nem meios para controlar o abuso de recursos computacionais intensivos.

---

## 2. Casos de Uso

---

### UC-VID-001 — Recortar temporalmente um vídeo

#### 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-001 |
| **Nome** | Recortar temporalmente um vídeo |
| **Versão** | v1.1 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-13 |
| **Objetivo** | Permitir ao utilizador selecionar um intervalo temporal válido de um vídeo do seu projeto e obter um novo vídeo que preserve apenas esse intervalo, sem alterar o original. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende reduzir o vídeo às partes relevantes sem perder o ficheiro original e sem esgotar desnecessariamente a quota diária.<br>- **Sistema PictuRAS**: deve validar o intervalo, executar o recorte de forma assíncrona e produzir um resultado consistente.<br>- **Administrador / Equipa de produto**: pretende garantir que o processo respeita as políticas de acesso, quota e armazenamento. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo em formato MP4 (H.264 + AAC), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium), disponível para processamento.<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação de recorte temporal. |

#### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador abre o projeto e seleciona o vídeo pretendido. | O sistema apresenta o vídeo, a sua duração, o perfil ativo e as operações de vídeo disponíveis. |
| 2 | O utilizador seleciona a operação de recorte temporal. | O sistema apresenta a duração do vídeo e os controlos para definir o instante inicial e o instante final do intervalo a conservar. |
| 3 | O utilizador define o instante inicial e o instante final do intervalo. | O sistema valida em tempo real os valores introduzidos e apresenta a duração estimada do segmento resultante. |
| 4 | O utilizador confirma o intervalo. | O sistema verifica a validade do intervalo, os limites do perfil e a disponibilidade de quota (perfil Registado) e cria uma tarefa de processamento assíncrono, reservando 1 operação da quota diária. |
| 5 | — | O sistema informa o utilizador de que a tarefa está em fila (`queued`) e, quando o processamento for iniciado, passa ao estado `processing`. |
| 6 | — | O sistema conclui o recorte, produz o novo vídeo MP4 e associa-o ao projeto como novo recurso de vídeo, confirmando o consumo da operação. |
| 7 | O utilizador consulta o resultado. | O sistema apresenta o vídeo resultante disponível para visualização e download; o vídeo original permanece inalterado no projeto. |

#### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Alterar o intervalo antes da confirmação | No passo 3, o utilizador ajusta o instante inicial e/ou final → O sistema recalcula a duração estimada e mantém a validação ativa. O caso de uso continua a partir do passo 3. |
| FA2 – Cancelar antes do início do processamento | No passo 4, antes de a tarefa entrar em `processing`, o utilizador cancela → O sistema remove a tarefa, devolve a operação reservada à quota diária e mantém o vídeo original inalterado. |
| FA3 – Cancelar durante o processamento | No passo 5-6, enquanto a tarefa está em `processing`, o utilizador solicita cancelamento → O sistema interrompe o processamento assim que possível, descarta o ficheiro parcial, devolve a operação reservada e notifica o utilizador. |
| FA4 – Utilizador Premium | No passo 4, o sistema não verifica nem decrementa quota diária e aplica os limites alargados do perfil Premium (duração ≤ 60 min, tamanho ≤ 2 GB). |

#### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O instante inicial é maior ou igual ao instante final. | O sistema bloqueia a confirmação, informa o utilizador de que o intervalo é inválido e solicita a correção dos valores. A tarefa não é criada. |
| O instante inicial ou final está fora da duração do vídeo. | O sistema rejeita o intervalo, informa o utilizador dos limites válidos e não inicia o processamento. |
| O formato ou codec do vídeo não é suportado (não é MP4/H.264/AAC). | O sistema rejeita a operação com mensagem informativa específica sobre o formato esperado e não inicia o processamento. |
| O vídeo excede os limites de duração ou tamanho do perfil. | O sistema impede o início da operação, identifica o limite excedido e, se aplicável, sugere o perfil Premium. A quota não é consumida. |
| A quota diária do utilizador Registado está esgotada. | O sistema não inicia o processamento, informa o utilizador da quota atingida e quando renova, e sugere o perfil Premium. |
| O processamento falha antes de produzir um resultado válido. | O sistema marca a tarefa como `failed`, informa o utilizador, devolve a operação reservada à quota e mantém o vídeo original inalterado. Nenhum resultado parcial é publicado. |

#### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | Existe um novo recurso de vídeo MP4 no projeto correspondente ao intervalo temporal selecionado; o vídeo original permanece disponível e inalterado; é consumida 1 operação da quota diária do utilizador Registado. |
| Garantia Mínima | Se a operação falhar, for cancelada ou rejeitada, o vídeo original permanece inalterado, nenhum resultado parcial é publicado, e qualquer operação de quota reservada é devolvida. |

#### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A funcionalidade está disponível apenas para utilizadores Registados e Premium. Utilizadores Anónimos não têm acesso. |
| RN2 | O instante inicial do intervalo deve ser estritamente anterior ao instante final; ambos devem estar contidos na duração do vídeo. |
| RN3 | O vídeo de entrada deve estar no formato MP4 com codec de vídeo H.264 e codec de áudio AAC. Outros formatos são rejeitados. |
| RN4 | Limites de tamanho e duração: Registado — vídeo ≤ 5 min e ≤ 200 MB; Premium — vídeo ≤ 60 min e ≤ 2 GB. |
| RN5 | A operação consome 1 operação da quota diária do utilizador Registado (máximo 5 operações/dia). O perfil Premium não tem quota diária. |
| RN6 | Em caso de falha ou cancelamento, a operação reservada é devolvida à quota do utilizador. |
| RN7 | A operação é assíncrona. Estados da tarefa: `queued → processing → completed | failed | cancelled`. No máximo 1 tarefa de vídeo ativa por projeto. |
| RN8 | O resultado é um novo recurso de vídeo MP4 no projeto, com o mesmo codec de vídeo e áudio do original. O original não é alterado. |
| RN9 | O resultado é automaticamente associado ao projeto após o processamento bem-sucedido, seguindo as políticas de retenção e eliminação dos restantes recursos do projeto. |

#### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | O vídeo já se encontra carregado e acessível no projeto antes do início do caso de uso. |
| A2 | O sistema consegue determinar a duração e os metadados do vídeo antes de o utilizador confirmar o intervalo. |
| A3 | A tarefa de recorte é processada por um worker assíncrono via RabbitMQ, reutilizando o mecanismo existente com extensão para vídeo. |
| A4 | O processamento de trim/áudio/velocidade não reporta progresso numérico — comunica apenas os estados `queued` e `completed/failed/cancelled`. |

#### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Qual a precisão temporal exigida para o recorte (ao frame, ao segundo, ao milissegundo)? |
| Q2 | A notificação de conclusão deve ser feita apenas via WebSocket ou também por email/push? |

---

### UC-VID-002 — Remover o áudio de um vídeo

#### 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-002 |
| **Nome** | Remover o áudio de um vídeo |
| **Versão** | v1.1 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-13 |
| **Objetivo** | Permitir ao utilizador obter uma versão do vídeo sem a faixa de áudio, preservando a componente visual na íntegra e mantendo o vídeo original inalterado. |
| **Âmbito** | Módulo de processamento de vídeo do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende obter um vídeo silencioso sem perder o original e sem esgotar desnecessariamente a quota.<br>- **Sistema PictuRAS**: deve detetar streams de áudio, executar a remoção de forma assíncrona e produzir um resultado consistente.<br>- **Administrador / Equipa de produto**: pretende controlar os custos de processamento e garantir a compatibilidade do resultado. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo MP4 (H.264 + AAC) com faixa de áudio presente, com duração e tamanho dentro dos limites do perfil.<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e opta por remover a faixa sonora. |

#### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador abre o projeto e seleciona o vídeo pretendido. | O sistema valida o ficheiro, confirma a presença de faixa de áudio e apresenta a operação disponível. |
| 2 | O utilizador seleciona a operação de remoção de áudio e confirma. | O sistema verifica os limites do perfil, a disponibilidade de quota (Registado) e cria uma tarefa assíncrona, reservando 1 operação da quota diária. |
| 3 | — | O sistema informa que a tarefa está em `queued` e avança para `processing`. |
| 4 | — | O sistema produz uma nova versão do vídeo sem streams de áudio, mantendo a componente visual inalterada. |
| 5 | — | O sistema associa o resultado ao projeto como novo recurso de vídeo MP4, confirma o consumo da operação e notifica o utilizador. |
| 6 | O utilizador consulta o resultado. | O sistema disponibiliza o vídeo resultante para visualização e download; o vídeo original permanece inalterado. |

#### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Cancelar antes do início do processamento | No passo 2, antes de a tarefa entrar em `processing`, o utilizador cancela → O sistema remove a tarefa, devolve a operação à quota e mantém o original inalterado. |
| FA2 – Cancelar durante o processamento | Nos passos 3-4, enquanto a tarefa está em `processing`, o utilizador solicita cancelamento → O sistema interrompe o processamento, descarta o ficheiro parcial, devolve a operação e notifica o utilizador. |
| FA3 – Utilizador Premium | No passo 2, o sistema não verifica nem decrementa quota diária e aplica os limites alargados do perfil Premium. |

#### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O formato ou codec do vídeo não é suportado (não é MP4/H.264/AAC). | O sistema rejeita a operação com mensagem informativa sobre o formato esperado e não inicia o processamento. |
| O vídeo não contém faixa de áudio. | O sistema informa o utilizador de que não existe áudio para remover e não inicia o processamento. A quota não é consumida. |
| O vídeo excede os limites de duração ou tamanho do perfil. | O sistema impede o início da operação, identifica o limite excedido e sugere o perfil Premium se aplicável. A quota não é consumida. |
| A quota diária do utilizador Registado está esgotada. | O sistema não inicia o processamento, informa o utilizador da quota atingida e quando renova, e sugere Premium. |
| O processamento falha antes de produzir um resultado válido. | O sistema marca a tarefa como `failed`, informa o utilizador, devolve a operação à quota e mantém o vídeo original inalterado. Nenhum resultado parcial é publicado. |

#### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | Existe um novo recurso de vídeo MP4 no projeto sem faixa de áudio, com a componente visual inalterada; o vídeo original permanece disponível; é consumida 1 operação da quota do utilizador Registado. |
| Garantia Mínima | Se a operação falhar, for cancelada ou rejeitada, o vídeo original permanece inalterado, nenhum resultado parcial é publicado e qualquer operação de quota reservada é devolvida. |

#### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A funcionalidade está disponível apenas para utilizadores Registados e Premium. Utilizadores Anónimos não têm acesso. |
| RN2 | A operação só pode ser aplicada a vídeos que possuam pelo menos uma stream de áudio. |
| RN3 | O vídeo de entrada deve estar no formato MP4 com codec H.264 (vídeo) e AAC (áudio). Outros formatos são rejeitados com mensagem informativa. |
| RN4 | Limites de tamanho e duração: Registado — vídeo ≤ 5 min e ≤ 200 MB; Premium — vídeo ≤ 60 min e ≤ 2 GB. |
| RN5 | A operação consome 1 operação da quota diária do utilizador Registado (máximo 5/dia). O perfil Premium não tem quota diária. |
| RN6 | Em caso de falha ou cancelamento, a operação reservada é devolvida à quota. |
| RN7 | A operação é assíncrona. Estados: `queued → processing → completed | failed | cancelled`. No máximo 1 tarefa de vídeo ativa por projeto. |
| RN8 | O resultado é um novo recurso de vídeo MP4 no projeto. A componente visual (stream H.264) é preservada integralmente. O original não é alterado. |
| RN9 | O resultado é automaticamente associado ao projeto após o processamento bem-sucedido. |

#### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | O sistema consegue identificar e separar streams de áudio e vídeo no ficheiro MP4 de entrada. |
| A2 | A operação produz um novo ficheiro MP4 sem streams de áudio; o ficheiro original não é modificado. |
| A3 | O processamento é assíncrono; não reporta progresso numérico, apenas estados `queued` e `completed/failed/cancelled`. |

#### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Quando o vídeo não contém áudio, o sistema deve rejeitar a operação com erro ou devolver uma mensagem de "sem efeito" sem consumir quota? |
| Q2 | A notificação de conclusão deve ser feita apenas via WebSocket ou também por email/push? |

---

### UC-VID-003 — Alterar a velocidade de reprodução de um vídeo

#### 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-003 |
| **Nome** | Alterar a velocidade de reprodução de um vídeo |
| **Versão** | v1.1 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-13 |
| **Objetivo** | Permitir ao utilizador definir um fator de velocidade para um vídeo e obter uma nova versão cuja duração e ritmo de reprodução sejam ajustados de acordo com esse fator, sem alterar o original. |
| **Âmbito** | Módulo de processamento de vídeo do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende acelerar ou desacelerar o vídeo sem perder o original e sem desperdiçar quota por valores inválidos.<br>- **Sistema PictuRAS**: deve validar o fator, calcular a duração estimada e produzir um resultado consistente de forma assíncrona.<br>- **Administrador / Equipa de produto**: pretende garantir que a operação está alinhada com as políticas de acesso e armazenamento. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo MP4 (H.264 + AAC) com duração e tamanho dentro dos limites do perfil.<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação de alteração da velocidade de reprodução. |

#### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador abre o projeto e seleciona o vídeo pretendido. | O sistema apresenta a duração atual do vídeo e os controlos para definir o fator de velocidade. |
| 2 | O utilizador indica o fator de velocidade. | O sistema valida em tempo real se o valor é positivo e respeita os limites suportados, e apresenta a duração estimada do resultado. |
| 3 | O utilizador confirma a operação. | O sistema verifica a validade do vídeo e do fator, os limites do perfil, a disponibilidade de quota (Registado) e cria uma tarefa assíncrona, reservando 1 operação. |
| 4 | — | O sistema informa que a tarefa está em `queued` e avança para `processing`. |
| 5 | — | O sistema produz um novo vídeo com a velocidade confirmada; a duração resultante é inversamente proporcional ao fator. |
| 6 | — | O sistema associa o resultado ao projeto como novo recurso de vídeo MP4, confirma o consumo da operação e notifica o utilizador. |
| 7 | O utilizador consulta o resultado. | O sistema disponibiliza o vídeo resultante para visualização e download; o vídeo original permanece inalterado. |

#### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Alterar o fator antes da confirmação | No passo 2, o utilizador escolhe outro valor → O sistema recalcula a duração estimada e mantém a validação ativa. O caso continua no passo 2. |
| FA2 – Cancelar antes do início do processamento | No passo 3, antes de a tarefa entrar em `processing`, o utilizador cancela → O sistema remove a tarefa, devolve a operação à quota e mantém o original inalterado. |
| FA3 – Cancelar durante o processamento | Nos passos 4-5, enquanto a tarefa está em `processing`, o utilizador solicita cancelamento → O sistema interrompe o processamento, descarta o ficheiro parcial, devolve a operação e notifica o utilizador. |
| FA4 – Utilizador Premium | No passo 3, o sistema não verifica nem decrementa quota diária e aplica os limites alargados do perfil Premium. |

#### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O fator de velocidade é nulo, negativo ou zero. | O sistema bloqueia a confirmação, informa o utilizador da restrição e não inicia o processamento. |
| O fator de velocidade está fora do intervalo suportado pelo sistema. | O sistema rejeita o valor, apresenta o intervalo válido e solicita nova inserção. A tarefa não é criada. |
| O formato ou codec do vídeo não é suportado (não é MP4/H.264/AAC). | O sistema rejeita a operação com mensagem informativa sobre o formato esperado e não inicia o processamento. |
| O vídeo excede os limites de duração ou tamanho do perfil. | O sistema impede o início da operação, identifica o limite excedido e sugere Premium se aplicável. |
| A quota diária do utilizador Registado está esgotada. | O sistema não inicia o processamento, informa o utilizador e sugere Premium. |
| O processamento falha antes de produzir um resultado válido. | O sistema marca a tarefa como `failed`, informa o utilizador, devolve a operação à quota e mantém o original inalterado. |

#### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | Existe um novo recurso de vídeo MP4 no projeto com a duração ajustada pelo fator de velocidade confirmado; o vídeo original permanece disponível e inalterado; é consumida 1 operação da quota do utilizador Registado. |
| Garantia Mínima | Se a operação falhar, for cancelada ou rejeitada, o vídeo original permanece inalterado, nenhum resultado parcial é publicado e qualquer operação reservada é devolvida. |

#### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A funcionalidade está disponível apenas para utilizadores Registados e Premium. Utilizadores Anónimos não têm acesso. |
| RN2 | O fator de velocidade deve ser um valor numérico positivo (> 0) dentro do intervalo suportado pelo sistema. |
| RN3 | Um fator > 1 acelera o vídeo e reduz a sua duração; um fator entre 0 e 1 desacelera o vídeo e aumenta a sua duração. |
| RN4 | O vídeo de entrada deve estar no formato MP4 com codec H.264 (vídeo) e AAC (áudio). Outros formatos são rejeitados. |
| RN5 | Limites de tamanho e duração: Registado — vídeo ≤ 5 min e ≤ 200 MB; Premium — vídeo ≤ 60 min e ≤ 2 GB. |
| RN6 | A operação consome 1 operação da quota diária do utilizador Registado (máximo 5/dia). O perfil Premium não tem quota diária. |
| RN7 | Em caso de falha ou cancelamento, a operação reservada é devolvida à quota. |
| RN8 | A operação é assíncrona. Estados: `queued → processing → completed | failed | cancelled`. No máximo 1 tarefa de vídeo ativa por projeto. |
| RN9 | O resultado é um novo recurso de vídeo MP4 no projeto. O original não é alterado. |

#### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | O fator de velocidade é interpretado como multiplicador da velocidade de reprodução: fator 2× produz um vídeo com metade da duração original. |
| A2 | O sistema consegue calcular a duração estimada do resultado a partir da duração do vídeo original e do fator informado. |
| A3 | O comportamento do áudio ao alterar a velocidade (ajuste ou remoção) é resolvido pelo worker de processamento de acordo com a implementação técnica; não é exposto como parâmetro do utilizador no MVP. |
| A4 | O processamento não reporta progresso numérico — comunica apenas estados `queued` e `completed/failed/cancelled`. |

#### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Qual é o intervalo válido de fatores de velocidade para o MVP (e.g., 0,25× a 4×)? |
| Q2 | A operação deve permitir valores livres ou apenas valores predefinidos (e.g., 0,5×, 1×, 1,5×, 2×)? |

---

### UC-VID-004 — Aplicar marca de água a um vídeo

#### 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-004 |
| **Nome** | Aplicar marca de água a um vídeo |
| **Versão** | v1.1 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-13 |
| **Objetivo** | Permitir ao utilizador autenticado adicionar uma marca de água textual ou gráfica ao vídeo, com posição, tamanho e opacidade fixos ao longo de toda a duração, obtendo um novo ficheiro de vídeo com a marca aplicada e mantendo o original inalterado. |
| **Âmbito** | Módulo de processamento de vídeo e resultados do projeto PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e permissão de edição no projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende identificar e proteger a sua produção audiovisual sem perder o original.<br>- **Sistema PictuRAS**: deve aplicar a marca de forma consistente fotograma a fotograma e guardar o resultado como novo recurso.<br>- **Administrador / Equipa de produto**: pretende controlar a carga de processamento, a persistência e os direitos de acesso sobre o resultado. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo MP4 (H.264 + AAC) com duração e tamanho dentro dos limites do perfil.<br>- O material de marca de água (texto ou imagem) é válido e acessível.<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a opção de aplicar marca de água. |

#### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona o vídeo e a operação de marca de água. | O sistema valida os metadados do vídeo e apresenta a interface de configuração da marca de água. |
| 2 | O utilizador escolhe o tipo de marca: texto ou imagem. | O sistema apresenta os campos específicos para a opção escolhida. |
| 3 | O utilizador introduz o conteúdo da marca (texto ou ficheiro de imagem). | O sistema valida o conteúdo — rejeita texto vazio, imagem inválida ou formato de imagem não suportado. |
| 4 | O utilizador define posição, tamanho e opacidade da marca e confirma. | O sistema valida os valores: posição dentro dos limites visíveis do vídeo, tamanho e opacidade nos intervalos permitidos; apresenta uma pré-visualização estática se suportada. |
| 5 | O utilizador confirma a configuração e solicita o processamento. | O sistema verifica os limites do perfil, a disponibilidade de quota (Registado) e cria a tarefa assíncrona, reservando 1 operação. |
| 6 | — | O sistema processa o vídeo fotograma a fotograma, aplicando a marca com a configuração definida de forma consistente; a posição, tamanho e opacidade permanecem fixos ao longo de toda a duração. Comunica o progresso ao utilizador (índice de fotograma / total de fotogramas). |
| 7 | — | O sistema recompõe o vídeo MP4 e associa-o ao projeto como novo recurso, confirma o consumo da operação e notifica o utilizador. |
| 8 | O utilizador consulta o resultado. | O sistema disponibiliza o vídeo processado para visualização e download; o vídeo original permanece inalterado. |

#### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Marca em imagem | No passo 2, o utilizador escolhe imagem → O sistema permite selecionar uma imagem da biblioteca do projeto ou carregar uma nova imagem; após validação, o fluxo continua no passo 4. |
| FA2 – Alterar configuração após pré-visualização | No passo 4, o utilizador ajusta posição, tamanho ou opacidade → O sistema atualiza a pré-visualização; o utilizador confirma e o fluxo continua no passo 5. |
| FA3 – Cancelar antes do início do processamento | No passo 5, antes de a tarefa entrar em `processing`, o utilizador cancela → O sistema remove a tarefa, devolve a operação à quota e mantém o original inalterado. |
| FA4 – Cancelar durante o processamento | No passo 6, enquanto a tarefa está em `processing`, o utilizador solicita cancelamento → O sistema interrompe o processamento assim que possível, descarta o vídeo parcial, devolve a operação e notifica o utilizador. |
| FA5 – Utilizador Premium | No passo 5, o sistema não verifica nem decrementa quota diária e aplica os limites alargados do perfil Premium. |

#### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O formato ou codec do vídeo não é suportado (não é MP4/H.264/AAC). | O sistema rejeita a operação com mensagem informativa sobre o formato esperado e não inicia o processamento. |
| O conteúdo da marca é inválido ou o ficheiro de imagem está corrompido ou num formato não suportado. | O sistema apresenta uma mensagem de erro e solicita um novo conteúdo. A tarefa não é criada. |
| A posição da marca excede os limites visíveis do vídeo. | O sistema rejeita a configuração e solicita a correção dos valores. A tarefa não é criada. |
| O vídeo excede os limites de duração ou tamanho do perfil. | O sistema impede o início da operação, identifica o limite excedido e sugere Premium se aplicável. |
| A quota diária do utilizador Registado está esgotada. | O sistema não inicia o processamento, informa o utilizador e sugere Premium. |
| O processamento falha a meio da execução. | O sistema marca a tarefa como `failed`, informa o utilizador, devolve a operação à quota e mantém o vídeo original inalterado. Nenhum resultado parcial é publicado. |

#### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | Existe um novo recurso de vídeo MP4 no projeto com a marca de água configurada aplicada de forma consistente em todos os fotogramas; o vídeo original permanece disponível e inalterado; é consumida 1 operação da quota do utilizador Registado. |
| Garantia Mínima | Em caso de erro ou cancelamento, o vídeo original permanece inalterado, nenhum resultado parcial é publicado e qualquer operação reservada é devolvida. |

#### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A funcionalidade está disponível apenas para utilizadores Registados e Premium autenticados. Utilizadores Anónimos não têm acesso. |
| RN2 | A marca de água deve ser aplicada de forma consistente ao longo de todos os fotogramas do vídeo. A posição, o tamanho e a opacidade são fixos durante toda a duração (MVP; posição variável não é suportada). |
| RN3 | A posição da marca deve estar dentro dos limites visíveis do vídeo. O tamanho e a opacidade devem estar dentro dos valores permitidos pelo sistema. |
| RN4 | O vídeo de entrada deve estar no formato MP4 com codec H.264 (vídeo) e AAC (áudio). Outros formatos são rejeitados. |
| RN5 | Limites de tamanho e duração: Registado — vídeo ≤ 5 min e ≤ 200 MB; Premium — vídeo ≤ 60 min e ≤ 2 GB. |
| RN6 | A operação consome 1 operação da quota diária do utilizador Registado (máximo 5/dia). O perfil Premium não tem quota diária. |
| RN7 | Em caso de falha ou cancelamento, a operação reservada é devolvida à quota. |
| RN8 | A operação é assíncrona. Estados: `queued → processing → completed | failed | cancelled`. Progresso numérico reportado como índice de fotograma / total de fotogramas. No máximo 1 tarefa de vídeo ativa por projeto. |
| RN9 | O resultado é guardado como novo recurso de vídeo MP4 no projeto. O original não é alterado. |

#### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | A funcionalidade reutiliza, em parte, a lógica de marca de água para imagens, aplicando-a fotograma a fotograma durante o processamento do vídeo. |
| A2 | O resultado final é recomposto como novo ficheiro MP4 após a aplicação da marca a todos os fotogramas. |
| A3 | O sistema dispõe de armazenamento suficiente para manter o vídeo original e o vídeo processado em simultâneo. |
| A4 | O progresso numérico é reportado via WebSocket como "fotogramas processados / total de fotogramas". |

#### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Quais os formatos de imagem aceites para a marca de água gráfica (e.g., PNG, JPEG, SVG)? |
| Q2 | A imagem de marca de água pode ser carregada durante a configuração ou apenas selecionada da biblioteca do projeto? |

---

### UC-VID-005 — Extrair fotogramas de um vídeo para o projeto

#### 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-005 |
| **Nome** | Extrair fotogramas de um vídeo para o projeto |
| **Versão** | v1.1 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-13 |
| **Objetivo** | Permitir ao utilizador extrair uma sequência de fotogramas de um vídeo, a intervalos regulares num intervalo temporal semiaberto [início, fim[, e adicioná-los ao projeto como imagens utilizáveis pelo PictuRAS, preservando o original e mantendo o processamento acompanhado e controlado. |
| **Âmbito** | Módulo de projetos, processamento assíncrono e gestão de resultados do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e permissão de edição no projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado**: obter imagens do vídeo para editar, sem perder operações da quota diária por falhas ou cancelamentos.<br>- **Utilizador Premium**: extrações maiores e sem limite diário.<br>- **Projeto / Sistema**: reutilizar as ferramentas de imagem existentes sobre os fotogramas extraídos sem alterações a esses mecanismos.<br>- **Equipa DevOps / Desenvolvimento**: controlar carga de processamento e de armazenamento.<br>- **Administrador / RGPD**: garantir privacidade dos vídeos e das imagens extraídas. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo MP4 (H.264 + AAC) com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a opção de extração de fotogramas. |

#### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador abre o projeto e seleciona o vídeo pretendido. | O sistema apresenta o vídeo (duração), as operações disponíveis, o saldo de quota diária restante (Registado) e o limite de fotogramas do perfil. |
| 2 | O utilizador escolhe **Extrair fotogramas**. | O sistema apresenta o formulário com valores por omissão: intervalo = vídeo completo [0s, duração[, passo N = 5 s, formato = JPEG. |
| 3 | O utilizador define o intervalo [início, fim[, o passo N (inteiro ≥ 1 s) e o formato de saída (JPEG ou PNG). | O sistema valida os parâmetros em tempo real e apresenta o número estimado de fotogramas: os instantes gerados são início, início+N, início+2N, … enquanto o instante for < fim. Exemplo: [0s, 60s[ com N=5s → instantes 0,5,10,…,55 → 12 fotogramas. |
| 4 | O utilizador confirma clicando **Extrair**. | O sistema verifica os limites do perfil, a disponibilidade de quota (Registado) e cria uma tarefa de extração assíncrona, reservando 1 operação da quota diária. |
| 5 | — | O sistema informa que a tarefa está em `queued`, avança para `processing` e disponibiliza a opção de cancelamento. Comunica o progresso: fotogramas extraídos / total. |
| 6 | — | O sistema extrai, para cada instante, o fotograma do vídeo mais próximo desse instante. |
| 7 | — | Ao concluir, o sistema adiciona todos os fotogramas ao projeto como imagens normais (JPEG ou PNG, resolução original do vídeo), confirma o consumo da operação e notifica o utilizador. |
| 8 | O utilizador consulta os fotogramas na galeria do projeto. | O sistema apresenta as imagens extraídas, cada uma com o instante de origem, disponíveis para qualquer ferramenta de imagem, processamento em lote e download existentes. |

#### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Pré-visualizar amostra | No passo 3, o utilizador solicita pré-visualização → O sistema mostra uma amostra representativa dos fotogramas estimados sem criar tarefa, sem alterar o projeto e sem consumir quota → O utilizador volta ao passo 3. |
| FA2 – Cancelar extração durante o processamento | Nos passos 5-6, o utilizador clica **Cancelar** → O sistema interrompe o processamento assim que possível, descarta todos os fotogramas já gerados (operação tudo-ou-nada), devolve a operação à quota e mantém o projeto no estado anterior. |
| FA3 – Utilizador abandona durante o processamento | Nos passos 5-6, o utilizador fecha o separador ou sai do projeto → A extração continua em segundo plano; ao regressar, o utilizador vê o estado atual da tarefa ou o resultado final. |
| FA4 – Utilizador Premium | No passo 4, o sistema não verifica nem decrementa quota diária e aplica os limites alargados do perfil Premium (≤ 60 min, ≤ 2 GB, ≤ 500 fotogramas). |
| FA5 – Aceitar ajuste sugerido | No passo 3, se o número de fotogramas estimado exceder o limite do perfil, o sistema propõe o menor passo N que respeita o limite → Se o utilizador aceitar, o formulário é atualizado e o fluxo continua no passo 3. |

#### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| Parâmetros inválidos: início ≥ fim, fim superior à duração do vídeo, N < 1 s ou N não inteiro. | O sistema bloqueia **Extrair**, identifica o parâmetro em causa e indica como corrigir. A tarefa não é criada. |
| O número de fotogramas estimados excede o limite do perfil (50 para Registado, 500 para Premium). | O sistema bloqueia **Extrair**, indica o limite e sugere aumentar N, reduzir o intervalo ou passar a Premium. |
| O formato ou codec do vídeo não é suportado (não é MP4/H.264/AAC). | O sistema rejeita a operação com mensagem informativa sobre o formato esperado e não inicia o processamento. |
| O vídeo excede os limites de duração ou tamanho do perfil. | O sistema bloqueia a extração, indica o limite excedido e sugere Premium. |
| A quota diária do utilizador Registado está esgotada. | O sistema não inicia a extração, informa quando a quota renova e sugere Premium. |
| O ficheiro de vídeo não pode ser descodificado (codec não suportado ou ficheiro corrompido). | O sistema termina a tarefa com erro, devolve a operação reservada à quota e não adiciona imagens ao projeto. |
| Falha ou tempo máximo excedido a meio do processamento. | O sistema aborta a tarefa, descarta todos os fotogramas parciais (tudo-ou-nada), devolve a operação e informa o utilizador. |
| Armazenamento insuficiente para os fotogramas estimados. | O sistema impede a operação, informa o utilizador antes de criar a tarefa e devolve a operação se já estava reservada. |

#### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | O projeto contém exatamente o número de novas imagens correspondente aos instantes gerados pela fórmula início + k×N (k=0,1,… enquanto o instante < fim); cada imagem está no formato escolhido (JPEG/PNG) com a resolução original do vídeo e o instante de origem associado. O vídeo original permanece inalterado; é consumida 1 operação da quota diária apenas no perfil Registado. As imagens ficam disponíveis para ferramentas de imagem, processamento em lote e download existentes. |
| Garantia Mínima | O projeto fica exatamente como estava antes do pedido: nenhuma imagem parcial adicionada, vídeo original inalterado, operação reservada devolvida e mensagem de erro apresentada ao utilizador. |

#### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A funcionalidade está disponível apenas para utilizadores Registados e Premium. Utilizadores Anónimos não têm acesso. |
| RN2 | Limites por perfil: Registado — vídeo ≤ 5 min e ≤ 200 MB, máximo 50 fotogramas por extração; Premium — vídeo ≤ 60 min e ≤ 2 GB, máximo 500 fotogramas por extração. |
| RN3 | Formato de entrada: MP4 (codec de vídeo H.264 e codec de áudio AAC). Outros formatos são rejeitados. Formatos de saída dos fotogramas: JPEG ou PNG (escolha do utilizador, padrão JPEG), mantendo a resolução original do vídeo. |
| RN4 | O intervalo de extração é semiaberto [início, fim[. Os instantes são início + k×N (k = 0, 1, …) enquanto o instante for < fim. O passo N é um inteiro ≥ 1 s. Exemplo: [0s, 60s[ com N=5s → instantes 0,5,10,…,55 → 12 fotogramas. |
| RN5 | Cada extração consome 1 operação da quota diária do utilizador Registado (máximo 5 operações/dia), independentemente do número de fotogramas. O perfil Premium não tem quota diária. |
| RN6 | Em caso de falha ou cancelamento, a operação reservada é devolvida à quota. |
| RN7 | A extração é atómica (tudo-ou-nada): ou todos os fotogramas previstos são adicionados ao projeto, ou nenhum é adicionado. |
| RN8 | O vídeo original nunca é alterado. |
| RN9 | A extração é assíncrona. Estados: `queued → processing → completed | failed | cancelled`. Progresso reportado como fotogramas extraídos / total de fotogramas. No máximo 1 tarefa de vídeo ativa por projeto. |
| RN10 | A pré-visualização de amostra (FA1) não cria tarefa, não altera o projeto e não consome quota. |
| RN11 | Os fotogramas extraídos são recursos de imagem normais do projeto e seguem as mesmas políticas de proteção, armazenamento e eliminação das restantes imagens do PictuRAS. |

#### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | O vídeo está integralmente armazenado e acessível ao serviço no momento do pedido. |
| A2 | A solução reutiliza o mecanismo assíncrono existente (RabbitMQ + workers), acrescentando o processamento específico de vídeo. |
| A3 | Os fotogramas entram no projeto como imagens normais, sem tipo especial, pelo que a integração com ferramentas, processamento em lote e download não exige alterações a esses mecanismos. |
| A4 | O fotograma selecionado para cada instante é o fotograma disponível no vídeo mais próximo desse instante. |
| A5 | A extração continua em segundo plano se o utilizador sair do ecrã ou fechar o browser. |
| A6 | Cada extração opera sobre um único vídeo; lote de vídeos está fora do âmbito do MVP. |

#### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Os fotogramas extraídos contam para algum limite de imagens por projeto ou de armazenamento por perfil? |
| Q2 | O utilizador deve poder indicar diretamente o número máximo de fotogramas pretendidos, em alternativa ao passo regular? |

---

## 3. Utilização de Agentes de IA

| **Ferramenta / Skill** | **Tarefa apoiada** | **Validação realizada pela equipa** |
|------------------------|--------------------|--------------------------------------|
| ChatGPT / Copilot | Apoio na revisão da linguagem e na normalização dos casos de uso, com foco na consistência terminológica, na redução de ambiguidades e na deteção de lacunas entre fluxos, exceções e regras de negócio. | A equipa verificou que todas as descrições respeitam o modelo de requisitos do PictuRAS, mantêm a origem documental, incorporam as decisões D-VID-001 a D-VID-010 e evitam decisões de implementação não aprovadas. |
| Antigravity (AI-DLC Inception Agent) | Consolidação e produção das versões finais dos documentos `use-cases.md` e `requirements.md` a partir dos artefactos de trabalho do memory-bank, aplicando as decisões aprovadas e removendo duplicados e placeholders. | A equipa verificou a rastreabilidade entre casos de uso, decisões e requisitos e confirmou que os valores quantitativos correspondem às decisões D-VID-001 a D-VID-010. |

---

## ✅ Lista de Verificação

- [x] Secção 0 preenchida com identificação correta do grupo e versão v1.1.
- [x] Secção 1 com tabela das cinco funcionalidades, perfis e justificação no contexto do MVP.
- [x] Texto de ajuda e placeholders `{…}` removidos.
- [x] Template vazio da secção 2 removido.
- [x] Colisão de ID corrigida: extração de fotogramas é UC-VID-005 (era UC-VID-004 no merge.md).
- [x] Cinco casos de uso completos: UC-VID-001, UC-VID-002, UC-VID-003, UC-VID-004, UC-VID-005.
- [x] Cada caso de uso com fluxo principal, ≥ 2 fluxos alternativos e ≥ 2 exceções específicas de vídeo.
- [x] Pós-condições com garantia de sucesso e garantia mínima em todos os casos.
- [x] Regras de negócio e restrições com valores decididos (D-VID-001 a D-VID-010).
- [x] Atores restringidos a Registado e Premium (Anónimo excluído — D-VID-001).
- [x] Formato MP4/H.264/AAC aplicado em todos os casos (D-VID-002).
- [x] Limites numéricos aplicados: Registado ≤ 5 min / ≤ 200 MB / ≤ 50 frames; Premium ≤ 60 min / ≤ 2 GB / ≤ 500 frames (D-VID-005).
- [x] Quota: 1 operação/tarefa; Registado 5 ops/dia; Premium sem quota; devolução em falha/cancelamento (D-VID-001).
- [x] Semântica do intervalo semiaberto [início, fim[ confirmada (D-VID-006).
- [x] Posição da marca de água fixa no MVP (D-VID-009).
- [x] Processamento assíncrono com estados `queued → processing → completed | failed | cancelled` (D-VID-004).
- [x] Quota imputada ao utilizador que executa, não ao dono do projeto (D-VID-008).
- [x] Questões em aberto reduzidas ao mínimo genuíno — todas as decisões D-VID-001 a D-VID-010 foram incorporadas.
- [x] Utilização de agentes de IA documentada.
- [x] Secção 4 ausente (conteúdo publicado no documento separado `requirements.md`).

