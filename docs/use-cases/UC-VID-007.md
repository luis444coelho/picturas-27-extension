# Caso de Uso: UC-VID-007 — Consultar as informações de um vídeo
### PictuRAS (v27.1) · Fase 1: Suporte a Vídeo Digital

---

## 2.1 Cabeçalho

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

---

## 2.2 Fluxo Principal

| **Passo** | **Ação do Ator** | **Resposta do Sistema** |
|-----------|------------------|-------------------------|
| 1 | O utilizador seleciona um vídeo na galeria do projeto e escolhe a opção "Informações". | O sistema verifica a permissão de leitura e obtém os metadados técnicos persistidos do recurso, sem criar tarefa e sem debitar quota. |
| 2 | — | O sistema apresenta um painel com a duração (`hh:mm:ss.mmm`), a resolução (largura × altura em px), o formato (contentor e codecs de vídeo e de áudio), o tamanho do ficheiro (MB ou GB, com 2 casas decimais) e a taxa de fotogramas (fps, com 2 casas decimais). |
| 3 | O utilizador fecha o painel. | O sistema regressa à vista anterior; o recurso permanece inalterado. |

---

## 2.3 Fluxos Alternativos

| **Fluxo** | **Descrição** |
|-----------|---------------|
| **FA1 – Consulta de um vídeo resultante** | No passo 2, se o vídeo resultar de uma operação, cadeia ou junção → O sistema apresenta adicionalmente a proveniência (vídeo(s) de origem) e a descrição da(s) operação(ões) aplicada(s). |
| **FA2 – Consulta de um original em MOV ou AVI** | No passo 2, o sistema apresenta o formato e os codecs do ficheiro original e não os da cópia de pré-visualização MP4. |
| **FA3 – Consulta a partir do reprodutor integrado** | No passo 1, o utilizador abre o painel nos controlos do reprodutor → O fluxo continua no passo 2. |

---

## 2.4 Exceções

| **Condição** | **Comportamento do Sistema** |
|--------------|------------------------------|
| **Algum metadado não está disponível.** | No passo 2, o sistema apresenta o campo como "Indisponível" e regista o aviso (`METADATA_UNAVAILABLE`) nos logs com o `correlationId`. |
| **O utilizador não tem permissão sobre o projeto.** | No passo 1, o sistema rejeita o pedido com HTTP 403 Forbidden. |
| **O recurso ainda está em processamento.** | No passo 1, o sistema apresenta apenas o estado da tarefa (`queued` ou `processing`) e informa que as informações técnicas estarão disponíveis após a conclusão. |

---

## 2.5 Pós-condições

| **Tipo** | **Resultado** |
|----------|---------------|
| **Garantia de Sucesso** | O utilizador visualiza as informações técnicas do vídeo. Nenhuma tarefa é criada, a quota não é debitada e o recurso permanece inalterado. |
| **Garantia Mínima** | Em caso de erro, o projeto e o recurso permanecem inalterados e a quota não é afetada. |

---

## 2.6 Regras de Negócio e Restrições

| **ID** | **Regra** |
|--------|-----------|
| **RN1** | A consulta está disponível para utilizadores Registados e Premium com permissão de leitura, edição ou de proprietário no projeto. |
| **RN2** | A consulta não cria tarefas de processamento e não consome créditos da quota diária. |
| **RN3** | As informações são obtidas dos metadados persistidos na ingestão (UC-VID-000) ou na criação do recurso resultante, sem nova análise do ficheiro. |
| **RN4** | Unidades de apresentação: duração em `hh:mm:ss.mmm`; resolução em px; tamanho em MB (< 1 GB) ou GB; taxa de fotogramas em fps com 2 casas decimais. |
| **RN5** | A consulta é exclusivamente de leitura. |

---

## 2.7 Assunções

| **ID** | **Assunção** |
|--------|--------------|
| **A1** | Os metadados técnicos de todos os recursos de vídeo foram extraídos com FFprobe e persistidos no MongoDB no momento da sua criação. |

---

## 2.8 Questões em Aberto

| **ID** | **Questão** | **Resolução / Decisão** |
|--------|-------------|-------------------------|
| **Q1** | Devem ser apresentados metadados avançados (bitrate, perfil H.264, canais de áudio)? | Não no MVP. O painel apresenta apenas os cinco atributos do requisito; os metadados avançados ficam para a Fase 2. |
