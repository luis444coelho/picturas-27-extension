# Auditoria dos testes e da validação do MVP

**Data:** 23 de outubro de 2026. **Código analisado:** commit `41f41da`.  
**Âmbito:** ERS de suporte a vídeo em `docs/requirements/`, implementação, testes e resultados dos bolts.  
**Método:** leitura dos critérios de aceitação, asserções, checklists e relatórios; duas sondagens isoladas descritas abaixo. Não foi repetida a suite completa nem executados testes de integração que criam contas, carregam ficheiros ou reiniciam serviços.

## 1. Conclusão

**Os testes existentes constituem uma base forte, mas ainda não permitem declarar que todos os requisitos implementados estão integralmente validados.** Há testes unitários, processamento com FFmpeg real, integração pela stack, testes de browser e checklists manuais com resultados. A maior necessidade é consolidar a rastreabilidade e completar critérios concretos; não é reescrever toda a suite.

Foram identificados dois problemas objetivos que os testes de aceitação atuais não detetam:

1. **NFR-001: o alvo MVP é JWT com expiração de uma hora, mas o helper de autenticação emite tokens de sete dias.** A sondagem do helper real devolveu `exp - iat = 604800` segundos, face ao alvo de `3600`. Os testes encontrados verificam ausência/token inválido, sem um caso explícito de JWT corretamente assinado mas expirado e sem uma asserção do TTL de emissão.
2. **CONVERT-009 / CHAIN-016: conversão antes de outro passo não é rejeitada pela validação de domínio.** A sondagem `convert → filter` devolveu `error: null`. A validação estrutural pertence ao B008, ainda planeado; o fecho do B007 não comprova este requisito. A sondagem não submeteu uma tarefa à API.

Além disso, permanecem lacunas de interação no navegador, medições incompletas de alguns NFR e problemas de isolamento das suites históricas. As limpezas recorrentes do armazenamento não substituem testes de regressão nem corrigem o limite automático de volumes.

### Entregáveis

- Este relatório, com estratégia, resultados localizados, problemas e plano de testes.
- [Matriz dos 241 requisitos](auditoria-testes-mvp-matriz.csv): uma linha por requisito, com critério ERS, evidências, resultado registado, limitação e ação. Separador `;`, codificação UTF-8 com BOM para importação numa folha de cálculo.

Na matriz, «evidência» significa que foi localizado um teste ou verificação relacionado com o comportamento e um registo histórico. **Não significa aprovação atual de todo o requisito**, de todas as combinações ou do commit final. Referências a uma família de testes devem ser individualizadas pelos casos relevantes no relatório académico.

| Classificação da matriz | Requisitos | Interpretação |
|---|---:|---|
| `COM_EVIDENCIA` | 97 | Testes/verificações e resultados históricos localizados; não é certificação integral. |
| `EVIDENCIA_MANUAL` | 46 | Checklist de área aprovada; individualizar critérios e completar metadados do ambiente. |
| `PARCIAL` | 30 | Parte do critério/âmbito tem evidência, mas falta completar a aceitação. Inclui fundações de funcionalidades ainda planeadas. |
| `LACUNA_CONFIRMADA` | 2 | TTL JWT e posição da conversão, descritos nas sondagens. |
| `SEM_EVIDENCIA_EXECUTADA` | 1 | Drag-and-drop foi apenas revisto, sem execução registada. |
| `PENDENTE_B008` | 28 | Critérios de composição/limites ainda sem aceitação completa; seis outros requisitos CHAIN aparecem como parciais pela fundação B003. |
| `FORA_CONSTRUCAO_D06` | 36 | 33 FR e 3 NFR excluídos da construção, conservados no catálogo. |
| `DIVERGENCIA_FONTES` | 1 | Âmbito de NFR-014 por alinhar. |
| **Total** | **241** | **215 FR + 26 NFR; cada ID aparece uma vez.** |

## 2. Estado funcional e âmbito

