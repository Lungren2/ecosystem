# Open questions

This file keeps unresolved choices visible.

A question in this file is not permission to choose an answer silently during implementation. Resolve it deliberately and move the result into the document that owns the decision.

## Ecosystem

### Agent and holon identity

The later architecture discussion explicitly separated agent from holon, while earlier wording described the persistent agent as the wholarchy.

We still need a precise product and runtime definition for:

- agent;
- cognitive participant;
- holon;
- root wholarchy;
- thread identity.

The important current constraint is that none of these should be equated merely because one UI element happens to represent several of them.

### Group to runtime mapping

The interface uses group tabs.

The runtime says a group is a shared event stream and may exist inside one holon.

We have not decided whether a UI group owns one workplane, can span several holons, can be nested, or can be projected from another organisational unit.

Do not set "group = holon" as a storage invariant.

### Pane model

We need to decide:

- pane identity and persistence;
- layout representation;
- how off-screen panes are retained;
- how splits are created and removed;
- how a newly opened view is placed;
- whether one resource can have several pane views;
- how a thread selection focuses or creates a pane;
- how layouts restore across restarts.

### Keyboard model

The old prototype used Alt+Left/Right for views and Alt+Up/Down for workspaces.

Eco wants Niri-like geometric navigation, but exact bindings are not chosen.

Group switching needs a separate cheap action.

### Desktop fork maintenance

The desktop is a Code OSS / VS Code fork. The old Monaco/Tauri prototype remains evidence for interaction behavior, not the application base.

The initial fork work still needs to decide:

- which upstream VS Code commit becomes the first imported baseline;
- how upstream updates are imported and reviewed;
- how Ecosystem-specific patches remain easy to distinguish from upstream code;
- how product branding and build configuration are maintained;
- when remote-authority switching becomes part of ProjectSession activation.

Do not replace the VS Code fork with a separate desktop stack during unrelated implementation work.

### ProjectSession suspension policy

Local project switching is the first target. We still need exact policies for terminal recreation, extension-spawned child processes, task and debug teardown, chat-session isolation, leak detection, and failure rollback.

Inactive ProjectSessions should own serialized state, not live project-owned runtime processes, except for behavior explicitly classified as keep-alive.

### Canonical event store

We have not selected the durable event format, database, event identity scheme, indexing system, or materialization strategy.

Requirements already identified:

- raw evidence remains recoverable;
- projections can be rebuilt;
- provenance survives retrieval;
- corrections and supersession remain explicit;
- access can be scoped by purpose and authority.

### Working graph schema

Hypotheses, findings, decisions, constraints, tasks, evidence, contradictions, dependencies, ownership, and supersession have been discussed.

The exact schema and which relationships deserve first-class types remain open.

### Proactive context projection

The runtime should not rely only on the model choosing to retrieve.

We still need to define the signals that trigger projection, the retrieval budget, ranking, stale-state handling, and how the system proves why a piece of evidence entered an activation.

### Information-flow policy

Persistent agents can observe information from several scopes.

We need a capability model for:

- private participant history;
- current group events;
- forwarded evidence;
- inherited parent evidence;
- project resources;
- external sources.

Observation, communication, and mutation authority should remain separable.

### Cognitive groups

Snapshot-isolated rounds, silence, bounded delegation, and later cross-examination are current ideas.

We have not chosen scheduler semantics, compute budgets, participation gates, or the conditions under which a group becomes preferable to another single activation.

### Observability

The system should detect contradictions, unsupported claims, stale assumptions, unowned obligations, regressions, and decomposition gaps.

We still need to decide which checks are deterministic, which require models, and how to prevent the observer from becoming another source of ungrounded authority.

### Cross-run learning

GEPA and similar approaches were discussed as references for learning from repeated execution.

No learning system is selected.

Local session facts must stay separate from generalized behavior.

## Practice

### ChatGPT conversation acquisition

The Chrome extension needs enough conversation metadata and content to index, export, archive, delete, and navigate chats.

chatgpt.com does not provide a stable extension API for those operations. We still need to choose the least brittle supported acquisition path and isolate it behind the extension compatibility adapter.

