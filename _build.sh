pnpm install
pnpm build
pnpm build-clean
pnpm build-move

# includes robots.txt for bots
# includes .well-known for google play app
cp -r static/ public/