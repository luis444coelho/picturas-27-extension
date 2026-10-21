# Exercício 1 — Casos de Uso
### Fase 1: Suporte a Vídeo no PictuRAS · Índice e Especificações Modulares

---

## 0. Identificação

| **Campo** | **Valor** |
|-----------|-----------|
| **Grupo / Equipa** | Grupo 27 |
| **Autores** | Equipa PictuRAS-27 |
| **Data** | 2026-10-21 |
| **Versão do documento** | v1.5 (Alinhamento com o ADD v1.1); v1.4 (Novos casos de uso UC-VID-006 a UC-VID-015) |
| **Unidade Curricular** | Requisitos e Arquiteturas de Software — MEI, Universidade do Minho |

---

## 1. Funcionalidades de vídeo escolhidas

| **ID** | **Funcionalidade** | **Perfil(s) abrangido(s)** | **Ficheiro de Especificação** |
|--------|--------------------|---------------------------|-------------------------------|
| **UC-VID-000** | Carregamento, ingestão e visualização de vídeo no projeto *(Fundacional)* | Registado, Premium | [UC-VID-000.md](use-cases/UC-VID-000.md) |
| **UC-VID-001** | Recorte temporal de um vídeo (*trim*) | Registado, Premium | [UC-VID-001.md](use-cases/UC-VID-001.md) |
| **UC-VID-002** | Remoção do áudio de um vídeo | Registado, Premium | [UC-VID-002.md](use-cases/UC-VID-002.md) |
| **UC-VID-003** | Alteração da velocidade de reprodução de um vídeo | Registado, Premium | [UC-VID-003.md](use-cases/UC-VID-003.md) |
| **UC-VID-004** | Aplicação de marca de água a um vídeo | Registado, Premium | [UC-VID-004.md](use-cases/UC-VID-004.md) |
| **UC-VID-005** | Extração de fotogramas de um vídeo para o projeto | Registado, Premium | [UC-VID-005.md](use-cases/UC-VID-005.md) |
| **UC-VID-006** | Descarregamento de um vídeo do projeto | Registado, Premium | [UC-VID-006.md](use-cases/UC-VID-006.md) |
| **UC-VID-007** | Consulta das informações de um vídeo | Registado, Premium | [UC-VID-007.md](use-cases/UC-VID-007.md) |
| **UC-VID-008** | Ajuste das propriedades visuais (brilho, contraste e saturação) de um vídeo | Registado, Premium | [UC-VID-008.md](use-cases/UC-VID-008.md) |
| **UC-VID-009** | Aplicação de filtros visuais predefinidos a um vídeo | Registado, Premium | [UC-VID-009.md](use-cases/UC-VID-009.md) |
| **UC-VID-010** | Redimensionamento de um vídeo | Registado, Premium | [UC-VID-010.md](use-cases/UC-VID-010.md) |
| **UC-VID-011** | Rotação e espelho de um vídeo | Registado, Premium | [UC-VID-011.md](use-cases/UC-VID-011.md) |
| **UC-VID-012** | Conversão do formato de um vídeo | Registado, Premium | [UC-VID-012.md](use-cases/UC-VID-012.md) |
| **UC-VID-013** | Junção de vídeos | Registado, Premium | [UC-VID-013.md](use-cases/UC-VID-013.md) |
| **UC-VID-014** | Encadeamento de operações de edição num vídeo | Registado, Premium | [UC-VID-014.md](use-cases/UC-VID-014.md) |
| **UC-VID-015** | Processamento de vários vídeos em lote | Registado, Premium | [UC-VID-015.md](use-cases/UC-VID-015.md) |

**Justificação no contexto do MVP:**

Dado que o PictuRAS é originalmente uma plataforma concebida em exclusivo para o processamento de imagens estáticas, o **suporte nativo a vídeo digital exige como pilar fundacional o caso de uso de carregamento, validação e visualização de vídeo no projeto ([UC-VID-000](use-cases/UC-VID-000.md))**. Sem a capacidade de transferir, armazenar de forma segura, extrair metadados técnicos e reproduzir vídeos num leitor integrado, nenhuma das operações de transformação subsequentes seria viável.

