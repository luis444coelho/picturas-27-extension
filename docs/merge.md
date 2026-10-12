# 📝 Exercício 1 — Template de Entrega
### Casos de Uso · Fase 1: Suporte a Vídeo no PictuRAS

> **Como usar este template**
> - **No Exercício 1, preencha apenas as secções 0 a 3.** A secção 4, *Esboço de requisitos derivados*, fica para a aula seguinte — não a preencha agora.
> - Substitua todo o texto em *itálico entre chavetas* `{...}` pelo seu conteúdo e **apague as linhas de ajuda** (as que começam por `>`), incluindo esta.
> - Mantenha as secções e a numeração: a avaliação segue esta estrutura.
> - Não deixe campos por preencher: se não souber, escreva uma **assunção** (secção 2.7) ou uma **questão em aberto** (secção 2.8).
> - Exemplos de referência: `RAS-use_case_example-LOGIN_PT.md` (Login) e `RAS-use_case_example-VIDEO_PT.md` (Gerar Miniatura de um Vídeo). Este template segue a mesma estrutura.

---

## 0. Identificação

| **Campo** | **Valor** |
|-----------|-----------|
| **Grupo / Equipa** | {nº do grupo} |
| **Autores** | {nome (nº mecanográfico); nome (nº); …} |
| **Data** | {AAAA-MM-DD} |
| **Versão do documento** | v1.0 |
| **Unidade Curricular** | Requisitos e Arquiteturas de Software — MEI, Universidade do Minho |

---

## 1. Funcionalidade de vídeo escolhida

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | {e.g., Recorte temporal de vídeo (*trim*)} |
| **Perfil(s) de utilizador abrangido(s)** | {anónimo / registado / premium — e porquê} |

**Justificação no contexto do MVP** *(2–3 linhas)*
> Porque é que esta funcionalidade é das primeiras a valer a pena construir? Que valor entrega ao utilizador? Sem ela, que parte do suporte a vídeo fica por validar?

{a sua justificação}

## 1. Funcionalidade de vídeo escolhida

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Recorte na duração do vídeo (trim) |
| **Perfil(s) de utilizador abrangido(s)** | Anónimo, registado e premium. A funcionalidade base é relevante para todos os perfis, podendo existir restrições diferentes em função do perfil, nomeadamente quanto à duração ou tamanho do video. |

**Justificação no contexto do MVP**

O recorte de um video permite ao utilizador remover partes indesejadas de um vídeo e conservar apenas o segmento que pretende utilizar. É uma funcionalidade simples, mas com valor direto num editor de vídeo, e permite validar no MVP uma necessidade básica de manipulação temporal sem exigir funcionalidades avançadas de edição.

 **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Remoção do áudio de um vídeo |
| **Perfil(s) de utilizador abrangido(s)** | Anónimo, registado e premium, sujeitos às restrições associadas ao respetivo perfil de utilização. |

**Justificação no contexto do MVP**

A remoção do áudio permite ao utilizador obter uma versão sem som de um vídeo quando o conteúdo sonoro é desnecessário ou não deve fazer parte do resultado final. No contexto do MVP, esta funcionalidade acrescenta uma forma simples de manipulação do conteúdo audiovisual e permite explorar a relação entre as componentes de vídeo e áudio de um mesmo ficheiro.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Alteração da velocidade de reprodução de um vídeo |
| **Perfil(s) de utilizador abrangido(s)** | Anónimo, registado e premium, sujeitos às restrições associadas ao respetivo perfil de utilização. |

**Justificação no contexto do MVP**

A alteração da velocidade permite ao utilizador acelerar ou abrandar a reprodução de um vídeo de acordo com o resultado pretendido. No contexto do MVP, esta funcionalidade introduz uma forma de manipulação temporal diferente do recorte, uma vez que modifica a duração e o ritmo do conteúdo sem eliminar necessariamente partes do vídeo.



| **Campo** | **Valor** |
|---|---|
| **Funcionalidade** | Aplicação de uma marca de água personalizada a um vídeo |
| **Perfil(s) de utilizador abrangido(s)** | **Utilizador Registado**, uma vez que necessita de ter o vídeo armazenado na sua biblioteca e de guardar o resultado do processamento. |

### **Justificação no contexto do MVP**


Esta funcionalidade permite estender para vídeo uma capacidade já existente no PictuRAS para processamento de imagens, permitindo aplicar uma marca de água de forma consistente ao longo de todos os fotogramas. A funcionalidade permite validar o suporte a vídeo, o processamento assíncrono e a geração e armazenamento de novos ficheiros.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Extração de fotogramas de um vídeo para o projeto |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (ator principal, sujeito à quota diária de operações) e **Premium** (limites alargados e sem quota). O **Anónimo** fica excluído: o processamento de vídeo é pesado, não existe conta onde guardar os resultados e não há controlo de abuso. |
 
**Justificação no contexto do MVP**
 
A extração de fotogramas é a ponte entre o vídeo e tudo o que o PictuRAS já faz bem com imagens: cada fotograma extraído passa a poder ser tratado como uma imagem normal, permitindo reutilizar as ferramentas, o encadeamento, o processamento em lote e o download em ZIP já existentes, o que dá valor imediato com pouco código novo. Valida de uma só vez as questões estruturais do vídeo (ficheiros grandes, processamento assíncrono com progresso e cancelamento, limites por perfil, quota e armazenamento) e pode servir de base a funcionalidades seguintes, como aplicar ferramentas a todos os fotogramas.


| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Extração de fotogramas de um vídeo para o projeto |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (ator principal, sujeito à quota diária de operações) e **Premium** (limites alargados e sem quota). O **Anónimo** fica excluído: o processamento de vídeo é pesado, não existe conta onde guardar os resultados e não há controlo de abuso. |
 
**Justificação no contexto do MVP**
 
A extração de fotogramas é a ponte entre o vídeo e tudo o que o PictuRAS já faz bem com imagens: cada fotograma extraído passa a poder ser tratado como uma imagem normal, permitindo reutilizar as ferramentas, o encadeamento, o processamento em lote e o download em ZIP já existentes, o que dá valor imediato com pouco código novo. Valida de uma só vez as questões estruturais do vídeo (ficheiros grandes, processamento assíncrono com progresso e cancelamento, limites por perfil, quota e armazenamento) e pode servir de base a funcionalidades seguintes, como aplicar ferramentas a todos os fotogramas.


---

## 2. Caso de Uso

> Siga o formato dos exemplos de Login e de Vídeo. O exemplo de vídeo é **deliberadamente simples**: o caso de uso da sua equipa deve ser bastante mais complexo (ver a secção final desse exemplo, *Porque é que este exemplo é o mínimo*).

### 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-{nnn} |
| **Nome** | {nome do caso de uso} |
| **Versão** | v1.0 |
| **Autor** | {autor} |
| **Data** | {AAAA-MM-DD} |
| **Objetivo** | {o que o ator consegue alcançar} |
| **Âmbito** | {módulo/componente do PictuRAS afetado} |
| **Ator Principal** | {ator + perfil de utilização} |
| **Stakeholders e Interesses** | - **{stakeholder}**: {interesse}<br>- **{stakeholder}**: {interesse} |
| **Pré-condições** | - {…}<br>- {…} |
| **Trigger** | {o que dá início ao caso de uso} |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | {…} | {…} |
| 2 | {…} | — |
| 3 | — | {…} |
| … | | |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – {nome} | {condição → comportamento} |
| FA2 – {nome} | {…} |

### 2.4 Exceções

> Inclua **pelo menos uma exceção específica de vídeo** (formato/codec não suportado, duração ou tamanho excedidos, falha a meio do processamento, quota do perfil esgotada, …).

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| {…} | {…} |
| {…} | {…} |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | {estado do sistema quando tudo corre bem} |
| Garantia Mínima | {estado do sistema quando falha} |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | {e.g., utilizador registado limitado a vídeos de duração ≤ X s} |
| RN2 | {…} |

### 2.7 Assunções

> Em contexto *brownfield*, assunções não documentadas são a principal fonte de retrabalho. Registe-as aqui.

| **ID** | **Assunção** |
|--------|--------------|
| A1 | {…} |
| A2 | {…} |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | {…} |
| Q2 | {…} |




## 2. Caso de Uso

