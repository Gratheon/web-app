# gratheon / web-app

Web app for beehive management and analytics.
See [product feature and ideas](https://gratheon.com/about/products/%F0%9F%93%B1Web-app/), also see technical [architecture docs](https://gratheon.com/docs/web-app/) for the entire system

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

### Web-app tech stack

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