| Área | Estado declarado nos bolts | Consequência para a validação |
|---|---|---|
| B001 — ingestão, B002 — informação/download, B003 — tarefas/quota | Concluídos | Existem suites e relatórios; alguns percursos são históricos e precisam de ambiente próprio para repetir. |
| B004 — recorte/áudio/velocidade; B005 — operações visuais | Concluídos | Boa evidência automatizada e manual; a regressão B004 tem uma falha de fixture documentada em ARM. |
| B007 — conversão | Concluído | Matriz de conversão testada; checklist de painel/reprodução ainda tem itens por verificar; regra de posição de convert depende do B008. |
| B008 — junção/cadeias/predefinições | Planeado | A fundação B003 não equivale à funcionalidade completa de composição. Testar B008 durante a implementação. |
| B006 — fotogramas; B009 — lotes | Bloqueados por D-06 | Exclusão da construção decidida pela equipa; os requisitos continuam no catálogo ERS do MVP. Declarar explicitamente o que não foi entregue. |
| Melhorias da UI propostas em `ui-video-melhorias.md` | Documento, sem implementação | Não classificar a proposta como funcionalidade implementada ou teste aprovado. |

O catálogo atual contém **215 requisitos funcionais e 26 não funcionais**. A matriz de planeamento ainda diz que a implementação e os testes não começaram, enquanto os bolts já têm resultados. `units.md` também conserva a contagem anterior de 214 FR. Esta desatualização é documental e deve ser corrigida antes da entrega.

## 3. Estratégia e ambiente: o que já podes descrever no relatório

### Tipos e ferramentas

| Tipo | Existência no repositório | Alcance e limites |
|---|---|---|
| Unitários JS do serviço de projetos | 10 ficheiros `*.test.js` sem prefixo `e2e`, em `projects/test/video/` | Validação, planos, quota, estados, manutenção e nomes; usam `node:test`, asserções e fakes. |
| Unitários de funções do frontend | 6 ficheiros `.test.mts`, em `frontend/test/` | Formatadores, contratos, estimativas e estado. Não provam interação DOM, reprodução ou alteração de um controlo pelo utilizador. |
| Worker com processamento real | 5 ficheiros `test_*.py`, em `Tools/video/tests/` | `unittest`, FFmpeg/FFprobe 5.1, fixtures temporárias, hashes, metadados, fotogramas e comandos. Alguns testes isolam AMQP/storage com fakes. |
| Integração e browser | 12 ficheiros `e2e*.test.js` | Integração por nginx/API/MongoDB/RabbitMQ/SeaweedFS/worker e testes Playwright/Chromium ou CDP. Requerem configurações específicas; não executar todos cegamente com um glob. |
| Manuais | Checklists B004, B005 e B007 | Resultados aprovados pela equipa, com itens pendentes e metadados de execução por completar. São válidos para a orientação académica quando o caso e o resultado ficam identificados. |
| Compilação/análise estática | Build de produção, TypeScript e ESLint nos relatórios | Complementam os testes. Não substituem um teste de aceitação de um requisito. |

Os relatórios usam Docker Compose local, nginx em `https://localhost:8080`, três MongoDB, RabbitMQ, SeaweedFS 4.47 e worker Python 3.11/Debian 12 com FFmpeg/FFprobe 5.1.9. Há resultados em máquinas diferentes, incluindo macOS/aarch64; não apresentar todas as execuções como se tivessem o mesmo hardware ou sistema operativo.

Para cada execução final, registar commit, data, sistema operativo/arquitetura, versões das imagens e ferramentas, browser/versão, configuração de teste, comando, resultado e caminho do log sanitizado. A operação `test_reencode` só deve estar ativa no ambiente das suites que a exigem.

### Ficheiros de vídeo e fixtures

