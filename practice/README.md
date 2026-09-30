# Practice

Practice owns plugin distribution, durable teaching, scoped adaptations, semantic reconciliation, and marketplace behavior.

The historical `agent-context-framework` repository is pinned as reference material, not as a codebase to migrate wholesale. Materialize it on demand with `practice/reference/acf/fetch-acf-reference.sh`. The clone is gitignored and must never become a runtime dependency.

Adopt source selectively. Record the original ACF path and pinned commit when material becomes part of Practice. Do not copy the old orchestration runtime wholesale.

Default homes after migration:

```text
practice/
├─ plugins/
├─ src/
└─ tests/
```

The current product contract lives in `docs/practice/README.md`.
