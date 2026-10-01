#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel)"
source "$script_dir/upstream.env"

reference_root="$repo_root/$ACF_REFERENCE_PATH"
skills_source="$reference_root/.codex/skills"
skills_target="$repo_root/.codex/skills"
selection="$script_dir/selected-skills.txt"

"$script_dir/verify-acf-reference.sh"

while IFS= read -r skill || [[ -n "$skill" ]]; do
  [[ -z "$skill" ]] && continue

  source_dir="$skills_source/$skill"
  target_dir="$skills_target/$skill"

  if [[ ! -d "$target_dir" ]]; then
    echo "Missing selected skill: $skill" >&2
    exit 1
  fi

  if ! diff -qr "$source_dir" "$target_dir" >/dev/null; then
    echo "Selected skill differs from the pinned ACF baseline: $skill" >&2
    exit 1
  fi
done < "$selection"

if ! cmp -s "$reference_root/LICENSE" "$skills_target/ACF_LICENSE.txt"; then
  echo "ACF license notice is missing or differs from the pinned source." >&2
  exit 1
fi

if [[ ! -f "$skills_target/ACF_PROVENANCE.md" ]]; then
  echo "Missing .codex/skills/ACF_PROVENANCE.md." >&2
  exit 1
fi

echo "Selected ACF skill baseline is complete and matches $ACF_COMMIT."
