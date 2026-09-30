# Ecosystem

Ecosystem is the monorepo for Eco, Agent Context Framework, and Frontend Lib.

The repository starts with documentation because the ideas are still changing quickly. The first job is to preserve the distinctions that matter so implementation does not collapse them into a familiar but weaker product.

## Documentation

The detailed project model lives in [docs](./docs/README.md):

- [Eco architecture](./docs/eco/architecture.md)
- [Eco interface](./docs/eco/interface.md)
- [Agent Context Framework](./docs/acf/README.md)
- [Frontend Lib](./docs/frontend-lib/README.md)
- [Open questions](./docs/open-questions.md)

The root README stays compact. When a detailed document and an old chat summary disagree, use the detailed document until a later decision changes it.

## Projects

### Eco

Eco is a desktop work environment for long-running agentic work.

The interface combines familiar conversation with a spatial workplane. Groups behave more like persistent browser tabs or shared rooms than project folders. Individual threads remain available in a dense sidebar. Inside a group, chat, editor, browser, terminal, diff, evidence views, and other tools can coexist as panes.

The workplane should support fast two-dimensional keyboard navigation inspired by Niri and an older Monaco/Tauri prototype. Moving attention must not destroy state. A terminal can keep running, a browser can keep its navigation state, an editor can keep its buffers, and agents can continue working while their panes are off-screen.

Eco should feel socially familiar before its internals become visible. WhatsApp is a useful reference for consumer-friendly messaging. T3 Code is a useful reference for dense active-work indexing. ChatGPT Desktop is a useful reference for restraint. Helium-style tabs and Niri-style spatial navigation are useful references for switching and movement. These are reference points, not templates to clone.

A rough shell:

```text
┌──────────────┬──────────────────────────────────────────────────────────────┐
│              │ [ Group: Eco ] [ ACF ] [ test-env ] [ Research ]       +  │
│ THREADS      ├──────────────────────────────────────────────────────────────┤
│              │                                                              │
│ ● Sol        │   ┌──────────────┐ ┌──────────────────┐ ┌────────────────┐  │
│   Working    │   │  GROUP CHAT  │ │      EDITOR      │ │    BROWSER     │  │
│              │   │              │ │                  │ │                │  │
│ ○ Research   │   └──────────────┘ └────────┬─────────┘ └────────────────┘  │
│              │                              │                               │
│ ● Reviewer   │                       ┌──────▼───────┐                       │
│   Needs you  │                       │   TERMINAL   │                       │
│              │                       └──────────────┘                       │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

The current Eco thesis keeps several structures separate:

- A work map describes what needs to be done or reasoned about.
- A wholarchy describes which durable local worlds exist.
- An activation graph records model calls over time.
- A conversation graph records messages, replies, forwards, delegation, and participation.
- An evidence graph records canonical events, provenance, support, contradiction, and supersession.

A model activation is not an agent. A work item is not automatically a subagent. A group is not a shared model context. A pane is not a lifecycle boundary.

### Agent Context Framework

ACF is being rethought as an OpenAI-native plugin marketplace and personalization layer.

The useful part is not another generic agent runtime. OpenAI can increasingly own model execution, sessions, tools, cloud environments, and ordinary orchestration. ACF should concentrate on distributing behavior and letting people teach installed plugins over time.

The core personalization model is:

```text
upstream plugin
      +
durable feedback history
      +
current synthesized adaptation
      ↓
effective behavior
```

Raw user feedback is durable evidence. The synthesized adaptation is disposable and can be regenerated.

When a plugin updates, ACF should reconcile the new upstream behavior with the user's original intent. This is a semantic rebase, not a text patch. An upstream change may satisfy an old preference, conflict with it, make it obsolete, or require clarification.

Durable personalization must be explicit. A one-off correction should not silently become permanent policy.

The intended precedence is:

```text
marketplace plugin
      ↓
plugin skill
      ↓
user adaptation
      ↓
project adaptation
      ↓
current explicit instruction
```

The current conversation wins.

OpenAI plugin documentation: <https://developers.openai.com/plugins/build/plugins>

### Frontend Lib

Frontend Lib exists because general-purpose models tend to regress toward generic frontend patterns even when the product requires a stronger visual language.

It is a source-owned UI system intended as a personal replacement for shadcn/ui. The direction is:

- React and TypeScript.
- Base UI provides accessible behavior behind the public components.
- Application code uses a small lowercase namespace such as `ui.button` and `ui.select`.
- Common composite controls hide unnecessary Base UI assembly.
- State and variants use controlled props and `data-*` attributes.
- Styling uses central tokens and themes instead of repeated local recipes.
- Installed component source belongs to the application and remains editable.
- The CLI treats installation, removal, drift, configuration, and upgrades as system operations rather than isolated file copies.

Frontend Lib should make the preferred interface easier for both humans and agents to produce. Eco should use it rather than building a parallel set of ad hoc components.

## Shared design rules

These rules are easy to lose during implementation, so they are repository-level constraints.

1. Preserve distinctions that carry meaning. Do not collapse groups, threads, panes, agents, activations, work items, and durable worlds into one generic tree.
2. Persistent state and current attention are different. Moving away from a pane or group must not imply that its underlying process or state disappears.
3. Canonical evidence should remain recoverable. Summaries, indexes, working state, and active context may be rebuilt.
4. Conversation is an interface and an event stream, not the entire execution model.
5. Prefer familiar interaction before exposing internal agent architecture.
6. ACF should not rebuild commodity execution infrastructure without a concrete reason.
7. Plugin personalization should look like teaching, not a settings matrix.
8. Frontend implementation should use the product's actual design system. Do not let generic cards, badges, explanatory copy, or dashboard patterns appear by default.
9. One branch should contain one application reality. Prefer separate branches over runtime flags or compatibility modes for incompatible product states.

## Repository shape

The exact package boundaries are intentionally not frozen yet. The likely direction is:

```text
ecosystem/
├─ apps/
│  └─ eco/
├─ packages/
│  ├─ acf/
│  └─ frontend-lib/
├─ docs/
├─ prototypes/
├─ AGENTS.md
└─ README.md
```

Do not create empty packages only to match this diagram. Add a boundary when real code or documentation gives it a reason to exist.

## Status

This repository is at the foundation stage. The immediate work is to capture the product thesis, architecture, interaction model, and project boundaries before implementation begins.

Read [AGENTS.md](./AGENTS.md) before making changes.
