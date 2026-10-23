---
created: 2026-10-23
status: accepted
superseded_by: null
---

# ADR-015: Nome apresentado dos resultados de vídeo acompanha o contentor real

## Contexto

O `resultVideo` da B003 copia o `original_name` da origem. Por isso, um resultado AVI pode aparecer como `.mp4` na galeria, no leitor e na informação (D-73). O nome sugerido no descarregamento já usa o contentor armazenado e acrescenta os identificadores das operações (D-35, `fileName.js`). A regra 2.6 do ADD só admite linhas novas no código existente.

## Decisão

Acrescentar a `projects/models/video.js`, antes de `mongoose.model`, um hook `pre("validate")` que atua apenas em documentos novos com `task_id` preenchido. O hook mantém o nome base da primeira origem e substitui a sua última extensão por `formats.CONTAINERS[meta.container].extension`, sem sufixos de operações. Os originais da ingestão e os resultados já existentes na base de dados conservam os nomes atuais. O sufixo das operações continua exclusivo de `fileName.js` no descarregamento.

## Alternativas

1. Alterar a atribuição em `tasks.js`: substitui linhas existentes e contraria o ADD 2.6.
2. Corrigir apenas cada interface: deixa o documento com um nome incoerente e dispersa a regra por várias vistas.

## Consequências e estado de execução

Para um resultado AVI criado a partir de `Quando Tu Entras Em Campo - SC Braga.mp4`, o nome apresentado é `Quando Tu Entras Em Campo - SC Braga.avi` e o descarregamento é `Quando Tu Entras Em Campo - SC Braga_convert.avi`. A D-76 esclareceu que a asserção histórica usa uma coleção falsa e testa apenas `tasks.js`; continua válida. Testes novos com o schema real cobrem o hook. A D-77 foi resolvida com o merge da B007 em `origin/main` antes de criar o ramo desta correção.

## Referências

ADD 2.6, 4.1 e 4.2; REQ-VID-DOWNLOAD-005; REQ-VID-INFO; D-35, D-73, D-75, D-76 e D-77.
