# Executar e preparar os testes do MVP

O script `scripts/mvp.py` reúne os comandos das suites existentes. Não altera as
regras da aplicação nem transforma testes manuais em testes automáticos.

## Arranque rápido

Requisitos: Python 3.10 ou superior, Docker Engine e Docker Compose v2. Não são
necessários módulos Python adicionais, Node.js ou FFmpeg no anfitrião para os
testes em contentores. Executar a partir da raiz da solução:

```bash
python3 scripts/mvp.py all
```

Este comando:

1. Constrói e inicia os serviços necessários ao vídeo e à regressão de Brilho de
   imagem, incluindo as suas dependências. Aguarda o acesso à interface HTTPS.
2. Cria contas Registado e Premium, ou reutiliza as contas ainda válidas que o
   próprio script já registou nesse ambiente.
3. Executa os testes unitários, as funções de frontend e a verificação TypeScript.
4. Gera os quatro conjuntos de vídeos sintéticos e executa separadamente as
   integrações B004, B005, B007 e B008.
5. Executa os testes de navegador se os respetivos pré-requisitos forem indicados.
6. Guarda resultados e registos e apresenta o estado de cada suite.

O arranque inclui `nginx`, `frontend`, `api_gateway`, `projects`, `users`,
`ws_gateway`, `video_worker`, `img_storage` e `brightness_tool`, além das
dependências declaradas no Compose. As restantes ferramentas de imagem não são
necessárias para estas suites. Para lançar a aplicação com todas as ferramentas,
continua a estar disponível `docker compose up -d --build`.

A construção inicial exige Internet e espaço para as imagens. `--no-build` permite
reutilizar imagens já construídas; nesse caso, cabe ao avaliador garantir que
correspondem ao código a avaliar. O script não para os serviços nem elimina os
volumes no final.

## Comandos disponíveis

```bash
# Só iniciar os serviços necessários.
python3 scripts/mvp.py up

# Com os serviços iniciados: preparar contas e vídeos para testes manuais.
python3 scripts/mvp.py prepare

# Só criar ou verificar as contas geridas pelo script.
python3 scripts/mvp.py accounts

# Listar as suites integradas no script, sem precisar de Docker.
python3 scripts/mvp.py list

# Testar uma pilha já iniciada, sem criar contas de demonstração.
python3 scripts/mvp.py test

# Selecionar grupos; a opção --only pode repetir-se.
python3 scripts/mvp.py test --only unit
python3 scripts/mvp.py test --only frontend --only integration

# Iniciar e testar com as imagens atuais, sem reconstrução.
python3 scripts/mvp.py all --no-build --only integration

# Ativar também a medição D-88: 100 ocorrências curtas e 60 passos.
python3 scripts/mvp.py test --only integration --d88
```

Os grupos são `unit`, `frontend`, `integration` e `browser`. A ausência de `--only`
seleciona os quatro; os grupos não selecionados surgem como «Não executado», com
o motivo. Uma falha de teste não impede a execução das suites seguintes; uma
falha de preparação impede as etapas que dependem dela e fica registada.

## Localização e interpretação dos resultados

Por omissão, são criados os seguintes artefactos, excluídos de Git:

```text
artifacts/mvp/
  environment/
    accounts.json
    fixtures/<identificador-do-gerador>/b004/ ... b008/
  runs/<data-UTC-e-identificador>/
    summary.md
    summary.json
    01-arranque.log
    ...
    outputs/b007/
    outputs/b008/
```

`accounts.json` contém os endereços, palavras-passe, IDs e JWT das duas contas de
demonstração; é escrito com permissões `600`. O terminal e o resumo não imprimem
os tokens nem as palavras-passe. Os testes de integração criam as suas próprias
contas e continuam a usar os mecanismos de limpeza já existentes nas suites.
As contas de demonstração permanecem disponíveis para exploração manual.
O JWT emitido no registo pode ser usado diretamente na API. O login da solução
de base conserva a limitação identificada no capítulo 11; a preparação das
contas não corrige esse comportamento.

Os vídeos são sintéticos e reutilizados enquanto o código dos geradores e dos
módulos Python de vídeo não mudar. O ficheiro `.generated.json`, em cada conjunto,
regista o gerador e o tamanho efetivo dos ficheiros em bytes. Os diretórios têm
nomes B004/B005/B007/B008 para conservar os conjuntos exigidos por cada suite.
Os testes não usam vídeos pessoais.

Cada execução preserva os comandos, durações, códigos de saída, contagens
disponíveis e registos completos. O resumo identifica também a revisão Git e a
existência de alterações locais; num arquivo sem `.git`, indica essa condição.
As contagens sobrepostas não são somadas nem apresentadas como cobertura dos
202 requisitos. A compilação TypeScript surge como uma verificação separada.

