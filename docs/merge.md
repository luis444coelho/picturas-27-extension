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


| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Descarregamento de um vídeo do projeto |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** e **Premium** com permissão de leitura (ou superior) no projeto. O **Anónimo** fica excluído, porque os vídeos residem em projetos autenticados (DQ-024). |

**Justificação no contexto do MVP**

Sem descarregamento, os resultados das operações de vídeo ficam presos na plataforma. É a forma mais direta de o utilizador obter valor do processamento e valida a entrega segura de ficheiros grandes (URLs assinados e retoma) sem sobrecarregar o API Gateway.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Consulta das informações de um vídeo |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** e **Premium** com permissão de leitura (ou superior) no projeto. O **Anónimo** fica excluído (DQ-024). |

**Justificação no contexto do MVP**

Conhecer as características técnicas do vídeo é necessário para parametrizar corretamente o recorte, o redimensionamento, a conversão e a junção. Reutiliza os metadados já extraídos na ingestão, com custo computacional praticamente nulo.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Ajuste das propriedades visuais (brilho, contraste e saturação) de um vídeo |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (sujeito à quota diária de operações) e **Premium** (sem quota). O **Anónimo** fica excluído (DQ-024). |

**Justificação no contexto do MVP**

Corrigir vídeos escuros ou com cores pouco vivas é uma das edições mais frequentes. Estende ao vídeo as ferramentas de brilho, contraste e saturação que o PictuRAS já oferece para imagens e valida o processamento fotograma a fotograma com pré-visualização.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Aplicação de filtros visuais predefinidos a um vídeo |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (sujeito à quota diária de operações) e **Premium** (sem quota). O **Anónimo** fica excluído (DQ-024). |

**Justificação no contexto do MVP**

Os filtros predefinidos dão um estilo ao vídeo com um clique, sem conhecimento técnico. Um catálogo fechado mantém o resultado previsível e testável no MVP e serve de passo típico nas cadeias de operações.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Redimensionamento de um vídeo |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (sujeito à quota diária e ao teto de 1920×1080) e **Premium** (sem quota, teto de 3840×2160). O **Anónimo** fica excluído (DQ-024). |

**Justificação no contexto do MVP**

Reduzir a resolução é essencial para partilhar vídeos e para os adaptar a plataformas com limites de tamanho. Valida a transformação espacial do vídeo com as regras de compatibilidade do codec e tetos por perfil.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Rotação e espelho de um vídeo |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (sujeito à quota diária de operações) e **Premium** (sem quota). O **Anónimo** fica excluído (DQ-024). |

**Justificação no contexto do MVP**

Vídeos gravados com o telemóvel na orientação errada são um problema comum. Rodar e espelhar corrige-o sem perda de área visível e estende ao vídeo as ferramentas de rotação e reflexão já existentes para imagens.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Conversão do formato de um vídeo |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (sujeito à quota diária de operações) e **Premium** (sem quota). O **Anónimo** fica excluído (DQ-024). |

**Justificação no contexto do MVP**

A conversão permite usar os vídeos noutras aplicações e dispositivos e trazer para o projeto ficheiros de câmaras e de arquivos antigos (e.g. AVI para MP4). Valida a matriz de formatos e codecs e a cópia direta de streams sem perda de qualidade.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Junção de vídeos |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (sujeito à quota diária, até 10 vídeos) e **Premium** (sem quota, até 50 vídeos). O **Anónimo** fica excluído (DQ-024). |

**Justificação no contexto do MVP**

Juntar clips num único vídeo é a base de qualquer montagem. Valida a composição de vários recursos num só resultado, incluindo a normalização de clips heterogéneos e a rastreabilidade de múltiplas origens.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Encadeamento de operações de edição num vídeo |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (N créditos por cadeia de N passos, limitado pela quota diária) e **Premium** (sem quota). O **Anónimo** fica excluído (DQ-024). |

**Justificação no contexto do MVP**

O encadeamento permite realizar uma edição completa — por exemplo, cortar, ajustar cores e remover o áudio — numa única tarefa, sem gerir resultados intermédios. Em conjunto com a junção, cobre o cenário *Movie Maker*: (V1 + filtro de cor) + (V2 + remover som) + (V3 + acelerar) → juntar → + marca de água = 1 vídeo final.

| **Campo** | **Valor** |
|-----------|-----------|
| **Funcionalidade** | Processamento de vários vídeos em lote |
| **Perfil(s) de utilizador abrangido(s)** | **Registado** (custo × vídeos concluídos, até 10 vídeos) e **Premium** (sem quota, até 50 vídeos). O **Anónimo** fica excluído (DQ-024). |

**Justificação no contexto do MVP**

Aplicar a mesma configuração a vários vídeos evita trabalho repetitivo (e.g. redimensionar e marcar uma série de vídeos). Valida a execução de lotes como uma tarefa única, com resultados independentes por vídeo e quota proporcional aos vídeos concluídos.


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
 

### 2.1 UC-VID-006

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-006 |
| **Nome** | Descarregar um vídeo do projeto |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador descarregar para o seu dispositivo um vídeo do projeto — em particular o vídeo resultante de uma operação —, no formato em que se encontra armazenado, sem consumir quota e sem alterar o recurso. |
| **Âmbito** | Módulo de gestão de projetos e armazenamento multimédia do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e permissão de leitura (ou superior) no projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende obter no seu dispositivo o resultado das operações de vídeo para o utilizar fora da plataforma, de forma rápida e sem gastar quota.<br>- **Sistema PictuRAS**: deve garantir que apenas utilizadores autorizados obtêm o ficheiro e que a transferência de ficheiros grandes não sobrecarrega o API Gateway.<br>- **Equipa de Infraestrutura / DevOps**: pretende que as transferências sejam servidas diretamente pelo armazenamento de objetos com URLs temporários e retoma de transferência. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de leitura, edição ou de proprietário sobre o projeto.<br>- O projeto contém pelo menos um recurso de vídeo (original ou resultante) no estado `completed`. |
| **Trigger** | O utilizador seleciona um vídeo na galeria do projeto (ou no reprodutor integrado) e escolhe a opção "Descarregar". |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona um vídeo na galeria do projeto e escolhe a opção "Descarregar". | O sistema verifica a permissão de leitura do utilizador sobre o projeto e o estado do recurso, e apresenta o nome de ficheiro sugerido, o formato e o tamanho do ficheiro. |
| 2 | O utilizador confirma o descarregamento. | O sistema gera um URL assinado temporário (válido durante 15 minutos), associado ao utilizador e ao recurso, sem debitar quota. |
| 3 | — | O navegador inicia a transferência diretamente a partir do armazenamento de objetos (SeaweedFS/S3), com o nome de ficheiro sugerido no formato `<nome-original>_<operação>.<extensão>`. |
| 4 | O utilizador obtém o ficheiro no seu dispositivo. | O sistema regista o evento de descarregamento nos logs com o `correlationId`; o recurso permanece inalterado no projeto. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Descarregamento a partir do reprodutor integrado** | No passo 1, o utilizador escolhe "Descarregar" nos controlos do reprodutor → O fluxo continua no passo 2. |
| **FA2 – Retoma de transferência interrompida** | No passo 3, a ligação é interrompida → Enquanto o URL estiver válido, o navegador retoma a transferência a partir do último byte recebido (pedidos HTTP `Range`), sem recomeçar do início. |
| **FA3 – URL expirado** | No passo 3, o URL assinado expirou antes da conclusão → O utilizador volta a escolher "Descarregar" e o sistema gera um novo URL (regresso ao passo 2). |
| **FA4 – Descarregamento do vídeo original** | No passo 1, o utilizador seleciona o vídeo original (não resultante) → O sistema entrega o ficheiro no formato em que foi carregado (MP4, MOV ou AVI), e não a cópia de pré-visualização. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **O recurso ainda não está concluído (`queued` ou `processing`).** | No passo 1, a opção "Descarregar" está desativada e o sistema informa que o recurso ainda não está disponível (`RESOURCE_NOT_READY`). |
| **O utilizador não tem permissão sobre o projeto.** | No passo 1, o sistema rejeita o pedido com HTTP 403 Forbidden e não gera URL. |
| **O URL é utilizado por outro utilizador ou após expirar.** | No passo 3, o armazenamento recusa o pedido com HTTP 403 Forbidden. |
| **O objeto não existe no armazenamento.** | No passo 2, o sistema informa que o ficheiro não está disponível (`RESOURCE_UNAVAILABLE`) e regista a falha nos logs com o `correlationId`. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | O utilizador dispõe de uma cópia do vídeo no seu dispositivo, no formato armazenado. O recurso no projeto permanece inalterado e a quota diária não é debitada. |
| **Garantia Mínima** | Em caso de erro, nenhum URL válido é exposto a utilizadores não autorizados, o recurso e o projeto permanecem inalterados e a quota não é afetada. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | O descarregamento está disponível para utilizadores Registados e Premium com permissão de leitura, edição ou de proprietário no projeto. Utilizadores Anónimos não têm acesso. |
| **RN2** | O descarregamento não consome créditos da quota diária de operações. |
| **RN3** | Apenas recursos de vídeo no estado `completed` podem ser descarregados. |
| **RN4** | O URL de transferência é assinado, associado ao utilizador e ao recurso, e expira ao fim de 15 minutos. |
| **RN5** | O nome de ficheiro sugerido é composto pelo nome original, um sufixo com a(s) operação(ões) aplicada(s) e a extensão do formato armazenado. |
| **RN6** | O descarregamento não altera, move nem elimina o recurso no projeto. |
| **RN7** | Qualquer recurso de vídeo do projeto pode ser descarregado (original ou resultante), sempre no formato armazenado e nunca na cópia de pré-visualização. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O armazenamento de objetos (SeaweedFS/S3) suporta URLs assinados e pedidos HTTP `Range`. |
| **A2** | O navegador do utilizador suporta a transferência de ficheiros de até 2 GB. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Deve ser possível descarregar vários vídeos de uma só vez? | Sim, apenas para os resultados de um lote, através de um arquivo ZIP (UC-VID-015, FA1). |
| **Q2** | Deve existir um limite diário de descarregamentos? | Não no MVP. O controlo é feito pela expiração dos URLs e pelas permissões do projeto. |

### 2.1 UC-VID-007

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-007 |
| **Nome** | Consultar as informações de um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador consultar as informações técnicas de um vídeo do projeto — duração, resolução, formato, tamanho do ficheiro e taxa de fotogramas — sem criar tarefas de processamento nem consumir quota. |
| **Âmbito** | Módulo de gestão de projetos e visualização do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e permissão de leitura (ou superior) no projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende conhecer as características do vídeo para escolher e parametrizar corretamente as operações (e.g. recorte, redimensionamento, conversão).<br>- **Sistema PictuRAS**: deve apresentar valores coerentes com os metadados extraídos na ingestão, sem custo computacional adicional. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de leitura, edição ou de proprietário sobre o projeto.<br>- O projeto contém pelo menos um recurso de vídeo. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a opção "Informações". |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona um vídeo na galeria do projeto e escolhe a opção "Informações". | O sistema verifica a permissão de leitura e obtém os metadados técnicos persistidos do recurso, sem criar tarefa e sem debitar quota. |
| 2 | — | O sistema apresenta um painel com a duração (`hh:mm:ss.mmm`), a resolução (largura × altura em px), o formato (contentor e codecs de vídeo e de áudio), o tamanho do ficheiro (MB ou GB, com 2 casas decimais) e a taxa de fotogramas (fps, com 2 casas decimais). |
| 3 | O utilizador fecha o painel. | O sistema regressa à vista anterior; o recurso permanece inalterado. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Consulta de um vídeo resultante** | No passo 2, se o vídeo resultar de uma operação, cadeia ou junção → O sistema apresenta adicionalmente a proveniência (vídeo(s) de origem) e a descrição da(s) operação(ões) aplicada(s). |
| **FA2 – Consulta de um original em MOV ou AVI** | No passo 2, o sistema apresenta o formato e os codecs do ficheiro original e não os da cópia de pré-visualização MP4. |
| **FA3 – Consulta a partir do reprodutor integrado** | No passo 1, o utilizador abre o painel nos controlos do reprodutor → O fluxo continua no passo 2. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Algum metadado não está disponível.** | No passo 2, o sistema apresenta o campo como "Indisponível" e regista o aviso (`METADATA_UNAVAILABLE`) nos logs com o `correlationId`. |
| **O utilizador não tem permissão sobre o projeto.** | No passo 1, o sistema rejeita o pedido com HTTP 403 Forbidden. |
| **O recurso ainda está em processamento.** | No passo 1, o sistema apresenta apenas o estado da tarefa (`queued` ou `processing`) e informa que as informações técnicas estarão disponíveis após a conclusão. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | O utilizador visualiza as informações técnicas do vídeo. Nenhuma tarefa é criada, a quota não é debitada e o recurso permanece inalterado. |
| **Garantia Mínima** | Em caso de erro, o projeto e o recurso permanecem inalterados e a quota não é afetada. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | A consulta está disponível para utilizadores Registados e Premium com permissão de leitura, edição ou de proprietário no projeto. |
| **RN2** | A consulta não cria tarefas de processamento e não consome créditos da quota diária. |
| **RN3** | As informações são obtidas dos metadados persistidos na ingestão (UC-VID-000) ou na criação do recurso resultante, sem nova análise do ficheiro. |
| **RN4** | Unidades de apresentação: duração em `hh:mm:ss.mmm`; resolução em px; tamanho em MB (< 1 GB) ou GB; taxa de fotogramas em fps com 2 casas decimais. |
| **RN5** | A consulta é exclusivamente de leitura. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | Os metadados técnicos de todos os recursos de vídeo foram extraídos com FFprobe e persistidos no MongoDB no momento da sua criação. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Devem ser apresentados metadados avançados (bitrate, perfil H.264, canais de áudio)? | Não no MVP. O painel apresenta apenas os cinco atributos do requisito; os metadados avançados ficam para a Fase 2. |

