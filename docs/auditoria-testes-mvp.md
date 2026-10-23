# Auditoria dos testes e da validação do MVP

Data da revisão: 23 de outubro de 2026. A fonte normativa é a ERS do relatório: **180 requisitos funcionais e 22 não funcionais**, associados a 14 casos de uso. O detalhe está no [Capítulo 10](../Documentos%20consulta/src-doc-ext-requisitos-template/capitulos/10-testes-validacao.typ) e na [matriz CSV](auditoria-testes-mvp-matriz.csv).

## Cobertura especificada

Os 202 requisitos têm um caso de teste identificado. A tabela do relatório regista **186 cenários com «Passa», 15 com «Parcial» e 1 sem resultado**. As contagens representam critérios de aceitação documentados; não são a soma das suites nem uma certificação de conformidade integral.

O Bolt 008 está concluído e a checklist manual final foi aprovada em 23-10-2026. A revisão final registou 282/282 testes de Projetos, 80/80 do worker, funções de frontend e 15/15 integrações B008. Os resultados, condições e sobreposições são discriminados no relatório.

## Alcance da validação

Os estados e as condições de cada cenário seguem a tabela do relatório. Os casos parciais incluem a verificação explícita de um token corretamente assinado mas expirado, a matriz integral de reprodução no leitor, a apresentação da pré-visualização e a transferência/retoma de vídeo válido no limite de 2 GB. As divergências e medições devem ser consultadas no Capítulo 10; esta limpeza do âmbito não constitui uma nova execução dos testes.

## Reexecução

Consultar o [guia de execução](executar-testes-mvp.md). A limpeza documental não alterou o código da aplicação nem as asserções dos testes. As validações documentais incluem IDs, ligações, diagramas e compilação Typst.
