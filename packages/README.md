# Shared packages

This directory is only for libraries consumed across top-level owners.

Do not create a package here because code feels reusable or because a new TypeScript file needs a home. Keep code with its owner until two or more owners depend on the same named contract or another explicit package criterion in `AGENTS.md` is met.

Do not create generic `shared`, `common`, `core`, `utils`, or `helpers` packages.
