**RF1- Descarregar vídeo resultante**
O utilizador deve poder descarregar para o seu dispositivo o vídeo resultante de uma operação.

**RF2- Juntar vídeos**
O utilizador deve poder juntar dois ou mais vídeos, concatenando-os pela ordem selecionada num único vídeo final.

**RF3- Encadear operações de edição**
O utilizador deve poder aplicar várias operações sequenciais a um vídeo, produzindo um único vídeo final. Por exemplo, cortar um vídeo, ajustar as cores e remover o áudio antes de guardar o resultado.

**RF4- Processar vários vídeos em lote**
O utilizador deve poder aplicar o mesmo conjunto de operações a vários vídeos, sem ter de configurar cada vídeo individualmente.

**RF5- Consultar informações do vídeo**
O utilizador deve poder consultar informações sobre um vídeo, incluindo a duração, a resolução, o formato, o tamanho do ficheiro e a taxa de fotogramas.

**RF6- Ajustar propriedades visuais do vídeo**
O utilizador deve poder ajustar as propriedades visuais de um vídeo, nomeadamente o brilho, o contraste e a saturação.

**RF7- Aplicar filtros visuais**
O utilizador deve poder aplicar filtros visuais predefinidos a um vídeo.

**RF8- Redimensionar vídeo**
O utilizador deve poder alterar a resolução de um vídeo, selecionando as dimensões de saída pretendidas.

queria usar o agent do specs que tenho neste prjeto para especificar melhor uns novos requesitos. So tenho um titulo e uma breve explicação, dentro de docs/novo.md. Qual agent usar, como iniciar e qual a  
 prompt para lhe dar(é suposto so perceber contexto global do projeto para o perceber depois le os novos requesitos em docs/novo.md e edita os ficheiros presentes em docs/requirements.md, docs/use-casas.md e  
 docs/merge.md e seguindo exatamente o mesmo padrao ate agora utlizado em cada um desses ficheiros apenas adicionado os novos requestios e tudo que deles vem derivado em cada um dos ficheiros quando necessario)

**RF9- Rodar e espelhar vídeo**
O utilizador deve poder rodar um vídeo, selecionando o ângulo pretendido (90°, 180° ou 270°), e espelhá-lo na horizontal ou na vertical, de modo a corrigir ou alterar a orientação. Estas operações podem ser usadas no encadeamento de operações (RF3) e no processamento em lote (RF4).

**RF10- Converter formato do vídeo**
O utilizador deve poder converter um vídeo de um formato para outro (por exemplo, de AVI para MP4), selecionando o formato de saída pretendido. Esta operação pode ser usada no encadeamento de operações (RF3) e no processamento em lote (RF4).

Nota: o RF2 trata de juntar vídeos diferentes, enquanto o RF3 trata de encadear operações de edição. São requisitos distintos, embora possam ser usados em conjunto (por exemplo, editar três vídeos e depois juntá-los num único resultado(V1 + filtro de cor) + (v2+cortar som) + (v3 + acelrar video) + marca de agua = 1 video com marca de agua) -> genero de movieMaker.