### 2.1 UC-VID-001

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-001 |
| **Nome** | Recortar temporalmente um vídeo |
| **Versão** | v1.0 |
| **Autor** | {autor / equipa} |
| **Data** | {2026-10-04} |
| **Objetivo** | Permitir ao utilizador selecionar e guardar apenas um intervalo temporal de um vídeo, excluindo as partes anteriores e posteriores ao intervalo escolhido. |
| **Âmbito** | Edição de vídeo no PictuRAS |
| **Ator Principal** | Utilizador do PictuRAS — anónimo, registado ou premium, sujeito às restrições do respetivo perfil |
| **Stakeholders e Interesses** | - **Utilizador**: pretende obter apenas o segmento relevante de um vídeo, sem alterar o conteúdo original.<br>- **Fornecedor do serviço PictuRAS**: pretende disponibilizar uma funcionalidade de edição de vídeo útil e coerente com o modelo de utilização da plataforma. |
| **Pré-condições** | - Existe um vídeo disponível para edição no PictuRAS.<br>- O utilizador tem acesso à funcionalidade de recorte temporal de acordo com o respetivo perfil. |
| **Trigger** | O utilizador seleciona a funcionalidade de recorte temporal para o vídeo que pretende editar. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona um vídeo disponível para edição. | O sistema apresenta o vídeo e as operações de edição aplicáveis. |
| 2 | O utilizador seleciona a funcionalidade de recorte temporal. | O sistema apresenta a duração do vídeo e os controlos necessários para definir o início e o fim do intervalo a conservar. |
| 3 | O utilizador define o instante inicial e o instante final do intervalo pretendido. | O sistema apresenta o intervalo selecionado. |
| 4 | O utilizador confirma o intervalo definido. | O sistema verifica se o intervalo é válido e se a operação respeita as restrições aplicáveis ao utilizador e ao vídeo. |
| 5 | — | O sistema inicia o processamento do recorte e informa o utilizador de que a operação está em curso. |
| 6 | — | O sistema conclui o processamento e disponibiliza o vídeo resultante. |
| 7 | O utilizador visualiza o resultado do recorte. | O sistema mantém o vídeo original disponível e apresenta o vídeo resultante como resultado da operação. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA4.1 – Alterar o intervalo selecionado | Antes de confirmar a operação, o utilizador altera o instante inicial e/ou final -> O sistema atualiza o intervalo apresentado e o caso de uso continua a partir da definição do intervalo. |
| FA4.2 – Cancelar antes do processamento | Antes de confirmar a operação, o utilizador decide cancelar o recorte -> O sistema abandona a operação e mantém o vídeo sem alterações. |
| FA7 – Efetuar novo recorte após visualizar o resultado | Após visualizar o resultado, o utilizador decide selecionar outro intervalo -> O sistema permite regressar à definição dos instantes inicial e final, mantendo o vídeo original disponível. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O instante inicial é igual ou posterior ao instante final. | O sistema não inicia o processamento, informa o utilizador de que o intervalo é inválido e permite a introdução de novos valores. |
| O instante inicial ou final encontra-se fora da duração do vídeo. | O sistema rejeita o intervalo e solicita ao utilizador a definição de valores contidos na duração do vídeo. |
| O formato ou codec do vídeo não é suportado. | O sistema não inicia o processamento e informa o utilizador de que o vídeo não é compatível com a funcionalidade. |
| O vídeo excede um limite de tamanho ou duração aplicável ao perfil do utilizador. | O sistema impede o início da operação e informa o utilizador da restrição aplicável. |
| O processamento falha antes de produzir um resultado válido. | O sistema informa o utilizador da falha, mantém o vídeo original disponível e não apresenta um resultado incompleto como válido. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | Existe um vídeo resultante correspondente ao intervalo temporal selecionado e o vídeo original permanece disponível sem alterações. |
| Garantia Mínima | Se a operação não for concluída com sucesso, o vídeo original permanece inalterado e nenhum resultado parcial é considerado válido. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | O instante inicial do intervalo deve ser estritamente anterior ao instante final. |
| RN2 | O intervalo selecionado deve estar totalmente contido na duração do vídeo. |
| RN3 | A operação de recorte não deve substituir nem alterar o vídeo original. |
| RN4 | Apenas vídeos com características suportadas pelo PictuRAS podem ser processados pela funcionalidade de recorte. |
| RN5 | As restrições relativas à utilização da funcionalidade podem variar de acordo com o perfil do utilizador. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | Assume-se que o vídeo já se encontra disponível no PictuRAS antes de o utilizador iniciar a operação de recorte. |
| A2 | Assume-se que a operação produz um novo vídeo e não modifica o ficheiro original. |
| A3 | Assume-se que, no âmbito do MVP, a operação de recorte é aplicada a um vídeo de cada vez. |
| A4 | Assume-se que o sistema consegue determinar a duração do vídeo antes de o utilizador confirmar o intervalo. |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Que formatos de vídeo devem ser suportados pelo PictuRAS no MVP? |
| Q2 | Que codecs de vídeo e áudio devem ser suportados? |
| Q3 | Deve existir uma duração máxima para os vídeos que podem ser recortados? |
| Q4 | Deve existir um tamanho máximo para os ficheiros de vídeo? |
| Q5 | Os limites de duração ou tamanho devem variar consoante o perfil do utilizador? |
| Q6 | A operação de recorte deve contar para o limite diário de operações aplicável aos utilizadores registados? |
| Q7 | O vídeo resultante deve preservar o formato, a resolução e o codec do vídeo original? |
| Q8 | O resultado deve ficar automaticamente associado ao projeto ou deve ser guardado apenas após uma ação explícita do utilizador? |


### 2.1 UC-VID-002

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-002 |
| **Nome** | Remover o áudio de um vídeo |
| **Versão** | v1.0 |
| **Autor** | {autor / equipa} |
| **Data** | {2026-10-05} |
| **Objetivo** | Permitir ao utilizador obter uma versão de um vídeo sem conteúdo áudio, preservando o seu conteúdo visual. |
| **Âmbito** | Edição de vídeo no PictuRAS |
| **Ator Principal** | Utilizador do PictuRAS — anónimo, registado ou premium, sujeito às restrições do respetivo perfil |
| **Stakeholders e Interesses** | - **Utilizador**: pretende obter uma versão silenciosa de um vídeo sem alterar o respetivo conteúdo visual.<br>- **Fornecedor do serviço PictuRAS**: pretende disponibilizar uma funcionalidade de edição que permita manipular a componente áudio dos conteúdos de vídeo. |
| **Pré-condições** | - Existe um vídeo disponível para edição no PictuRAS.<br>- O utilizador tem acesso à funcionalidade de remoção de áudio de acordo com o respetivo perfil. |
| **Trigger** | O utilizador seleciona a funcionalidade de remoção de áudio para o vídeo que pretende editar. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona um vídeo disponível para edição. | O sistema apresenta o vídeo e as operações de edição aplicáveis. |
| 2 | O utilizador seleciona a funcionalidade de remoção de áudio. | O sistema identifica a existência de conteúdo áudio associado ao vídeo e apresenta a operação selecionada. |
| 3 | O utilizador confirma que pretende remover o áudio. | O sistema verifica se a operação pode ser realizada sobre o vídeo e de acordo com as restrições aplicáveis ao utilizador. |
| 4 | — | O sistema inicia o processamento e informa o utilizador de que a operação está em curso. |
| 5 | — | O sistema conclui o processamento e disponibiliza uma versão do vídeo sem conteúdo áudio. |
| 6 | O utilizador visualiza o resultado. | O sistema mantém o vídeo original disponível e apresenta o vídeo resultante como resultado da operação. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Cancelar antes do processamento | Antes de confirmar a operação, o utilizador decide cancelar a remoção do áudio -> O sistema abandona a operação e mantém o vídeo sem alterações. |
| FA2 – Rejeitar o resultado | Após visualizar o resultado, o utilizador decide não utilizar a versão sem áudio -> O sistema mantém disponível o vídeo original e permite ao utilizador continuar a edição. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O vídeo selecionado não contém uma componente áudio. | O sistema informa o utilizador de que não existe áudio para remover e não inicia o processamento. |
| O formato ou codec do vídeo não é suportado. | O sistema não inicia o processamento e informa o utilizador de que o vídeo não é compatível com a funcionalidade. |
| O vídeo excede um limite de tamanho ou duração aplicável ao perfil do utilizador. | O sistema impede o início da operação e informa o utilizador da restrição aplicável. |
| O processamento falha antes de produzir um resultado válido. | O sistema informa o utilizador da falha, mantém o vídeo original disponível e não apresenta um resultado incompleto como válido. |
| O utilizador não possui quota disponível para executar a operação, caso esta esteja sujeita a quota. | O sistema não inicia o processamento e informa o utilizador da limitação associada ao respetivo perfil. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | Existe um vídeo resultante sem conteúdo áudio, mantendo-se o vídeo original disponível sem alterações. |
| Garantia Mínima | Se a operação não for concluída com sucesso, o vídeo original permanece inalterado e nenhum resultado parcial é considerado válido. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A remoção de áudio apenas pode ser aplicada a vídeos que possuam conteúdo áudio. |
| RN2 | A operação de remoção de áudio não deve substituir nem alterar o vídeo original. |
| RN3 | O conteúdo visual do vídeo resultante deve corresponder ao conteúdo visual do vídeo original. |
| RN4 | Apenas vídeos com características suportadas pelo PictuRAS podem ser processados pela funcionalidade. |
| RN5 | As restrições relativas à utilização da funcionalidade podem variar de acordo com o perfil do utilizador. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | Assume-se que o vídeo já se encontra disponível no PictuRAS antes de o utilizador iniciar a operação. |
| A2 | Assume-se que a operação produz um novo vídeo e não modifica o ficheiro original. |
| A3 | Assume-se que, no âmbito do MVP, a operação é aplicada a um vídeo de cada vez. |
| A4 | Assume-se que o sistema consegue determinar se o vídeo contém uma componente áudio antes de iniciar o processamento. |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Que formatos de vídeo devem ser suportados pelo PictuRAS no MVP? |
| Q2 | Que codecs de vídeo e áudio devem ser suportados? |
| Q3 | Deve existir uma duração máxima para os vídeos que podem ser processados? |
| Q4 | Deve existir um tamanho máximo para os ficheiros de vídeo? |
| Q5 | Os limites de duração ou tamanho devem variar consoante o perfil do utilizador? |
| Q6 | A remoção de áudio deve contar para o limite diário de operações aplicável aos utilizadores registados? |
| Q7 | O vídeo resultante deve preservar o formato, resolução e codec de vídeo do original? |
| Q8 | O utilizador deve poder pré-visualizar o resultado antes de o aceitar? |


