#import "../template.typ": *

= Manutenção Corretiva e Problemas Encontrados

#orientacao[
  Registem problemas concretos encontrados durante a integração e validação do suporte a vídeo. Não incluam aqui
  decisões arquiteturais ou componentes simplesmente acrescentados; esses elementos são descritos no Capítulo 8.
  Para cada problema, indiquem o impacto, a prioridade, o requisito relacionado, o estado e a evidência.
]

A integração de vídeo exigiu distinguir três tipos de intervenção: a extensão funcional da plataforma, a correção de defeitos introduzidos no incremento e o tratamento de limitações herdadas da solução de base. A criação de coleções de vídeo, de filas específicas, de mecanismos de exclusão por projeto e de um worker com FFmpeg constitui evolução arquitetural, descrita no Capítulo 8. Esses elementos não são apresentados como correções de funcionalidades que a solução de base já devesse disponibilizar.

A manutenção corretiva aqui registada incide nos problemas encontrados ao reutilizar autenticação, mensageria e processamento de imagens. Os estados distinguem a correção efetiva, a mitigação limitada ao vídeo e a necessidade de confirmação ou intervenção posterior. Uma ocorrência descrita num relatório de testes não demonstra que o problema persista em todas as condições; do mesmo modo, uma solução específica de vídeo não prova a correção do mecanismo original de imagem. As prioridades indicadas orientam o trabalho remanescente, considerando o impacto e a evidência disponível.

#tab([Tarefas de manutenção corretiva],
  tabela(
    colunas: (1.2cm, 1fr, 2.4cm, 1.6cm, 2cm, 1.8cm),
    tamanho: 8.5pt,
    [ID], [Descrição do problema], [Impacto], [Prioridade], [Rel. Req.], [Estado],
    [T-01], [A emissão de JWT herdada da solução de base mantém uma validade de sete dias, enquanto a ERS da extensão fixa uma hora. Existe, assim, um desvio face ao alvo aprovado.], [Segurança e conformidade], [Alta], [REQ-VID-NFR-001], [Pendente],
    [T-02], [O consumidor RabbitMQ original do WS Gateway não assegura religação automática após perda de ligação. O vídeo dispõe de ligação própria com recuperação; essa solução não foi generalizada ao fluxo de imagem.], [Fiabilidade e disponibilidade de eventos], [Média], [REQ-VID-NFR-006/010; solução de base], [Mitigado no vídeo; pendente na base],
    [T-03], [A regressão de Brilho de imagem espera o píxel 127, mas a imagem de ensaio gerada em aarch64 pode produzir 126 após a transformação. A expectativa fixa não considera o valor efetivo da origem; não foi demonstrado um defeito no algoritmo de produção.], [Portabilidade e fiabilidade dos testes], [Baixa], [Regressão de imagem; REQ-VID-NFR-010], [Teste histórico por rever],
  ),
)

