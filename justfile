start:
  . $HOME/.nvm/nvm.sh && nvm use && pnpm i && pnpm dev

stop:
	COMPOSE_PROJECT_NAME=gratheon docker compose -f docker-compose.dev.yml down

build:
	. $HOME/.nvm/nvm.sh && ./_build.sh

test:
	. $HOME/.nvm/nvm.sh && pnpm test:unit

test-ui:
	. $HOME/.nvm/nvm.sh && npx playwright test --ui

test-ui-headless:
	. $HOME/.nvm/nvm.sh && npx playwright test

test-ui-create:
	. $HOME/.nvm/nvm.sh && npx playwright codegen

test-ui-report:
	. $HOME/.nvm/nvm.sh && npx playwright show-report

update-db-version:
	./scripts/check-and-update-db-version.sh

# Run full checks before pushing (build + tests)
pre-push:
	./scripts/pre-push-check.sh

# Build the Tauri desktop application
dev-desktop-app:
	. $HOME/.nvm/nvm.sh && pnpm tauri dev

build-desktop-app:
	. $HOME/.nvm/nvm.sh && pnpm tauri build
