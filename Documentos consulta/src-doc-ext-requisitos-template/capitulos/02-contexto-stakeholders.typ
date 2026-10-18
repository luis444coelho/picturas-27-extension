#import "../template.typ": *

= Contexto, Perfis e _Stakeholders_ (revisão)

#orientacao[
  Capítulo de *revisão*: só registam o que muda com o vídeo. Não copiem o documento de base.
  - Os *perfis de utilização* (anónimo, registado, premium) continuam válidos? Que limites passam a
    existir para vídeo (duração, tamanho, resolução, nº de operações)? Um vídeo conta como uma operação?
  - Surgem *novos _stakeholders_* ou *interesses novos* nos existentes (e.g., custo de processamento e armazenamento
    para o proprietário do sistema; equipa de operações)?
  - Os _stakeholders_ aqui listados devem ser os mesmos que aparecem na secção "_Stakeholders_ e Interesses"
    de cada caso de uso — usem os mesmos nomes.
]

== Perfis de utilização e vídeo

A introdução de fluxos contínuos audiovisuais acarreta uma exigência computacional e volumétrica substancialmente superior à manipulação de imagens estáticas. Por esse motivo, as políticas de acesso e os limites operacionais foram reavaliados e diferenciados em função do perfil do utilizador.

#tab([Perfis de utilização e respetivo acesso a vídeo],
  tabela(
    colunas: (2.4cm, 3.8cm, 1fr, 3.2cm),
    [Perfil], [Situação na _baseline_], [Alteração introduzida para vídeo], [Regras / requisitos],
    [Anónimo], [Operações limitadas, imagens pequenas, sem projetos persistidos.], [Acesso expressamente excluído. O suporte a vídeo requer persistência em projetos autenticados e gestão de recursos para prevenção de abusos de infraestrutura.], [RNG-01, REQ-VID-AUTH-002, DQ-001],
    [Registado], [Conta gratuita com autenticação; limite de 5 operações diárias sobre imagens.], [Mantém a quota de 5 operações/dia para tarefas de manipulação de vídeo (1 operação = 1 crédito). Upload e visualização no reprodutor são isentos de quota. Limites contratuais de vídeo: duração $<= 5$ min, tamanho $<= 200$ MB, máx. 50 fotogramas na extração e máx. 1 tarefa ativa por projeto. Estorno automático de quota em caso de cancelamento ou falha.], [RNG-02, RNG-03, RNG-04, REQ-VID-QUOTA-001..006, REQ-VID-NFR-008, DQ-001, DQ-005, DQ-011],
    [Premium], [Subscrição paga; operações diárias ilimitadas sobre imagens.], [Operações diárias ilimitadas sobre vídeo (sem débito de quota). Limites alargados de capacidade: duração $<= 60$ min, tamanho $<= 2$ GB, máx. 500 fotogramas na extração e máx. 1 tarefa ativa por projeto. Prioridade no processamento assíncrono.], [RNG-02, RNG-03, REQ-VID-QUOTA-005, REQ-VID-NFR-008, DQ-001, DQ-005],
  ),
)

== _Stakeholders_ e interesses

A extensão a vídeo digital introduz novas preocupações operacionais — nomeadamente o tempo de processamento assíncrono, a integridade de ficheiros parciais e o custo de armazenamento de grandes binários —, motivando a revisão dos interesses dos intervenientes e o reconhecimento de novos _stakeholders_.

#tab([_Stakeholders_ e interesses (novos ou revistos)],
  tabela(
    colunas: (3.2cm, 1.8cm, 1fr, 1.8cm, 3.2cm),
    [_Stakeholder_], [Estado], [Interesse(s) relativamente ao vídeo], [Influência], [UC / requisitos],
    [Utilizador Registado], [Revisto], [Usufruir de ferramentas essenciais de edição de vídeo sem custos, carregar e pré-visualizar vídeos sem esgotar quota diária, e contar com garantias de estorno de quota perante cancelamento ou falhas do sistema.], [Alta], [UC-VID-000 a 005, REQ-VID-QUOTA-001..006],
    [Utilizador Premium], [Revisto], [Processar vídeos de grande duração e dimensão (até 2 GB e 60 min) e gerar lotes extensos de fotogramas sem restrições de quota diária, usufruindo de execução contínua em segundo plano.], [Alta], [UC-VID-000 a 005, REQ-VID-QUOTA-005],
    [Proprietário da Plataforma / Negócio], [Novo], [Garantir a sustentabilidade económica da plataforma controlando os custos de computação e armazenamento de vídeo; alavancar os limites diferenciados para promover a conversão de utilizadores Registados em subscritores Premium.], [Alta], [DQ-001, DQ-005, RNG-02, RNG-03],
    [Equipa de Infraestrutura / DevOps], [Novo], [Evitar a degradação de largura de banda e saturação de disco no storage de objetos (SeaweedFS/S3); isolar o processamento pesado de vídeo em filas dedicadas (RabbitMQ) e contentores especializados com FFmpeg.], [Alta], [DQ-004, REQ-VID-NFR-006, REQ-VID-NFR-010, REQ-VID-NFR-011],
    [Sistema PictuRAS], [Revisto], [Assegurar a integridade transacional dos projetos, a imutabilidade dos vídeos de origem e a política tudo-ou-nada, garantindo que falhas e cancelamentos nunca deixam ficheiros órfãos ou dados parciais.], [Alta], [DQ-003, DQ-007, REQ-VID-COM-001..003, REQ-VID-NFR-007],
  ),
)

== Elicitação de requisitos

A elicitação de requisitos, regras de negócio e parâmetros quantitativos resultou de uma análise técnica iterativa conduzida pela equipa, fundamentada em quatro pilares metodológicos:

1. *Análise da Solução Existente*: Estudo exaustivo dos contratos de API, esquemas MongoDB e mecanismos de mensageria AMQP da _baseline_, assegurando que o suporte a vídeo se integra sem quebra de compatibilidade com os módulos legados de imagem.
2. *_Benchmarking_ de Formatos e Codecs*: Seleção determinística do contentor MP4 com codecs H.264 (vídeo) e AAC (áudio) devido à sua universalidade de descodificação acelerada por hardware em todos os navegadores web modernos através da tag HTML5 `<video>`, eliminando a necessidade de transcodificação síncrona no MVP (`DQ-002`, `REQ-VID-NFR-003`).
3. *Dimensionamento Técnico de Limites Operacionais*: Os limites de 5 minutos e 200 MB para o perfil Registado foram calibrados para acomodar clipes curtos típicos de redes sociais e demonstração académica, garantindo que o tempo de codificação em nós de desenvolvimento locais em Docker se mantém dentro de limiares aceitáveis ($\le 30$ a 60 segundos); os limites alargados de 60 minutos e 2 GB para utilizadores Premium refletem a necessidade de edição de gravações longas sem sobrecarregar prematuramente a infraestrutura de armazenamento no MVP (`DQ-005`, `REQ-VID-NFR-008`).
4. *Coerência do Modelo Transacional de Quotas*: Definiu-se que cada tarefa concluída de manipulação consome exatamente 1 crédito da quota diária de 5 operações do utilizador Registado, com reserva transitória no estado `queued`, consolidação definitiva no estado `completed` e estorno imediato em `failed` ou `cancelled` (`DQ-001`, `DQ-007`, `REQ-VID-QUOTA-001..004`). Em contrapartida, instituiu-se a isenção absoluta de consumo de quota para o carregamento e reprodução de vídeos (`DQ-011`, `REQ-VID-UPLOAD-014`), promovendo a adoção da plataforma e incentivando a constituição de mediatecas de trabalho nos projetos.