Sobre este alicerce de ingestão, as cinco operações de manipulação ([UC-VID-001](use-cases/UC-VID-001.md) a [UC-VID-005](use-cases/UC-VID-005.md)) foram escolhidas por cobrirem o conjunto mínimo e suficiente para validar a extensão do PictuRAS para vídeo: recorte, remoção de áudio e velocidade validam a manipulação temporal e estrutural; a marca de água valida a sobreposição gráfica consistente fotograma a fotograma; e a extração de fotogramas une os domínios do vídeo e da imagem, alimentando o catálogo de ferramentas já existente. Em conjunto, o sistema exercita o ciclo de vida multimédia completo — ingestão, armazenamento, inspeção visual, processamento assíncrono com progresso e cancelamento, quotas por perfil e persistência não destrutiva. O acesso é reservado a utilizadores Registados e Premium porque os recursos ficam guardados em projetos autenticados, prevenindo abusos de infraestrutura.

As dez funcionalidades acrescentadas na v1.4 ([UC-VID-006](use-cases/UC-VID-006.md) a [UC-VID-015](use-cases/UC-VID-015.md)) completam o MVP como editor de vídeo: o descarregamento e a consulta de informações fecham o ciclo de vida do recurso (obter o resultado e conhecer as suas características); os ajustes, os filtros, o redimensionamento, a rotação/espelho e a conversão de formato estendem ao vídeo as ferramentas que o PictuRAS já oferece para imagens; e a junção, o encadeamento e o lote validam a composição de operações — incluindo o cenário *Movie Maker* de editar vários clips, juntá-los e aplicar operações ao resultado numa única tarefa — com uma política de quota proporcional ao trabalho pedido.

---

## 2. Catálogo de Casos de Uso (Ficheiros Individuais)

Para assegurar uma leitura modular e permitir a integração direta com o template do relatório (e.g. Typst `#include "casos-uso/UC-VID-xxx.typ"`), cada caso de uso encontra-se integralmente especificado no seu próprio ficheiro:

### 📹 [UC-VID-000: Carregar e visualizar um vídeo no projeto](use-cases/UC-VID-000.md)
- **Objetivo**: Permitir a transferência de ficheiros MP4, MOV ou AVI (matriz de codecs da DQ-002, com cópia de pré-visualização MP4 para MOV/AVI e para MP4 não reproduzíveis nos navegadores), validação de contentores e codecs com FFprobe, gravação no storage SeaweedFS/S3 com UUID, extração de metadados técnicos, geração de miniatura JPEG e visualização no reprodutor integrado com atalhos para as ferramentas de edição.
- **Atores**: Utilizador Registado e Premium (autenticados).
- **Especificação completa**: [Ver UC-VID-000.md](use-cases/UC-VID-000.md)

---

### ✂️ [UC-VID-001: Recortar temporalmente um vídeo (*trim*)](use-cases/UC-VID-001.md)
- **Objetivo**: Selecionar um intervalo temporal $[t_{início}, t_{fim}]$ válido com suporte a *scrubbing* e *loop preview*, produzindo um novo ficheiro MP4 com a duração recortada sem alterar o ficheiro original.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-001.md](use-cases/UC-VID-001.md)

---

### 🔇 [UC-VID-002: Remover o áudio de um vídeo](use-cases/UC-VID-002.md)
- **Objetivo**: Suprimir todas as streams de áudio de um vídeo, gerando um ficheiro puramente visual (*video-only*) através de cópia direta de stream (*stream copy* sem recodificação visual).
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-002.md](use-cases/UC-VID-002.md)

---

### ⚡ [UC-VID-003: Alterar a velocidade de reprodução de um vídeo](use-cases/UC-VID-003.md)
- **Objetivo**: Ajustar a cadência temporal do vídeo com um fator multiplicador (0.25× a 4.0×), recalculando a duração do vídeo e sincronizando o áudio através de filtros de cadência sem distorção excessiva de pitch.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-003.md](use-cases/UC-VID-003.md)

