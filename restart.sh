export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm install
pnpm build
pnpm build-clean
pnpm build-move

# copy file for google play app
cp -r .well-known public/
cp src/robots.txt public/
cp -r src/assets public/