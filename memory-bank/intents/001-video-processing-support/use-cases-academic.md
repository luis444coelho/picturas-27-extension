# Casos de uso — Especificação académica

Os casos de uso atuais seguem o relatório de entrega e o catálogo em docs/use-cases/.

# UC-VID-000 — Carregar e visualizar um vídeo no projeto

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-000 |
| *Nome* | Carregar e visualizar um vídeo no projeto |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador autenticado carregar um ficheiro de vídeo digital para o seu projeto, validando o contentor, codecs e limites do perfil, persistindo os respetivos metadados técnicos e disponibilizando-o na galeria e no reprodutor integrado para visualização e posterior manipulação. |
| *Âmbito* | Módulo de gestão de projetos, armazenamento multimédia e visualização do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e permissão de edição no projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende armazenar os seus vídeos na plataforma e inspecioná-los visualmente com controlos de reprodução sem que o upload debite a sua quota diária de operações.<br> - *Sistema PictuRAS*: deve validar a conformidade de contentor e codecs (MP4, MOV ou AVI, segundo a matriz da DQ-002), extrair metadados técnicos com precisão e armazenar os ficheiros de grande porte de forma segura no SeaweedFS/S3.<br> - *Equipa de Infraestrutura / DevOps*: pretende assegurar que os uploads respeitam os tetos de tamanho e duração do perfil, impedindo o esgotamento do disco por ficheiros corrompidos ou não suportados. |
| *Pré-condições* | - O utilizador tem sessão iniciada (token JWT válido).<br> - O utilizador acede a um projeto sobre o qual possui permissão de proprietário ou de edição.<br> - O dispositivo do utilizador dispõe de acesso a um ficheiro de vídeo local. |
| *Trigger* | O utilizador acede ao projeto e seleciona a opção "Carregar Vídeo" ou arrasta um ficheiro de vídeo para a área de carregamento do projeto. |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador abre o projeto e seleciona a opção de carregar vídeo. | O sistema apresenta a interface de upload indicando os limites de duração e dimensão do perfil ativo e os formatos admitidos (MP4, MOV e AVI). |
| 2 | O utilizador seleciona o ficheiro de vídeo do sistema de ficheiros local (ou arrasta-o para a zona de largada). | O sistema valida no cliente a extensão (.mp4,.mov ou.avi) e o tipo MIME (video/mp4, video/quicktime ou video/x-msvideo) e apresenta o nome e tamanho do ficheiro selecionado. |
| 3 | O utilizador confirma o carregamento do ficheiro. | O sistema inicia a transferência do ficheiro em streaming para o servidor, apresentando uma barra de progresso percentual (0% a 100%). |
| 4 | — | O sistema recebe o ficheiro, valida que o tamanho não excede o teto do perfil (≤ 200 MB Registado, ≤ 2 GB Premium) e armazena o objeto no SeaweedFS/S3 com identificador UUID único. |
| 5 | — | O sistema inspeciona os fluxos do contentor, valida que os codecs são admitidos para o contentor (H.264/AAC em MP4 e MOV; H.264 ou MPEG-4 Part 2 / AAC ou MP3 em AVI), verifica que a duração respeita o perfil (≤ 5 min Registado, ≤ 60 min Premium) e extrai metadados técnicos (duração, resolução espacial, taxa de fotogramas, bitrate e streams). |
| 6 | — | O sistema gera automaticamente uma miniatura (thumbnail) do instante 00:00:01 do vídeo, ou do fotograma inicial se a duração for inferior a um segundo em formato JPEG e regista o novo recurso de vídeo na base de dados (MongoDB) associado ao projeto, sem debitar quota diária. |
| 7 | — | O sistema conclui o carregamento e apresenta o novo vídeo na galeria de recursos do projeto com a miniatura gerada, nome do ficheiro e duração formatada. |
| 8 | O utilizador seleciona o vídeo na galeria do projeto. | O sistema abre o reprodutor multimédia integrado (*player*), permitindo a reprodução com controlos (play, pausa, seek, volume, ecrã inteiro) e disponibiliza as operações de manipulação aplicáveis, bem como descarregar o vídeo e consultar as suas informações. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Carregamento por arrastamento (*drag-and-drop*)* | No passo 2, o utilizador arrasta diretamente o ficheiro para a área do projeto → O sistema deteta o evento, valida o tipo MIME e avança diretamente para a confirmação no passo 3. |
| *FA2 – Cancelamento antes da conclusão da transferência* | Durante o passo 3, o utilizador clica em "Cancelar Upload" → O sistema interrompe a transferência HTTP, purga os dados parciais temporários e mantém o projeto inalterado. |
| *FA3 – Utilizador com perfil Premium* | Nos passos 4 e 5, o sistema aplica os limites alargados de subscrição Premium: ficheiros até 2 GB e duração até 60 minutos. |
| *FA4 – Carregar vídeo sem stream de áudio* | No passo 5, o sistema deteta que o MP4 contém apenas stream H.264 (vídeo silencioso de origem) → O sistema aceita o ficheiro, regista a ausência de áudio nos metadados e conclui o upload normalmente. |
| *FA5 – Carregar vídeo em MOV ou AVI* | No passo 5, o sistema deteta um contentor MOV ou AVI com codecs admitidos → O sistema aceita o ficheiro, preserva-o no formato original e, no passo 6, gera adicionalmente uma cópia de pré-visualização em MP4 (H.264/AAC), usada exclusivamente pelo reprodutor integrado. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *O formato do ficheiro ou tipo MIME não é suportado (não é MP4, MOV nem AVI).* | O sistema bloqueia a submissão, informa que apenas ficheiros MP4, MOV e AVI são suportados e não inicia a transferência. |
| *O tamanho do ficheiro excede o limite do perfil (200 MB para Registado, 2 GB para Premium).* | O sistema rejeita o upload, informa o utilizador do limite excedido e, se aplicável, sugere o upgrade para Premium. Nenhum ficheiro é gravado. |
| *Os codecs internos do vídeo não são admitidos para o contentor (matriz da DQ-002).* | O sistema descarta o ficheiro do storage temporário, informa o utilizador de que os codecs são incompatíveis e solicita a conversão prévia para um codec admitido (e.g. H.264/AAC). |
| *A duração do vídeo excede o limite do perfil (5 min para Registado, 60 min para Premium).* | O sistema remove o ficheiro, emite mensagem a indicar o excesso de duração do perfil e não regista o vídeo no projeto. |
| *O ficheiro de vídeo encontra-se corrompido ou com cabeçalhos ilegíveis.* | O sistema falha a inspeção de metadados, elimina o ficheiro temporário e notifica o utilizador de que o ficheiro está corrompido. |
| *Ocorre falha de rede ou interrupção durante a transferência.* | O sistema aborta o upload, limpa os fragmentos no storage e notifica o utilizador da perda de ligação, permitindo nova tentativa. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | O ficheiro de vídeo está gravado no storage de objetos, os seus metadados técnicos e miniatura estão persistidos na base de dados associados ao projeto, o recurso surge disponível na galeria do projeto e pode ser visualizado no reprodutor com acesso imediato às ferramentas de manipulação. A quota diária de operações não é debitada. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum ficheiro corrompido ou parcial permanece no storage, nenhum registo órfão é gravado no MongoDB e a integridade prévia do projeto é rigorosamente mantida. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | A funcionalidade de carregamento de vídeo está disponível para utilizadores Registados e Premium autenticados. Utilizadores Anónimos não têm acesso. |
| *RN2* | O carregamento de vídeo não consome créditos da quota diária de operações (a quota de 5 ops/dia para Registado aplica-se exclusivamente a tarefas de manipulação/processamento). |
| *RN3* | O ficheiro de entrada deve estar num dos contentores MP4, MOV ou AVI, com os codecs admitidos para o contentor: H.264 (vídeo) e AAC (áudio) em MP4 e MOV; H.264 ou MPEG-4 Part 2 (vídeo) e AAC ou MP3 (áudio) em AVI; o áudio é opcional. Outros contentores e codecs são rejeitados (DQ-002). |
| *RN4* | Limites de upload por perfil: Registado — tamanho ≤ 200 MB e duração ≤ 5 minutos; Premium — tamanho ≤ 2 GB e duração ≤ 60 minutos. |
| *RN5* | O sistema gera automaticamente uma imagem de miniatura em JPEG a partir do instante 00:00:01, ou do fotograma inicial se a duração for inferior a um segundo, para representação no projeto. |
| *RN6* | O reprodutor de vídeo integrado deve fornecer controlos de reprodução, pausa, navegação temporal (*seek*), ajuste de volume e modo de ecrã inteiro. |
| *RN7* | O ficheiro original carregado é estritamente imutável: as operações subsequentes de transformação geram sempre novos recursos sem alterar o original. |
| *RN8* | Os vídeos originais em MOV ou AVI recebem uma cópia de pré-visualização em MP4 (H.264/AAC), usada exclusivamente pelo reprodutor integrado; as operações e o descarregamento usam sempre o ficheiro original (DQ-011). |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O serviço de armazenamento de objetos (SeaweedFS/S3) dispõe de capacidade suficiente para alojar ficheiros de vídeo de até 2 GB. |
| *A2* | A extração de metadados e a geração da miniatura são realizadas através de ferramentas especializadas (FFprobe/FFmpeg) no backend Node.js / Python de forma rápida durante a ingestão. |
| *A3* | O navegador do utilizador possui capacidade nativa de descodificação e reprodução de vídeo MP4 (H.264/AAC) através do elemento video de HTML5. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Deve ser suportado o carregamento de vídeos através de URL externo (e.g. YouTube ou link direto HTTP) além do upload de ficheiro local? | Rejeitada para o MVP. O upload faz-se estritamente através de ficheiro local para controlo rigoroso de segurança e integridade de rede. |
| *Q2* | Deve ser permitida a substituição direta de um ficheiro de vídeo existente mantendo o mesmo identificador de recurso? | Não permitida. O original é imutável para assegurar a rastreabilidade do projeto. |


---