| Conjunto | Exemplos/geração | Propriedades relevantes |
|---|---|---|
| B001/B002 | Exemplos descritos nos relatórios; não há gerador persistente completo equivalente ao das B004–B007. | MP4 com rotação, MOV a 30000/1001 fps, AVI MPEG-4/MP3, sem áudio, High 10, 0,5 s, HEVC, só áudio, truncado e duração de 5:10. As suites históricas usam nomes comuns com conteúdos diferentes. |
| B003 | Fixtures descritas no relatório da fundação. | Vídeo curto de 4 s/640×360, longo de 90 s/1080p (~175 MB segundo o relatório), 321×241 com rotação. |
| B004 | `Tools/video/tests/generate_basic_edit_fixtures.py` e `test_basic_edits.py`. | Vídeos numerados de 4 s, GOP/B-frames, fps inteiro/fracionário, H.264/MPEG-4, AAC/MP3, PTS não nulos, 129×97 e vídeo longo de 20 s/720p. |
| B005 | `Tools/video/tests/generate_visual_edit_fixtures.py`. | Quadrantes de cor, MP4/AVI, rotação, dimensões ímpares, vídeo de 60 s/720p, PNG/JPEG, GIF e PNG acima de 1 MB. |
| B007 | `Tools/video/tests/generate_convert_fixtures.py`; os unitários geram também os seus próprios exemplos de 2 s. | Dez percursos de conversão, incluindo sem áudio, dimensões ímpares e H.264 4:4:4; 10 resultados + 8 previews. |
| Transferências grandes | `e2e-large.test.js`. | 150 MiB de bytes aleatórios com nome `.mp4` e recusa por `Content-Length > 2 GiB`. Não equivale a um vídeo válido de 2 GiB reproduzido/descarregado. |

Os tamanhos exatos dos vídeos gerados variam com a codificação. Para preencher «tamanhos usados», guardar um manifesto da execução com nome, SHA-256, bytes e saída FFprobe: contentor, codecs, duração, resolução, fps, áudio e rotação. Não inventar tamanhos nem confundir MB decimais com os limites base 1024 usados no código.

## 4. Testes realizados: exemplos de registo no formato pedido

Os IDs abaixo são **rótulos editoriais desta auditoria** para ligar casos existentes ao capítulo. Não são identificadores originalmente emitidos pelo runner. «Passa histórico» significa resultado registado no relatório indicado, sem nova execução nesta auditoria. Para a entrega, anexar o registo da execução de referência e manter as limitações da matriz.

