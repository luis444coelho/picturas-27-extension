# Exercício 1 — Casos de Uso
### Fase 1: Suporte a Vídeo no PictuRAS · Índice e Especificações Modulares

---

## 0. Identificação

| **Campo** | **Valor** |
|-----------|-----------|
| **Grupo / Equipa** | Grupo 27 |
| **Autores** | Equipa PictuRAS-27 |
| **Data** | 2026-10-18 |
| **Versão do documento** | v1.3 (Modularização dos Casos de Uso em ficheiros individuais) |
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

**Justificação no contexto do MVP:**

Dado que o PictuRAS é originalmente uma plataforma concebida em exclusivo para o processamento de imagens estáticas, o **suporte nativo a vídeo digital exige como pilar fundacional o caso de uso de carregamento, validação e visualização de vídeo no projeto ([UC-VID-000](use-cases/UC-VID-000.md))**. Sem a capacidade de transferir, armazenar de forma segura, extrair metadados técnicos e reproduzir vídeos num leitor integrado, nenhuma das operações de transformação subsequentes seria viável.

Sobre este alicerce de ingestão, as cinco operações de manipulação ([UC-VID-001](use-cases/UC-VID-001.md) a [UC-VID-005](use-cases/UC-VID-005.md)) foram escolhidas por cobrirem o conjunto mínimo e suficiente para validar a extensão do PictuRAS para vídeo: recorte, remoção de áudio e velocidade validam a manipulação temporal e estrutural; a marca de água valida a sobreposição gráfica consistente fotograma a fotograma; e a extração de fotogramas une os domínios do vídeo e da imagem, alimentando o catálogo de ferramentas já existente. Em conjunto, o sistema exercita o ciclo de vida multimédia completo — ingestão, armazenamento, inspeção visual, processamento assíncrono com progresso e cancelamento, quotas por perfil e persistência não destrutiva. O acesso é reservado a utilizadores Registados e Premium porque os recursos ficam guardados em projetos autenticados, prevenindo abusos de infraestrutura.

---

## 2. Catálogo de Casos de Uso (Ficheiros Individuais)

Para assegurar uma leitura modular e permitir a integração direta com o template do relatório (e.g. Typst `#include "casos-uso/UC-VID-xxx.typ"`), cada caso de uso encontra-se integralmente especificado no seu próprio ficheiro:

### 📹 [UC-VID-000: Carregar e visualizar um vídeo no projeto](use-cases/UC-VID-000.md)
- **Objetivo**: Permitir a transferência de ficheiros MP4 (H.264/AAC), validação de contentores e codecs com FFprobe, gravação no storage SeaweedFS/S3 com UUID, extração de metadados técnicos, geração de miniatura JPEG e visualização no reprodutor integrado com atalhos para as ferramentas de edição.
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

## 3. Utilização de agentes de IA

| **Ferramenta / Skill** | **Tarefa apoiada** | **Validação realizada pela equipa** |
|------------------------|--------------------|--------------------------------------|
| **ChatGPT / Copilot** | Apoio na revisão da linguagem e na normalização dos casos de uso, com foco na consistência terminológica, na redução de ambiguidades e na deteção de lacunas entre fluxos, exceções e regras de negócio. | A equipa verificou que todas as descrições respeitam o modelo de requisitos do PictuRAS, mantêm a origem documental, incorporam as decisões D-VID-001 a D-VID-010 e evitam decisões de implementação não aprovadas. |
| **Antigravity (AI-DLC Inception Agent)** | Consolidação, decomposição atómica e modularização dos casos de uso e requisitos em ficheiros individuais dedicados, assegurando rastreabilidade bidirecional com a ERS e conformidade com o template Typst da Fase 1. | A equipa verificou a rastreabilidade entre casos de uso, decisões e requisitos e confirmou que os valores quantitativos correspondem às decisões contratuais do MVP. |

---

## ✅ Lista de Verificação

- [x] Secção 0 preenchida com identificação correta do grupo e versão v1.3.
- [x] Secção 1 com tabela das seis funcionalidades (incluindo UC-VID-000), perfis e justificação no contexto do MVP.
- [x] Casos de uso modularizados em ficheiros individuais na diretoria `docs/use-cases/`.
- [x] Cada caso de uso com cabeçalho, fluxo principal, fluxos alternativos, exceções específicas de vídeo, pós-condições, regras de negócio e assunções.
- [x] Limites numéricos aplicados: Registado $\le 5$ min / $\le 200$ MB / $\le 50$ frames; Premium $\le 60$ min / $\le 2$ GB / $\le 500$ frames.
- [x] Quota: 1 operação/tarefa de manipulação; Registado 5 ops/dia; Premium sem quota; devolução em falha/cancelamento; upload sem consumo de quota.
- [x] Processamento assíncrono com estados `queued → processing → completed | failed | cancelled`.
- [x] Utilização de agentes de IA documentada.
