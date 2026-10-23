---
bolt: 008-video-concat-chain
created: 2026-10-23T00:47:57Z
status: accepted
superseded_by: null
---

# ADR-018: Validação da estrutura das predefinições de vídeo delegada pelo gateway ao serviço de projetos

## Context

As predefinições de vídeo ficam numa coleção nova do serviço de utilizadores (ADD 4.9). Ao guardar, a D-83 manda validar a estrutura (operações e versões conhecidas, sem junção, `convert` só no fim, 1 a 10 passos) com os códigos da D-79 e da D-85, e retirar os campos que o servidor grava (`_mark`, `_input`, `_clips`). O registo de operações e as regras de estrutura vivem no serviço de projetos (T-01: uma única implementação das regras).

## Decision

1. O serviço de projetos expõe uma rota interna, `POST /video/chain-structure` com `{steps, preset: true}`, só na rede do Compose e sem rota no gateway. Responde 200 com os `steps` sem os campos do servidor, ou 422 com `INVALID_CHAIN {rule}` (incluindo `concat_in_preset`, D-85), `CHAIN_TOO_LONG` ou `INVALID_STEP_PARAMS` (operação ou versão desconhecida). Usa o `chainStructure.js` e o registo de operações; não lê nem escreve dados.
2. O router novo `apiGateway/routes/videoPresets.js` (com `videoAuth`) chama essa rota em `POST` e em `PATCH` com `steps` e só depois encaminha ao serviço de utilizadores, com os `steps` devolvidos.
3. O serviço de utilizadores guarda o que recebe e trata só do dono, do `anonymous`, do nome único e do CRUD.

## Rationale

Evita uma segunda lista das operações e das regras de estrutura no serviço de utilizadores, que divergiria a cada operação nova, e mantém o serviço de utilizadores sem dependências do vídeo. O gateway já conhece os dois serviços.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Catálogo de operações e regras copiado no serviço de utilizadores | Sem chamada extra | Duas implementações das regras | Contraria o T-01 |
| O serviço de utilizadores chama o serviço de projetos | Validação junto da escrita | Dependência nova do serviço de utilizadores | Acopla um serviço que hoje não conhece o vídeo |
| Sem validação ao guardar (só ao carregar) | Mais simples | Predefinições inválidas ou com junção guardadas | Contraria a CHAIN-014 e a D-83 |

## Consequences

### Positive

- As regras da D-79 e da D-85 têm uma só implementação, partilhada pelas cadeias e pelas predefinições.
- Uma operação nova fica disponível nas predefinições sem mudar o serviço de utilizadores.

### Negative

- Guardar uma predefinição faz duas chamadas internas.
- Uma predefinição gravada diretamente no serviço de utilizadores (sem o gateway) não é validada; a rede interna é de confiança, como nas outras rotas internas.

### Risks

- Se o serviço de projetos estiver em baixo, não se guardam predefinições (o gateway responde com o erro de serviço indisponível); ler e apagar continuam a funcionar.

## Related

- **Stories**: ST-VID-014
- **Standards**: T-01, 4.9
- **Previous ADRs**: ADR-016
- **Dúvidas**: D-79, D-83, D-84, D-85; verificação V9
