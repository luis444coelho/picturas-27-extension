# 📝 Exercício 1 — Casos de uso refinados para suporte a vídeo

> **Documento histórico da proposta inicial.** Os casos canónicos atuais são `docs/use-cases/UC-VID-000.md` a `UC-VID-015.md`; usar esses ficheiros e a ERS v2.3 para implementação.
### Casos de Uso · Fase 1: Suporte a Vídeo no PictuRAS

## 0. Identificação

| **Campo** | **Valor** |
|-----------|-----------|
| **Grupo / Equipa** | PictuRAS — extensão de processamento de vídeo |
| **Autores** | Equipa de requisitos e arquitetura — revisão de Inception |
| **Data** | 2026-10-12 |
| **Versão do documento** | v1.0 |
| **Unidade Curricular** | Requisitos e Arquiteturas de Software — MEI, Universidade do Minho |

---

## 1. Funcionalidade de vídeo escolhida

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Suporte inicial a operações de vídeo no PictuRAS: recorte temporal, remoção de áudio, alteração de velocidade, marca de água e extração de fotogramas |
| **Perfil(s) de utilizador abrangido(s)** | Decisão pendente; a proposta base é que as operações que geram resultados persistidos sejam executadas por utilizadores autenticados com acesso ao projeto, enquanto o acesso anónimo e as políticas de quota continuam por validar. |

**Justificação no contexto do MVP**

As cinco operações de vídeo cobrem o conjunto mínimo necessário para validar a extensão do PictuRAS do domínio da imagem para o domínio do vídeo. Em conjunto, permitem testar o carregamento, a validação, o processamento assíncrono, a associação aos projetos, a política de acesso e o armazenamento de resultados, sem ainda exigir uma linha de edição temporal avançada. Este conjunto cria valor imediato para o utilizador, porque converte o vídeo num recurso processável e reutilizável dentro do ecossistema já existente do PictuRAS.

---

## 2. Caso de Uso

