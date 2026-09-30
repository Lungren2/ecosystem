# Code OSS import tooling

This directory owns the reproducible import contract for Ecosystem's desktop baseline.

The pinned upstream values live in `upstream.env`. The desktop source itself belongs at `apps/desktop/` and must remain a complete Code OSS tree at the baseline commit.

Run the import from a clean Ecosystem checkout:

```bash
./tooling/desktop/import-code-oss.sh
./tooling/desktop/verify-code-oss-baseline.sh
```

The import uses `git subtree --squash`. It preserves the complete upstream tree under `apps/desktop/` without making the desktop a submodule or forcing the Code OSS toolchain into the root pnpm workspace.

The first imported commit must contain no Ecosystem product changes inside `apps/desktop/`. Product changes start in a later workstream so upstream failures and Ecosystem failures remain distinguishable.

To choose a newer baseline later, change `CODE_OSS_COMMIT` and `CODE_OSS_TREE` together in a dedicated upstream-update workstream. Do not repoint the baseline during unrelated feature work.
