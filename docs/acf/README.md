# Agent Context Framework

## Current direction

The name "Agent Context Framework" is provisional. A replacement name has not been chosen.

Agent Context Framework is being redesigned around OpenAI plugins.

The new ACF is not primarily a model runtime. It is a way to distribute agent behavior, let users teach that behavior over time, and carry those teachings across upstream plugin updates without permanently forking the plugin.

The distribution mechanism is an OpenAI plugin marketplace. The differentiated ACF behavior is personalization.

OpenAI plugin documentation discussed during the design work: https://developers.openai.com/plugins/build/plugins

## Why change the old ACF

The existing agent-context-framework repository grew into two different things.

One part is valuable learned behavior:

- baseline instructions;
- focused skills;
- repository discipline;
- verification rules;
- writing rules;
- source attribution;
- checks that turn some prose rules into evidence;
- practical lessons learned from repeated Codex use.

The other part is a substantial custom execution system with objective scheduling, durable orchestration, workflow runtimes, persistence, budgets, leases, task envelopes, and related infrastructure.

The current direction is to keep the first category and stop treating the second category as the reason ACF must exist.

OpenAI increasingly owns generic model execution, sessions, tools, cloud execution, and ordinary agent orchestration. ACF should only add runtime machinery when a concrete requirement remains unsolved by the host.

The old runtime code is useful research material. It should not silently become the architecture of the new monorepo.

## Plugin customization should look like teaching

Traditional configuration exposes options the plugin author anticipated.

Agent behavior is mostly natural-language policy. Users often need to say things the author did not predict:

    Stop doing this.
    Do more of that.
    In this situation, use X instead.
    The new behavior is better. Keep it.

ACF should preserve those corrections as durable teaching rather than force them into a fixed settings matrix.

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

This is the same evidence-versus-interpretation distinction that appears elsewhere in Ecosystem, but ACF applies it specifically to learned behavior.

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

ACF should reconcile:

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

Earlier Eco architecture work used the name ACF for a lower runtime layer responsible for:

- active-context projection;
- working-state materialization;
- hybrid retrieval;
- evidence and provenance;
- information-flow policy;
- disposable summaries and indexes.

That project boundary is historical.

Those ideas now belong with Eco's runtime architecture unless a later decision deliberately extracts a reusable package.

Do not use the old ACF name as evidence that Eco must depend on an ACF context runtime.

## What ACF does not need to prove

ACF does not need to be provider-neutral for its own sake.

The current direction is explicitly OpenAI-native because the project is informed by repeated GPT and Codex use and because OpenAI's plugin model now provides the distribution mechanism being targeted.

That may change later, but provider abstraction is not a current requirement.

Likewise, portable ChatGPT-funded inference was discussed as a commercially interesting possibility for Eco and third-party software. It is not an ACF architecture requirement and should not be assumed until the developer contract is known.

## First implementation target

The smallest useful ACF experiment should test the personalization model rather than recreate the old runtime.

A good prototype would prove:

1. a marketplace can install one opinionated plugin;
2. a user can provide natural-language feedback;
3. the feedback is stored separately from the plugin;
4. explicit confirmation controls durability;
5. a synthesized adaptation changes future behavior;
6. a simulated upstream plugin update can semantically reconcile the adaptation;
7. the original feedback remains available if synthesis needs to be regenerated.

Everything beyond that should earn its place from a concrete need.
