export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use
curl -fsSL https://get.pnpm.io/install.sh | sh -
/home/www/.local/share/pnpm/pnpm install
/home/www/.local/share/pnpm/pnpm build
/home/www/.local/share/pnpm/pnpm build-clean
/home/www/.local/share/pnpm/pnpm build-move

# includes robots.txt for bots
# includes .well-known for google play app
cp -r src/assets public/