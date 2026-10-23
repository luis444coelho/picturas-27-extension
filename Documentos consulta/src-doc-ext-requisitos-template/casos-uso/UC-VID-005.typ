#import "../template.typ": *

== UC-VID-005 — Descarregar um vídeo do projeto

=== Cabeçalho

#tab([UC-VID-005 — Cabeçalho], tabela(colunas: (4.3cm, 1fr), tamanho: 8.5pt, [Secção], [Detalhes], [*ID do Caso de Uso*], [UC-VID-005], [*Nome*], [Descarregar um vídeo do projeto], [*Versão*], [v2.1], [*Autor*], [Equipa PictuRAS-27], [*Data*], [2026-10-23], [*Objetivo*], [Permitir ao utilizador descarregar para o seu dispositivo um vídeo do projeto — em particular o vídeo resultante de uma operação —, no formato em que se encontra armazenado, sem consumir quota e sem alterar o recurso.], [*Âmbito*], [Módulo de gestão de projetos e armazenamento multimédia do PictuRAS], [*Ator Principal*], [Utilizador *Registado* ou *Premium* com sessão iniciada e permissão de leitura (ou superior) no projeto], [*Stakeholders e Interesses*], [- *Utilizador Registado / Premium*: pretende obter no seu dispositivo o resultado das operações de vídeo para o utilizar fora da plataforma, de forma rápida e sem gastar quota. / - *Sistema PictuRAS*: deve garantir que apenas utilizadores autorizados obtêm o ficheiro e que a transferência de ficheiros grandes não sobrecarrega o API Gateway. / - *Equipa de Infraestrutura / DevOps*: pretende que as transferências sejam servidas diretamente pelo armazenamento de objetos com URLs temporários e retoma de transferência.], [*Pré-condições*], [- O utilizador tem sessão iniciada (JWT válido). / - O utilizador tem permissão de leitura, edição ou de proprietário sobre o projeto. / - O projeto contém pelo menos um recurso de vídeo (original ou resultante) no estado completed.], [*Trigger*], [O utilizador seleciona um vídeo na galeria do projeto (ou no reprodutor integrado) e escolhe a opção "Descarregar".]))

=== Fluxo principal

#tab([UC-VID-005 — Fluxo principal], tabela(colunas: (1.1cm, 1fr, 1fr), tamanho: 8.5pt, [Passo], [Ação do Ator], [Resposta do Sistema], [1], [O utilizador seleciona um vídeo na galeria do projeto e escolhe a opção "Descarregar".], [O sistema verifica a permissão de leitura do utilizador sobre o projeto e o estado do recurso, e apresenta o nome de ficheiro sugerido, o formato e o tamanho do ficheiro.], [2], [O utilizador confirma o descarregamento.], [O sistema gera um URL assinado temporário (válido durante 15 minutos), para o recurso, após autorizar o utilizador; a assinatura é portadora e não exige JWT na transferência, sem debitar quota.], [3], [—], [O navegador inicia a transferência diretamente a partir do armazenamento de objetos (SeaweedFS/S3), com o nome de ficheiro sugerido no formato nome-original_operacao.extensão.], [4], [O utilizador obtém o ficheiro no seu dispositivo.], [O sistema regista o evento de descarregamento nos logs com o correlationId; o recurso permanece inalterado no projeto.]))

=== Fluxos alternativos

#tab([UC-VID-005 — Fluxos alternativos], tabela(colunas: (4.3cm, 1fr), tamanho: 8.5pt, [Fluxo], [Descrição], [*FA1 – Descarregamento a partir do reprodutor integrado*], [No passo 1, o utilizador escolhe "Descarregar" nos controlos do reprodutor → O fluxo continua no passo 2.], [*FA2 – Retoma de transferência interrompida*], [No passo 3, a ligação é interrompida → Enquanto o URL estiver válido, o navegador retoma a transferência a partir do último byte recebido (pedidos HTTP Range), sem recomeçar do início.], [*FA3 – URL expirado*], [No passo 3, o URL assinado expirou antes da conclusão → O utilizador volta a escolher "Descarregar" e o sistema gera um novo URL (regresso ao passo 2).], [*FA4 – Descarregamento do vídeo original*], [No passo 1, o utilizador seleciona o vídeo original (não resultante) → O sistema entrega o ficheiro no formato em que foi carregado (MP4, MOV ou AVI), e não a cópia de pré-visualização.]))

