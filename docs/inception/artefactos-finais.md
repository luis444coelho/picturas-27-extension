# Artefactos finais da Inception — Suporte a vídeo

**Intent:** `001-video-processing-support`  
**Âmbito:** extensão de vídeo do PictuRAS v27.1, UC-VID-000 a UC-VID-015  
**Fontes:** [casos de uso](../use-cases.md), [requisitos](../requirements.md), [modelo de domínio PlantUML](../diagrams/modelo_dominio.puml), [diagrama de casos de uso PlantUML](../diagrams/diagrama_casos_uso.puml) e [diretrizes da Fase 1](../../Documentos%20consulta/fase-1-guidelines.pdf).

Este documento fecha os artefactos de planeamento da Inception. Os diagramas são mantidos em `docs/diagrams`; este texto fixa as decisões de domínio, as regras globais e a decomposição de construção coerentes com os casos de uso e requisitos aprovados.

## 1. Modelo de domínio atualizado — leitura textual

O modelo visual encontra-se em [`modelo_dominio.puml`](../diagrams/modelo_dominio.puml). A decisão é representar imagens e vídeos como especializações de `RecursoMultimédia`, pois partilham identidade, nome, tamanho, data de carregamento e referência de armazenamento. `Imagem` acrescenta dimensões, formato e, quando extraída de vídeo, timestamp de origem. `Vídeo` acrescenta duração, resolução, taxa de fotogramas, bitrate, codecs e referência de miniatura. Os resultados são novos recursos e mantêm a ligação ao vídeo de origem (`sourceVideoId`).

Um `Projeto` contém recursos multimédia de ambos os tipos, incluindo vídeos originais, vídeos derivados e imagens extraídas. A coleção mista não torna os tipos intercambiáveis: operações de vídeo recebem vídeos; ferramentas de imagem recebem imagens, incluindo fotogramas extraídos.

Cada pedido demorado é representado por `TrabalhoProcessamento`, associado ao projeto, ao utilizador que o submeteu, ao recurso de entrada e à ferramenta/parâmetros validados. O ciclo de vida é `queued → processing → completed | failed | cancelled`. O trabalho comunica progresso quando aplicável, conserva o erro terminal e referencia os recursos produzidos. Um lote é um trabalho agregador com subtarefas por vídeo e resultados independentes; uma cadeia é um único trabalho atómico com um único resultado final.

`FerramentaVídeo` cobre ingestão/consulta e transformação de vídeo: recorte, áudio, velocidade, marca de água, extração, ajustes, filtros, redimensionamento, orientação, conversão, junção, cadeias e lotes. `FerramentaImagem` continua a operar sobre `Imagem`; a extração transforma instantes do vídeo em imagens normais do projeto, preservando a proveniência. A política da conta define limites e quota: Registado tem 5 créditos diários e limites de vídeo até 5 min/200 MB e 50 fotogramas por extração; Premium não tem quota diária e tem limites até 60 min/2 GB e 500 fotogramas. Ambos têm no máximo uma tarefa ativa por projeto.

### Respostas às quatro perguntas críticas

1. **Relação Vídeo–Imagem:** especializações distintas de `RecursoMultimédia`, com atributos específicos e proveniência dos derivados.
2. **Projetos mistos:** sim. Um projeto contém imagens e vídeos; fotogramas extraídos são recursos `Imagem` utilizáveis pelas ferramentas de imagem.
3. **Tarefas assíncronas:** sim. `TrabalhoProcessamento` tem estado, progresso, cancelamento, erro e zero ou mais resultados; cadeia e lote aplicam as semânticas atómicas/independentes descritas acima.
4. **Ferramentas e quotas:** ferramentas são tipadas por recurso; a conta estabelece limites. Upload, consulta, pré-visualização e download não consomem quota. Operações de edição consomem créditos conforme a regra RNG-05.

## 2. Casos de uso consolidados

O diagrama consolidado é [`diagrama_casos_uso.puml`](../diagrams/diagrama_casos_uso.puml). O catálogo completo está em [docs/use-cases](../use-cases/). Os 16 casos são:

| ID | Caso de uso | Requisitos principais |
|---|---|---|
| UC-VID-000 | Carregar, ingerir e visualizar vídeo | `REQ-VID-UPLOAD`, comuns |
| UC-VID-001 | Recortar temporalmente | `REQ-VID-TRIM` |
| UC-VID-002 | Remover áudio | `REQ-VID-AUDIO` |
| UC-VID-003 | Alterar velocidade | `REQ-VID-SPEED` |
| UC-VID-004 | Aplicar marca de água | `REQ-VID-WATERMARK` |
| UC-VID-005 | Extrair fotogramas para o projeto | `REQ-VID-FRAMES` |
| UC-VID-006 | Descarregar vídeo | `REQ-VID-DOWNLOAD` |
| UC-VID-007 | Consultar informações do vídeo | `REQ-VID-INFO` |
| UC-VID-008 | Ajustar propriedades visuais | `REQ-VID-ADJUST` |
| UC-VID-009 | Aplicar filtro visual | `REQ-VID-FILTER` |
| UC-VID-010 | Redimensionar vídeo | `REQ-VID-RESIZE` |
| UC-VID-011 | Rodar e espelhar vídeo | `REQ-VID-ORIENT` |
| UC-VID-012 | Converter formato | `REQ-VID-CONVERT` |
| UC-VID-013 | Juntar vídeos | `REQ-VID-CONCAT` |
| UC-VID-014 | Encadear operações | `REQ-VID-CHAIN` |
| UC-VID-015 | Processar vídeos em lote | `REQ-VID-BATCH` |

Todos os casos de vídeo exigem utilizador autenticado Registado ou Premium e permissão de edição no projeto. As operações de edição dependem de recursos de vídeo elegíveis; UC-VID-006 e UC-VID-007 aplicam-se a vídeos concluídos. UC-VID-005 é a ponte para o domínio de imagem. UC-VID-015 pode aplicar uma operação isolada ou uma cadeia UC-VID-014 válida; junção (UC-VID-013) e extração de fotogramas não são operações de lote.

## 3. Regras de negócio transversais

| ID | Regra transversal | Rastreabilidade |
|---|---|---|
| RNG-01 | Só utilizadores Registados e Premium autenticados, com permissão de edição no projeto, podem usar as funcionalidades de vídeo. A quota é debitada à identidade do utilizador que submete o trabalho. | `REQ-VID-AUTH-*`; UC-VID-000 a 015 |
| RNG-02 | Entrada: MP4/MOV com H.264 e AAC (faixa áudio opcional); AVI com H.264 ou MPEG-4 Part 2 e AAC ou MP3. Formatos/codecs fora da matriz são rejeitados. Operações produzem MP4 H.264/AAC; UC-VID-012 pode produzir MP4, MOV ou AVI conforme a matriz aprovada. | `REQ-VID-UPLOAD-*`, `REQ-VID-CONVERT-*`, `REQ-VID-NFR-003`; DQ-002, DQ-013 |
| RNG-03 | Limites: Registado ≤5 min, ≤200 MB, até 50 fotogramas por extração; Premium ≤60 min, ≤2 GB, até 500 fotogramas. Restrições adicionais de resolução, número de entradas e passos aplicam-se conforme UC-VID-010 e UC-VID-013 a 015. | `REQ-VID-UPLOAD-*`, `REQ-VID-FRAMES-*`, `REQ-VID-NFR-008`, `REQ-VID-NFR-014`; DQ-005, DQ-015 |
| RNG-04 | No máximo uma tarefa de vídeo ativa por projeto. Submissão de edição é assíncrona e segue `queued → processing → completed`, `failed` ou `cancelled`; trabalhos concluídos associam resultados ao projeto. | `REQ-VID-TASK-*`, `REQ-VID-NFR-005`, `006`, `008`; DQ-004, DQ-016 |
| RNG-05 | Registado dispõe de 5 créditos de edição por dia; Premium é ilimitado. Operação isolada custa 1 crédito; cadeia custa um crédito por passo (junção conta como passo); lote custa o custo por vídeo concluído. A quota necessária é verificada/reservada antes da admissão e só é debitada pelo trabalho entregue; falha/cancelamento devolve créditos não consumidos. | `REQ-VID-QUOTA-*`, `REQ-VID-CHAIN-*`, `REQ-VID-BATCH-*`; DQ-001, DQ-014, DQ-025 |
| RNG-06 | Upload, reprodução, pré-visualização estática, consulta de informações e descarregamento não consomem quota. | `REQ-VID-UPLOAD-014`, `REQ-VID-DOWNLOAD-*`, `REQ-VID-INFO-*`; DQ-011, DQ-023 |
| RNG-07 | O vídeo original nunca é modificado nem eliminado por edição. Um sucesso produz novo recurso com proveniência; falha/cancelamento não publica resultados parciais. Cadeias são atómicas; lotes preservam resultados individuais já concluídos. | `REQ-VID-COM-*`, `REQ-VID-STORAGE-*`, `REQ-VID-CHAIN-*`, `REQ-VID-BATCH-*`; DQ-003, DQ-007, DQ-018 |
| RNG-08 | Cadeias têm até 10 passos, no máximo uma junção, sem extração de fotogramas; conversão só pode ser o último passo. Lotes incluem 2–10 vídeos (Registado) ou 2–50 (Premium), não incluem junção nem extração e processam sequencialmente como uma tarefa. | `REQ-VID-CHAIN-*`, `REQ-VID-BATCH-*`, `REQ-VID-NFR-014`; DQ-015 a DQ-018 |
| RNG-09 | Fotogramas extraídos são imagens JPEG ou PNG do projeto, conservam a resolução do vídeo e incluem instante/proveniência. Podem usar as ferramentas de imagem; não são passo de cadeia de vídeo nem operação de lote de vídeo. | `REQ-VID-FRAMES-*`, `REQ-VID-NFR-004`; DQ-017 |
| RNG-10 | Acesso a originais e resultados requer autorização de projeto. URLs de storage são temporários; descarregamentos usam o storage diretamente e suportam retoma. | `REQ-VID-NFR-001`, `REQ-VID-NFR-016`; UC-VID-006 |