### 2.1 UC-VID-003

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-003 |
| **Nome** | Alterar a velocidade de reprodução de um vídeo |
| **Versão** | v1.0 |
| **Autor** | {autor / equipa} |
| **Data** | {2026-10-05} |
| **Objetivo** | Permitir ao utilizador aumentar ou diminuir a velocidade de reprodução de um vídeo, obtendo um novo vídeo com o ritmo pretendido. |
| **Âmbito** | Edição de vídeo no PictuRAS |
| **Ator Principal** | Utilizador do PictuRAS — anónimo, registado ou premium, sujeito às restrições do respetivo perfil |
| **Stakeholders e Interesses** | - **Utilizador**: pretende ajustar a velocidade de reprodução de um vídeo às suas necessidades, acelerando ou desacelarando o conteúdo.<br>- **Fornecedor do serviço PictuRAS**: pretende disponibilizar uma funcionalidade de manipulação temporal de vídeo coerente com o modelo de utilização da plataforma. |
| **Pré-condições** | - Existe um vídeo disponível para edição no PictuRAS.<br>- O utilizador tem acesso à funcionalidade de alteração da velocidade de acordo com o respetivo perfil. |
| **Trigger** | O utilizador seleciona a funcionalidade de alteração da velocidade para o vídeo que pretende editar. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona um vídeo disponível para edição. | O sistema apresenta o vídeo e as operações de edição aplicáveis. |
| 2 | O utilizador seleciona a funcionalidade de alteração da velocidade. | O sistema apresenta os controlos necessários para definir a velocidade de reprodução pretendida. |
| 3 | O utilizador seleciona uma velocidade diferente da velocidade original. | O sistema apresenta a velocidade escolhida e a duração resultante estimada do vídeo. |
| 4 | O utilizador confirma a alteração da velocidade. | O sistema verifica se o valor selecionado é válido e se a operação respeita as restrições aplicáveis ao utilizador e ao vídeo. |
| 5 | — | O sistema inicia o processamento e informa o utilizador de que a operação está em curso. |
| 6 | — | O sistema conclui o processamento e disponibiliza o vídeo com a velocidade selecionada. |
| 7 | O utilizador visualiza o resultado. | O sistema mantém o vídeo original disponível e apresenta o vídeo resultante como resultado da operação. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA4.1 – Alterar a velocidade antes do processamento | Antes de confirmar a operação, o utilizador escolhe outro valor de velocidade. O sistema atualiza a velocidade selecionada e a duração resultante estimada. |
| FA4.2 – Cancelar antes do processamento | Antes de confirmar a operação, o utilizador decide cancelar a alteração. O sistema abandona a operação e mantém o vídeo sem alterações. |
| FA7 – Escolher nova velocidade após visualizar o resultado | Após visualizar o resultado, o utilizador decide experimentar outra velocidade. O sistema permite regressar à seleção da velocidade, mantendo disponível o vídeo original. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| O utilizador seleciona um valor de velocidade fora dos limites suportados. | O sistema não inicia o processamento, informa o utilizador de que o valor não é permitido e solicita a seleção de uma velocidade válida. |
| O valor de velocidade introduzido é inválido ou nulo. | O sistema rejeita o valor e não inicia o processamento. |
| O formato ou codec do vídeo não é suportado. | O sistema não inicia o processamento e informa o utilizador de que o vídeo não é compatível com a funcionalidade. |
| O vídeo excede um limite de tamanho ou duração aplicável ao perfil do utilizador. | O sistema impede o início da operação e informa o utilizador da restrição aplicável. |
| O processamento falha antes de produzir um resultado válido. | O sistema informa o utilizador da falha, mantém o vídeo original disponível e não apresenta um resultado incompleto como válido. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | Existe um vídeo resultante com a velocidade de reprodução selecionada pelo utilizador e o vídeo original permanece disponível sem alterações. |
| Garantia Mínima | Se a operação não for concluída com sucesso, o vídeo original permanece inalterado e nenhum resultado parcial é considerado válido. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| RN1 | A velocidade selecionada deve encontrar-se dentro do intervalo de valores suportado pelo PictuRAS. |
| RN2 | A velocidade selecionada deve ser superior a zero. |
| RN3 | Uma velocidade inferior à velocidade original aumenta a duração do vídeo e uma velocidade superior diminui a sua duração. |
| RN4 | A operação de alteração de velocidade não deve substituir nem alterar o vídeo original. |
| RN5 | Apenas vídeos com características suportadas pelo PictuRAS podem ser processados pela funcionalidade. |
| RN6 | As restrições relativas à utilização da funcionalidade podem variar de acordo com o perfil do utilizador. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| A1 | Assume-se que o vídeo já se encontra disponível no PictuRAS antes de o utilizador iniciar a operação. |
| A2 | Assume-se que a operação produz um novo vídeo e não modifica o ficheiro original. |
| A3 | Assume-se que, no âmbito do MVP, a operação é aplicada a um vídeo de cada vez. |
| A4 | Assume-se que o sistema consegue determinar a duração original do vídeo e calcular a duração resultante da velocidade selecionada. |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|--------|-------------|
| Q1 | Que valores mínimos e máximos de velocidade devem ser suportados? |
| Q2 | O utilizador deve poder introduzir livremente um fator de velocidade ou escolher apenas entre valores predefinidos? |
| Q3 | Que formatos de vídeo devem ser suportados pelo PictuRAS no MVP? |
| Q4 | Que codecs de vídeo e áudio devem ser suportados? |
| Q5 | Deve existir uma duração ou tamanho máximo para os vídeos que podem ser processados? |
| Q6 | Os limites de duração ou tamanho devem variar consoante o perfil do utilizador? |
| Q7 | A alteração de velocidade deve contar para o limite diário de operações aplicável aos utilizadores registados? |


### UC-VID-004

| **Secção** | **Detalhes** |
|---|---|
| **ID do Caso de Uso** | UC-VID-004 |
| **Nome** | Aplicar Marca de Água a um Vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa de Projeto |
| **Data** | 2026-10-04 |
| **Objetivo** | Permitir ao utilizador adicionar uma marca de água personalizada a um vídeo, definindo o seu conteúdo, posição, tamanho e transparência, obtendo um novo ficheiro de vídeo com a marca de água aplicada. |
| **Âmbito** | Módulo de processamento de vídeo do PictuRAS |
| **Ator Principal** | Utilizador Registado |
| **Stakeholders e Interesses** | **Utilizador**: pretende proteger ou identificar o seu vídeo através de uma marca de água personalizada. **Sistema PictuRAS**: deve processar o vídeo corretamente sem alterar o ficheiro original. **Administrador**: pretende garantir uma utilização controlada dos recursos de processamento. |
| **Pré-condições** | - O utilizador encontra-se autenticado na plataforma. O utilizador possui um vídeo disponível na sua grid. O vídeo encontra-se num formato suportado pelo sistema. |
| **Trigger** | O utilizador seleciona um vídeo da sua grid e escolhe a opção de adicionar uma marca de água. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|---|---|---|
| 1 | Seleciona um vídeo da sua grid e escolhe a opção **“Adicionar marca de água”**. | O sistema apresenta a interface de configuração da marca de água e valida os metadados do vídeo. |
| 2 | Escolhe o tipo de marca de água: **texto ou imagem**. | O sistema apresenta os campos necessários para configurar a marca de água escolhida. |
| 3 | Introduz o texto ou seleciona uma imagem para utilizar como marca de água. | O sistema valida o conteúdo introduzido ou o ficheiro selecionado. |
| 4 | Define a posição, tamanho e nível de transparência da marca de água. | O sistema atualiza a pré-visualização do vídeo de acordo com os parâmetros selecionados. |
| 5 | Confirma a configuração e seleciona **“Processar vídeo”**. | O sistema cria uma tarefa de processamento e coloca-a em fila para execução assíncrona. |
| 6 | — | O sistema aplica a marca de água aos fotogramas do vídeo, mantendo a mesma configuração ao longo do vídeo. |
| 7 | — | O sistema apresenta o progresso do processamento ao utilizador. |
| 8 | — | Após o processamento, o sistema recompõe o vídeo e guarda o novo ficheiro na biblioteca do utilizador. |
| 9 | — | O sistema apresenta o vídeo processado e disponibiliza as opções de pré-visualização e download. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|---|---|
| **FA1 – Utilizador escolhe uma imagem como marca de água** | 2a. O utilizador seleciona a opção **“Imagem”** em vez de texto → O sistema permite selecionar uma imagem da biblioteca ou carregar uma nova imagem → Após a validação, o fluxo continua no Passo 4. |
| **FA2 – Utilizador altera a configuração após a pré-visualização** | 4a. O utilizador verifica a pré-visualização e decide alterar a posição, tamanho ou transparência → O sistema atualiza a pré-visualização com os novos parâmetros → O utilizador confirma e o fluxo continua no Passo 5. |
| **FA3 – Utilizador cancela o processamento** | 5a. Antes do início efetivo do processamento, o utilizador cancela a operação → O sistema remove a tarefa da fila e mantém o vídeo original inalterado. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|---|---|
| **EX1 – Formato de vídeo não suportado** | O sistema interrompe o fluxo no Passo 1, apresenta uma mensagem a indicar que o formato ou codec do vídeo não é suportado e não inicia o processamento. |
| **EX2 – Vídeo excede os limites definidos** | Se o vídeo ultrapassar o tamanho ou duração máxima permitida, o sistema informa o utilizador e solicita a seleção de outro vídeo ou a redução do mesmo antes de iniciar o processamento. |
| **EX3 – Falha durante o processamento do vídeo** | Se ocorrer uma falha durante o processamento de um ou mais fotogramas, o sistema marca a tarefa como falhada, informa o utilizador e mantém o vídeo original intacto. |
| **EX4 – Marca de água inválida** | Se a imagem selecionada estiver num formato não suportado ou estiver corrompida, o sistema apresenta uma mensagem de erro e solicita uma nova imagem. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|---|---|
| **Garantia de Sucesso** | O vídeo é processado com sucesso, a marca de água configurada pelo utilizador é aplicada ao vídeo e o novo ficheiro fica disponível na biblioteca para pré-visualização e download. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, o vídeo original permanece inalterado e nenhuma tarefa incompleta é apresentada como resultado final. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|---|---|
| **RN1** | A marca de água deve ser aplicada de forma consistente ao longo dos fotogramas do vídeo. |
| **RN2** | A posição da marca de água deve permanecer dentro dos limites visíveis do vídeo. |
| **RN3** | O tamanho e a transparência da marca de água devem estar dentro dos valores permitidos pelo sistema. |
| **RN4** | O sistema não deve modificar ou substituir o vídeo original durante o processamento. |
| **RN5** | Apenas vídeos em formatos suportados pelo sistema podem ser processados. |
| **RN6** | O resultado do processamento deve ser guardado como um novo ficheiro na biblioteca do utilizador. |

