# Checklist manual no browser — B007

Executar no projeto de teste com `test_reencode` desligada. Abrir a aplicação em `https://localhost:8080` num navegador de referência, entrar como utilizador com permissão de edição e importar os ficheiros de `Tools/video/tests/generate_convert_fixtures.py`. Os itens assinalados foram aprovados pela equipa no checkpoint da etapa 3; os restantes ficam por verificar. A matriz automatizada e a reprodução VLC constam de `test-walkthrough.md`.

## Verificações manuais aprovadas pela equipa

- [x] MP4 → MOV por cópia direta.
- [x] MP4 → AVI por recodificação; o AVI descarregado reproduz imagem e som no VLC.
- [x] AVI H.264/MP3 → MP4.
- [x] MOV → AVI.
- [x] Vídeo sem áudio → AVI, sem pista de som como esperado.
- [x] Galeria e painel de informação apresentam os resultados; o nome herdado da origem tem o risco residual D-73.
- [x] Regressão B004: recorte de vídeo.
- [x] Regressão B005: filtro de vídeo.
- [x] Regressão de imagem: ferramenta Brilho.
- [ ] QuickTime e Windows Media Player: **não testados** nesta validação da NFR-026.

**Riscos residuais aceites:** D-73 (nome apresentado conserva a extensão da origem; o download usa a extensão correta) e D-74 (numa conta free, o crédito é debitado no servidor, mas o contador da sessão não é atualizado pelo fluxo de vídeo).

## Painel e aceitação

- [ ] Em MOV H.264/AAC, «Converter formato» apresenta «MOV (H.264 / AAC)» e só oferece MP4 e AVI.
- [ ] MP4 H.264/AAC → MOV mostra «Cópia direta (sem perda de qualidade)» antes de confirmar. A validação devolve `videoMode=copy`, `audioMode=copy`.
- [ ] MP4 H.264/AAC → AVI mostra «Recodificação» e MPEG-4/MP3. A validação devolve `videoMode=encode`, `audioMode=encode`.
- [ ] AVI H.264/MP3 → MP4 mostra «Recodificação» com detalhe de vídeo copiado e áudio recodificado. A validação devolve `videoMode=copy`, `audioMode=encode`.
- [ ] A confirmação cobra um crédito, mostra progresso, cria um vídeo novo e mantém o original. A galeria, a informação e o download apresentam o contentor/codecs e o nome da saída corretos.
- [ ] Pedido direto à API com destino igual à origem devolve `SAME_FORMAT`; com `webm` devolve `UNSUPPORTED_TARGET_FORMAT`; ambos mantêm a quota e não criam tarefa.

## Reprodução no leitor integrado

Reproduzir do início ao fim, procurar no meio e regressar ao início. Verificar imagem e som quando houver áudio; sem áudio, verificar ausência de erro e de pista sonora.

| Origem → destino | Ficheiro de fixture | Cópia esperada no leitor |
|---|---|---|
| MP4 → MOV | `base.mp4` | MP4 de pré-visualização |
| MP4 → AVI | `base.mp4` | MP4 de pré-visualização |
| MOV → MP4 | `base.mov` | resultado MP4 |
| MOV → AVI | `base.mov` | MP4 de pré-visualização |
| AVI H.264/MP3 → MP4 | `h264.avi` | resultado MP4 |
| AVI H.264/MP3 → MOV | `h264.avi` | MP4 de pré-visualização |
| MP4 sem áudio → AVI | `silent.mp4` | MP4 de pré-visualização, sem áudio |
| MP4 129×97 → AVI | `odd.mp4` | MP4 de pré-visualização, 128×96 |
| MP4 129×97 → MOV | `odd.mp4` | MP4 de pré-visualização, 129×97 |
| AVI H.264 4:4:4 → MP4 | `incompatible.avi` | MP4 de pré-visualização H.264 4:2:0 |

- [ ] Todos os dez percursos acima reproduzem no leitor integrado. Registar navegador, versão, sistema operativo e qualquer falha.
- [ ] Para AVI, o resultado descarregado reproduz do início ao fim em VLC; a cópia MP4 é usada apenas no leitor. Repetir para MOV e MP4 em Safari, Chrome e Firefox disponíveis e, quando aplicável, QuickTime/Windows Media Player, conforme NFR-026.
- [ ] Durante uma conversão longa para AVI, cancelar no painel: o progresso termina como cancelado, não aparece resultado, o crédito volta e uma nova tarefa pode começar.
- [x] Abrir um projeto de imagem, aplicar Brilho e descarregar o resultado; o fluxo de imagem continua funcional.