| ID | Tipo | Descrição — Dado… Quando… Então… | Requisito(s) | Resultado/evidência |
|---|---|---|---|---|
| TST-AUD-AUTH-01 | Integração | Dado um pedido sem JWT ou com token inválido, quando chega à rota de vídeo, então devolve 401. | AUTH-001, parte NFR-001 | Passa histórico B001/B002; não verifica TTL de 1 h nem JWT expirado válido. |
| TST-AUD-UPLOAD-01 | Integração | Dado um MP4 válido com rotação, quando a ingestão termina, então existem metadados, miniatura, fotograma 0 e recurso concluído, sem débito de quota. | UPLOAD-007/008/013/014/019 | Passa histórico B001; `e2e.test.js`, caso «MP4 with rotation». |
| TST-AUD-UPLOAD-02 | Browser | Dado «Novo projeto com vídeo», quando um MOV é carregado, então abre o projeto sem imagens com o vídeo; se houver cancelamento, fica vazio. | UPLOAD-001/006/021 | Passa histórico B001; `e2e-ui.test.js` e `e2e-project.test.js`. |
| TST-AUD-TRIM-01 | Worker + integração | Dado um segmento fora de keyframe, quando é recortado, então respeita os limites visuais e usa recodificação quando a cópia não é segura. | TRIM-008/009/010 | Passa histórico B004; `test_basic_edits.py` e `e2e-basic-edits.test.js`. |
| TST-AUD-AUDIO-01 | Worker + integração | Dado H.264 com áudio, quando o áudio é removido, então o vídeo é preservado e não existe stream sonora. | AUDIO-005/006 | Passa histórico B004; hashes/fotogramas e FFprobe. |
| TST-AUD-SPEED-01 | Worker + manual | Dado um fator suportado, quando a velocidade muda, então a duração varia inversamente, preservando fps/resolução e sincronismo. | SPEED-006/007/008 | Passa histórico B004; parte auditiva manual, browser/versão não comunicados. |
| TST-AUD-DOWNLOAD-01 | Integração + browser | Dado um AVI concluído, quando é descarregado, então os bytes/hash e extensão são os do original; um Range recebe 206 com o intervalo certo. | DOWNLOAD-005/006/007, partes NFR-016/025 | Passa histórico B002; sem demonstração de retoma de vídeo de 2 GiB. |
| TST-AUD-INFO-01 | Unitário + browser | Dado um vídeo com metadados, quando se abre a informação, então duração, resolução, formato, tamanho e fps são apresentados corretamente. | INFO-001 a 006 | Passa histórico B002; formatadores e `e2e-access-ui.test.js`. |
| TST-AUD-VISUAL-01 | Worker + integração | Dado saturação 0, quando o ajuste termina, então os fotogramas do início/meio/fim são cinzentos; a preview corresponde ao resultado. | ADJUST-003/005/008/009 | Passa histórico B005 após D-67; `test_visual_edits.py` e `e2e-visual-edits.test.js`. |
| TST-AUD-VISUAL-02 | Unitário + worker + manual | Dado um filtro válido, quando aplicado, então o catálogo, seleção e resultado respeitam o filtro; um filtro inexistente é rejeitado. | FILTER-001 a 007 | Passa histórico B005; parte DOM na checklist manual. |
| TST-AUD-RESIZE-01 | Worker + integração | Dado um pedido de 854×480, quando termina, então o resultado tem essas dimensões e rotação 0. | RESIZE-008/009 | Passa histórico B005. |
| TST-AUD-ORIENT-01 | Worker + integração | Dado rotação 90° e espelho horizontal, quando termina, então aplica rotação antes do espelho e troca as dimensões. | ORIENT-004/008/009 | Passa histórico B005; 16 combinações nos testes. |
| TST-AUD-WATERMARK-01 | Worker + integração | Dado uma marca com posição/escala/opacidade, quando termina, então mantém a sobreposição nos fotogramas e o áudio esperado. | WATERMARK-005/006/010/011 | Passa histórico B005. |
| TST-AUD-CONVERT-01 | Worker + integração | Dado MP4 H.264/AAC, quando convertido para AVI, então produz MPEG-4/MP3, preserva o original e associa preview MP4. | CONVERT-004/005/006, parte 007/008 | Passa histórico B007; matriz de dez percursos. |
| TST-AUD-RECOVERY-01 | Integração com falha induzida | Dado um worker interrompido, quando a tarefa é reentregue, então recomeça; após duas falhas, devolve quota e limpa os temporários sem resultado. | NFR-007, ERROR-003, QUOTA-004 | Passa histórico B003; os testes já existem e reiniciam o worker. |
| TST-AUD-NFR-005 | Integração/medição | Dado um pedido válido, quando a API devolve taskId/queued, então a resposta ocorre em ≤1000 ms. | TASK-001, NFR-005 | B003: 20–27 ms; B004: 31,6–81,1 ms; B005: máximo 154 ms. |
| TST-AUD-NFR-015 | Integração/medição | Dado um pedido de preview, quando a API responde, então o p95 fica abaixo de 1000 ms. | Parte NFR-015 | B005: p95 22,5 ms, n=40; mede API, não o tempo completo até ao fotograma no browser. |

Usar os IDs completos `REQ-VID-*` na tabela final. Um teste pode cobrir vários requisitos, desde que as asserções realmente verifiquem os respetivos critérios. Ter o ID num comentário ou 100% de linhas num módulo não basta para comprovar cobertura da ERS.

### Relatórios que suportam os resultados históricos

