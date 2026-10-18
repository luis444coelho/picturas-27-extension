# Caso de Uso: UC-VID-000 — Carregar e visualizar um vídeo no projeto
### PictuRAS (v27.1) · Fase 1: Suporte a Vídeo Digital

---

## 2.1 Cabeçalho

| **Secção** | **Detalhes** |
|------------|--------------|
| **ID do Caso de Uso** | UC-VID-000 |
| **Nome** | Carregar e visualizar um vídeo no projeto |
| **Versão** | v1.3 |
| **Autor** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Objetivo** | Permitir ao utilizador autenticado carregar um ficheiro de vídeo digital para o seu projeto, validando o contentor, codecs e limites do perfil, persistindo os respetivos metadados técnicos e disponibilizando-o na galeria e no reprodutor integrado para visualização e posterior manipulação. |
| **Âmbito** | Módulo de gestão de projetos, armazenamento multimédia e visualização do PictuRAS |
| **Ator Principal** | Utilizador **Registado** ou **Premium** com sessão iniciada e permissão de edição no projeto |
| **Stakeholders e Interesses** | - **Utilizador Registado / Premium**: pretende armazenar os seus vídeos na plataforma e inspecioná-los visualmente com controlos de reprodução sem que o upload debite a sua quota diária de operações.<br>- **Sistema PictuRAS**: deve validar a conformidade de contentor e codecs (MP4, MOV ou AVI, segundo a matriz da DQ-002), extrair metadados técnicos com precisão e armazenar os ficheiros de grande porte de forma segura no SeaweedFS/S3.<br>- **Equipa de Infraestrutura / DevOps**: pretende assegurar que os uploads respeitam os tetos de tamanho e duração do perfil, impedindo o esgotamento do disco por ficheiros corrompidos ou não suportados. |
| **Pré-condições** | - O utilizador tem sessão iniciada (token JWT válido).<br>- O utilizador acede a um projeto sobre o qual possui permissão de proprietário ou de edição.<br>- O dispositivo do utilizador dispõe de acesso a um ficheiro de vídeo local. |
| **Trigger** | O utilizador acede ao projeto e seleciona a opção "Carregar Vídeo" ou arrasta um ficheiro de vídeo para a área de carregamento do projeto. |

---

## 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador abre o projeto e seleciona a opção de carregar vídeo. | O sistema apresenta a interface de upload indicando os limites de duração e dimensão do perfil ativo e os formatos admitidos (MP4, MOV e AVI). |
| 2 | O utilizador seleciona o ficheiro de vídeo do sistema de ficheiros local (ou arrasta-o para a zona de largada). | O sistema valida no cliente a extensão (.mp4, .mov ou .avi) e o tipo MIME (video/mp4, video/quicktime ou video/x-msvideo) e apresenta o nome e tamanho do ficheiro selecionado. |
| 3 | O utilizador confirma o carregamento do ficheiro. | O sistema inicia a transferência do ficheiro em streaming para o servidor, apresentando uma barra de progresso percentual (0% a 100%). |
| 4 | — | O sistema recebe o ficheiro, valida que o tamanho não excede o teto do perfil (≤ 200 MB Registado, ≤ 2 GB Premium) e armazena o objeto no SeaweedFS/S3 com identificador UUID único. |
| 5 | — | O sistema inspeciona os fluxos do contentor, valida que os codecs são admitidos para o contentor (H.264/AAC em MP4 e MOV; H.264 ou MPEG-4 Part 2 / AAC ou MP3 em AVI), verifica que a duração respeita o perfil (≤ 5 min Registado, ≤ 60 min Premium) e extrai metadados técnicos (duração, resolução espacial, taxa de fotogramas, bitrate e streams). |
| 6 | — | O sistema gera automaticamente uma miniatura (thumbnail) do instante 00:00:01 do vídeo em formato JPEG e regista o novo recurso de vídeo na base de dados (MongoDB) associado ao projeto, sem debitar quota diária. |
| 7 | — | O sistema conclui o carregamento e apresenta o novo vídeo na galeria de recursos do projeto com a miniatura gerada, nome do ficheiro e duração formatada. |
| 8 | O utilizador seleciona o vídeo na galeria do projeto. | O sistema abre o reprodutor multimédia integrado (*player*), permitindo a reprodução com controlos (play, pausa, seek, volume, ecrã inteiro) e disponibiliza as operações de manipulação aplicáveis (recortar, remover áudio, alterar velocidade, marca de água, extrair fotogramas, ajustar propriedades visuais, aplicar filtro, redimensionar, rodar/espelhar, converter formato, juntar vídeos, encadear operações e processar em lote), bem como descarregar o vídeo e consultar as suas informações. |

---

## 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Carregamento por arrastamento (*drag-and-drop*)** | No passo 2, o utilizador arrasta diretamente o ficheiro para a área do projeto → O sistema deteta o evento, valida o tipo MIME e avança diretamente para a confirmação no passo 3. |
| **FA2 – Cancelamento antes da conclusão da transferência** | Durante o passo 3, o utilizador clica em "Cancelar Upload" → O sistema interrompe a transferência HTTP, purga os dados parciais temporários e mantém o projeto inalterado. |
| **FA3 – Utilizador com perfil Premium** | Nos passos 4 e 5, o sistema aplica os limites alargados de subscrição Premium: ficheiros até 2 GB e duração até 60 minutos. |
| **FA4 – Carregar vídeo sem stream de áudio** | No passo 5, o sistema deteta que o MP4 contém apenas stream H.264 (vídeo silencioso de origem) → O sistema aceita o ficheiro, regista a ausência de áudio nos metadados e conclui o upload normalmente. |
| **FA5 – Carregar vídeo em MOV ou AVI** | No passo 5, o sistema deteta um contentor MOV ou AVI com codecs admitidos → O sistema aceita o ficheiro, preserva-o no formato original e, no passo 6, gera adicionalmente uma cópia de pré-visualização em MP4 (H.264/AAC), usada exclusivamente pelo reprodutor integrado. |