## 4. Decomposição do intent em Units

As Units são fatias verticais implementáveis da extensão; cada caso de uso funcional é atribuído a uma única Unit. Requisitos comuns de sessão, quota, storage, tarefas e erros são capacidades partilhadas, especificadas uma vez e realizadas na Unit 001, com contratos consumidos pelas restantes.

### Unit 001 — Ciclo de vida e recursos de vídeo

- **Objetivo:** disponibilizar recursos de vídeo seguros no projeto e contratos comuns para tarefa, quota e storage.
- **Casos/Stories:** UC-VID-000, UC-VID-006, UC-VID-007.
- **Requisitos:** `REQ-VID-UPLOAD`, `REQ-VID-DOWNLOAD`, `REQ-VID-INFO` e `REQ-VID-COM` (AUTH, QUOTA, STORAGE, TASK, ERROR).
- **Dependências:** baseline de sessão, projetos, permissões e storage.
- **Saída:** ingestão e consulta de vídeo, visualização/download, modelo de recurso/proveniência e interfaces comuns de processamento.
- **Complexidade:** L; maior risco em ingestão, formatos e integridade entre metadados e objetos.

### Unit 002 — Transformações de vídeo

- **Objetivo:** implementar operações isoladas e extração para imagem, preservando os originais.
- **Casos/Stories:** UC-VID-001 a UC-VID-005 e UC-VID-008 a UC-VID-012.
- **Requisitos:** `REQ-VID-TRIM`, `AUDIO`, `SPEED`, `WATERMARK`, `FRAMES`, `ADJUST`, `FILTER`, `RESIZE`, `ORIENT`, `CONVERT` e `REQ-VID-NFR` aplicáveis.
- **Dependências:** Unit 001; catálogo e recursos de imagem para UC-VID-005.
- **Saída:** ferramentas tipadas, validação de parâmetros, tarefas assíncronas, resultados derivados e integração de fotogramas.
- **Complexidade:** XL; operações variam entre cópia de streams e recodificação, com formatos e limites distintos.

### Unit 003 — Composição de operações e processamento em lote

