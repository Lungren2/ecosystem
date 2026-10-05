# Practice

Practice owns plugin distribution, durable teaching, scoped adaptations, semantic reconciliation, and marketplace behavior.

The historical `agent-context-framework` repository is pinned as reference material, not as a codebase to migrate wholesale. Practice currently adopts only a selected set of ACF skills and the supporting files inside those skill directories.

Materialize the reference and install the selected skill baseline with:

```bash
./practice/reference/acf/fetch-acf-reference.sh
./practice/reference/acf/install-selected-skills.sh
```

The reference clone is gitignored and must never become a runtime dependency. The installed skills live under `.codex/skills/` so Codex can use them while work on Practice continues.

The ACF instruction registry, repository-policy framework, objective runtime, and workflow runtime remain historical by default.

Default homes for new Practice implementation remain:

```text
practice/
├─ plugins/
├─ apps/
├─ tools/
├─ src/
└─ tests/
```

The first Practice-owned developer tool is `tools/chatgpt-capture/`, a Chrome DevTools extension that exports sanitized HAR metadata and DOM structure for chatgpt.com compatibility research. It is evidence tooling, not the production ChatGPT extension.

The current product contract lives in `docs/practice/README.md`.
