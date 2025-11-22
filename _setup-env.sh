export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

export TMPDIR="$HOME/tmp"
mkdir -p "$TMPDIR"

nvm use
export PNPM_HOME="$HOME/.local/share/pnpm"

if ! command -v pnpm &> /dev/null; then
  curl -fsSL https://get.pnpm.io/install.sh | sh -
fi