- [B001 — ingestão](../memory-bank/bolts/001-video-lifecycle/ddd-03-test-report.md).
- [B002 — informação e download](../memory-bank/bolts/002-video-access/test-walkthrough.md).
- [B003 — tarefas, quota e recuperação](../memory-bank/bolts/003-video-task-foundation/ddd-03-test-report.md).
- [B004 — operações básicas](../memory-bank/bolts/004-video-basic-edits/ddd-03-test-report.md) e [checklist](../memory-bank/bolts/004-video-basic-edits/manual-test-checklist.md).
- [B005 — operações visuais](../memory-bank/bolts/005-video-visual-edits/test-walkthrough.md) e [checklist](../memory-bank/bolts/005-video-visual-edits/manual-test-checklist.md).
- [B007 — conversão](../memory-bank/bolts/007-video-format-conversion/test-walkthrough.md) e [checklist](../memory-bank/bolts/007-video-format-conversion/manual-test-checklist.md).

Não somar os totais dos relatórios como testes independentes: incluem regressões repetidas. A B007 regista 258 testes JS, 72 Python, regressão frontend e testes próprios de conversão, 16/16 na B005 e 14/15 na B004. Esses totais não são uma percentagem de requisitos cobertos nem resultado de nova execução no commit desta auditoria.

## 5. Requisitos não funcionais: alvo e prova disponível

Os valores abaixo vêm dos relatórios, exceto a sondagem atual de JWT explicitamente identificada. Uma célula sem medição não significa reprovação automática: alguns alvos são verificações estruturais/funcionais e não métricas temporais.

| NFR | Alvo MVP resumido | Evidência/valor | Conclusão da auditoria |
|---|---|---|---|
| 001 | JWT com expiração de 1 h | **Sondagem atual: 604800 s**, alvo 3600 s; helper configura `7d`. | Não conforme ao alvo de emissão; falta teste de TTL e token expirado. |
| 002 | Mesmo UUID de correlação em gateway/projetos/worker | B003 verifica logs dos três serviços e formato das mensagens. | Evidência existente; anexar logs sanitizados da execução final. |
| 003 | Matriz MP4/MOV/AVI e codecs aprovados | Domínio, FFprobe real e ingestão positiva/negativa. | Evidência existente. |
| 004, 019, 020 | Fotogramas JPEG/PNG, resolução e limites por perfil | B006 excluída por D-06. | Não implementados; declarar exclusão. |
| 005 | Aceitação HTTP ≤1000 ms | B003 20–27 ms; B004 31,6–81,1 ms; B005 p95 34 ms/máximo 154 ms. | Valores locais registados; sem prova de carga concorrente. Carga não é um alvo adicional exigido por esta ERS. |
| 006 | Processamento assíncrono e navegação livre | RabbitMQ/202 verificados; não localizado ensaio explícito de navegação fluida durante tarefa longa. | Completar no browser. |
| 007 | Recuperação em até duas entregas, sem resíduos | B003 testa crash/recomeço e dois crashes/dead-letter com devolução/limpeza. | Teste já existe; repetir em ambiente isolado para a versão final. |
| 008 | Free ≤200 MiB/5 min; Premium ≤2 GiB/60 min | Fronteiras no domínio e rejeições/aceitação na API. | Evidência das regras; não confundir ticket de upload com transferência física máxima. |
| 009 | Progresso 0–100, pelo menos 1×/s | B003: intervalo máximo 645 ms no cenário testado. Outros testes esperam progresso positivo para cancelar. | Falta medição por operação real; operações mais curtas que 1 s precisam de critério aplicável explícito. |
| 010 | Worker Docker/Linux com Python e FFmpeg | Builds e execução em Python 3.11/FFmpeg 5.1.9. | Evidência de ambiente; registar arranque limpo no ambiente final. |
| 011 | Fila de vídeo independente/fluxo de imagem preservado | Auditoria de diffs/filas e regressão real de imagem. | Evidência existente; manter visível a falha de fixture B004. |
| 012 | Resultados válidos/descodificáveis | B007: 18/18 FFprobe + decode integral `-xerror`; workers testam resultados das operações. | Boa evidência; relacionar cada família com a verificação final. |
| 013 | Um grafo/uma recodificação de vídeo por cadeia | Testes do compilador e B003; operações visuais também verificam o grafo. | Fundação coberta; repetir com composição real quando B008 existir. |
| 014 | A ERS atual define limites de lotes | D-10 atribui parte a junção/cadeia, enquanto a tabela ERS continua a dizer lote. | Divergência de fontes; alinhar âmbito e não marcar cumprimento integral. |
| 015 | Preview apresentada em ≤1 s em 95% dos pedidos | API B005: p95 22,5 ms, máximo 24,6 ms, 40 pedidos; miniaturas 20,1 ms. | Falta série temporal ação→imagem apresentada, incluindo debounce/rede/renderização. |
| 016 | Download direto por S3, até 2 GiB | URL/logs comprovam bypass do gateway; os 150 MiB são ruído de upload. | Completar cenário de vídeo válido no limite. |
| 017 | Permissão de projeto e URL assinado de 15 min | Assinatura/expiry de 900 s; teste real de expiração com TTL reduzido a 2 s. | Evidência existente; método abreviado é válido quando documentado. |
| 018 | MP4 H.264/AAC, exceto conversão e ausência de áudio | FFprobe em B004/B005/B007, matriz de codecs e preview. | Evidência existente. |
| 021 | Máximo uma tarefa ativa por projeto | API B003 e dois testes de browser D-66 da B005. | Evidência existente. |
| 022, 023, 024 | Limites de clips, passos e duração total da junção | B008 ainda planeado. | Implementar capacidade e respetivos testes. |
| 025 | Retoma HTTP Range até 2 GiB | 206 e bytes corretos em ficheiro pequeno. | Completar interrupção/retoma real e limite de capacidade. |
| 026 | Reprodução completa em VLC e leitor integrado | 18/18 em VLC headless; apenas parte dos percursos do leitor tem aprovação manual. | Completar matriz no leitor integrado. QuickTime/WMP não são exigidos pelo alvo MVP desta tabela. |