# UC-VID-001 — Recortar temporalmente um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-001 |
| *Nome* | Recortar temporalmente um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador selecionar um intervalo temporal válido de um vídeo do seu projeto e obter um novo vídeo que preserve apenas esse intervalo, sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende reduzir o vídeo às partes relevantes sem perder o ficheiro original e sem esgotar desnecessariamente a quota diária.<br> - *Sistema PictuRAS*: deve validar o intervalo, executar o recorte de forma assíncrona e produzir um resultado consistente.<br> - *Administrador / Equipa de produto*: pretende garantir que o processo respeita as políticas de acesso, quota e armazenamento. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium), disponível para processamento.<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação de recorte temporal. |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Recortar Vídeo". | O sistema apresenta o vídeo selecionado e os controlos de recorte temporal. |
| 2 | O utilizador define o instante inicial e o instante final do intervalo a conservar. | O sistema valida preliminarmente os valores na interface e apresenta a duração estimada do segmento resultante. |
| 3 | O utilizador confirma a operação de recorte. | O sistema valida os limites temporais em relação à duração do vídeo, verifica que o instante inicial é estritamente menor que o final, verifica a quota disponível do utilizador (se Registado) e cria a tarefa de processamento assíncrono. |
| 4 | — | O sistema reserva 1 operação da quota diária do utilizador (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador de que a operação foi aceite. |
| 5 | — | O worker inicia o processamento (estado processing), extrai o segmento especificado e gera um novo ficheiro MP4 (H.264/AAC) com a mesma resolução e taxa de fotogramas do original, permitindo cópia apenas se os codecs e os limites temporais forem seguros, incluindo o alinhamento do início com um keyframe; caso contrário, recodifica o segmento (DQ-012). |
| 6 | — | O sistema armazena o novo vídeo, associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador através de WebSocket. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo recortado na lista de recursos do projeto; o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Alteração do intervalo antes de confirmar* | No passo 2, o utilizador ajusta repetidamente os instantes inicial e final (inclusive com recurso a pré-visualização em repetição / *loop preview*) → O sistema atualiza dinamicamente a duração prevista a cada alteração. O fluxo continua no passo 3. |
| *FA2 – Cancelamento antes do início do processamento* | No passo 4, enquanto a tarefa está no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a operação reservada à quota do utilizador (se Registado), transita a tarefa para cancelled e notifica o utilizador. Nenhum novo vídeo é gerado. |
| *FA3 – Cancelamento durante o processamento* | No passo 5, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema envia sinal de cancelamento ao worker, elimina ficheiros temporários gerados, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. Nenhum novo recurso é criado no projeto. |
| *FA4 – Utilizador com perfil Premium* | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária de operações (quota ilimitada) e aplica os limites de duração alargados (até 60 min). |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Instante inicial maior ou igual ao instante final.* | No passo 3, o sistema rejeita a operação com erro de validação temporal (INVALID_INTERVAL), informando que o início deve ser anterior ao fim. A tarefa não é criada e a quota não é afetada. |
| *Instantes definidos fora da duração total do vídeo.* | No passo 3, o sistema rejeita a operação com erro de limites (OUT_OF_BOUNDS), indicando a duração máxima permitida. A tarefa não é criada e a quota não é afetada. |
| *Formato ou codec de vídeo não suportado.* | No passo 3, o sistema rejeita a operação se o vídeo não estiver num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 3, o sistema rejeita a operação se o vídeo exceder 5 min / 200 MB (Registado) ou 60 min / 2 GB (Premium), com código LIMIT_EXCEEDED. A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED) e sugere o upgrade para Premium. A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 5, se o worker falhar (erro de descodificação, falta de espaço em disco, etc.) → O sistema transita a tarefa para failed, liberta recursos temporários, estorna a quota diária reservada (se Registado) e notifica o utilizador com mensagem de erro explicativa. Nenhum ficheiro corrompido é associado ao projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo ficheiro de vídeo MP4 contendo exclusivamente o intervalo selecionado é persistido no armazenamento de objetos e registado na base de dados associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária do utilizador é consumida em 1 operação (apenas perfil Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, ficheiros temporários são eliminados, a quota diária reservada é devolvida integralmente ao utilizador registado e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. Utilizadores Anónimos não têm acesso. |
| *RN2* | O intervalo temporal de recorte é definido por [t_início, t_fim] com 0 ≤ t_início < t_fim ≤ duração do vídeo. |
| *RN3* | O vídeo de entrada pode estar em qualquer formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002); o vídeo de saída é gerado em MP4, codificado com H.264 (vídeo) e AAC (áudio, quando exista) (DQ-012). |
| *RN4* | Limites por perfil: Registado — vídeo original com duração ≤ 5 minutos e tamanho ≤ 200 MB; Premium — duração ≤ 60 minutos e tamanho ≤ 2 GB. |
| *RN5* | Cada operação de recorte concluída consome exatamente 1 crédito da quota diária de operações do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota diária ilimitada. |
| *RN6* | Em caso de cancelamento da tarefa ou de falha técnica, o crédito de quota reservado é integralmente devolvido ao saldo do utilizador Registado. |
| *RN7* | A operação é estritamente assíncrona; o utilizador pode abandonar a página após submissão sem interromper o processamento. |
| *RN8* | O vídeo original nunca é substituído nem eliminado pela operação de recorte; o resultado é sempre um novo recurso com o seu próprio identificador único no projeto. |
| *RN9* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O utilizador tem acesso prévio a um projeto existente que já contém pelo menos um vídeo elegível carregado. |
| *A2* | O worker dispõe de FFmpeg com capacidade de selecionar o intervalo na grelha temporal dos fotogramas. Se a cópia não for segura, o segmento é recodificado integralmente; não se pressupõe recodificação limitada às fronteiras de GOP. |
| *A3* | A quota diária é redefinida automaticamente às 00:00 UTC para todos os utilizadores Registados. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Como é medido o progresso durante o recorte de vídeo? | O worker emite os estados e o progresso percentual global, segundo REQ-VID-NFR-008. Uma operação com duração inferior a um segundo pode concluir sem percentagem intermédia observável. O cancelamento é suportado em queued e processing. |
| *Q2* | O recorte deve ser exato ao fotograma (*frame-accurate*) ou ao fotograma-chave (*keyframe/I-frame*)? | No MVP, deve priorizar precisão ao fotograma (*frame-accurate*), preservando a coerência visual entre os pontos selecionados na interface e o ficheiro resultante. |


---

