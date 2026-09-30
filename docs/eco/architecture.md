# Eco architecture

## Current direction

Eco is a desktop environment for long-running agentic work. Its main architectural problem is coherence over time.

The discussion started from a simple observation: capable models can solve many local problems but become unreliable when a long task requires them to preserve a large set of dependent decisions, assumptions, evidence, and obligations. Eco moves that burden out of one model session and into durable state that the system can inspect and revise.

The user may experience one coherent assistant, several named participants, or a group conversation. Those interaction choices must not dictate the internal persistence model.

## Keep the structures separate

The strongest recurring rule in the design is that related structures must not be collapsed because they happen to appear together in a chat UI.

    event log          != working graph
    working graph      != active context
    work map           != wholarchy
    activation         != agent
    agent              != holon
    agent              != group
    group              != shared model context
    conversation graph != work graph
    work decomposition != organisational differentiation
    pane visibility    != lifecycle

Earlier notes described the persistent agent as a wholarchy of durable local worlds. Later discussion sharpened that wording. A holon is a durable local world with scope and authority. It is not itself a model call, chat thread, group, or necessarily the same thing as a user-visible agent identity.

The exact product-level relationship between agent identity and holons remains open. The distinction itself is current direction.

## Work map, wholarchy, and activations

A work map describes the structure of the problem.

A wholarchy describes which durable local worlds actually exist.

An activation graph records model calls over time.

A complicated request can therefore begin as one durable whole with many work items rather than immediately spawning one subagent per item.

    WORK MAP

    protocol decision
          |
          +---- server rotation
          |
          +---- client compatibility
          |
          +---- migration validation


    WHOLARCHY

    root
      |
      +---- legacy-client compatibility


    ACTIVATIONS

    root/discovery
         |
    root/design
         |
    root/implementation
           \
            +---- root/diagnostic

A new model call is cheap compared with creating a new organisational boundary. Eco should try another activation, another model, another reasoning effort, or bounded parallel cognition before creating a child holon.

A child holon is justified when the boundary reduces the coupled state the parent must maintain enough to pay for projection, coordination, review, integration, and later invalidation.

The earlier notes called this net attention relief.

## Durable local worlds

A holon owns durable accepted state rather than deriving its identity from one transcript.

A local world may retain:

- purpose and scope;
- accepted decisions;
- inherited constraints;
- unresolved obligations;
- a work dependency graph;
- repository or external-resource handles;
- owned mutations;
- child relationships;
- assumptions and their consumers;
- evidence;
- review findings;
- contribution and acceptance state.

A different model, reasoning effort, thread, retry, or process can continue work on the same world.

The model realizes a point of view temporarily. The world carries continuity.

## Parent-child membranes

When Eco does create a child, the parent-child boundary should define what crosses it.

Parent to child:

- purpose;
- scope;
- accepted decisions;
- constraints;
- relevant evidence references;
- authority;
- expected contribution.

Child to parent:

- proposed mutations;
- claims;
- evidence;
- risks;
- questions;
- new obligations.

A child can establish local readiness. It cannot unilaterally declare that its contribution is valid for the larger whole.

    child work
       |
    contribution
       |
    parent review
       |
       +---- reject with reason -> same child, revised world, new activation
       |
       +---- accept -> integration

Boundary violations are useful evidence. If a child repeatedly needs to mutate sibling-owned state or import most of the parent's context, the boundary may be wrong.

Communication may be lateral while mutation authority remains hierarchical. Being able to observe or challenge a sibling does not imply authority to rewrite its work.

## Canonical evidence and disposable interpretation

The context discussion converged on four layers:

                  MODEL
                    |
             ACTIVE CONTEXT
                    |
             WORKING GRAPH
                    |
             HISTORY INDEX
                    |
              RAW EVENT LOG

The raw event log is canonical evidence. It can contain user messages, model messages, tool calls, tool results, artifacts, corrections, timestamps, source identity, and provenance.

The history index is a set of ways to locate evidence. It may include exact search, lexical search, semantic similarity, file and symbol references, temporal locality, reply edges, explicit marks, tool provenance, and source identity.

The working graph is the current structured interpretation. It can contain hypotheses, findings, decisions, constraints, tasks, evidence links, contradictions, dependencies, ownership, and supersession.

Active context is a temporary projection for the current activation.

The design principle is persistent evidence and ephemeral interpretation. Summaries, indexes, and projections can be rebuilt. Correctness should remain recoverable from the original evidence.

## Marks and provenance

A mark should identify or relate evidence rather than rewrite it into a new authoritative memory.

For example, a decision record should point to the event that established the decision and the event it supersedes. A finding should point to the observation or test that supports it.