### 2.1 UC-VID-001

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-001 |
| **Nome** | Recortar temporalmente um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa de requisitos |
| **Data** | 2026-10-12 |
| **Objetivo** | Permitir ao utilizador selecionar um intervalo temporal válido de um vídeo e obter uma nova versão do vídeo que preserve apenas esse intervalo, sem alterar o original. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador com acesso ao projeto ou biblioteca associada ao vídeo; perfil a confirmar conforme a política de autenticação e quota. |
| **Stakeholders e Interesses** | - **Utilizador**: pretende reduzir o vídeo às partes relevantes sem perder o ficheiro original.<br>- **Sistema PictuRAS**: deve validar o intervalo e produzir um resultado consistente.<br>- **Administrador / equipa de produto**: pretende garantir que o processo respeita as políticas de acesso e armazenamento. |
| **Pré-condições** | - O vídeo está disponível no projeto ou na biblioteca do utilizador.<br>- O utilizador tem autorização para aceder ao vídeo.<br>- O sistema reconhece o ficheiro como um vídeo elegível para processamento. |
| **Trigger** | O utilizador seleciona um vídeo e escolhe a operação de recorte temporal. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona um vídeo disponível para edição. | O sistema apresenta o recurso e disponibiliza a operação de recorte temporal. |
| 2 | O utilizador indica o início e o fim do intervalo a conservar. | O sistema valida se os instantes pertencem à duração do vídeo e se o intervalo é válido. |
| 3 | O utilizador confirma a operação. | O sistema valida novamente os parâmetros, verifica as políticas aplicáveis e inicia o processamento. |
| 4 | — | O sistema cria uma nova versão do vídeo correspondente ao intervalo validado. |
| 5 | — | O sistema mantém o vídeo original inalterado e disponibiliza o resultado final para visualização e/ou download. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Alterar o intervalo antes da confirmação | O utilizador altera o início e/ou o fim do intervalo -> O sistema recalcula a seleção e mantém a validação ativa até à confirmação. |
| FA2 – Cancelar antes do início do processamento | O utilizador cancela a operação -> O sistema abandona a tarefa sem alterar o vídeo original. |
| FA3 – Repetir o recorte sobre o resultado | O utilizador reutiliza o resultado como entrada de nova operação -> O sistema trata o novo ficheiro como um recurso separado do original. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O intervalo é inválido, por exemplo porque o início é maior ou igual ao fim. | O sistema rejeita a operação, informa o utilizador do problema e solicita a correção dos valores. |
| O intervalo está fora dos limites do vídeo. | O sistema bloqueia a operação e exige que o utilizador escolha um intervalo válido. |
| O ficheiro não é um vídeo suportado. | O sistema informa o utilizador que o vídeo não é compatível com a funcionalidade e não inicia o processamento. |
| O processamento falha durante a execução. | O sistema informa o utilizador do erro, mantém o vídeo original inalterado e não publica um resultado parcial como válido. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | O vídeo resultante corresponde ao intervalo selecionado e o ficheiro original continua disponível e inalterado. |
| Garantia Mínima | Se a operação falhar ou for cancelada, o sistema preserva o vídeo original e não apresenta qualquer resultado parcial como válido. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | O início do intervalo deve ser estritamente anterior ao fim do intervalo. |
| RN2 | O intervalo definido deve estar totalmente contido na duração do vídeo. |
| RN3 | O vídeo original não pode ser substituído nem alterado pela operação. |
| RN4 | Apenas vídeos validados e compatíveis com o sistema podem ser processados. |
| RN5 | As políticas de acesso, quota e limites por perfil continuam pendentes de decisão. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | O vídeo já se encontra carregado e associado ao projeto ou à biblioteca do utilizador antes do início do caso de uso. |
| A2 | O sistema consegue identificar a duração do vídeo antes de iniciar a operação. |
| A3 | A operação gera um novo recurso de vídeo e não modifica o ficheiro original. |
| A4 | O processamento pode ser realizado em modo síncrono ou assíncrono conforme a política geral de tarefas do sistema. |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Qual é a precisão temporal exigida para o recorte? |
| Q2 | Quais os formatos e codecs válidos para o vídeo de entrada e do resultado? |
| Q3 | A funcionalidade deve estar disponível a utilizadores anónimos, autenticados ou apenas a perfis específicos? |
| Q4 | O recorte consome quota por operação, por duração ou por ficheiro? |

---

