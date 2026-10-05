#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel)"
source "$script_dir/upstream.env"

reference_root="$repo_root/$ACF_REFERENCE_PATH"
skills_source="$reference_root/.codex/skills"
skills_target="$repo_root/.codex/skills"
selection="$script_dir/selected-skills.txt"

if [[ ! -d "$reference_root/.git" ]]; then
  "$script_dir/fetch-acf-reference.sh"
fi

"$script_dir/verify-acf-reference.sh"
mkdir -p "$skills_target"

while IFS= read -r skill || [[ -n "$skill" ]]; do
  skill="${skill%$'\r'}"
  [[ -z "$skill" ]] && continue

  source_dir="$skills_source/$skill"
  target_dir="$skills_target/$skill"

  if [[ ! -d "$source_dir" ]]; then
    echo "Selected ACF skill does not exist: $skill" >&2
    exit 1
  fi

  if [[ -e "$target_dir" ]]; then
    if diff -qr "$source_dir" "$target_dir" >/dev/null; then
      echo "Already installed: $skill"
      continue
    fi

    echo "Refusing to overwrite modified skill: $target_dir" >&2
    exit 1
  fi

  cp -a "$source_dir" "$target_dir"
  echo "Installed: $skill"
done < "$selection"

license_target="$skills_target/ACF_LICENSE.txt"
if [[ -e "$license_target" ]] && ! cmp -s "$reference_root/LICENSE" "$license_target"; then
  echo "Refusing to overwrite modified ACF license notice." >&2
  exit 1
fi
cp "$reference_root/LICENSE" "$license_target"

# Preserve upstream checkout bytes even when this repository uses core.autocrlf.
attributes_target="$skills_target/.gitattributes"
if [[ -e "$attributes_target" ]] && ! cmp -s "$reference_root/.gitattributes" "$attributes_target"; then
  echo "Refusing to overwrite modified ACF checkout attributes." >&2
  exit 1
fi
cp "$reference_root/.gitattributes" "$attributes_target"

provenance_target="$skills_target/ACF_PROVENANCE.md"
provenance_tmp="$(mktemp)"
trap 'rm -f "$provenance_tmp"' EXIT

cat > "$provenance_tmp" <<EOF
# ACF skill provenance

These skill directories were adopted from Agent Context Framework as a pinned baseline.

- repository: $ACF_REPOSITORY
- commit: $ACF_COMMIT
- tree: $ACF_TREE
- selection: practice/reference/acf/selected-skills.txt

Practice keeps the skills and their supporting files. The rest of ACF remains historical reference material unless a later decision adopts something explicitly.
EOF

if [[ -e "$provenance_target" ]] && ! cmp -s "$provenance_tmp" "$provenance_target"; then
  echo "Refusing to overwrite modified ACF provenance notice." >&2
  exit 1
fi
cp "$provenance_tmp" "$provenance_target"

echo "Installed selected ACF skills into .codex/skills."
