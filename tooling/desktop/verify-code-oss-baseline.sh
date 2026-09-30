#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel)"
source "$script_dir/upstream.env"

cd "$repo_root"

if ! git cat-file -e "HEAD:$CODE_OSS_PREFIX" 2>/dev/null; then
  echo "$CODE_OSS_PREFIX is not present in HEAD." >&2
  exit 1
fi

actual_tree="$(git rev-parse "HEAD:$CODE_OSS_PREFIX")"
if [[ "$actual_tree" != "$CODE_OSS_TREE" ]]; then
  echo "Code OSS baseline differs from the pinned upstream tree." >&2
  echo "actual:   $actual_tree" >&2
  echo "expected: $CODE_OSS_TREE" >&2
  exit 1
fi

for required in package.json .nvmrc LICENSE.txt AGENTS.md src; do
  if [[ ! -e "$CODE_OSS_PREFIX/$required" ]]; then
    echo "Missing expected Code OSS path: $CODE_OSS_PREFIX/$required" >&2
    exit 1
  fi
done

echo "Code OSS baseline matches $CODE_OSS_COMMIT ($CODE_OSS_TREE)."
