# ACF reference

Agent Context Framework is historical source material for Practice. It is not a dependency, a subtree to migrate wholesale, or the architecture of the new product.

The pinned reference is:

- repository: `https://github.com/Lungren2/agent-context-framework.git`
- commit: `cd0516aa39472f64a460028a05449ae4e71fe244`
- tree: `bdea1d3608e305f6f22513971e5ab7d44e4e17bc`
- license: MIT

Materialize the reference outside the tracked source tree:

```bash
./practice/reference/acf/fetch-acf-reference.sh
./practice/reference/acf/verify-acf-reference.sh
```

The clone lives at `.references/agent-context-framework` and is gitignored.

## What Practice keeps

Practice carries forward selected ACF skills and the files those skills own. It does not carry forward the ACF instruction registry, governance system, repository-policy framework, objective runtime, or workflow runtime.

The selected skill names live in `selected-skills.txt`. The current selection is:

```text
adopt-established-product
choose-react-animation
codebase-inventory
design-accessible-interfaces
design-color-systems
design-interface-details
design-operational-boundaries
design-typescript-invariants
design-web-typography
diagnose
frontend-design-discipline
optimize-codex-sessions
reduce-reader-load
responsive-css-architect
reuse-before-implementation
separate-shared-state
tailwind-css-architect
writing-great-skills
```

`tailwind-css-architect` remains part of the catalog. Its cached Tailwind documentation and other supporting files belong to the skill baseline and should remain intact when the skill is installed.

Three ACF skills are intentionally not selected:

- `maintain-agent-context-framework` exists to maintain the old ACF system;
- `orchestrate-codex-workflows` belongs to the custom workflow direction Practice is moving away from;
- `write-technical-prose` depends on the old repository-policy tooling that Practice is not adopting.

## Install the selected skills

After materializing the reference, install the selected baseline into the repository's Codex skill directory:

```bash
./practice/reference/acf/install-selected-skills.sh
./practice/reference/acf/verify-selected-skills-baseline.sh
```

The installer copies complete skill directories into `.codex/skills/`. This includes references, scripts, fixtures, source metadata, cached documentation, and upstream license files owned by a selected skill.

The installer also writes `.codex/skills/ACF_LICENSE.txt` and `.codex/skills/ACF_PROVENANCE.md`.

It copies the upstream Git checkout attributes into `.codex/skills/.gitattributes` so the skill files retain their pinned line endings on Windows as well.

The selected baseline is tracked in this repository, including its supporting files and notices. Run the verifier before committing an initial installation to confirm that the adopted files match the pinned source.

It refuses to overwrite a selected skill that has diverged from the pinned baseline. Later edits to adopted skills are normal Practice work and should no longer be checked with the baseline verifier.

The installer accepts LF or CRLF selection files. Its local-fixture regression test covers a fresh clone, repeated installation, baseline verification, and refusal to overwrite skill or reference edits:

```bash
node --test practice/reference/acf/test/baseline.test.mjs
```

This test uses Bash and Git. On Windows it uses the Bash bundled with Git for Windows.

## What remains historical

Everything outside the selected skill directories remains reference material by default.

In particular, do not migrate:

- `registry/`;
- `packages/objective-kernel/`;
- `packages/objective-test-fixtures/`;
- `packages/codex-workflow-runtime/`;
- `tools/objective-runtime/`;
- `tools/codex-workflows/`;
- `tools/repo-policy/`.

A later requirement can still justify adopting a specific file or idea. That requires its own decision rather than treating the rest of ACF as latent Practice code.