---

## 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **O formato do ficheiro ou tipo MIME não é suportado (não é MP4, MOV nem AVI).** | O sistema bloqueia a submissão, informa que apenas ficheiros MP4, MOV e AVI são suportados e não inicia a transferência. |
| **O tamanho do ficheiro excede o limite do perfil (200 MB para Registado, 2 GB para Premium).** | O sistema rejeita o upload, informa o utilizador do limite excedido e, se aplicável, sugere o upgrade para Premium. Nenhum ficheiro é gravado. |
| **Os codecs internos do vídeo não são admitidos para o contentor (matriz da DQ-002).** | O sistema descarta o ficheiro do storage temporário, informa o utilizador de que os codecs são incompatíveis e solicita a conversão prévia para um codec admitido (e.g. H.264/AAC). |
| **A duração do vídeo excede o limite do perfil (5 min para Registado, 60 min para Premium).** | O sistema remove o ficheiro, emite mensagem a indicar o excesso de duração do perfil e não regista o vídeo no projeto. |
| **O ficheiro de vídeo encontra-se corrompido ou com cabeçalhos ilegíveis.** | O sistema falha a inspeção de metadados, elimina o ficheiro temporário e notifica o utilizador de que o ficheiro está corrompido. |
| **Ocorre falha de rede ou interrupção durante a transferência.** | O sistema aborta o upload, limpa os fragmentos no storage e notifica o utilizador da perda de ligação, permitindo nova tentativa. |

---

## 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | O ficheiro de vídeo está gravado no storage de objetos, os seus metadados técnicos e miniatura estão persistidos na base de dados associados ao projeto, o recurso surge disponível na galeria do projeto e pode ser visualizado no reprodutor com acesso imediato às ferramentas de manipulação. A quota diária de operações não é debitada. |
| **Garantia Mínima** | Em caso de erro ou cancelamento, nenhum ficheiro corrompido ou parcial permanece no storage, nenhum registo órfão é gravado no MongoDB e a integridade prévia do projeto é rigorosamente mantida. |

---

## 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | A funcionalidade de carregamento de vídeo está disponível para utilizadores Registados e Premium autenticados. Utilizadores Anónimos não têm acesso. |
| **RN2** | O carregamento de vídeo não consome créditos da quota diária de operações (a quota de 5 ops/dia para Registado aplica-se exclusivamente a tarefas de manipulação/processamento). |
| **RN3** | O ficheiro de entrada deve estar num dos contentores MP4, MOV ou AVI, com os codecs admitidos para o contentor: H.264 (vídeo) e AAC (áudio) em MP4 e MOV; H.264 ou MPEG-4 Part 2 (vídeo) e AAC ou MP3 (áudio) em AVI; o áudio é opcional. Outros contentores e codecs são rejeitados (DQ-002). |
| **RN4** | Limites de upload por perfil: Registado — tamanho ≤ 200 MB e duração ≤ 5 minutos; Premium — tamanho ≤ 2 GB e duração ≤ 60 minutos. |
| **RN5** | O sistema gera automaticamente uma imagem de miniatura em JPEG a partir do instante 00:00:01 do vídeo para representação no projeto. |
| **RN6** | O reprodutor de vídeo integrado deve fornecer controlos de reprodução, pausa, navegação temporal (*seek*), ajuste de volume e modo de ecrã inteiro. |
| **RN7** | O ficheiro original carregado é estritamente imutável: as operações subsequentes de transformação geram sempre novos recursos sem alterar o original. |
| **RN8** | Os vídeos originais em MOV ou AVI recebem uma cópia de pré-visualização em MP4 (H.264/AAC), usada exclusivamente pelo reprodutor integrado; as operações e o descarregamento usam sempre o ficheiro original (DQ-012). |

---

## 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | O serviço de armazenamento de objetos (SeaweedFS/S3) dispõe de capacidade suficiente para alojar ficheiros de vídeo de até 2 GB. |
| **A2** | A extração de metadados e a geração da miniatura são realizadas através de ferramentas especializadas (FFprobe/FFmpeg) no backend Node.js / Python de forma rápida durante a ingestão. |
| **A3** | O navegador do utilizador possui capacidade nativa de descodificação e reprodução de vídeo MP4 (H.264/AAC) através da tag HTML5 `<video>`. |

---

## 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Deve ser suportado o carregamento de vídeos através de URL externo (e.g. YouTube ou link direto HTTP) além do upload de ficheiro local? | Rejeitada para o MVP. O upload faz-se estritamente através de ficheiro local para controlo rigoroso de segurança e integridade de rede. |
| **Q2** | Deve ser permitida a substituição direta de um ficheiro de vídeo existente mantendo o mesmo identificador de recurso? | Não permitida. O original é imutável para assegurar a rastreabilidade do projeto. |

