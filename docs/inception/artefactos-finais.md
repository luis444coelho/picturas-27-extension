# Artefactos finais — Suporte a vídeo

O âmbito entregue contém **14 casos de uso, 180 requisitos funcionais e 22 não funcionais**, de acordo com o relatório. A construção dos Bolts 001–005, 007 e 008 está concluída.

## Modelo de domínio e casos de uso

Um projeto contém imagens e vídeos. O modelo conceptual distingue o recurso de entrada, a tarefa assíncrona e o resultado. Uma tarefa publica no máximo um vídeo final, com receita e origens; falha ou cancelamento não publica resultados parciais. As predefinições de vídeo são privadas e distintas das de imagem.

- [Modelo de domínio](../diagrams/modelo_dominio.puml).
- [Diagrama de casos de uso](../diagrams/diagrama_casos_uso.puml).
- [Catálogo de casos de uso](../use-cases.md).
- [Catálogo de requisitos](../requirements.md).

## Regras transversais

Exige-se autenticação e autorização por projeto. Consultar e descarregar admitem leitura; carregar e transformar exigem edição. A quota é debitada ao executor, com cinco créditos diários no perfil Registado e sem quota diária no Premium. Operação isolada ou junção custa um crédito; cadeia custa o total de passos. A reserva constitui o débito; falha ou cancelamento devolve os créditos.

Os limites de entrada são 5 min/200 MB e 60 min/2 GB por perfil. Uma tarefa ativa de vídeo é admitida por projeto. A D-86 removeu os tetos fixos de clips e passos; mantêm-se os restantes limites e o mínimo de dois clips por junção. A D-90 regista o risco de memória das composições.

## Units e construção

A [decomposição em Units](../../memory-bank/intents/001-video-processing-support/units.md) atribui 70 requisitos funcionais ao ciclo de vida, 80 às transformações e 30 à composição. Inclui 15 Stories e sete Bolts; a [rastreabilidade](../../memory-bank/intents/001-video-processing-support/traceability.md) cobre os 202 requisitos.

O ADD e os ADR fundamentam os contratos. Os capítulos 7, 8 e 10 do relatório relacionam componentes, critérios e evidência, preservando as limitações conhecidas.
