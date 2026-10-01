#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel)"
source "$script_dir/upstream.env"

target="$repo_root/$ACF_REFERENCE_PATH"

if [[ ! -d "$target/.git" ]]; then
  mkdir -p "$(dirname "$target")"
  git clone --filter=blob:none --no-checkout "$ACF_REPOSITORY" "$target"
fi

origin_url="$(git -C "$target" remote get-url origin)"
if [[ "$origin_url" != "$ACF_REPOSITORY" ]]; then
  echo "Reference clone origin is $origin_url, expected $ACF_REPOSITORY." >&2
  exit 1
fi

if [[ -n "$(git -C "$target" status --porcelain)" ]]; then
  echo "Reference clone has local changes. Refusing to move it." >&2
  exit 1
fi

git -C "$target" fetch --filter=blob:none --no-tags origin "$ACF_COMMIT"
git -C "$target" checkout --detach "$ACF_COMMIT"

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

echo "Materialized ACF reference at $ACF_REFERENCE_PATH."
echo "commit: $ACF_COMMIT"
