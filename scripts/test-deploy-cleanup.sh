#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# Optional workflow path allows regression checks against a temporary fixture.
workflow=${1:-"$script_dir/../.github/workflows/deploy.yml"}
clean_command=$(awk '
  /^[[:space:]]*git clean[[:space:]]/ {
    sub(/^[[:space:]]*/, "")
    print
    count++
  }
  END { if (count != 1) exit 1 }
' "$workflow")

tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/deploy-cleanup.XXXXXX")
trap 'rm -rf "$tmp_dir"' 0
trap 'exit 1' HUP INT TERM
cd "$tmp_dir"
git init -q
printf '%s\n' 'public/' 'public.previous/' '.env' '.env.local' 'dist/' 'node_modules/' > .gitignore
git add .gitignore
mkdir -p public/assets public.previous/assets dist node_modules nested/public nested/public.previous

preserved='public/index.html public/assets/app.js public.previous/index.html public.previous/assets/app.js .env .env.local'
stale='dist/stale.js node_modules/stale.js junk nested/public/stale.js nested/public.previous/stale.js'
for file in $preserved $stale; do
  printf '%s\n' "$file" > "$file"
done

sh -c "$clean_command"

for file in $preserved; do
  if [ ! -f "$file" ] || [ "$(cat "$file")" != "$file" ]; then
    printf 'FAIL: cleanup removed or changed %s\n' "$file" >&2
    exit 1
  fi
done
for file in dist node_modules junk nested; do
  if [ -e "$file" ]; then
    printf 'FAIL: cleanup retained stale %s\n' "$file" >&2
    exit 1
  fi
done
printf 'PASS: live assets, rollback assets and env survive; stale files are removed.\n'