Retrieved history is evidence, not authority.

Repeated model claims that descend from the same source do not count as independent corroboration. The system should retain source classes such as user claim, user correction, model hypothesis, tool observation, test result, code observation, and external source.

## Retrieval cannot rely only on model initiative

A model often does not know that it has forgotten something. Missing context can produce a plausible continuation instead of a retrieval request.

Eco should therefore support proactive context projection.

When an activation edits a file, for example, context assembly may consider recent events touching that file, governing decisions, unresolved findings, failed tests, active obligations, and evidence linked to the affected symbols.

Natural-language references such as "what we decided", "the thing from before", or "that reconnect issue" can also trigger reconstruction.

The exact retrieval implementation is open. The requirement is that context continuity must not depend only on the model deciding to search.

## Groups and persistent participants

A group is a shared event stream, not a shared model context.

Agents or cognitive participants can retain private continuity outside the group. The group receives the messages they publish.

    participant A private history ----\
                                      +---- group event stream
    participant B private history ----/
                                      |
                                      +---- replies
                                      +---- forwards
                                      +---- mentions
                                      +---- evidence references

This matters because the same participant may appear in several groups without merging those groups into one context.

### Snapshot rounds

For independent perspectives, a group round may use snapshot isolation.

    committed group state G(n)

       A reads G(n)
       B reads G(n)
       C reads G(n)

       A produces a(n)
       B produces b(n)
       C produces c(n)

       current-round siblings do not see each other

       commit -> G(n+1)

A later round can deliberately expose the disagreement for cross-examination or synthesis.

"Not automatically attended" is different from "inaccessible". If the user asks A to answer B's objection, the runtime can explicitly project B's message and cited evidence.

### Silence and compute allocation

A participant should be able to abstain.

Agreement with no new information should usually produce silence. Useful participation includes a contradiction, missing requirement, new evidence, downstream consequence, alternative explanation, or unresolved dependency.

Turns can also become bounded compute allocation. One participant may delegate a follow-up to another when the work discovers a dependency, subject to limits that prevent loops or domination.

These ideas are current architectural direction, but the exact scheduler is not chosen.

## Conversation graph and work graph

Replies, mentions, forwards, delegation, and evidence references should be first-class edges.

Conversation can also create structured work underneath the chat. A statement such as "I'll validate FTM behavior first" may imply an owner, task, and blocking dependency in the working graph.

The user can continue to see a familiar conversation while the runtime tracks commitments and dependencies.

The conversation graph and work graph remain separate because a conversational relationship is not the same thing as a work dependency.

## Observability

Eco should inspect the structure produced by cognition rather than waiting for the user to discover every inconsistency manually.

The system should be able to surface questions such as:

- Which accepted requirement has no owner?
- Which decision changed without dependent work updating?
- Which claim has no supporting evidence?
- Which rejected approach has reappeared?
- Which agents disagree?
- Which component has not been challenged?
- Which work is blocked without an owner noticing?

Observability is not only telemetry. It is a way to detect contradictions, stale assumptions, regressions, unsupported claims, ownership gaps, and decomposition failures in durable state.

## Selective invalidation

When an accepted assumption or decision changes, dependent state should be identifiable.

    decision A
      |
      +---- work item B
      +---- contribution C
      +---- proposal D

If A changes, Eco can mark B, C, and D stale without discarding unrelated work.

This is structural backtracking. It should not depend on one model remembering every consequence of a decision made much earlier.

## Information flow

Good recall creates a security problem.

A persistent participant may have private history from a confidential group, a public group, and a direct thread. Retrieval must not become a global search across everything that participant has ever seen.

Context access therefore needs purpose- and capability-scoped visibility. The exact capability model is open, but the system must distinguish at least observation, communication, and mutation authority.

Forwarding is an explicit information transfer and should preserve provenance.

## Learning across timescales

The discussion separated local execution history from cross-run learning.

Within one run, the event log and working graph answer what happened here.

Across many runs, a learning process may identify repeated behavioral lessons such as better routing, decomposition, participation, review, delegation, context projection, or boundary formation.

Session facts must not silently become generalized behavior.

GEPA was discussed as one possible learning direction. It is a reference, not a committed dependency.

## Historical ACF boundary

Earlier Eco notes placed ACF below the Eco runtime as the component responsible for active-context projection, materialized working state, hybrid retrieval, provenance, and information-flow policy.

That is now historical project organization.

The ideas remain relevant to Eco, but the current ACF direction is a plugin marketplace and personalization system. Eco should own the runtime concepts it still needs instead of requiring the old ACF runtime as a separate layer.
