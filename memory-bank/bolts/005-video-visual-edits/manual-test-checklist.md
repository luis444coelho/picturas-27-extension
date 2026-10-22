---
bolt: 005-video-visual-edits
stage: test
created: 2026-10-22T21:16:55Z
status: awaiting-user-execution
---

# Testes manuais no browser — pendentes da equipa

Abre a aplicação em `https://localhost:8080` com uma conta registada (free) e outra Premium, num projeto editável. Usa:
- um vídeo com áudio AAC (MP4);
- um AVI com áudio MP3;
- um vídeo filmado na vertical num telemóvel (com etiqueta de rotação);
- um vídeo com dimensões ímpares;
- uma imagem PNG com transparência e uma JPEG.

As fixtures geradas em `projects/test/video/README-b005.md` servem para isto. Para cada item, regista o browser e a versão, o resultado e qualquer erro observado.

- [ ] **Cinco botões:** num vídeo concluído aparecem "Marca de água", "Ajustar", "Filtros", "Redimensionar" e "Rodar / espelhar", ao lado dos da B004. Num projeto só de leitura ou numa sessão anónima, não aparecem.
- [ ] **Ajuste:** os três controlos começam em 1.00 e andam em passos de 0.05. A pré-visualização acompanha cada alteração. "Repor" volta a 1.00. Com os três neutros, a confirmação fica bloqueada. Executa um ajuste com saturação 0 e confirma tons de cinzento no início, meio e fim. **Compara a pré-visualização com o resultado no contraste e na saturação (D-67).**
- [ ] **Filtros:** há seis miniaturas do primeiro fotograma, só um filtro fica selecionado de cada vez, e a pré-visualização aparece em menos de 1 s. Executa Preto e Branco e Negativo e compara com a pré-visualização.
- [ ] **Redimensionar:** com a proporção bloqueada, 1000 de largura num vídeo de 1920×1080 dá 562. As predefinições dão 1080p, 720p, 480p e 360p, e num vídeo vertical aplicam-se à menor dimensão (D-64). Aparecem os avisos de distorção e de ampliação. Valores ímpares, abaixo de 128 ou acima do teto do perfil (free: 1920×1080) mostram a mensagem com o limite. Confirma o resultado com as dimensões exatas e na orientação certa.
- [ ] **Rodar / espelhar:** experimenta 90°, 180° e 270° e cada espelho. A pré-visualização mostra a transformação e as dimensões finais. 180° com os dois espelhos bloqueia a confirmação. Executa 90° com espelho horizontal num vídeo de telemóvel e confirma o resultado no leitor.
- [ ] **Marca de água de texto:** com o texto vazio, a confirmação fica bloqueada. Experimenta as cinco posições predefinidas e as coordenadas X/Y, a escala de 5 a 50% e a opacidade de 10 a 100%, sempre com a pré-visualização. Coordenadas fora do quadro mostram o erro. Executa e confirma que a marca fica fixa durante todo o vídeo e que o áudio se mantém.
- [ ] **Marca de água de imagem:** carrega um PNG com transparência e um JPEG. Um ficheiro acima de 1 MB ou noutro formato é recusado. Escolhe uma imagem da galeria do projeto. Executa sobre o AVI com MP3 e confirma que o resultado tem áudio AAC.
- [ ] **Progresso e cancelamento:** submete num vídeo longo. Confirma a percentagem, que não há submissões duplicadas e que o acompanhamento continua depois de fechar e reabrir o painel. Cancela durante o progresso: não fica resultado e a conta free recupera o crédito.
- [ ] **Uma tarefa por projeto (D-66):** com uma tarefa da B004 em curso, os botões de aplicar da B005 ficam desativados. Se o pedido chegar ao servidor, aparece a mensagem com o código de suporte.
- [ ] **Galeria e informação:** cada operação cria um recurso novo, que se reproduz e descarrega. O painel de informação mostra a origem e a receita, e o original não muda.
- [ ] **Regressão de vídeo:** recorte, remoção de áudio e velocidade da B004 continuam a funcionar.
- [ ] **Regressão de imagem:** o fluxo habitual (ferramentas da toolbar, incluindo Brightness, Resize, Rotate e Watermark de imagem, pré-visualização, processamento e resultado) funciona como antes e não interfere com os painéis de vídeo.

Depois da execução, comunica os itens aprovados e os que falharam. O bolt fica em `in-progress`, na etapa 3, até haver resposta à D-67, testes manuais e aprovação explícita da equipa.
