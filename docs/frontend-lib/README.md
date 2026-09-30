# Frontend Lib

## Purpose

Frontend Lib is the response to a repeated problem: capable models can write frontend code quickly while repeatedly choosing generic interface patterns that do not match the product.

It is intended as a personal replacement for shadcn/ui and as the default interface system for Eco.

The goal is to make the desired frontend easier for both humans and agents to author by narrowing the vocabulary, centralizing visual decisions, and keeping source ownership inside the application.

"Frontend Lib" is a working name.

## Current direction

The design discussed so far assumes:

- React and TypeScript for the first version;
- Base UI as the accessible behavior dependency;
- application-owned component source rather than opaque package internals;
- plain CSS, custom properties, classes, and data attributes for styling;
- no Tailwind requirement inside the library;
- deterministic CLI installation, removal, configuration, and upgrades.

## Public API

Application code should learn one small namespace rather than a catalog of scattered imports.

Example:

    import { ui } from "@/interface/ui"

    <ui.button />
    <ui.select />

The public vocabulary should feel closer to HTML than to a PascalCase component catalog.

Base UI stays internal. Product screens should normally import the Frontend Lib layer rather than assemble Base UI portals, positioners, triggers, and popups directly.

Advanced escape hatches can exist for cases that genuinely need lower-level composition. They should not define the normal authoring experience.

## Component behavior

Common composite controls should have a simple default API.

State and variants should come from controlled props and data attributes rather than arbitrary local class recipes.

Visual decisions should come from central tokens and themes.

The system should make a coherent product language easier than an ad hoc implementation.

That does not mean every screen should look identical. It means recurring controls, spacing, typography, states, and interaction details should have an authoritative owner.

## Source ownership

Frontend Lib keeps the useful part of the shadcn model: installed component source belongs to the consuming application and remains editable.

The CLI must therefore know which files it installed and whether the user changed them.

A human-editable configuration file and a machine-managed ownership file were proposed as separate concerns.

    ui.config.json
        installation path
        import alias
        theme
        styling mode
        framework preferences

    ui.lock.json
        installed items
        source versions
        file ownership
        hashes
        dependency relationships

The exact filenames may change. The separation should remain.

Without ownership and hashes, safe removal and upgrade behavior becomes guesswork.

## Installation engine

The earlier Frontend Lib proposal separated command-line presentation from the engine that owns filesystem behavior.

The conceptual operations were:

    init
        detect project
        write config
        install foundation
        configure stylesheet/imports

    add
        resolve item graph
        preview changes
        install files/dependencies
        regenerate namespace
        update ownership state

    remove
        read ownership graph
        detect user modifications
        remove safe files
        remove unused dependencies
        regenerate namespace
        update ownership state

    configure
        calculate configuration migration
        preview
        apply

    update
        compare source versions and local hashes
        show diff
        apply selected changes

    doctor
        validate config, dependencies, namespace, imports,
        ownership state, and drift

The important boundary is that an engine owns deterministic planning and mutation. The CLI should mostly parse commands, ask for confirmation, and display results.

## Safe planning and application

The visual-editor proposal developed this further.

A write operation can be split into planning and application:

1. planning performs no writes and returns deterministic proposed changes;
2. the plan includes current-file preconditions and a stable identity;
3. application rebuilds or verifies the plan;
4. stale or modified targets cause the operation to stop before partial mutation.

This idea is useful beyond the editor because model-authored tooling must not casually overwrite application-owned source.

The exact hashing or transaction design is not fixed yet.

## Purpose-based organization

The original proposal grouped installed components by purpose instead of dumping every file into one flat components/ui directory.

Examples included:

- controls;
- forms;
- overlays;
- navigation;
- feedback;
- data display;
- styles;
- internal utilities.

The categories should exist only when real components need them.

The same rule applies in Ecosystem. Do not create empty directories to satisfy an old diagram.

## Visual editor

A visual theme/editor application was part of the Frontend Lib proposal.

The proposed route used tweakcn as a source reference and direct-port candidate under its Apache-2.0 license, with explicit provenance and modification notices.

The intended adoption process was:

1. run the upstream editor unchanged and prove its useful flows;
2. record externally observable behavior;
3. create a local functional replica with source provenance;
4. replace its preview and token adapters with Frontend Lib's registry and engine.

The useful behavior includes token editing, live preview, import/export, persistence, keyboard interaction, and failure states.

This remains a historical implementation proposal, not a requirement that Ecosystem must vendor tweakcn.

If we adopt it later, preserve the source commit, license obligations, notices, and modification provenance.

## Relationship to Eco

Eco needs browser, editor, terminal, conversation, work-graph, evidence, navigation, and many other views to feel like one product.

Frontend Lib is how those views share the same spacing, type, controls, focus behavior, state treatment, and density while remaining editable.

It also gives coding agents an intentionally constrained authoring vocabulary.

Eco should not build a parallel private component system unless a concrete requirement cannot belong in Frontend Lib.

## Agent-first does not mean agent-only

The API should be pleasant for a human developer.

"Agent-first" means predictable naming, explicit state, fewer arbitrary conventions, and a small public vocabulary reduce the number of frontend decisions a model can get wrong.

It should not require generated code, special model metadata, or an interface that is awkward for people.

## Product UI discipline

The UI discussions establish several defaults for Eco and Frontend Lib:

- visual structure is preferable to explanatory prose when structure can communicate the same thing;
- titles and instructional subtitles should not appear by default;
- repeated structured desktop data often belongs in dense tables or lists rather than cards;
- cards need a concrete entity or interaction reason;
- eyebrow labels, decorative badges, invented metrics, and generic dashboard framing should not appear automatically;
- component choice should follow the product's real spacing, type, controls, status treatments, and information density.

These are defaults rather than universal prohibitions. A component should exist because it helps the user operate the product.

## Repository integration

An older proposal gave Frontend Lib its own monorepo with an editor app, CLI, engine, registry, tests, and fixtures.

Ecosystem now provides the containing monorepo, so that old repository shape is reference material rather than a current directory contract.

Create package boundaries only when implementation gives them a real owner.
