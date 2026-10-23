---
bolt: 008-video-concat-chain
stage: test
created: 2026-10-23T15:16:41Z
status: pending
---

# Testes manuais no browser — B008 depois da revisão (a executar pela equipa)

Esta checklist substitui a da primeira etapa 5, que a equipa não aprovou.

Abrir a aplicação em `https://localhost:8080` com uma conta **Registada** (free), uma **Premium** e uma **anónima**, num projeto editável. Os vídeos de exemplo saem de `Tools/video/tests/generate_composition_fixtures.py` (`odd.mp4` 321×241, `wide.mp4` 16:9, `tall.mp4` 9:16 sem áudio, `phone.mp4` com rotação, `long.mp4` de 90 s, `short.mp4` de 0,5 s, `mark.png`), pelo procedimento de `projects/test/video/README-b008.md`. Registar browser e versão, o resultado e qualquer erro observado.

O teste automático `e2e-panels-ui.test.js` já comparou o DOM dos nove painéis com o da `origin/main`, antes e depois de uma interação (9/9 iguais). Os itens abaixo verificam o que esse teste não vê: aspeto, arrasto, reprodução e resultado.

## 1. Edição simples (deve estar igual à anterior, D-87)

Em cada painel, abrir o leitor de `wide.mp4`, usar o painel como antes da B008 e executar uma vez:

- [ ] **Recortar:** campos `hh:mm:ss.mmm`, "Definir início/fim" com o leitor, "Pré-visualizar corte" em ciclo, duração prevista, "Recortar · 1 crédito".
- [ ] **Remover áudio:** texto, janela de confirmação "Confirmar remoção do áudio", "Voltar"/"Confirmar"; num vídeo sem áudio, o botão fica desativado com a indicação.
- [ ] **Velocidade:** botões 0.25× a 4×, campo do fator, mensagens para 1.0, 0.1 e vazio, duração prevista.
- [ ] **Marca de água:** separadores Texto/Imagem, ficheiro e galeria, posições predefinidas e coordenadas, escala e opacidade, pré-visualização no fotograma.
- [ ] **Ajustar:** três *sliders* com passo 0.05 e valor visível, "Repor", pré-visualização.
- [ ] **Filtros:** grelha de seis miniaturas, seleção única, pré-visualização.
- [ ] **Redimensionar:** largura/altura, cadeado de proporção, predefinições 1080p/720p/480p/360p, avisos de distorção e de ampliação, dimensões finais.
- [ ] **Rodar / espelhar:** 90°/180°/270°, espelhos, dimensões finais, mensagem sem alteração.
- [ ] **Converter formato:** formato atual, destinos, "Cópia direta"/"Recodificação", "Converter · 1 crédito".

## 2. Aplicar várias operações (botão no leitor)

- [ ] O botão aparece para quem edita e não aparece para o `anonymous` nem para quem só tem leitura.
- [ ] Acrescentar pelo menos 12 operações (conta Premium), cada uma configurada com o **mesmo** painel da edição simples. Reordenar por arrasto e com as setas, e remover uma.
- [ ] Um recorte depois de uma velocidade mostra os campos, sem leitor, com a indicação "O recorte aplica-se ao resultado do passo anterior", e os limites da duração estimada (D-89).
- [ ] Custo "N créditos (sem débito no Premium)", duração estimada e erros no passo indicado.
- [ ] Executar: "Passo k de N" a avançar, um só vídeo final na galeria e o original igual.
- [ ] Predefinições: guardar a lista, carregá-la noutro vídeo e mudar-lhe o nome; um nome repetido mostra o erro.
- [ ] Conta Registada com 6 ou mais passos: aviso dos 5 créditos diários; Executar mostra o erro de quota e não cria tarefa.

## 3. Juntar vídeos (botão na janela "Vídeos")

- [ ] Escolher 12 ou mais vídeos (Premium), com repetições; reordenar e remover. A linha temporal mostra a duração total, e o resumo mostra a resolução e os fps do primeiro.
- [ ] Não há operações neste fluxo; o custo é 1 crédito, qualquer que seja o número de vídeos.
- [ ] Com menos de 2 vídeos, "Executar" fica desativado.
- [ ] Executar e reproduzir: ordem certa, barras pretas no 9:16 e no vídeo rodado, silêncio no vídeo sem áudio, nome `odd.mp4` (primeiro) e descarregamento `odd_concat.mp4`.

## 4. Movie Maker (botão na janela "Vídeos")

- [ ] Acrescentar 3 vídeos: dar cadeias diferentes a dois (por exemplo, Recortar + Filtro e Velocidade + Ajustar) e deixar um vazio. Reordenar os vídeos.
- [ ] Acrescentar 2 ou mais operações em "Operações depois da junção" (por exemplo, Rodar + Marca de água); a conversão só é possível nessa lista.
- [ ] Custo = 1 + operações dos vídeos + operações finais; a duração e a resolução estimadas atualizam-se.
- [ ] Executar: uma só tarefa e um só vídeo final, com cada clip editado à sua maneira e as operações finais no vídeo inteiro.
- [ ] Cancelar durante o progresso: sem resultado, com os créditos devolvidos na conta Registada.

## 5. Recusas e falhas

- [ ] Conta anónima: nenhum dos três botões aparece; pela API, as rotas respondem 403.
- [ ] Forçar uma falha (por exemplo, apagar o ficheiro original no storage antes de executar): mensagem com a fase e o código de suporte, sem resultado, créditos devolvidos.

## 6. Regressão de imagem

- [ ] Abrir uma imagem do projeto e usar o fluxo habitual de ferramentas, pré-visualização, processamento e resultado. O diálogo de predefinições de imagem não mostra as predefinições de vídeo.

Após a execução, comunicar os itens aprovados e os que falharam. O bolt continua `in-progress`, na etapa 5, até estes resultados e a aprovação explícita da equipa.
