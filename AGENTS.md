# Repository instructions

These instructions apply to the whole monorepo unless a deeper `AGENTS.md` narrows them for a package or application.

## Start with the project model

Read `README.md` before changing architecture or product behavior. Read the nearest package instructions and the documents that own the concept you are modifying.

Do not infer that familiar terms mean familiar architecture. Eco, ACF, and Frontend Lib intentionally reject several common agent and frontend defaults.

When a concept changes, update the documentation that defines it in the same workstream. Do not leave an obsolete thesis behind working code.

## Keep the three projects distinct

### Eco

Eco is the user-facing work environment.

Do not reduce Eco to a chat client, an IDE wrapper, or a multi-agent dashboard. It combines a persistent spatial workplane with familiar messaging semantics.

Current interaction direction:

- Top-level group tabs represent persistent shared work contexts.
- The sidebar indexes individual threads and agents with high information density.
- Chat, editor, browser, terminal, diff, evidence views, and future tools are peers inside the spatial workplane.
- The workplane supports fast two-dimensional keyboard navigation.
- Split-screen and off-screen panes are normal states, not special modes.
- Moving attention must not terminate the process or discard the state behind a pane.
- Consumer messaging should remain understandable without teaching the user agent-orchestration terminology.

Preserve these architectural distinctions:

- work map != wholarchy
- wholarchy != activation graph
- activation != agent
- work item != subagent
- group != shared model context
- conversation graph != work graph
- canonical event log != working graph
- working graph != active context

A group is a shared event stream. Agents may have private continuity outside the group. Replies, forwards, mentions, delegation, and evidence references should remain explicit relationships rather than being flattened into transcript text.

When runtime work begins, prefer canonical events and provenance over destructive memory rewriting. Summaries and indexes may be disposable. Original evidence should remain recoverable.

### Agent Context Framework

ACF is moving toward an OpenAI plugin marketplace and personalization system.

Do not revive the old custom orchestration runtime by default. Before adding execution, scheduling, context-compaction, generic subagent, or cloud-runtime machinery, check whether the OpenAI host already owns that responsibility.

ACF's differentiated responsibilities are:

- plugin distribution and provenance
- durable natural-language feedback
- scoped user and project adaptations
- semantic reconciliation when upstream plugins change
- explicit precedence between upstream behavior, learned adaptation, project policy, and the current user instruction

Preserve raw user feedback separately from model-generated adaptations. The feedback history is evidence. A synthesized adaptation is a replaceable interpretation.

Never persist a behavioral preference merely because the model noticed a correction. Ask for explicit confirmation before turning conversational feedback into durable plugin teaching.

Do not edit a managed plugin cache as the personalization mechanism. Avoid permanently forking a user from upstream when a semantic adaptation can preserve their intent.

Current explicit user instruction has the highest precedence.

### Frontend Lib

Frontend Lib is the UI system for model-authored product work and the intended interface foundation for Eco.

Prefer its public vocabulary over direct use of underlying UI libraries once the package exists.

The current direction is:

- Base UI stays behind the public component layer.
- Public components use a small predictable namespace such as `ui.button`.
- Common composites should be simple to consume.
- State should be explicit in props and `data-*` attributes.
- Styling should use central tokens and themes.
- Installed source remains application-owned and editable.
- The CLI must understand ownership, drift, removal, configuration, and upgrades.

Do not bypass the system with one-off component recipes when the required concept belongs in Frontend Lib.

For product UI, prefer visual structure over explanatory text. Do not add cards, eyebrow labels, badges, instructional paragraphs, invented metrics, or decorative framing unless they have a concrete job. Reuse the product's real spacing, typography, controls, status treatments, and density.

## Repository and workstream discipline

Preserve unrelated changes.

Use one branch for one logical workstream. Keep changes bounded enough that the diff has one coherent purpose.

Once repository, base branch, base commit, work branch, current head, and pull request are known, retain that state. Do not repeatedly rediscover it without a reason.

For non-trivial work:

1. establish the baseline once;
2. create a work branch;
3. make one bounded conceptual change;
4. commit it atomically;
5. expose the work through a draft pull request early;
6. continue through reviewable checkpoints;
7. run broad verification once after the implementation checkpoint;
8. inspect failures only;
9. fix failures owned by the change.

Do not use GitHub Actions as an execution REPL. Do not poll CI.

Do not stash, discard, overwrite, or reformat unrelated user work.

Do not push, merge, deploy, publish, or release unless the user's request authorizes that action.

## Architecture rules

Prefer one application reality on a branch. Do not preserve incompatible product states with runtime flags, compatibility modes, fallback paths, or duplicate implementations when separate branches can represent the alternatives.

Avoid speculative abstraction. Add a package, service, adapter, or framework boundary when existing requirements need it.

Reuse maintained dependencies before implementing a general mechanism from scratch.

Make invalid states hard to represent. Parse untrusted input at boundaries. Keep ownership and mutation authority explicit.

For concurrent work, give one mutable branch and index to one active writer. Use another worktree only when simultaneous filesystem access actually requires it.

## Documentation

Documentation is part of the product architecture in this repository.

Use concrete terms consistently. If two concepts have different lifecycle, authority, or persistence semantics, give them different names.

Separate established decisions from current hypotheses. Mark open questions instead of turning them into accidental contracts.

When adopting an external project or idea, record the source, the behavior being adopted, and any licensing obligations. A visual or architectural reference is evidence, not permission to copy unrelated product structure.

Keep diagrams close to the concepts they explain. ASCII diagrams are preferred when they make spatial or state relationships easier to see in plain text.

## Verification

Use the narrowest verification that proves the changed behavior. Package-specific instructions may define exact commands later.

For documentation-only work, verify paths, links, terminology, and internal consistency. Do not invent a runtime verification claim when no runtime exists.

Report evidence honestly:

- verified structurally
- verified by focused tests
- verified by broader tests
- verified by CI
- not executable in the current environment

## Communication

Use plain English. State the outcome, reason, tradeoff, and verification without making the reader reconstruct missing steps.

Avoid generic AI prose, decorative headings, filler, and repeated conclusions. Prefer concrete facts and decisions over claims that something is "robust", "clean", or "powerful".
