2 - Não aprovo a etapa 5 nem fecho o bolt. A equipa reviu o resultado no browser e a experiência não corresponde ao que queremos. Volta à etapa 2 (Technical Design) só para o que muda, mantendo o que já está bem feito no backend, e depois refaz as etapas 4 e 5 para essas partes. Não faças merge para a main.

O QUE SE MANTÉM
O modelo do backend já serve: sub-cadeia por clip → junção → passos finais (D-78), uma só tarefa e uma só invocação FFmpeg, custo N (DQ-014: 1 crédito por passo, a junção conta 1), reserva antes e devolução em falha ou cancelamento (D-45), resultado atómico sem intermédios (CONCAT-011), originais intactos, fase da falha (D-82), predefinições (D-83 a D-85), nomes (D-35, D-75). Não reconstruas isto.

O QUE MUDA
1. Três ações independentes na interface, com fluxos separados:
   - "Aplicar várias operações": escolher um vídeo e aplicar-lhe uma sequência de operações. Cada operação é configurada individualmente; a ordem de aplicação é explícita e modificável; é possível remover operações; sem limite fixo de quantidade (D-86); cada ocorrência de uma operação custa 1 crédito para os Registados; gera um só vídeo final e o original fica inalterado.
   - "Juntar vídeos": concatenar vídeos sem exigir operações. Escolher dois ou mais vídeos do projeto, sem limite fixo de quantidade (D-86); reordenar e remover; respeitar a ordem do utilizador; o mesmo vídeo pode repetir-se; mostrar a duração total estimada; normalizar resolução, fps e áudio como já faz a junção (ADD 4.8); gerar um só vídeo final, com os originais inalterados. Custa 1 crédito no total, independentemente do número de vídeos (DQ-014, UC-VID-013).
   - "Movie Maker": um editor de composição flexível, em que cada vídeo tem a sua própria sequência de operações antes da junção e o resultado conjunto pode receber uma nova sequência de operações. Modelo conceptual:

        V1 → F1 → F2 → ... → Fn ──┐
                                  │
        V2 → F1 → F2 → ... → Fn ──┼── JUNÇÃO ── F1 → F2 → ... → Fn
                                  │
        V3 → F1 → F2 → ... → Fn ──┤
                                  │
        ...                       │
                                  │
        Vn → F1 → F2 → ... → Fn ──┘

     Expressão geral:
        ((V1 × F1 × ... × Fn) + (V2 × F1 × ... × Fn) + ... + (Vn × F1 × ... × Fn)) × F1 × ... × Fn

     Cada F é uma operação configurada individualmente. As operações de cada vídeo são independentes: não têm de ser iguais nem ter os mesmos parâmetros. Comportamento obrigatório:
       1. O utilizador acrescenta os vídeos que quer usar na composição (o mesmo vídeo pode aparecer mais de uma vez).
       2. Cada vídeo tem a sua própria cadeia de operações, que pode estar vazia.
       3. O utilizador pode acrescentar, configurar, remover e reordenar operações dentro da cadeia de cada vídeo.
       4. O utilizador pode reordenar os vídeos que vão ser juntos.
       5. A junção é feita sobre os resultados das cadeias individuais, e não sobre os ficheiros originais.
       6. Depois da junção, o utilizador pode configurar uma nova cadeia de operações aplicada ao vídeo resultante.
       7. A composição completa é executada como uma única tarefa de processamento.
       8. Só o vídeo final é acrescentado aos recursos do projeto.
       9. Os vídeos originais não são modificados.
       10. Os resultados intermédios, se existirem, são temporários e eliminados no fim da execução.
     Não pode ser um fluxo rígido do tipo "editar o primeiro vídeo → juntar o segundo → aplicar um filtro final". Tem de suportar N vídeos, cadeias independentes com N operações por vídeo e N operações depois da junção, respeitando as regras de validação (D-79, D-80, D-81) e os recursos disponíveis. Isto corresponde ao modelo do backend que já existe (D-78: parameters.clips[i].steps por clip, junção como primeiro passo de topo, passos finais a seguir); a interface tem de o expor por inteiro.
     A interface pode organizar os controlos em painéis, modais ou secções próprias do Movie Maker, mas o componente de configuração de cada operação tem de ter o comportamento da edição simples. Por exemplo: o recorte usa a interface de recorte que já existe; a velocidade usa os mesmos sliders e predefinições; o ajuste usa os mesmos controlos; e assim para todas as operações.
   O editor atual (video-chain-editor.tsx e afins) deixa de ser a interface destas três funções; reaproveita dele o que servir (lista ordenável, escolha de clips, predefinições, progresso).
