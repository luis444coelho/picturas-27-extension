# Revisão de atomicidade e rastreabilidade da ERS de vídeo

**Âmbito:** todos os ficheiros `REQ-VID-*.md` em `docs/requirements/`, incluindo requisitos funcionais e de qualidade.

## Resultado da verificação

- Foram revistos **241 requisitos**: 215 funcionais e 26 de qualidade.
- Os 241 identificadores são únicos (215 funcionais e 26 de qualidade).
- Todos os requisitos têm origem e critério de aceitação/verificação preenchidos.
- As referências a casos de uso nos campos de origem apontam para casos existentes (`UC-VID-000` a `UC-VID-015`).
- As referências a outros requisitos e a decisões DQ usadas nas origens resolvem para identificadores presentes na ERS.
- Não foram encontrados erros estruturais ou referências quebradas.

## Decomposição aplicada

Quando uma linha continha capacidades independentes com resultados verificáveis separadamente, foi dividida em requisitos distintos. Mantiveram-se os identificadores já publicados; as novas obrigações receberam novos IDs, preservando prioridade, evolução, classificação Novo/Alt e origem aplicáveis. Exemplos de decomposição:

- estado final do lote e notificação do respetivo resumo;
- emissão do estado de cada vídeo e progresso agregado do lote;
- reordenação e remoção de passos numa cadeia;
- permissões de acesso e política de retenção/eliminação;
- autenticação e autorização;
- formatos aceites na entrada e formatos gerados na saída;
- extração e persistência de metadados;
- limites de duração/tamanho, fotogramas, tarefas ativas, lote, junção e cadeia.

## Critério usado para atomicidade

Uma enumeração de opções ou de campos de um mesmo resultado não foi dividida apenas por conter conjunções. Foi considerada atómica quando expressa uma única obrigação com um único resultado verificável, como apresentar um catálogo, expor um conjunto de metadados ou aplicar de forma consistente uma transformação. Os critérios de aceitação foram ajustados nas linhas decompostas para verificar cada obrigação separadamente.

## Casos coordenados considerados atómicos

Após a decomposição, os poucos enunciados com conjunções que permanecem descrevem uma única saída ou invariante: apresentar o catálogo de filtros (`REQ-VID-FILTER-001`), apresentar o conjunto de metadados de formato (`REQ-VID-INFO-004`), trocar as dimensões ao rodar (`REQ-VID-ORIENT-008`) e manter a configuração da marca de água uniforme ao longo dos fotogramas (`REQ-VID-WATERMARK-010`). A enumeração de valores/campos é parte do mesmo resultado verificável, não uma segunda funcionalidade.

## Artefactos sincronizados

Os requisitos de origem continuam em `docs/requirements/`. O catálogo e os totais em `docs/requirements.md` foram atualizados. As secções 5, 6 e 7 do relatório Typst foram regeneradas para refletir os novos IDs e contagens.