### 2.7 Assunções

| **ID** | **Assunção** |
|---|---|
| **A1** | Assume-se que o PictuRAS passa a disponibilizar um módulo de processamento de vídeo capaz de ler e reconstruir ficheiros de vídeo. |
| **A2** | Assume-se que o processamento dos vídeos é realizado de forma assíncrona para evitar bloquear a aplicação web durante operações demoradas. |
| **A3** | Assume-se que a funcionalidade de marca de água existente para imagens pode servir de base para a implementação da mesma operação sobre os fotogramas de um vídeo. |
| **A4** | Assume-se que o sistema dispõe de armazenamento suficiente para manter o vídeo original e o vídeo processado. |

### 2.8 Questões em Aberto

| **ID** | **Questão** |
|---|---|
| **Q1** | Deve ser possível alterar a posição da marca de água ao longo do vídeo ou esta deve permanecer fixa durante todo o processamento? |
| **Q2** | Quais os formatos de vídeo que serão suportados na primeira versão da funcionalidade? |
| **Q3** | Qual deve ser o tamanho e duração máximos dos vídeos que podem ser processados? |
| **Q4** | A imagem utilizada como marca de água deve ser selecionada apenas da biblioteca do utilizador ou também pode ser carregada durante a configuração? |


### 2.1 UC-VID-004
 
| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-004 |
| **Nome** | Extrair fotogramas de um vídeo para o projeto |
| **Versão** | v1.0 |
| **Autor** | {autores} |
| **Data** | 2026-10-05 |
| **Objetivo** | Permitir ao utilizador obter, a partir de um vídeo do seu projeto, uma sequência de imagens (fotogramas) extraídas a intervalos regulares dentro de um intervalo temporal, para as usar como imagens normais do PictuRAS. |
| **Âmbito** | Módulo de projetos e edição — extração e armazenamento de fotogramas de vídeos, processamento assíncrono e acompanhamento do progresso. |
| **Ator Principal** | Utilizador **Registado** (conta gratuita, autenticado). Variante: utilizador **Premium**. |
| **Stakeholders e Interesses** | - **Utilizador Registado**: obter imagens do vídeo para editar, sem perder operações da quota diária por falhas ou cancelamentos<br>- **Utilizador Premium**: extrações maiores e sem limite diário<br>- **Proprietário do Sistema / Negócio**: reaproveitar as ferramentas de imagem existentes e diferenciar os planos gratuito e premium<br>- **Equipa DevOps / Desenvolvimento**: carga de processamento e de armazenamento controlada<br>- **Administrador / RGPD**: privacidade dos vídeos e das imagens extraídas |
| **Pré-condições** | - O utilizador tem sessão iniciada<br>- O projeto está aberto e contém um vídeo já carregado e válido<br>- O utilizador tem permissão para editar o projeto e o vídeo encontra-se disponível para processamento. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a opção **Extrair fotogramas** |


### 2.2 Fluxo Principal
 
| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador abre o projeto que contém o vídeo | Apresenta o vídeo (player e duração), as operações diárias restantes e o limite de fotogramas do perfil |
| 2 | O utilizador escolhe **Extrair fotogramas** | Apresenta o formulário com os valores por omissão: intervalo = vídeo completo, 1 fotograma a cada 5 s, formato JPEG |
| 3 | O utilizador define o intervalo [início, fim[, o passo N (em segundos) e o formato (JPEG ou PNG) | Valida os parâmetros em tempo real e mostra o número de fotogramas que serão extraídos |
| 4 | O utilizador clica **Extrair** | Verifica os limites aplicáveis, reserva a operação da quota (quando aplicável) e cria uma tarefa de extração assíncrona. |
| 5 | — | Mostra o ecrã de progresso (fotogramas concluídos / total) e disponibiliza a opção Cancelar enquanto a operação estiver em processamento. |
| 6 | — | O sistema extrai, para cada instante solicitado, o fotograma disponível mais próximo, e comunica o progresso ao utilizador. |
| 7 | — | Ao concluir, adiciona todos os fotogramas ao projeto como imagens, confirma o consumo da operação e notifica o utilizador |
| 8 | O utilizador consulta os fotogramas na galeria do projeto | Apresenta as imagens extraídas, cada uma com o instante de origem, utilizáveis como qualquer outra imagem do projeto |


### 2.3 Fluxos Alternativos
 
| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Pré-visualizar amostra | Passo 3: o utilizador pede pré-visualização → o sistema mostra uma pequena amostra representativa dos fotogramas a extrair, sem criar tarefa nem consumir operação → volta ao passo 3 |
| FA2 – Cancelar extração | Passos 5–6: o utilizador clica **Cancelar** → o sistema interrompe o processamento assim que possível, descarta os fotogramas já gerados, devolve a operação reservada e mantém o projeto como estava antes. |
| FA3 – Utilizador abandona durante o processamento | Passos 5–6: o utilizador fecha o separador ou sai do projeto → a extração continua em segundo plano; ao regressar, o utilizador vê o estado atual ou o resultado final |
| FA4 – Utilizador Premium | Passo 4: o sistema não verifica nem consome quota diária e aplica os limites do perfil Premium (RN1) |
| FA5 – Aceitar ajuste sugerido | Passo 3: se o número de fotogramas exceder o limite do perfil, o sistema propõe o menor passo N que respeita o limite → se o utilizador aceitar, o formulário é atualizado e volta ao passo 3 |


### 2.4 Exceções
 
| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| Parâmetros inválidos (início ≥ fim, fim superior à duração do vídeo, N inferior a 1 s ou não inteiro) | Bloqueia **Extrair** e indica o parâmetro em causa e como o corrigir |
| O número de fotogramas excede o limite do perfil | Bloqueia **Extrair**, indica o limite e sugere aumentar N, reduzir o intervalo ou passar a Premium |
| O vídeo excede os limites do perfil atual (por exemplo, após downgrade de Premium para Registado) | Bloqueia a extração, indica o limite excedido e sugere Premium; o vídeo não é apagado |
| Quota diária de operações esgotada | Não inicia a extração, informa que a quota foi atingida e quando renova, e sugere Premium |
| O ficheiro de vídeo não pode ser descodificado (codec não suportado ou ficheiro corrompido) | Termina a tarefa com erro claro, devolve a operação reservada e não adiciona imagens ao projeto |
| Falha ou tempo máximo excedido a meio do processamento | Descarta os fotogramas parciais, devolve a operação, informa o utilizador e permite repetir a extração |
| Armazenamento disponível insuficiente para os fotogramas estimados | Não inicia a extração; indica o espaço insuficiente e, caso uma operação tenha sido reservada, devolve-a |



### 2.5 Pós-condições
 
| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | O projeto contém exatamente ⌈(fim − início)/N⌉ novas imagens correspondentes aos instantes solicitados, usando para cada instante o fotograma disponível mais próximo; as imagens estão no formato escolhido e mantêm a resolução do vídeo. O vídeo original permanece inalterado e é consumida uma operação diária apenas no perfil Registado. As imagens ficam disponíveis para as ferramentas de imagem, processamento em lote e download existentes |
| Garantia Mínima | O projeto fica exatamente como estava antes do pedido: nenhuma imagem parcial, vídeo original inalterado, operação reservada devolvida e mensagem de erro apresentada ao utilizador |
 
### 2.6 Regras de Negócio e Restrições
 
| **ID** | **Regra** |
|--------|-----------|
| RN1 | Para efeitos do MVP, a equipa propõe os seguintes limites por perfil: **Anónimo** não pode extrair fotogramas; **Registado**: vídeo ≤ 2 min e ≤ 100 MB, no máximo 50 fotogramas por extração; **Premium**: vídeo ≤ 30 min e ≤ 1 GB, no máximo 500 fotogramas por extração |
| RN2 | Formatos de vídeo aceites: MP4 (H.264/AAC) e WebM. Os fotogramas podem ser exportados em JPEG ou PNG, mantendo a resolução original do vídeo |
| RN3 | O intervalo é [início, fim[, com 0 ≤ início < fim ≤ duração. O passo N é um inteiro ≥ 1 s. Os instantes são início + k·N (k = 0, 1, …), desde que o instante seja inferior a fim, pelo que o número de fotogramas é ⌈(fim − início)/N⌉. Exemplo: [0 s, 60 s[ com N = 5 s dá 12 fotogramas |
| RN4 | Cada extração consome 1 operação da quota diária do perfil Registado (5 operações/dia), independentemente do número de fotogramas. O perfil Premium não tem quota. Cancelamento ou falha devolvem a operação |
| RN5 | A extração é "tudo ou nada": ou são adicionados todos os fotogramas, ou nenhum |
| RN6 | O vídeo original nunca é alterado (operação não destrutiva) |
| RN7 | A extração é assíncrona, com progresso visível. O utilizador pode solicitar o cancelamento enquanto a operação estiver em processamento. Cada projeto tem no máximo 1 processamento ativo |
| RN8 | A pré-visualização de amostra não consome operações |
| RN9 | Os fotogramas extraídos são imagens normais do projeto e seguem as mesmas políticas de proteção, armazenamento e eliminação aplicáveis às restantes imagens do PictuRAS |
 


### 2.7 Assunções
 
| **ID** | **Assunção** |
|--------|--------------|
| A1 | O vídeo está integralmente armazenado e acessível ao serviço no momento do pedido |
| A2 | Assume-se que a solução poderá reutilizar o mecanismo assíncrono existente, sendo necessário acrescentar o processamento específico de vídeo. |
| A3 | Os fotogramas extraídos entram no projeto como imagens normais, sem tipo especial, pelo que a integração com ferramentas, lote e download não exige alterações a esses mecanismos |
| A4 | A extração conta como uma operação para o limite diário do perfil Registado |
| A5 | A extração continua em segundo plano se o utilizador sair do ecrã ou fechar o browser |
| A6 | Os limites de RN1 são valores de MVP, configuráveis e a validar pela equipa |
| A7 | O fotograma selecionado para cada instante solicitado é o fotograma disponível mais próximo desse instante |
| A8 | Cada extração opera sobre um único vídeo; o lote de vídeos fica fora do âmbito |


### 2.8 Questões em Aberto
 
| **ID** | **Questão** |
|--------|-------------|
| Q1 | Os limites por perfil (duração, tamanho, número de fotogramas) estão corretos para o MVP? |
| Q2 | O utilizador deve poder escolher instantes específicos, em vez de um passo regular? |
| Q3 | Os fotogramas extraídos contam para algum limite de imagens por projeto ou de armazenamento por perfil? |
| Q4 | Num projeto partilhado com permissão de edição, a quota consumida é a do dono ou a de quem executa a extração? |
| Q5 | A conclusão deve ser notificada apenas na aplicação ou também por email? 
|Q6 | O utilizador deve escolher o intervalo entre fotogramas em segundos, ou deve também poder indicar diretamente o número máximo de fotogramas pretendido?


### 2.1 Cabeçalho
 
| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-001 |
| **Nome** | Extrair fotogramas de um vídeo para o projeto |
| **Versão** | v1.0 |
| **Autor** | {autores} |
| **Data** | 2026-10-05 |
| **Objetivo** | Permitir ao utilizador obter, a partir de um vídeo do seu projeto, uma sequência de imagens (fotogramas) extraídas a intervalos regulares dentro de um intervalo temporal, para as usar como imagens normais do PictuRAS. |
| **Âmbito** | Módulo de projetos e edição — extração e armazenamento de fotogramas de vídeos, processamento assíncrono e acompanhamento do progresso. |
| **Ator Principal** | Utilizador **Registado** (conta gratuita, autenticado). Variante: utilizador **Premium**. |
| **Stakeholders e Interesses** | - **Utilizador Registado**: obter imagens do vídeo para editar, sem perder operações da quota diária por falhas ou cancelamentos<br>- **Utilizador Premium**: extrações maiores e sem limite diário<br>- **Proprietário do Sistema / Negócio**: reaproveitar as ferramentas de imagem existentes e diferenciar os planos gratuito e premium<br>- **Equipa DevOps / Desenvolvimento**: carga de processamento e de armazenamento controlada<br>- **Administrador / RGPD**: privacidade dos vídeos e das imagens extraídas |
| **Pré-condições** | - O utilizador tem sessão iniciada<br>- O projeto está aberto e contém um vídeo já carregado e válido<br>- O utilizador tem permissão para editar o projeto e o vídeo encontra-se disponível para processamento. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a opção **Extrair fotogramas** |


### 2.2 Fluxo Principal
 
| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador abre o projeto que contém o vídeo | Apresenta o vídeo (player e duração), as operações diárias restantes e o limite de fotogramas do perfil |
| 2 | O utilizador escolhe **Extrair fotogramas** | Apresenta o formulário com os valores por omissão: intervalo = vídeo completo, 1 fotograma a cada 5 s, formato JPEG |
| 3 | O utilizador define o intervalo [início, fim[, o passo N (em segundos) e o formato (JPEG ou PNG) | Valida os parâmetros em tempo real e mostra o número de fotogramas que serão extraídos |
| 4 | O utilizador clica **Extrair** | Verifica os limites aplicáveis, reserva a operação da quota (quando aplicável) e cria uma tarefa de extração assíncrona. |
| 5 | — | Mostra o ecrã de progresso (fotogramas concluídos / total) e disponibiliza a opção Cancelar enquanto a operação estiver em processamento. |
| 6 | — | O sistema extrai, para cada instante solicitado, o fotograma disponível mais próximo, e comunica o progresso ao utilizador. |
| 7 | — | Ao concluir, adiciona todos os fotogramas ao projeto como imagens, confirma o consumo da operação e notifica o utilizador |
| 8 | O utilizador consulta os fotogramas na galeria do projeto | Apresenta as imagens extraídas, cada uma com o instante de origem, utilizáveis como qualquer outra imagem do projeto |


### 2.3 Fluxos Alternativos
 
| **Fluxo** | **Descrição** |
|-----------|---------------|
| FA1 – Pré-visualizar amostra | Passo 3: o utilizador pede pré-visualização → o sistema mostra uma pequena amostra representativa dos fotogramas a extrair, sem criar tarefa nem consumir operação → volta ao passo 3 |
| FA2 – Cancelar extração | Passos 5–6: o utilizador clica **Cancelar** → o sistema interrompe o processamento assim que possível, descarta os fotogramas já gerados, devolve a operação reservada e mantém o projeto como estava antes. |
| FA3 – Utilizador abandona durante o processamento | Passos 5–6: o utilizador fecha o separador ou sai do projeto → a extração continua em segundo plano; ao regressar, o utilizador vê o estado atual ou o resultado final |
| FA4 – Utilizador Premium | Passo 4: o sistema não verifica nem consome quota diária e aplica os limites do perfil Premium (RN1) |
| FA5 – Aceitar ajuste sugerido | Passo 3: se o número de fotogramas exceder o limite do perfil, o sistema propõe o menor passo N que respeita o limite → se o utilizador aceitar, o formulário é atualizado e volta ao passo 3 |


### 2.4 Exceções
 
| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| Parâmetros inválidos (início ≥ fim, fim superior à duração do vídeo, N inferior a 1 s ou não inteiro) | Bloqueia **Extrair** e indica o parâmetro em causa e como o corrigir |
| O número de fotogramas excede o limite do perfil | Bloqueia **Extrair**, indica o limite e sugere aumentar N, reduzir o intervalo ou passar a Premium |
| O vídeo excede os limites do perfil atual (por exemplo, após downgrade de Premium para Registado) | Bloqueia a extração, indica o limite excedido e sugere Premium; o vídeo não é apagado |
| Quota diária de operações esgotada | Não inicia a extração, informa que a quota foi atingida e quando renova, e sugere Premium |
| O ficheiro de vídeo não pode ser descodificado (codec não suportado ou ficheiro corrompido) | Termina a tarefa com erro claro, devolve a operação reservada e não adiciona imagens ao projeto |
| Falha ou tempo máximo excedido a meio do processamento | Descarta os fotogramas parciais, devolve a operação, informa o utilizador e permite repetir a extração |
| Armazenamento disponível insuficiente para os fotogramas estimados | Não inicia a extração; indica o espaço insuficiente e, caso uma operação tenha sido reservada, devolve-a |



### 2.5 Pós-condições
 
| **Tipo** | **Resultado** |
|----------|---------------|
| Garantia de Sucesso | O projeto contém exatamente ⌈(fim − início)/N⌉ novas imagens correspondentes aos instantes solicitados, usando para cada instante o fotograma disponível mais próximo; as imagens estão no formato escolhido e mantêm a resolução do vídeo. O vídeo original permanece inalterado e é consumida uma operação diária apenas no perfil Registado. As imagens ficam disponíveis para as ferramentas de imagem, processamento em lote e download existentes |
| Garantia Mínima | O projeto fica exatamente como estava antes do pedido: nenhuma imagem parcial, vídeo original inalterado, operação reservada devolvida e mensagem de erro apresentada ao utilizador |
 
### 2.6 Regras de Negócio e Restrições
 
| **ID** | **Regra** |
|--------|-----------|
| RN1 | Para efeitos do MVP, a equipa propõe os seguintes limites por perfil: **Anónimo** não pode extrair fotogramas; **Registado**: vídeo ≤ 2 min e ≤ 100 MB, no máximo 50 fotogramas por extração; **Premium**: vídeo ≤ 30 min e ≤ 1 GB, no máximo 500 fotogramas por extração |
| RN2 | Formatos de vídeo aceites: MP4 (H.264/AAC) e WebM. Os fotogramas podem ser exportados em JPEG ou PNG, mantendo a resolução original do vídeo |
| RN3 | O intervalo é [início, fim[, com 0 ≤ início < fim ≤ duração. O passo N é um inteiro ≥ 1 s. Os instantes são início + k·N (k = 0, 1, …), desde que o instante seja inferior a fim, pelo que o número de fotogramas é ⌈(fim − início)/N⌉. Exemplo: [0 s, 60 s[ com N = 5 s dá 12 fotogramas |
| RN4 | Cada extração consome 1 operação da quota diária do perfil Registado (5 operações/dia), independentemente do número de fotogramas. O perfil Premium não tem quota. Cancelamento ou falha devolvem a operação |
| RN5 | A extração é "tudo ou nada": ou são adicionados todos os fotogramas, ou nenhum |
| RN6 | O vídeo original nunca é alterado (operação não destrutiva) |
| RN7 | A extração é assíncrona, com progresso visível. O utilizador pode solicitar o cancelamento enquanto a operação estiver em processamento. Cada projeto tem no máximo 1 processamento ativo |
| RN8 | A pré-visualização de amostra não consome operações |
| RN9 | Os fotogramas extraídos são imagens normais do projeto e seguem as mesmas políticas de proteção, armazenamento e eliminação aplicáveis às restantes imagens do PictuRAS |
 


### 2.7 Assunções
 
| **ID** | **Assunção** |
|--------|--------------|
| A1 | O vídeo está integralmente armazenado e acessível ao serviço no momento do pedido |
| A2 | Assume-se que a solução poderá reutilizar o mecanismo assíncrono existente, sendo necessário acrescentar o processamento específico de vídeo. |
| A3 | Os fotogramas extraídos entram no projeto como imagens normais, sem tipo especial, pelo que a integração com ferramentas, lote e download não exige alterações a esses mecanismos |
| A4 | A extração conta como uma operação para o limite diário do perfil Registado |
| A5 | A extração continua em segundo plano se o utilizador sair do ecrã ou fechar o browser |
| A6 | Os limites de RN1 são valores de MVP, configuráveis e a validar pela equipa |
| A7 | O fotograma selecionado para cada instante solicitado é o fotograma disponível mais próximo desse instante |
| A8 | Cada extração opera sobre um único vídeo; o lote de vídeos fica fora do âmbito |


### 2.8 Questões em Aberto
 
| **ID** | **Questão** |
|--------|-------------|
| Q1 | Os limites por perfil (duração, tamanho, número de fotogramas) estão corretos para o MVP? |
| Q2 | O utilizador deve poder escolher instantes específicos, em vez de um passo regular? |
| Q3 | Os fotogramas extraídos contam para algum limite de imagens por projeto ou de armazenamento por perfil? |
| Q4 | Num projeto partilhado com permissão de edição, a quota consumida é a do dono ou a de quem executa a extração? |
| Q5 | A conclusão deve ser notificada apenas na aplicação ou também por email? 
|Q6 | O utilizador deve escolher o intervalo entre fotogramas em segundos, ou deve também poder indicar diretamente o número máximo de fotogramas pretendido?
 

---

## 3. Utilização de agentes de IA

| **Ferramenta / skill** | **Tarefa apoiada** | **Validação realizada pela equipa** |
|------------------------|--------------------|--------------------------------------|
| ChatGPT | Apoio na revisão da linguagem utilizada no caso de uso, com foco na clareza e na redução de ambiguidades. | A equipa verificou se as formulações descrevem comportamento observável do sistema e evitam antecipar decisões de implementação ainda não definidas. |


---

## ✅ Lista de verificação antes de entregar (Exercício 1)

- [ ] Secções 0 a 3 preenchidas e texto de ajuda (`>` e `{…}`) removido.
- [ ] Funcionalidade de vídeo escolhida **e justificada** no contexto do MVP.
- [ ] Ator principal identificado, com o respetivo perfil.
- [ ] Caso de uso com fluxo principal, **≥1 fluxo alternativo** e **≥1 exceção específica de vídeo**.
- [ ] Pós-condições com garantia de sucesso **e** garantia mínima.
- [ ] Regras de negócio e restrições preenchidas.
- [ ] Assunções e questões em aberto registadas.
- [ ] Utilização de agentes de IA documentada.

---
---

## 4. Esboço de requisitos derivados

### 4.1 Requisitos de Sistema

| **ID** | **Requisito** | **Tipo** | **Prioridade** | **Novo/Alt** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|--------------|------------|--------------------|
| REQ-VID-COM-001 | O sistema deve permitir selecionar apenas vídeos identificados, acessíveis e válidos no contexto do projeto ou biblioteca do utilizador. | F | Must (em revisão) | Estender | UC-VID-001 a UC-VID-005; FR-VID-COMMON-001 | Testar seleção sem vídeo, vídeo sem permissão, vídeo inexistente e vídeo elegível. |
| REQ-VID-COM-002 | O sistema deve preservar o vídeo original, sem o substituir, alterar ou eliminar durante ou após qualquer operação. | F/NF | Must (em revisão) | Estender | UC-VID-001 a UC-VID-005; FR-VID-COMMON-002; NFR-VID-002 | Comparar identificador, conteúdo e disponibilidade do original antes e depois de operações concluídas, canceladas e falhadas. |
| REQ-VID-COM-003 | O sistema deve disponibilizar um resultado apenas depois de o processamento terminar com sucesso e deve associá-lo ao projeto ou biblioteca aplicável. | F | Must (em revisão) | Estender | Garantias de sucesso dos cinco casos; FR-VID-COMMON-003 | Confirmar que resultados concluídos são consultáveis e que resultados parciais não aparecem na galeria. |
| REQ-VID-COM-004 | O sistema deve validar todos os parâmetros específicos da operação antes de criar ou iniciar a tarefa de processamento. | F | Must (em revisão) | Novo | UC-VID-001 passo 4; UC-VID-003 passo 4; UC-VID-005 passos 3-4; FR-VID-COMMON-004 | Submeter parâmetros inválidos e verificar que a tarefa não é criada e que o erro identifica a correção necessária. |
| REQ-VID-TRIM-001 | O sistema deve permitir definir um instante inicial e um instante final e rejeitar intervalos em que início seja maior ou igual a fim ou esteja fora da duração do vídeo. | F | Must (em revisão) | Novo | UC-VID-001 passos 2-4; RN1-RN2; FR-VID-TRIM-001 | Testar intervalos válidos, invertidos, nulos e fora dos limites da duração. |
| REQ-VID-TRIM-002 | O sistema deve produzir um novo vídeo correspondente ao intervalo temporal validado, mantendo o original disponível. | F | Must (em revisão) | Novo | UC-VID-001 objetivo, passo 6 e garantia de sucesso; FR-VID-TRIM-002 | Verificar os limites temporais do resultado, a disponibilidade do original e a ausência de segmento publicado em caso de falha. |
| REQ-VID-AUDIO-001 | O sistema deve produzir uma nova versão do vídeo sem streams de áudio, preservando a componente visual, ou rejeitar o pedido quando não existir áudio conforme a decisão aprovada. | F | Must (em revisão) | Novo | UC-VID-002 objetivo, passos 2-5 e RN1-RN3; FR-VID-AUDIO-001 | Processar vídeo com áudio, inspecionar a ausência de streams de áudio no resultado e testar vídeo sem áudio. |
| REQ-VID-SPEED-001 | O sistema deve aceitar apenas um fator de velocidade superior a zero e dentro dos limites aprovados, apresentando a duração estimada antes da confirmação. | F | Must (em revisão) | Novo | UC-VID-003 passos 2-4; RN1-RN2; FR-VID-SPEED-001 | Testar valores nulos, negativos, zero, fora dos limites e valores válidos com recálculo da duração. |
| REQ-VID-SPEED-002 | O sistema deve produzir um novo vídeo com o fator de velocidade confirmado, sem alterar o vídeo original. | F | Must (em revisão) | Novo | UC-VID-003 passos 5-7; RN3-RN4; FR-VID-SPEED-002 | Comparar duração e ritmo do resultado com o fator confirmado e verificar a preservação do original. |
| REQ-VID-WATERMARK-001 | O sistema deve permitir configurar marca de água textual ou gráfica, validando conteúdo, posição, tamanho e transparência dentro dos limites aprovados. | F | Must (em revisão) | Novo | UC-VID-004 passos 1-4; FA1-FA2; FR-VID-WATERMARK-001 | Testar texto, imagem válida, imagem inválida e parâmetros fora da área visível ou dos limites. |
| REQ-VID-WATERMARK-002 | O sistema deve aplicar a configuração confirmada de forma consistente aos fotogramas do vídeo e guardar o resultado como novo ficheiro. | F | Must (em revisão) | Novo | UC-VID-004 passos 5-9; RN1/RN6; FR-VID-WATERMARK-002 | Inspecionar fotogramas no início, meio e fim, confirmar a mesma configuração e verificar o resultado armazenado. |
| REQ-VID-FRAMES-001 | O sistema deve permitir definir intervalo, passo regular e formato JPEG ou PNG, mostrando o número estimado de fotogramas antes da confirmação. | F | Must (em revisão) | Novo | UC-VID-005 passos 2-4; RN2-RN3; FR-VID-FRAMES-001 | Testar parâmetros válidos e inválidos, formatos permitidos e cálculo da estimativa apresentada. |
| REQ-VID-FRAMES-002 | O sistema deve adicionar todos os fotogramas válidos ao projeto como imagens ou rejeitar o conjunto inteiro, sem publicar fotogramas parciais. | F | Must (em revisão) | Estender | UC-VID-005 passos 5-8; RN5-RN9; FR-VID-FRAMES-002 | Simular sucesso, falha e cancelamento e verificar a propriedade tudo-ou-nada no projeto. |
| REQ-VID-FRAMES-003 | O sistema deve permitir pré-visualizar uma amostra sem criar a tarefa final, alterar o projeto ou consumir quota. | F | Should (em revisão) | Novo | UC-VID-005 FA1 e RN8; FR-VID-FRAMES-003 | Solicitar amostra e confirmar ausência de tarefa final, resultado persistente e consumo de quota. |
| REQ-VID-AUTH-001 | O sistema deve exigir um JWT válido nas operações que requerem sessão ou acesso a projeto privado. | F/NF | Must (em revisão) | Estender | UC-VID-004 e UC-VID-005 pré-condições; FR-VID-AUTH-001; NFR-VID-001 | Testar pedido sem token, token inválido, utilizador autenticado e acesso a projeto privado. |
| REQ-VID-AUTH-002 | O sistema deve verificar que o utilizador é proprietário ou tem permissão de edição antes de criar, guardar ou associar resultados. | F | Must (em revisão) | Estender | UC-VID-004 e UC-VID-005 pré-condições; FR-VID-AUTH-002 | Testar permissões read, edit e proprietário em projeto próprio e partilhado. |
| REQ-VID-QUOTA-001 | O sistema deve verificar, reservar, confirmar ou devolver quota segundo a política aprovada para cada perfil e operação. | F | Must (em revisão) | Estender | UC-VID-002 exceção; UC-VID-005 passo 4, FA2, FA4; FR-VID-QUOTA-001 | Testar quota disponível, quota esgotada, Premium, falha e cancelamento, mantendo a política como configurável. |
| REQ-VID-VALID-001 | O sistema deve validar a existência, descodificação, formato, codec e streams necessárias do vídeo antes do processamento. | F | Must (em revisão) | Novo | Exceções dos cinco casos; FR-VID-VALIDATION-001; NFR-VID-005 | Submeter ficheiros válidos, corrompidos e fora da matriz de formatos/codecs e verificar mensagens determinísticas. |
| REQ-VID-VALID-002 | O sistema deve validar tamanho, duração, número de fotogramas, tarefas ativas e armazenamento contra os limites aprovados antes de reservar recursos. | F | Must (em revisão) | Novo | Exceções dos cinco casos; UC-VID-005 RN1; FR-VID-VALIDATION-002; NFR-VID-003 | Testar cada limite e confirmar rejeição antes da criação da tarefa ou consumo de recursos. |
| REQ-VID-STORAGE-001 | O sistema deve armazenar e recuperar vídeos e resultados com identificadores distintos para original, temporários e resultados, respeitando autorização. | F | Must (em revisão) | Estender | Pré-condições e garantias dos cinco casos; FR-VID-STORAGE-001 | Confirmar identificação, separação de objetos, URLs autorizadas e ausência de referências após falha de armazenamento. |
| REQ-VID-STORAGE-002 | O sistema deve gerir o ciclo de vida de resultados concluídos, falhados, cancelados e temporários segundo a política de retenção aprovada. | F | Must (em revisão) | Estender | Garantias mínimas dos cinco casos; FR-VID-STORAGE-002; D-VID-007 | Testar criação, consulta, invalidação, eliminação e retenção de cada estado de resultado. |
| REQ-VID-TASK-001 | O sistema deve executar operações demoradas através de tarefas identificáveis e devolver o estado inicial sem manter o pedido HTTP aberto até à conclusão. | F | Must (em revisão) | Estender | UC-VID-004 passo 5; UC-VID-005 passos 4-6; FR-VID-TASK-001 | Confirmar identificador, estado consultável e conclusão independente do pedido original. |
| REQ-VID-TASK-002 | O sistema deve comunicar estados queued, processing e completed, failed ou cancelled, além de progresso monotonicamente crescente quando mensurável. | F | Should (em revisão) | Estender | UC-VID-004 passo 7; UC-VID-005 passos 5-6; FR-VID-TASK-002; NFR-VID-006 | Observar eventos de estado e progresso e confirmar que não há progresso depois de um estado terminal. |
| REQ-VID-TASK-003 | O sistema deve permitir cancelar uma tarefa autorizada em processamento e impedir a publicação de resultados parciais. | F | Should (em revisão) | Estender | UC-VID-001/003 FA4.2; UC-VID-004 FA3; UC-VID-005 FA2; FR-VID-TASK-003 | Cancelar antes e durante o processamento e verificar estado cancelled, limpeza e ausência de resultado parcial. |
| REQ-VID-ERROR-001 | O sistema deve comunicar erros funcionais com categoria ou código estável, indicando a correção esperada sem expor segredos ou detalhes internos. | F/NF | Must (em revisão) | Estender | Exceções dos cinco casos; FR-VID-ERROR-001 | Testar erro de parâmetro, formato, limite, quota e processamento e inspecionar a resposta produzida. |
| REQ-VID-ERROR-002 | Em falha, expiração ou cancelamento, o sistema deve manter o projeto e o original no último estado consistente e limpar ou invalidar artefactos parciais. | F/NF | Must (em revisão) | Estender | Garantias mínimas dos cinco casos; FR-VID-ERROR-002; NFR-VID-002 | Injetar falhas em validação, processamento e armazenamento e verificar integridade do projeto e limpeza. |
| REQ-VID-NFR-001 | O acesso a vídeos, resultados e URLs deve respeitar autenticação, autorização, expiração e controlo de acesso do armazenamento. | NF | Must (em revisão) | Estender | FR-VID-AUTH-001/002; NFR-VID-001 | Testes de autorização e inspeção de URLs e logs sem tokens ou credenciais. |
| REQ-VID-NFR-002 | O sistema deve manter identificadores correlacionáveis entre pedido, tarefa, input, output, utilizador, projeto e estado final. | NF | Must (em revisão) | Estender | FR-VID-TASK-001; FR-VID-STORAGE-002; NFR-VID-004 | Consultar uma tarefa autorizada e confirmar rastreabilidade completa sem dados sensíveis. |
| REQ-VID-NFR-003 | O sistema deve aceitar e produzir apenas formatos e codecs explicitamente aprovados e documentar incompatibilidades de forma determinística. | NF | Must (em revisão) | Novo | D-VID-002; NFR-VID-005 | Testar a matriz aprovada e ficheiros fora da matriz, verificando descodificação do resultado. |

Todos os requisitos acima são candidatos e permanecem **em revisão**. As prioridades `Must` e `Should` são propostas, não decisões aprovadas.

### 4.2 Impacto no sistema existente

| **Elemento existente afetado** | **Impacto (Manter / Estender / Alterar)** | **Descrição do impacto** | **Requisitos relacionados** |
|--------------------------------|-------------------------------------------|--------------------------|------------------------------|
| `apiGateway/routes/projects.js` e rotas de projetos | Estender | Expor operações de vídeo, validar autorização, parâmetros, limites e estado das tarefas, preservando as rotas de imagem existentes. | REQ-VID-COM-001/004, REQ-VID-AUTH-001/002, REQ-VID-VALID-001/002, REQ-VID-TASK-001, REQ-VID-ERROR-001 |
| `projects/routes/projects.js` | Estender | Integrar seleção de vídeos, criação de resultados, permissões de edição e associação de fotogramas ao projeto; o código atual é orientado a imagens. | REQ-VID-COM-001/003, REQ-VID-COM-002, REQ-VID-FRAMES-002, REQ-VID-STORAGE-002 |
| Controllers e modelos de projetos/resultados | Alterar | Representar vídeos, metadados, tarefas e resultados sem forçar vídeos nos modelos atuais de imagens; manter referências ao original. | REQ-VID-COM-002/003, REQ-VID-STORAGE-001/002, REQ-VID-NFR-002 |
| `projects/utils/project_msg.js` | Estender | Adicionar mensagens e filas específicas para tarefas de vídeo, mantendo o padrão RabbitMQ/WebSocket existente e definindo estados e progresso. | REQ-VID-TASK-001/002/003, REQ-VID-ERROR-001 |
| RabbitMQ e workers de processamento | Estender | Criar processamento de vídeo para trim, áudio, velocidade, marca de água e fotogramas; validar streams e produzir resultados temporários. | REQ-VID-TRIM-001/002, REQ-VID-AUDIO-001, REQ-VID-SPEED-001/002, REQ-VID-WATERMARK-001/002, REQ-VID-FRAMES-001/002 |
| `imageStorageService` e SeaweedFS/S3 | Estender | Suportar upload, leitura, URLs autorizadas, temporários, resultados de vídeo e limpeza sem colisão com objetos de imagem. | REQ-VID-COM-002/003, REQ-VID-STORAGE-001/002, REQ-VID-ERROR-002, REQ-VID-NFR-001 |
| Autenticação JWT e `shareAuth` | Estender | Reutilizar JWT e permissões read/edit, acrescentando verificações específicas para operar e guardar resultados de vídeo em projetos privados ou partilhados. | REQ-VID-AUTH-001/002, REQ-VID-NFR-001 |
| Quotas e subscrições (`users`, `subscriptions`) | Estender | Definir e aplicar quotas, limites por perfil e identidade responsável em projetos partilhados; não reutilizar automaticamente a quota atual de ferramentas de imagem. | REQ-VID-QUOTA-001, REQ-VID-VALID-002, D-VID-001, D-VID-005, D-VID-008 |
| `wsGateway` e cliente WebSocket | Estender | Comunicar estados, progresso, conclusão, falha e cancelamento de tarefas de vídeo sem emitir eventos após um estado terminal. | REQ-VID-TASK-002/003, REQ-VID-ERROR-002, REQ-VID-NFR-002 |
| Frontend de projetos e ferramentas (`frontend/components`, `frontend/lib/tool-types.ts`) | Estender | Adicionar seleção de vídeo, formulários para parâmetros, previsão, progresso, cancelamento e visualização dos resultados; os tipos atuais são centrados em ferramentas de imagem. | REQ-VID-TRIM-001, REQ-VID-SPEED-001, REQ-VID-WATERMARK-001, REQ-VID-FRAMES-001/003, REQ-VID-TASK-002 |
| Ferramenta de marca de água para imagens | Estender | Reaproveitar regras de configuração apenas como referência; o processamento de vídeo deve aplicar a marca aos fotogramas e recompor um novo vídeo. | REQ-VID-WATERMARK-001/002 |
| Ferramentas Python em `Tools/` | Estender | Acrescentar descodificação, transformação temporal, remoção de áudio, composição de marca e extração de fotogramas, sem assumir que as ferramentas atuais de imagem suportam vídeo. | REQ-VID-TRIM-002, REQ-VID-AUDIO-001, REQ-VID-SPEED-002, REQ-VID-WATERMARK-002, REQ-VID-FRAMES-001/002 |
| Persistência MongoDB e resultados | Alterar | Guardar metadados de vídeo, relação input/output, estado de tarefa, instantes dos fotogramas e limpeza transacional ou compensatória. | REQ-VID-COM-003, REQ-VID-FRAMES-002, REQ-VID-STORAGE-002, REQ-VID-ERROR-002, REQ-VID-NFR-002 |

O impacto é uma extensão brownfield relevante: JWT, RabbitMQ, WebSocket, projetos, storage e padrões de resultados existentes podem ser reutilizados, mas o suporte efetivo a vídeo, o modelo de recurso, os workers e o contrato de tarefas ainda não estão confirmados no código atual.

### 4.3 Matriz de Rastreabilidade

| **Elemento do Caso de Uso** | **Descrição abreviada** | **Requisito(s) de Sistema** |
|------------------------------|-------------------------|------------------------------|
| UC-VID-001 pré-condições e passo 1 | Selecionar vídeo acessível e elegível | REQ-VID-COM-001, REQ-VID-AUTH-001/002, REQ-VID-STORAGE-001 |
| UC-VID-001 passos 2-4; RN1-RN2 | Definir e validar início e fim do intervalo | REQ-VID-COM-004, REQ-VID-TRIM-001, REQ-VID-VALID-002 |
| UC-VID-001 passo 5 | Iniciar processamento do recorte | REQ-VID-TASK-001, REQ-VID-QUOTA-001 |
| UC-VID-001 passos 6-7; RN3 | Produzir resultado e preservar original | REQ-VID-TRIM-002, REQ-VID-COM-002/003, REQ-VID-STORAGE-002 |
| UC-VID-001 FA4.1-FA4.2 e exceções | Alterar/cancelar intervalo e tratar formato, limites e falha | REQ-VID-TASK-003, REQ-VID-VALID-001/002, REQ-VID-ERROR-001/002 |
| UC-VID-002 pré-condições e passos 1-2 | Selecionar vídeo e detetar stream de áudio | REQ-VID-COM-001, REQ-VID-AUDIO-001, REQ-VID-VALID-001 |
| UC-VID-002 passos 3-5; RN1-RN3 | Confirmar operação e produzir vídeo silencioso | REQ-VID-AUDIO-001, REQ-VID-COM-002/003, REQ-VID-TASK-001 |
| UC-VID-002 passo 6 e exceções | Disponibilizar resultado ou comunicar ausência de áudio, quota e falha | REQ-VID-COM-003, REQ-VID-QUOTA-001, REQ-VID-ERROR-001/002 |
| UC-VID-003 pré-condições e passos 1-2 | Selecionar vídeo e apresentar controlo de velocidade | REQ-VID-COM-001, REQ-VID-SPEED-001, REQ-VID-VALID-001 |
| UC-VID-003 passo 3; RN1-RN3 | Calcular duração e validar fator | REQ-VID-COM-004, REQ-VID-SPEED-001, REQ-VID-VALID-002 |
| UC-VID-003 passos 4-7; RN4 | Processar resultado com velocidade confirmada | REQ-VID-SPEED-002, REQ-VID-COM-002/003, REQ-VID-TASK-001 |
| UC-VID-003 FA4.1-FA4.2 e exceções | Alterar/cancelar operação e tratar valor, codec, limites e falha | REQ-VID-TASK-003, REQ-VID-VALID-001/002, REQ-VID-ERROR-001/002 |
| UC-VID-004 pré-condições e passos 1-3 | Autenticar, selecionar vídeo e configurar texto/imagem | REQ-VID-COM-001, REQ-VID-AUTH-001/002, REQ-VID-WATERMARK-001 |
| UC-VID-004 passo 4; RN2-RN3 | Validar posição, tamanho e transparência | REQ-VID-COM-004, REQ-VID-WATERMARK-001, REQ-VID-VALID-001 |
| UC-VID-004 passos 5-7; RN1 | Criar tarefa, aplicar marca e comunicar progresso | REQ-VID-WATERMARK-002, REQ-VID-TASK-001/002 |
| UC-VID-004 passos 8-9; RN4/RN6 | Recompor, guardar e disponibilizar novo vídeo | REQ-VID-COM-002/003, REQ-VID-STORAGE-001/002 |
| UC-VID-004 FA1-FA3 e EX1-EX4 | Aceitar imagem, alterar configuração, cancelar e tratar falhas | REQ-VID-TASK-003, REQ-VID-VALID-001/002, REQ-VID-ERROR-001/002 |
| UC-VID-005 pré-condições e passos 1-2 | Autenticar, abrir projeto e apresentar limites | REQ-VID-COM-001, REQ-VID-AUTH-001/002, REQ-VID-VALID-002 |
| UC-VID-005 passo 3; RN2-RN3 | Definir intervalo, passo, formato e estimativa | REQ-VID-COM-004, REQ-VID-FRAMES-001, REQ-VID-VALID-001/002 |
| UC-VID-005 passo 4; RN1/RN4 | Validar limites, reservar quota e criar tarefa | REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-VALID-002 |
| UC-VID-005 passos 5-6; RN7 | Executar extração assíncrona, progresso e cancelamento | REQ-VID-FRAMES-002, REQ-VID-TASK-001/002/003 |
| UC-VID-005 passos 7-8; RN5-RN9 | Adicionar todos os fotogramas como imagens e manter original | REQ-VID-FRAMES-002, REQ-VID-COM-002/003, REQ-VID-STORAGE-002 |
| UC-VID-005 FA1 | Pré-visualizar amostra sem resultado ou quota | REQ-VID-FRAMES-003 |
| UC-VID-005 FA2-FA5 e exceções | Cancelar, continuar em segundo plano, ajustar passo e recuperar de erros | REQ-VID-TASK-002/003, REQ-VID-QUOTA-001, REQ-VID-ERROR-001/002 |
| Todos os casos: garantias mínimas e exceções | Preservar consistência, comunicar erros e não publicar parciais | REQ-VID-COM-002, REQ-VID-ERROR-001/002, REQ-VID-NFR-001/002 |
| Todos os casos: formatos e codecs | Aceitar apenas matriz de compatibilidade aprovada | REQ-VID-VALID-001, REQ-VID-NFR-003 |

As referências `UC-VID-001` a `UC-VID-005` seguem a normalização dos artefactos de requisitos: recorte temporal, remoção de áudio, alteração de velocidade, marca de água e extração de fotogramas, respetivamente. Todos os requisitos permanecem candidatos em revisão; as decisões D-VID-001 a D-VID-010 continuam a condicionar a aprovação final.
