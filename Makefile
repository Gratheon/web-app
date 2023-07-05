start:
	npm i
	COMPOSE_PROJECT_NAME=gratheon docker compose -f docker-compose.dev.yml up -d
stop:
	COMPOSE_PROJECT_NAME=gratheon docker compose -f docker-compose.dev.yml down
run:
	npm run develop

deploy-clean:
	ssh root@gratheon.com 'rm -rf /www/app.gratheon.com/public/*'

deploy-copy:
	rsync -av -e ssh ./build/ root@gratheon.com:/www/app.gratheon.com/public/

deploy:
	rm -rf public/*
	npm run build
	make deploy-clean
	make deploy-copy