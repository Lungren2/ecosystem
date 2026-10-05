#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel)"
source "$script_dir/upstream.env"

target="$repo_root/$ACF_REFERENCE_PATH"

if [[ ! -d "$target/.git" ]]; then
  echo "ACF reference is not materialized. Run fetch-acf-reference.sh first." >&2
  exit 1
fi

actual_commit="$(git -C "$target" rev-parse HEAD)"
actual_tree="$(git -C "$target" rev-parse HEAD^{tree})"

if [[ "$actual_commit" != "$ACF_COMMIT" ]]; then
  echo "Reference commit is $actual_commit, expected $ACF_COMMIT." >&2
  exit 1
fi

if [[ "$actual_tree" != "$ACF_TREE" ]]; then
  echo "Reference tree is $actual_tree, expected $ACF_TREE." >&2
  exit 1
fi

for required in   AGENTS.md   LICENSE   registry/sources/instructions   .codex/skills; do
  if [[ ! -e "$target/$required" ]]; then
    echo "Missing expected ACF reference path: $required" >&2
    exit 1
  fi
done

echo "ACF reference matches $ACF_COMMIT ($ACF_TREE)."
