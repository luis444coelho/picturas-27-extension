---
bolt: 008-video-concat-chain
stage: test
created: 2026-10-23T01:32:45Z
status: pending
---

# Testes manuais no browser — B008 (a executar pela equipa)

Abrir a aplicação em `https://localhost:8080` com uma conta **Registada** (free) e outra **Premium**, num projeto editável. Os vídeos de exemplo saem do gerador `Tools/video/tests/generate_composition_fixtures.py` (`odd.mp4` 321×241, `wide.mp4` 16:9, `tall.mp4` 9:16 sem áudio, `phone.mp4` com rotação, `long.mp4` de 90 s, `mark.png`), pelo procedimento de `projects/test/video/README-b008.md`. Registar browser e versão, o resultado e qualquer erro observado. Os testes automáticos não validam o DOM, o arrasto nem a reprodução no leitor integrado.

## Junção (UC-VID-013)

- [ ] **Entrada:** na janela "Vídeos", o botão "Juntar vídeos" aparece para quem edita e não aparece para o `anonymous` nem para quem só tem leitura.
- [ ] **Linha temporal:** escolher `odd`, `wide`, `tall`, `phone` e outra vez `odd`. Confirmar a ordem de seleção (CONCAT-001/002), "5 de 10 clips" (Registado) ou "de 50" (Premium), a duração total (11 s) e "320×240 a 25 fps" (CONCAT-004, 012).
- [ ] **Reordenar e remover:** arrastar um clip e usar as setas; remover um clip; confirmar a nova ordem e a duração recalculada (CONCAT-003, 013). Com um só clip, "Executar" fica desativado.
- [ ] **Executar e reproduzir:** acompanhar o progresso; no fim, o vídeo novo aparece na galeria com o nome `odd.mp4`. Reproduzir: clips pela ordem com corte seco, barras pretas no 9:16 e no vídeo de telemóvel, silêncio no clip sem áudio, sem deformação (CONCAT-008 a 010). Os vídeos de origem não mudam.
- [ ] **Informação e descarregamento:** o painel de informação mostra a receita e as origens; o descarregamento sugere `odd_concat.mp4` (D-35, D-75).
- [ ] **Limites:** com a conta Registada, 11 clips → mensagem de limite de 10; quatro vezes `long` → mensagem de duração (6 min > 5 min). Sem tarefa nem débito.

## Cadeia (UC-VID-014)

- [ ] **Entrada:** no leitor de um vídeo, "Encadear operações" abre o editor com "0 de 10 passos · 0 créditos".
- [ ] **Compor:** acrescentar Recortar, Marca de água (texto) e Filtro; confirmar o contador "3 de 10 passos · 3 créditos", a duração estimada e a validação a cada alteração (CHAIN-001, 003, 009). Configurar um parâmetro inválido (velocidade 9×) e ver o erro no passo indicado.
- [ ] **Reordenar e remover passos:** arrastar e usar as setas; remover um passo e confirmar o custo recalculado (CHAIN-004, 015).
- [ ] **Regras:** pôr "Converter formato" antes de outro passo → mensagem "A conversão de formato só pode ser o último passo"; com 10 passos, "Acrescentar passo" fica desativado (CHAIN-008, 016).
- [ ] **Aviso de quota (Registado):** com 6 passos aparece o aviso dos 5 créditos diários (DQ-025); executar mostra `QUOTA_EXCEEDED` sem débito.
- [ ] **Composição:** num editor com passos, "Acrescentar junção" passa o vídeo a clip 1 com os seus passos; acrescentar `phone` com Velocidade 2× e `odd` com Marca de água; acrescentar "Rodar e espelhar" depois da junção. Executar e reproduzir: sub-cadeias aplicadas a cada clip e rotação no resultado inteiro (CHAIN-005, 006).
- [ ] **Passo k de N e cancelamento:** numa cadeia sobre `long`, confirmar "Passo k de N" a avançar e a percentagem; cancelar durante o progresso; confirmar estado cancelado, nenhum resultado e os créditos devolvidos na conta Registada (CHAIN-012, 013).
- [ ] **Converter no fim:** cadeia Ajustar → Converter para MOV e para AVI; o resultado aparece com `.mov`/`.avi`, reproduz no leitor integrado (cópia MP4) e o ficheiro descarregado abre no VLC.
- [ ] **Falha:** forçar uma falha (por exemplo, apagar o ficheiro original no storage antes de executar) e confirmar a mensagem com a fase ("ao descarregar os vídeos") e o código de suporte (D-82).

## Predefinições de vídeo (CHAIN-014, D-83, D-84)

- [ ] **Guardar:** numa cadeia sem junção, "Guardar como predefinição" com um nome; aparece na lista. Com junção, o botão está desativado e há a explicação.
- [ ] **Nome repetido:** guardar outra com o mesmo nome em maiúsculas → mensagem de nome repetido.
- [ ] **Carregar:** numa cadeia nova (e na sub-cadeia de um clip), "Carregar" substitui os passos depois da confirmação; os parâmetros vêm preenchidos.
- [ ] **Mudar o nome e apagar:** as duas ações refletem-se na lista.
- [ ] **Marca de imagem noutro projeto:** guardar uma predefinição com marca de imagem, abri-la noutro projeto e confirmar o erro de marca no passo, que pede outra imagem (D-84).
- [ ] **Imagem:** o diálogo de predefinições de imagem não mostra as predefinições de vídeo.

## Regressão

- [ ] **Operações isoladas:** Recortar (B004), Filtro (B005) e Converter (B007) continuam a funcionar e a acompanhar a tarefa como antes.
- [ ] **Imagem:** abrir uma imagem do projeto e usar o fluxo habitual de ferramentas, pré-visualização, processamento e resultado.

Após a execução, comunicar os itens aprovados e os que falharam. O bolt permanece `in-progress`, na etapa 5, até estes resultados e a aprovação explícita da equipa.
