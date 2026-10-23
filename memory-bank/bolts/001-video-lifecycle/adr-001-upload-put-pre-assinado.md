---
bolt: 001-video-lifecycle
created: 2026-10-21T23:44:49Z
status: accepted
superseded_by: null
---

# ADR-001: Carregamento de vídeo por PUT pré-assinado direto ao storage, com confirmação

## Context

O carregamento de vídeos (UC-VID-000) tem de aceitar ficheiros até 2 GB (Premium) e transferi-los em *streaming* com progresso e cancelamento (REQ-VID-UPLOAD-004/005/006/018). As rotas de upload de imagem existentes usam `multer.memoryStorage` no API Gateway, no serviço de projetos e no `imageStorageService`, o que carregaria o ficheiro inteiro em memória em cada salto. A regra 2.6 do ADD proíbe alterar essas rotas. O `nginx` não define `client_max_body_size` (vale 1 MB) e os `location` existentes não podem mudar. O ADD deixou a estratégia em aberto (Q-ADD-04), e o T-08 previa URLs de escrita só para a rede interna (worker).

## Decision

O navegador envia o ficheiro **diretamente para o SeaweedFS** com um **URL pré-assinado PUT**, através de um `location /s3-video/` novo no nginx (`client_max_body_size 2g`, `proxy_request_buffering off`, `proxy_buffering off`, `log_format video_s3` sem *query string*). O fluxo tem três passos no router de vídeo (D-11, D-15):

1. `POST /projects/:user/:project/videos/uploads` com `{fileName, mimeType, sizeBytes}`:
   - valida a permissão de edição, recusa o `anonymous` e verifica extensão, MIME e tamanho declarado contra o perfil;
   - cria o registo em `videos` com `status: queued`, com a chave `<projectId>/video_src/<videoId>.<ext>` derivada pelo servidor no bucket `user-<ownerId>`;
   - devolve o URL PUT público (900 s, `Content-Type` assinado).
2. O cliente faz o PUT com `XMLHttpRequest` (progresso e `abort`).
3. `POST …/videos/:video/upload/complete`: só para quem carregou e em `queued`. Verifica o objeto com `headObject` (existência, tamanho real igual ao declarado e dentro do limite), passa o vídeo a `processing` e inicia a ingestão.

O cancelamento é `DELETE …/videos/:video/upload` (apaga o objeto e o registo). Os registos `queued` nunca aparecem na galeria. Os carregamentos abandonados (`queued` há mais de 900 s + margem) são apagados pela rotina periódica da Q-ADD-14, no âmbito da B003.

## Rationale

O PUT pré-assinado é a única opção que transfere até 2 GB sem passar pela memória dos serviços, sem tocar em código existente e sem que os dados atravessem o API Gateway (coerente com a NFR-014 e com o *streaming* da UPLOAD-005). A confirmação explícita com `headObject` repõe no servidor as verificações que o URL sozinho não garante: o tamanho real e a existência do objeto.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| *Streaming* pelo gateway e pelo serviço de projetos (rotas novas com `busboy`/*pipe*) | Validação do tamanho durante a transferência; um só pedido | Dois saltos HTTP de 2 GB; `location` específico para as rotas de vídeo do gateway; *timeouts* longos nos serviços Node; mais código | Mais carga e mais pontos de falha, sem ganho funcional |
| Upload multipart S3 com URL por parte | Retoma por partes; ficheiros > 5 GB | Muito mais complexo (iniciar, URLs por parte, completar, abortar); a retoma de uploads não é pedida | Desnecessário para ≤ 2 GB |
| Sem registo até à confirmação, com *token* assinado | Nenhum registo em `videos` antes do envio | Estado num *token*; os objetos órfãos só se encontram varrendo o storage | O registo `queued` torna o cancelamento e a limpeza uniformes (D-15) |

## Consequences

### Positive

- Nenhuma linha de código existente muda: só um `location` e um `log_format` novos no nginx.
- O tráfego de 2 GB não passa pelos serviços Node nem pelo API Gateway.
- Progresso e cancelamento nativos do navegador.
- O cliente nunca escolhe a chave nem o bucket.

### Negative

- Três pedidos em vez de um.
- O tamanho só é verificado no servidor depois do envio: um Registado pode enviar até 2 GB (o limite do nginx) antes de ser rejeitado na confirmação. O PUT não pode ser limitado por perfil no nginx.
- Fica em `video_src` um objeto sem confirmação até à limpeza da B003, se o cliente abandonar.

### Risks

- **Assinatura com o *host* reescrito para `/s3-video/`.** O SeaweedFS pode recusar a assinatura se o cabeçalho `Host` não coincidir. Mitigação: seguir a reescrita e os cabeçalhos do `location /s3/` existente; verificar no Estágio 4.
- **Assinatura exposta nos logs.** Mitigação: o `log_format video_s3` regista `$uri` em vez de `$request_uri` (T-10).
- **Limpeza de abandonados depende da B003.** Até lá, os objetos abandonados ficam no storage. Mitigação: risco aceite; os registos `queued` são invisíveis.

## Related

- **Stories**: ST-VID-000 (B001); ST-VID-006 (B002, reutiliza o `/s3-video/` para o GET de descarregamento); ST-VID-COM-001 (B003, rotina da Q-ADD-14).
- **Standards**: candidato a `standards/system-architecture.md` ("transferências de ficheiros grandes vão diretamente ao storage com URLs pré-assinados").
- **Fontes**: ADD T-08, T-10, Q-ADD-04; specsDuvidas D-11, D-15, D-17, D-22.
- **Previous ADRs**: nenhum.
