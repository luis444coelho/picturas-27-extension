---
unit: 003-video-composition
intent: 001-video-processing-support
phase: inception
status: complete
created: 2026-10-18T18:00:00Z
updated: 2026-10-23
default_bolt_type: ddd-construction-bolt
---

# Unit Brief: Composição de vídeo

## Objetivo e âmbito

Composição de vídeo no projeto PictuRAS, com preservação dos originais e resultados persistidos. **Casos:** UC-VID-012 e UC-VID-013.

## Requisitos e Stories

Esta Unit tem 30 requisitos funcionais exclusivos: CONCAT e CHAIN. Os requisitos não funcionais são rastreados por responsabilidade na [matriz do intent](../../traceability.md), com resultados e limitações no Capítulo 10 do relatório.

- [ST-VID-013](stories/ST-VID-013-video-concat.md)
- [ST-VID-014](stories/ST-VID-014-video-chain.md)

## Contratos e dependências

A Unit 001 fornece autenticação/autorização, recursos de vídeo, armazenamento, tarefas, quota, mensagens e erros. A Unit 002 utiliza esses contratos e fornece operações elegíveis à Unit 003, que compõe junção, subcadeias por clip e passos finais. A cadeia é executada como uma tarefa e publica apenas o vídeo final; falha e cancelamento desencadeiam limpeza e compensação. Não há dependências circulares.

## Bolts e verificação

- [B008 — 008-video-concat-chain](../../../../bolts/008-video-concat-chain/bolt.md): concluído.

Os critérios normativos e a respetiva evidência são os da ERS e da matriz de verificação do relatório. «Construção concluída» não significa que todos os alvos tenham validação integral; os desvios e ensaios incompletos permanecem identificados.
