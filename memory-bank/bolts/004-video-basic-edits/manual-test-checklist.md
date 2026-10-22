---
bolt: 004-video-basic-edits
stage: test
created: 2026-10-22T19:00:00Z
status: awaiting-user-execution
---

# Testes manuais no browser — pendentes da equipa

Abrir a aplicação em `https://localhost:8080`, num browser suportado, com sessão registada ou premium e um projeto editável. Usar um vídeo com áudio, um sem áudio e um vídeo suficientemente longo para cancelar durante o processamento. Para verificar os formatos, incluir MP4, MOV e AVI. A suite automatizada gera exemplos reproduzíveis pelo procedimento em `projects/test/video/README-b004.md`.

Todos os itens abaixo estão **por executar pela equipa**. Registar browser/versão, resultado e qualquer erro observado. Os testes automáticos de funções TypeScript não validam estes comportamentos do DOM/leitor.

- [ ] **Três painéis:** selecionar um vídeo concluído e abrir Recortar, Remover áudio e Velocidade. Confirmar metadados, labels e permissões. Em projeto só de leitura/sem sessão elegível, confirmar que não há submissão disponível.
- [ ] **Recorte ao milissegundo:** introduzir início `00:00:01.137` e fim `00:00:03.137` num vídeo com mais de 4 s. Confirmar duração prevista de 2 s e resultado com o segmento escolhido. Repetir com início zero.
- [ ] **Validação do recorte:** testar formato temporal incompleto, início negativo, fim anterior/igual ao início, fim além da duração e intervalo menor que um fotograma. Confirmar mensagem compreensível, submissão bloqueada, ausência de tarefa e quota intacta. Corrigir o valor e verificar recuperação da validação.
- [ ] **Scrubbing:** pausar o leitor num instante diferente e usar “Definir início” e “Definir fim”. Confirmar que os campos recebem a posição atual ao ms e a duração prevista acompanha os valores.
- [ ] **Loop preview:** escolher um intervalo curto, iniciar “Pré-visualizar corte” e observar pelo menos três ciclos entre os limites. Confirmar paragem pelo botão, ao editar os limites e ao fechar o painel. Confirmar que a pré-visualização não cria tarefa nem gasta crédito.
- [ ] **Confirmação de áudio:** escolher Remover áudio e confirmar que o primeiro clique abre a confirmação sem criar tarefa. Rejeitar/fechar a confirmação e verificar quota intacta. Reabrir, confirmar e reproduzir o resultado: imagem preservada e ausência de som. O original mantém áudio.
- [ ] **Vídeo sem áudio:** abrir Remover áudio num vídeo silencioso; confirmar bloqueio/mensagem e ausência de débito/tarefa.
- [ ] **Velocidade:** verificar os sete botões de 0.25× a 4×, introduzir `1.75` e confirmar duração estimada. Testar vazio, zero, negativo, 0.24, 4.01 e 1.0: mensagens e submissão bloqueada. Executar pelo menos 0.25× e 4× e ouvir o áudio para avaliar ritmo, pitch e sincronismo durante a reprodução.
- [ ] **Progresso e continuidade:** submeter num vídeo longo; confirmar estado de fila/processamento, percentagem e passo, ausência de submissões duplicadas e acompanhamento ao fechar/reabrir o painel. A conclusão deve atualizar a galeria sem recarregar a página.
- [ ] **Cancelamento:** durante progresso positivo, cancelar e confirmar estado final, ausência de resultado e devolução de um crédito para conta free. Reabrir o painel e confirmar que permite outra operação. Verificar também o comportamento se a conclusão ganhar a corrida ao cancelamento.
- [ ] **Galeria e informação:** verificar novo recurso para cada operação, reprodução/download, `sourceVideoIds`/receita no painel de informação e preservação do recurso original. Confirmar que MOV/AVI produzem MP4 H.264/AAC, ou sem áudio após a remoção.
- [ ] **Compatibilidade e geometria:** reproduzir no browser o resultado copiado de H.264 incompatível que usa preview; verificar rotação correta. Num vídeo de dimensões ímpares, confirmar dimensões preservadas na cópia e corte de 1 px para o par inferior na recodificação.
- [ ] **Regressão de imagem:** abrir uma imagem do projeto e usar o fluxo habitual de ferramentas/preview/processamento/resultado. Confirmar que os controlos de vídeo não interferem.

Após a execução, comunicar os itens aprovados e os que falharam. O bolt permanece `in-progress`, na etapa 5, até estes resultados e a aprovação explícita da equipa.
