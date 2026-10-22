---
stage: implement
bolt: 002-video-access
created: 2026-10-22T13:44:28Z
---

## Implementation Walkthrough: 001-video-lifecycle (B002 — acesso a vídeos)

### Summary

Foram acrescentados os endpoints de informações (`GET …/videos/:video`) e de descarregamento (`GET …/videos/:video/download`) de vídeos, no serviço de projetos e no API Gateway, e o painel "Informações" e a ação "Descarregar" no frontend, na galeria e no leitor. O ficheiro vai do SeaweedFS ao navegador pelo `/s3-video/`, com o nome sugerido no atributo `download` da âncora (D-34). Nenhuma tarefa, mensagem AMQP ou chamada de quota é feita; a única chamada ao serviço de utilizadores é a leitura do tipo.

### Structure Overview

A lógica dos dois casos de uso está num módulo novo do serviço de projetos, com as dependências injetadas como no módulo de ingestão da B001, e é exposta por duas rotas acrescentadas ao router de vídeo, atrás das mesmas verificações de leitura que as rotas de listagem e reprodução da B001. O gateway só acrescenta as duas rotas ao seu router de vídeo, que já trata a autenticação, a correlação e o formato dos erros. No frontend, os formatadores ficam num módulo sem dependências (testável com o Node), as chamadas à API noutro, e três componentes novos (painel, diálogo de descarregamento e barra de ações) ligam-se ao leitor e à galeria da B001 com uma linha de `import` e um elemento cada. O storage e o nginx não mudam: a B001 já construiu o `/s3-video/`, o `log_format` sem *query string*, o `error_log crit` e o `headObject`.

### Completed Work

- [x] `projects/video/fileName.js` - Função única do nome sugerido: nome original sem extensão, operações do `recipe` pela ordem unidas por `_` (D-35) e extensão do contentor armazenado.
- [x] `projects/video/access.js` - Informações (metadados persistidos, atributos sem metadado com o aviso `METADATA_UNAVAILABLE`, proveniência com origens removidas, passos e nome sugerido; só o estado para vídeos por concluir) e emissão do URL de descarregamento (estado `completed`, verificação do `original_key`, URL de 15 min, registo da emissão sem o URL).
- [x] `projects/routes/videos.js` - Por acréscimo: as duas rotas de leitura, com `checkSharePermission`, `loadProject`, `rejectAnonymous` e `loadVideo`.
- [x] `projects/video/errors.js` - Por acréscimo: código `RESOURCE_UNAVAILABLE` (404) e a sua mensagem.
- [x] `apiGateway/routes/videos.js` - Por acréscimo: as duas rotas com `checkVideoToken`.
- [x] `frontend/lib/video-format.ts` - Formatadores do painel: duração `hh:mm:ss.mmm`, resolução de apresentação, formato com contentor e codecs (ou "sem áudio"), tamanho em MB/GB base 1024, fps com 2 casas.
- [x] `frontend/lib/video-access.ts` - Tipos e chamadas das duas rotas; início do descarregamento por uma âncora `href` com o atributo `download`.
- [x] `frontend/components/video/video-info-panel.tsx` - Painel "Informações", com "Indisponível", proveniência ("Vídeo removido") e passos aplicados.
- [x] `frontend/components/video/video-download-dialog.tsx` - Os dois momentos do descarregamento: nome, formato e tamanho primeiro; o URL só na confirmação.
- [x] `frontend/components/video/video-actions.tsx` - Botões "Informações" e "Descarregar"; ocultos para anónimos e "Descarregar" desativado (com `RESOURCE_NOT_READY`) para vídeos por concluir.
- [x] `frontend/components/video/video-player.tsx` - Por acréscimo: ações no leitor (aberto a partir da lista da área principal e da janela "Vídeos").
- [x] `frontend/components/video/video-gallery.tsx` - Por acréscimo: ações por item na galeria da janela "Vídeos".
- [x] `frontend/lib/videos.ts` - Por acréscimo: mensagem de `RESOURCE_UNAVAILABLE`.

### Key Decisions

- **Lista `unavailable` calculada no serviço:** o serviço já tem de decidir que atributos faltam para registar `METADATA_UNAVAILABLE` (INFO-009); devolvê-la evita que o frontend repita a regra e distingue "sem áudio" (`audioCodec: null`) de metadado em falta.
- **Instância de `access` criada no router:** o `projects/video/index.js` da B001 exporta só `ingest` e `start`, e a linha de `module.exports` não pode mudar; o router cria a sua instância com as mesmas dependências.
- **Ações no leitor e não nos itens da lista da área principal:** os itens dessa lista são botões, que não podem conter outros botões; o leitor que eles abrem tem as ações.
- **Mesma resposta de erro para dono errado e sem acesso:** é o `videoAuth` da B001 (403) e o `checkSharePermission` (403/410) que decidem, como nas rotas de leitura da B001.

### Deviations from Plan

- Os formatadores ficaram em `frontend/lib/video-format.ts`, separados de `video-access.ts`: o `video-access.ts` importa o cliente `axios` da aplicação, que o Node não carrega nos testes por *type stripping*. O tamanho tem um formatador próprio (`formatFileSize`), com a regra da INFO-005, em vez de reutilizar o `formatSize` de `lib/videos.ts` pela mesma razão; os dois dão o mesmo resultado.
- Nenhum ficheiro do `imageStorageService` nem do `nginx` foi tocado (D-34 (a)).

### Dependencies Added

Nenhuma.

### Developer Notes

- Verificação no stack depois do *rebuild* (`--no-deps` de `projects`, `api_gateway` e `frontend`): AVI carregado como `Férias São João.avi` → informações completas com `unavailable: []`; descarregamento `{url, fileName, expiresAt}` com 15 min; ficheiro com o mesmo hash e `Content-Type: video/x-msvideo`; `Range` → 206; antes da ingestão, informações só com o estado e descarregamento 409 `RESOURCE_NOT_READY`; sem token 401, anónimo 403, caminho de outro dono 403, id inválido 404. O registo `video.download.issued` tem `correlationId`, utilizador, vídeo e projeto, e não há assinaturas nos logs do serviço nem do nginx.
- O utilizador, o projeto e o vídeo criados nesta verificação são apagados com os dados de teste no fim do Estágio 3.
- Typecheck (`tsc --noEmit`), ESLint e Prettier sem erros nos ficheiros novos e alterados. `git diff` sobre o código anterior: 0 linhas removidas.