| Código de saída | Significado |
| --- | --- |
| `0` | As etapas e os grupos selecionados terminaram sem falhas ou testes omitidos. |
| `1` | Houve falha de teste, erro de preparação ou impossibilidade de interpretar uma suite. |
| `2` | Execução parcial: houve testes omitidos ou um grupo selecionado ficou por executar. |
| `130` | Interrupção pelo utilizador; o resumo conserva a evidência recolhida. |

Por exemplo, `all` sem navegador regista os testes de interface como não
executados e devolve `2` se não existirem falhas anteriores. Isso não equivale a
uma aprovação global. Um teste de integração sem variáveis de ativação também
não é considerado aprovado. O ensaio D-88 omitido pela própria suite pode dar
origem a um resultado parcial quando não se usa `--d88`.

As falhas conhecidas da aplicação e dos testes, nomeadamente a expectativa fixa
do píxel de Brilho em ARM, permanecem visíveis. O script não modifica as
expectativas para produzir um resultado favorável.
Quando a integração falha e os registos desse intervalo contêm a mensagem
`No writable volumes and no free volumes left`, o resumo apresenta o diagnóstico
de indisponibilidade de volumes SeaweedFS. Não elimina dados nem confunde essa
mensagem com uma medição do espaço livre do disco.

## Testes de navegador

Exigem Node.js 22 ou superior no anfitrião e um binário Chromium. O teste de
preservação dos nove painéis exige ainda os ficheiros JSON obtidos na versão
anterior à extração dos componentes de configuração:

```bash
python3 scripts/mvp.py test --only browser \
  --browser /caminho/para/chromium \
  --snapshots /caminho/para/referencia-anterior
```

O script executa a integração visual B005 e a comparação dos painéis B008.
Quando os pré-requisitos não existem, apresenta o motivo e conserva o estado
«Não executado». Nunca ativa `VIDEO_UI_RECORD`: criar uma referência a partir
da própria versão avaliada invalidaria a comparação histórica. A obtenção da
referência é descrita em `projects/test/video/README-b008.md`.

## Âmbito e testes históricos

O script executa todas as suites unitárias correntes de vídeo de Projetos e do
worker, os sete ficheiros de testes de funções do frontend, a verificação de
tipos e as quatro integrações finais indicadas acima. Inclui o código dos
incrementos anteriores na regressão unitária.

Não executa automaticamente os antigos `e2e.test.js`, `e2e-project.test.js`,
`e2e-access.test.js`, `e2e-large.test.js`, `e2e-tasks.test.js`,
`e2e-tasks-cleanup.test.js`, `e2e-ui.test.js` e `e2e-access-ui.test.js`. Estes
ficheiros ficam explicitamente listados no resumo como não executados pelo
script. Exigem conjuntos de entrada e preparação próprios; alguns controlam
contentores, requerem Playwright ou ativam a operação de ensaio
`test_reencode`. Os procedimentos constam dos relatórios B001–B003 e dos
cabeçalhos dos testes. Não são confundidos com os testes unitários que os
substituem apenas parcialmente na regressão corrente.

Os critérios manuais, a matriz completa do leitor e os ensaios de capacidade no
limite de 2 GB continuam a exigir preparação e registo específicos. Este comando
não representa, por si só, uma demonstração integral da ERS.

## Configuração e manutenção do ambiente de teste

`--output` escolhe outra pasta para contas, vídeos e resultados; apenas a pasta
predefinida está excluída de Git por este incremento. `--project` seleciona outro
nome Compose, mas não altera as portas publicadas. `--url` indica o ponto de
entrada HTTPS dessa mesma pilha. Exemplos:

```bash
python3 scripts/mvp.py prepare --output /tmp/picturas-avaliacao
python3 scripts/mvp.py test --wait 240 --only unit
```

As credenciais S3 usadas na integração são lidas do serviço `img_storage` em
execução. Podem ser substituídas no processo por `VIDEO_E2E_S3_ACCESS` e
`VIDEO_E2E_S3_SECRET`; os segredos são ocultados nos comandos do resumo.

Se uma conta gerida tiver sido eliminada ou o seu token tiver expirado, o script
informa que o ambiente deve ser preparado com outro `--output`. Não elimina nem
recria silenciosamente contas. Se uma cópia de vídeos tiver ficado incompleta,
também não sobrepõe ficheiros existentes.

Depois de conservar a evidência necessária, o avaliador pode remover as pastas
de execuções e os vídeos que já não utiliza. As pastas temporárias desta
ferramenta nos contentores começam por `/tmp/picturas-mvp/`. O script não executa
limpezas globais de utilizadores, projetos, objetos ou volumes.

Para verificar os mecanismos de classificação de resultados e de reutilização
de contas do próprio script, sem Docker:

```bash
python3 -m unittest discover -s scripts -p 'test_mvp.py' -v
`