2. Os controlos de configuração de cada operação nas três funções são exatamente os da edição simples (B004, B005, B007): os mesmos componentes, sliders, campos, valores predefinidos, intervalos, unidades e validações. Não pode haver uma segunda implementação visual (o video-chain-step-form.tsx atual é para substituir). Ver a D-87.
3. Limites de quantidade: ver a D-86.

DECISÕES DA EQUIPA (regista-as em docs/specsDuvidas.md no formato habitual, com a resposta já preenchida)
- D-86 — Limites de quantidade nas composições. Resposta: deixam de existir limites fixos de número de passos por cadeia e de número de vídeos por junção, para todos os perfis (revoga, para esta construção, o CHAIN_TOO_LONG e o TOO_MANY_INPUTS da DQ-015, REQ-VID-CHAIN-008, REQ-VID-CONCAT-006, REQ-VID-NFR-022 e NFR-023). Mantêm-se: o mínimo de 2 vídeos numa junção (CONCAT-005), os limites de duração e tamanho por perfil (CONCAT-007, NFR-024, D-81), a quota diária dos Registados (cada passo 1 crédito, verificada e reservada antes da tarefa, com QUOTA_EXCEEDED se não chegar), a recusa dos anónimos, e as validações de formato, permissões e integridade. Os Premium não têm débito de créditos. Atualiza docs/requirements (CHAIN-008, CONCAT-006, NFR-022, NFR-023, DQ-015) com uma nota "Revisto pela D-86", sem apagar o texto original, e regista o impacto no ADR correspondente. Se a ausência de limite exigir uma proteção técnica (por exemplo, tamanho máximo do pedido ou do grafo FFmpeg), regista uma dúvida nova com opções em vez de inventar um número.
- D-87 — Exceção à regra 2.6 para os painéis de vídeo das B004, B005 e B007. Resposta: para reutilizar os controlos da edição simples, é permitido alterar código de frontend de vídeo criado pelos bolts desta construção (frontend/components/video/* e frontend/lib/video-*.ts das B004, B005 e B007), apenas para extrair de cada painel o componente de configuração da operação (sem submissão) e fazer o painel simples usá-lo. O comportamento e o aspeto da edição simples não podem mudar. A exceção não abrange o código original do PictuRAS (fluxo de imagem e serviços), nem o backend das B001 a B007, que continuam só por acréscimo. Regista como ADR-020. No relatório, lista cada linha alterada ou removida ao abrigo da D-87, separada do numstat do resto do código (que tem de continuar com 0 linhas removidas).

ETAPAS
- Etapa 2 (revisão): atualiza o ddd-02 com os três fluxos, a extração dos componentes de configuração (um por operação: recorte, remoção de áudio, velocidade, marca de água, ajuste, filtro, redimensionar, rodar/espelhar, converter) e o que muda nos limites. Lista as verificações V que a etapa 4 confirma. Pára no checkpoint.
- Etapa 3: ADR-020 (D-87) e o ADR da D-86, se necessário. Pára no checkpoint.
- Etapas 4 e 5: implementação e testes, incluindo:
  - a edição simples de cada operação continua igual (testes de regressão e verificação visual na checklist manual);
  - "Aplicar várias operações" com 12 ou mais passos num Premium;
  - "Juntar vídeos" com 12 ou mais vídeos num Premium, com repetições e sem operações;
  - Movie Maker com 3 vídeos com cadeias diferentes (incluindo uma vazia) e 2 ou mais operações depois da junção;
  - quota insuficiente num Registado bloqueia antes de criar a tarefa; anónimo recusado;
  - falha a meio não deixa resultado e devolve os créditos.
- Commit e push por etapa no bolt/008-video-concat-chain, sem merge para a main, e pára em cada checkpoint.