---

### 🔏 [UC-VID-004: Aplicar marca de água a um vídeo](use-cases/UC-VID-004.md)
- **Objetivo**: Sobrepor texto ou imagem com transparência alfa com posição, escala (5–50%) e opacidade (10–100%) configuráveis de forma invariante em todos os fotogramas, com pré-visualização estática imediata e progresso numérico contínuo via WebSocket.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-004.md](use-cases/UC-VID-004.md)

---

### 🖼️ [UC-VID-005: Extrair fotogramas de um vídeo para o projeto](use-cases/UC-VID-005.md)
- **Objetivo**: Amostrar fotogramas discretos num intervalo semiaberto $[t_{\text{início}}, t_{\text{fim}}[$ com passo regular $N \ge 1$s nos formatos JPEG ou PNG, adicionando-os de forma atómica (tudo-ou-nada) à galeria de imagens do projeto com rastreabilidade de proveniência.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-005.md](use-cases/UC-VID-005.md)

---

### ⬇️ [UC-VID-006: Descarregar um vídeo do projeto](use-cases/UC-VID-006.md)
- **Objetivo**: Descarregar para o dispositivo qualquer vídeo concluído do projeto (original ou resultante), no formato armazenado, através de URL assinado temporário com retoma de transferência, sem consumo de quota.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-006.md](use-cases/UC-VID-006.md)

---

### ℹ️ [UC-VID-007: Consultar as informações de um vídeo](use-cases/UC-VID-007.md)
- **Objetivo**: Consultar a duração, a resolução, o formato (contentor e codecs), o tamanho e a taxa de fotogramas de um vídeo a partir dos metadados persistidos, sem tarefa nem quota, incluindo a proveniência dos vídeos resultantes.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-007.md](use-cases/UC-VID-007.md)

---

### 🎨 [UC-VID-008: Ajustar as propriedades visuais de um vídeo](use-cases/UC-VID-008.md)
- **Objetivo**: Ajustar o brilho, o contraste e a saturação com fatores de 0.0 a 2.0 (neutro 1.0), com pré-visualização estática, aplicados de forma uniforme a todos os fotogramas.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-008.md](use-cases/UC-VID-008.md)

---

### 🎞️ [UC-VID-009: Aplicar um filtro visual a um vídeo](use-cases/UC-VID-009.md)
- **Objetivo**: Aplicar um filtro do catálogo fechado (Preto e Branco, Sépia, Negativo, Vintage, Frio e Quente) a todos os fotogramas, com miniaturas de exemplo e pré-visualização estática.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-009.md](use-cases/UC-VID-009.md)

---

### 📐 [UC-VID-010: Redimensionar um vídeo](use-cases/UC-VID-010.md)
- **Objetivo**: Alterar a resolução de saída com bloqueio de proporção, predefinições (1080p, 720p, 480p, 360p), dimensões pares ≥ 128 px e tetos por perfil (1920×1080 Registado, 3840×2160 Premium).
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-010.md](use-cases/UC-VID-010.md)

---

### 🔄 [UC-VID-011: Rodar e espelhar um vídeo](use-cases/UC-VID-011.md)
- **Objetivo**: Rodar no sentido horário em 90°, 180° ou 270° e/ou espelhar na horizontal ou na vertical numa única operação, com troca de largura e altura nas rotações de 90°/270°.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-011.md](use-cases/UC-VID-011.md)

---

### 🔁 [UC-VID-012: Converter o formato de um vídeo](use-cases/UC-VID-012.md)
- **Objetivo**: Converter entre MP4, MOV e AVI com codecs fixos por formato, cópia direta de streams quando possível e cópia de pré-visualização MP4 para os resultados MOV/AVI e para os MP4 não reproduzíveis nos navegadores.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-012.md](use-cases/UC-VID-012.md)

---

### 🔗 [UC-VID-013: Juntar vídeos](use-cases/UC-VID-013.md)
- **Objetivo**: Concatenar 2 a 10 (Registado) ou 50 (Premium) vídeos pela ordem definida numa linha temporal, com normalização para o primeiro clip, silêncio nos clips sem áudio e registo das origens.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-013.md](use-cases/UC-VID-013.md)

