export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use
export PNPM_HOME="$HOME/.local/share/pnpm"
curl -fsSL https://get.pnpm.io/install.sh | sh -