=== Exceções

#tab([UC-VID-005 — Exceções], tabela(colunas: (4.3cm, 1fr), tamanho: 8.5pt, [Condição], [Comportamento do Sistema], [*O recurso ainda não está concluído (queued ou processing).*], [No passo 1, a opção "Descarregar" está desativada e o sistema informa que o recurso ainda não está disponível (RESOURCE_NOT_READY).], [*O utilizador não tem permissão sobre o projeto.*], [No passo 1, o sistema rejeita o pedido com HTTP 403 Forbidden e não gera URL.], [*O URL é utilizado por outro utilizador ou após expirar.*], [No passo 3, o armazenamento recusa o pedido com HTTP 403 Forbidden.], [*O objeto não existe no armazenamento.*], [No passo 2, o sistema informa que o ficheiro não está disponível (RESOURCE_UNAVAILABLE) e regista a falha nos logs com o correlationId.]))

=== Pós-condições

#tab([UC-VID-005 — Pós-condições], tabela(colunas: (4.3cm, 1fr), tamanho: 8.5pt, [Tipo], [Resultado], [*Garantia de Sucesso*], [O utilizador dispõe de uma cópia do vídeo no seu dispositivo, no formato armazenado. O recurso no projeto permanece inalterado e a quota diária não é debitada.], [*Garantia Mínima*], [Em caso de erro, nenhum URL válido é exposto a utilizadores não autorizados, o recurso e o projeto permanecem inalterados e a quota não é afetada.]))

=== Regras de negócio e restrições

#tab([UC-VID-005 — Regras de negócio e restrições], tabela(colunas: (4.3cm, 1fr), tamanho: 8.5pt, [ID], [Regra], [*RN1*], [O descarregamento está disponível para utilizadores Registados e Premium com permissão de leitura, edição ou de proprietário no projeto. Utilizadores Anónimos não têm acesso.], [*RN2*], [O descarregamento não consome créditos da quota diária de operações.], [*RN3*], [Apenas recursos de vídeo no estado completed podem ser descarregados.], [*RN4*], [O URL de transferência é assinado, para o recurso, após autorizar o utilizador; a assinatura é portadora e não exige JWT na transferência, e expira ao fim de 15 minutos.], [*RN5*], [O nome de ficheiro sugerido é composto pelo nome original, um sufixo com a(s) operação(ões) aplicada(s) e a extensão do formato armazenado.], [*RN6*], [O descarregamento não altera, move nem elimina o recurso no projeto.], [*RN7*], [Qualquer recurso de vídeo do projeto pode ser descarregado (original ou resultante), sempre no formato armazenado e nunca na cópia de pré-visualização.]))

=== Assunções

#tab([UC-VID-005 — Assunções], tabela(colunas: (4.3cm, 1fr), tamanho: 8.5pt, [ID], [Assunção], [*A1*], [O armazenamento de objetos (SeaweedFS/S3) suporta URLs assinados e pedidos HTTP Range.], [*A2*], [O navegador do utilizador suporta a transferência de ficheiros de até 2 GB.]))

=== Questões em aberto e resolução

#tab([UC-VID-005 — Questões em aberto e resolução], tabela(colunas: (1.5cm, 1fr, 5cm), tamanho: 8.5pt, [ID], [Questão], [Resolução / Decisão], [*Q1*], [Deve existir um limite diário de descarregamentos?], [Não no MVP. O controlo é feito pela expiração dos URLs e pelas permissões do projeto.]))

