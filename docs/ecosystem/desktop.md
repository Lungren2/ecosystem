# Desktop foundation

## Current direction

Ecosystem's desktop application is based on the Code OSS / VS Code workbench.

The goal is not to embed Monaco in a new shell and rebuild editor, terminal, SCM, extension, task, debug, workspace, and split-view behavior. Ecosystem should keep the standard workbench and change the parts needed for persistent project switching, groups, threads, spatial navigation, and agentic work.

The old Monaco/Tauri prototype remains useful evidence for keyboard and persistence behavior. It is not the application base.

## Upstream reference

The desktop fork comes from [microsoft/vscode](https://github.com/microsoft/vscode), which is MIT licensed.

The initial desktop baseline is pinned to VS Code commit `d6b3034499d6039992da597d2290c71aefcf8ae5` with tree `e2b1301313528bd8ceaa217abe50b20f9d35e2ef`.

That commit is the code reviewed during the 2026-09-30 architecture work, including the current workspace-transition and sessions code. Pinning the reviewed commit keeps the first fork baseline aligned with the architecture evidence we used.

One existing seam matters immediately: `NativeWorkspaceEditingService.enterWorkspace()` already performs an in-window workspace transition that stops extension hosts, switches workspace configuration and storage, reinitializes working-copy backups, runs workspace transition participants, and restarts extension hosts.

Reference: [workspaceEditingService.ts](https://github.com/microsoft/vscode/blob/d6b3034499d6039992da597d2290c71aefcf8ae5/src/vs/workbench/services/workspaces/electron-browser/workspaceEditingService.ts)

Ecosystem should strengthen that path before inventing an independent workbench lifecycle.

## ProjectSession

The project session, not a tab, owns the hydrated project runtime.

A ProjectSession has durable identity and serialized state even when it is inactive.

Conceptually:

```ts
type ProjectLifecycleState =
  | "cold"
  | "activating"
  | "active"
  | "suspending"
  | "suspended"
  | "failed";

interface ProjectSession {
  id: string;
  workspace: WorkspaceIdentifier;
  lifecycleState: ProjectLifecycleState;
  snapshot: ProjectSnapshot;
  policies: ProjectPolicies;
}
```

The exact TypeScript types are not frozen. The lifecycle distinction is.

## Ownership

The persistent shell owns:

- the Electron window and renderer;
- group and project navigation chrome;
- user profile and application-scoped settings;
- the ProjectSession registry;
- transition coordination;
- lightweight metadata and snapshots for inactive projects.

The active ProjectSession owns:

- workspace configuration and workspace storage;
- file watchers;
- extension hosts and language servers;
- SCM models and Git scans;
- terminals and tasks;
- debug sessions;
- editor working set;
- project-scoped AI state.

Inactive ProjectSessions own data, not live project-owned runtime objects.

## Lifecycle invariants

During normal operation:

```text
one active ProjectSession
inactive ProjectSessions own no project runtime processes by default
all project state is namespaced by project identity
project switches are serialized
failed activation preserves the previous recoverable snapshot
```

Lazy startup may keep every project cold until the user selects one.

A group switch is not automatically a project switch. Several groups may use the same ProjectSession, and one group may discuss work across projects.

## Switching transaction

A project transition should behave like a bounded shutdown and startup:

```text
capture outgoing state
        |
resolve or back up dirty working copies
        |
flush workspace storage
        |
stop project tasks, debug sessions, and terminal processes according to policy
        |
stop extension hosts
        |
switch workspace configuration and storage
        |
wait for workspace participants and watchers
        |
restore editor, layout, group, and chat selection state
        |
start extension hosts
        |
restore terminals according to policy
        |
mark incoming ProjectSession active
```

Keep the outgoing snapshot recoverable until the incoming project reaches a usable state.

## Reuse before replacement

Use existing VS Code lifecycle behavior where it already matches Ecosystem's needs.

Current areas worth reusing include:

- workspace-scoped storage;
- extension-host stop and start lifecycle;
- workspace watcher reconstruction;
- built-in Git extension lifecycle;
- editor working-set and layout restoration patterns;
- workspace-scoped chat storage;
- the standard editor, panel, terminal, SCM, debug, search, extension, and browser workbench capabilities.

The current `src/vs/sessions` work in upstream VS Code is useful reference material for session-oriented UI and working-set behavior. Ecosystem should keep the full standard workbench rather than base the product on a separate simplified sessions window.

## Known hard parts

Terminal suspension is policy, not a transparent freeze. Terminating and recreating a terminal can preserve descriptors and layout, but not arbitrary process memory or foreground jobs.

Extensions may spawn detached child processes. Project suspension needs explicit process ownership and leak detection rather than assuming extension-host shutdown catches every child.

Chat storage is workspace-scoped upstream, but strict ProjectSession isolation must avoid copying or leaking sessions across project transitions.

Remote authorities are a later milestone. Local-to-local switching is the first target. Cross-authority transitions such as local to WSL, one SSH host to another, or one dev container to another may require deeper workbench changes.

## Implementation order

1. Prove local ProjectSession lifecycle switching through the existing workspace transition path.
2. Restore per-project editor, layout, terminal descriptor, SCM, search, and chat selection state.
3. Add process ownership, task and debug lifecycle participants, and leak detection.
4. Load only metadata and snapshots for inactive projects on startup.
5. Address remote-authority switching after local transitions are stable.

The first lifecycle test should repeatedly switch among several local repositories and verify that memory and process counts reach a stable plateau.

## Fork policy

`apps/desktop/` should preserve the Code OSS repository structure.

When changing existing VS Code behavior, edit the upstream subsystem that owns it. When adding a new Ecosystem workbench capability with no upstream owner, use VS Code's existing layer conventions.

Do not move upstream code into a new Ecosystem-specific tree merely to make the fork look cleaner. A recognizable upstream layout makes review and future synchronization easier.

The initial import uses a squashed Git subtree under `apps/desktop/`. The import contract lives in `tooling/desktop/`.

The baseline commit must contain the complete upstream tree with no Ecosystem product edits inside `apps/desktop/`. Later desktop changes build on that known baseline. Do not copy a partial VS Code tree or replace the subtree with a submodule.
