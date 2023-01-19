FROM node:16-alpine

USER nobody

# ensure all directories exist
WORKDIR /app

EXPOSE 8080