# gratheon / web-app

Web app for beehive management and analytics

## Features

- manage beehives
- manage of apiaries (groups of beehives)
  - display weather apiary is at
  - display local plants apiary is near to
- manage beehive boxes (for vertical types)
- manage box frames
- manage frame sides, including image upload
  - frame side image processing to detect resource distribution
  - resource distribution visualization
- video stream beehive entrance
- analyze collected metrics in grafana and time-series DB

See all features [in Notion](https://gratheon.notion.site/App-platform-2937ed264e1d434a8664caa4bc40978e)

## Development

Running web-app as a frontend in development mode is easy.
To run, you need [nvm](https://github.com/nvm-sh/nvm) and [just](https://github.com/casey/just):

```bash
just start
open http://localhost:8080/
```

By default, web-app will attempt to contact production backend.
So login with your credentials from https://app.gratheon.com/, assuming you have registered.
In this mode you will not be able to change graphql schema as flexibly.

### Developing with local backend

- Change src/components/uri.ts and set `USE_PROD_BACKEND_FOR_DEV` to false

- Spin up the backend. locally, you can use `make dev` in the root of the projects. Follow https://gratheon.notion.site/Onboarding-91481a8152cf4d1685770ec2a7cc7c94 for more details

- You will need to change configuration (in `config` folder) in all of the microservices (see the architecture)

### URLs

| env   | url                       |
| ----- | ------------------------- |
| local | http://localhost:8080/    |
| live  | https://app.gratheon.com/ |

![detection](https://github.com/Gratheon/web-app/assets/445122/ae038ae3-e7db-40f1-8a33-047a9312993d)

## Architecture

### Core services and routing

```mermaid
flowchart LR
	web-app --"read/write data \n on client side via dexie"--> indexed-db[(indexed-db)]
	web-app("<a href='https://github.com/Gratheon/web-app'>web-app</a>\n:8080") --> graphql-router
	web-app --"subscribe to events\n over websockets"--> event-stream-filter("<a href='https://github.com/Gratheon/event-stream-filter'>event-stream-filter</a>\n:8300\n:8350") --"listen to events"--> redis

	some-product-service --"publish events"--> redis
	graphql-router --"read service schemas"--> graphql-schema-registry("<a href='https://github.com/tot-ra/graphql-schema-registry'>graphql-schema-registry</a>\n<a href='http://localhost:6001/'>:6001</a>\n")
	graphql-router -.-> some-product-service --"read/write data"--> mysql
	some-product-service --"update schema"--> graphql-schema-registry
```

### Product services & image processing

```mermaid
flowchart LR
	graphql-router("<a href='https://github.com/Gratheon/graphql-router'>graphql-router</a>\n :6100") --> swarm-api("<a href='https://github.com/Gratheon/swarm-api'>swarm-api</a>\n:8100") --> mysql[(mysql\n:5100)]
	graphql-router --> swarm-api --> redis[("<a href='https://github.com/Gratheon/redis'>redis pub-sub</a>\n:6379")]

	graphql-router --> image-splitter("<a href='https://github.com/Gratheon/image-splitter'>image-splitter</a>\n:8800") --> mysql

	web-app --"upload frames"--> image-splitter --> aws-s3
	image-splitter --"inference"--> models-bee-detector("<a href='https://github.com/Gratheon/models-bee-detector'>models-bee-detector</a>\n:8700")
	image-splitter --"inference"--> models-frame-resources("<a href='https://github.com/Gratheon/models-frame-resources'>models-frame-resources</a>\n:8540")
	graphql-router --> user-cycle("<a href='https://github.com/Gratheon/user-cycle'>user-cycle</a>\n:4000") --> mysql
	graphql-router --> user-cycle --> stripe
	graphql-router --> plantnet("<a href='https://github.com/Gratheon/plantnet'>plantnet</a>\n:8090") --> mysql

	graphql-router --> weather("<a href='https://github.com/Gratheon/weather'>weather</a>\n:8070")

```

### Video processing, playback and analytics

```mermaid
flowchart LR
	web-app("<a href='https://github.com/Gratheon/web-app'>web-app</a>\n:8080") --"fetch video streams"--> graphql-router("<a href='https://github.com/Gratheon/graphql-router'>graphql-router</a>") --"list video stream URLs"--> gate-video-stream -- "get data for playback" --> mysql

	web-app --"record & upload \n 10s webcam video"--> gate-video-stream("<a href='https://github.com/Gratheon/gate-video-stream'>gate-video-stream</a>\n:8900") --"inference video"--> models-gate-tracker("<a href='https://github.com/Gratheon/models-gate-tracker'>models-gate-tracker</a>")

	gate-video-stream --"store video re-training with 1 month TTL"--> aws-s3
	gate-video-stream --"store results long-term" --> mysql

	beehive-entrance-video-processor("<a href='https://github.com/Gratheon/beehive-entrance-video-processor'>beehive-entrance-video-processor</a>") --"record & upload 10s video chunks\nsend edge-computed telemetry"--> gate-video-stream

	beehive-entrance-video-processor -."send detected bees \n timeseries counts".-> telemetry-api("<a href='https://github.com/Gratheon/telemetry-api'>telemetry-api</a>")


	beehive-entrance-video-processor -."run inference on edge".-> models-bee-detector


	web-app --"include analytics page"--> grafana("<a href='https://github.com/Gratheon/grafana'>grafana</a>\n:9000") --"read bee traffic over time"--> influxdb("influxdb:5300")
```

### Tech stack

| dependency       | why                                                         |
| ---------------- | ----------------------------------------------------------- |
| typescript       | for reliability via strict types                            |
| preact (builder) | for performance                                             |
| vite             | CLI builder and hot reload                                  |
| react            | for modularity and compatibility with other UI components   |
| react-router     | for navigation                                              |
| urql             | for performant graphql data loading                         |
| dexie            | for storing data to index-db on the client for offline mode |

### Testing

We don't have any tests atm :(

#### UI tests

We use playwright. Tests are not automated, meaning not running in CI, but you can run them locally.

```
just test-ui-headless
```

To create new test use:

```
test-ui-create
```

### Frontend storage

We use dexie to store data on the client side. This is useful for offline mode, caching and fine-grained control over data.

```mermaid
flowchart TD

react-component --query--> urql-client --cache results--> offlineIndexDbExchange --> writeHooks --> upsertEntity --> dexie --> indexed-db

react-component --"fetch cached data"--> liveQuery --> dexie --> indexed-db

urql-client -."fetch data".-> graphql-router

```
