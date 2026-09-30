# Eco interface

## Current direction

Eco should combine a serious desktop work environment with interaction patterns that already feel familiar to people who use messaging apps and browsers.

The shell has three different navigation concerns:

1. Group tabs choose the shared work context.
2. The spatial workplane chooses what the user is attending to inside that context.
3. The thread rail chooses who the user is talking to or inspecting.

Do not merge those into one project tree.

A rough shell:

    +--------------+--------------------------------------------------------------+
    |              | [ Eco ] [ ACF ] [ test-env ] [ Research ]                + |
    | THREADS      +--------------------------------------------------------------+
    |              |                                                              |
    | Sol          |  +------------+ +------------------+ +--------------------+  |
    | Working      |  | GROUP CHAT | |      EDITOR      | |      BROWSER       |  |
    |              |  |            | |                  | |                    |  |
    | Research     |  +------------+ +---------+--------+ +--------------------+  |
    | 3 new        |                         |                                  |
    |              |                   +-----v------+                           |
    | Reviewer     |                   |  TERMINAL  |                           |
    | Needs you    |                   +------------+                           |
    +--------------+--------------------------------------------------------------+

Chat is one pane type. It is not the container for every other tool.

## Reference behavior

The visual and interaction references discussed so far each contribute a different behavior.

WhatsApp is the reference for consumer-friendly conversation semantics. Groups, direct conversations, replies, forwarding, unread state, and participant identity should be understandable without explaining agent architecture.

T3 Code is the reference for a dense thread sidebar. A row can communicate repository or work identity, current activity, age, completion, issue or review associations, and background work without becoming a dashboard card.

ChatGPT Desktop is the reference for restraint. The shell should leave room for the work instead of filling the window with permanent chrome.

Helium-style browser tabs are the reference for quickly switching among several active groups.

Niri is the reference for spatial movement. The user should be able to move attention through a two-dimensional arrangement without remembering application-specific panel slots.

The old Monaco/Tauri prototype is evidence that this navigation style predates the current Eco design. It used editor, browser, and terminal as a horizontal sequence, workspaces as a vertical sequence, and persisted state while moving between them.

These are references, not templates to copy.

## The old prototype

The supplied prototype implemented:

- editor, browser, and terminal view order;
- Alt+Left and Alt+Right to move through those views;
- Alt+Up and Alt+Down to move through workspaces;
- per-workspace editor state;
- per-workspace browser URL;
- per-workspace terminal state;
- pooled terminal sessions;
- contextual sidebar behavior tied to the active workspace and view.

Its conceptual matrix looked like this:

                       left / right

                  editor   browser   terminal
                +--------+---------+----------+
    workspace A |  A,E   |   A,B   |   A,T    |
                +--------+---------+----------+
    workspace B |  B,E   |   B,B   |   B,T    |
                +--------+---------+----------+
    workspace C |  C,E   |   C,B   |   C,T    |
                +--------+---------+----------+

                         up / down

Eco should preserve the principle, not necessarily those exact bindings or fixed view types.

## Spatial workplane

The workplane may be wider or taller than the current viewport.

    +------------+ +--------------+ +----------------+ +------------+ +----------+
    | group chat | |   editor A   | |    browser     | |  editor B  | | evidence |
    +------------+ +------+-------+ +----------------+ +------+-----+ +----------+
                          |                                |
                    +-----v------+                   +-----v------+
                    |  terminal  |                   |    diff    |
                    +------------+                   +------------+

Moving left, right, up, or down should move to the geometrically meaningful neighboring pane.

Split-screen is not a special mode. It is the ordinary composition of the workplane.

Opening a terminal, browser, editor, conversation, diff, evidence view, work graph, or documentation view should create or focus a pane in a predictable spatial relationship.

The exact pane-placement algorithm remains open.

## Persistence and attention

Visibility must not control lifecycle.

When the user moves away:

- a terminal can continue running;
- a browser can keep navigation state;
- an editor can keep buffers, cursor, and view state;
- a group can continue receiving events;
- an agent can continue working;
- a background task can finish and produce unread state.

    ATTENTION                 STATE

    Eco visible              running
    ACF hidden               running
    test-env hidden          running
    Research hidden          participants may still work

Changing attention should not imply destruction.

This principle applies at several levels. A pane can be off-screen, a group can be inactive, and a thread can be closed while their underlying durable state still exists.

## Groups

The top tab strip is for groups.

A group tab represents an ongoing shared work context and conversation. It behaves more like a browser tab than a project-folder node.

Groups should be reorderable and cheap to switch between. They can receive activity while hidden.

The runtime meaning of a group remains separate from a holon. The interface may place a workplane behind a group tab, but architecture must not assume that one group equals one holon.

## Thread rail

The left sidebar remains a global thread and participant index.

It should favor density over cards.

An illustrative row:

    Radio
    Investigating FTM reliability                 7m
    Working

    Systems
    Topology proposal ready                       now
    Needs review

    Research
    Offline constraints                           34m
    3 new

Rows should expose useful state without adding explanatory prose that merely narrates the design.

The exact row schema remains open.

## Conversation inside the workplane

A group conversation can occupy a pane beside code, a browser, or a terminal.

    +-----------------+ +----------------------------------+
    |      CHAT       | |              EDITOR              |
    |                 | |                                  |
    | Sol             | | src/runtime/context.ts           |
    | Research        | |                                  |
    | You             | |                                  |
    +-----------------+ +----------------------------------+

              |                         |
              v                         v

    +-----------------+ +----------------------------------+
    |   WORK GRAPH    | |             TERMINAL             |
    |                 | |                                  |
    | auth -> API     | | pnpm test                        |
    |   \-> frontend | |                                  |
    +-----------------+ +----------------------------------+

Sometimes chat is central. Sometimes it is peripheral. The product should not force every task back through a chat-shaped viewport.

## Thread and pane interaction

A thread is not a pane.

A thread is a durable conversational relationship or participant history. A pane is a current view onto something.

The discussion suggested two possible behaviors when the user selects a thread:

- focus the pane already showing that thread;
- open or place the thread near the current pane if no view exists.

That behavior is still an open question and should not be hard-coded into the architecture yet.

## Keyboard navigation

The goal is spatial predictability.

The user should be able to navigate the workplane without learning that "terminal is panel 3" or "browser is activity item 6".

The old prototype used Alt+Arrow navigation. Eco may use a different chord, but the semantics should remain geometric.

Group switching needs a separate cheap action so pane movement and group movement do not compete for the same mental model.

Exact key bindings remain open.

## Consumer familiarity

Eco's internal model can include durable worlds, activations, working graphs, evidence provenance, selective invalidation, snapshot-isolated rounds, and authority boundaries.

The default interface should not require the user to learn those terms before they can work.

A person should be able to start with familiar concepts:

- a direct thread;
- a group;
- a reply;
- a forward;
- unread activity;
- a browser;
- an editor;
- a terminal;
- a split.

Deeper structures should become visible when they help with inspection, steering, review, or recovery.

The interface rule is therefore simple: keep the common interaction familiar while preserving stronger semantics underneath.