### 2.1 UC-VID-002

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-002 |
| **Nome** | Remover o áudio de um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa de requisitos |
| **Data** | 2026-10-12 |
| **Objetivo** | Permitir ao utilizador obter uma versão do vídeo sem a faixa de áudio, preservando a componente visual e mantendo o vídeo original inalterado. |
| **Âmbito** | Módulo de processamento de vídeo do PictuRAS |
| **Ator Principal** | Utilizador com acesso ao vídeo e ao projeto em que este será processado; a política específica por perfil permanece pendente. |
| **Stakeholders e Interesses** | - **Utilizador**: pretende remover o som quando ele não é necessário ou não deve ser partilhado.<br>- **Sistema PictuRAS**: deve manter a operação segura e consistente com o restante processamento de media.<br>- **Administrador / produto**: pretende controlar os custos de processamento e a compatibilidade do resultado. |
| **Pré-condições** | - O vídeo está disponível e acessível ao utilizador.<br>- O ficheiro contém um fluxo de vídeo válido e a operação é aplicável ao tipo de conteúdo.<br>- O sistema pode distinguir entre vídeo e áudio no recurso selecionado. |
| **Trigger** | O utilizador seleciona um vídeo e opta por remover a faixa sonora. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona um vídeo com áudio. | O sistema valida o ficheiro e confirma que a operação pode proceder. |
| 2 | O utilizador confirma a remoção do áudio. | O sistema inicia a transformação do vídeo e mantém o original disponível. |
| 3 | — | O sistema produz uma nova versão do vídeo sem a faixa sonora. |
| 4 | O utilizador visualiza o resultado. | O sistema disponibiliza o resultado para visualização e download sem alterar o original. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Vídeo sem áudio | O vídeo não contém uma faixa de áudio -> O sistema informa o utilizador da ausência de áudio e decide se rejeita ou reporta como operação sem efeito, conforme a política definida. |
| FA2 – Cancelar antes de iniciar | O utilizador cancela a operação -> O sistema mantém o vídeo original inalterado e não cria resultado. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O ficheiro de vídeo não pode ser validado. | O sistema rejeita a operação e informa o utilizador do problema. |
| O processamento falha após a validação inicial. | O sistema mantém o original inalterado e não publica um vídeo incompleto. |
| O vídeo não contém faixa de áudio. | O sistema informa o utilizador, conforme a decisão de produto, e não cria um resultado inválido. |
| O perfil ou a quota aplicada impedem a operação. | O sistema bloqueia a tarefa e informa o utilizador da razão. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | O novo vídeo mantém a componente visual e não inclui qualquer faixa de áudio. |
| Garantia Mínima | Se a operação falhar, o original permanece disponível e nenhum resultado parcial é apresentado como válido. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A operação deve preservar a trilha visual do vídeo. |
| RN2 | O vídeo original não deve ser substituído. |
| RN3 | Apenas ficheiros válidos e compatíveis com o sistema podem ser processados. |
| RN4 | O tratamento do caso sem faixa de áudio e a política de quota continuam pendentes de decisão. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | O sistema consegue identificar e manipular a(s) stream(s) de áudio do vídeo de entrada. |
| A2 | O resultado da operação é um novo ficheiro de vídeo. |
| A3 | A operação pode ser tratada como processamento assíncrono quando a duração ou o tamanho do vídeo assim o justificar. |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Quando o vídeo não contém áudio, o sistema deve rejeitar a operação ou devolver uma mensagem de “sem efeito”? |
| Q2 | A operação deve estar disponível a todos os perfis ou apenas aos perfis com armazenamento persistente? |
| Q3 | A remoção de áudio deve consumir quota ou deve ser tratada como operação sem custo? |

---

### 2.1 UC-VID-003

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-003 |
| **Nome** | Alterar a velocidade de reprodução de um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa de requisitos |
| **Data** | 2026-10-12 |
| **Objetivo** | Permitir ao utilizador definir um fator de velocidade para um vídeo e obter uma nova versão cuja duração e ritmo de reprodução sejam ajustados de acordo com esse fator, sem alterar o original. |
| **Âmbito** | Módulo de edição temporal e processamento de vídeo do PictuRAS |
| **Ator Principal** | Utilizador com acesso ao vídeo e ao projeto em que este será processado; a política por perfil permanece pendente. |
| **Stakeholders e Interesses** | - **Utilizador**: pretende acelerar ou desacelerar a reprodução do vídeo.<br>- **Sistema PictuRAS**: deve validar o fator e produzir uma saída consistente.<br>- **Administrador / produto**: pretende garantir que a operação está alinhada com as políticas de acesso e permanência dos dados. |
| **Pré-condições** | - O vídeo está carregado e acessível no sistema.<br>- O utilizador tem autorização para aceder ao vídeo e à operação.| 
| **Trigger** | O utilizador seleciona um vídeo e escolhe a operação de alteração da velocidade. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona um vídeo disponível. | O sistema apresenta a duração, a operação de alteração de velocidade e os parâmetros aplicáveis. |
| 2 | O utilizador indica o fator de velocidade. | O sistema valida se o valor é positivo e se respeita os limites aplicáveis. |
| 3 | O utilizador confirma a operação. | O sistema verifica a validade do vídeo e inicia o processamento. |
| 4 | — | O sistema produz uma nova versão do vídeo com a duração e o ritmo de reprodução ajustados. |
| 5 | O utilizador visualiza o resultado. | O sistema disponibiliza o vídeo resultante, sem alterar o original. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Fator inválido | O utilizador ajusta o fator para um valor fora do intervalo permitido -> O sistema rejeita a operação e pede uma nova inserção. |
| FA2 – Cancelar antes do processamento | O utilizador cancela a operação -> O sistema mantém o vídeo original sem alterações. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O fator de velocidade é nulo, negativo ou não válido. | O sistema bloqueia a operação e informa o utilizador da restrição. |
| O ficheiro não é um vídeo compatível. | O sistema indica a incompatibilidade e não inicia o processamento. |
| O processamento falha. | O sistema informa o utilizador e preserva o original. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | O resultado final representa o vídeo com o factor de velocidade confirmado e o original permanece disponível. |
| Garantia Mínima | Se a operação falhar ou for cancelada, o sistema mantém o vídeo original inalterado e não apresenta um resultado parcial como válido. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | O fator de velocidade deve ser superior a zero. |
| RN2 | O fator utilizado deve respeitar os limites aprovados pelo sistema ou pelo perfil do utilizador. |
| RN3 | A operação não deve modificar o vídeo original. |
| RN4 | A interpretação exata do fator e o comportamento do áudio continuam pendentes de decisão. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | O fator de velocidade é interpretado como multiplicador da velocidade de reprodução do vídeo. |
| A2 | A duração resultante pode ser calculada a partir do vídeo de origem e do fator informado. |
| A3 | O sistema pode aplicar a transformação como nova versão do vídeo, mantendo o original. |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Qual é o intervalo válido de fatores de velocidade para o MVP? |
| Q2 | A operação deve permitir valores livres ou apenas valores predefinidos? |
| Q3 | O audio deve acompanhar a alteração de velocidade ou deve ser removido? |