### 2.1 UC-VID-008

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-008 |
| **Nome** | Ajustar as propriedades visuais de um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador ajustar o brilho, o contraste e a saturação de um vídeo do projeto, obtendo um novo vídeo com os ajustes aplicados de forma uniforme a todos os fotogramas, sem alterar o original. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende corrigir vídeos escuros, lavados ou com cores pouco vivas, validando o efeito antes de gastar quota.<br>- **Sistema PictuRAS**: deve aplicar os ajustes com a mesma semântica das ferramentas de imagem existentes (brilho, contraste e saturação) e produzir um resultado consistente.<br>- **Administrador**: pretende garantir que o processamento respeita quotas e limites de infraestrutura. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação "Ajustar Imagem". |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Ajustar Imagem". | O sistema apresenta o vídeo e três controlos deslizantes (brilho, contraste e saturação), todos no valor neutro 1.0. |
| 2 | O utilizador ajusta um ou mais controlos no intervalo 0.0 a 2.0. | O sistema apresenta, em ≤ 1 s, uma pré-visualização estática do primeiro fotograma com os ajustes aplicados. |
| 3 | O utilizador confirma a operação. | O sistema valida que os valores estão no intervalo permitido e que pelo menos um difere do neutro, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado `processing`), aplica os ajustes de forma uniforme a todos os fotogramas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC), preservando a duração, a resolução, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo ajustado na lista de recursos; o vídeo original permanece inalterado. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Repor valores neutros** | No passo 2, o utilizador clica em "Repor" → O sistema repõe os três controlos em 1.0 e atualiza a pré-visualização. |
| **FA2 – Cancelamento antes do início do processamento** | No passo 4, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA3 – Cancelamento durante o processamento** | No passo 5, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA4 – Utilizador com perfil Premium** | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| **FA5 – Utilização como passo de cadeia ou lote** | A operação é configurada como passo de uma cadeia (UC-VID-014) ou aplicada em lote (UC-VID-015) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Valor de ajuste fora do intervalo 0.0 a 2.0.** | No passo 3, o sistema rejeita a operação (`INVALID_ADJUST_PARAMS`), indicando o controlo incorreto. A tarefa não é criada e a quota não é afetada. |
| **Todos os valores no neutro (1.0).** | No passo 3, o sistema bloqueia a confirmação (`NO_CHANGES`) informando que nenhum ajuste foi definido. |
| **Formato ou codec de vídeo não suportado.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 3, o sistema rejeita a operação (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 5, se o worker falhar → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um novo vídeo MP4 com o brilho, o contraste e a saturação ajustados em todos os fotogramas é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. O vídeo original permanece inalterado. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| **RN2** | Cada propriedade (brilho, contraste, saturação) é um fator multiplicativo no intervalo [0.0, 2.0], com passo de 0.05 e valor neutro 1.0, à semelhança das ferramentas de imagem existentes (DQ-020). |
| **RN3** | Pelo menos uma propriedade deve ter valor diferente do neutro. |
| **RN4** | Os ajustes são aplicados de forma uniforme a todos os fotogramas do vídeo. |
| **RN5** | O resultado é gerado em MP4 (H.264/AAC), preservando a duração, a resolução, a taxa de fotogramas e o áudio do original (DQ-013). |
| **RN6** | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| **RN7** | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| **RN8** | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| **RN9** | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| **RN10** | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| **RN11** | A operação pode ser usada como passo de uma cadeia (UC-VID-014) e no processamento em lote (UC-VID-015). |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O FFmpeg (filtro `eq`) permite aplicar brilho, contraste e saturação com semântica equivalente à dos fatores da biblioteca de imagem utilizada nas ferramentas existentes. |
| **A2** | A quota diária é reposta diariamente às 00:00 UTC. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Devem ser suportados outros ajustes (gama, nitidez, temperatura de cor)? | Não no MVP. Os ajustes adicionais ficam para a Fase 2; a temperatura de cor é parcialmente coberta pelos filtros "Frio" e "Quente" (UC-VID-009). |

### 2.1 UC-VID-009

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

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Aplicar Filtro". | O sistema apresenta o vídeo e o catálogo de filtros predefinidos (Preto e Branco, Sépia, Negativo, Vintage, Frio e Quente), cada um com uma miniatura de exemplo sobre o primeiro fotograma. |
| 2 | O utilizador seleciona um filtro do catálogo. | O sistema apresenta, em ≤ 1 s, uma pré-visualização estática do primeiro fotograma com o filtro aplicado. |
| 3 | O utilizador confirma a operação. | O sistema valida que foi selecionado exatamente um filtro existente no catálogo, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado `processing`), aplica o filtro de forma uniforme a todos os fotogramas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC), preservando a duração, a resolução, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo filtrado na lista de recursos; o vídeo original permanece inalterado. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Troca de filtro após pré-visualização** | No passo 2, o utilizador seleciona outro filtro → O sistema substitui a seleção anterior e atualiza a pré-visualização. |
| **FA2 – Cancelamento antes do início do processamento** | No passo 4, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA3 – Cancelamento durante o processamento** | No passo 5, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA4 – Utilizador com perfil Premium** | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| **FA5 – Utilização como passo de cadeia ou lote** | A operação é configurada como passo de uma cadeia (UC-VID-014) ou aplicada em lote (UC-VID-015) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Nenhum filtro selecionado ou filtro inexistente no catálogo.** | No passo 3, o sistema rejeita a operação (`INVALID_FILTER`). A tarefa não é criada e a quota não é afetada. |
| **Formato ou codec de vídeo não suportado.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 3, o sistema rejeita a operação (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 5, se o worker falhar → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um novo vídeo MP4 com o filtro selecionado aplicado a todos os fotogramas é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. O vídeo original permanece inalterado. |

### 2.6 Regras de Negócio e Restrições

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

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | Cada filtro do catálogo é implementável com filtros FFmpeg standard (e.g. `hue`, `colorchannelmixer`, `negate`, `curves`). |
| **A2** | A quota diária é reposta diariamente às 00:00 UTC. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Deve existir controlo de intensidade do filtro? | Não no MVP (Q-ERS-008). A intensidade fica para a Fase 2. |
| **Q2** | Deve ser possível combinar vários filtros? | Sim, mas apenas através do encadeamento de operações (UC-VID-014), com um filtro por passo. |

### 2.1 UC-VID-010

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-010 |
| **Nome** | Redimensionar um vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador alterar a resolução de um vídeo do projeto, selecionando as dimensões de saída pretendidas, e obter um novo vídeo com essas dimensões, sem alterar o original. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende reduzir o tamanho do vídeo para partilha ou adaptá-lo a uma resolução-alvo (e.g. 720p).<br>- **Sistema PictuRAS**: deve garantir dimensões compatíveis com o codec H.264 e com os limites do perfil.<br>- **Administrador**: pretende evitar resoluções excessivas que sobrecarreguem os workers e o armazenamento. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação "Redimensionar". |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Redimensionar". | O sistema apresenta a resolução atual, os campos de largura e altura preenchidos com os valores atuais, o bloqueio de proporção ativo e as predefinições 1080p, 720p, 480p e 360p. |
| 2 | O utilizador escolhe uma predefinição ou introduz a largura (ou a altura) pretendida. | Com a proporção bloqueada, o sistema recalcula a outra dimensão, arredondando-a para o número par mais próximo, e apresenta as dimensões finais. |
| 3 | O utilizador confirma a operação. | O sistema valida que as dimensões são pares, ≥ 128 px, dentro do limite do perfil e diferentes das atuais, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado `processing`), reamostra todos os fotogramas para as dimensões pretendidas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC) com as dimensões exatas, preservando a duração, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo redimensionado na lista de recursos; o vídeo original permanece inalterado. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Desbloqueio da proporção** | No passo 2, o utilizador desativa o bloqueio de proporção e define largura e altura de forma independente → O sistema apresenta um aviso de que a imagem ficará distorcida. O fluxo continua no passo 3. |
| **FA2 – Ampliação acima da resolução original** | No passo 2, as dimensões pretendidas são superiores às originais → O sistema apresenta um aviso de que a ampliação não acrescenta detalhe. O fluxo continua no passo 3. |
| **FA3 – Cancelamento antes do início do processamento** | No passo 4, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA4 – Cancelamento durante o processamento** | No passo 5, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA5 – Utilizador com perfil Premium** | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica o limite de resolução alargado (3840×2160). |
| **FA6 – Utilização como passo de cadeia ou lote** | A operação é configurada como passo de uma cadeia (UC-VID-014) ou aplicada em lote (UC-VID-015) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Dimensões ímpares, inferiores a 128 px ou acima do limite do perfil.** | No passo 3, o sistema rejeita a operação (`INVALID_RESIZE_PARAMS`), indicando a dimensão incorreta e o limite aplicável. A tarefa não é criada e a quota não é afetada. |
| **Dimensões iguais às do vídeo original.** | No passo 3, o sistema bloqueia a confirmação (`NO_CHANGES`). |
| **Formato ou codec de vídeo não suportado.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 3, o sistema rejeita a operação (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 5, se o worker falhar → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um novo vídeo MP4 com exatamente as dimensões confirmadas é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. O vídeo original permanece inalterado. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| **RN2** | A largura e a altura de saída são números inteiros pares, com mínimo de 128 px (requisito de compatibilidade do codec H.264). |
| **RN3** | Limites de resolução de saída por perfil (maior dimensão × menor dimensão): Registado — até 1920×1080; Premium — até 3840×2160 (DQ-022). |
| **RN4** | Por omissão, a proporção original é mantida; o desbloqueio da proporção é permitido mediante aviso de distorção. |
| **RN5** | A ampliação acima da resolução original é permitida, mediante aviso. |
| **RN6** | O resultado é gerado em MP4 (H.264/AAC), preservando a duração, a taxa de fotogramas e o áudio do original (DQ-013). |
| **RN7** | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| **RN8** | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| **RN9** | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| **RN10** | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| **RN11** | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| **RN12** | A operação pode ser usada como passo de uma cadeia (UC-VID-014) e no processamento em lote (UC-VID-015). |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O FFmpeg (filtro `scale`) suporta a reamostragem para as dimensões pretendidas com qualidade adequada. |
| **A2** | Os limites de resolução são valores de MVP, configuráveis e a validar pela equipa. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Com a proporção desbloqueada, deve ser oferecido o preenchimento com barras pretas (*letterbox*) em vez da distorção? | Não no MVP. Com a proporção desbloqueada, a imagem é esticada mediante aviso; o *letterbox* fica para a Fase 2. |

### 2.1 UC-VID-011

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

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Rodar / Espelhar". | O sistema apresenta o vídeo, os botões de rotação no sentido horário (90°, 180°, 270°) e as opções de espelho horizontal e vertical, todos desativados. |
| 2 | O utilizador escolhe um ângulo de rotação e/ou uma ou ambas as opções de espelho. | O sistema apresenta, em ≤ 1 s, uma pré-visualização estática do primeiro fotograma com a transformação combinada (rotação aplicada primeiro, espelho depois) e as dimensões resultantes. |
| 3 | O utilizador confirma a operação. | O sistema valida que o ângulo pertence ao conjunto permitido e que foi definida pelo menos uma transformação, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado `processing`), aplica a transformação a todos os fotogramas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC), com largura e altura trocadas nas rotações de 90° e 270°, preservando a duração, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo transformado na lista de recursos; o vídeo original permanece inalterado. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Alteração da transformação após pré-visualização** | No passo 2, o utilizador altera o ângulo ou as opções de espelho → O sistema atualiza a pré-visualização e as dimensões resultantes. |
| **FA2 – Cancelamento antes do início do processamento** | No passo 4, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA3 – Cancelamento durante o processamento** | No passo 5, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA4 – Utilizador com perfil Premium** | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| **FA5 – Utilização como passo de cadeia ou lote** | A operação é configurada como passo de uma cadeia (UC-VID-014) ou aplicada em lote (UC-VID-015) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Ângulo de rotação fora do conjunto {90°, 180°, 270°}.** | No passo 3, o sistema rejeita a operação (`INVALID_ORIENT_PARAMS`). A tarefa não é criada e a quota não é afetada. |
| **Nenhuma transformação definida (sem rotação e sem espelho).** | No passo 3, o sistema bloqueia a confirmação (`NO_CHANGES`). |
| **Formato ou codec de vídeo não suportado.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 3, o sistema rejeita a operação (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 5, se o worker falhar → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um novo vídeo MP4 com a orientação pretendida é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. O vídeo original permanece inalterado. |

### 2.6 Regras de Negócio e Restrições

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

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O FFmpeg (filtros `transpose`, `hflip` e `vflip`) aplica as transformações sem perda de área visível. |
| **A2** | A quota diária é reposta diariamente às 00:00 UTC. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Deve ser suportada a rotação por ângulos arbitrários (e.g. 15°)? | Não no MVP. Apenas múltiplos de 90°, que não exigem recorte nem preenchimento. |
| **Q2** | Deve ser respeitada a etiqueta de rotação dos metadados (e.g. vídeos de telemóvel)? | Sim. A pré-visualização e o processamento partem da orientação de apresentação indicada pelos metadados do original. |

### 2.1 UC-VID-012

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

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Converter Formato". | O sistema apresenta o formato atual (contentor e codecs) e a lista de formatos de saída suportados (MP4, MOV, AVI), excluindo o formato atual. |
| 2 | O utilizador seleciona o formato de saída. | O sistema apresenta os codecs que serão utilizados no formato escolhido e indica se a conversão será feita por cópia direta de streams (*remux*) ou por recodificação. |
| 3 | O utilizador confirma a operação. | O sistema valida que o formato de saída pertence à matriz suportada e é diferente do atual, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado `processing`) e gera o novo contentor, copiando as streams sem recodificação quando os codecs de origem são admitidos no formato de saída, ou recodificando-as para os codecs da matriz caso contrário; emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O sistema armazena o novo vídeo, preservando a duração, a resolução e a taxa de fotogramas; se o formato de saída for MOV ou AVI, gera a cópia de pré-visualização MP4; associa o resultado ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo convertido na lista de recursos, disponível para reprodução e descarregamento (UC-VID-006); o vídeo original permanece inalterado. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Conversão por cópia direta de streams** | No passo 5, se os codecs de origem forem admitidos no formato de saída (e.g. MP4 H.264/AAC → MOV) → O worker reacondiciona as streams no novo contentor sem recodificação, sem perda de qualidade. |
| **FA2 – Cancelamento antes do início do processamento** | No passo 4, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA3 – Cancelamento durante o processamento** | No passo 5, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA4 – Utilizador com perfil Premium** | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| **FA5 – Utilização como passo de cadeia ou lote** | A conversão é configurada como último passo de uma cadeia (UC-VID-014) ou aplicada em lote (UC-VID-015) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Formato de saída igual ao formato atual.** | No passo 3, o sistema bloqueia a confirmação (`SAME_FORMAT`). |
| **Formato de saída fora da matriz suportada.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_TARGET_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Formato ou codec do vídeo de origem não suportado.** | No passo 3, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`). A tarefa não é criada e a quota não é afetada. |
| **Duração ou tamanho superior ao limite do perfil.** | No passo 3, o sistema rejeita a operação (`LIMIT_EXCEEDED`). A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 5, se o worker falhar → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um novo vídeo no formato de saída escolhido, conforme à matriz de codecs, é persistido e associado ao projeto (com referência ao vídeo de origem e, se MOV/AVI, com cópia de pré-visualização MP4). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. O vídeo original permanece inalterado. |

### 2.6 Regras de Negócio e Restrições

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

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O FFmpeg suporta a escrita dos contentores MP4, MOV e AVI com os codecs da RN3. |
| **A2** | A quota diária é reposta diariamente às 00:00 UTC. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Deve o utilizador poder escolher o codec ou a qualidade (bitrate) de saída? | Não no MVP. Os codecs são fixos por formato (RN3) e a qualidade usa os valores por omissão da equipa. |
| **Q2** | Devem ser suportados outros formatos de saída (WebM, MKV, GIF)? | Não no MVP; ficam para o Alvo de Produção da REQ-VID-NFR-003. |

### 2.1 UC-VID-013

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-013 |
| **Nome** | Juntar vídeos |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador juntar dois ou mais vídeos do projeto, concatenando-os pela ordem selecionada num único vídeo final, sem alterar os originais. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende compor um único vídeo a partir de vários clips, controlando a ordem.<br>- **Sistema PictuRAS**: deve produzir um resultado contínuo mesmo quando os clips têm resoluções, taxas de fotogramas ou presença de áudio diferentes.<br>- **Administrador**: pretende limitar o número de clips e a duração total para proteger os workers e o armazenamento. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém pelo menos dois vídeos num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002).<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador escolhe a operação "Juntar Vídeos" no projeto. |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto e escolhe a operação "Juntar Vídeos". | O sistema apresenta a lista de vídeos elegíveis do projeto (miniatura, nome e duração) e os limites do perfil (número máximo de vídeos e duração total). |
| 2 | O utilizador seleciona dois ou mais vídeos. | O sistema apresenta os vídeos numa linha temporal pela ordem de seleção, com a duração total estimada. |
| 3 | O utilizador reordena os vídeos (arrastando-os ou com setas). | O sistema atualiza a ordem na linha temporal e indica a resolução e a taxa de fotogramas do resultado (as do primeiro vídeo). |
| 4 | O utilizador confirma a operação. | O sistema valida o número de vídeos, a duração total face ao limite do perfil e os formatos, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 5 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 6 | — | O worker inicia o processamento (estado `processing`), normaliza cada clip para a resolução e taxa de fotogramas do primeiro (com barras pretas quando a proporção difere), acrescenta uma faixa de silêncio aos clips sem áudio, concatena-os pela ordem definida e emite progresso percentual (0–100%) via WebSocket. |
| 7 | — | O worker gera o vídeo final em MP4 (H.264/AAC); o sistema associa-o ao projeto como novo recurso, registando a lista ordenada dos vídeos de origem (`sourceVideoIds`), transita a tarefa para `completed`, confirma o consumo da quota e notifica o utilizador. |
| 8 | O utilizador consulta o projeto. | O sistema apresenta o vídeo final na lista de recursos; os vídeos de origem permanecem inalterados. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Remoção de um vídeo da seleção** | No passo 3, o utilizador remove um vídeo da linha temporal → O sistema atualiza a ordem e a duração total; se restar menos de dois vídeos, a confirmação fica bloqueada. |
| **FA2 – Repetição de um vídeo** | No passo 2, o utilizador adiciona o mesmo vídeo mais do que uma vez → O sistema aceita, tratando cada ocorrência como um clip distinto na linha temporal. |
| **FA3 – Cancelamento antes do início do processamento** | No passo 5, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA4 – Cancelamento durante o processamento** | No passo 6, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA5 – Utilizador com perfil Premium** | No passo 4, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados (até 50 vídeos e 60 minutos de duração total). |
| **FA6 – Junção como passo de uma cadeia** | A junção é configurada como passo de uma cadeia (UC-VID-014), com operações por clip antes da junção e operações sobre o resultado depois dela → A execução segue o UC-VID-014. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Menos de dois vídeos selecionados.** | No passo 4, o sistema bloqueia a confirmação (`INSUFFICIENT_INPUTS`). |
| **Número de vídeos acima do limite do perfil.** | No passo 4, o sistema rejeita a operação (`TOO_MANY_INPUTS`), indicando o máximo do perfil (10 Registado, 50 Premium). A tarefa não é criada. |
| **Duração total acima do limite do perfil.** | No passo 4, o sistema rejeita a operação (`LIMIT_EXCEEDED`), indicando a duração total e o limite (5 min Registado, 60 min Premium). A tarefa não é criada. |
| **Formato ou codec de algum vídeo não suportado.** | No passo 4, o sistema rejeita a operação (`UNSUPPORTED_FORMAT`), identificando o vídeo. A tarefa não é criada e a quota não é afetada. |
| **Quota diária esgotada (utilizador Registado).** | No passo 4, o sistema informa que o limite diário de 5 operações foi atingido (`QUOTA_EXCEEDED`). A tarefa não é criada. |
| **Falha de processamento durante a execução.** | No passo 6, se o worker falhar em qualquer clip → O sistema transita a tarefa para `failed`, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum resultado parcial é gravado no projeto. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um único vídeo MP4 com todos os clips pela ordem definida é persistido e associado ao projeto, com a lista ordenada dos vídeos de origem. Os vídeos de origem permanecem inalterados. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum resultado (nem parcial) é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para `failed` ou `cancelled`. Os vídeos de origem permanecem inalterados. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| **RN2** | Número de vídeos por junção: mínimo 2; máximo 10 (Registado) ou 50 (Premium) (DQ-015). |
| **RN3** | A duração total do resultado não pode exceder o limite de duração do perfil (5 min Registado, 60 min Premium). |
| **RN4** | Os clips são concatenados pela ordem definida pelo utilizador, com corte seco entre eles (sem transições). |
| **RN5** | O resultado adota a resolução e a taxa de fotogramas do primeiro clip; os restantes são normalizados, com barras pretas (*letterbox*) quando a proporção difere (DQ-019). |
| **RN6** | Os clips sem áudio recebem uma faixa de silêncio com a sua duração, para manter a sincronização. |
| **RN7** | O resultado é gerado em MP4 (H.264/AAC) (DQ-013). |
| **RN8** | Cada junção concluída consome exatamente 1 crédito da quota diária do utilizador Registado, independentemente do número de clips (DQ-014). Utilizadores Premium têm quota ilimitada. |
| **RN9** | A junção é atómica: em caso de falha ou cancelamento, nenhum resultado é gravado e o crédito reservado é devolvido (DQ-018). |
| **RN10** | O resultado regista a lista ordenada dos identificadores dos vídeos de origem (`sourceVideoIds`). |
| **RN11** | Os vídeos de origem nunca são alterados nem eliminados. |
| **RN12** | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| **RN13** | A junção pode ser usada como passo de uma cadeia (UC-VID-014), no máximo uma vez por cadeia; não é elegível para o processamento em lote. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O FFmpeg (filtros `scale`, `pad`, `fps`, `anullsrc` e `concat`) permite normalizar e concatenar clips heterogéneos. |
| **A2** | Os limites de número de vídeos são valores de MVP, configuráveis e a validar pela equipa. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Devem ser suportadas transições entre clips (e.g. *fade*)? | Não no MVP (Q-ERS-006). A junção usa corte seco. |
| **Q2** | Pode o utilizador escolher a resolução do resultado, em vez de herdar a do primeiro clip? | Não diretamente; pode encadear um redimensionamento após a junção (UC-VID-014). |

### 2.1 UC-VID-014

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-014 |
| **Nome** | Encadear operações de edição num vídeo |
| **Versão** | v1.0 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador aplicar várias operações sequenciais a um vídeo — ou, com um passo de junção, a vários clips com operações próprias seguidas de operações sobre o resultado da junção — produzindo um único vídeo final numa única tarefa, sem alterar os originais. |
| **Âmbito** | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e acesso ao projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende montar uma edição completa (estilo *Movie Maker*) — e.g. cortar, ajustar cores e remover o áudio — sem gerir resultados intermédios.<br>- **Sistema PictuRAS**: deve validar a cadeia completa antes de a executar, executá-la como uma única tarefa e evitar perdas de qualidade por recodificações sucessivas.<br>- **Administrador**: pretende que o custo em quota reflita o número de operações e que a cadeia respeite os limites de infraestrutura. |
| **Pré-condições** | - O utilizador tem sessão iniciada (JWT válido).<br>- O utilizador tem permissão de edição sobre o projeto.<br>- O projeto contém pelo menos um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), dentro dos limites do perfil.<br>- O utilizador Registado tem quota diária disponível para o custo total da cadeia.<br>- Não existe outra tarefa de vídeo ativa no projeto. |
| **Trigger** | O utilizador seleciona um vídeo do projeto e escolhe a operação "Encadear Operações". |

### 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Encadear Operações". | O sistema apresenta o editor de cadeia com o vídeo selecionado, a lista de operações elegíveis e o contador de custo em créditos (inicialmente 0). |
| 2 | O utilizador adiciona um passo e configura os respetivos parâmetros. | O sistema valida os parâmetros do passo com as mesmas regras da operação isolada, face às propriedades estimadas do resultado do passo anterior (e.g. duração após alteração de velocidade), e atualiza a lista de passos e o custo total. |
| 3 | O utilizador repete o passo 2 até concluir a sequência. | O sistema apresenta a cadeia completa, o número total de passos (máx. 10), o custo total em créditos e a duração estimada do resultado. |
| 4 | O utilizador confirma a cadeia. | O sistema revalida todos os passos e a estrutura da cadeia (conversão apenas no último passo, no máximo uma junção, sem extração de fotogramas), verifica os limites do perfil e que a quota disponível cobre o custo total (se Registado) e cria uma única tarefa assíncrona. |
| 5 | — | O sistema reserva a totalidade dos créditos da cadeia (se Registado), coloca a tarefa na fila com estado `queued` e notifica o utilizador da aceitação. |
| 6 | — | O worker inicia o processamento (estado `processing`) e executa os passos pela ordem definida, com no máximo uma recodificação de vídeo, emitindo via WebSocket o passo corrente (k de N) e o progresso percentual global (0–100%). |
| 7 | — | O sistema armazena apenas o vídeo final (sem guardar resultados intermédios no projeto), associa-o ao projeto como novo recurso com os vídeos de origem e a descrição ordenada dos passos aplicados, transita a tarefa para `completed`, confirma o consumo dos créditos e notifica o utilizador. |
| 8 | O utilizador consulta o projeto. | O sistema apresenta o vídeo final na lista de recursos; os vídeos de origem permanecem inalterados. |

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Cadeia com junção de vários clips (composição)** | No passo 2, o utilizador adiciona um passo de junção → O sistema permite acrescentar outros vídeos do projeto como clips e definir, para cada clip, uma sub-cadeia própria (possivelmente vazia); os passos adicionados depois da junção aplicam-se ao resultado da junção. Exemplo: (V1 + filtro de cor) + (V2 + remover áudio) + (V3 + acelerar) → juntar → + marca de água = 1 vídeo final. Toda a composição é executada numa única tarefa. |
| **FA2 – Reordenar ou remover passos** | No passo 3, o utilizador reordena ou remove um passo → O sistema revalida os passos seguintes face às novas propriedades estimadas e atualiza o custo total. |
| **FA3 – Guardar e reutilizar a cadeia como predefinição** | No passo 3, o utilizador guarda a cadeia (sem a junção) com um nome → O sistema regista a predefinição na conta do utilizador, podendo ser carregada numa nova cadeia ou num lote (UC-VID-015). |
| **FA4 – Cancelamento antes do início do processamento** | No passo 5, com a tarefa no estado `queued`, o utilizador solicita o cancelamento → O sistema remove a tarefa da fila, devolve todos os créditos reservados (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA5 – Cancelamento durante o processamento** | No passo 6, com a tarefa no estado `processing`, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina todos os ficheiros temporários, devolve todos os créditos reservados (se Registado), transita a tarefa para `cancelled` e notifica o utilizador. |
| **FA6 – Utilizador com perfil Premium** | No passo 4, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária; o limite de 10 passos mantém-se. |
| **FA7 – Utilizador abandona a sessão durante o processamento** | No passo 6, o utilizador fecha o browser → O worker continua o processamento em background e o resultado fica disponível na próxima sessão. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Parâmetros inválidos num passo.** | No passo 2 ou 4, o sistema rejeita o passo (`INVALID_STEP_PARAMS`), indicando o índice do passo e o campo incorreto. A tarefa não é criada. |
| **Estrutura de cadeia inválida (conversão que não é o último passo, mais de uma junção, extração de fotogramas ou cadeia vazia).** | No passo 4, o sistema rejeita a cadeia (`INVALID_CHAIN`), indicando a regra violada. A tarefa não é criada. |
| **Cadeia com mais de 10 passos.** | No passo 3, o sistema impede a adição de novos passos (`CHAIN_TOO_LONG`). |
| **Quota disponível inferior ao custo total da cadeia (utilizador Registado).** | No passo 4, o sistema informa o custo total e o saldo disponível (`QUOTA_EXCEEDED`). A tarefa não é criada e nenhum crédito é reservado. |
| **Duração ou tamanho de algum clip, ou duração estimada do resultado, acima do limite do perfil.** | No passo 4, o sistema rejeita a cadeia (`LIMIT_EXCEEDED`). A tarefa não é criada. |
| **Formato ou codec de algum vídeo não suportado.** | No passo 4, o sistema rejeita a cadeia (`UNSUPPORTED_FORMAT`), identificando o vídeo. A tarefa não é criada. |
| **Falha num qualquer passo durante a execução.** | No passo 6, o sistema interrompe a cadeia, transita a tarefa para `failed`, elimina todos os ficheiros temporários, estorna todos os créditos reservados (se Registado) e notifica o utilizador indicando o passo que falhou. Nenhum resultado (nem intermédio) é gravado no projeto. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Um único vídeo final, resultante da aplicação de todos os passos pela ordem definida, é persistido e associado ao projeto, com os vídeos de origem e a descrição dos passos. Nenhum resultado intermédio é gravado. Os vídeos de origem permanecem inalterados. A quota diária é consumida em N créditos, sendo N o número total de passos (apenas Registado). A tarefa transita para `completed`. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum resultado é associado ao projeto (política tudo-ou-nada), os ficheiros temporários são purgados, todos os créditos reservados são devolvidos e a tarefa transita para `failed` ou `cancelled`. Os vídeos de origem permanecem inalterados. |

### 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| **RN2** | Operações elegíveis como passo: recorte, remoção de áudio, alteração de velocidade, marca de água, ajuste de propriedades visuais, filtro, redimensionamento, rotação/espelho, conversão de formato e junção. A extração de fotogramas não é elegível (DQ-017). |
| **RN3** | A conversão de formato só pode ser o último passo da cadeia; a junção pode ocorrer no máximo uma vez (DQ-017). |
| **RN4** | Com um passo de junção, cada clip pode ter uma sub-cadeia própria antes da junção, e os passos seguintes aplicam-se ao resultado da junção. |
| **RN5** | Uma cadeia tem no máximo 10 passos no total, contando os passos das sub-cadeias, a junção e os passos finais (DQ-015). |
| **RN6** | Cada passo é validado com as mesmas regras da operação isolada, face às propriedades estimadas à saída do passo anterior. |
| **RN7** | O custo de uma cadeia é de N créditos, sendo N o número total de passos (a junção conta 1) (DQ-014). Para o utilizador Registado, a quota diária de 5 operações limita, na prática, a cadeia a 5 passos por dia (DQ-025). Utilizadores Premium têm quota ilimitada. |
| **RN8** | A totalidade dos créditos é verificada e reservada antes da aceitação da tarefa, confirmada na conclusão e devolvida integralmente em caso de falha ou cancelamento. |
| **RN9** | A cadeia completa é executada como uma única tarefa assíncrona, que conta como 1 tarefa ativa no projeto (DQ-016). |
| **RN10** | Apenas o vídeo final é gravado no projeto; os resultados intermédios são temporários e purgados no fim da tarefa. |
| **RN11** | A execução é atómica: a falha de qualquer passo invalida a cadeia inteira (DQ-018). |
| **RN12** | O vídeo de saída sofre no máximo uma recodificação de vídeo, independentemente do número de passos (REQ-VID-NFR-013). |
| **RN13** | O resultado é gerado em MP4 (H.264/AAC), salvo quando o último passo é uma conversão de formato (DQ-013). |
| **RN14** | Os vídeos de origem nunca são alterados nem eliminados. |

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | As operações de vídeo podem ser compostas num único *filtergraph* FFmpeg (ou numa sequência com intermédios sem perdas), de modo a recodificar o vídeo uma única vez. |
| **A2** | As propriedades estimadas à saída de cada passo (duração, resolução, presença de áudio) são calculáveis sem processar o vídeo. |
| **A3** | A quota diária é reposta diariamente às 00:00 UTC. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Deve o utilizador Registado poder executar cadeias com mais passos do que a sua quota diária? | Não (DQ-025). O perfil Registado fica limitado a 5 passos por dia; a cadeia é rejeitada e o sistema sugere a redução de passos ou o upgrade para Premium. |
| **Q2** | Podem os resultados intermédios ser guardados no projeto a pedido? | Não no MVP. Para obter um resultado intermédio, o utilizador executa essa parte como cadeia separada. |

### 2.1 UC-VID-015

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

### 2.2 Fluxo Principal

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

### 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Descarregar os resultados do lote em ZIP** | No passo 9, o utilizador escolhe "Descarregar Lote" → O sistema gera um arquivo ZIP com os vídeos concluídos do lote, disponível por URL assinado temporário (UC-VID-006), sem consumo de quota. |
| **FA2 – Exclusão dos vídeos incompatíveis** | No passo 3, o utilizador retira do lote os vídeos assinalados como incompatíveis → O sistema recalcula o custo total; se restar menos de dois vídeos, a confirmação fica bloqueada. |
| **FA3 – Carregar uma cadeia predefinida** | No passo 2, o utilizador carrega uma cadeia guardada como predefinição (UC-VID-014, FA3) → O sistema preenche a configuração e o fluxo continua no passo 3. |
| **FA4 – Cancelamento do lote** | No passo 5 ou 6, o utilizador cancela o lote → O sistema interrompe o vídeo em curso e os pendentes, purga os temporários, devolve os créditos dos vídeos não concluídos (se Registado), mantém os vídeos já concluídos e transita o lote para `cancelled`. |
| **FA5 – Utilizador com perfil Premium** | No passo 4, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica o limite alargado de 50 vídeos. |
| **FA6 – Utilizador abandona a sessão durante o processamento** | No passo 6, o utilizador fecha o browser → O worker continua o processamento em background e os resultados ficam disponíveis na próxima sessão. |

### 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Menos de dois vídeos ou mais do que o limite do perfil.** | No passo 4, o sistema rejeita o lote (`INSUFFICIENT_INPUTS` ou `TOO_MANY_INPUTS`). A tarefa não é criada. |
| **Configuração com passo de junção ou extração de fotogramas.** | No passo 2, o sistema rejeita a configuração (`INVALID_BATCH_OPERATION`). |
| **Nenhum vídeo compatível com a configuração.** | No passo 3, o sistema bloqueia a confirmação (`NO_ELIGIBLE_INPUTS`). |
| **Quota disponível inferior ao custo total do lote (utilizador Registado).** | No passo 4, o sistema informa o custo total e o saldo disponível (`QUOTA_EXCEEDED`). O lote não é criado e nenhum crédito é reservado. |
| **Falha no processamento de um vídeo.** | No passo 7, o sistema marca a subtarefa como `failed`, elimina os respetivos temporários, devolve os créditos desse vídeo (se Registado) e prossegue com os restantes. |
| **Falha geral do worker.** | No passo 6, os vídeos já concluídos mantêm-se; os restantes são marcados como `failed`, os seus créditos são devolvidos e o utilizador é notificado. |

### 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | Cada vídeo concluído do lote origina um novo vídeo associado ao projeto (com referência ao respetivo vídeo de origem). Os vídeos de origem permanecem inalterados. A quota diária é consumida apenas pelos vídeos concluídos (custo da operação ou cadeia × vídeos concluídos; apenas Registado). O lote transita para `completed`. |
| **Garantia Mínima** | Os vídeos falhados ou cancelados não deixam resultados parciais nem temporários, os seus créditos são devolvidos e os vídeos já concluídos permanecem válidos no projeto. Os vídeos de origem permanecem inalterados. |

### 2.6 Regras de Negócio e Restrições

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

### 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | A pré-validação por vídeo usa apenas os metadados persistidos, sem processar os ficheiros. |
| **A2** | O mecanismo de descarregamento em ZIP existente para imagens pode ser estendido a vídeos. |
| **A3** | A quota diária é reposta diariamente às 00:00 UTC. |

### 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Se a quota não cobrir o lote inteiro, deve o sistema aceitar apenas os vídeos que a quota cobre? | Não no MVP (Q-ERS-007). O lote é rejeitado e o utilizador pode reduzir a seleção. |
| **Q2** | Devem os vídeos do lote ser processados em paralelo? | Não no MVP. O processamento é sequencial para respeitar o limite de 1 tarefa ativa por projeto. |

---

## 3. Utilização de agentes de IA

| **Ferramenta / skill** | **Tarefa apoiada** | **Validação realizada pela equipa** |
|------------------------|--------------------|--------------------------------------|
| ChatGPT | Apoio na revisão da linguagem utilizada no caso de uso, com foco na clareza e na redução de ambiguidades. | A equipa verificou se as formulações descrevem comportamento observável do sistema e evitam antecipar decisões de implementação ainda não definidas. |
| Claude Code (specsmd Inception Agent) | Especificação dos novos requisitos RF1 a RF10 (`docs/novo.md`): casos de uso UC-VID-006 a UC-VID-015 e respetivos requisitos, decisões e rastreabilidade, com os mesmos identificadores dos ficheiros modulares. | A equipa aprovou previamente o plano de alterações (âmbito, formatos, quota e suposições); a revisão final do conteúdo gerado é da responsabilidade da equipa. |


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
| REQ-VID-COM-006 | O sistema deve expor todas as operações de transformação de vídeo através de um contrato uniforme de tipo de operação e parâmetros, que permita executá-las isoladamente, como passo de uma cadeia ou em lote. | F | Must (em revisão) | Novo | UC-VID-008 a 012 (FA de utilização em cadeia/lote), UC-VID-014 (RN2), UC-VID-015 (RN3), DQ-017 | Dado o contrato `{operation, parameters}` de um filtro, Quando submetido isoladamente, como passo de cadeia ou num lote, Então é validado pelas mesmas regras e produz o mesmo efeito. |
| REQ-VID-QUOTA-007 | O sistema deve verificar, antes de aceitar um pedido com custo superior a 1 crédito (cadeia ou lote), que o saldo da quota diária do utilizador registado cobre o custo total, reservando a totalidade dos créditos no momento da aceitação. | F | Must (em revisão) | Estender | UC-VID-014 (Passos 4-5, Exceção 4, RN8), UC-VID-015 (Passos 4-5, Exceção 4, RN4), DQ-014 | Dado um utilizador registado com 3 créditos, Quando submete uma cadeia de 4 passos, Então o pedido é rejeitado com `QUOTA_EXCEEDED` e nenhum crédito é reservado; com 5 créditos, o saldo transitório passa a 1. |
| REQ-VID-QUOTA-008 | O sistema deve calcular o custo de cada pedido de vídeo como 1 crédito por operação isolada ou junção, N créditos por cadeia de N passos e, num lote, o custo da operação ou cadeia multiplicado pelo número de vídeos concluídos, sem custo para o descarregamento e a consulta de informações. | F | Must (em revisão) | Estender | UC-VID-006 (RN2), UC-VID-007 (RN2), UC-VID-013 (RN8), UC-VID-014 (RN7), UC-VID-015 (RN4), DQ-014 | Dado uma cadeia de 3 passos aplicada em lote a 2 vídeos concluídos, Quando o lote termina, Então são debitados 6 créditos; dado um descarregamento ou uma consulta de informações, Então são debitados 0 créditos. |
| REQ-VID-STORAGE-004 | O sistema deve registar nos metadados do vídeo resultante de uma cadeia ou junção a descrição ordenada dos passos aplicados, incluindo os parâmetros de cada passo e a posição de cada vídeo de origem na junção. | F | Should (em revisão) | Novo | UC-VID-013 (Passo 7), UC-VID-014 (Passo 7), UC-VID-007 (FA1), DQ-003 | Dado o vídeo final de uma composição (V1 + filtro) + (V2 + remover áudio) → junção → marca de água, Quando inspecionados os metadados, Então constam as sub-cadeias com os seus parâmetros, a junção com a ordem (V1, V2) e a marca de água. |
| REQ-VID-TASK-006 | O sistema deve suportar tarefas compostas por vários passos, mantendo um estado agregado único segundo a máquina de estados canónica e registando o passo corrente e o número total de passos. | F | Must (em revisão) | Estender | UC-VID-014 (Passos 5-6, RN9), DQ-016 | Dado uma cadeia de 4 passos em execução no 3.º passo, Quando consultado o estado da tarefa, Então indica `processing` com `step: 3` e `totalSteps: 4`. |
| REQ-VID-TASK-007 | O sistema deve suportar lotes de tarefas identificados por `batchId`, com uma subtarefa por vídeo, cada uma com o seu estado, e um estado agregado do lote. | F | Must (em revisão) | Estender | UC-VID-015 (Passos 4-8, RN5), DQ-016 | Dado um lote de 3 vídeos, Quando consultado pelo `batchId`, Então são devolvidos o estado agregado e o estado de cada uma das 3 subtarefas. |
| REQ-VID-UPLOAD-016 | O sistema deve gerar, para cada vídeo original carregado em MOV ou AVI, uma cópia de pré-visualização em MP4 (H.264/AAC) associada ao recurso. | F | Must (em revisão) | Novo | UC-VID-000 (Passo 6, FA5, RN8, DQ-012) | Dado o carregamento de um AVI válido, Quando a ingestão conclui, Então existe no storage uma cópia MP4 de pré-visualização associada ao recurso. |
| REQ-VID-UPLOAD-017 | O sistema deve utilizar a cópia de pré-visualização exclusivamente no reprodutor integrado, mantendo o ficheiro original como fonte das operações de processamento e do descarregamento. | F | Must (em revisão) | Novo | UC-VID-000 (FA5, RN8), UC-VID-006 (RN7), DQ-012 | Dado um MOV com cópia de pré-visualização, Quando o utilizador o reproduz, descarrega e recorta, Então o leitor usa a cópia MP4, enquanto o descarregamento e o recorte usam o MOV original. |
| REQ-VID-DOWNLOAD-001 | O sistema deve permitir ao utilizador registado ou premium com permissão de leitura, edição ou de proprietário no projeto descarregar qualquer recurso de vídeo do projeto, original ou resultante. | F | Must (em revisão) | Novo | UC-VID-006 (Passos 1-2, FA4, RN1, RN7, DQ-023) | Dado um utilizador com permissão de leitura num projeto partilhado, Quando escolhe "Descarregar" num vídeo concluído, Então o sistema inicia o descarregamento do ficheiro. |
| REQ-VID-DOWNLOAD-002 | O sistema deve gerar, para cada pedido de descarregamento, um URL assinado temporário com validade de 15 minutos associado ao utilizador e ao recurso. | F | Must (em revisão) | Estender | UC-VID-006 (Passo 2, Exceção 3, RN4, REQ-VID-NFR-001) | Dado um URL de descarregamento gerado para o utilizador A, Quando é usado pelo utilizador B ou após 16 minutos, Então o armazenamento responde HTTP 403 Forbidden. |
| REQ-VID-DOWNLOAD-003 | O sistema deve disponibilizar o descarregamento apenas para recursos de vídeo no estado `completed`. | F | Must (em revisão) | Novo | UC-VID-006 (Exceção 1, RN3) | Dado um vídeo resultante no estado `processing`, Quando o utilizador abre o menu do recurso, Então a opção "Descarregar" está desativada com indicação `RESOURCE_NOT_READY`. |
| REQ-VID-DOWNLOAD-004 | O sistema deve permitir o descarregamento de vídeos sem debitar qualquer crédito da quota diária do utilizador. | F | Must (em revisão) | Novo | UC-VID-006 (Passo 2, RN2, DQ-014) | Dado um utilizador registado com 3 créditos, Quando descarrega dois vídeos, Então o saldo da quota diária mantém-se em 3 créditos. |
| REQ-VID-DOWNLOAD-005 | O sistema deve sugerir um nome de ficheiro composto pelo nome original, um sufixo com a(s) operação(ões) aplicada(s) e a extensão do formato armazenado. | F | Should (em revisão) | Novo | UC-VID-006 (Passo 3, RN5) | Dado o resultado do recorte de `ferias.mp4`, Quando é descarregado, Então o nome sugerido é `ferias_trim.mp4`. |
| REQ-VID-DOWNLOAD-006 | O sistema deve entregar o ficheiro no formato em que se encontra armazenado e nunca a cópia de pré-visualização MP4. | F | Must (em revisão) | Novo | UC-VID-006 (FA4, RN7, DQ-012) | Dado um original carregado em AVI, Quando é descarregado, Então o ficheiro recebido tem extensão `.avi` e é idêntico (hash) ao ficheiro carregado. |
| REQ-VID-DOWNLOAD-007 | O sistema deve suportar a retoma de transferências interrompidas através de pedidos HTTP `Range`, enquanto o URL assinado estiver válido. | F | Should (em revisão) | Estender | UC-VID-006 (FA2, REQ-VID-NFR-016) | Dado um descarregamento interrompido aos 60%, Quando o navegador repete o pedido com cabeçalho `Range`, Então o armazenamento responde HTTP 206 com os bytes em falta. |
| REQ-VID-DOWNLOAD-008 | O sistema deve gerar um novo URL assinado sempre que o utilizador repete o pedido de descarregamento após a expiração do anterior. | F | Should (em revisão) | Novo | UC-VID-006 (FA3) | Dado um URL expirado, Quando o utilizador volta a escolher "Descarregar", Então é gerado um URL novo e válido por 15 minutos. |
| REQ-VID-DOWNLOAD-009 | O sistema deve registar cada descarregamento nos logs internos com o `correlationId`, o utilizador e o recurso. | F | Should (em revisão) | Novo | UC-VID-006 (Passo 4, Exceção 4, REQ-VID-NFR-002) | Dado um descarregamento concluído, Quando consultados os logs centrais, Então existe um evento com `correlationId`, identificador do utilizador e do recurso. |
| REQ-VID-INFO-001 | O sistema deve permitir ao utilizador registado ou premium com permissão de leitura, edição ou de proprietário no projeto abrir um painel de informações técnicas de um vídeo do projeto. | F | Must (em revisão) | Novo | UC-VID-007 (Passo 1, FA3, RN1) | Dado um vídeo na galeria, Quando o utilizador escolhe "Informações", Então é apresentado o painel de informações técnicas do vídeo. |
| REQ-VID-INFO-002 | O sistema deve apresentar a duração do vídeo no formato `hh:mm:ss.mmm`. | F | Must (em revisão) | Novo | UC-VID-007 (Passo 2, RN4) | Dado um vídeo de 45,2 s, Quando o painel é aberto, Então a duração apresentada é `00:00:45.200`. |
| REQ-VID-INFO-003 | O sistema deve apresentar a resolução do vídeo como largura × altura em píxeis. | F | Must (em revisão) | Novo | UC-VID-007 (Passo 2, RN4) | Dado um vídeo Full HD, Quando o painel é aberto, Então a resolução apresentada é `1920 × 1080 px`. |
| REQ-VID-INFO-004 | O sistema deve apresentar o formato do vídeo, indicando o contentor e os codecs de vídeo e de áudio (ou a ausência de áudio). | F | Must (em revisão) | Novo | UC-VID-007 (Passo 2, FA2, RN4) | Dado um MOV com H.264 e AAC, Quando o painel é aberto, Então o formato apresentado é `MOV (H.264 / AAC)`. |
| REQ-VID-INFO-005 | O sistema deve apresentar o tamanho do ficheiro em MB (abaixo de 1 GB) ou em GB, com 2 casas decimais. | F | Must (em revisão) | Novo | UC-VID-007 (Passo 2, RN4) | Dado um ficheiro de 157 286 400 bytes, Quando o painel é aberto, Então o tamanho apresentado é `150.00 MB`. |
| REQ-VID-INFO-006 | O sistema deve apresentar a taxa de fotogramas do vídeo em fps, com 2 casas decimais. | F | Must (em revisão) | Novo | UC-VID-007 (Passo 2, RN4) | Dado um vídeo a 30000/1001 fps, Quando o painel é aberto, Então a taxa apresentada é `29.97 fps`. |
| REQ-VID-INFO-007 | O sistema deve obter as informações a partir dos metadados persistidos no MongoDB, sem criar tarefa de processamento e sem debitar quota. | F | Must (em revisão) | Estender | UC-VID-007 (Passo 1, RN2, RN3, REQ-VID-UPLOAD-013, DQ-014) | Dado um utilizador registado com 2 créditos, Quando consulta as informações de três vídeos, Então nenhuma tarefa é criada e o saldo mantém-se em 2 créditos. |
| REQ-VID-INFO-008 | O sistema deve apresentar, para vídeos resultantes, a proveniência (vídeo(s) de origem) e a descrição da(s) operação(ões) aplicada(s). | F | Should (em revisão) | Novo | UC-VID-007 (FA1, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004) | Dado um vídeo resultante de uma cadeia "recorte → filtro", Quando o painel é aberto, Então é apresentado o vídeo de origem e os dois passos aplicados pela ordem. |
| REQ-VID-INFO-009 | O sistema deve apresentar como "Indisponível" qualquer atributo cujo metadado não exista, registando o aviso `METADATA_UNAVAILABLE` nos logs. | F | Should (em revisão) | Novo | UC-VID-007 (Exceção 1) | Dado um vídeo sem taxa de fotogramas persistida, Quando o painel é aberto, Então o campo indica "Indisponível" e o aviso é registado com o `correlationId`. |
| REQ-VID-ADJUST-001 | O sistema deve permitir ao utilizador registado ou premium definir o fator de brilho do vídeo no intervalo [0.0, 2.0], com passo de 0.05. | F | Must (em revisão) | Novo | UC-VID-008 (Passos 1-2, RN2, DQ-020) | Dado o painel de ajuste, Quando o utilizador move o controlo de brilho para 1.30, Então o fator de brilho fica registado como 1.30. |
| REQ-VID-ADJUST-002 | O sistema deve permitir ao utilizador registado ou premium definir o fator de contraste do vídeo no intervalo [0.0, 2.0], com passo de 0.05. | F | Must (em revisão) | Novo | UC-VID-008 (Passos 1-2, RN2, DQ-020) | Dado o painel de ajuste, Quando o utilizador move o controlo de contraste para 0.80, Então o fator de contraste fica registado como 0.80. |
| REQ-VID-ADJUST-003 | O sistema deve permitir ao utilizador registado ou premium definir o fator de saturação do vídeo no intervalo [0.0, 2.0], com passo de 0.05. | F | Must (em revisão) | Novo | UC-VID-008 (Passos 1-2, RN2, DQ-020) | Dado o painel de ajuste, Quando o utilizador move o controlo de saturação para 0.00, Então o fator de saturação fica registado como 0.00 (tons de cinzento). |
| REQ-VID-ADJUST-004 | O sistema deve apresentar os três controlos inicializados no valor neutro 1.0 e permitir repô-los nesse valor. | F | Should (em revisão) | Novo | UC-VID-008 (Passo 1, FA1, RN2) | Dado o painel com brilho 1.40, Quando o utilizador clica em "Repor", Então os três controlos voltam a 1.0. |
| REQ-VID-ADJUST-005 | O sistema deve apresentar uma pré-visualização estática do primeiro fotograma com os ajustes aplicados, atualizada a cada alteração dos controlos. | F | Should (em revisão) | Novo | UC-VID-008 (Passo 2, REQ-VID-NFR-015) | Dado o painel de ajuste, Quando o utilizador altera o contraste, Então a pré-visualização é atualizada em ≤ 1 s. |
| REQ-VID-ADJUST-006 | O sistema deve rejeitar fatores de ajuste fora do intervalo [0.0, 2.0], indicando o controlo incorreto. | F | Must (em revisão) | Novo | UC-VID-008 (Passo 3, Exceção 1, RN2) | Dado um pedido via API com brilho 2.5, Quando submetido, Então a API responde HTTP 422 com `INVALID_ADJUST_PARAMS` indicando o campo `brightness`. |
| REQ-VID-ADJUST-007 | O sistema deve bloquear a confirmação quando os três fatores estiverem no valor neutro 1.0. | F | Must (em revisão) | Novo | UC-VID-008 (Passo 3, Exceção 2, RN3) | Dado o painel com os três controlos em 1.0, Quando o utilizador tenta confirmar, Então a confirmação é bloqueada com a indicação `NO_CHANGES`. |
| REQ-VID-ADJUST-008 | O sistema deve aplicar os fatores de ajuste confirmados de forma uniforme a todos os fotogramas do vídeo. | F | Must (em revisão) | Novo | UC-VID-008 (Passo 5, RN4) | Dado um ajuste de saturação 0.0, Quando inspecionados fotogramas no início, meio e fim do resultado, Então todos estão em tons de cinzento. |
| REQ-VID-ADJUST-009 | O sistema deve preservar no vídeo resultante do ajuste a duração, a resolução, a taxa de fotogramas e o áudio do original, gerando-o em MP4 (H.264/AAC). | F | Must (em revisão) | Novo | UC-VID-008 (Passo 6, Pós-condição, RN5, DQ-013) | Dado um original de 30 s em 1280×720 a 25 fps com áudio, Quando o ajuste conclui, Então o resultado tem 30 s, 1280×720, 25 fps e uma stream de áudio AAC. |
| REQ-VID-FILTER-001 | O sistema deve apresentar ao utilizador registado ou premium o catálogo de filtros predefinidos Preto e Branco, Sépia, Negativo, Vintage, Frio e Quente. | F | Must (em revisão) | Novo | UC-VID-009 (Passo 1, RN2, DQ-021) | Dado o painel de filtros, Quando aberto, Então apresenta exatamente os seis filtros do catálogo do MVP. |
| REQ-VID-FILTER-002 | O sistema deve apresentar, para cada filtro do catálogo, uma miniatura de exemplo aplicada ao primeiro fotograma do vídeo selecionado. | F | Could (em revisão) | Novo | UC-VID-009 (Passo 1) | Dado o painel de filtros, Quando aberto, Então cada filtro mostra uma miniatura com o primeiro fotograma do vídeo filtrado. |
| REQ-VID-FILTER-003 | O sistema deve permitir selecionar exatamente um filtro por operação, substituindo a seleção anterior quando outro filtro é escolhido. | F | Must (em revisão) | Novo | UC-VID-009 (Passo 2, FA1, RN3) | Dado o filtro Sépia selecionado, Quando o utilizador escolhe Vintage, Então apenas Vintage fica selecionado. |
| REQ-VID-FILTER-004 | O sistema deve apresentar uma pré-visualização estática do primeiro fotograma com o filtro selecionado aplicado. | F | Should (em revisão) | Novo | UC-VID-009 (Passo 2, REQ-VID-NFR-015) | Dado o filtro Negativo selecionado, Quando a seleção ocorre, Então a pré-visualização com as cores invertidas é apresentada em ≤ 1 s. |
| REQ-VID-FILTER-005 | O sistema deve rejeitar pedidos de filtro sem filtro selecionado ou com um filtro inexistente no catálogo. | F | Must (em revisão) | Novo | UC-VID-009 (Passo 3, Exceção 1, RN2) | Dado um pedido via API com filtro `cartoon`, Quando submetido, Então a API responde HTTP 422 com `INVALID_FILTER`. |
| REQ-VID-FILTER-006 | O sistema deve aplicar o filtro confirmado de forma uniforme a todos os fotogramas do vídeo. | F | Must (em revisão) | Novo | UC-VID-009 (Passo 5, RN4) | Dado o filtro Preto e Branco, Quando inspecionados fotogramas no início, meio e fim do resultado, Então todos têm saturação nula. |
| REQ-VID-FILTER-007 | O sistema deve preservar no vídeo resultante do filtro a duração, a resolução, a taxa de fotogramas e o áudio do original, gerando-o em MP4 (H.264/AAC). | F | Must (em revisão) | Novo | UC-VID-009 (Passo 6, Pós-condição, RN5, DQ-013) | Dado um original de 20 s em 1920×1080 a 30 fps com áudio, Quando o filtro conclui, Então o resultado tem 20 s, 1920×1080, 30 fps e uma stream de áudio AAC. |
| REQ-VID-RESIZE-001 | O sistema deve permitir ao utilizador registado ou premium definir a largura e a altura de saída do vídeo em píxeis. | F | Must (em revisão) | Novo | UC-VID-010 (Passos 1-2) | Dado o painel de redimensionamento, Quando o utilizador introduz largura 1280 com a proporção desbloqueada e altura 720, Então as dimensões de saída ficam registadas como 1280×720. |
| REQ-VID-RESIZE-002 | O sistema deve manter, por omissão, a proporção original, recalculando a outra dimensão e arredondando-a para o número par mais próximo. | F | Must (em revisão) | Novo | UC-VID-010 (Passo 2, RN2, RN4) | Dado um vídeo 1920×1080 com proporção bloqueada, Quando o utilizador introduz largura 1000, Então a altura é calculada como 562 px. |
| REQ-VID-RESIZE-003 | O sistema deve disponibilizar as predefinições de resolução 1080p, 720p, 480p e 360p, aplicadas à altura com a largura calculada pela proporção. | F | Should (em revisão) | Novo | UC-VID-010 (Passos 1-2) | Dado um vídeo 1920×1080, Quando o utilizador escolhe "720p", Então as dimensões de saída passam a 1280×720. |
| REQ-VID-RESIZE-004 | O sistema deve permitir desbloquear a proporção, apresentando um aviso de que a imagem ficará distorcida. | F | Should (em revisão) | Novo | UC-VID-010 (FA1, RN4) | Dado o bloqueio de proporção desativado, Quando a relação largura/altura difere da original, Então é apresentado o aviso de distorção. |
| REQ-VID-RESIZE-005 | O sistema deve apresentar um aviso quando as dimensões pretendidas forem superiores às do vídeo original. | F | Could (em revisão) | Novo | UC-VID-010 (FA2, RN5) | Dado um vídeo 1280×720, Quando o utilizador escolhe "1080p", Então é apresentado o aviso de ampliação e a confirmação continua disponível. |
| REQ-VID-RESIZE-006 | O sistema deve rejeitar dimensões de saída ímpares, inferiores a 128 px ou acima do teto do perfil (1920×1080 Registado, 3840×2160 Premium). | F | Must (em revisão) | Novo | UC-VID-010 (Passo 3, Exceção 1, FA5, RN2, RN3, DQ-022) | Dado um utilizador registado, Quando submete 2560×1440, Então a API responde HTTP 422 com `INVALID_RESIZE_PARAMS` indicando o teto de 1920×1080. |
| REQ-VID-RESIZE-007 | O sistema deve bloquear a confirmação quando as dimensões de saída forem iguais às do vídeo original. | F | Must (em revisão) | Novo | UC-VID-010 (Passo 3, Exceção 2) | Dado um vídeo 1280×720, Quando o utilizador confirma 1280×720, Então a confirmação é bloqueada com a indicação `NO_CHANGES`. |
| REQ-VID-RESIZE-008 | O sistema deve produzir um novo vídeo com exatamente as dimensões de saída confirmadas. | F | Must (em revisão) | Novo | UC-VID-010 (Passos 5-6, Pós-condição) | Dado um redimensionamento confirmado para 854×480, Quando a tarefa conclui, Então o FFprobe reporta o resultado com 854×480 px. |
| REQ-VID-RESIZE-009 | O sistema deve preservar no vídeo redimensionado a duração, a taxa de fotogramas e o áudio do original, gerando-o em MP4 (H.264/AAC). | F | Must (em revisão) | Novo | UC-VID-010 (Passo 6, RN6, DQ-013) | Dado um original de 40 s a 30 fps com áudio, Quando o redimensionamento conclui, Então o resultado tem 40 s, 30 fps e uma stream de áudio AAC. |
| REQ-VID-ORIENT-001 | O sistema deve permitir ao utilizador registado ou premium rodar o vídeo no sentido horário num dos ângulos 90°, 180° ou 270°. | F | Must (em revisão) | Novo | UC-VID-011 (Passos 1-2, RN2) | Dado o painel de orientação, Quando o utilizador escolhe 90°, Então a rotação de 90° no sentido horário fica registada. |
| REQ-VID-ORIENT-002 | O sistema deve permitir ao utilizador registado ou premium espelhar o vídeo na horizontal. | F | Must (em revisão) | Novo | UC-VID-011 (Passos 1-2, RN3) | Dado o painel de orientação, Quando o utilizador ativa "Espelho horizontal", Então o espelho horizontal fica registado. |
| REQ-VID-ORIENT-003 | O sistema deve permitir ao utilizador registado ou premium espelhar o vídeo na vertical. | F | Must (em revisão) | Novo | UC-VID-011 (Passos 1-2, RN3) | Dado o painel de orientação, Quando o utilizador ativa "Espelho vertical", Então o espelho vertical fica registado. |
| REQ-VID-ORIENT-004 | O sistema deve permitir combinar a rotação com um ou ambos os espelhos numa única operação, aplicando a rotação antes do espelho. | F | Should (em revisão) | Novo | UC-VID-011 (Passo 2, RN3) | Dado rotação 90° e espelho horizontal, Quando a operação conclui, Então o resultado corresponde a rodar 90° e depois espelhar na horizontal. |
| REQ-VID-ORIENT-005 | O sistema deve apresentar uma pré-visualização estática do primeiro fotograma com a transformação combinada e as dimensões resultantes. | F | Should (em revisão) | Novo | UC-VID-011 (Passo 2, FA1, REQ-VID-NFR-015) | Dado um vídeo 1920×1080 e rotação 270°, Quando a seleção ocorre, Então a pré-visualização rodada é apresentada em ≤ 1 s com a indicação 1080×1920. |
| REQ-VID-ORIENT-006 | O sistema deve rejeitar pedidos de rotação com ângulo fora do conjunto {90°, 180°, 270°}. | F | Must (em revisão) | Novo | UC-VID-011 (Passo 3, Exceção 1, RN2) | Dado um pedido via API com ângulo 45°, Quando submetido, Então a API responde HTTP 422 com `INVALID_ORIENT_PARAMS`. |
| REQ-VID-ORIENT-007 | O sistema deve bloquear a confirmação quando não estiver definida nenhuma rotação nem nenhum espelho. | F | Must (em revisão) | Novo | UC-VID-011 (Passo 3, Exceção 2, RN4) | Dado o painel sem rotação nem espelho ativos, Quando o utilizador tenta confirmar, Então a confirmação é bloqueada com a indicação `NO_CHANGES`. |
| REQ-VID-ORIENT-008 | O sistema deve trocar a largura e a altura do vídeo resultante nas rotações de 90° e 270°, sem recorte nem barras. | F | Must (em revisão) | Novo | UC-VID-011 (Passo 6, RN5) | Dado um vídeo 1280×720 rodado 90°, Quando a tarefa conclui, Então o resultado tem 720×1280 px sem barras pretas. |
| REQ-VID-ORIENT-009 | O sistema deve preservar no vídeo resultante da orientação a duração, a taxa de fotogramas e o áudio do original, gerando-o em MP4 (H.264/AAC). | F | Must (em revisão) | Novo | UC-VID-011 (Passo 6, Pós-condição, RN6, DQ-013) | Dado um original de 15 s a 60 fps com áudio, Quando a operação conclui, Então o resultado tem 15 s, 60 fps e uma stream de áudio AAC. |
| REQ-VID-CONVERT-001 | O sistema deve apresentar ao utilizador o formato atual do vídeo (contentor e codecs) e a lista de formatos de saída suportados, excluindo o formato atual. | F | Must (em revisão) | Novo | UC-VID-012 (Passo 1, RN2) | Dado um vídeo MOV, Quando o utilizador abre "Converter Formato", Então são apresentados o formato `MOV (H.264 / AAC)` e as opções MP4 e AVI. |
| REQ-VID-CONVERT-002 | O sistema deve permitir ao utilizador registado ou premium selecionar o formato de saída entre MP4, MOV e AVI. | F | Must (em revisão) | Novo | UC-VID-012 (Passo 2, RN2, DQ-002) | Dado um vídeo AVI, Quando o utilizador escolhe MP4, Então MP4 fica registado como formato de saída. |
| REQ-VID-CONVERT-003 | O sistema deve indicar, antes da confirmação, os codecs de saída e se a conversão será feita por cópia direta de streams ou por recodificação. | F | Could (em revisão) | Novo | UC-VID-012 (Passo 2, RN3, RN5) | Dado um MP4 H.264/AAC e saída MOV, Quando o formato é escolhido, Então é indicado "Cópia direta (sem perda de qualidade)". |
| REQ-VID-CONVERT-004 | O sistema deve rejeitar pedidos de conversão cujo formato de saída seja igual ao de origem ou não pertença à matriz suportada. | F | Must (em revisão) | Novo | UC-VID-012 (Passo 3, Exceções 1-2, RN2, RN4) | Dado um vídeo MP4, Quando é submetida conversão para MP4 ou para WebM, Então a API responde HTTP 422 com `SAME_FORMAT` ou `UNSUPPORTED_TARGET_FORMAT`, respetivamente. |
| REQ-VID-CONVERT-005 | O sistema deve produzir um novo vídeo no formato de saída com os codecs da matriz: H.264/AAC em MP4 e MOV; MPEG-4 Part 2/MP3 em AVI. | F | Must (em revisão) | Novo | UC-VID-012 (Passos 5-6, RN3, REQ-VID-NFR-003) | Dado um MP4 convertido para AVI, Quando o FFprobe inspeciona o resultado, Então o contentor é AVI, o vídeo é MPEG-4 Part 2 e o áudio é MP3. |
| REQ-VID-CONVERT-006 | O sistema deve copiar as streams sem recodificação quando os codecs de origem são admitidos no formato de saída. | F | Should (em revisão) | Novo | UC-VID-012 (Passo 5, FA1, RN5) | Dado um MP4 H.264/AAC convertido para MOV, Quando a tarefa conclui, Então as streams do resultado são bit a bit idênticas às da origem. |
| REQ-VID-CONVERT-007 | O sistema deve preservar no vídeo convertido a duração, a resolução e a taxa de fotogramas do original. | F | Must (em revisão) | Novo | UC-VID-012 (Passo 6, RN6) | Dado um AVI de 60 s em 640×480 a 25 fps, Quando convertido para MP4, Então o resultado tem 60 s, 640×480 e 25 fps. |
| REQ-VID-CONVERT-008 | O sistema deve gerar a cópia de pré-visualização MP4 para os resultados de conversão em MOV ou AVI. | F | Must (em revisão) | Novo | UC-VID-012 (Passo 6, RN7, DQ-012, REQ-VID-UPLOAD-016) | Dado um vídeo convertido para AVI, Quando o utilizador o abre no leitor, Então é reproduzida a cópia de pré-visualização MP4 associada. |
| REQ-VID-CONVERT-009 | O sistema deve aceitar a conversão de formato numa cadeia de operações apenas como último passo. | F | Must (em revisão) | Novo | UC-VID-012 (FA5, RN13), UC-VID-014 (RN3, DQ-017) | Dado uma cadeia "converter para MOV → filtro Sépia", Quando o utilizador confirma, Então a cadeia é rejeitada com `INVALID_CHAIN`. |
| REQ-VID-CONCAT-001 | O sistema deve permitir ao utilizador registado ou premium selecionar dois ou mais vídeos do projeto para junção, incluindo o mesmo vídeo mais do que uma vez. | F | Must (em revisão) | Novo | UC-VID-013 (Passos 1-2, FA2, RN2) | Dado um projeto com os vídeos V1, V2 e V3, Quando o utilizador seleciona V1, V3 e V1, Então os três clips surgem na linha temporal por essa ordem. |
| REQ-VID-CONCAT-002 | O sistema deve apresentar os clips selecionados numa linha temporal pela ordem de seleção e permitir reordená-los. | F | Must (em revisão) | Novo | UC-VID-013 (Passos 2-3, RN4) | Dado a linha temporal V1, V2, V3, Quando o utilizador arrasta V3 para a primeira posição, Então a ordem passa a V3, V1, V2. |
| REQ-VID-CONCAT-003 | O sistema deve permitir remover um clip da linha temporal antes da confirmação. | F | Should (em revisão) | Novo | UC-VID-013 (FA1) | Dado a linha temporal V1, V2, V3, Quando o utilizador remove V2, Então a linha temporal passa a V1, V3 e a duração total é recalculada. |
| REQ-VID-CONCAT-004 | O sistema deve apresentar em tempo real a duração total estimada e a resolução e taxa de fotogramas do resultado. | F | Should (em revisão) | Novo | UC-VID-013 (Passos 2-3, RN5) | Dado os clips de 20 s, 35 s e 10 s, sendo o primeiro 1280×720 a 30 fps, Quando a seleção é feita, Então a interface indica 65 s e 1280×720 a 30 fps. |
| REQ-VID-CONCAT-005 | O sistema deve rejeitar pedidos de junção com menos de dois clips. | F | Must (em revisão) | Novo | UC-VID-013 (Passo 4, Exceção 1, RN2) | Dado um pedido via API com um único clip, Quando submetido, Então a API responde HTTP 422 com `INSUFFICIENT_INPUTS`. |
| REQ-VID-CONCAT-006 | O sistema deve rejeitar pedidos de junção com mais clips do que o limite do perfil (10 Registado, 50 Premium). | F | Must (em revisão) | Novo | UC-VID-013 (Passo 4, Exceção 2, FA5, RN2, DQ-015) | Dado um utilizador registado, Quando submete uma junção com 11 clips, Então a API responde HTTP 422 com `TOO_MANY_INPUTS` indicando o limite de 10. |
| REQ-VID-CONCAT-007 | O sistema deve rejeitar pedidos de junção cuja duração total exceda o limite de duração do perfil (5 min Registado, 60 min Premium). | F | Must (em revisão) | Novo | UC-VID-013 (Passo 4, Exceção 3, RN3, REQ-VID-NFR-008) | Dado um utilizador registado com clips de 3 min e 2 min 30 s, Quando submete a junção, Então a API responde HTTP 422 com `LIMIT_EXCEEDED` (5 min 30 s > 5 min). |
| REQ-VID-CONCAT-008 | O sistema deve normalizar cada clip para a resolução e a taxa de fotogramas do primeiro clip, acrescentando barras pretas quando a proporção difere. | F | Must (em revisão) | Novo | UC-VID-013 (Passo 6, RN5, DQ-019) | Dado um primeiro clip 1920×1080 a 30 fps e um segundo 1080×1920 a 25 fps, Quando a junção conclui, Então todo o resultado está em 1920×1080 a 30 fps e o segundo clip surge centrado com barras laterais. |
| REQ-VID-CONCAT-009 | O sistema deve acrescentar uma faixa de silêncio, com a duração do clip, a cada clip sem stream de áudio. | F | Must (em revisão) | Novo | UC-VID-013 (Passo 6, RN6) | Dado um clip silencioso de 10 s entre dois clips com áudio, Quando a junção conclui, Então o resultado tem uma única stream de áudio contínua com 10 s de silêncio nessa posição. |
| REQ-VID-CONCAT-010 | O sistema deve produzir um único vídeo MP4 (H.264/AAC) com os clips concatenados pela ordem definida, com corte seco entre eles. | F | Must (em revisão) | Novo | UC-VID-013 (Passos 6-7, Pós-condição, RN4, RN7, DQ-013) | Dado os clips de 20 s, 35 s e 10 s, Quando a junção conclui, Então o resultado tem 65 s e os conteúdos surgem pela ordem definida. |
| REQ-VID-CONCAT-011 | O sistema deve tratar a junção de forma atómica, não gravando qualquer resultado no projeto em caso de falha ou cancelamento. | F | Must (em revisão) | Novo | UC-VID-013 (Exceção 6, FA3-FA4, Garantia Mínima, RN9, DQ-018) | Dado uma falha no processamento do terceiro de quatro clips, Quando a tarefa transita para `failed`, Então nenhum vídeo novo surge no projeto. |
| REQ-VID-CHAIN-001 | O sistema deve permitir ao utilizador registado ou premium compor uma sequência ordenada de operações de vídeo a aplicar a um vídeo do projeto. | F | Must (em revisão) | Novo | UC-VID-014 (Passos 1-3, RN2) | Dado o editor de cadeia, Quando o utilizador adiciona "recorte", "ajuste" e "remover áudio", Então a cadeia apresenta os três passos por essa ordem. |
| REQ-VID-CHAIN-002 | O sistema deve disponibilizar como passos de cadeia o recorte, a remoção de áudio, a alteração de velocidade, a marca de água, o ajuste de propriedades visuais, o filtro, o redimensionamento, a rotação/espelho, a conversão de formato e a junção. | F | Must (em revisão) | Novo | UC-VID-014 (Passo 1, RN2, DQ-017, REQ-VID-COM-006) | Dado o editor de cadeia, Quando aberto, Então a lista de operações elegíveis contém as dez operações e não contém a extração de fotogramas. |
| REQ-VID-CHAIN-003 | O sistema deve validar os parâmetros de cada passo com as mesmas regras da operação isolada, face às propriedades estimadas à saída do passo anterior. | F | Must (em revisão) | Novo | UC-VID-014 (Passo 2, Exceção 1, RN6) | Dado um vídeo de 60 s com o passo "velocidade 2.0×" seguido de "recorte de 00:40 a 00:50", Quando o recorte é adicionado, Então é rejeitado com `INVALID_STEP_PARAMS` (duração estimada de 30 s). |
| REQ-VID-CHAIN-004 | O sistema deve permitir reordenar e remover passos, revalidando os passos seguintes e recalculando o custo total. | F | Must (em revisão) | Novo | UC-VID-014 (Passo 3, FA2) | Dado uma cadeia de três passos, Quando o utilizador remove o segundo, Então o custo passa de 3 para 2 créditos e o terceiro passo é revalidado. |
| REQ-VID-CHAIN-005 | O sistema deve permitir incluir um passo de junção, acrescentando outros vídeos do projeto como clips, cada um com uma sub-cadeia própria (possivelmente vazia) aplicada antes da junção. | F | Must (em revisão) | Novo | UC-VID-014 (FA1, RN4), UC-VID-013 (FA6) | Dado V1, V2 e V3, Quando o utilizador define (V1 + filtro de cor), (V2 + remover áudio) e (V3 + acelerar) seguidos de junção, Então a cadeia apresenta as três sub-cadeias ligadas ao passo de junção. |
| REQ-VID-CHAIN-006 | O sistema deve aplicar os passos definidos depois da junção ao resultado da junção. | F | Must (em revisão) | Novo | UC-VID-014 (FA1, RN4) | Dado a composição do exemplo seguida de "marca de água", Quando a cadeia conclui, Então o vídeo final contém os três clips editados e a marca de água em todos os fotogramas. |
| REQ-VID-CHAIN-007 | O sistema deve rejeitar cadeias vazias, com conversão de formato que não seja o último passo, com mais de uma junção ou com extração de fotogramas. | F | Must (em revisão) | Novo | UC-VID-014 (Passo 4, Exceção 2, RN2-RN3, DQ-017) | Dado uma cadeia com duas junções, Quando o utilizador confirma, Então a cadeia é rejeitada com `INVALID_CHAIN` indicando a regra violada. |
| REQ-VID-CHAIN-008 | O sistema deve impedir que uma cadeia ultrapasse 10 passos no total, contando sub-cadeias, junção e passos finais. | F | Must (em revisão) | Novo | UC-VID-014 (Passo 3, Exceção 3, RN5, DQ-015, REQ-VID-NFR-014) | Dado uma cadeia com 10 passos, Quando o utilizador tenta adicionar o 11.º, Então a ação é bloqueada com `CHAIN_TOO_LONG`. |
| REQ-VID-CHAIN-009 | O sistema deve apresentar, antes da confirmação, o custo total da cadeia em créditos, igual ao número total de passos (a junção conta 1). | F | Must (em revisão) | Novo | UC-VID-014 (Passos 1-3, RN7, DQ-014, REQ-VID-QUOTA-008) | Dado a composição do exemplo (3 passos por clip + junção + marca de água), Quando apresentada, Então o custo indicado é de 5 créditos. |
| REQ-VID-CHAIN-010 | O sistema deve executar a cadeia completa numa única tarefa assíncrona, que conta como uma tarefa ativa no projeto. | F | Must (em revisão) | Estender | UC-VID-014 (Passos 4-6, RN9, DQ-016, REQ-VID-TASK-006) | Dado uma cadeia de 4 passos confirmada, Quando a API responde, Então é devolvido um único `taskId` e o projeto tem uma única tarefa ativa. |
| REQ-VID-CHAIN-011 | O sistema deve gravar no projeto apenas o vídeo final da cadeia, purgando os resultados intermédios no fim da tarefa. | F | Must (em revisão) | Novo | UC-VID-014 (Passo 7, RN10) | Dado uma cadeia de 3 passos concluída, Quando consultada a galeria e o armazenamento, Então existe apenas um novo vídeo e nenhum ficheiro intermédio. |
| REQ-VID-CHAIN-012 | O sistema deve emitir via WebSocket o passo corrente (k de N) e o progresso percentual global da cadeia. | F | Should (em revisão) | Estender | UC-VID-014 (Passo 6, REQ-VID-TASK-006, REQ-VID-NFR-009) | Dado uma cadeia de 4 passos em execução, Quando o segundo passo inicia, Então o cliente recebe um evento com `step: 2`, `totalSteps: 4` e a percentagem global. |
| REQ-VID-CHAIN-013 | O sistema deve tratar a cadeia de forma atómica, não gravando qualquer resultado e devolvendo todos os créditos reservados se algum passo falhar ou a cadeia for cancelada. | F | Must (em revisão) | Novo | UC-VID-014 (Exceção 7, FA4-FA5, Garantia Mínima, RN8, RN11, DQ-018) | Dado uma cadeia de 3 passos que falha no terceiro, Quando a tarefa transita para `failed`, Então nenhum vídeo novo surge no projeto e os 3 créditos são devolvidos. |
| REQ-VID-CHAIN-014 | O sistema deve permitir guardar uma cadeia sem junção como predefinição com nome, reutilizável em novas cadeias e em lotes. | F | Could (em revisão) | Novo | UC-VID-014 (FA3), UC-VID-015 (FA3) | Dado uma cadeia "720p + marca de água" guardada, Quando o utilizador abre um lote, Então pode carregar a predefinição com todos os parâmetros preenchidos. |
| REQ-VID-BATCH-001 | O sistema deve permitir ao utilizador registado ou premium selecionar dois ou mais vídeos do projeto para processamento em lote. | F | Must (em revisão) | Novo | UC-VID-015 (Passo 1, RN2) | Dado a galeria do projeto, Quando o utilizador seleciona 4 vídeos e escolhe "Processar em Lote", Então os 4 vídeos surgem na lista do lote. |
| REQ-VID-BATCH-002 | O sistema deve permitir definir uma única operação ou cadeia de operações (sem junção) aplicada a todos os vídeos do lote. | F | Must (em revisão) | Novo | UC-VID-015 (Passo 2, RN3, DQ-017) | Dado um lote de 4 vídeos, Quando o utilizador define "redimensionar 720p → marca de água", Então a mesma configuração fica associada aos 4 vídeos. |
| REQ-VID-BATCH-003 | O sistema deve rejeitar configurações de lote que incluam junção ou extração de fotogramas. | F | Must (em revisão) | Novo | UC-VID-015 (Exceção 2, RN3, DQ-017) | Dado um lote com a operação "juntar", Quando submetido, Então a API responde HTTP 422 com `INVALID_BATCH_OPERATION`. |
| REQ-VID-BATCH-004 | O sistema deve pré-validar a configuração face aos metadados de cada vídeo e assinalar os vídeos incompatíveis com o respetivo motivo. | F | Must (em revisão) | Novo | UC-VID-015 (Passo 3, Exceção 3) | Dado um lote com recorte até 00:50 e um vídeo de 30 s, Quando a pré-validação corre, Então esse vídeo é assinalado como incompatível com o motivo "instante final superior à duração". |
| REQ-VID-BATCH-005 | O sistema deve permitir excluir do lote os vídeos assinalados como incompatíveis, recalculando o custo total. | F | Should (em revisão) | Novo | UC-VID-015 (FA2) | Dado 5 vídeos com 1 incompatível e custo de 2 créditos por vídeo, Quando o utilizador exclui o incompatível, Então o custo total passa de 10 para 8 créditos. |
| REQ-VID-BATCH-006 | O sistema deve rejeitar lotes com menos de dois vídeos ou com mais vídeos do que o limite do perfil (10 Registado, 50 Premium). | F | Must (em revisão) | Novo | UC-VID-015 (Exceção 1, FA5, RN2, DQ-015, REQ-VID-NFR-014) | Dado um utilizador registado, Quando submete um lote com 12 vídeos, Então a API responde HTTP 422 com `TOO_MANY_INPUTS` indicando o limite de 10. |
| REQ-VID-BATCH-007 | O sistema deve apresentar, antes da confirmação, o custo total do lote igual ao custo da operação ou cadeia multiplicado pelo número de vídeos elegíveis. | F | Must (em revisão) | Novo | UC-VID-015 (Passo 3, RN4, DQ-014, REQ-VID-QUOTA-008) | Dado uma cadeia de 2 passos aplicada a 3 vídeos elegíveis, Quando apresentado o resumo, Então o custo indicado é de 6 créditos. |
| REQ-VID-BATCH-008 | O sistema deve agrupar o lote sob um identificador próprio (`batchId`) com uma subtarefa por vídeo e um estado agregado. | F | Must (em revisão) | Estender | UC-VID-015 (Passo 4, REQ-VID-TASK-007) | Dado um lote de 3 vídeos aceite, Quando a API responde, Então devolve um `batchId` e três identificadores de subtarefa. |
| REQ-VID-BATCH-009 | O sistema deve processar os vídeos do lote sequencialmente, contando o lote como uma única tarefa ativa no projeto. | F | Must (em revisão) | Estender | UC-VID-015 (Passos 4 e 6, RN5, DQ-016, REQ-VID-NFR-008) | Dado um lote de 3 vídeos em execução, Quando consultado o estado das subtarefas, Então no máximo uma está em `processing` em cada instante. |
| REQ-VID-BATCH-010 | O sistema deve tratar os resultados do lote de forma independente, prosseguindo com os restantes vídeos quando o processamento de um vídeo falha. | F | Must (em revisão) | Novo | UC-VID-015 (Passo 7, Exceções 5-6, RN6, DQ-018) | Dado um lote de 4 vídeos em que o segundo falha, Quando o lote termina, Então o projeto tem 3 novos vídeos e o segundo está marcado como `failed`. |
| REQ-VID-BATCH-011 | O sistema deve debitar créditos apenas pelos vídeos concluídos, devolvendo os créditos reservados dos vídeos falhados ou cancelados. | F | Must (em revisão) | Estender | UC-VID-015 (Passos 5 e 7, RN4, RN7, REQ-VID-QUOTA-004, REQ-VID-QUOTA-007) | Dado um lote de 4 vídeos a 1 crédito em que 1 falha, Quando o lote termina, Então são debitados 3 créditos e 1 é devolvido. |
| REQ-VID-BATCH-012 | O sistema deve transitar o lote para `completed` quando pelo menos um vídeo é concluído e para `failed` quando todos falham, notificando o resumo de concluídos, falhados e créditos debitados. | F | Must (em revisão) | Novo | UC-VID-015 (Passo 8, REQ-VID-TASK-002) | Dado um lote com 3 concluídos e 1 falhado, Quando termina, Então o estado agregado é `completed` e a notificação indica "3 concluídos, 1 falhado, 3 créditos". |
| REQ-VID-BATCH-013 | O sistema deve emitir via WebSocket o estado de cada vídeo e o progresso agregado do lote (vídeos concluídos / total e percentagem global). | F | Should (em revisão) | Estender | UC-VID-015 (Passo 6, REQ-VID-TASK-007, REQ-VID-NFR-009) | Dado um lote de 4 vídeos em que 2 já concluíram, Quando inspecionado o tráfego WebSocket, Então o último evento indica `completed: 2`, `total: 4` e a percentagem global. |
| REQ-VID-BATCH-014 | O sistema deve permitir cancelar o lote, interrompendo o vídeo em curso e os pendentes e mantendo no projeto os vídeos já concluídos. | F | Should (em revisão) | Novo | UC-VID-015 (FA4) | Dado um lote de 5 vídeos com 2 concluídos, Quando o utilizador cancela, Então o lote transita para `cancelled`, os 2 vídeos mantêm-se e os créditos dos 3 restantes são devolvidos. |
| REQ-VID-BATCH-015 | O sistema deve permitir descarregar os vídeos concluídos de um lote num arquivo ZIP, sem consumo de quota. | F | Should (em revisão) | Estender | UC-VID-015 (FA1), UC-VID-006 (Q1) | Dado um lote com 3 vídeos concluídos, Quando o utilizador escolhe "Descarregar Lote", Então recebe um ZIP com os 3 vídeos e o saldo de quota mantém-se. |
| REQ-VID-NFR-012 | Os vídeos produzidos pela conversão de formato e pelas restantes operações devem ser descodificáveis sem erros e reproduzíveis em leitores de referência. | NF | Must (em revisão) | Novo | UC-VID-012 (RN3, RN7), DQ-002, DQ-012 | Dado um conjunto de vídeos convertidos para MP4, MOV e AVI, Quando analisados com FFprobe e abertos em VLC, Então não há erros de descodificação e todos são reproduzidos do início ao fim. |
| REQ-VID-NFR-013 | A execução de uma cadeia de operações deve recodificar a stream de vídeo no máximo uma vez, independentemente do número de passos. | NF | Must (em revisão) | Novo | UC-VID-014 (Passo 6, RN12, A1) | Dado uma cadeia de 4 passos, Quando inspecionados os logs do worker, Então existe uma única invocação de codificação de vídeo para o resultado final. |
| REQ-VID-NFR-014 | O sistema deve impor limites por perfil ao número de vídeos por lote e por junção e ao número de passos por cadeia. | NF | Must (em revisão) | Novo | UC-VID-013 (RN2-RN3), UC-VID-014 (RN5), UC-VID-015 (RN2), DQ-015 | Dado um utilizador registado, Quando submete um lote de 11 vídeos ou uma cadeia de 11 passos, Então o pedido é rejeitado antes da criação da tarefa. |
| REQ-VID-NFR-015 | As pré-visualizações estáticas de ajustes, filtros, redimensionamento e orientação devem ser apresentadas em tempo interativo. | NF | Must (em revisão) | Novo | UC-VID-008 (Passo 2), UC-VID-009 (Passo 2), UC-VID-010 (Passo 2), UC-VID-011 (Passo 2) | Dado o painel de filtros aberto, Quando o utilizador seleciona um filtro, Então a pré-visualização é apresentada em $\leq 1$ s em 95% dos pedidos. |
| REQ-VID-NFR-016 | O descarregamento de vídeos deve ser servido diretamente pelo armazenamento de objetos, sem atravessar o API Gateway, e suportar a retoma de transferências. | NF | Must (em revisão) | Novo | UC-VID-006 (Passos 2-3, FA2), DQ-023 | Dado um descarregamento de 1,5 GB interrompido, Quando retomado com `Range`, Então o armazenamento responde HTTP 206 e o tráfego do ficheiro não passa pelo API Gateway. |

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
| Interface Web Frontend (`frontend/`) — novas operações | Estender | Acrescentar os painéis de ajuste, filtros, redimensionamento, orientação e conversão com pré-visualização, a linha temporal de junção, o editor de cadeias (incluindo sub-cadeias por clip) com contador de créditos, a configuração de lotes com pré-validação, o painel de informações e as ações de descarregamento. | REQ-VID-DOWNLOAD-001, REQ-VID-INFO-001 a 006, REQ-VID-ADJUST-001 a 005, REQ-VID-FILTER-001 a 004, REQ-VID-RESIZE-001 a 005, REQ-VID-ORIENT-001 a 005, REQ-VID-CONVERT-001 a 003, REQ-VID-CONCAT-001 a 004, REQ-VID-CHAIN-001 a 009, REQ-VID-BATCH-001 a 007 |
| Workers de Processamento (`Tools/` e serviços Python) — novas operações | Estender | Acrescentar workers FFmpeg para ajuste (`eq`), filtros, redimensionamento (`scale`), orientação (`transpose`/`hflip`/`vflip`), conversão (remux/transcodificação), junção (`concat` com normalização) e um executor de cadeias que compõe os passos num único *filtergraph*; gerar cópias de pré-visualização MP4. | REQ-VID-ADJUST-008, REQ-VID-FILTER-006, REQ-VID-RESIZE-008, REQ-VID-ORIENT-008, REQ-VID-CONVERT-005 a 008, REQ-VID-CONCAT-008 a 010, REQ-VID-CHAIN-010 a 013, REQ-VID-UPLOAD-016, REQ-VID-NFR-013 |
| Mensageria e Filas (`projects/utils/project_msg.js`, RabbitMQ) — cadeias e lotes | Estender | Suportar mensagens de tarefas compostas (lista de passos e sub-cadeias) e de lotes (`batchId` com subtarefas), com estado agregado, passo corrente e processamento sequencial que conta como 1 tarefa ativa por projeto. | REQ-VID-TASK-006, REQ-VID-TASK-007, REQ-VID-CHAIN-010, REQ-VID-CHAIN-012, REQ-VID-BATCH-008 a 014 |
| Serviço de Subscrições e Quotas (`users/`, `subscriptions/`) — custos multi-crédito | Alterar | Calcular o custo por pedido (N créditos por cadeia, custo × vídeos concluídos no lote) e reservar, confirmar e estornar vários créditos de uma só vez. | REQ-VID-QUOTA-007, REQ-VID-QUOTA-008, REQ-VID-CHAIN-009, REQ-VID-CHAIN-013, REQ-VID-BATCH-007, REQ-VID-BATCH-011 |
| Armazenamento de Objetos (`imageStorageService`, SeaweedFS/S3) — descarregamento e pré-visualização | Estender | Servir descarregamentos por URL assinado com pedidos `Range`, gerar arquivos ZIP de lotes e guardar cópias de pré-visualização MP4 associadas aos originais e resultados MOV/AVI. | REQ-VID-DOWNLOAD-002, REQ-VID-DOWNLOAD-006, REQ-VID-DOWNLOAD-007, REQ-VID-BATCH-015, REQ-VID-UPLOAD-016, REQ-VID-UPLOAD-017, REQ-VID-NFR-016 |
| Modelos de Dados MongoDB (`projects/models/`) — proveniência múltipla e predefinições | Alterar | Suportar `sourceVideoIds` ordenados, a descrição dos passos aplicados, a referência à cópia de pré-visualização, os lotes e as predefinições de cadeia por utilizador. | REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-INFO-008, REQ-VID-CHAIN-014, REQ-VID-TASK-007, REQ-VID-UPLOAD-016 |

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
| UC-VID-000 FA5 | Carregamento de vídeo em MOV ou AVI com cópia de pré-visualização MP4 | REQ-VID-UPLOAD-003, REQ-VID-UPLOAD-009, REQ-VID-UPLOAD-010, REQ-VID-UPLOAD-016, REQ-VID-UPLOAD-017, REQ-VID-NFR-003 |
| UC-VID-000 RN8 | Cópia de pré-visualização exclusiva do reprodutor; operações e descarregamento usam o original | REQ-VID-UPLOAD-016, REQ-VID-UPLOAD-017, REQ-VID-DOWNLOAD-006 |
| UC-VID-006 Pré-condições | JWT válido, permissão de leitura ou superior, recurso de vídeo concluído | REQ-VID-AUTH-001, REQ-VID-DOWNLOAD-001, REQ-VID-DOWNLOAD-003, REQ-VID-NFR-001 |
| UC-VID-006 Passo 1 | Seleção do vídeo, verificação de permissão e estado, nome, formato e tamanho | REQ-VID-DOWNLOAD-001, REQ-VID-DOWNLOAD-003, REQ-VID-DOWNLOAD-005 |
| UC-VID-006 Passo 2 | Geração de URL assinado temporário (15 min) sem débito de quota | REQ-VID-DOWNLOAD-002, REQ-VID-DOWNLOAD-004, REQ-VID-QUOTA-008, REQ-VID-NFR-001 |
| UC-VID-006 Passo 3 | Transferência direta do storage com nome de ficheiro sugerido | REQ-VID-DOWNLOAD-005, REQ-VID-DOWNLOAD-006, REQ-VID-NFR-016 |
| UC-VID-006 Passo 4 | Registo do descarregamento com `correlationId` | REQ-VID-DOWNLOAD-009, REQ-VID-NFR-002 |
| UC-VID-006 FA1 | Descarregamento a partir do reprodutor integrado | REQ-VID-DOWNLOAD-001, REQ-VID-UPLOAD-015 |
| UC-VID-006 FA2 | Retoma de transferência interrompida (HTTP `Range`) | REQ-VID-DOWNLOAD-007, REQ-VID-NFR-016 |
| UC-VID-006 FA3 | Regeneração de URL expirado | REQ-VID-DOWNLOAD-008 |
| UC-VID-006 FA4 | Descarregamento do original no formato carregado (não a pré-visualização) | REQ-VID-DOWNLOAD-006, REQ-VID-UPLOAD-017 |
| UC-VID-006 Exceção 1 | Recurso ainda não concluído | REQ-VID-DOWNLOAD-003, REQ-VID-ERROR-001 |
| UC-VID-006 Exceção 2 | Utilizador sem permissão sobre o projeto | REQ-VID-AUTH-001, REQ-VID-DOWNLOAD-001, REQ-VID-ERROR-001 |
| UC-VID-006 Exceção 3 | URL usado por outro utilizador ou após expirar | REQ-VID-DOWNLOAD-002, REQ-VID-NFR-001 |
| UC-VID-006 Exceção 4 | Objeto inexistente no armazenamento | REQ-VID-DOWNLOAD-009, REQ-VID-ERROR-001, REQ-VID-ERROR-002 |
| UC-VID-006 Garantia Sucesso | Cópia no dispositivo no formato armazenado, recurso inalterado, sem quota | REQ-VID-DOWNLOAD-004, REQ-VID-DOWNLOAD-006 |
| UC-VID-006 Garantia Mínima | Nenhum URL exposto a não autorizados, recurso e quota inalterados | REQ-VID-DOWNLOAD-002, REQ-VID-DOWNLOAD-004, REQ-VID-NFR-001 |
| UC-VID-006 RN1 a RN7 | Regras de perfis e permissões, isenção de quota, estado, URL assinado, nome e formato | REQ-VID-AUTH-002, REQ-VID-DOWNLOAD-001 a 009, REQ-VID-QUOTA-008, REQ-VID-NFR-001, REQ-VID-NFR-016 |
| UC-VID-007 Pré-condições | JWT válido, permissão de leitura ou superior, recurso de vídeo existente | REQ-VID-AUTH-001, REQ-VID-INFO-001 |
| UC-VID-007 Passo 1 | Abertura do painel a partir dos metadados persistidos, sem tarefa nem quota | REQ-VID-INFO-001, REQ-VID-INFO-007, REQ-VID-QUOTA-008 |
| UC-VID-007 Passo 2 | Apresentação de duração, resolução, formato, tamanho e taxa de fotogramas | REQ-VID-INFO-002, REQ-VID-INFO-003, REQ-VID-INFO-004, REQ-VID-INFO-005, REQ-VID-INFO-006, REQ-VID-UPLOAD-013, REQ-VID-STORAGE-001 |
| UC-VID-007 Passo 3 | Fecho do painel sem alterações | REQ-VID-INFO-007 |
| UC-VID-007 FA1 | Proveniência e operações aplicadas em vídeos resultantes | REQ-VID-INFO-008, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004 |
| UC-VID-007 FA2 | Formato original de MOV/AVI (não a pré-visualização) | REQ-VID-INFO-004, REQ-VID-UPLOAD-017 |
| UC-VID-007 FA3 | Consulta a partir do reprodutor integrado | REQ-VID-INFO-001, REQ-VID-UPLOAD-015 |
| UC-VID-007 Exceção 1 | Metadado indisponível | REQ-VID-INFO-009, REQ-VID-ERROR-002 |
| UC-VID-007 Exceção 2 | Utilizador sem permissão sobre o projeto | REQ-VID-AUTH-001, REQ-VID-ERROR-001 |
| UC-VID-007 Exceção 3 | Recurso ainda em processamento | REQ-VID-TASK-002, REQ-VID-COM-002 |
| UC-VID-007 Garantia Sucesso | Informações apresentadas, sem tarefa nem quota | REQ-VID-INFO-001 a 007 |
| UC-VID-007 Garantia Mínima | Projeto, recurso e quota inalterados | REQ-VID-INFO-007 |
| UC-VID-007 RN1 a RN5 | Regras de permissões, isenção de quota, fonte dos metadados e unidades | REQ-VID-AUTH-002, REQ-VID-INFO-001 a 009, REQ-VID-QUOTA-008 |
| UC-VID-008 Pré-condições | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-008 Passo 1 | Apresentação dos controlos de brilho, contraste e saturação no neutro 1.0 | REQ-VID-COM-001, REQ-VID-ADJUST-001, REQ-VID-ADJUST-002, REQ-VID-ADJUST-003, REQ-VID-ADJUST-004 |
| UC-VID-008 Passo 2 | Ajuste dos fatores e pré-visualização estática do primeiro fotograma | REQ-VID-ADJUST-001, REQ-VID-ADJUST-002, REQ-VID-ADJUST-003, REQ-VID-ADJUST-005, REQ-VID-NFR-015 |
| UC-VID-008 Passo 3 | Confirmação da operação, validação e verificação de quota | REQ-VID-ADJUST-006, REQ-VID-ADJUST-007, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| UC-VID-008 Passo 4 | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| UC-VID-008 Passo 5 | Aplicação uniforme dos ajustes a todos os fotogramas com progresso | REQ-VID-ADJUST-008, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| UC-VID-008 Passo 6 | Geração do MP4 com duração, resolução, fps e áudio preservados | REQ-VID-ADJUST-009, REQ-VID-NFR-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| UC-VID-008 Passo 7 | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| UC-VID-008 FA1 | Reposição dos valores neutros | REQ-VID-ADJUST-004 |
| UC-VID-008 FA2 | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-008 FA3 | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-008 FA4 | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| UC-VID-008 FA5 | Utilização como passo de cadeia ou em lote | REQ-VID-COM-006, REQ-VID-CHAIN-002, REQ-VID-BATCH-002 |
| UC-VID-008 Exceção 1 | Fator de ajuste fora do intervalo [0.0, 2.0] | REQ-VID-COM-005, REQ-VID-ADJUST-006, REQ-VID-ERROR-001 |
| UC-VID-008 Exceção 2 | Todos os fatores no neutro (sem alterações) | REQ-VID-ADJUST-007, REQ-VID-ERROR-001 |
| UC-VID-008 Exceção 3 | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| UC-VID-008 Exceção 4 | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| UC-VID-008 Exceção 5 | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| UC-VID-008 Exceção 6 | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| UC-VID-008 Garantia Sucesso | Novo vídeo MP4 com ajustes uniformes, original preservado, 1 quota debitada | REQ-VID-ADJUST-008, REQ-VID-ADJUST-009, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| UC-VID-008 Garantia Mínima | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| UC-VID-008 RN1 a RN11 | Regras de perfis, intervalo e neutro dos fatores, uniformidade, formato de saída e quotas | REQ-VID-AUTH-002, REQ-VID-ADJUST-001 a 009, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-009 Pré-condições | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-009 Passo 1 | Apresentação do catálogo de filtros com miniaturas de exemplo | REQ-VID-COM-001, REQ-VID-FILTER-001, REQ-VID-FILTER-002 |
| UC-VID-009 Passo 2 | Seleção de um filtro e pré-visualização estática | REQ-VID-FILTER-003, REQ-VID-FILTER-004, REQ-VID-NFR-015 |
| UC-VID-009 Passo 3 | Confirmação da operação, validação e verificação de quota | REQ-VID-FILTER-005, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| UC-VID-009 Passo 4 | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| UC-VID-009 Passo 5 | Aplicação uniforme do filtro a todos os fotogramas com progresso | REQ-VID-FILTER-006, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| UC-VID-009 Passo 6 | Geração do MP4 com duração, resolução, fps e áudio preservados | REQ-VID-FILTER-007, REQ-VID-NFR-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| UC-VID-009 Passo 7 | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| UC-VID-009 FA1 | Troca de filtro após pré-visualização | REQ-VID-FILTER-003, REQ-VID-FILTER-004 |
| UC-VID-009 FA2 | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-009 FA3 | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-009 FA4 | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| UC-VID-009 FA5 | Utilização como passo de cadeia ou em lote | REQ-VID-COM-006, REQ-VID-CHAIN-002, REQ-VID-BATCH-002 |
| UC-VID-009 Exceção 1 | Nenhum filtro selecionado ou filtro inexistente | REQ-VID-COM-005, REQ-VID-FILTER-005, REQ-VID-ERROR-001 |
| UC-VID-009 Exceção 2 | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| UC-VID-009 Exceção 3 | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| UC-VID-009 Exceção 4 | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| UC-VID-009 Exceção 5 | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| UC-VID-009 Garantia Sucesso | Novo vídeo MP4 com o filtro aplicado, original preservado, 1 quota debitada | REQ-VID-FILTER-006, REQ-VID-FILTER-007, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| UC-VID-009 Garantia Mínima | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| UC-VID-009 RN1 a RN11 | Regras de perfis, catálogo fechado, um filtro por operação, uniformidade e quotas | REQ-VID-AUTH-002, REQ-VID-FILTER-001 a 007, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-010 Pré-condições | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-010 Passo 1 | Apresentação da resolução atual, bloqueio de proporção e predefinições | REQ-VID-COM-001, REQ-VID-RESIZE-001, REQ-VID-RESIZE-002, REQ-VID-RESIZE-003 |
| UC-VID-010 Passo 2 | Escolha das dimensões com recálculo proporcional e arredondamento par | REQ-VID-RESIZE-001, REQ-VID-RESIZE-002, REQ-VID-RESIZE-003 |
| UC-VID-010 Passo 3 | Confirmação da operação, validação e verificação de quota | REQ-VID-RESIZE-006, REQ-VID-RESIZE-007, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| UC-VID-010 Passo 4 | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| UC-VID-010 Passo 5 | Reamostragem de todos os fotogramas com progresso | REQ-VID-RESIZE-008, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| UC-VID-010 Passo 6 | Geração do MP4 com as dimensões exatas e duração, fps e áudio preservados | REQ-VID-RESIZE-008, REQ-VID-RESIZE-009, REQ-VID-NFR-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| UC-VID-010 Passo 7 | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| UC-VID-010 FA1 | Desbloqueio da proporção com aviso de distorção | REQ-VID-RESIZE-004 |
| UC-VID-010 FA2 | Ampliação acima da resolução original com aviso | REQ-VID-RESIZE-005 |
| UC-VID-010 FA3 | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-010 FA4 | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-010 FA5 | Execução por utilizador Premium (teto 3840×2160) | REQ-VID-QUOTA-005, REQ-VID-RESIZE-006, REQ-VID-NFR-008 |
| UC-VID-010 FA6 | Utilização como passo de cadeia ou em lote | REQ-VID-COM-006, REQ-VID-CHAIN-002, REQ-VID-BATCH-002 |
| UC-VID-010 Exceção 1 | Dimensões ímpares, inferiores a 128 px ou acima do teto do perfil | REQ-VID-COM-005, REQ-VID-RESIZE-006, REQ-VID-ERROR-001 |
| UC-VID-010 Exceção 2 | Dimensões iguais às do original | REQ-VID-RESIZE-007, REQ-VID-ERROR-001 |
| UC-VID-010 Exceção 3 | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| UC-VID-010 Exceção 4 | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| UC-VID-010 Exceção 5 | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| UC-VID-010 Exceção 6 | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| UC-VID-010 Garantia Sucesso | Novo vídeo MP4 com as dimensões confirmadas, original preservado, 1 quota debitada | REQ-VID-RESIZE-008, REQ-VID-RESIZE-009, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| UC-VID-010 Garantia Mínima | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| UC-VID-010 RN1 a RN12 | Regras de perfis, dimensões pares e tetos, proporção, ampliação, formato de saída e quotas | REQ-VID-AUTH-002, REQ-VID-RESIZE-001 a 009, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-011 Pré-condições | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-011 Passo 1 | Apresentação das rotações (90°/180°/270°) e espelhos | REQ-VID-COM-001, REQ-VID-ORIENT-001, REQ-VID-ORIENT-002, REQ-VID-ORIENT-003 |
| UC-VID-011 Passo 2 | Escolha da transformação combinada e pré-visualização com dimensões resultantes | REQ-VID-ORIENT-001, REQ-VID-ORIENT-002, REQ-VID-ORIENT-003, REQ-VID-ORIENT-004, REQ-VID-ORIENT-005, REQ-VID-NFR-015 |
| UC-VID-011 Passo 3 | Confirmação da operação, validação e verificação de quota | REQ-VID-ORIENT-006, REQ-VID-ORIENT-007, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| UC-VID-011 Passo 4 | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| UC-VID-011 Passo 5 | Aplicação da transformação a todos os fotogramas com progresso | REQ-VID-ORIENT-004, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| UC-VID-011 Passo 6 | Geração do MP4 com dimensões trocadas a 90°/270° e duração, fps e áudio preservados | REQ-VID-ORIENT-008, REQ-VID-ORIENT-009, REQ-VID-NFR-003, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| UC-VID-011 Passo 7 | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| UC-VID-011 FA1 | Alteração da transformação após pré-visualização | REQ-VID-ORIENT-005 |
| UC-VID-011 FA2 | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-011 FA3 | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-011 FA4 | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| UC-VID-011 FA5 | Utilização como passo de cadeia ou em lote | REQ-VID-COM-006, REQ-VID-CHAIN-002, REQ-VID-BATCH-002 |
| UC-VID-011 Exceção 1 | Ângulo de rotação fora de {90°, 180°, 270°} | REQ-VID-COM-005, REQ-VID-ORIENT-006, REQ-VID-ERROR-001 |
| UC-VID-011 Exceção 2 | Nenhuma transformação definida | REQ-VID-ORIENT-007, REQ-VID-ERROR-001 |
| UC-VID-011 Exceção 3 | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| UC-VID-011 Exceção 4 | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| UC-VID-011 Exceção 5 | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| UC-VID-011 Exceção 6 | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| UC-VID-011 Garantia Sucesso | Novo vídeo MP4 com a orientação pretendida, original preservado, 1 quota debitada | REQ-VID-ORIENT-008, REQ-VID-ORIENT-009, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| UC-VID-011 Garantia Mínima | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| UC-VID-011 RN1 a RN12 | Regras de perfis, ângulos, combinação rotação/espelho, troca de dimensões, formato e quotas | REQ-VID-AUTH-002, REQ-VID-ORIENT-001 a 009, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-012 Pré-condições | JWT válido, permissão no projeto, vídeo elegível (MP4/MOV/AVI), sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-012 Passo 1 | Apresentação do formato atual e dos formatos de saída suportados | REQ-VID-COM-001, REQ-VID-CONVERT-001 |
| UC-VID-012 Passo 2 | Seleção do formato de saída e indicação de codecs e de cópia direta/recodificação | REQ-VID-CONVERT-002, REQ-VID-CONVERT-003 |
| UC-VID-012 Passo 3 | Confirmação da operação, validação e verificação de quota | REQ-VID-CONVERT-004, REQ-VID-COM-004, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| UC-VID-012 Passo 4 | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| UC-VID-012 Passo 5 | Remux ou recodificação para os codecs da matriz com progresso | REQ-VID-CONVERT-005, REQ-VID-CONVERT-006, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| UC-VID-012 Passo 6 | Armazenamento com duração/resolução/fps preservados e cópia de pré-visualização MOV/AVI | REQ-VID-CONVERT-007, REQ-VID-CONVERT-008, REQ-VID-NFR-012, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003 |
| UC-VID-012 Passo 7 | Disponibilização do resultado e preservação do original | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| UC-VID-012 FA1 | Conversão por cópia direta de streams | REQ-VID-CONVERT-006 |
| UC-VID-012 FA2 | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-012 FA3 | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-COM-002 |
| UC-VID-012 FA4 | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-NFR-008 |
| UC-VID-012 FA5 | Utilização como último passo de cadeia ou em lote | REQ-VID-CONVERT-009, REQ-VID-COM-006, REQ-VID-BATCH-002 |
| UC-VID-012 Exceção 1 | Formato de saída igual ao atual | REQ-VID-COM-005, REQ-VID-CONVERT-004, REQ-VID-ERROR-001 |
| UC-VID-012 Exceção 2 | Formato de saída fora da matriz suportada | REQ-VID-COM-005, REQ-VID-CONVERT-004, REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| UC-VID-012 Exceção 3 | Formato ou codec de vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| UC-VID-012 Exceção 4 | Duração ou tamanho superior ao limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| UC-VID-012 Exceção 5 | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| UC-VID-012 Exceção 6 | Falha de processamento durante a execução | REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-COM-002, REQ-VID-NFR-007 |
| UC-VID-012 Garantia Sucesso | Novo vídeo no formato escolhido, conforme à matriz, original preservado, 1 quota debitada | REQ-VID-CONVERT-005, REQ-VID-CONVERT-007, REQ-VID-CONVERT-008, REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| UC-VID-012 Garantia Mínima | Original inalterado, sem resultados parciais gravados, quota devolvida | REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| UC-VID-012 RN1 a RN13 | Regras de perfis, matriz de formatos e codecs, remux, preservação, pré-visualização e posição na cadeia | REQ-VID-AUTH-002, REQ-VID-CONVERT-001 a 009, REQ-VID-QUOTA-001 a 005, REQ-VID-TASK-001, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-012 |
| UC-VID-013 Pré-condições | JWT válido, permissão de edição, pelo menos dois vídeos elegíveis, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-013 Passo 1 | Lista de vídeos elegíveis e limites do perfil | REQ-VID-COM-001, REQ-VID-CONCAT-001, REQ-VID-NFR-014 |
| UC-VID-013 Passo 2 | Seleção de dois ou mais vídeos na linha temporal com duração total | REQ-VID-CONCAT-001, REQ-VID-CONCAT-002, REQ-VID-CONCAT-004 |
| UC-VID-013 Passo 3 | Reordenação e indicação da resolução/fps do resultado | REQ-VID-CONCAT-002, REQ-VID-CONCAT-004 |
| UC-VID-013 Passo 4 | Confirmação, validação de número, duração e formatos, verificação de quota | REQ-VID-COM-004, REQ-VID-CONCAT-005, REQ-VID-CONCAT-006, REQ-VID-CONCAT-007, REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| UC-VID-013 Passo 5 | Reserva de quota e notificação do estado `queued` | REQ-VID-QUOTA-002, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| UC-VID-013 Passo 6 | Normalização, silêncio nos clips mudos, concatenação e progresso | REQ-VID-CONCAT-008, REQ-VID-CONCAT-009, REQ-VID-CONCAT-010, REQ-VID-TASK-002, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| UC-VID-013 Passo 7 | Geração do MP4, associação com `sourceVideoIds` e consolidação de quota | REQ-VID-CONCAT-010, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-QUOTA-003, REQ-VID-NFR-003 |
| UC-VID-013 Passo 8 | Disponibilização do resultado e preservação dos originais | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| UC-VID-013 FA1 | Remoção de um clip da seleção | REQ-VID-CONCAT-003, REQ-VID-CONCAT-005 |
| UC-VID-013 FA2 | Repetição de um vídeo na linha temporal | REQ-VID-CONCAT-001 |
| UC-VID-013 FA3 | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-CONCAT-011 |
| UC-VID-013 FA4 | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-CONCAT-011 |
| UC-VID-013 FA5 | Execução por utilizador Premium (até 50 vídeos e 60 min) | REQ-VID-QUOTA-005, REQ-VID-CONCAT-006, REQ-VID-CONCAT-007, REQ-VID-NFR-014 |
| UC-VID-013 FA6 | Junção como passo de uma cadeia | REQ-VID-CHAIN-005, REQ-VID-CHAIN-006 |
| UC-VID-013 Exceção 1 | Menos de dois vídeos selecionados | REQ-VID-COM-005, REQ-VID-CONCAT-005, REQ-VID-ERROR-001 |
| UC-VID-013 Exceção 2 | Número de vídeos acima do limite do perfil | REQ-VID-COM-005, REQ-VID-CONCAT-006, REQ-VID-ERROR-001, REQ-VID-NFR-014 |
| UC-VID-013 Exceção 3 | Duração total acima do limite do perfil | REQ-VID-COM-005, REQ-VID-CONCAT-007, REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| UC-VID-013 Exceção 4 | Formato ou codec de algum vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| UC-VID-013 Exceção 5 | Quota diária esgotada no perfil Registado | REQ-VID-QUOTA-001, REQ-VID-ERROR-001 |
| UC-VID-013 Exceção 6 | Falha de processamento em qualquer clip | REQ-VID-CONCAT-011, REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| UC-VID-013 Garantia Sucesso | Único MP4 com os clips por ordem, origens registadas, 1 quota debitada | REQ-VID-CONCAT-010, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-COM-003, REQ-VID-QUOTA-003 |
| UC-VID-013 Garantia Mínima | Sem resultado parcial, temporários purgados, quota devolvida, originais inalterados | REQ-VID-CONCAT-011, REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| UC-VID-013 RN1 a RN13 | Regras de número de clips, duração total, ordem, normalização, silêncio, quota, atomicidade e proveniência | REQ-VID-AUTH-002, REQ-VID-CONCAT-001 a 011, REQ-VID-QUOTA-001 a 008, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-NFR-003, REQ-VID-NFR-008, REQ-VID-NFR-014 |
| UC-VID-014 Pré-condições | JWT válido, permissão de edição, vídeo(s) elegível(eis), quota para o custo total, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-QUOTA-007, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-014 Passo 1 | Editor de cadeia com operações elegíveis e contador de créditos | REQ-VID-CHAIN-001, REQ-VID-CHAIN-002, REQ-VID-CHAIN-009, REQ-VID-COM-006 |
| UC-VID-014 Passo 2 | Adição e configuração de passo validado face ao passo anterior | REQ-VID-CHAIN-001, REQ-VID-CHAIN-003, REQ-VID-COM-004 |
| UC-VID-014 Passo 3 | Cadeia completa, limite de 10 passos, custo total e duração estimada | REQ-VID-CHAIN-004, REQ-VID-CHAIN-008, REQ-VID-CHAIN-009, REQ-VID-QUOTA-008 |
| UC-VID-014 Passo 4 | Revalidação da estrutura e dos passos, limites e quota para o custo total | REQ-VID-CHAIN-003, REQ-VID-CHAIN-007, REQ-VID-QUOTA-001, REQ-VID-QUOTA-007, REQ-VID-TASK-001, REQ-VID-NFR-005 |
| UC-VID-014 Passo 5 | Reserva da totalidade dos créditos e notificação do estado `queued` | REQ-VID-QUOTA-007, REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-TASK-006 |
| UC-VID-014 Passo 6 | Execução numa única tarefa, uma recodificação, passo corrente e progresso | REQ-VID-CHAIN-010, REQ-VID-CHAIN-012, REQ-VID-TASK-006, REQ-VID-NFR-006, REQ-VID-NFR-009, REQ-VID-NFR-013 |
| UC-VID-014 Passo 7 | Gravação apenas do vídeo final com proveniência e passos, consolidação de créditos | REQ-VID-CHAIN-011, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-STORAGE-004, REQ-VID-QUOTA-003 |
| UC-VID-014 Passo 8 | Disponibilização do resultado e preservação dos originais | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| UC-VID-014 FA1 | Composição com junção: sub-cadeias por clip, junção e cadeia sobre o resultado | REQ-VID-CHAIN-005, REQ-VID-CHAIN-006, REQ-VID-CONCAT-008 a 010, REQ-VID-STORAGE-004 |
| UC-VID-014 FA2 | Reordenação ou remoção de passos com revalidação | REQ-VID-CHAIN-004 |
| UC-VID-014 FA3 | Guardar e reutilizar a cadeia como predefinição | REQ-VID-CHAIN-014 |
| UC-VID-014 FA4 | Cancelamento antes do início do processamento (`queued`) | REQ-VID-TASK-004, REQ-VID-QUOTA-004, REQ-VID-CHAIN-013 |
| UC-VID-014 FA5 | Cancelamento durante o processamento (`processing`) | REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004, REQ-VID-CHAIN-013 |
| UC-VID-014 FA6 | Execução por utilizador com perfil Premium | REQ-VID-QUOTA-005, REQ-VID-CHAIN-008, REQ-VID-NFR-008 |
| UC-VID-014 FA7 | Utilizador abandona a sessão com continuidade assíncrona | REQ-VID-TASK-001, REQ-VID-TASK-006, REQ-VID-NFR-006 |
| UC-VID-014 Exceção 1 | Parâmetros inválidos num passo | REQ-VID-COM-005, REQ-VID-CHAIN-003, REQ-VID-ERROR-001 |
| UC-VID-014 Exceção 2 | Estrutura de cadeia inválida | REQ-VID-CHAIN-007, REQ-VID-CONVERT-009, REQ-VID-ERROR-001 |
| UC-VID-014 Exceção 3 | Cadeia com mais de 10 passos | REQ-VID-CHAIN-008, REQ-VID-NFR-014 |
| UC-VID-014 Exceção 4 | Quota inferior ao custo total da cadeia | REQ-VID-QUOTA-001, REQ-VID-QUOTA-007, REQ-VID-ERROR-001 |
| UC-VID-014 Exceção 5 | Duração ou tamanho acima do limite do perfil | REQ-VID-ERROR-001, REQ-VID-NFR-008 |
| UC-VID-014 Exceção 6 | Formato ou codec de algum vídeo não suportado | REQ-VID-ERROR-001, REQ-VID-NFR-003 |
| UC-VID-014 Exceção 7 | Falha num qualquer passo durante a execução | REQ-VID-CHAIN-013, REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-QUOTA-004, REQ-VID-NFR-007 |
| UC-VID-014 Garantia Sucesso | Único vídeo final com todos os passos, sem intermédios, N créditos debitados | REQ-VID-CHAIN-010, REQ-VID-CHAIN-011, REQ-VID-STORAGE-004, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-QUOTA-008 |
| UC-VID-014 Garantia Mínima | Política tudo-ou-nada, temporários purgados, todos os créditos devolvidos | REQ-VID-CHAIN-013, REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| UC-VID-014 RN1 a RN14 | Regras de operações elegíveis, estrutura, limite de passos, validação, custo N, tarefa única, atomicidade e recodificação | REQ-VID-AUTH-002, REQ-VID-CHAIN-001 a 014, REQ-VID-QUOTA-001 a 008, REQ-VID-TASK-006, REQ-VID-COM-006, REQ-VID-NFR-003, REQ-VID-NFR-013, REQ-VID-NFR-014 |
| UC-VID-015 Pré-condições | JWT válido, permissão de edição, dois ou mais vídeos elegíveis, quota para o custo total, sem outra tarefa ativa | REQ-VID-AUTH-001, REQ-VID-AUTH-003, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-QUOTA-007, REQ-VID-NFR-001, REQ-VID-NFR-003, REQ-VID-NFR-008 |
| UC-VID-015 Passo 1 | Seleção dos vídeos e apresentação dos limites do perfil | REQ-VID-BATCH-001, REQ-VID-NFR-014 |
| UC-VID-015 Passo 2 | Definição de uma operação ou cadeia sem junção | REQ-VID-BATCH-002, REQ-VID-BATCH-003, REQ-VID-COM-004, REQ-VID-COM-006 |
| UC-VID-015 Passo 3 | Pré-validação por vídeo e custo total | REQ-VID-BATCH-004, REQ-VID-BATCH-007, REQ-VID-QUOTA-008 |
| UC-VID-015 Passo 4 | Verificação de quota, criação do lote (`batchId`) como 1 tarefa ativa | REQ-VID-BATCH-006, REQ-VID-BATCH-008, REQ-VID-BATCH-009, REQ-VID-QUOTA-001, REQ-VID-QUOTA-007, REQ-VID-TASK-007, REQ-VID-NFR-005 |
| UC-VID-015 Passo 5 | Reserva da totalidade dos créditos e notificação do estado `queued` | REQ-VID-QUOTA-007, REQ-VID-TASK-002, REQ-VID-TASK-003, REQ-VID-TASK-007 |
| UC-VID-015 Passo 6 | Processamento sequencial com estado por vídeo e progresso agregado | REQ-VID-BATCH-009, REQ-VID-BATCH-013, REQ-VID-TASK-007, REQ-VID-NFR-006, REQ-VID-NFR-009 |
| UC-VID-015 Passo 7 | Associação de cada resultado e débito/estorno por vídeo | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-COM-003, REQ-VID-STORAGE-002, REQ-VID-QUOTA-003, REQ-VID-QUOTA-004 |
| UC-VID-015 Passo 8 | Estado final agregado e resumo | REQ-VID-BATCH-012, REQ-VID-TASK-002, REQ-VID-TASK-003 |
| UC-VID-015 Passo 9 | Disponibilização dos resultados e preservação dos originais | REQ-VID-COM-002, REQ-VID-COM-003, REQ-VID-STORAGE-003 |
| UC-VID-015 FA1 | Descarregamento dos resultados em ZIP | REQ-VID-BATCH-015, REQ-VID-DOWNLOAD-002 |
| UC-VID-015 FA2 | Exclusão dos vídeos incompatíveis com recálculo do custo | REQ-VID-BATCH-005, REQ-VID-BATCH-007 |
| UC-VID-015 FA3 | Carregamento de uma cadeia predefinida | REQ-VID-CHAIN-014 |
| UC-VID-015 FA4 | Cancelamento do lote mantendo os vídeos concluídos | REQ-VID-BATCH-014, REQ-VID-TASK-004, REQ-VID-TASK-005, REQ-VID-QUOTA-004 |
| UC-VID-015 FA5 | Execução por utilizador Premium (até 50 vídeos) | REQ-VID-QUOTA-005, REQ-VID-BATCH-006, REQ-VID-NFR-014 |
| UC-VID-015 FA6 | Utilizador abandona a sessão com continuidade assíncrona | REQ-VID-TASK-001, REQ-VID-TASK-007, REQ-VID-NFR-006 |
| UC-VID-015 Exceção 1 | Menos de dois vídeos ou acima do limite do perfil | REQ-VID-COM-005, REQ-VID-BATCH-006, REQ-VID-ERROR-001, REQ-VID-NFR-014 |
| UC-VID-015 Exceção 2 | Configuração com junção ou extração de fotogramas | REQ-VID-BATCH-003, REQ-VID-ERROR-001 |
| UC-VID-015 Exceção 3 | Nenhum vídeo compatível com a configuração | REQ-VID-BATCH-004, REQ-VID-ERROR-001 |
| UC-VID-015 Exceção 4 | Quota inferior ao custo total do lote | REQ-VID-QUOTA-001, REQ-VID-QUOTA-007, REQ-VID-ERROR-001 |
| UC-VID-015 Exceção 5 | Falha no processamento de um vídeo | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-ERROR-001, REQ-VID-ERROR-002, REQ-VID-ERROR-003 |
| UC-VID-015 Exceção 6 | Falha geral do worker | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-ERROR-002, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| UC-VID-015 Garantia Sucesso | Um novo vídeo por vídeo concluído, créditos apenas pelos concluídos | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-BATCH-012, REQ-VID-COM-003, REQ-VID-QUOTA-003, REQ-VID-QUOTA-008 |
| UC-VID-015 Garantia Mínima | Falhados sem parciais e com créditos devolvidos, concluídos mantidos | REQ-VID-BATCH-010, REQ-VID-BATCH-011, REQ-VID-COM-002, REQ-VID-QUOTA-004, REQ-VID-ERROR-003, REQ-VID-NFR-007 |
| UC-VID-015 RN1 a RN9 | Regras de número de vídeos, operações elegíveis, custo, concorrência, independência e estorno | REQ-VID-AUTH-002, REQ-VID-BATCH-001 a 015, REQ-VID-QUOTA-001 a 008, REQ-VID-TASK-007, REQ-VID-NFR-003, REQ-VID-NFR-014 |

As referências `UC-VID-001` a `UC-VID-005` seguem a normalização dos artefactos de requisitos: recorte temporal, remoção de áudio, alteração de velocidade, marca de água e extração de fotogramas, respetivamente. Todos os requisitos permanecem candidatos em revisão; as decisões D-VID-001 a D-VID-010 continuam a condicionar a aprovação final.