Use `practice/tools/chatgpt-capture/` to collect sanitized HAR metadata and DOM structure for narrow flows before choosing that path. The first evidence set should cover initial load, history scrolling, opening a conversation, archiving one disposable conversation, and search.

The capture tool does not retrieve response bodies. If a later question genuinely requires response content, expand the capture policy deliberately rather than silently collecting it.

Do not spread DOM selectors, private request formats, or internal route assumptions through product code.

### ChatGPT companion persistence

We still need to choose the local store for conversation index entries, bookmarks, archive-rule history, and compatibility metadata.

The index must remain rebuildable. Browser-local state should not become a second authoritative copy of ChatGPT conversations.

### Auto archive policy

The first rule direction is inactivity-based archive with bookmark exceptions.

We still need to decide the default inactivity period, whether actions run automatically or begin in proposal mode, how users review prior auto-archive actions, and how failures retry.

Automatic deletion is out of scope.

### Split-conversation fallback

Chrome documents programmatic Split View creation for Chrome 155 and later.

We still need a fallback for browsers without that API. The fallback must use real ChatGPT tabs or windows and must not embed cloned ChatGPT application instances.

### Plugin packaging

The target is an OpenAI-native marketplace, but the exact package layout and compatibility strategy should follow the plugin format we actually implement against.

Do not freeze a custom package format before the first plugin prototype.

### Adaptation storage

We need durable locations and schemas for:

- raw feedback;
- confirmation metadata;
- synthesized adaptation;
- source plugin version;
- reconciliation history;
- user scope;
- project scope.

Do not put this state inside an upstream-managed plugin cache.

### Adaptation loading

We still need the cleanest supported mechanism for making the relevant adaptation available when a plugin skill runs in ChatGPT or Codex.

Possibilities discussed included plugin scripts, MCP, and host configuration. None is selected.

### Feedback capture

We need a user experience for suggesting durable feedback without turning every correction into a modal or command.

The system should notice likely reusable teaching, explain which plugin or skill it would affect, and require confirmation.

### Semantic reconciliation

We need to define the output contract for upgrade reconciliation.

At minimum it must represent:

- adaptation still needed;
- satisfied upstream;
- conflict;
- obsolete behavior;
- ambiguous and requires confirmation.

The first prototype should keep raw feedback available so different reconciliation strategies can be compared.

### Marketplace boundaries

We have not decided whether the initial marketplace contains a small number of broad plugins or many narrow plugins.

Old ACF skill directories are source material, not the package plan.

## Interface

### Public import and namespace

The product name is Interface. The example `ui` namespace and final package/import names remain open.

### Internal package boundaries

Interface has a fixed top-level owner at `interface/`. The initial migration should preserve the existing editor, CLI, engine, registry, tests, and vendored-source boundaries inside that owner.

Those internal boundaries may change as the implementation evolves. We have not decided which should remain separate packages long term.

### Registry format

We have not decided whether to reuse shadcn registry formats, create a smaller internal format, or use another source manifest.

### Styling contract

Plain CSS, custom properties, classes, and data attributes are current direction.

The exact token schema, stylesheet layering, theme format, and variant model remain open.

### Ownership and upgrades

The config-versus-lock split is directionally settled, but exact file schemas, hashing, modified-file policy, migration behavior, and merge support are not.

### Visual editor

tweakcn was proposed as an Apache-2.0 direct-port source for a visual editor.

That adoption has not been approved for Ecosystem.

If it is used, source provenance and license obligations must be recorded before copied code enters the main packages.

## Shared

### First vertical slice

We have not chosen which project provides the first executable slice of Ecosystem.

Likely candidates include:

- an Ecosystem shell that proves groups, thread rail, and spatial pane navigation;
- a Practice plugin personalization prototype;
- a minimal Interface foundation needed to build the Ecosystem shell.

The choice should prove a risky product assumption rather than maximize initial code volume.

### Shared persistence

Ecosystem, Practice personalization, and desktop workspace state all need persistence, but they do not necessarily need one database or schema.

Do not unify storage simply because the projects share a monorepo.

### Authentication and inference economics

Portable ChatGPT identity, subscription-backed inference, and OpenAI-managed agent execution were discussed as important ecosystem changes.

They are not yet implementation assumptions. Verify the actual developer contracts before designing product economics or authorization around them.