---

### 2.1 UC-VID-004

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-004 |
| **Nome** | Aplicar marca de água a um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa de requisitos |
| **Data** | 2026-10-12 |
| **Objetivo** | Permitir ao utilizador adicionar uma marca de água textual ou gráfica ao vídeo, mantendo a imagem original disponível e produzindo uma nova versão com a marca aplicada. |
| **Âmbito** | Módulo de processamento de vídeo e resultados do projeto PictuRAS |
| **Ator Principal** | Utilizador com acesso ao projeto e autorização para criar ou alterar o resultado do vídeo; a autenticação e a política por perfil continuam pendentes. |
| **Stakeholders e Interesses** | - **Utilizador**: pretende identificar e proteger a sua produção audiovisual.<br>- **Sistema PictuRAS**: deve aplicar a marca de forma consistente e segura.<br>- **Administrador / produto**: pretende controlar carga, persistência e direitos de acesso sobre o resultado. |
| **Pré-condições** | - O utilizador tem acesso ao vídeo selecionado e autorização para editar o recurso ou o projeto.<br>- O material de marca de água é válido, conforme o tipo escolhido.<br>- O vídeo é elegível para processamento. |
| **Trigger** | O utilizador seleciona um vídeo e escolhe a funcionalidade de aplicação de marca de água. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona o vídeo e a operação de marca de água. | O sistema apresenta os parâmetros de configuração e valida a entrada do vídeo. |
| 2 | O utilizador escolhe texto ou imagem como marca. | O sistema apresenta os campos necessários para a configuração escolhida. |
| 3 | O utilizador define posição, tamanho e opacidade da marca. | O sistema valida os valores e apresenta uma pré-visualização se esta for suportada. |
| 4 | O utilizador confirma a configuração. | O sistema coloca a tarefa em processamento e mantém o vídeo original inalterado. |
| 5 | — | O sistema aplica a marca ao vídeo de forma consistente e guarda o resultado como novo ficheiro. |
| 6 | O utilizador consulta o resultado. | O sistema disponibiliza o vídeo processado para visualização e download. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Marca em imagem | O utilizador escolhe uma imagem em vez de texto -> O sistema valida a imagem e continua o fluxo de configuração. |
| FA2 – Alterar configuração após pré-visualização | O utilizador ajusta a posição, tamanho ou opacidade -> O sistema atualiza a pré-visualização e mantém a operação pendente até confirmar. |
| FA3 – Cancelar antes do início do processamento | O utilizador cancela -> O sistema não inicia a tarefa e mantém o original inalterado. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| A marca de água é inválida ou o ficheiro associado está corrompido. | O sistema informa o utilizador e não inicia o processamento. |
| O vídeo não é compatível com a operação. | O sistema bloqueia a operação e informa o utilizador. |
| A marca excede os limites visíveis do vídeo. | O sistema rejeita a configuração e pede a correção dos valores. |
| O processamento falha. | O sistema mantém o vídeo original inalterado e informa o utilizador do erro. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | O vídeo resultante inclui a marca de água configurada na posição e intensidade definidas, e o original continua disponível. |
| Garantia Mínima | Em caso de erro ou cancelamento, o original permanece inalterado e nenhum resultado parcial é indicado como válido. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A marca de água deve ser aplicada de forma consistente ao longo do vídeo. |
| RN2 | A marca deve permanecer dentro dos limites visíveis do vídeo. |
| RN3 | O tamanho e a opacidade devem obedecer aos valores permitidos pelo sistema. |
| RN4 | O vídeo original não pode ser substituído durante o processamento. |
| RN5 | A operação depende da validação do ficheiro e da política de autenticação do projeto. |
| RN6 | A posição e a estratégia de aplicação continuam pendentes de decisão de produto. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | A funcionalidade pode aproveitar, em parte, a lógica existente de marca de água para imagens. |
| A2 | O processamento da marca de água sobre vídeo pode ser assíncrono quando o volume de dados for relevante. |
| A3 | O resultado final deve ser guardado como novo recurso em vez de substituir o original. |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | A marca deve manter uma posição fixa ao longo do vídeo ou pode variar por fotograma? |
| Q2 | Quais os formatos de imagem e texto aceites para a marca? |
| Q3 | A operação deve ser acessível a todos os utilizadores autenticados ou apenas a perfis específicos? |

