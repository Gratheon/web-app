export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use
npm install
npm run build
npm run build-clean
npm run build-move

# copy file for google play app
cp -r .well-known public/
cp src/robots.txt public/
cp -r src/assets public/