## 6. Testes novos ou complementos necessários

| Prioridade | ID proposto | Ação | Dado… Quando… Então… / prova a registar |
|---|---|---|---|
| Alta | PROP-TST-JWT-01 | **Novo teste de emissão e rejeição** | Dado um token emitido pelo helper real, quando inspecionado, então exp−iat corresponde ao alvo aprovado; dado JWT válido já expirado, quando usado nas rotas de vídeo, então devolve 401. Testar fronteiras sem esperar uma hora. O teste de emissão deve revelar a divergência atual. |
| Alta | PROP-TST-CHAIN-01 | **Novo teste negativo, integrado no B008** | Dado `convert → filter`, quando validado/submetido, então `INVALID_CHAIN`, sem tarefa, reserva nem publicação. Acrescentar conversão no fim como caso positivo. A sondagem atual só prova a lacuna no domínio. |
| Alta | PROP-TST-ISOLATION-01 | **Melhoria do harness** | Dado o inventário inicial da execução, quando a suite termina, falha num hook ou é interrompida, então remove apenas os seus utilizadores/projetos/objetos/buckets e liberta os volumes próprios. Comparar inventários e permitir limpeza posterior por identificador da execução. |
| Alta | PROP-TST-DROP-01 | **Novo caso browser ou manual individualizado** | Dado um vídeo arrastado, quando largado na zona correta, então valida/inicia o fluxo; formato/MIME inválido é recusado antes de transferência. UPLOAD-002 não tem execução registada. |
| Alta | PROP-TST-CONVERT-UI-01 | **Executar checklist existente** | Verificar formato atual, destinos excluindo o atual, seleção, modo copy/encode por stream e dez percursos de reprodução completa. Registar browser/versão, fixture, resultado e falhas. Automatização adicional é útil, mas não obrigatória para substituir um registo manual válido. |
| Média | PROP-TST-PLAYER-01 | **Completar browser/manual** | Dado o leitor aberto, quando se usam play/pause, seek, volume e fullscreen, então os controlos funcionam. Não usar apenas `controls`/`readyState` como resultado de todo o requisito. |
| Média | PROP-TST-PROGRESS-01 | **Novo caso browser** | Dado upload com rede limitada, quando decorre até ao fim, então registar percentagens monotónicas até 100%; ao cancelar, verificar interrupção e ausência de resíduos. |
| Média | PROP-TST-READY-01 | **Novo teste de componente ou manual** | Dado vídeo `processing`, quando as ações são apresentadas, então download está desativado com `RESOURCE_NOT_READY` e não emite pedido; complementar o 409 já testado na API. |
| Média | PROP-TST-NFR015-01 | **Completar medição** | Dado alteração de filtro/ajuste/orientação, quando a imagem nova é efetivamente apresentada, então medir do evento ao render; n/amostra e p95 registados face a 1000 ms. Manter separada a série de latência da API. |
| Média | PROP-TST-NFR009-01 | **Completar parametrização** | Para cada operação real suficientemente longa, medir intervalos WebSocket, progressão e 100 final; incluir caminhos de cópia/recodificação. Não criar um alvo temporal artificial para operações que terminam antes de 1 s. |
| Média | PROP-TST-LARGE-01 | **Novo ensaio de capacidade, automático ou manual** | Dado vídeo válido próximo/no limite de 2 GiB em conta Premium e ambiente com espaço, quando descarregado/interrompido/retomado, então confirmar bytes/hash, 206, intervalo e bypass do gateway. Registar tamanho/duração e limpar os dados próprios. |
| Média | PROP-TST-NAV-01 | **Novo caso browser ou manual** | Dado vídeo longo em processamento, quando se navega e regressa, então a navegação mantém-se utilizável e o estado é recuperado. Registar o percurso e o resultado. |
| Média | PROP-TST-PRECISION-01 | **Reforçar asserções e justificar tolerância** | B007 aceita diferença de duração inferior a 0,12 s numa fixture de 2 s/25 fps. Justificar a tolerância do contentor/priming e medir separadamente duração visual, áudio e fps; não declarar «duração exata» apenas com esse limiar. |
| Na implementação B008 | PROP-TST-CONCAT/CHAIN-* | **Novas suites da funcionalidade** | Cobrir concat heterogéneo, silêncio, clips repetidos e ordem, 2/10/11 e 50/51 clips, 10/11 passos com sub-cadeias, duração total, regras de estrutura, predefinições, custo e atomicidade/cancelamento. |

