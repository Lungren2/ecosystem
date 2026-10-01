# Practice

## Current direction

Practice is the successor to the Agent Context Framework (ACF) project and is being redesigned around OpenAI plugins.

Practice is not primarily a model runtime. It is a way to distribute agent behavior, let users teach that behavior over time, and carry those teachings across upstream plugin updates without permanently forking the plugin.

The distribution mechanism is an OpenAI plugin marketplace. Practice's differentiated behavior is personalization.

OpenAI plugin documentation discussed during the design work: https://developers.openai.com/plugins/build/plugins

## Why change the old ACF

The existing agent-context-framework repository mixed reusable Codex skills with a larger instruction, governance, repository-policy, and execution system.

Practice currently carries forward only selected skill directories. Their references, scripts, fixtures, source metadata, cached documentation, and upstream license files remain part of each skill.

The ACF instruction registry, governance system, repository-policy framework, objective scheduling, workflow runtime, persistence machinery, and orchestration code remain historical unless a later requirement adopts a specific piece.

OpenAI increasingly owns generic model execution, sessions, tools, cloud execution, and ordinary agent orchestration. Practice should only add runtime machinery when a concrete requirement remains unsolved by the host.

The old runtime code is useful research material. It should not silently become the architecture of the new monorepo.

## Pinned ACF reference

Practice pins the historical ACF repository at commit `cd0516aa39472f64a460028a05449ae4e71fe244`.

The reference is materialized on demand into the gitignored `.references/agent-context-framework` directory. Practice does not import the repository as a subtree or package dependency.

This reference exists so future work can inspect the exact source that informed Practice. The current adoption boundary is the selected skill catalog in `practice/reference/acf/selected-skills.txt`.

Selected skills install into `.codex/skills/` with complete supporting files and pinned commit provenance. The rest of ACF remains historical by default.

## Plugin customization should look like teaching

Traditional configuration exposes options the plugin author anticipated.

Agent behavior is mostly natural-language policy. Users often need to say things the author did not predict:

    Stop doing this.
    Do more of that.
    In this situation, use X instead.
    The new behavior is better. Keep it.

Practice should preserve those corrections as durable teaching rather than force them into a fixed settings matrix.

## Three forms of state

For each personalized plugin, preserve three distinct things.

    1. UPSTREAM
       What the plugin author currently ships.

    2. FEEDBACK LOG
       What the user actually said.

    3. SYNTHESIZED ADAPTATION
       The current interpretation of that feedback.

The feedback log is durable evidence.

The synthesized adaptation is replaceable. If synthesis is poor, a newer model or reconciliation process can regenerate it from the original feedback.

This is the same evidence-versus-interpretation distinction that appears elsewhere in Ecosystem, but Practice applies it specifically to learned behavior.

## Feedback should preserve intent

A durable correction should describe what the user wants, not patch the current wording of a skill.

Bad persistence:

    - Prefer cards.
    + Prefer tables.

Better persistence:

    Prefer dense tables for repeated structured desktop data.
    Cards remain appropriate when each entity has distinct actions
    or heterogeneous information.

A text patch is coupled to one upstream version. A semantic preference can survive a rewrite.

## Scope and provenance

Feedback should be attributable to the behavior it modifies.

An adaptation may record:

- marketplace;
- plugin;
- skill;
- concept;
- source plugin version;
- original user feedback;
- time;
- confirmation state.

A frontend preference should not automatically affect debugging or database work.

This matters because plugin skills can be selectively loaded. Personalization should preserve that granularity instead of injecting one global preference blob into every task.

## Explicit confirmation

The system may notice that a conversational correction looks reusable.

For example:

    User:
    Don't add an eyebrow above every heading. It is redundant.

The product may identify that as a likely persistent frontend preference and offer to save it.

It must not save it silently.

A frustrated one-off correction, experiment, or task-specific request should not gradually mutate long-term behavior without the user's approval.

## Effective precedence

The intended precedence is:

    marketplace plugin
            |
            v
       plugin skill
            |
            v
      user adaptation
            |
            v
     project adaptation
            |
            v
    current explicit instruction

The current conversation wins.

A learned preference is a default, not a mechanism for overruling a user's immediate request.

## Upgrades are reconciliation events

Suppose a user taught version 1.4 of a plugin to prefer dense tables over cards for repeated structured data.

Version 2.0 may already encode that behavior.

Practice should reconcile:

    OLD UPSTREAM
         |
         | change
         v
    NEW UPSTREAM
         |
         +------------------+
         |                  |
    current adaptation   feedback history
         |                  |
         +---------+--------+
                   |
                   v
             reconciliation
                   |
          +--------+---------+
          |                  |
    new adaptation     conflicts / questions

For each existing adaptation, reconciliation should determine whether it is:

- still necessary;
- now satisfied upstream;
- in conflict with new upstream behavior;
- obsolete because the behavior disappeared;
- ambiguous and in need of user confirmation.

The merge unit is intent rather than lines of text.

## User and project adaptations

The discussion converged on at least two durable personalization levels.

User adaptation records a person's reusable preference across projects.

Project adaptation records guidance that belongs to one repository or product.

They should remain separate because the same person may want different behavior in different products.

The current conversation remains above both.

The exact storage paths and OpenAI host integration are open questions.

## Marketplace role

The marketplace should distribute useful behavior as installable plugins rather than force every project to reconstruct the same instructions and skills.

Likely source material from the old ACF includes:

- focused design and engineering skills;
- debugging discipline;
- TypeScript invariant design;
- reuse-before-implementation behavior;
- operational-boundary design;
- shared-state discipline;
- frontend design judgment;
- writing rules;
- repository and verification discipline;
- source and license provenance.

The final plugin boundaries are not decided. Do not create one plugin per old directory by default.

## Historical context layer

Earlier Ecosystem architecture work used the name ACF for a lower runtime layer responsible for:

- active-context projection;
- working-state materialization;
- hybrid retrieval;
- evidence and provenance;
- information-flow policy;
- disposable summaries and indexes.

That project boundary is historical.

Those ideas now belong with Ecosystem's runtime architecture unless a later decision deliberately extracts a reusable package.

Do not use the old ACF name as evidence that Ecosystem must depend on an ACF context runtime.

## What Practice does not need to prove

Practice does not need to be provider-neutral for its own sake.

The current direction is explicitly OpenAI-native because the project is informed by repeated GPT and Codex use and because OpenAI's plugin model now provides the distribution mechanism being targeted.

That may change later, but provider abstraction is not a current requirement.

Likewise, portable ChatGPT-funded inference was discussed as a commercially interesting possibility for Eco and third-party software. It is not a Practice architecture requirement and should not be assumed until the developer contract is known.

## First implementation target

The smallest useful Practice experiment should test the personalization model rather than recreate the old runtime.

A good prototype would prove:

1. a marketplace can install one opinionated plugin;
2. a user can provide natural-language feedback;
3. the feedback is stored separately from the plugin;
4. explicit confirmation controls durability;
5. a synthesized adaptation changes future behavior;
6. a simulated upstream plugin update can semantically reconcile the adaptation;
7. the original feedback remains available if synthesis needs to be regenerated.

Everything beyond that should earn its place from a concrete need.
