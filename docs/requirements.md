# Secção 4 — Esboço de Requisitos Derivados
### Suporte a Vídeo no PictuRAS · Fase 1

---

| **Campo** | **Valor** |
|-----------|-----------|
| **Intenção** | 001-video-processing-support |
| **Versão** | v1.1 |
| **Data** | 2026-10-13 |
| **Origem** | Casos de uso UC-VID-001 a UC-VID-005 (`docs/use-cases.md`); decisões D-VID-001 a D-VID-010 |
| **Estado** | Candidatos aprovados para entrega — todas as decisões D-VID-001 a D-VID-010 incorporadas |

> **Nota de âmbito**: Este documento é o artefacto standalone da Secção 4 do Exercício 1. O ficheiro `docs/merge.md` é mantido inalterado como fonte histórica.

---

## 4.1 Requisitos de Sistema Derivados

Os requisitos abaixo estão organizados em grupos temáticos. Cada requisito tem ID estável, descrição, tipo (F = Funcional, NF = Não Funcional), prioridade, classificação (Novo/Estender), origem nos casos de uso e método de verificação. Todos os valores numéricos reflectem as decisões D-VID-001 a D-VID-010 aprovadas.

### 4.1.1 Requisitos Comuns a Todas as Operações de Vídeo

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-COM-001 | O sistema deve permitir iniciar uma operação de vídeo apenas para um vídeo identificado, acessível e válido no contexto do projeto do utilizador autenticado. | F | Must | Estender | UC-VID-001 a UC-VID-005, pré-condições e passo 1 de cada UC | Testar seleção sem vídeo, vídeo sem permissão, vídeo inexistente e vídeo elegível; confirmar que o segundo caso é rejeitado com erro identificável. |
| REQ-VID-COM-002 | O sistema deve preservar o vídeo original sem o substituir, alterar ou eliminar durante ou após qualquer operação de vídeo, independentemente do estado final da tarefa. | F/NF | Must | Estender | UC-VID-001 a UC-VID-005, garantias mínimas e RN correspondentes | Comparar identificador, conteúdo e disponibilidade do original antes e depois de operações concluídas, canceladas e falhadas. |
| REQ-VID-COM-003 | O sistema deve disponibilizar um resultado de vídeo apenas depois de o processamento terminar com sucesso e deve associá-lo automaticamente ao projeto como novo recurso (D-VID-007). | F | Must | Estender | Garantias de sucesso dos cinco UC; D-VID-007 | Confirmar que resultados concluídos são consultáveis e que resultados parciais ou de tarefas falhadas não aparecem no projeto. |
| REQ-VID-COM-004 | O sistema deve validar todos os parâmetros específicos da operação antes de criar a tarefa de processamento; parâmetros inválidos devem produzir erro identificável sem criar tarefa. | F | Must | Novo | UC-VID-001 passo 4; UC-VID-003 passo 3; UC-VID-005 passos 3-4 | Submeter parâmetros inválidos e verificar que nenhuma tarefa é criada e que o erro indica a correção necessária. |

### 4.1.2 Requisitos de Recorte Temporal (UC-VID-001)

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-TRIM-001 | O sistema deve permitir definir um instante inicial e um instante final e rejeitar intervalos em que o início seja maior ou igual ao fim, ou em que qualquer instante esteja fora da duração do vídeo. | F | Must | Novo | UC-VID-001 passos 2-4; RN2 | Testar intervalos válidos, invertidos (início ≥ fim), e instantes fora dos limites da duração. |
| REQ-VID-TRIM-002 | O sistema deve produzir um novo vídeo MP4 (H.264/AAC) correspondente ao intervalo temporal validado, mantendo o original disponível no projeto. | F | Must | Novo | UC-VID-001 objetivo, passo 6, garantia de sucesso; D-VID-002 | Verificar os limites temporais do resultado, confirmar a disponibilidade do original e verificar a ausência de resultado publicado em caso de falha. |

### 4.1.3 Requisitos de Remoção de Áudio (UC-VID-002)

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-AUDIO-001 | O sistema deve produzir uma nova versão do vídeo MP4 sem streams de áudio, preservando a componente visual (H.264) inalterada; deve rejeitar o pedido quando o vídeo não contiver faixa de áudio, sem consumir quota. | F | Must | Novo | UC-VID-002 objetivo, passos 2-5, RN1-RN3; exceção de vídeo sem áudio | Processar vídeo com áudio, inspecionar ausência de streams de áudio no resultado e testar vídeo sem áudio (verificar que não cria tarefa nem consome quota). |

