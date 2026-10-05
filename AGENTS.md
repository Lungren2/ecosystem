# Repository instructions

These instructions apply to the whole monorepo unless a deeper `AGENTS.md` narrows them for a package or application.

## Start with the project model

Read `README.md` before changing architecture or product behavior. Read the nearest package instructions and the documents that own the concept you are modifying.

Do not infer that familiar terms mean familiar architecture. Ecosystem (Eco), Practice, and Interface intentionally reject several common agent and frontend defaults.

When a concept changes, update the documentation that defines it in the same workstream. Do not leave an obsolete thesis behind working code.

Canonical concept owners:

- `docs/ecosystem/architecture.md` owns the Ecosystem runtime and cognition model.
- `docs/ecosystem/interface.md` owns the desktop shell, groups, thread rail, panes, and spatial navigation.
- `docs/ecosystem/desktop.md` owns the Code OSS fork, ProjectSession lifecycle, and upstream-workbench policy.
- `docs/practice/README.md` owns the Practice marketplace and personalization model.
- `docs/practice/chatgpt-companion.md` owns the ChatGPT companion, Chrome extension, and Codex Control MCP boundaries.
- `docs/interface/README.md` owns the Interface design direction.
- `docs/open-questions.md` records choices that are deliberately unresolved.

If a needed choice is still in `docs/open-questions.md`, do not silently resolve it as part of unrelated implementation work.

## Keep the three projects distinct

### Ecosystem

Ecosystem is the full product name. Eco is the short form. It is the user-facing work environment.

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
- ProjectSession != group
- ProjectSession != thread
- ProjectSession != pane
- ProjectSession != holon
- conversation graph != work graph
- canonical event log != working graph
- working graph != active context

A group is a shared event stream. Agents may have private continuity outside the group. Replies, forwards, mentions, delegation, and evidence references should remain explicit relationships rather than being flattened into transcript text.

When runtime work begins, prefer canonical events and provenance over destructive memory rewriting. Summaries and indexes may be disposable. Original evidence should remain recoverable.

### Practice

Practice is the OpenAI plugin marketplace and personalization system.

Do not revive the old custom orchestration runtime by default. Before adding execution, scheduling, context-compaction, generic subagent, or cloud-runtime machinery, check whether the OpenAI host already owns that responsibility.

Practice's differentiated responsibilities are:

- plugin distribution and provenance
- durable natural-language feedback
- scoped user and project adaptations
- semantic reconciliation when upstream plugins change
- explicit precedence between upstream behavior, learned adaptation, project policy, and the current user instruction

Preserve raw user feedback separately from model-generated adaptations. The feedback history is evidence. A synthesized adaptation is a replaceable interpretation.

Never persist a behavioral preference merely because the model noticed a correction. Ask for explicit confirmation before turning conversational feedback into durable plugin teaching.

Do not edit a managed plugin cache as the personalization mechanism. Avoid permanently forking a user from upstream when a semantic adaptation can preserve their intent.

Current explicit user instruction has the highest precedence.

### Interface

Interface is the UI system for model-authored product work and the intended interface foundation for Ecosystem.

Prefer its public vocabulary over direct use of underlying UI libraries once the package exists.

The current direction is:

- Base UI stays behind the public component layer.
- Public components use a small predictable namespace such as `ui.button`.
- Common composites should be simple to consume.
- State should be explicit in props and `data-*` attributes.
- Styling should use central tokens and themes.
- Installed source remains application-owned and editable.
- The CLI must understand ownership, drift, removal, configuration, and upgrades.

Do not bypass the system with one-off component recipes when the required concept belongs in Interface.

For product UI, prefer visual structure over explanatory text. Do not add cards, eyebrow labels, badges, instructional paragraphs, invented metrics, or decorative framing unless they have a concrete job. Reuse the product's real spacing, typography, controls, status treatments, and density.

## Repository placement policy

The top-level layout is an ownership map, not a frozen package map. Every new file must have an owner before it has a path.

Use these homes:

```text
ecosystem/
├─ apps/
│  └─ desktop/          Code OSS / VS Code fork for the Ecosystem desktop
├─ practice/            Practice-owned plugins, personalization, marketplace code
├─ interface/           Interface-owned registry, engine, CLI, editor, and source
├─ packages/            Proven libraries shared across top-level owners
├─ tests/               Cross-owner integration and end-to-end tests only
├─ docs/
│  ├─ ecosystem/
│  ├─ practice/
│  └─ interface/
├─ prototypes/          Disposable or explicitly experimental work
└─ tooling/             Repository-wide development, build, and release tooling
```