---

### 2.1 UC-VID-005

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-005 |
| **Nome** | Extrair fotogramas de um vídeo para um projeto |
| **Versão** | v1.0 |
| **Autor** | Equipa de requisitos |
| **Data** | 2026-10-12 |
| **Objetivo** | Permitir ao utilizador extrair uma sequência de fotogramas de um vídeo e adicioná-los ao projeto como imagens utilizáveis pelo PictuRAS, preservando o original e mantendo o processamento acompanhado e controlado. |
| **Âmbito** | Módulo de projetos, processamento assíncrono e gestão de resultados do PictuRAS |
| **Ator Principal** | Utilizador com sessão iniciada e permissão de edição sobre o projeto; perfil a confirmar conforme a política de quotas e limites. |
| **Stakeholders e Interesses** | - **Utilizador**: pretende transformar partes do vídeo em imagens editáveis.<br>- **Projeto / sistema**: pretende reutilizar as ferramentas de imagem existentes sobre os fotogramas extraídos.<br>- **Equipe de produto / DevOps**: pretende controlar carga, quota, armazenamento e execução paralela. |
| **Pré-condições** | - O utilizador tem sessão iniciada e acesso ao projeto em questão.<br>- O projeto contém um vídeo válido e acessível.<br>- O utilizador tem permissões para editar o projeto e não existe bloqueio de processamento aplicável. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a opção de extração de fotogramas. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador abre o projeto e selecciona um vídeo. | O sistema apresenta o vídeo, a duração e as opções de extração aplicáveis. |
| 2 | O utilizador define o intervalo temporal, o passo e o formato de saída dos fotogramas. | O sistema valida os parâmetros e mostra o número estimado de imagens. |
| 3 | O utilizador confirma a operação. | O sistema valida as políticas de quota, limites e autorização e cria uma tarefa assíncrona. |
| 4 | — | O sistema extrai os fotogramas em sequência e comunica o progresso ao utilizador. |
| 5 | — | O sistema adiciona os fotogramas ao projeto como imagens de resultado ou rejeita a operação sem publicar resultados parciais. |
| 6 | O utilizador consulta a galeria do projeto. | O sistema disponibiliza as imagens extraídas com o estado correspondente e sem alterar o vídeo original. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Pré-visualizar amostra | O utilizador solicita uma amostra dos fotogramas estimados -> O sistema mostra uma miniatura representativa sem criar resultado definitivo nem consumir quota. |
| FA2 – Cancelar extração | O utilizador cancela a operação durante a execução -> O sistema interrompe o processamento com a maior brevidade possível, devolve a reserva de quota se aplicável e mantém o projeto sem resultados parciais. |
| FA3 – Ajustar o passo antes de confirmar | O utilizador altera o intervalo ou o passo -> O sistema recalcula a previsão de fotogramas e mantém o pedido em validação. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| Os parâmetros são inválidos. | O sistema bloqueia a operação, indica o parâmetro em causa e exige a correção antes de executar. |
| O vídeo excede os limites ou a quota aplicável. | O sistema não inicia a extração e informa o utilizador da restrição. |
| O ficheiro de vídeo não pode ser descodificado. | O sistema informa o utilizador e não adiciona qualquer fotograma ao projeto. |
| A extração falha a meio da execução. | O sistema aborta a tarefa, descarta resultados parciais e não mantém dados incompletos. |
| O armazenamento não é suficiente para os resultados previstos. | O sistema impede a operação e informa o utilizador antes de criar resultados. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | O projeto contém os fotogramas previstos, cada um associado ao instante correspondente do vídeo, e o vídeo original continua inalterado. |
| Garantia Mínima | Em caso de falha, cancelamento ou erro de validacação, o sistema não adiciona fotogramas parciais e mantém o projeto no estado anterior. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A extração deve preservar o vídeo original e não substituir o recurso origem. |
| RN2 | O intervalo de extração deve ser válido e o número de fotogramas gerados deve ser calculado de forma consistente. |
| RN3 | A operação deve ser atomicamente confirmada: todos os fotogramas são adicionados ou nenhum é adicionado. |
| RN4 | Os fotogramas extraídos devem poder ser tratados como imagens normais do projeto. |
| RN5 | A execução deve ser acompanhada por progresso e, quando aplicável, por cancelamento. |
| RN6 | Os limites por perfil, quotas, formatação e número máximo de fotogramas continuam pendentes de decisão. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | Os fotogramas extraídos são armazenados como imagens do projeto e não como um tipo de recurso especial. |
| A2 | A extração pode reutilizar o mecanismo assíncrono já existente no PictuRAS, com extensão para o processamento de vídeo. |
| A3 | O projecto deve suportar a associação simultânea de imagens novas a um vídeo já existente. |
| A4 | A contagem dos fotogramas deve seguir a regra do intervalo temporal, ainda a confirmar pela equipa. |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | A fórmula exata de contagem dos fotogramas deve seguir um intervalo semiaberto, fechado ou outra convenção? |
| Q2 | Qual é a política de quota e de limite por perfil para a operação? |
| Q3 | Os fotogramas extraídos devem ser exportados apenas em JPEG/PNG ou há mais formatos a considerar? |
| Q4 | Num projeto partilhado, a quota deve ser atribuída ao dono do projeto ou ao utilizador que executa a operação? |

---

## 3. Utilização de agentes de IA

| **Ferramenta / skill** | **Tarefa apoiada** | **Validação realizada pela equipa** |
|------------------------|--------------------|--------------------------------------|
| ChatGPT / Copilot | Apoio na revisão da linguagem e na normalização dos casos de uso, com foco na consistência e na redução de ambiguidades. | A equipa verificou que as descrições respeitam o modelo de requisitos do PictuRAS, mantêm a origem documental e evitam decisões de implementação não aprovadas. |

---

## ✅ Lista de verificação antes de entregar

- [x] Secções 0 a 3 preenchidas e texto de ajuda removido.
- [x] Funções de vídeo definidas e justificadas no contexto do MVP.
- [x] Atores principais identificados, com as políticas por perfil marcadas como pendentes quando o documento não as confirma.
- [x] Cinco casos de uso com fluxo principal, fluxos alternativos e exceções específicas de vídeo.
- [x] Pós-condições com garantia de sucesso e garantia mínima.
- [x] Regras de negócio e restrições registadas.
- [x] Assunções e questões em aberto mantidas como decisões pendentes.
- [x] Utilização de agentes de IA documentada.
