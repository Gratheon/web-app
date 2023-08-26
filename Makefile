start:
	npm i
	COMPOSE_PROJECT_NAME=gratheon docker compose -f docker-compose.dev.yml up -d
stop:
	COMPOSE_PROJECT_NAME=gratheon docker compose -f docker-compose.dev.yml down
run:
	npm run develop


deploy-run:
	ssh root@gratheon.com 'chmod +x /www/web-app/restart.sh && bash /www/web-app/restart.sh'
	ssh root@gratheon.com 'bash /www/web-app/restart.sh'

deploy-copy:
	scp -r Dockerfile .version docker-compose.yml restart.sh root@gratheon.com:/www/web-app/
	rsync -av -e ssh --exclude='node_modules' --exclude='.git'  --exclude='public' ./ root@gratheon.com:/www/web-app/

deploy:
	deploy-copy
	deploy-run