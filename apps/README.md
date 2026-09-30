# Applications

Application code lives under this owner.

The desktop application is reserved at `apps/desktop/` for the complete Code OSS / VS Code baseline.

The initial upstream commit and tree are pinned in `tooling/desktop/upstream.env`. Import the full tree with `tooling/desktop/import-code-oss.sh`; do not populate the directory piecemeal.

Desktop architecture belongs in `docs/ecosystem/desktop.md`.

Do not create another application under `apps/` without first updating the root ownership map in `AGENTS.md`.
