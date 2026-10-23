---
id: ST-VID-012
unit: 002-video-transformations
intent: 001-video-processing-support
status: complete
priority: must
created: 2026-10-19T17:31:16.000Z
assigned_bolt: 007-video-format-conversion
implemented: true
---

# Story: ST-VID-012 — Converter formato

## User Story

**As a** Utilizador Registado ou Premium com permissão de edição
**I want** escolher um formato de saída suportado
**So that** obter uma versão compatível com o destino pretendido

## Acceptance Criteria

- [ ] Quando escolho MP4, MOV ou AVI diferente do formato atual, então vejo os codecs de saída e se a conversão é por cópia direta ou recodificação, e o sistema publica um novo vídeo com os codecs da matriz (H.264/AAC em MP4 e MOV; MPEG-4 Part 2/MP3 em AVI).
- [ ] As streams só são copiadas quando o codec de origem é igual ao de saída da matriz (um MP4 H.264/AAC para AVI é recodificado).
- [ ] Formato igual ao atual dá `SAME_FORMAT` e formato fora da matriz dá `UNSUPPORTED_TARGET_FORMAT`, antes de criar tarefa.
- [ ] O resultado preserva a duração, a resolução (salvo o corte de 1 px numa dimensão ímpar recodificada) e a taxa de fotogramas, é descodificável e reproduzível nos leitores de referência e, se for MOV, AVI ou MP4 com perfil não reproduzível, tem cópia de pré-visualização MP4; o original é preservado.

## Traceability

- **Use case:** UC-VID-012.
- **Requirements:** `REQ-VID-CONVERT-001` a `010`; `REQ-VID-NFR-012`, `026`. Consome `REQ-VID-COM-*`. Critérios de aceitação completos e autoritativos nos ficheiros `docs/requirements/` correspondentes (ERS v2.4).
- **Decisões do ADD v1.1:** 4.7, T-05 e Q-ADD-21 (cópia só com codec igual), T-06 e Q-ADD-20 (cópia de pré-visualização), Q-ADD-11 (qualidade, pendente no ADD), Q-ADD-25.

## Dependencies

- **Requires:** contratos de projeto/permissão da baseline; contratos da Unit 001 quando há submissão de processamento.
- **Enables:** execução e validação do caso de uso descrito nesta story.

## Out of Scope

- Alterar o ficheiro original.
- Alterar código existente (regra 2.6 do ADD: só acrescentar).
- Funcionalidades ou limites que não constem da ERS v2.4, dos casos de uso v1.5 ou do ADD v1.1.
