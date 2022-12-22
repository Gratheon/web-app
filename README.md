# gratheon / web-app
Single page app for beehive management

![Screenshot_20221215_145008](https://user-images.githubusercontent.com/445122/208070865-e9c486bb-84ed-4205-a269-70693016d808.png)

## Architecture

```mermaid
flowchart LR
    web-app --> graphql-router
    web-app --"subscribe to events"--> event-stream-filter("<a href='https://github.com/Gratheon/event-stream-filter'>event-stream-filter</a>") --> redis
    
    graphql-router --> swarm-api("<a href='https://github.com/Gratheon/swarm-api'>swarm-api</a>") --> mysql[(mysql)]
    graphql-router --> swarm-api --> redis[("<a href='https://github.com/Gratheon/redis'>redis pub-sub</a>")]
    
    graphql-router --> image-splitter --> mysql
    graphql-router --> image-splitter --> aws-s3
    graphql-router --> user-cycle("<a href='https://github.com/Gratheon/user-cycle'>user-cycle</a>") --> mysql
    graphql-router --> user-cycle --> stripe
    graphql-router --> plantnet("<a href='https://github.com/Gratheon/plantnet'>plantnet</a>") --> mysql
    graphql-router --> graphql-schema-registry
    graphql-router --> weather("<a href='https://github.com/Gratheon/weather'>weather</a>")
```

## URLs

|env|url|
|--|--|
|local|http://0.0.0.0:8080/|
|live|https://app.gratheon.com/|


### Tech stack
- preact (builder)
- react
- react-router
- apollo client

## Development
```
npm run develop
```
