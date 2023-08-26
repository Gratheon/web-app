FROM node:16-alpine

WORKDIR /app

COPY . /app/
RUN npm install

EXPOSE 8080

CMD ["/app/node_modules/.bin/preact", "watch"]