### 4.1.4 Requisitos de Alteração de Velocidade (UC-VID-003)

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-SPEED-001 | O sistema deve aceitar apenas um fator de velocidade positivo (> 0) e dentro dos limites suportados, apresentando a duração estimada resultante antes da confirmação. | F | Must | Novo | UC-VID-003 passos 2-4; RN1-RN3 | Testar valores nulos, negativos, zero, fora dos limites e valores válidos; verificar o recálculo da duração estimada. |
| REQ-VID-SPEED-002 | O sistema deve produzir um novo vídeo MP4 com a duração e o ritmo de reprodução ajustados pelo fator de velocidade confirmado, sem alterar o vídeo original. | F | Must | Novo | UC-VID-003 passos 5-7; RN3; D-VID-002 | Comparar a duração do resultado com o valor esperado a partir do fator aplicado; verificar a preservação do original. |

### 4.1.5 Requisitos de Marca de Água (UC-VID-004)

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-WATERMARK-001 | O sistema deve permitir configurar uma marca de água textual ou gráfica, validando conteúdo, posição (dentro dos limites visíveis), tamanho e opacidade dentro dos intervalos permitidos; deve rejeitar configurações inválidas antes de criar a tarefa. | F | Must | Novo | UC-VID-004 passos 2-4; FA1-FA2; RN2-RN3 | Testar texto válido, imagem válida, imagem inválida, posição fora da área visível, e valores de tamanho/opacidade fora dos limites. |
| REQ-VID-WATERMARK-002 | O sistema deve aplicar a configuração confirmada de forma consistente a todos os fotogramas do vídeo, com posição, tamanho e opacidade fixos ao longo de toda a duração (D-VID-009), e guardar o resultado como novo recurso MP4 no projeto. | F | Must | Novo | UC-VID-004 passos 6-7; RN1-RN2; D-VID-009 | Inspecionar fotogramas no início, meio e fim do resultado; confirmar a mesma configuração e a ausência de variação de posição; verificar o armazenamento do resultado. |

