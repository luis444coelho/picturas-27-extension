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
  [Anónimo], [Operações limitadas, imagens pequenas, sem projetos persistidos.], [Acesso expressamente excluído. O suporte a vídeo requer persistência em projetos autenticados e gestão de recursos para prevenção de abusos de infraestrutura.], [REQ-VID-AUTH-002; DQ-001, DQ-023],
  [Registado], [Conta autenticada com quota diária de operações na baseline.], [Dispõe de 5 créditos diários para processamento. Uma operação isolada ou junção custa 1 crédito; uma cadeia custa por passo. Carregamento, reprodução, consulta e descarregamento não consomem créditos. Limites de entrada: até 5 min e 200 MB; no máximo uma tarefa ativa por projeto. Os créditos reservados e não consumidos são devolvidos em falha ou cancelamento.], [RNG-02 a RNG-06; REQ-VID-QUOTA-001 a REQ-VID-QUOTA-008; REQ-VID-NFR-007; DQ-001, DQ-005, DQ-010, DQ-013 a DQ-015],
  [Convidado por Link (Destinatário)], [Papel de colaboração existente na baseline; requer autenticação para aceder ao conteúdo do projeto.], [Pode aceder aos casos de vídeo com a permissão do link: leitura para consulta e descarregamento; edição para carregamento e transformação. O perfil da conta autenticada define os limites, e qualquer quota é imputada a quem executa a operação.], [UC07; RF45, RF48, RF51 a RF57; RNF44; REQ-VID-AUTH-003, REQ-VID-QUOTA-006, REQ-VID-DOWNLOAD-001, REQ-VID-INFO-001],
  [Premium], [Subscrição paga com acesso sem quota diária às operações da baseline.], [Não tem quota diária de processamento. Limites de entrada: até 60 min e 2 GB; mantém-se o limite de uma tarefa ativa por projeto. Os requisitos não estabelecem prioridade de execução face ao perfil Registado.], [RNG-02 a RNG-06; REQ-VID-QUOTA-005; REQ-VID-NFR-007; DQ-001, DQ-005, DQ-013 a DQ-015],
 ),
)

== _Stakeholders_ e interesses

A extensão a vídeo digital acrescenta preocupações operacionais — processamento assíncrono, integridade de ficheiros e custo de armazenamento — e revê os interesses dos perfis existentes. Os nomes dos _stakeholders_ abaixo correspondem às designações usadas nos casos de uso.

#tab([_Stakeholders_ e interesses (novos ou revistos)],
 tabela(
  colunas: (3.2cm, 1.8cm, 1fr, 1.8cm, 3.2cm),
  [_Stakeholder_], [Estado], [Interesse(s) relativamente ao vídeo], [Influência], [UC / requisitos],
  [Utilizador Registado / Premium], [Revisto], [Partilhar os seus vídeos e projetos com segurança, carregar e pré-visualizar sem consumir quota e obter resultados de edição sem alterar os originais. O perfil Registado está sujeito à quota e aos limites básicos; o Premium não tem quota diária e dispõe dos limites de capacidade alargados.], [Alta], [UC-VID-000 a UC-VID-013; REQ-VID-AUTH-001 a REQ-VID-AUTH-003; REQ-VID-QUOTA-001 a REQ-VID-QUOTA-008],
  [Administrador / Equipa de produto], [Novo], [Definir limites e regras de quota que mantenham o custo de computação e armazenamento compatível com o MVP e permitam verificar o comportamento funcional dos diferentes perfis.], [Alta], [DQ-001, DQ-005, DQ-013 a DQ-015; REQ-VID-QUOTA-001 a REQ-VID-QUOTA-008],
  [Equipa de Infraestrutura / DevOps], [Novo], [Evitar a degradação de largura de banda e saturação de disco no storage de objetos (SeaweedFS/S3); isolar o processamento pesado de vídeo em filas dedicadas (RabbitMQ) e contentores especializados com FFmpeg.], [Alta], [DQ-004, REQ-VID-NFR-005, REQ-VID-NFR-009, REQ-VID-NFR-010],
  [Sistema PictuRAS], [Revisto], [Assegurar a integridade transacional dos projetos, a imutabilidade dos vídeos de origem e a política tudo-ou-nada, garantindo que falhas e cancelamentos nunca deixam ficheiros órfãos ou dados parciais.], [Alta], [DQ-003, DQ-006, REQ-VID-COM-001..003, REQ-VID-NFR-006],
 ),
)

== Elicitação de requisitos

A elicitação foi conduzida pela equipa por análise documental: requisitos e casos de uso da baseline, casos de uso `UC-VID-000` a `UC-VID-013`, requisitos em `docs/requirements/` e decisões registadas em `docs/requirements.md`. Os casos foram organizados em torno do ciclo de vida do vídeo, das transformações e dos cenários de composição. As regras transversais foram consolidadas a partir das pré-condições, fluxos alternativos, exceções e pós-condições dos casos de uso. A documentação consultada não regista entrevistas com utilizadores nem medições de capacidade; por isso, os valores quantitativos são tratados como limites definidos para o MVP, rastreados às decisões de qualidade, e não como resultados empíricos.

Os limites de duração, tamanho, número de clips por junção e passos por cadeia são os definidos em `DQ-005`, `DQ-014` e nos requisitos de cada domínio; parâmetros identificados nos casos de uso como configuráveis continuam sujeitos à validação prevista. A matriz de formatos e codecs é centralizada em `DQ-002`. A política de quota distingue operações isoladas e cadeias: os requisitos `REQ-VID-QUOTA` e `REQ-VID-CHAIN` definem a reserva, consumo e devolução do custo; carregamento, reprodução, consulta e descarregamento são isentos conforme `DQ-010` e `DQ-013`.
