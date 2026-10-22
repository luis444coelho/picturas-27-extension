---
bolt: 004-video-basic-edits
stage: test
created: 2026-10-22T19:00:00Z
status: complete
completed: 2026-10-22T20:01:58Z
---

# Testes manuais no browser — executados pela equipa

Abrir a aplicação em `https://localhost:8080`, num browser suportado, com sessão registada ou premium e um projeto editável. Usar um vídeo com áudio, um sem áudio e um vídeo suficientemente longo para cancelar durante o processamento. Para verificar os formatos, incluir MP4, MOV e AVI. A suite automatizada gera exemplos reproduzíveis pelo procedimento em `projects/test/video/README-b004.md`.

Os itens abaixo foram entregues à equipa para execução. Registar browser/versão, resultado e qualquer erro observado. Os testes automáticos de funções TypeScript não validam estes comportamentos do DOM/leitor.

- [x] **Três painéis:** selecionar um vídeo concluído e abrir Recortar, Remover áudio e Velocidade. Confirmar metadados, labels e permissões. Em projeto só de leitura/sem sessão elegível, confirmar que não há submissão disponível.
- [x] **Recorte ao milissegundo:** introduzir início `00:00:01.137` e fim `00:00:03.137` num vídeo com mais de 4 s. Confirmar duração prevista de 2 s e resultado com o segmento escolhido. Repetir com início zero.
- [x] **Validação do recorte:** testar formato temporal incompleto, início negativo, fim anterior/igual ao início, fim além da duração e intervalo menor que um fotograma. Confirmar mensagem compreensível, submissão bloqueada, ausência de tarefa e quota intacta. Corrigir o valor e verificar recuperação da validação.
- [x] **Scrubbing:** pausar o leitor num instante diferente e usar “Definir início” e “Definir fim”. Confirmar que os campos recebem a posição atual ao ms e a duração prevista acompanha os valores.
- [x] **Loop preview:** escolher um intervalo curto, iniciar “Pré-visualizar corte” e observar pelo menos três ciclos entre os limites. Confirmar paragem pelo botão, ao editar os limites e ao fechar o painel. Confirmar que a pré-visualização não cria tarefa nem gasta crédito.
- [x] **Confirmação de áudio:** escolher Remover áudio e confirmar que o primeiro clique abre a confirmação sem criar tarefa. Rejeitar/fechar a confirmação e verificar quota intacta. Reabrir, confirmar e reproduzir o resultado: imagem preservada e ausência de som. O original mantém áudio.
- [x] **Vídeo sem áudio:** abrir Remover áudio num vídeo silencioso; confirmar bloqueio/mensagem e ausência de débito/tarefa.
- [x] **Velocidade:** verificar os sete botões de 0.25× a 4×, introduzir `1.75` e confirmar duração estimada. Testar vazio, zero, negativo, 0.24, 4.01 e 1.0: mensagens e submissão bloqueada. Executar pelo menos 0.25× e 4× e ouvir o áudio para avaliar ritmo, pitch e sincronismo durante a reprodução.
- [x] **Progresso e continuidade:** submeter num vídeo longo; confirmar estado de fila/processamento, percentagem e passo, ausência de submissões duplicadas e acompanhamento ao fechar/reabrir o painel. A conclusão deve atualizar a galeria sem recarregar a página.
- [x] **Cancelamento:** durante progresso positivo, cancelar e confirmar estado final, ausência de resultado e devolução de um crédito para conta free. Reabrir o painel e confirmar que permite outra operação. Verificar também o comportamento se a conclusão ganhar a corrida ao cancelamento.
- [ ] *(não testado manualmente, coberto pelos testes automáticos)* **Galeria e informação:** verificar novo recurso para cada operação, reprodução/download, `sourceVideoIds`/receita no painel de informação e preservação do recurso original. Confirmar que MOV/AVI produzem MP4 H.264/AAC, ou sem áudio após a remoção.
- [ ] *(não testado manualmente, coberto pelos testes automáticos)* **Compatibilidade e geometria:** reproduzir no browser o resultado copiado de H.264 incompatível que usa preview; verificar rotação correta. Num vídeo de dimensões ímpares, confirmar dimensões preservadas na cópia e corte de 1 px para o par inferior na recodificação.
- [x] **Regressão de imagem:** abrir uma imagem do projeto e usar o fluxo habitual de ferramentas/preview/processamento/resultado. Confirmar que os controlos de vídeo não interferem.

Após a execução, comunicar os itens aprovados e os que falharam. O bolt permanece `in-progress`, na etapa 5, até estes resultados e a aprovação explícita da equipa.

## Resultado (2026-10-22T20:01:58Z)

A equipa executou os testes manuais no browser, noutra máquina, e comunicou que **passaram todos**. Áreas reportadas: recorte, recorte inválido, remover áudio, vídeo sem áudio, velocidade, cancelamento e regressão de vídeo e de imagem. Não foram reportadas falhas. Browser e versão não foram comunicados.

- [x] **Regressão de vídeo:** reportada pela equipa como aprovada (fluxo de vídeo das B001 a B003).

Os itens marcados acima correspondem às áreas reportadas; "remover áudio" corresponde à confirmação de áudio e ao resultado sem som. A equipa aprovou a etapa 5 com estes resultados.

**Atualização (2026-10-22T20:13:03Z), comunicada pela equipa:**
- Três painéis, Scrubbing, Loop preview e Progresso e continuidade também foram testados manualmente e passaram (faziam parte dos testes já feitos).
- Galeria e informação e Compatibilidade e geometria **não foram testados manualmente**. Ficam cobertos pelos testes automáticos: em Galeria e informação, a integração real `projects/test/video/e2e-basic-edits.test.js` verifica `source_video_ids`, `recipe` do resultado e da tarefa e `recipe` no endpoint de informação. Em Compatibilidade e geometria, `Tools/video/tests/test_basic_edits.py` e a integração verificam a cópia 129×97, a recodificação 128×96, a rotação 96×128 e a preview H.264 `yuv420p` do trim ímpar.
