#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v codex >/dev/null 2>&1; then
  echo "codex introuvable dans le PATH." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq est requis." >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Ce script doit etre lance dans un depot git." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  :
else
  echo "Aucune modification detectee." >&2
  exit 1
fi

SCHEMA_FILE="$(mktemp)"
OUTPUT_FILE="$(mktemp)"
trap 'rm -f "$SCHEMA_FILE" "$OUTPUT_FILE"' EXIT

cat > "$SCHEMA_FILE" <<'EOF'
{
  "type": "object",
  "additionalProperties": false,
  "required": ["bump", "message"],
  "properties": {
    "bump": {
      "type": "string",
      "enum": ["patch", "minor", "major"]
    },
    "message": {
      "type": "string",
      "minLength": 1
    }
  }
}
EOF

PROMPT="$(cat <<'EOF'
Analyse le depot git courant et determine:
- le niveau de version semver a appliquer dans package.json parmi patch, minor, major
- un message de commit git court, clair, en francais

Regles:
- major si breaking change observable
- minor si ajout de fonctionnalite utilisateur ou nouvelle capacite notable
- patch pour correctif, refactor, test, docs, chore ou petit ajustement
- reponds uniquement avec l'objet JSON conforme au schema
- le message doit etre en une seule ligne, sans backticks, sans prefixe de type obligatoire
EOF
)"

codex exec \
  --full-auto \
  --skip-git-repo-check \
  --output-schema "$SCHEMA_FILE" \
  --output-last-message "$OUTPUT_FILE" \
  --color never \
  -C "$ROOT_DIR" \
  "$PROMPT" >/dev/null

DECISION_JSON="$(cat "$OUTPUT_FILE")"
BUMP_TYPE="$(printf '%s' "$DECISION_JSON" | jq -r '.bump')"
COMMIT_MESSAGE="$(printf '%s' "$DECISION_JSON" | jq -r '.message')"

if [[ -z "$BUMP_TYPE" || "$BUMP_TYPE" == "null" ]]; then
  echo "Codex n'a pas retourne de bump valide." >&2
  exit 1
fi

if [[ -z "$COMMIT_MESSAGE" || "$COMMIT_MESSAGE" == "null" ]]; then
  echo "Codex n'a pas retourne de message de commit valide." >&2
  exit 1
fi

echo "Bump decide par Codex: $BUMP_TYPE"
echo "Message decide par Codex: $COMMIT_MESSAGE"

npm version "$BUMP_TYPE" --no-git-tag-version
git add -A
git commit -m "$COMMIT_MESSAGE"

echo "Commit cree avec succes."