**Não é necessário criar testes novos para tudo.** Por exemplo, crash/dead-letter, quota, HTTP Range básico, fórmulas visuais, keyframes e matriz de conversão já têm testes relevantes. Reexecutá-los e ligar o resultado a cada critério é diferente de implementar novamente os mesmos casos.

## 7. Limitações e defeitos conhecidos a registar

1. **Validação completa do MVP ainda pendente:** B008 não está implementado e B006/B009 continuam excluídos da construção, embora constem da ERS. Não chamar ao estado atual cobertura total do MVP original.
2. **TTL JWT e posição de convert:** divergências identificadas nesta auditoria; precisam de testes que revelem o problema e de resolução da implementação ou decisão formal de âmbito. A regra de preservação da baseline não apaga o alvo da ERS.
3. **Contador visual da quota:** D-74 regista débito correto no servidor, mas contador da sessão desatualizado. Um teste que só lê MongoDB não cobre a mensagem/estado apresentado na UI.
4. **Fixture da regressão de imagem:** B004 faz 14/15 em ARM por esperar azul 127 e receber 126; B005 calcula o esperado a partir do pixel real e passa. Continuar a registar o teste B004 como falha conhecida até corrigir a expectativa/fixture pelo processo aprovado. Não o converter em «Passa» por ser conhecido.
5. **Limpeza das suites históricas:** `e2e.test.js` fecha sockets/conexões mas não elimina todos os dados criados; `e2e-project.test.js` e `e2e-large.test.js` apenas desligam mongoose no teardown; `e2e-access.test.js` elimina IDs adicionais, mas não todo o cenário. B004/B005/B007 têm limpeza mais completa. Estes pontos podem contribuir para acumulação de contas/buckets e para esgotar volumes; não provam que toda a ocupação observada veio dos testes.
6. **Execução não centralizada:** não foi encontrado runner global de testes ou workflow CI de testes; `package.json` de projetos só define start, e o teste de wsGateway é o placeholder «no test specified». As suites exigem opt-in, fixtures e, por vezes, reinícios. Testes ignorados por ausência de variáveis/dependências são «Não executados», não aprovações.
7. **Evidência manual e artefactos:** B004/B005 têm aprovações sem browser/versão comunicados; B007 tem itens abertos. Algumas capturas/fixtures/logs ficaram fora do repositório. Completar o registo da execução e tornar os artefactos acessíveis à equipa, sem expor tokens ou URLs assinados.
8. **Fontes desatualizadas:** rastreabilidade ainda marcada como «implementação pendente», divergência 214/215 FR, NFR-014 com âmbito diferente entre ERS/D-10 e registos D-73 anteriores à correção D-75. Consolidar sem apagar o histórico.
9. **Cobertura medida:** 94,98% de linhas refere-se aos módulos JS carregados na suite B005; não é cobertura de todo o repositório, de UI/DOM ou de 94,98% dos requisitos.

