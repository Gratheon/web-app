#!/usr/bin/env sh

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use the node version from .nvmrc if it exists
[ -f .nvmrc ] && nvm use

echo "Running full pre-push checks..."
echo ""

# 1. Check DB version
echo "1/3 Checking DB version..."
./scripts/check-and-update-db-version.sh || exit 1
echo "✓ DB version check passed"
echo ""

# 2. Build
echo "2/3 Building..."
npm run build || exit 1
echo "✓ Build passed"
echo ""

# 3. Run tests
echo "3/3 Running tests..."
npm run test:unit || exit 1
echo "✓ Tests passed"
echo ""

echo "✅ All checks passed! Safe to push."
exit 0