- **Objetivo:** compor operações em junções, cadeias atómicas e lotes com custos e estados agregados coerentes.
- **Casos/Stories:** UC-VID-013, UC-VID-014, UC-VID-015.
- **Requisitos:** `REQ-VID-CONCAT`, `REQ-VID-CHAIN`, `REQ-VID-BATCH`, `REQ-VID-TASK-006/007`, `REQ-VID-QUOTA-007/008`, `REQ-VID-NFR-013/014`.
- **Dependências:** Unit 001 e operações da Unit 002.
- **Saída:** validação de grafos/cadeias e lotes, reserva de créditos, execução agregada, resultados atómicos ou independentes conforme o caso.
- **Complexidade:** XL; risco de composição de parâmetros, recodificação, cancelamento e acerto de quota.

### Grafo de dependências

```text
Unit 001 — Ciclo de vida e recursos
    └──> Unit 002 — Transformações
              └──> Unit 003 — Composição e lotes
```

## 5. Planeamento dos Bolts

Estimativas relativas para ordenação do trabalho, não compromissos de calendário. Cada Bolt é uma fatia vertical com critérios de aceitação rastreados aos requisitos. Tipos propostos: **DDD** para domínio/estado/quota; **Simple** para ferramentas isoladas sobre contratos estabelecidos.

| Ordem / ID | Unit | Âmbito (Stories/UC) | Tipo | Dependências | Objetivo de saída |
|---|---|---|---|---|---|
| B001 `001-video-lifecycle` | 001 | UC-VID-000; sessão, ingestão, validação, metadados, thumbnail, projeto | DDD | — | Recurso de vídeo válido e visualizável com persistência íntegra |
| B002 `002-video-access` | 001 | UC-VID-006, UC-VID-007 | Simple | B001 | Consulta e download autorizado, sem quota |
| B003 `003-video-task-foundation` | 001 | contratos comuns: estados, fila, cancelamento, quota, erro e storage temporário | DDD | B001 | Contrato partilhado de trabalho pronto para ferramentas |
| B004 `004-video-basic-edits` | 002 | UC-VID-001, 002, 003 | DDD | B003 | Recorte, remoção de áudio e velocidade como tarefas não destrutivas |
| B005 `005-video-visual-edits` | 002 | UC-VID-004, 008, 009, 010, 011 | Simple | B003 | Transformações visuais e pré-visualização validadas |
| B006 `006-video-frame-export` | 002 | UC-VID-005 | DDD | B003; integração imagem | Extração atómica de imagens com instante e proveniência |
| B007 `007-video-format-conversion` | 002 | UC-VID-012 | Simple | B003 | Conversão dentro da matriz de formatos e codecs |
| B008 `008-video-concat-chain` | 003 | UC-VID-013, 014 | DDD | B004, B005, B007 | Junção e cadeia validadas, atómicas, com custo por passo |
| B009 `009-video-batch` | 003 | UC-VID-015 | DDD | B002, B004, B005, B008 | Lote sequencial, resultado independente por vídeo e quota ajustada ao concluído |

### Sequência e critérios de passagem

1. **Fundação:** B001 → B002 e B003. B003 desbloqueia processamento, B002 fecha leitura e entrega de recursos.
2. **Operações:** B004, B005, B006 e B007 podem avançar em paralelo após o contrato de tarefas; B006 também requer alinhamento com o domínio de imagens.
3. **Composição:** B008 após as operações elegíveis; B009 após cadeia e operações-base.
4. **Pronto para Construção:** cada Bolt deve conservar rastreabilidade requisito→UC→critério de aceitação, cobrir estados de sucesso/falha/cancelamento e não alterar os ficheiros originais.

### Riscos e decisões a manter visíveis

- Validar a matriz de contentores/codecs num ponto comum para evitar diferenças entre upload, transformação e conversão.
- Tratar reserva, confirmação e estorno de créditos de forma consistente, sobretudo em lote parcialmente concluído.
- Garantir idempotência/limpeza de objetos temporários e não publicar resultados antes do estado concluído.
- A cadeia deve respeitar limite de recodificação e compatibilidade de cada passo; o lote não pode aceitar junção nem extração.

