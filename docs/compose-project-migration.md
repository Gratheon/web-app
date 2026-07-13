# Compose project migration

## Problem

Several production `restart.sh` scripts used `COMPOSE_PROJECT_NAME=gratheon`. That shared project name caused deploys to interfere with unrelated services:

- `entrance-observer` ran `docker compose down --remove-orphans` under the shared project and could delete other production containers.
- `gate-video-stream` mixed legacy `gratheon` and new project names, leaving stale host-network containers on ports `8900` and `8950`.
- A single service restart could remove `telemetry-api`, `gate-video-stream`, or `plantnet` from production.

## Target state

Each production service uses a stable, unique Compose project name equal to the service repository name:

| Service | Compose project | Primary port |
| --- | --- | --- |
| telemetry-api | `telemetry-api` | 8600 |
| gate-video-stream | `gate-video-stream` | 8900 / 8950 |
| plantnet | `plantnet` | 8090 |
| swarm-api | `swarm-api` | 8100 |
| graphql-router | `graphql-router` | 4000 |
| user-cycle | `user-cycle` | 8010 |
| weather | `weather` | 8070 |
| alerts | `alerts` | 8120 |
| image-splitter | `image-splitter` | 8200 |
| event-stream-filter | `event-stream-filter` | 8300 |
| models-varroa-on-bee | `models-varroa-on-bee` | 8400 |
| models-queen-bee-detector | `models-queen-bee-detector` | 8500 |
| entrance-observer | `entrance-observer` | 3030 |
| clickstack | `clickstack` | n/a |

Local `justfile` / dev compose files may still use `COMPOSE_PROJECT_NAME=gratheon` for developer convenience. Production `restart.sh` scripts must not.

## Safe migration pattern

Every updated `restart.sh` follows the same sequence:

1. Remove only the legacy container for this service from project `gratheon` using Docker labels:
   - `com.docker.compose.project=gratheon`
   - `com.docker.compose.service=<service-name>`
2. Run `docker-compose down` only for the service-specific project name.
3. Build and `docker-compose up` with the isolated project name.
4. Run `scripts/verify-production-deployment.sh` from CI to confirm:
   - container labels (`com.docker.compose.project`, `com.docker.compose.project.working_dir`)
   - listening ports / health endpoints
   - schema registry registration where applicable
   - public origin routes where applicable (`video.gratheon.com` for gate-video-stream)

This never calls `docker compose down --remove-orphans` with the shared `gratheon` project.

## Rollout order

1. `telemetry-api` - completed
2. `gate-video-stream` and `plantnet` - restore missing services first
3. Remaining shared-project services (`swarm-api`, `graphql-router`, `user-cycle`, `weather`, `alerts`, `image-splitter`, `event-stream-filter`, model services, `entrance-observer`)
4. Production verification after each deploy

## Production verification checklist

After each service deploy:

```sh
docker inspect <project>_<service>_1 --format '{{ index .Config.Labels "com.docker.compose.project" }}'
docker inspect <project>_<service>_1 --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}'
./scripts/verify-production-deployment.sh
```

For GraphQL subgraphs, also confirm registration at `http://127.0.0.1:3000/schema/latest`.

## Remaining work

- Add `scripts/verify-production-deployment.sh` to services that only received isolated `restart.sh` so far.
- Update local `justfile` targets if developers want isolated dev project names too.
- Re-deploy `gate-video-stream` and `plantnet` on production immediately after merge.
