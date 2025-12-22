#!/usr/bin/env sh

# Load nvm to make pnpm available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

pnpm install
mkdir -p ./node_modules/.tmp
TMPDIR=./node_modules/.tmp pnpm build
pnpm build-clean
pnpm build-move

# includes robots.txt for bots
# includes .well-known for google play app
cp -r static/ public/
