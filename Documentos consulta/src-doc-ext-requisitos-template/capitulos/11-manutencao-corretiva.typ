#import "../template.typ": *

= Manutenção Corretiva da Solução de Base

#orientacao[
  Problemas encontrados na solução de base durante o estudo e a integração do vídeo (erros, incoerências com o
  documento de requisitos, dificuldades de execução). Indiquem se foram corrigidos nesta fase. Capítulo
  recomendado; removam-no se não houver nada a registar.
]

#tab([Tarefas de manutenção corretiva],
  tabela(
    colunas: (1.2cm, 1fr, 2.4cm, 1.6cm, 2cm, 1.8cm),
    tamanho: 8.5pt,
    [ID], [Descrição do problema], [Impacto], [Prioridade], [Rel. Req.], [Estado],
    [T-01], [A integração de vídeo precisava de coleções próprias, locks por projeto e limpeza de recursos abandonados, sem alterar o documento de projeto da baseline.], [Funcional / integridade], [Alta], [REQ-VID-STORAGE-001; NFR-006/017], [Corrigido],
    [T-02], [Os contratos de mensagens e os estados assíncronos precisavam de confirmação manual, reentrega limitada, idempotência e cancelamento separado da limpeza física.], [Funcional / fiabilidade], [Alta], [REQ-VID-TASK-001 a 007], [Corrigido],
    [T-03], [A execução de vídeo precisava de um worker com FFmpeg/FFprobe e de transferência direta para o storage, evitando transportar binários pelo gateway.], [Arquitetura / desempenho], [Alta], [REQ-VID-NFR-009/014], [Corrigido],
    [T-04], [A pré-visualização visual e as fórmulas de ajuste tinham de permanecer coerentes entre sharp no servidor e FFmpeg no worker.], [Funcional / consistência], [Média], [REQ-VID-NFR-013], [Corrigido],
    [T-05], [A expectativa histórica 126/127 da ferramenta de brilho varia entre arquiteturas; a diferença foi isolada como falha da baseline e não como regressão do vídeo.], [Teste de regressão], [Baixa], [Baseline], [Pendente na baseline],
  ),
)

== Retificação

As linhas T-01 a T-03 descrevem decisões de arquitetura e implementação do incremento, não problemas corretivos da solução de base. Para manutenção corretiva devem ser consideradas apenas as situações seguintes:



As correções foram acompanhadas por testes unitários, de integração e E2E. A equipa não alterou o comportamento original de imagem para mascarar a falha dependente de arquitetura.