Root configuration, workspace manifests, lockfiles, and repository policy files may remain at the repository root when they govern the whole monorepo.

Choose a path in this order:

1. User-facing Ecosystem desktop code belongs in `apps/desktop/`, which preserves the Code OSS / VS Code repository structure.
2. Plugin distribution, plugin source, durable teaching, adaptation, reconciliation, and Practice-specific tooling belong in `practice/`.
3. UI components, tokens, registry source, installation logic, theme tooling, and Interface-specific applications belong in `interface/`.
4. A library used by more than one top-level owner may move to `packages/<name>/` only when it has a named responsibility and a real dependency boundary.
5. Tests stay with the code they verify. Use root `tests/` only when the test spans top-level owners.
6. Documentation belongs under `docs/<owner>/` unless it documents one package's private implementation and is clearer beside that package.
7. Experiments that production code must not depend on belong under `prototypes/<topic>/`.
8. Scripts that operate on one owner stay with that owner. Use root `tooling/` only for repository-wide automation.

If none of these homes fit, stop and update the ownership map before creating another top-level directory.

Within an owner, place code beside the concept that owns it. Prefer capability directories over generic technical buckets. Do not create catch-all `common`, `shared`, `core`, `lib`, `utils`, or `helpers` directories as a place to avoid choosing ownership.

Do not create a package merely because new TypeScript needs a directory. Start inside the owning area and split a package when at least one of these is true:

- it is a separately executable application or tool;
- it needs a distinct runtime or dependency boundary;
- two or more owners consume the same named contract;
- it has an independently testable public API that callers should depend on instead of its internals;
- an adopted existing project already has a proven package boundary that we are intentionally preserving.

A package is an implementation boundary, not a category label.

### Current owner defaults

The desktop app is a Code OSS / VS Code fork. Preserve upstream directory ownership so upstream code remains recognizable and future updates stay reviewable.

When changing existing VS Code behavior, edit the upstream subsystem that owns it. When Ecosystem adds a new workbench capability with no upstream owner, place it by VS Code convention:

- lifecycle, state, and reusable workbench services belong under `apps/desktop/src/vs/workbench/services/<capability>/`;
- user-facing workbench contributions belong under `apps/desktop/src/vs/workbench/contrib/<capability>/`;
- platform-level code belongs under `apps/desktop/src/vs/platform/<capability>/` only when it is genuinely below the workbench layer.

Do not create a catch-all `src/vs/ecosystem` tree. Do not reorganize upstream files merely to match the rest of this monorepo. Keep the desktop fork's upstream package manager and build layout intact unless a dedicated migration workstream changes them.

ProjectSession lifecycle code defaults to `apps/desktop/src/vs/workbench/services/projectSessions/`. Project-session chrome and commands default to `apps/desktop/src/vs/workbench/contrib/projectSessions/`.

Practice starts with these default homes:

```text
practice/
├─ plugins/             installable plugin and marketplace source
├─ apps/                separately executable Practice-owned applications
├─ tools/               Practice-owned development and inspection tools
├─ src/                 personalization, reconciliation, and marketplace behavior
└─ tests/               Practice-wide integration tests
```

The ChatGPT companion defaults to `practice/plugins/chatgpt-companion/` for the OpenAI plugin and MCP capability, and `practice/apps/chatgpt-extension/` for the Chrome extension. Keep chatgpt.com compatibility code inside the extension instead of spreading DOM or private-request assumptions through Practice.

Development-only evidence capture for that compatibility work belongs in `practice/tools/chatgpt-capture/`. Capture tooling must sanitize authentication material and user content before writing shareable evidence. Do not commit raw HARs or unsanitized page dumps.

Do not migrate the old Agent Context Framework runtime wholesale. Move source into Practice only when it serves the current Practice design.

Interface already has proven internal boundaries in the existing Frontend Lib repository. Preserve them initially under the Interface owner rather than scattering them across the monorepo:

```text
interface/
├─ apps/
│  └─ editor/
├─ packages/
│  ├─ cli/
│  └─ engine/
├─ registry/
├─ tests/
└─ vendor/
   └─ tweakcn/
```

These are defaults, not permanent architecture. Change them in a bounded architecture workstream when the code gives us evidence for a better boundary.

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
