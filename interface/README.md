# Interface

Interface owns Ecosystem's source-owned UI system.

The current implementation source still lives in the historical `frontend-lib` repository. Its existing editor, CLI, engine, registry, tests, and vendored tweakcn reference are proven boundaries and should remain intact during initial migration.

Expected migration shape:

```text
interface/
├─ apps/
│  └─ editor/
├─ packages/
│  ├─ cli/
│  └─ engine/
├─ registry/
├─ tests/
└─ vendor/
   └─ tweakcn/
```

The current product contract lives in `docs/interface/README.md`.
