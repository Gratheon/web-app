start:
  source $HOME/.nvm/nvm.sh && nvm use && npm i && npm run dev

stop:
	COMPOSE_PROJECT_NAME=gratheon docker compose -f docker-compose.dev.yml down

test:
	npm run test:unit

test-ui:
	npx playwright test --ui

test-ui-headless:
	npx playwright test

test-ui-create:
	npx playwright codegen

test-ui-report:
	npx playwright show-report

update-db-version:
	./scripts/check-and-update-db-version.sh

# Build the Tauri desktop application
dev-desktop-app:
	npm run tauri dev

build-desktop-app:
	npm run tauri build
