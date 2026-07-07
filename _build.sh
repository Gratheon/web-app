#!/usr/bin/env sh

set -eu

# Load nvm to make pnpm available when the script is run directly.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

if command -v nvm >/dev/null 2>&1; then
  if ! nvm use; then
    # Self-hosted deploy runners may not have the version from .nvmrc yet.
    nvm install
    nvm use
  fi
fi

# pnpm may need to replace node_modules after Node upgrades. CI=true prevents
# non-interactive self-hosted deploys from aborting on the no-TTY prompt.
export CI=true

rm -rf dist
pnpm install
mkdir -p ./node_modules/.tmp
TMPDIR=./node_modules/.tmp pnpm build

test -f dist/index.html
test -f dist/sw.js

# Include robots.txt for bots and .well-known for Google Play app before the
# atomic public swap, so a failed copy never removes the currently served app.
cp -r static/. dist/

rm -rf public.previous
if [ -d public ]; then
  mv public public.previous
fi
mv dist public
rm -rf public.previous

test -f public/index.html
test -f public/sw.js
