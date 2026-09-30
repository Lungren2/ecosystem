#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel)"
source "$script_dir/upstream.env"

cd "$repo_root"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to import Code OSS with a dirty working tree." >&2
  exit 1
fi

if git cat-file -e "HEAD:$CODE_OSS_PREFIX" 2>/dev/null; then
  echo "$CODE_OSS_PREFIX already exists in HEAD." >&2
  exit 1
fi

remote_name="ecosystem-code-oss"
remove_remote=0

if git remote get-url "$remote_name" >/dev/null 2>&1; then
  existing_url="$(git remote get-url "$remote_name")"
  if [[ "$existing_url" != "$CODE_OSS_REPOSITORY" ]]; then
    echo "Remote $remote_name already points to $existing_url." >&2
    exit 1
  fi
else
  git remote add "$remote_name" "$CODE_OSS_REPOSITORY"
  remove_remote=1
fi

cleanup() {
  if [[ "$remove_remote" == "1" ]]; then
    git remote remove "$remote_name"
  fi
}
trap cleanup EXIT

git fetch --no-tags "$remote_name" "$CODE_OSS_COMMIT"

resolved_commit="$(git rev-parse "FETCH_HEAD^{commit}")"
if [[ "$resolved_commit" != "$CODE_OSS_COMMIT" ]]; then
  echo "Fetched $resolved_commit, expected $CODE_OSS_COMMIT." >&2
  exit 1
fi

git subtree add   --prefix="$CODE_OSS_PREFIX"   "$remote_name"   "$CODE_OSS_COMMIT"   --squash

actual_tree="$(git rev-parse "HEAD:$CODE_OSS_PREFIX")"
if [[ "$actual_tree" != "$CODE_OSS_TREE" ]]; then
  echo "Imported tree $actual_tree, expected $CODE_OSS_TREE." >&2
  exit 1
fi

echo "Imported Code OSS $CODE_OSS_COMMIT into $CODE_OSS_PREFIX."