---

### ⛓️ [UC-VID-014: Encadear operações de edição num vídeo](use-cases/UC-VID-014.md)
- **Objetivo**: Aplicar até 10 operações sequenciais numa única tarefa e num único vídeo final, incluindo a composição com junção (sub-cadeias por clip → junção → cadeia sobre o resultado), com custo de N créditos e execução atómica.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-014.md](use-cases/UC-VID-014.md)

---

### 📦 [UC-VID-015: Processar vários vídeos em lote](use-cases/UC-VID-015.md)
- **Objetivo**: Aplicar a mesma operação ou cadeia (sem junção) a vários vídeos, com pré-validação por vídeo, processamento sequencial como uma tarefa, resultados independentes, quota pelos vídeos concluídos e descarregamento em ZIP.
- **Atores**: Utilizador Registado e Premium.
- **Especificação completa**: [Ver UC-VID-015.md](use-cases/UC-VID-015.md)

---

## 3. Utilização de agentes de IA

| **Ferramenta / Skill** | **Tarefa apoiada** | **Validação realizada pela equipa** |
|------------------------|--------------------|--------------------------------------|
| **ChatGPT / Copilot** | Apoio na revisão da linguagem e na normalização dos casos de uso, com foco na consistência terminológica, na redução de ambiguidades e na deteção de lacunas entre fluxos, exceções e regras de negócio. | A equipa verificou que todas as descrições respeitam o modelo de requisitos do PictuRAS, mantêm a origem documental, incorporam as decisões D-VID-001 a D-VID-010 e evitam decisões de implementação não aprovadas. |
| **Antigravity (AI-DLC Inception Agent)** | Consolidação, decomposição atómica e modularização dos casos de uso e requisitos em ficheiros individuais dedicados, assegurando rastreabilidade bidirecional com a ERS e conformidade com o template Typst da Fase 1. | A equipa verificou a rastreabilidade entre casos de uso, decisões e requisitos e confirmou que os valores quantitativos correspondem às decisões contratuais do MVP. |
| **Claude Code (specsmd Inception Agent)** | Especificação dos novos requisitos RF1 a RF10 (as dez funcionalidades novas pedidas no enunciado da Fase 1): casos de uso UC-VID-006 a UC-VID-015, ficheiros de requisitos por área, requisitos comuns e não funcionais derivados, decisões DQ-012 a DQ-025, questões Q-ERS-004 a Q-ERS-009, alinhamento dos UC-VID-001 a UC-VID-005 com a matriz de formatos e atualização dos índices e da matriz de rastreabilidade. | A equipa aprovou previamente o plano de alterações (âmbito do MVP, matriz de formatos, política de quota e suposições); a revisão final dos artefactos gerados é da responsabilidade da equipa. |

---

## ✅ Lista de Verificação

- [x] Secção 0 preenchida com identificação correta do grupo e versão v1.5.
- [x] Secção 1 com tabela das dezasseis funcionalidades (UC-VID-000 a UC-VID-015), perfis e justificação no contexto do MVP.
- [x] Casos de uso modularizados em ficheiros individuais na diretoria `docs/use-cases/`.
- [x] Cada caso de uso com cabeçalho, fluxo principal, fluxos alternativos, exceções específicas de vídeo, pós-condições, regras de negócio e assunções.
- [x] Limites numéricos aplicados: Registado $\le 5$ min / $\le 200$ MB / $\le 50$ frames; Premium $\le 60$ min / $\le 2$ GB / $\le 500$ frames.
- [x] Quota: 1 crédito por operação (isolada ou junção); N créditos por cadeia de N passos; lote = custo × vídeos concluídos; Registado 5 créditos/dia (cadeias até 5 passos, DQ-025); Premium sem quota; devolução em falha/cancelamento; upload, descarregamento e consulta de informações sem consumo de quota.
- [x] Processamento assíncrono com estados `queued → processing → completed | failed | cancelled`.
- [x] Utilização de agentes de IA documentada.
