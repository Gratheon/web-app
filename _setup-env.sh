export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

export TMPDIR="$HOME/tmp"
mkdir -p "$TMPDIR"

if command -v nvm >/dev/null 2>&1; then
  if ! nvm use; then
    # Self-hosted deploy runners may not have the version from .nvmrc yet.
    # Install it here so Deploy does not fail before the build starts.
    nvm install
    nvm use
  fi
fi

export PNPM_HOME="$HOME/.local/share/pnpm"

if ! command -v pnpm >/dev/null 2>&1; then
  curl -fsSL https://get.pnpm.io/install.sh | sh -
fi

case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