# UC-VID-002 — Remover o áudio de um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-002 |
| *Nome* | Remover o áudio de um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador remover todas as faixas de áudio de um vídeo do projeto, obtendo um novo vídeo silencioso (*video-only*), preservando o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende suprimir o som de um vídeo de forma simples e rápida sem perda de qualidade visual.<br> - *Sistema PictuRAS*: deve extrair/descartar as streams de áudio de forma eficiente copiando o vídeo quando compatível com a saída e recodificando quando necessário.<br> - *Administrador*: pretende garantir a integridade dos ficheiros e o respeito pelas quotas. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) com pelo menos uma stream de áudio, com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação de remoção de áudio. |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Remover Áudio". | O sistema verifica que o vídeo contém áudio e apresenta um resumo da operação (remoção de todas as faixas de áudio, preservação do vídeo original). |
| 2 | O utilizador confirma a operação. | O sistema valida a quota disponível do utilizador (se Registado) e cria a tarefa de processamento assíncrono. |
| 3 | — | O sistema reserva 1 operação da quota diária do utilizador (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 4 | — | O worker inicia o processamento (estado processing), remove as streams de áudio, copia a stream de vídeo sem recodificação quando esta é H.264 (*stream copy*), recodificando-a para H.264 apenas quando a origem é MPEG-4 Part 2 (AVI), e produz um novo ficheiro MP4 sem som. |
| 5 | — | O sistema armazena o novo vídeo, associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador via WebSocket. |
| 6 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo silencioso na lista de recursos; o vídeo original com áudio permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Cancelamento antes do início do processamento* | No passo 3, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a operação reservada à quota (se Registado), transita a tarefa para cancelled e notifica o utilizador. Nenhum novo vídeo é gerado. |
| *FA2 – Cancelamento durante o processamento* | No passo 4, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA3 – Utilizador com perfil Premium* | No passo 2, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária (quota ilimitada) e aplica os limites de duração alargados (até 60 min). |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Formato ou codec de vídeo não suportado.* | No passo 2, o sistema rejeita a operação se o vídeo não estiver num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Vídeo sem faixas de áudio.* | No passo 1, o sistema deteta que o vídeo não contém streams de áudio (NO_AUDIO_STREAM), informa o utilizador de que o vídeo já é silencioso e recusa a operação. A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 2, o sistema rejeita a operação se os limites forem excedidos (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 2, o sistema informa que o limite de 5 operações diárias foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 4, se o worker falhar → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador com mensagem de erro. Nenhum recurso parcial é criado. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo ficheiro MP4 sem qualquer stream de áudio é guardado no armazenamento de objetos e registado na base de dados associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária do utilizador é consumida em 1 operação (apenas perfil Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, ficheiros temporários são purgados, a quota diária reservada é devolvida integralmente e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium autenticados podem executar a operação. Utilizadores Anónimos não têm acesso. |
| *RN2* | O vídeo de entrada deve conter pelo menos uma stream de áudio detetável via metadados. Vídeos sem áudio são rejeitados sem consumo de quota. |
| *RN3* | O vídeo de entrada pode estar em qualquer formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) e o vídeo de saída é gerado em MP4 (DQ-012). Uma stream de vídeo H.264 é preservada sem recodificação (*stream copy* com -c:v copy -an); uma stream MPEG-4 Part 2 (AVI) é recodificada para H.264. |
| *RN4* | Limites por perfil: Registado — duração ≤ 5 minutos e tamanho ≤ 200 MB; Premium — duração ≤ 60 minutos e tamanho ≤ 2 GB. |
| *RN5* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN6* | Em caso de cancelamento ou falha técnica, o crédito de quota reservado é integralmente devolvido ao utilizador Registado. |
| *RN7* | A operação é assíncrona; o utilizador pode abandonar a página após submissão sem interromper o processamento. |
| *RN8* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN9* | Apenas pode existir 1 tarefa de vídeo ativa em simultâneo por projeto. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O utilizador tem acesso a um projeto com pelo menos um vídeo elegível (MP4, MOV ou AVI) que contém áudio. |
| *A2* | Quando o codec de vídeo permite cópia, -an e -c:v copy dispensam recodificação; a duração de execução depende também do tamanho e da transferência. AVI/MPEG-4 Part 2 exige recodificação para H.264. |
| *A3* | A quota diária é reposta diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Como é medido o progresso durante a remoção de áudio? | O worker reporta os estados e o progresso numérico segundo REQ-VID-NFR-008. Na cópia de streams, a operação pode terminar antes de se observar uma atualização intermédia; a recodificação segue a cadência das restantes transformações. |
| *Q2* | Em vídeos com múltiplas faixas de áudio, é possível escolher qual remover? | No MVP, a operação remove todas as faixas de áudio globalmente. A seleção granular de faixas fica como melhoria pós-MVP. |


---

# UC-VID-003 — Alterar a velocidade de reprodução de um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-003 |
| *Nome* | Alterar a velocidade de reprodução de um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador acelerar (*speed up*) ou desacelerar (*slow down*) a reprodução de um vídeo do projeto segundo um fator multiplicador definido, produzindo um novo vídeo com duração ajustada e sincronismo preservado, sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende criar efeitos de *timelapse* ou *slow motion* mantendo o sincronismo do áudio (se presente) sem degradar o vídeo de origem.<br> - *Sistema PictuRAS*: deve reamostrar fotogramas e ajustar a cadência sonora de forma proporcional e estável.<br> - *Administrador*: pretende garantir o cumprimento das quotas e a estabilidade computacional dos nós de processamento. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium), elegível para processamento.<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação de alteração de velocidade. |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Alterar Velocidade". | O sistema apresenta o vídeo selecionado e os controlos de velocidade (fatores predefinidos e campo de valor customizado). |
| 2 | O utilizador indica o fator de velocidade pretendido (e.g. 0.5×, 2.0×). | O sistema valida preliminarmente o valor e apresenta a duração estimada do vídeo resultante (duração_original / fator). |
| 3 | O utilizador confirma a alteração da velocidade. | O sistema valida que o fator se encontra no intervalo permitido (0.25× a 4.0×), verifica a quota diária disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado processing), ajusta os fotogramas de vídeo (filtro setpts) e, caso exista áudio, aplica o filtro de cadência sonora (atempo), gerando um novo MP4 (H.264/AAC) com duração ajustada (DQ-012). |
| 6 | — | O sistema armazena o novo vídeo, associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador via WebSocket. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo com a velocidade alterada na lista de recursos; o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Alteração do fator antes de confirmar* | No passo 2, o utilizador experimenta diferentes fatores → O sistema atualiza dinamicamente a duração prevista a cada alteração. O fluxo continua no passo 3. |
| *FA2 – Cancelamento antes do início do processamento* | No passo 4, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a operação reservada à quota (se Registado), transita a tarefa para cancelled e notifica o utilizador. Nenhum novo vídeo é gerado. |
| *FA3 – Cancelamento durante o processamento* | No passo 5, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA4 – Utilizador com perfil Premium* | No passo 3, o utilizador tem perfil Premium → O sistema não debita nem verifica quota diária (quota ilimitada) e aplica os limites de duração alargados (até 60 min). |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Fator de velocidade nulo, negativo ou igual a zero.* | No passo 3, o sistema rejeita a operação com erro de validação (INVALID_SPEED_FACTOR), informando que o fator deve ser estritamente positivo. A tarefa não é criada e a quota não é afetada. |
| *Fator de velocidade fora do intervalo homologado (0.25× a 4.0×).* | No passo 3, o sistema rejeita a operação com erro de limites (SPEED_FACTOR_OUT_OF_RANGE), indicando o intervalo homologado no MVP. A tarefa não é criada e a quota não é afetada. |
| *Formato ou codec de vídeo não suportado.* | No passo 3, o sistema rejeita a operação se o vídeo não estiver num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 3, o sistema rejeita a operação se os limites forem excedidos (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 5, se o worker falhar durante a recodificação → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo ficheiro MP4 com a velocidade de reprodução ajustada e duração recalculada é persistido no armazenamento de objetos e registado na base de dados associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária do utilizador é consumida em 1 operação (apenas perfil Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, ficheiros temporários são purgados, a quota diária reservada é devolvida integralmente e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | O fator de velocidade v deve ser um número real positivo no intervalo 0.25 ≤ v ≤ 4.0. Fatores fora deste intervalo são rejeitados. |
| *RN3* | A duração teórica do vídeo resultante é duração_nova = duração_orig / v. A resolução espacial nativa é integralmente conservada. |
| *RN4* | O vídeo de entrada pode estar em qualquer formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002); o vídeo de saída é gerado em MP4 com H.264 (vídeo) e AAC (áudio, se presente) (DQ-012). |
| *RN5* | Limites por perfil: Registado — duração original ≤ 5 minutos e tamanho ≤ 200 MB; Premium — duração ≤ 60 minutos e tamanho ≤ 2 GB. |
| *RN6* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN7* | Em caso de cancelamento ou falha técnica, o crédito de quota reservado é integralmente devolvido ao utilizador Registado. |
| *RN8* | A operação é assíncrona; o utilizador pode navegar noutras páginas após a submissão sem interromper o processamento. |
| *RN9* | Se o vídeo contiver áudio, este deve ser ajustado proporcionalmente para manter o sincronismo com o vídeo sem distorção excessiva de pitch. Se o vídeo não contiver áudio, apenas a stream de vídeo é ajustada. |
| *RN10* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN11* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O utilizador tem acesso a um projeto com pelo menos um vídeo elegível (MP4, MOV ou AVI) carregado. |
| *A2* | O FFmpeg suporta a alteração de velocidade de vídeo via filtro setpts e de áudio via filtro atempo (encadeado se v > 2.0 ou v < 0.5). |
| *A3* | A quota diária é redefinida diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Como é medido o progresso durante a alteração de velocidade? | No MVP, dada a simplicidade do pipeline, reportam-se os estados queued, processing e completed. O cancelamento é suportado em queued e processing. |
| *Q2* | Deve ser aplicado algoritmo de preservação de timbre no áudio (*pitch correction*)? | No MVP, utiliza-se o filtro padrão atempo do FFmpeg que preserva o timbre de forma aceitável no intervalo 0.25× a 4.0×. Ajustes avançados ficam para a Fase 2. |


---

# UC-VID-004 — Aplicar marca de água a um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-004 |
| *Nome* | Aplicar marca de água a um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador aplicar uma marca de água (texto ou imagem) com posição, tamanho e opacidade configuráveis sobre todos os fotogramas de um vídeo do projeto, gerando um novo vídeo protegido, sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende proteger os seus direitos de autor sobre o vídeo com identificação visual clara e não obstrutiva.<br> - *Sistema PictuRAS*: deve compor a marca de água fotograma a fotograma com estabilidade e desempenho previsível.<br> - *Administrador*: pretende garantir que o processamento intensivo respeita as quotas e os limites de infraestrutura. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br> - Se a marca for imagem, o ficheiro de imagem está acessível (formato PNG ou JPEG).<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação de aplicação de marca de água. |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Marca de Água". | O sistema apresenta o vídeo e a interface de configuração da marca de água. |
| 2 | O utilizador escolhe o tipo de marca: texto ou imagem. | O sistema apresenta os campos respetivos (campo de texto ou seletor/upload de imagem). |
| 3 | O utilizador introduz o texto da marca (ou seleciona a imagem) e configura a posição (predefinida ou coordenadas manuais X, Y), o tamanho e a opacidade. | O sistema valida os parâmetros e apresenta uma pré-visualização estática da marca sobreposta a um fotograma do vídeo. |
| 4 | O utilizador confirma a operação. | O sistema valida as dimensões e limites geométricos em relação ao quadro do vídeo, verifica a quota diária disponível (se Registado) e cria a tarefa assíncrona. |
| 5 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 6 | — | O worker inicia o processamento (estado processing), sobrepõe a marca fotograma a fotograma (filtro FFmpeg overlay sobre PNG; o texto é previamente renderizado em PNG por sharp/Pango, segundo D-59/ADR-009), mantendo a posição fixa, e emite eventos de progresso percentual (0–100%) via WebSocket. |
| 7 | — | O worker recompõe o vídeo no contentor MP4 com o codec H.264, remuxa a stream de áudio original sem recodificação quando esta é AAC (recodificando-a para AAC quando é MP3, em AVI) e armazena o ficheiro resultante. |
| 8 | — | O sistema associa o novo vídeo ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador via WebSocket. |
| 9 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo com marca de água na lista de recursos; o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Marca de água como imagem* | No passo 2, o utilizador escolhe imagem → O sistema permite selecionar uma imagem da galeria do projeto ou carregar um ficheiro PNG/JPEG local. O fluxo continua no passo 3. |
| *FA2 – Alteração de parâmetros após pré-visualização* | No passo 3, após ver a pré-visualização estática, o utilizador ajusta a posição, opacidade ou dimensão → O sistema re-renderiza a pré-visualização estática imediatamente. O fluxo continua no passo 4. |
| *FA3 – Cancelamento antes do início do processamento* | No passo 5, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a operação reservada à quota (se Registado), transita a tarefa para cancelled e notifica o utilizador. Nenhum novo vídeo é gerado. |
| *FA4 – Cancelamento durante o processamento* | No passo 6, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA5 – Utilizador com perfil Premium* | No passo 4, o utilizador tem perfil Premium → O sistema não debita nem verifica quota diária (quota ilimitada) e aplica os limites de duração alargados (até 60 min). |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Formato ou codec de vídeo não suportado.* | No passo 4, o sistema rejeita a operação se o vídeo não estiver num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002) (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Conteúdo da marca de água vazio ou inválido.* | No passo 3, se o texto estiver vazio ou a imagem for ilegível/corrompida → O sistema rejeita com erro (INVALID_WATERMARK_CONTENT). A tarefa não é criada e a quota não é afetada. |
| *Posição ou dimensão fora dos limites do vídeo.* | No passo 4, se a marca configurada ultrapassar as margens visíveis do quadro do vídeo → O sistema rejeita com erro (WATERMARK_OUT_OF_BOUNDS). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 4, o sistema rejeita a operação se os limites forem excedidos (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 4, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 6, se o worker falhar durante a renderização de fotogramas → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador com mensagem de erro. Nenhum recurso parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo ficheiro MP4 com a marca de água sobreposta em todos os fotogramas é persistido no armazenamento de objetos e registado na base de dados associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária do utilizador é consumida em 1 operação (apenas perfil Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, ficheiros temporários são purgados, a quota diária reservada é devolvida integralmente e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | No MVP, a marca de água tem posição, tamanho e opacidade fixos e constantes ao longo de toda a duração do vídeo. |
| *RN3* | A marca de água deve estar integralmente contida nos limites do quadro do vídeo (X + largura ≤ largura_vídeo e Y + altura ≤ altura_vídeo). |
| *RN4* | O vídeo de entrada pode estar em qualquer formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002); o vídeo de saída é gerado em MP4 com H.264 (vídeo) e AAC (áudio, se presente) (DQ-012). Se o vídeo contiver áudio AAC, este é remuxado sem recodificação; áudio MP3 é recodificado para AAC. |
| *RN5* | Limites por perfil: Registado — duração ≤ 5 minutos e tamanho ≤ 200 MB; Premium — duração ≤ 60 minutos e tamanho ≤ 2 GB. |
| *RN6* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN7* | Em caso de cancelamento ou falha técnica, o crédito de quota reservado é integralmente devolvido ao utilizador Registado. |
| *RN8* | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket à medida que os fotogramas são processados. |
| *RN9* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN10* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O utilizador tem acesso a um projeto com pelo menos um vídeo elegível (MP4, MOV ou AVI) carregado. |
| *A2* | O FFmpeg suporta a sobreposição de texto com fontes TrueType (drawtext) e de imagens com canal alfa (overlay). |
| *A3* | A quota diária é reposta diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Como é medido o progresso durante a marca de água? | O worker emite o progresso percentual (0–100%) com base no tempo de saída comunicado pelo FFmpeg e na duração esperada do plano, segundo a cadência de REQ-VID-NFR-008. |
| *Q2* | A marca de água pode mover-se ao longo do vídeo ou ter intervalo temporal de visibilidade restrito? | Não para o MVP. A posição é estática e contínua do primeiro ao último fotograma. Posições dinâmicas ficam para a Fase 2. |


---

# UC-VID-005 — Descarregar um vídeo do projeto

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-005 |
| *Nome* | Descarregar um vídeo do projeto |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador descarregar para o seu dispositivo um vídeo do projeto — em particular o vídeo resultante de uma operação —, no formato em que se encontra armazenado, sem consumir quota e sem alterar o recurso. |
| *Âmbito* | Módulo de gestão de projetos e armazenamento multimédia do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e permissão de leitura (ou superior) no projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende obter no seu dispositivo o resultado das operações de vídeo para o utilizar fora da plataforma, de forma rápida e sem gastar quota.<br> - *Sistema PictuRAS*: deve garantir que apenas utilizadores autorizados obtêm o ficheiro e que a transferência de ficheiros grandes não sobrecarrega o API Gateway.<br> - *Equipa de Infraestrutura / DevOps*: pretende que as transferências sejam servidas diretamente pelo armazenamento de objetos com URLs temporários e retoma de transferência. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de leitura, edição ou de proprietário sobre o projeto.<br> - O projeto contém pelo menos um recurso de vídeo (original ou resultante) no estado completed. |
| *Trigger* | O utilizador seleciona um vídeo na galeria do projeto (ou no reprodutor integrado) e escolhe a opção "Descarregar". |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador seleciona um vídeo na galeria do projeto e escolhe a opção "Descarregar". | O sistema verifica a permissão de leitura do utilizador sobre o projeto e o estado do recurso, e apresenta o nome de ficheiro sugerido, o formato e o tamanho do ficheiro. |
| 2 | O utilizador confirma o descarregamento. | O sistema gera um URL assinado temporário (válido durante 15 minutos), para o recurso, após autorizar o utilizador; a assinatura é portadora e não exige JWT na transferência, sem debitar quota. |
| 3 | — | O navegador inicia a transferência diretamente a partir do armazenamento de objetos (SeaweedFS/S3), com o nome de ficheiro sugerido no formato nome-original_operacao.extensão. |
| 4 | O utilizador obtém o ficheiro no seu dispositivo. | O sistema regista o evento de descarregamento nos logs com o correlationId; o recurso permanece inalterado no projeto. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Descarregamento a partir do reprodutor integrado* | No passo 1, o utilizador escolhe "Descarregar" nos controlos do reprodutor → O fluxo continua no passo 2. |
| *FA2 – Retoma de transferência interrompida* | No passo 3, a ligação é interrompida → Enquanto o URL estiver válido, o navegador retoma a transferência a partir do último byte recebido (pedidos HTTP Range), sem recomeçar do início. |
| *FA3 – URL expirado* | No passo 3, o URL assinado expirou antes da conclusão → O utilizador volta a escolher "Descarregar" e o sistema gera um novo URL (regresso ao passo 2). |
| *FA4 – Descarregamento do vídeo original* | No passo 1, o utilizador seleciona o vídeo original (não resultante) → O sistema entrega o ficheiro no formato em que foi carregado (MP4, MOV ou AVI), e não a cópia de pré-visualização. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *O recurso ainda não está concluído (queued ou processing).* | No passo 1, a opção "Descarregar" está desativada e o sistema informa que o recurso ainda não está disponível (RESOURCE_NOT_READY). |
| *O utilizador não tem permissão sobre o projeto.* | No passo 1, o sistema rejeita o pedido com HTTP 403 Forbidden e não gera URL. |
| *O URL é utilizado por outro utilizador ou após expirar.* | No passo 3, o armazenamento recusa o pedido com HTTP 403 Forbidden. |
| *O objeto não existe no armazenamento.* | No passo 2, o sistema informa que o ficheiro não está disponível (RESOURCE_UNAVAILABLE) e regista a falha nos logs com o correlationId. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | O utilizador dispõe de uma cópia do vídeo no seu dispositivo, no formato armazenado. O recurso no projeto permanece inalterado e a quota diária não é debitada. |
| *Garantia Mínima* | Em caso de erro, nenhum URL válido é exposto a utilizadores não autorizados, o recurso e o projeto permanecem inalterados e a quota não é afetada. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | O descarregamento está disponível para utilizadores Registados e Premium com permissão de leitura, edição ou de proprietário no projeto. Utilizadores Anónimos não têm acesso. |
| *RN2* | O descarregamento não consome créditos da quota diária de operações. |
| *RN3* | Apenas recursos de vídeo no estado completed podem ser descarregados. |
| *RN4* | O URL de transferência é assinado, para o recurso, após autorizar o utilizador; a assinatura é portadora e não exige JWT na transferência, e expira ao fim de 15 minutos. |
| *RN5* | O nome de ficheiro sugerido é composto pelo nome original, um sufixo com a(s) operação(ões) aplicada(s) e a extensão do formato armazenado. |
| *RN6* | O descarregamento não altera, move nem elimina o recurso no projeto. |
| *RN7* | Qualquer recurso de vídeo do projeto pode ser descarregado (original ou resultante), sempre no formato armazenado e nunca na cópia de pré-visualização. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O armazenamento de objetos (SeaweedFS/S3) suporta URLs assinados e pedidos HTTP Range. |
| *A2* | O navegador do utilizador suporta a transferência de ficheiros de até 2 GB. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Deve existir um limite diário de descarregamentos? | Não no MVP. O controlo é feito pela expiração dos URLs e pelas permissões do projeto. |


---

# UC-VID-006 — Consultar as informações de um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-006 |
| *Nome* | Consultar as informações de um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador consultar as informações técnicas de um vídeo do projeto — duração, resolução, formato, tamanho do ficheiro e taxa de fotogramas — sem criar tarefas de processamento nem consumir quota. |
| *Âmbito* | Módulo de gestão de projetos e visualização do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e permissão de leitura (ou superior) no projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende conhecer as características do vídeo para escolher e parametrizar corretamente as operações (e.g. recorte, redimensionamento, conversão).<br> - *Sistema PictuRAS*: deve apresentar valores coerentes com os metadados extraídos na ingestão, sem custo computacional adicional. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de leitura, edição ou de proprietário sobre o projeto.<br> - O projeto contém pelo menos um recurso de vídeo. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a opção "Informações". |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador seleciona um vídeo na galeria do projeto e escolhe a opção "Informações". | O sistema verifica a permissão de leitura e obtém os metadados técnicos persistidos do recurso, sem criar tarefa e sem debitar quota. |
| 2 | — | O sistema apresenta um painel com a duração (hh:mm:ss.mmm), a resolução (largura × altura em px), o formato (contentor e codecs de vídeo e de áudio), o tamanho do ficheiro (MB ou GB, com 2 casas decimais) e a taxa de fotogramas (fps, com 2 casas decimais). |
| 3 | O utilizador fecha o painel. | O sistema regressa à vista anterior; o recurso permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Consulta de um vídeo resultante* | No passo 2, se o vídeo resultar de uma operação, cadeia ou junção → O sistema apresenta adicionalmente a proveniência (vídeo(s) de origem) e a descrição da(s) operação(ões) aplicada(s). |
| *FA2 – Consulta de um original em MOV ou AVI* | No passo 2, o sistema apresenta o formato e os codecs do ficheiro original e não os da cópia de pré-visualização MP4. |
| *FA3 – Consulta a partir do reprodutor integrado* | No passo 1, o utilizador abre o painel nos controlos do reprodutor → O fluxo continua no passo 2. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Algum metadado não está disponível.* | No passo 2, o sistema apresenta o campo como "Indisponível" e regista o aviso (METADATA_UNAVAILABLE) nos logs com o correlationId. |
| *O utilizador não tem permissão sobre o projeto.* | No passo 1, o sistema rejeita o pedido com HTTP 403 Forbidden. |
| *O recurso ainda está em processamento.* | No passo 1, o sistema apresenta apenas o estado da tarefa (queued ou processing) e informa que as informações técnicas estarão disponíveis após a conclusão. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | O utilizador visualiza as informações técnicas do vídeo. Nenhuma tarefa é criada, a quota não é debitada e o recurso permanece inalterado. |
| *Garantia Mínima* | Em caso de erro, o projeto e o recurso permanecem inalterados e a quota não é afetada. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | A consulta está disponível para utilizadores Registados e Premium com permissão de leitura, edição ou de proprietário no projeto. |
| *RN2* | A consulta não cria tarefas de processamento e não consome créditos da quota diária. |
| *RN3* | As informações são obtidas dos metadados persistidos na ingestão (UC-VID-000) ou na criação do recurso resultante, sem nova análise do ficheiro. |
| *RN4* | Unidades de apresentação: duração em hh:mm:ss.mmm; resolução em px; tamanho em MB (< 1 GB) ou GB; taxa de fotogramas em fps com 2 casas decimais. |
| *RN5* | A consulta é exclusivamente de leitura. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | Os metadados técnicos de todos os recursos de vídeo foram extraídos com FFprobe e persistidos no MongoDB no momento da sua criação. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Devem ser apresentados metadados avançados (bitrate, perfil H.264, canais de áudio)? | Não no MVP. O painel apresenta apenas os cinco atributos do requisito; os metadados avançados ficam para a Fase 2. |


---

# UC-VID-007 — Ajustar as propriedades visuais de um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-007 |
| *Nome* | Ajustar as propriedades visuais de um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador ajustar o brilho, o contraste e a saturação de um vídeo do projeto, obtendo um novo vídeo com os ajustes aplicados de forma uniforme a todos os fotogramas, sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende corrigir vídeos escuros, lavados ou com cores pouco vivas, validando o efeito antes de gastar quota.<br> - *Sistema PictuRAS*: deve aplicar os ajustes com a mesma semântica das ferramentas de imagem existentes (brilho, contraste e saturação) e produzir um resultado consistente.<br> - *Administrador*: pretende garantir que o processamento respeita quotas e limites de infraestrutura. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação "Ajustar Imagem". |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Ajustar Imagem". | O sistema apresenta o vídeo e três controlos deslizantes (brilho, contraste e saturação), todos no valor neutro 1.0. |
| 2 | O utilizador ajusta um ou mais controlos no intervalo 0.0 a 2.0. | O sistema apresenta, em ≤ 1 s, uma pré-visualização estática do primeiro fotograma com os ajustes aplicados. |
| 3 | O utilizador confirma a operação. | O sistema valida que os valores estão no intervalo permitido e que pelo menos um difere do neutro, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado processing), aplica os ajustes de forma uniforme a todos os fotogramas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC), preservando a duração, a resolução, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo ajustado na lista de recursos; o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Repor valores neutros* | No passo 2, o utilizador clica em "Repor" → O sistema repõe os três controlos em 1.0 e atualiza a pré-visualização. |
| *FA2 – Cancelamento antes do início do processamento* | No passo 4, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA3 – Cancelamento durante o processamento* | No passo 5, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA4 – Utilizador com perfil Premium* | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| *FA5 – Utilização como passo de cadeia* | A operação é configurada como passo de uma cadeia (UC-VID-013) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Valor de ajuste fora do intervalo 0.0 a 2.0.* | No passo 3, o sistema rejeita a operação (INVALID_ADJUST_PARAMS), indicando o controlo incorreto. A tarefa não é criada e a quota não é afetada. |
| *Todos os valores no neutro (1.0).* | No passo 3, o sistema bloqueia a confirmação (NO_CHANGES) informando que nenhum ajuste foi definido. |
| *Formato ou codec de vídeo não suportado.* | No passo 3, o sistema rejeita a operação (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 3, o sistema rejeita a operação (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 5, se o worker falhar → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo vídeo MP4 com o brilho, o contraste e a saturação ajustados em todos os fotogramas é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | Cada propriedade (brilho, contraste, saturação) é um fator multiplicativo no intervalo [0.0, 2.0], com passo de 0.05 e valor neutro 1.0, à semelhança das ferramentas de imagem existentes (DQ-019). |
| *RN3* | Pelo menos uma propriedade deve ter valor diferente do neutro. |
| *RN4* | Os ajustes são aplicados de forma uniforme a todos os fotogramas do vídeo. |
| *RN5* | O resultado é gerado em MP4 (H.264/AAC), preservando a duração, a resolução, a taxa de fotogramas e o áudio do original (DQ-012). |
| *RN6* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN7* | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| *RN8* | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| *RN9* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN10* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| *RN11* | A operação pode ser usada como passo de uma cadeia (UC-VID-013). |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O FFmpeg (filtro eq) permite aplicar brilho, contraste e saturação com semântica equivalente à dos fatores da biblioteca de imagem utilizada nas ferramentas existentes. |
| *A2* | A quota diária é reposta diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Devem ser suportados outros ajustes (gama, nitidez, temperatura de cor)? | Não no MVP. Os ajustes adicionais ficam para a Fase 2; a temperatura de cor é parcialmente coberta pelos filtros "Frio" e "Quente" (UC-VID-008). |


---

# UC-VID-008 — Aplicar um filtro visual a um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-008 |
| *Nome* | Aplicar um filtro visual a um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador aplicar um filtro visual predefinido a um vídeo do projeto, obtendo um novo vídeo com o filtro aplicado a todos os fotogramas, sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende dar um estilo visual ao vídeo com um clique, sem conhecer parâmetros técnicos.<br> - *Sistema PictuRAS*: deve disponibilizar um catálogo fechado de filtros com resultado previsível e reprodutível.<br> - *Administrador*: pretende garantir que o processamento respeita quotas e limites de infraestrutura. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação "Aplicar Filtro". |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Aplicar Filtro". | O sistema apresenta o vídeo e o catálogo de filtros predefinidos (Preto e Branco, Sépia, Negativo, Vintage, Frio e Quente), cada um com uma miniatura de exemplo sobre o primeiro fotograma. |
| 2 | O utilizador seleciona um filtro do catálogo. | O sistema apresenta, em ≤ 1 s, uma pré-visualização estática do primeiro fotograma com o filtro aplicado. |
| 3 | O utilizador confirma a operação. | O sistema valida que foi selecionado exatamente um filtro existente no catálogo, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado processing), aplica o filtro de forma uniforme a todos os fotogramas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC), preservando a duração, a resolução, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo filtrado na lista de recursos; o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Troca de filtro após pré-visualização* | No passo 2, o utilizador seleciona outro filtro → O sistema substitui a seleção anterior e atualiza a pré-visualização. |
| *FA2 – Cancelamento antes do início do processamento* | No passo 4, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA3 – Cancelamento durante o processamento* | No passo 5, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA4 – Utilizador com perfil Premium* | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| *FA5 – Utilização como passo de cadeia* | A operação é configurada como passo de uma cadeia (UC-VID-013) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Nenhum filtro selecionado ou filtro inexistente no catálogo.* | No passo 3, o sistema rejeita a operação (INVALID_FILTER). A tarefa não é criada e a quota não é afetada. |
| *Formato ou codec de vídeo não suportado.* | No passo 3, o sistema rejeita a operação (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 3, o sistema rejeita a operação (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 5, se o worker falhar → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo vídeo MP4 com o filtro selecionado aplicado a todos os fotogramas é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | O catálogo de filtros do MVP é fechado: Preto e Branco, Sépia, Negativo, Vintage, Frio e Quente (DQ-020). |
| *RN3* | Cada operação aplica exatamente um filtro, sem controlo de intensidade. |
| *RN4* | O filtro é aplicado de forma uniforme a todos os fotogramas do vídeo. |
| *RN5* | O resultado é gerado em MP4 (H.264/AAC), preservando a duração, a resolução, a taxa de fotogramas e o áudio do original (DQ-012). |
| *RN6* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN7* | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| *RN8* | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| *RN9* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN10* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| *RN11* | A operação pode ser usada como passo de uma cadeia (UC-VID-013). |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | Cada filtro do catálogo é implementável com filtros FFmpeg standard (e.g. hue, colorchannelmixer, negate, curves). |
| *A2* | A quota diária é reposta diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Deve existir controlo de intensidade do filtro? | Não no MVP (Q-ERS-008). A intensidade fica para a Fase 2. |
| *Q2* | Deve ser possível combinar vários filtros? | Sim, mas apenas através do encadeamento de operações (UC-VID-013), com um filtro por passo. |


---

# UC-VID-009 — Redimensionar um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-009 |
| *Nome* | Redimensionar um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador alterar a resolução de um vídeo do projeto, selecionando as dimensões de saída pretendidas, e obter um novo vídeo com essas dimensões, sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende reduzir o tamanho do vídeo para partilha ou adaptá-lo a uma resolução-alvo (e.g. 720p).<br> - *Sistema PictuRAS*: deve garantir dimensões compatíveis com o codec H.264 e com os limites do perfil.<br> - *Administrador*: pretende evitar resoluções excessivas que sobrecarreguem os workers e o armazenamento. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação "Redimensionar". |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Redimensionar". | O sistema apresenta a resolução atual, os campos de largura e altura preenchidos com os valores atuais, o bloqueio de proporção ativo e as predefinições 1080p, 720p, 480p e 360p. |
| 2 | O utilizador escolhe uma predefinição ou introduz a largura (ou a altura) pretendida. | Com a proporção bloqueada, o sistema recalcula a outra dimensão, arredondando-a para o número par mais próximo, e apresenta as dimensões finais. |
| 3 | O utilizador confirma a operação. | O sistema valida que as dimensões são pares, ≥ 128 px, dentro do limite do perfil e diferentes das atuais, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado processing), reamostra todos os fotogramas para as dimensões pretendidas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC) com as dimensões exatas, preservando a duração, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo redimensionado na lista de recursos; o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Desbloqueio da proporção* | No passo 2, o utilizador desativa o bloqueio de proporção e define largura e altura de forma independente → O sistema apresenta um aviso de que a imagem ficará distorcida. O fluxo continua no passo 3. |
| *FA2 – Ampliação acima da resolução original* | No passo 2, as dimensões pretendidas são superiores às originais → O sistema apresenta um aviso de que a ampliação não acrescenta detalhe. O fluxo continua no passo 3. |
| *FA3 – Cancelamento antes do início do processamento* | No passo 4, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA4 – Cancelamento durante o processamento* | No passo 5, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA5 – Utilizador com perfil Premium* | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica o limite de resolução alargado (3840×2160). |
| *FA6 – Utilização como passo de cadeia* | A operação é configurada como passo de uma cadeia (UC-VID-013) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Dimensões ímpares, inferiores a 128 px ou acima do limite do perfil.* | No passo 3, o sistema rejeita a operação (INVALID_RESIZE_PARAMS), indicando a dimensão incorreta e o limite aplicável. A tarefa não é criada e a quota não é afetada. |
| *Dimensões iguais às do vídeo original.* | No passo 3, o sistema bloqueia a confirmação (NO_CHANGES). |
| *Formato ou codec de vídeo não suportado.* | No passo 3, o sistema rejeita a operação (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 3, o sistema rejeita a operação (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 5, se o worker falhar → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo vídeo MP4 com exatamente as dimensões confirmadas é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | A largura e a altura de saída são números inteiros pares, com mínimo de 128 px (requisito de compatibilidade do codec H.264). |
| *RN3* | Limites de resolução de saída por perfil (maior dimensão × menor dimensão): Registado — até 1920×1080; Premium — até 3840×2160 (DQ-021). |
| *RN4* | Por omissão, a proporção original é mantida; o desbloqueio da proporção é permitido mediante aviso de distorção. |
| *RN5* | A ampliação acima da resolução original é permitida, mediante aviso. |
| *RN6* | O resultado é gerado em MP4 (H.264/AAC), preservando a duração, a taxa de fotogramas e o áudio do original (DQ-012). |
| *RN7* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN8* | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| *RN9* | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| *RN10* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN11* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| *RN12* | A operação pode ser usada como passo de uma cadeia (UC-VID-013). |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O FFmpeg (filtro scale) suporta a reamostragem para as dimensões pretendidas com qualidade adequada. |
| *A2* | Os limites de resolução são valores de MVP, configuráveis e a validar pela equipa. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Com a proporção desbloqueada, deve ser oferecido o preenchimento com barras pretas (*letterbox*) em vez da distorção? | Não no MVP. Com a proporção desbloqueada, a imagem é esticada mediante aviso; o *letterbox* fica para a Fase 2. |


---

# UC-VID-010 — Rodar e espelhar um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-010 |
| *Nome* | Rodar e espelhar um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador rodar um vídeo do projeto num ângulo de 90°, 180° ou 270° e/ou espelhá-lo na horizontal ou na vertical, de modo a corrigir ou alterar a orientação, obtendo um novo vídeo sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende corrigir vídeos gravados na orientação errada (e.g. telemóvel na vertical) ou criar efeitos de espelho.<br> - *Sistema PictuRAS*: deve aplicar transformações geométricas exatas e sem perda de área visível.<br> - *Administrador*: pretende garantir que o processamento respeita quotas e limites de infraestrutura. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação "Rodar / Espelhar". |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Rodar / Espelhar". | O sistema apresenta o vídeo, os botões de rotação no sentido horário (90°, 180°, 270°) e as opções de espelho horizontal e vertical, todos desativados. |
| 2 | O utilizador escolhe um ângulo de rotação e/ou uma ou ambas as opções de espelho. | O sistema apresenta, em ≤ 1 s, uma pré-visualização estática do primeiro fotograma com a transformação combinada (rotação aplicada primeiro, espelho depois) e as dimensões resultantes. |
| 3 | O utilizador confirma a operação. | O sistema valida que o ângulo pertence ao conjunto permitido e que foi definida pelo menos uma transformação, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado processing), aplica a transformação a todos os fotogramas e emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O worker gera o novo vídeo em MP4 (H.264/AAC), com largura e altura trocadas nas rotações de 90° e 270°, preservando a duração, a taxa de fotogramas e o áudio; o sistema associa-o ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo transformado na lista de recursos; o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Alteração da transformação após pré-visualização* | No passo 2, o utilizador altera o ângulo ou as opções de espelho → O sistema atualiza a pré-visualização e as dimensões resultantes. |
| *FA2 – Cancelamento antes do início do processamento* | No passo 4, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA3 – Cancelamento durante o processamento* | No passo 5, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA4 – Utilizador com perfil Premium* | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| *FA5 – Utilização como passo de cadeia* | A operação é configurada como passo de uma cadeia (UC-VID-013) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Ângulo de rotação fora do conjunto {90°, 180°, 270°}.* | No passo 3, o sistema rejeita a operação (INVALID_ORIENT_PARAMS). A tarefa não é criada e a quota não é afetada. |
| *Nenhuma transformação definida (sem rotação e sem espelho).* | No passo 3, o sistema bloqueia a confirmação (NO_CHANGES). |
| *Formato ou codec de vídeo não suportado.* | No passo 3, o sistema rejeita a operação (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 3, o sistema rejeita a operação (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 5, se o worker falhar → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo vídeo MP4 com a orientação pretendida é persistido e associado ao projeto (com referência ao vídeo de origem). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | A rotação é feita no sentido horário e apenas nos ângulos 90°, 180° e 270°. |
| *RN3* | O espelho pode ser horizontal, vertical ou ambos, e pode ser combinado com a rotação numa única operação; a rotação é aplicada antes do espelho. |
| *RN4* | Pelo menos uma transformação (rotação ou espelho) deve estar definida. |
| *RN5* | Nas rotações de 90° e 270°, a largura e a altura do vídeo resultante são trocadas, sem recorte nem barras. |
| *RN6* | O resultado é gerado em MP4 (H.264/AAC), preservando a duração, a taxa de fotogramas e o áudio do original (DQ-012). |
| *RN7* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN8* | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| *RN9* | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| *RN10* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN11* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| *RN12* | A operação pode ser usada como passo de uma cadeia (UC-VID-013). |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O FFmpeg (filtros transpose, hflip e vflip) aplica as transformações sem perda de área visível. |
| *A2* | A quota diária é reposta diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Deve ser suportada a rotação por ângulos arbitrários (e.g. 15°)? | Não no MVP. Apenas múltiplos de 90°, que não exigem recorte nem preenchimento. |
| *Q2* | Deve ser respeitada a etiqueta de rotação dos metadados (e.g. vídeos de telemóvel)? | Sim. A pré-visualização e o processamento partem da orientação de apresentação indicada pelos metadados do original. |


---

# UC-VID-011 — Converter o formato de um vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-011 |
| *Nome* | Converter o formato de um vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador converter um vídeo do projeto entre os formatos suportados (MP4, MOV e AVI), selecionando o formato de saída pretendido, e obter um novo vídeo nesse formato sem alterar o original. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende obter o vídeo num formato compatível com outra aplicação ou dispositivo (e.g. converter um AVI antigo para MP4).<br> - *Sistema PictuRAS*: deve produzir ficheiros conformes à matriz de formatos e codecs aprovada, evitando recodificações desnecessárias.<br> - *Administrador*: pretende garantir que o processamento respeita quotas e limites de infraestrutura. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), com duração ≤ 5 min e tamanho ≤ 200 MB (Registado) ou ≤ 60 min e ≤ 2 GB (Premium).<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação "Converter Formato". |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Converter Formato". | O sistema apresenta o formato atual (contentor e codecs) e a lista de formatos de saída suportados (MP4, MOV, AVI), excluindo o formato atual. |
| 2 | O utilizador seleciona o formato de saída. | O sistema apresenta os codecs que serão utilizados no formato escolhido e indica se a conversão será feita por cópia direta de streams (*remux*) ou por recodificação. |
| 3 | O utilizador confirma a operação. | O sistema valida que o formato de saída pertence à matriz suportada e é diferente do atual, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 4 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 5 | — | O worker inicia o processamento (estado processing) e gera o novo contentor, copiando as streams sem recodificação quando os codecs de origem coincidem, por stream, com os codecs de saída fixados na matriz, ou recodificando-as para os codecs da matriz caso contrário; emite progresso percentual (0–100%) via WebSocket. |
| 6 | — | O sistema armazena o novo vídeo, preservando a duração, a resolução e a taxa de fotogramas; se o formato de saída for MOV ou AVI, gera a cópia de pré-visualização MP4; associa o resultado ao projeto como novo recurso (referenciando o vídeo de origem), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador. |
| 7 | O utilizador consulta o projeto. | O sistema apresenta o novo vídeo convertido na lista de recursos, disponível para reprodução e descarregamento (UC-VID-005); o vídeo original permanece inalterado. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Conversão por cópia direta de streams* | No passo 5, se os codecs de origem forem admitidos no formato de saída (e.g. MP4 H.264/AAC → MOV) → O worker reacondiciona as streams no novo contentor sem recodificação, sem perda de qualidade. |
| *FA2 – Cancelamento antes do início do processamento* | No passo 4, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA3 – Cancelamento durante o processamento* | No passo 5, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA4 – Utilizador com perfil Premium* | No passo 3, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados. |
| *FA5 – Utilização como passo de cadeia* | A conversão é configurada como último passo de uma cadeia (UC-VID-013) → As mesmas regras de validação aplicam-se e a execução segue o caso de uso respetivo. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Formato de saída igual ao formato atual.* | No passo 3, o sistema bloqueia a confirmação (SAME_FORMAT). |
| *Formato de saída fora da matriz suportada.* | No passo 3, o sistema rejeita a operação (UNSUPPORTED_TARGET_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Formato ou codec do vídeo de origem não suportado.* | No passo 3, o sistema rejeita a operação (UNSUPPORTED_FORMAT). A tarefa não é criada e a quota não é afetada. |
| *Duração ou tamanho superior ao limite do perfil.* | No passo 3, o sistema rejeita a operação (LIMIT_EXCEEDED). A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 3, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 5, se o worker falhar → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum recurso parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um novo vídeo no formato de saída escolhido, conforme à matriz de codecs, é persistido e associado ao projeto (com referência ao vídeo de origem e, se MOV/AVI, com cópia de pré-visualização MP4). O vídeo original permanece inalterado. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum novo recurso é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para failed ou cancelled. O vídeo original permanece inalterado. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | Os formatos de origem e de saída admitidos são MP4, MOV e AVI (DQ-002). |
| *RN3* | Codecs de saída por formato: MP4 e MOV — H.264 (vídeo) e AAC (áudio); AVI — MPEG-4 Part 2 (vídeo) e MP3 (áudio). |
| *RN4* | O formato de saída tem de ser diferente do formato de origem. |
| *RN5* | Quando os codecs de origem coincidem, por stream, com os codecs de saída fixados na matriz, as streams são copiadas sem recodificação; caso contrário, são recodificadas para os codecs da RN3. |
| *RN6* | A conversão preserva a duração e a taxa de fotogramas. Preserva também a resolução, exceto o corte de um píxel na dimensão ímpar quando a recodificação o exige (D-71); a cópia não efetua esse corte. |
| *RN7* | Os resultados em MOV ou AVI recebem uma cópia de pré-visualização MP4 para reprodução no leitor integrado (DQ-011). |
| *RN8* | Cada operação concluída consome exatamente 1 crédito da quota diária do utilizador Registado (limite de 5 operações/dia). Utilizadores Premium têm quota ilimitada. |
| *RN9* | Em caso de cancelamento ou falha técnica, o crédito reservado é integralmente devolvido ao utilizador Registado. |
| *RN10* | A operação é assíncrona; o progresso numérico (0–100%) é emitido via WebSocket. |
| *RN11* | O vídeo original nunca é alterado nem eliminado; o resultado é um novo recurso independente no projeto. |
| *RN12* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| *RN13* | A conversão pode ser usada numa cadeia (UC-VID-013), mas apenas como último passo (DQ-016). |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O FFmpeg suporta a escrita dos contentores MP4, MOV e AVI com os codecs da RN3. |
| *A2* | A quota diária é reposta diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Deve o utilizador poder escolher o codec ou a qualidade (bitrate) de saída? | Não no MVP. Os codecs são fixos por formato (RN3) e a qualidade usa os valores por omissão da equipa. |
| *Q2* | Devem ser suportados outros formatos de saída (WebM, MKV, GIF)? | Não no MVP; ficam para o Alvo de Produção da REQ-VID-NFR-003. |


---

# UC-VID-012 — Juntar vídeos

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-012 |
| *Nome* | Juntar vídeos |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador juntar dois ou mais vídeos do projeto, concatenando-os pela ordem selecionada num único vídeo final, sem alterar os originais. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende compor um único vídeo a partir de vários clips, controlando a ordem.<br> - *Sistema PictuRAS*: deve produzir um resultado contínuo mesmo quando os clips têm resoluções, taxas de fotogramas ou presença de áudio diferentes.<br> - *Administrador*: pretende limitar o número de clips e a duração total para proteger os workers e o armazenamento. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém pelo menos dois vídeos num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002).<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador escolhe a operação "Juntar Vídeos" no projeto. |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto e escolhe a operação "Juntar Vídeos". | O sistema apresenta a lista de vídeos elegíveis do projeto (miniatura, nome e duração) e os limites do perfil (número máximo de vídeos e duração total). |
| 2 | O utilizador seleciona dois ou mais vídeos. | O sistema apresenta os vídeos numa linha temporal pela ordem de seleção, com a duração total estimada. |
| 3 | O utilizador reordena os vídeos (arrastando-os ou com setas). | O sistema atualiza a ordem na linha temporal e indica a resolução e a taxa de fotogramas do resultado (as do primeiro vídeo). |
| 4 | O utilizador confirma a operação. | O sistema valida o número de vídeos, a duração total face ao limite do perfil e os formatos, verifica a quota disponível (se Registado) e cria a tarefa assíncrona. |
| 5 | — | O sistema reserva 1 operação da quota diária (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 6 | — | O worker inicia o processamento (estado processing), normaliza cada clip para a resolução e taxa de fotogramas do primeiro (com barras pretas quando a proporção difere), acrescenta uma faixa de silêncio aos clips sem áudio, concatena-os pela ordem definida e emite progresso percentual (0–100%) via WebSocket. |
| 7 | — | O worker gera o vídeo final em MP4 (H.264/AAC); o sistema associa-o ao projeto como novo recurso, registando a lista ordenada dos vídeos de origem (sourceVideoIds), transita a tarefa para completed, mantém o débito já reservado, sem nova cobrança e notifica o utilizador. |
| 8 | O utilizador consulta o projeto. | O sistema apresenta o vídeo final na lista de recursos; os vídeos de origem permanecem inalterados. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Remoção de um vídeo da seleção* | No passo 3, o utilizador remove um vídeo da linha temporal → O sistema atualiza a ordem e a duração total; se restar menos de dois vídeos, a confirmação fica bloqueada. |
| *FA2 – Repetição de um vídeo* | No passo 2, o utilizador adiciona o mesmo vídeo mais do que uma vez → O sistema aceita, tratando cada ocorrência como um clip distinto na linha temporal. |
| *FA3 – Cancelamento antes do início do processamento* | No passo 5, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA4 – Cancelamento durante o processamento* | No passo 6, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina os ficheiros temporários, devolve a quota reservada (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA5 – Utilizador com perfil Premium* | No passo 4, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária e aplica os limites alargados (até 50 vídeos e 60 minutos de duração total). |
| *FA6 – Junção como passo de uma cadeia* | A junção é configurada como passo de uma cadeia (UC-VID-013), com operações por clip antes da junção e operações sobre o resultado depois dela → A execução segue o UC-VID-013. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Menos de dois vídeos selecionados.* | No passo 4, o sistema bloqueia a confirmação (INSUFFICIENT_INPUTS). |
| *Número de vídeos acima do limite do perfil.* | No passo 4, o sistema rejeita a operação (TOO_MANY_INPUTS), indicando o máximo do perfil (10 Registado, 50 Premium). A tarefa não é criada. |
| *Duração total acima do limite do perfil.* | No passo 4, o sistema rejeita a operação (LIMIT_EXCEEDED), indicando a duração total e o limite (5 min Registado, 60 min Premium). A tarefa não é criada. |
| *Formato ou codec de algum vídeo não suportado.* | No passo 4, o sistema rejeita a operação (UNSUPPORTED_FORMAT), identificando o vídeo. A tarefa não é criada e a quota não é afetada. |
| *Quota diária esgotada (utilizador Registado).* | No passo 4, o sistema informa que o limite diário de 5 operações foi atingido (QUOTA_EXCEEDED). A tarefa não é criada. |
| *Falha de processamento durante a execução.* | No passo 6, se o worker falhar em qualquer clip → O sistema transita a tarefa para failed, elimina ficheiros temporários, estorna a quota reservada (se Registado) e notifica o utilizador. Nenhum resultado parcial é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um único vídeo MP4 com todos os clips pela ordem definida é persistido e associado ao projeto, com a lista ordenada dos vídeos de origem. Os vídeos de origem permanecem inalterados. A quota diária é consumida em 1 operação (apenas Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum resultado (nem parcial) é associado ao projeto, os ficheiros temporários são purgados, a quota reservada é devolvida e a tarefa transita para failed ou cancelled. Os vídeos de origem permanecem inalterados. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | Número de vídeos por junção: mínimo 2; máximo 10 (Registado) ou 50 (Premium) (DQ-014). |
| *RN3* | A duração total do resultado não pode exceder o limite de duração do perfil (5 min Registado, 60 min Premium). |
| *RN4* | Os clips são concatenados pela ordem definida pelo utilizador, com corte seco entre eles (sem transições). |
| *RN5* | O resultado adota a resolução e a taxa de fotogramas do primeiro clip; os restantes são normalizados, com barras pretas (_letterbox_) quando a proporção difere (DQ-018). |
| *RN6* | Os clips sem áudio recebem uma faixa de silêncio com a sua duração, para manter a sincronização. |
| *RN7* | O resultado é gerado em MP4 (H.264/AAC) (DQ-012). |
| *RN8* | Cada junção concluída consome exatamente 1 crédito da quota diária do utilizador Registado, independentemente do número de clips (DQ-013). Utilizadores Premium têm quota ilimitada. |
| *RN9* | A junção é atómica: em caso de falha ou cancelamento, nenhum resultado é gravado e o crédito reservado é devolvido (DQ-017). |
| *RN10* | O resultado regista a lista ordenada dos identificadores dos vídeos de origem (sourceVideoIds). |
| *RN11* | Os vídeos de origem nunca são alterados nem eliminados. |
| *RN12* | Apenas pode existir 1 tarefa de processamento de vídeo ativa em simultâneo por projeto. |
| *RN13* | A junção pode ser usada como passo de uma cadeia (UC-VID-013), no máximo uma vez por cadeia. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | O FFmpeg (filtros scale, pad, fps, anullsrc e concat) permite normalizar e concatenar clips heterogéneos. |
| *A2* | Os limites de número de vídeos são valores de MVP, configuráveis e a validar pela equipa. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Devem ser suportadas transições entre clips (por exemplo _fade_)? | Não no MVP (Q-ERS-006). A junção usa corte seco. |
| *Q2* | Pode o utilizador escolher a resolução do resultado, em vez de herdar a do primeiro clip? | Não diretamente. Pode encadear um redimensionamento após a junção (UC-VID-013). |


---

# UC-VID-013 — Encadear operações de edição num vídeo

A numeração e o conteúdo seguem os casos de uso do relatório de entrega.

## Cabeçalho

| Secção | Detalhes |
| --- | --- |
| *ID do Caso de Uso* | UC-VID-013 |
| *Nome* | Encadear operações de edição num vídeo |
| *Versão* | v2.1 |
| *Autor* | Equipa PictuRAS-27 |
| *Data* | 2026-10-23 |
| *Objetivo* | Permitir ao utilizador aplicar várias operações sequenciais a um vídeo — ou, com um passo de junção, a vários clips com operações próprias seguidas de operações sobre o resultado da junção — produzindo um único vídeo final numa única tarefa, sem alterar os originais. |
| *Âmbito* | Módulo de processamento de vídeo e gestão de recursos do PictuRAS |
| *Ator Principal* | Utilizador *Registado* ou *Premium* com sessão iniciada e acesso ao projeto |
| *Stakeholders e Interesses* | - *Utilizador Registado / Premium*: pretende montar uma edição completa (estilo *Movie Maker*) — e.g. cortar, ajustar cores e remover o áudio — sem gerir resultados intermédios.<br> - *Sistema PictuRAS*: deve validar a cadeia completa antes de a executar, executá-la como uma única tarefa e evitar perdas de qualidade por recodificações sucessivas.<br> - *Administrador*: pretende que o custo em quota reflita o número de operações e que a cadeia respeite os limites de infraestrutura. |
| *Pré-condições* | - O utilizador tem sessão iniciada (JWT válido).<br> - O utilizador tem permissão de edição sobre o projeto.<br> - O projeto contém pelo menos um vídeo num formato suportado (MP4, MOV ou AVI, segundo a matriz da DQ-002), dentro dos limites do perfil.<br> - O utilizador Registado tem quota diária disponível para o custo total da cadeia.<br> - Não existe outra tarefa de vídeo ativa no projeto. |
| *Trigger* | O utilizador seleciona um vídeo do projeto e escolhe a operação "Encadear Operações". |


## Fluxo principal

| Passo | Ação do Ator | Resposta do Sistema |
| --- | --- | --- |
| 1 | O utilizador acede ao projeto, seleciona um vídeo e escolhe a operação "Encadear Operações". | O sistema apresenta o editor de cadeia com o vídeo selecionado, a lista de operações elegíveis e o contador de custo em créditos (inicialmente 0). |
| 2 | O utilizador adiciona um passo e configura os respetivos parâmetros. | O sistema valida os parâmetros do passo com as mesmas regras da operação isolada, face às propriedades estimadas do resultado do passo anterior (e.g. duração após alteração de velocidade), e atualiza a lista de passos e o custo total. |
| 3 | O utilizador repete o passo 2 até concluir a sequência. | O sistema apresenta a cadeia completa, o número total de passos (máx. 10), o custo total em créditos e a duração estimada do resultado. |
| 4 | O utilizador confirma a cadeia. | O sistema revalida todos os passos e a estrutura da cadeia (conversão apenas no último passo, no máximo uma junção), verifica os limites do perfil e que a quota disponível cobre o custo total (se Registado) e cria uma única tarefa assíncrona. |
| 5 | — | O sistema reserva a totalidade dos créditos da cadeia (se Registado), coloca a tarefa na fila com estado queued e notifica o utilizador da aceitação. |
| 6 | — | O worker inicia o processamento (estado processing) e executa os passos pela ordem definida, com no máximo uma recodificação de vídeo, emitindo via WebSocket uma estimativa do passo corrente (k de N), derivada do progresso global e o progresso percentual global (0–100%). |
| 7 | — | O sistema armazena apenas o vídeo final (sem publicar resultados intermédios no projeto), associa-o ao projeto como novo recurso com os vídeos de origem e a descrição ordenada dos passos aplicados, transita a tarefa para completed, mantém os créditos já debitados na reserva, sem nova cobrança e notifica o utilizador. |
| 8 | O utilizador consulta o projeto. | O sistema apresenta o vídeo final na lista de recursos; os vídeos de origem permanecem inalterados. |


## Fluxos alternativos

| Fluxo | Descrição |
| --- | --- |
| *FA1 – Cadeia com junção de vários clips (composição)* | No passo 2, o utilizador adiciona um passo de junção → O sistema permite acrescentar outros vídeos do projeto como clips e definir, para cada clip, uma sub-cadeia própria (possivelmente vazia); os passos adicionados depois da junção aplicam-se ao resultado da junção. Exemplo: (V1 + filtro de cor) + (V2 + remover áudio) + (V3 + acelerar) → juntar → + marca de água = 1 vídeo final. Toda a composição é executada numa única tarefa. |
| *FA2 – Reordenar ou remover passos* | No passo 3, o utilizador reordena ou remove um passo → O sistema revalida os passos seguintes face às novas propriedades estimadas e atualiza o custo total. |
| *FA3 – Guardar e reutilizar a cadeia como predefinição* | No passo 3, o utilizador guarda a cadeia (sem a junção) com um nome → O sistema regista a predefinição na conta do utilizador, podendo ser carregada numa nova cadeia. |
| *FA4 – Cancelamento antes do início do processamento* | No passo 5, com a tarefa no estado queued, o utilizador solicita o cancelamento → O sistema marca a tarefa como cancelada e impede a execução da mensagem pendente, devolve todos os créditos reservados (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA5 – Cancelamento durante o processamento* | No passo 6, com a tarefa no estado processing, o utilizador solicita o cancelamento → O sistema interrompe o worker, elimina todos os ficheiros temporários, devolve todos os créditos reservados (se Registado), transita a tarefa para cancelled e notifica o utilizador. |
| *FA6 – Utilizador com perfil Premium* | No passo 4, o utilizador tem perfil Premium → O sistema não verifica nem debita quota diária; o limite de 10 passos mantém-se. |
| *FA7 – Utilizador abandona a sessão durante o processamento* | No passo 6, o utilizador fecha o browser → O worker continua o processamento em background e o resultado fica disponível na próxima sessão. |


## Exceções

| Condição | Comportamento do Sistema |
| --- | --- |
| *Parâmetros inválidos num passo.* | No passo 2 ou 4, o sistema rejeita o passo (INVALID_STEP_PARAMS), indicando o índice do passo e o campo incorreto. A tarefa não é criada. |
| *Estrutura de cadeia inválida (conversão que não é o último passo, mais de uma junção ou cadeia vazia).* | No passo 4, o sistema rejeita a cadeia (INVALID_CHAIN), indicando a regra violada. A tarefa não é criada. |
| *Cadeia com mais de 10 passos.* | No passo 3, o sistema impede a adição de novos passos (CHAIN_TOO_LONG). |
| *Quota disponível inferior ao custo total da cadeia (utilizador Registado).* | No passo 4, o sistema informa o custo total e o saldo disponível (QUOTA_EXCEEDED). A tarefa não é criada e nenhum crédito é reservado. |
| *Duração ou tamanho de algum clip, ou duração estimada do resultado, acima do limite do perfil.* | No passo 4, o sistema rejeita a cadeia (LIMIT_EXCEEDED). A tarefa não é criada. |
| *Formato ou codec de algum vídeo não suportado.* | No passo 4, o sistema rejeita a cadeia (UNSUPPORTED_FORMAT), identificando o vídeo. A tarefa não é criada. |
| *Falha num qualquer passo durante a execução.* | No passo 6, o sistema interrompe a cadeia, transita a tarefa para failed, elimina todos os ficheiros temporários, estorna todos os créditos reservados (se Registado) e notifica o utilizador indicando o passo que falhou. Nenhum resultado (nem intermédio) é gravado no projeto. |


## Pós-condições

| Tipo | Resultado |
| --- | --- |
| *Garantia de Sucesso* | Um único vídeo final, resultante da aplicação de todos os passos pela ordem definida, é persistido e associado ao projeto, com os vídeos de origem e a descrição dos passos. Nenhum resultado intermédio é gravado. Os vídeos de origem permanecem inalterados. A quota diária é consumida em N créditos, sendo N o número total de passos (apenas Registado). A tarefa transita para completed. |
| *Garantia Mínima* | Em caso de erro ou cancelamento, nenhum resultado é associado ao projeto (política tudo-ou-nada), os ficheiros temporários são purgados, todos os créditos reservados são devolvidos e a tarefa transita para failed ou cancelled. Os vídeos de origem permanecem inalterados. |


## Regras de negócio e restrições

| ID | Regra |
| --- | --- |
| *RN1* | Apenas utilizadores Registados e Premium com sessão iniciada e permissão de edição no projeto podem executar a operação. |
| *RN2* | Operações elegíveis como passo: recorte, remoção de áudio, alteração de velocidade, marca de água, ajuste de propriedades visuais, filtro, redimensionamento, rotação/espelho, conversão de formato e junção. |
| *RN3* | A conversão de formato só pode ser o último passo da cadeia; a junção pode ocorrer no máximo uma vez (DQ-016). |
| *RN4* | Com um passo de junção, cada clip pode ter uma sub-cadeia própria antes da junção, e os passos seguintes aplicam-se ao resultado da junção. |
| *RN5* | Uma cadeia tem no máximo 10 passos no total, contando os passos das sub-cadeias, a junção e os passos finais (DQ-014). |
| *RN6* | Cada passo é validado com as mesmas regras da operação isolada, face às propriedades estimadas à saída do passo anterior. |
| *RN7* | O custo de uma cadeia é de N créditos, sendo N o número total de passos (a junção conta 1) (DQ-013). Para o utilizador Registado, a quota diária de 5 operações limita, na prática, a cadeia a 5 passos por dia (DQ-024). Utilizadores Premium têm quota ilimitada. |
| *RN8* | A totalidade dos créditos é verificada e reservada antes da aceitação da tarefa, mantida na conclusão sem novo débito e devolvida integralmente em caso de falha ou cancelamento. |
| *RN9* | A cadeia completa é executada como uma única tarefa assíncrona, que conta como 1 tarefa ativa no projeto (DQ-015). |
| *RN10* | Apenas o vídeo final é gravado no projeto; os resultados intermédios são temporários e purgados no fim da tarefa. |
| *RN11* | A execução é atómica: a falha de qualquer passo invalida a cadeia inteira (DQ-017). |
| *RN12* | O vídeo de saída sofre no máximo uma recodificação de vídeo, independentemente do número de passos (REQ-VID-NFR-012). |
| *RN13* | O resultado é gerado em MP4 (H.264/AAC), salvo quando o último passo é uma conversão de formato (DQ-012). |
| *RN14* | Os vídeos de origem nunca são alterados nem eliminados. |


## Assunções

| ID | Assunção |
| --- | --- |
| *A1* | As operações de vídeo podem ser compostas num único *filtergraph* FFmpeg, de modo a recodificar o vídeo uma única vez. |
| *A2* | As propriedades estimadas à saída de cada passo (duração, resolução, presença de áudio) são calculáveis sem processar o vídeo. |
| *A3* | A quota diária é reposta diariamente às 00:00 UTC. |


## Questões em aberto e resolução

| ID | Questão | Resolução / Decisão |
| --- | --- | --- |
| *Q1* | Deve o utilizador Registado poder executar cadeias com mais passos do que a sua quota diária? | Não (DQ-024). O perfil Registado fica limitado a 5 passos por dia; a cadeia é rejeitada e o sistema sugere a redução de passos ou o upgrade para Premium. |
| *Q2* | Podem os resultados intermédios ser guardados no projeto a pedido? | Não no MVP. Para obter um resultado intermédio, o utilizador executa essa parte como cadeia separada. |