### 4.1.6 Requisitos de Extração de Fotogramas (UC-VID-005)

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-FRAMES-001 | O sistema deve permitir definir o intervalo semiaberto [início, fim[, o passo N (inteiro ≥ 1 s) e o formato de saída (JPEG ou PNG), apresentando o número estimado de fotogramas (instantes início + k×N com instante < fim) antes da confirmação (D-VID-006). | F | Must | Novo | UC-VID-005 passos 2-4; RN3-RN4; D-VID-006 | Testar parâmetros válidos e inválidos, verificar a fórmula de contagem com vários exemplos (incluindo [0s,60s[ N=5s → 12 fotogramas) e confirmar os formatos permitidos. |
| REQ-VID-FRAMES-002 | O sistema deve adicionar todos os fotogramas validamente extraídos ao projeto como imagens normais de forma atómica (tudo-ou-nada), ou rejeitar o conjunto sem publicar fotogramas parciais (D-VID-007). | F | Must | Estender | UC-VID-005 passos 7-8; RN7; garantia mínima | Simular sucesso, falha a meio e cancelamento; verificar que em nenhum caso de falha/cancelamento ficam fotogramas parciais no projeto. |
| REQ-VID-FRAMES-003 | O sistema deve permitir pré-visualizar uma amostra de fotogramas estimados sem criar a tarefa final, alterar o projeto ou consumir quota (D-VID-001). | F | Should | Novo | UC-VID-005 FA1; RN10 | Solicitar amostra e confirmar ausência de tarefa final criada, ausência de alteração no projeto e ausência de consumo de quota. |

### 4.1.7 Requisitos de Autenticação, Autorização e Quota

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-AUTH-001 | O sistema deve exigir um JWT válido em todas as operações de vídeo; utilizadores Anónimos não têm acesso a nenhuma das cinco operações (D-VID-001). | F/NF | Must | Estender | UC-VID-001 a UC-VID-005, pré-condições; D-VID-001 | Testar pedido sem token, com token inválido e com token válido; confirmar rejeição de acesso anónimo. |
| REQ-VID-AUTH-002 | O sistema deve verificar que o utilizador é proprietário ou tem permissão de edição no projeto antes de criar, guardar ou associar resultados de vídeo. | F | Must | Estender | UC-VID-004 e UC-VID-005 pré-condições | Testar permissões de leitura, edição e proprietário em projeto próprio e partilhado. |
| REQ-VID-QUOTA-001 | O sistema deve verificar, reservar, confirmar ou devolver quota segundo a política aprovada: Registado — 5 operações/dia, cada operação de vídeo consome 1; Premium — sem quota diária; falha ou cancelamento devolvem a operação reservada (D-VID-001, D-VID-008). | F | Must | Estender | UC-VID-001 a UC-VID-005; D-VID-001; D-VID-008 | Testar quota disponível, quota esgotada, perfil Premium, falha e cancelamento; confirmar imputação ao utilizador que executa (não ao proprietário do projeto). |

### 4.1.8 Requisitos de Validação

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-VALID-001 | O sistema deve validar que o ficheiro de vídeo é descodificável, está no formato MP4 com codec H.264 (vídeo) e AAC (áudio), e contém as streams necessárias para a operação, antes de reservar recursos de processamento (D-VID-002). | F | Must | Novo | Exceções de formato/codec dos cinco UC; D-VID-002 | Submeter ficheiros válidos, corrompidos, noutro formato (e.g. WebM, AVI) e com codecs não suportados; verificar mensagens de erro determinísticas e ausência de tarefa criada. |
| REQ-VID-VALID-002 | O sistema deve validar tamanho e duração do vídeo contra os limites do perfil antes de criar a tarefa: Registado — ≤ 5 min e ≤ 200 MB; Premium — ≤ 60 min e ≤ 2 GB; adicionalmente, para extração, ≤ 50 fotogramas (Registado) e ≤ 500 fotogramas (Premium); no máximo 1 tarefa de vídeo ativa por projeto (D-VID-005). | F | Must | Novo | Exceções dos cinco UC; UC-VID-005 RN2; D-VID-005 | Testar cada limite individual (duração, tamanho, fotogramas, tarefa ativa) e confirmar rejeição antes da criação da tarefa. |

### 4.1.9 Requisitos de Armazenamento

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-STORAGE-001 | O sistema deve armazenar e recuperar vídeos como recursos explícitos do projeto, distintos dos recursos de imagem, com identificador único, filename, MIME type, duração, tamanho, referência de armazenamento e timestamp de upload; resultados referenciam o ID do vídeo de origem (D-VID-003). | F | Must | Estender | Pré-condições e garantias dos cinco UC; D-VID-003 | Confirmar que um vídeo carregado recebe os metadados completos, que o identificador é distinto dos recursos de imagem e que resultados têm referência ao original. |
| REQ-VID-STORAGE-002 | O sistema deve gerir o ciclo de vida de resultados de vídeo: concluídos ficam disponíveis no projeto; falhados e cancelados não produzem resultado; todos seguem as políticas de retenção e eliminação dos restantes recursos do projeto (D-VID-007). | F | Must | Estender | Garantias mínimas dos cinco UC; D-VID-007 | Testar criação de resultado após sucesso, ausência de resultado após falha/cancelamento e eliminação respeitando autorização. |

### 4.1.10 Requisitos de Processamento Assíncrono

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-TASK-001 | O sistema deve executar todas as cinco operações de vídeo através de tarefas assíncronas identificáveis, devolvendo um identificador e o estado inicial (`queued`) sem manter o pedido HTTP aberto até à conclusão (D-VID-004). | F | Must | Estender | UC-VID-001 a UC-VID-005, passos de processamento; D-VID-004 | Confirmar identificador de tarefa, estado consultável e conclusão independente do pedido HTTP original. |
| REQ-VID-TASK-002 | O sistema deve comunicar transições de estado `queued → processing → completed | failed | cancelled` via WebSocket; deve reportar progresso numérico monotonicamente crescente (0–100%) quando mensurável: marca de água e extração reportam progresso por fotograma; trim, áudio e velocidade reportam apenas `queued` e estado terminal (D-VID-004). | F | Should | Estender | UC-VID-004 passo 6; UC-VID-005 passos 5-6; D-VID-004 | Observar eventos de estado e progresso via WebSocket; confirmar que não há progressão depois de estado terminal; verificar ausência de progresso numérico para trim/áudio/velocidade. |
| REQ-VID-TASK-003 | O sistema deve permitir cancelar qualquer tarefa de vídeo autorizada nos estados `queued` e `processing`, impedindo a publicação de resultados parciais e devolvendo a operação reservada à quota (D-VID-004). | F | Should | Estender | UC-VID-001 FA2-FA3; UC-VID-002 FA1-FA2; UC-VID-003 FA2-FA3; UC-VID-004 FA3-FA4; UC-VID-005 FA2 | Cancelar antes e durante o processamento; verificar estado `cancelled`, limpeza de artefactos parciais e devolução da quota. |

### 4.1.11 Requisitos de Gestão de Erros

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-ERROR-001 | O sistema deve comunicar erros funcionais com código ou categoria estável, indicando a correção esperada ao utilizador, sem expor stack traces, tokens ou credenciais internas. | F/NF | Must | Estender | Exceções de todos os cinco UC | Testar cada classe de erro (parâmetro, formato, limite, quota, falha de processamento) e inspecionar a resposta produzida. |
| REQ-VID-ERROR-002 | Em caso de falha, expiração ou cancelamento, o sistema deve deixar o projeto e o vídeo original no último estado consistente, limpar ou invalidar artefactos parciais e devolver a operação de quota reservada (D-VID-001). | F/NF | Must | Estender | Garantias mínimas dos cinco UC | Injetar falhas em validação, processamento e armazenamento; verificar integridade do projeto e limpeza de temporários. |

### 4.1.12 Requisitos Não Funcionais

| **ID** | **Descrição** | **Tipo** | **Prioridade** | **Novo/Estender** | **Origem** | **Como verificar** |
|--------|---------------|----------|----------------|-------------------|------------|---------------------|
| REQ-VID-NFR-001 | O acesso a vídeos, resultados e URLs de armazenamento deve respeitar autenticação JWT, autorização de projeto (proprietário/edição), expiração e controlo de acesso do storage; URLs internas não devem ser expostas publicamente. | NF | Must | Estender | D-VID-001; NFR-VID-001 | Testes de autorização com diferentes perfis e permissões; inspecionar URLs e logs para ausência de tokens ou credenciais. |
| REQ-VID-NFR-002 | O sistema deve manter identificadores correlacionáveis entre pedido, tarefa, vídeo de entrada, resultado, utilizador, projeto e estado final, permitindo auditoria sem expor dados sensíveis. | NF | Must | Estender | NFR-VID-004; D-VID-004 | Consultar uma tarefa por identificador e confirmar rastreabilidade completa; verificar ausência de dados sensíveis nos registos. |
| REQ-VID-NFR-003 | O sistema deve aceitar como entrada apenas ficheiros MP4 com codec de vídeo H.264 e codec de áudio AAC, e produzir resultados de vídeo no mesmo formato; ficheiros fora desta matriz devem ser rejeitados com mensagem determinística (D-VID-002). Fotogramas extraídos são produzidos em JPEG ou PNG (escolha do utilizador, padrão JPEG). | NF | Must | Novo | D-VID-002; NFR-VID-005 | Testar ficheiros dentro da matriz aprovada e ficheiros noutros formatos/codecs; verificar descodificação do resultado e mensagens de rejeição. |
| REQ-VID-NFR-004 | Para o MVP, não são definidos objetivos quantitativos de latência, throughput ou capacidade; as operações devem completar dentro de um prazo razoável para ser testáveis, sem SLA de produção (D-VID-010). | NF | Could | Novo | D-VID-010 | Verificar que as operações completam em tempo razoável nos ambientes de teste; ausência de timeouts prematuros nos testes de aceitação. |

---

## 4.2 Análise de Impacto no Sistema Existente

| **Elemento existente afetado** | **Impacto** | **Descrição do impacto** | **Requisitos relacionados** |
|-------------------------------|-------------|--------------------------|------------------------------|
| `apiGateway/routes/projects.js` e rotas de projetos | Estender | Expor rotas para as cinco operações de vídeo; validar autorização JWT, parâmetros, limites de perfil e estado de tarefas; preservar rotas de imagem existentes. | REQ-VID-COM-001/004, REQ-VID-AUTH-001/002, REQ-VID-VALID-001/002, REQ-VID-TASK-001, REQ-VID-ERROR-001 |
| `projects/routes/projects.js` e serviço de projetos | Estender | Integrar seleção de vídeos, criação de tarefas de vídeo, permissões de edição e associação de fotogramas ao projeto; o código atual é orientado a imagens. | REQ-VID-COM-001/003, REQ-VID-COM-002, REQ-VID-FRAMES-002, REQ-VID-STORAGE-002 |
| Controllers e modelos de projetos/resultados (MongoDB) | Alterar | Representar vídeos como recursos explícitos com metadados próprios (D-VID-003), gerir tarefas e resultados de vídeo sem forçar vídeos nos modelos atuais de imagens; manter referências ao original e suportar limpeza transacional ou compensatória. | REQ-VID-STORAGE-001/002, REQ-VID-COM-002/003, REQ-VID-NFR-002 |
| `projects/utils/project_msg.js` e mensageria | Estender | Adicionar mensagens e filas específicas para tarefas de vídeo (trim, áudio, velocidade, marca de água, extração), mantendo o padrão RabbitMQ/WebSocket existente e definindo estados e progresso diferenciados por operação. | REQ-VID-TASK-001/002/003, REQ-VID-ERROR-001 |
| RabbitMQ e workers de processamento | Estender | Criar workers Python para processamento de vídeo: recorte temporal, remoção de áudio, alteração de velocidade, composição de marca de água fotograma a fotograma e extração de fotogramas; validar streams e produzir resultados temporários antes de os confirmar. | REQ-VID-TRIM-001/002, REQ-VID-AUDIO-001, REQ-VID-SPEED-001/002, REQ-VID-WATERMARK-001/002, REQ-VID-FRAMES-001/002 |
| `imageStorageService` e SeaweedFS/S3 | Estender | Suportar upload, leitura, URLs autorizadas, temporários e resultados de vídeo, sem colisão com objetos de imagem; gerir limpeza de temporários e resultados parciais. | REQ-VID-STORAGE-001/002, REQ-VID-COM-002/003, REQ-VID-ERROR-002, REQ-VID-NFR-001 |
| Autenticação JWT e `shareAuth` | Estender | Reutilizar JWT e permissões read/edit; acrescentar verificações específicas para operações e resultados de vídeo em projetos privados ou partilhados; imputar quota ao utilizador que executa (D-VID-008). | REQ-VID-AUTH-001/002, REQ-VID-QUOTA-001, REQ-VID-NFR-001 |
| Subscrições e quotas (`users`, `subscriptions`) | Estender | Definir e aplicar quotas de vídeo por perfil (D-VID-001): Registado — 5 ops/dia; Premium — sem quota; aplicar limites de tamanho e duração por perfil (D-VID-005); não reutilizar automaticamente a quota atual de ferramentas de imagem. | REQ-VID-QUOTA-001, REQ-VID-VALID-002 |
| `wsGateway` e cliente WebSocket | Estender | Comunicar estados de tarefas de vídeo (`queued`, `processing`, `completed`, `failed`, `cancelled`) e progresso numérico diferenciado por operação (D-VID-004) sem emitir eventos após estado terminal. | REQ-VID-TASK-002/003, REQ-VID-ERROR-002, REQ-VID-NFR-002 |
| Frontend de projetos e ferramentas (`frontend/components`, `frontend/lib/tool-types.ts`) | Estender | Adicionar interfaces para seleção de vídeo, formulários de parâmetros por operação, previsão (contagem de fotogramas, duração estimada), barra de progresso, cancelamento e visualização de resultados de vídeo. | REQ-VID-TRIM-001, REQ-VID-SPEED-001, REQ-VID-WATERMARK-001, REQ-VID-FRAMES-001/003, REQ-VID-TASK-002 |
| Ferramenta de marca de água para imagens | Estender | Reaproveitar a lógica de configuração como referência; o processamento de vídeo aplica a marca fotograma a fotograma e recompõe um novo ficheiro MP4. | REQ-VID-WATERMARK-001/002 |
| Ferramentas Python em `Tools/` | Estender | Acrescentar módulos de descodificação de vídeo (MP4/H.264/AAC), transformação temporal (trim, velocidade), remoção de áudio, composição de marca de água e extração de fotogramas (JPEG/PNG), sem assumir suporte a vídeo nas ferramentas de imagem atuais. | REQ-VID-TRIM-002, REQ-VID-AUDIO-001, REQ-VID-SPEED-002, REQ-VID-WATERMARK-002, REQ-VID-FRAMES-001/002 |

> O impacto é uma extensão *brownfield* relevante: JWT, RabbitMQ, WebSocket, projetos, storage e padrões de resultados existentes podem ser reutilizados, mas o suporte efetivo a vídeo, o modelo de recurso explícito (D-VID-003), os workers de vídeo e o contrato de tarefas ainda não estão confirmados no código atual.

---

## 4.3 Matriz de Rastreabilidade

### Elementos dos Casos de Uso → Requisitos de Sistema

| **Elemento do Caso de Uso** | **Descrição abreviada** | **Requisito(s) de Sistema** |
|-----------------------------|--------------------------|------------------------------|
| UC-VID-001 pré-condições e passo 1 | Autenticar e selecionar vídeo MP4 elegível | REQ-VID-AUTH-001, REQ-VID-COM-001, REQ-VID-STORAGE-001, REQ-VID-VALID-001 |
| UC-VID-001 passos 2-4; RN2 | Definir e validar intervalo [início, fim[ | REQ-VID-COM-004, REQ-VID-TRIM-001, REQ-VID-VALID-002 |
| UC-VID-001 passos 4-6 (quota + tarefa + resultado) | Reservar quota, criar tarefa assíncrona, produzir resultado | REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-TRIM-002, REQ-VID-COM-002/003, REQ-VID-STORAGE-002 |
| UC-VID-001 FA2-FA3 (cancelamento) e exceções | Cancelar, tratar formato inválido, limites e falha | REQ-VID-TASK-003, REQ-VID-VALID-001/002, REQ-VID-ERROR-001/002 |
| UC-VID-002 pré-condições e passos 1-2 | Autenticar, selecionar vídeo e detetar stream de áudio | REQ-VID-AUTH-001, REQ-VID-COM-001, REQ-VID-AUDIO-001, REQ-VID-VALID-001 |
| UC-VID-002 passos 2-5; RN1-RN3 | Confirmar remoção, criar tarefa, produzir vídeo silencioso | REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-AUDIO-001, REQ-VID-COM-002/003 |
| UC-VID-002 passo 6 e exceções | Disponibilizar resultado ou tratar ausência de áudio, quota e falha | REQ-VID-COM-003, REQ-VID-QUOTA-001, REQ-VID-ERROR-001/002 |
| UC-VID-003 pré-condições e passos 1-2 | Autenticar, selecionar vídeo e apresentar controlo de velocidade | REQ-VID-AUTH-001, REQ-VID-COM-001, REQ-VID-SPEED-001, REQ-VID-VALID-001 |
| UC-VID-003 passos 2-3; RN1-RN3 | Validar fator e calcular duração estimada | REQ-VID-COM-004, REQ-VID-SPEED-001, REQ-VID-VALID-002 |
| UC-VID-003 passos 4-7 | Criar tarefa e produzir resultado com velocidade confirmada | REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-SPEED-002, REQ-VID-COM-002/003 |
| UC-VID-003 FA2-FA3 e exceções | Cancelar operação e tratar valor inválido, codec, limites e falha | REQ-VID-TASK-003, REQ-VID-VALID-001/002, REQ-VID-ERROR-001/002 |
| UC-VID-004 pré-condições e passos 1-2 | Autenticar, selecionar vídeo e configurar tipo de marca | REQ-VID-AUTH-001/002, REQ-VID-COM-001, REQ-VID-WATERMARK-001 |
| UC-VID-004 passos 3-4; RN2-RN3 | Validar conteúdo, posição, tamanho e opacidade da marca | REQ-VID-COM-004, REQ-VID-WATERMARK-001, REQ-VID-VALID-001 |
| UC-VID-004 passos 5-6; RN1/D-VID-009 | Criar tarefa, aplicar marca consistente e comunicar progresso por fotograma | REQ-VID-QUOTA-001, REQ-VID-TASK-001/002, REQ-VID-WATERMARK-002 |
| UC-VID-004 passo 7-8; RN9 | Recompor, guardar e disponibilizar novo vídeo MP4 | REQ-VID-COM-002/003, REQ-VID-STORAGE-001/002 |
| UC-VID-004 FA1-FA5 e exceções | Aceitar imagem, alterar configuração, cancelar e tratar falhas | REQ-VID-TASK-003, REQ-VID-VALID-001/002, REQ-VID-ERROR-001/002 |
| UC-VID-005 pré-condições e passos 1-2 | Autenticar, abrir projeto e apresentar limites do perfil | REQ-VID-AUTH-001/002, REQ-VID-COM-001, REQ-VID-VALID-002 |
| UC-VID-005 passo 3; RN3-RN4; D-VID-006 | Definir intervalo semiaberto, passo, formato e calcular estimativa | REQ-VID-COM-004, REQ-VID-FRAMES-001, REQ-VID-VALID-001/002 |
| UC-VID-005 passo 4; RN2/RN5; D-VID-001/005 | Verificar limites por perfil, reservar quota e criar tarefa assíncrona | REQ-VID-QUOTA-001, REQ-VID-TASK-001, REQ-VID-VALID-002 |
| UC-VID-005 passos 5-6; RN9 | Executar extração assíncrona com progresso e cancelamento | REQ-VID-TASK-001/002/003, REQ-VID-FRAMES-002 |
| UC-VID-005 passos 7-8; RN7-RN11 | Adicionar todos os fotogramas atomicamente como imagens normais | REQ-VID-FRAMES-002, REQ-VID-COM-002/003, REQ-VID-STORAGE-002 |
| UC-VID-005 FA1; RN10 | Pré-visualizar amostra sem resultado, alteração de projeto ou quota | REQ-VID-FRAMES-003 |
| UC-VID-005 FA2-FA5 e exceções | Cancelar, continuar em segundo plano, ajustar passo e recuperar de erros | REQ-VID-TASK-002/003, REQ-VID-QUOTA-001, REQ-VID-ERROR-001/002 |
| Todos os UC — garantias mínimas e exceções | Preservar consistência, comunicar erros e não publicar parciais | REQ-VID-COM-002, REQ-VID-ERROR-001/002, REQ-VID-NFR-001/002 |
| Todos os UC — validação de formato/codec | Aceitar apenas MP4/H.264/AAC como entrada | REQ-VID-VALID-001, REQ-VID-NFR-003 |

---

## 4.4 Registo de Decisões

Todas as decisões abaixo estão marcadas como **APROVADAS** e foram incorporadas nos requisitos e casos de uso da versão v1.1.

| **ID** | **Título** | **Decisão tomada** | **Requisitos afetados** |
|--------|------------|---------------------|--------------------------|
| D-VID-001 | Perfis e quota | Todas as cinco operações estão disponíveis apenas para utilizadores **Registados** e **Premium**. Utilizadores Anónimos não têm acesso. Cada operação de vídeo (trim, áudio, velocidade, marca de água, extração de fotogramas) consome **1 operação** da quota diária do utilizador Registado (máximo 5/dia). O perfil Premium não tem quota diária. Cancelamento ou falha devolvem a operação reservada. A pré-visualização (UC-VID-005 FA1) não consome quota. A quota é imputada ao utilizador que executa a operação (D-VID-008). | REQ-VID-AUTH-001, REQ-VID-QUOTA-001, REQ-VID-VALID-002, REQ-VID-NFR-001 |
| D-VID-002 | Formatos e codecs | Entrada: **MP4 com codec de vídeo H.264 e codec de áudio AAC**, exclusivamente para o MVP. Outros formatos são rejeitados com mensagem informativa. Saída: o mesmo formato MP4/H.264/AAC para resultados de vídeo; **JPEG ou PNG** (escolha do utilizador, padrão JPEG) para fotogramas extraídos. | REQ-VID-VALID-001, REQ-VID-NFR-003, REQ-VID-TRIM-002, REQ-VID-AUDIO-001, REQ-VID-SPEED-002, REQ-VID-WATERMARK-002, REQ-VID-FRAMES-001 |
| D-VID-003 | Recurso de vídeo no projeto | Vídeos são recursos explícitos do projeto, separados das imagens. Um recurso de vídeo tem: ID único, filename, MIME type, duração, tamanho, referência de armazenamento e timestamp de upload. Resultados de operações de vídeo são novos recursos que referenciam o ID do vídeo de origem. Fotogramas extraídos são armazenados como recursos de imagem normais. | REQ-VID-STORAGE-001, REQ-VID-COM-001/003, REQ-VID-NFR-002 |
| D-VID-004 | Contrato de tarefas assíncronas | Todas as cinco operações são assíncronas com estados: `queued → processing → completed \| failed \| cancelled`. Cancelamento disponível nos estados `queued` e `processing`. Progresso numérico (0–100%): reportado por fotograma para marca de água e extração de fotogramas; trim/áudio/velocidade reportam apenas `queued` e estado terminal. Comunicação via WebSocket existente. | REQ-VID-TASK-001/002/003, REQ-VID-ERROR-002 |
| D-VID-005 | Limites numéricos (MVP, configuráveis) | Registado: vídeo ≤ 5 min e ≤ 200 MB; máximo 50 fotogramas por extração. Premium: vídeo ≤ 60 min e ≤ 2 GB; máximo 500 fotogramas por extração. Máximo 1 tarefa de vídeo ativa por projeto em simultâneo. | REQ-VID-VALID-002, REQ-VID-FRAMES-001, REQ-VID-NFR-004 |
| D-VID-006 | Semântica do intervalo de fotogramas | O intervalo é semiaberto **[início, fim[**. Os instantes gerados são início + k×N para k = 0, 1, 2, … enquanto o instante for < fim. Passo N é inteiro ≥ 1 s. Número de fotogramas = número de instantes gerados. Exemplo: [0s, 60s[ com N=5s → instantes 0, 5, 10, …, 55 → **12 fotogramas**. | REQ-VID-FRAMES-001/002 |
| D-VID-007 | Retenção de resultados | Os resultados são automaticamente associados ao projeto após o processamento bem-sucedido. Seguem as mesmas políticas de retenção e eliminação dos restantes recursos do projeto. Tarefas falhadas ou canceladas não produzem resultado persistente. | REQ-VID-COM-003, REQ-VID-STORAGE-002 |
| D-VID-008 | Identidade de quota em projetos partilhados | A quota é imputada ao **utilizador autenticado que executa a operação**, não ao proprietário do projeto. | REQ-VID-QUOTA-001, REQ-VID-AUTH-002 |
| D-VID-009 | Posição da marca de água | A posição da marca de água é **fixa ao longo de toda a duração do vídeo** no MVP. Posição, tamanho e opacidade são definidos uma única vez na configuração. Posição variável por fotograma não está disponível no MVP. | REQ-VID-WATERMARK-002 |
| D-VID-010 | Objetivos quantitativos de desempenho | **Não são definidos objetivos quantitativos de latência, throughput, capacidade ou disponibilidade para o MVP.** O MVP é focado em validação funcional. As operações devem completar em tempo razoável para ser testáveis; não há SLA de produção aprovado. | REQ-VID-NFR-004 |

---

## 4.5 Questões em Aberto Remanescentes

As questões abaixo são as únicas genuinamente não resolvidas após a aplicação das decisões D-VID-001 a D-VID-010. Todas as questões presentes nos casos de uso originais que foram resolvidas pelas decisões acima foram fechadas.

| **ID** | **Questão** | **Requisitos afetados** | **Recomendação** |
|--------|-------------|--------------------------|------------------|
| Q-REM-001 | Qual a precisão temporal exigida para o recorte (ao frame, ao segundo, ao milissegundo)? | REQ-VID-TRIM-001/002 | Definir com base na capacidade do worker Python e nas expectativas do utilizador; proposta: precisão ao frame (dependente do frame rate do vídeo). |
| Q-REM-002 | Qual o intervalo válido de fatores de velocidade suportados no MVP (e.g., 0,25× a 4×)? A entrada deve ser livre ou apenas valores predefinidos? | REQ-VID-SPEED-001 | Definir intervalo mínimo testável (e.g., 0,25× a 4×) com input livre validado; confirmar com a equipa de produto. |
| Q-REM-003 | Quais os formatos de imagem aceites para a marca de água gráfica (PNG, JPEG, SVG, outro)? A imagem pode ser carregada durante a configuração ou apenas selecionada da biblioteca do projeto? | REQ-VID-WATERMARK-001 | Proposta MVP: aceitar PNG e JPEG; permitir carregamento durante a configuração para maior usabilidade. |
| Q-REM-004 | Os fotogramas extraídos contam para algum limite de imagens por projeto ou de armazenamento por perfil? | REQ-VID-FRAMES-002, REQ-VID-STORAGE-002 | Confirmar se os limites existentes de imagens por projeto se aplicam; em caso afirmativo, verificar antes de iniciar a tarefa. |
| Q-REM-005 | A notificação de conclusão de operações de vídeo deve ser feita apenas via WebSocket (in-app) ou também por mecanismos adicionais (e.g., email, push notification)? | REQ-VID-TASK-002 | Para o MVP, notificação apenas via WebSocket in-app é suficiente para validação; canais adicionais podem ser considerados em versões futuras. |
| Q-REM-006 | A garantia transacional entre o armazenamento de objetos (SeaweedFS/S3) e a base de dados (MongoDB) para a operação tudo-ou-nada da extração de fotogramas requer um mecanismo específico de compensação ou saga? | REQ-VID-FRAMES-002, REQ-VID-ERROR-002 | Lacuna arquitetural a resolver antes do início da implementação; recomenda-se decisão explícita da equipa de arquitetura. |

