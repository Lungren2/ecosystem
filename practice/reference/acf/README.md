# ACF reference

Agent Context Framework is historical source material for Practice. It is not a dependency, a subtree to migrate wholesale, or the architecture of the new product.

The pinned reference is:

- repository: `https://github.com/Lungren2/agent-context-framework.git`
- commit: `cd0516aa39472f64a460028a05449ae4e71fe244`
- tree: `bdea1d3608e305f6f22513971e5ab7d44e4e17bc`
- license: MIT

Materialize it outside the tracked source tree:

```bash
./practice/reference/acf/fetch-acf-reference.sh
./practice/reference/acf/verify-acf-reference.sh
```

The clone lives at `.references/agent-context-framework` and is gitignored.

## What to inspect first

The old repository contains useful behavior that can inform Practice without bringing its runtime with it.

Start with:

- `registry/sources/instructions/` for baseline, repository, verification, frontend, documentation, and writing policy;
- `.codex/skills/diagnose/`;
- `.codex/skills/reuse-before-implementation/`;
- `.codex/skills/design-typescript-invariants/`;
- `.codex/skills/design-operational-boundaries/`;
- `.codex/skills/separate-shared-state/`;
- `.codex/skills/frontend-design-discipline/`;
- `tools/repo-policy/` when a prose rule needs an executable check.

Treat each adoption as a new Practice decision. Record the source path and pinned commit. Rewrite or narrow material when the current Practice contract differs from ACF.

## What not to migrate by default

Do not copy these areas into Practice simply because they exist:

- `packages/objective-kernel/`;
- `packages/objective-test-fixtures/`;
- `packages/codex-workflow-runtime/`;
- `tools/objective-runtime/`;
- `tools/codex-workflows/`.

Those belong to the old execution and orchestration direction. Reuse from them requires a current requirement and a separate decision.

The same rule applies to any other ACF source. Provenance makes material inspectable. It does not make it approved for adoption.
