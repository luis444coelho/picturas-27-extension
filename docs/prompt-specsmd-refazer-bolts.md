# Prompt para o agente specsmd (Inception): refazer os bolts com base no ADD v1.1

Usa o comando `/specsmd-inception-agent --intent 001-video-processing-support` e cola o texto abaixo.

---

Trabalha no repositório `picturas-27-extension`, no ramo `main` (atualiza-o antes com `git pull origin main`).

## Objetivo

Os artefactos de Inception do intent `001-video-processing-support` em `memory-bank/` foram criados antes do ADD v1.1 e estão desatualizados. Por exemplo, a `memory-bank/bolts/003-video-task-foundation/bolt.md` ainda fala de "reserva/commit/rollback de quota", e o ADD decidiu que não há passo de confirmação (Q-ADD-03). Refaz **todos os bolts** (`memory-bank/bolts/*/bolt.md`) e os artefactos de que eles dependem (stories, units e rastreabilidade), para baterem certo com a documentação atual.

## Fontes (só estas)

Por ordem de autoridade. Se duas fontes se contradisserem, manda a primeira:

1. `docs/add.md` (ADD v1.1). É o **documento mestre** das decisões de arquitetura e implementação: regra 2.6 "só acrescentar", T-00 a T-10, decisões por caso de uso (secção 4), tabela-resumo (5), dependências novas (6) e questões Q-ADD-01 a 25 (7). As Q-ADD são dadas como aceites com a decisão que o próprio ADD propõe.
2. `docs/requirements.md` (ERS v2.4) e `docs/requirements/REQ-VID-*.md`. Os critérios de aceitação autoritativos são os destes ficheiros.
3. `docs/use-cases.md` (v1.5) e `docs/use-cases/UC-VID-000.md` a `UC-VID-015.md`.
4. `docs/inception/artefactos-finais.md` (Units, planeamento dos Bolts B001 a B009, regras de negócio RNG) e `docs/diagrams/` (`modelo_dominio.puml`, `diagrama_casos_uso.puml`).
5. O código que existe no repositório, tal como está. O ADD, na 2.5, descreve o que já está implementado.

**Não uses** o `docs/merge.md`: é um documento antigo e está desatualizado. Também não uses nenhum ficheiro que não esteja nesta lista.

## Regra principal: não supor nada

- Cria os artefactos **apenas** com base no que está escrito nas fontes acima.
- Se, para preencher um campo ou tomar uma decisão, tiveres de supor algo que as fontes não dizem, **não o implementes nem o escrevas nos artefactos**. Por exemplo: uma estimativa, uma dependência, a ordem entre bolts, um tipo de bolt, um critério de aceitação ou o comportamento de um caso não coberto.
- Nesses casos, regista a dúvida em `docs/specsDuvidas.md` (formato abaixo) e, no artefacto, deixa só uma referência curta à dúvida, por exemplo `(ver specsDuvidas.md, D-03)`.
- Uma questão já resolvida no ADD (Q-ADD) ou na ERS (DQ, Q-ERS) não é dúvida: usa a decisão que lá está e cita-a.
- Uma Q-ADD em que o próprio ADD diz que a resposta ainda está por definir também não é dúvida nova. É o caso da Q-ADD-07 (matrizes de Vintage, Frio e Quente), da Q-ADD-08 (sufixo do nome), da Q-ADD-09 (tamanho e retenção do ZIP), da Q-ADD-10 (réplicas do worker) e da Q-ADD-11 (parâmetros de qualidade). Cita-a no bolt como pendente e não inventes valores.

## O que refazer

1. **Bolts** (`memory-bank/bolts/*/bolt.md`): todos.
   - Segue os IDs, a ordem, o âmbito, os tipos (DDD ou Simple) e as dependências da tabela "5. Planeamento dos Bolts" de `docs/inception/artefactos-finais.md` (B001 a B009). Se o ADD contradisser essa tabela, manda o ADD e registas a diferença em `specsDuvidas.md`.
   - Em cada bolt, o objetivo, os requisitos rastreados, as saídas esperadas, os critérios de passagem e os limites passam a citar as decisões do ADD que lhe dizem respeito (T-xx, secção 4.x, Q-ADD-xx) e os componentes que o ADD indica. Exemplos de componentes: coleções `videos`, `VideoTask` e `VideoBatch`, `video_project_locks`, `videoAuth`, `Tools/video/` com um único `-filter_complex`, filas `video_operations_queue`, `video_project_queue` e `video_ws_queue`, `video_control`, `videoStages` e `videoUrls`, `/s3-video/` no nginx, `archiver`, `correlationId` no corpo das mensagens.
   - A regra 2.6 "só acrescentar" tem de aparecer nos limites de cada bolt: o código existente não é alterado.
   - Mantém o formato do template `.specsmd/aidlc/templates/construction/bolt-template.md` e o esquema de `.specsmd/aidlc/memory-bank.yaml`. Todos os bolts ficam com `status: planned`, porque nada da fundação de vídeo está implementado (ADD 2.5, Q-ADD-01).
   - Usa a skill `.specsmd/aidlc/skills/inception/bolt-plan.md`. A complexidade só é preenchida quando as fontes a justificam; caso contrário, vai para dúvida.
2. **Stories** (`memory-bank/intents/001-video-processing-support/units/*/stories/*.md`): atualiza os critérios de aceitação e a rastreabilidade para baterem certo com os REQ, os UC e o ADD atuais. Por exemplo, a quota é reservada e a reserva torna-se definitiva na conclusão, sem passo de confirmação. Mantém os IDs das stories, a não ser que o ADD obrigue a mudar a divisão; nesse caso, regista em `specsDuvidas.md` em vez de mudar.
3. **Units** (`units.md` e `units/*/unit-brief.md`), **`system-context.md`**, **`requirements.md`**, **`decisions.md`** e **`traceability.md`** do intent, e o **`memory-bank/story-index.md`**: atualiza-os para refletirem o ADD v1.1, a ERS v2.4 e os UC v1.5.
4. **`inception-log.md`**: acrescenta uma entrada nova a explicar a revisão (fontes usadas, o que mudou e quantas dúvidas ficaram), sem apagar as entradas anteriores.

Não alteres os ficheiros de histórico do intent: `requirements-initial-proposal.md`, `requirements-review.md`, `case-review.md` e `use-cases-academic.md`.

**Não alteres nada em `docs/`**, a não ser criar `docs/specsDuvidas.md`. Não alteres código.

## Formato de `docs/specsDuvidas.md`

```markdown
# Dúvidas da revisão dos artefactos specsmd (Inception)

| Campo  | Valor                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Data   | AAAA-MM-DD                                                                                                                         |
| Fontes | docs/add.md (ADD v1.1), docs/requirements.md (v2.4), docs/use-cases.md (v1.5), docs/inception/artefactos-finais.md, docs/diagrams/ |

## D-01 — <título curto>

- **Onde:** <artefacto(s) afetado(s), e.g. memory-bank/bolts/005-video-visual-edits/bolt.md, campo X>
- **Dúvida:** <pergunta concreta, respondível numa frase>
- **O que as fontes dizem:** <citações com ficheiro e secção, ou "nada">
- **Opções:** <2–3 opções, sem escolher nenhuma>
- **Resposta:** _(por preencher)_
```

Numera as dúvidas de forma contínua (D-01, D-02, …). Escreve uma dúvida por assunto e não repitas a mesma dúvida para vários bolts: lista todos os artefactos afetados em "Onde". Na segunda interação, vou preencher as respostas e pedir-te que as apliques.

## Entrega

- Escreve em português europeu, no estilo dos artefactos atuais.