## 8. Registo das duas sondagens desta auditoria

### S-01 — conversão fora da posição final

Executado no código local do commit indicado, sem API, RabbitMQ ou gravações:

```js
chain.validateChain(
  [
    { operation: "convert", version: 1, parameters: { target: "mov" } },
    { operation: "filter", version: 1, parameters: { filter: "sepia" } },
  ],
  /* propriedades de MP4 H.264/AAC, 320×240, 25 fps, 4 s */ props,
  { type: "free" },
  registry,
);
// Resultado observado: error === null.
// Requisito: rejeitar com INVALID_CHAIN (CONVERT-009 / CHAIN-016).
```

O resultado confirma a ausência da regra nesta função, não uma execução completa da cadeia pela API. Não foi acrescentado um teste permanente nesta intervenção.

### S-02 — duração dos tokens emitidos

Executado no contentor de utilizadores, chamando `auth.get_jwt` com um ID sintético e descodificando apenas `exp`/`iat`, sem criar conta nem divulgar o token:

```json
{"ttlSeconds":604800,"targetSeconds":3600,"withinTarget":false}
```

O código em `users/auth/auth.js` configura `expiresIn: "7d"`; as rotas de criação/login usam esse helper. A verificação de assinatura/expiração existente no gateway não reduz o TTL de um token emitido por sete dias.

## 9. Como fechar o capítulo académico

1. Definir o âmbito entregue e separar «implementado», «planeado», «excluído da construção» e «parcialmente cumprido» por requisito.
2. Resolver as duas divergências concretas ou documentar formalmente a decisão aplicável; acrescentar os testes de aceitação que as detetariam.
3. Executar os itens manuais existentes que estão abertos e os novos casos de interação/medição prioritários. Um manual bem registado satisfaz a orientação; não é obrigatório automatizar todo o DOM.
4. Criar uma execução de referência sobre o commit final, com ambiente/fixtures identificados e limpeza limitada aos recursos próprios. Guardar resultado, falhas, skips e medições sem somar regressões duplicadas.
5. Preencher o capítulo «Testes e Validação do MVP» com a estratégia e a tabela de casos efetivos; anexar a matriz requisito→teste→resultado. Para cada NFR aplicável, incluir alvo, valor observado, unidade/amostra e conclusão.

**Alterações desta auditoria:** apenas documentação e matriz. Não foram modificados código, testes persistentes, configuração ou dados da aplicação.
